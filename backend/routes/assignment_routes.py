import datetime
from flask import Blueprint, request, jsonify, g

from db import get_cursor
from auth import authenticate, require_role, effective_base_filter
from audit import record_audit
from serializers import assignment_row_to_dict, expenditure_row_to_dict

assignments_bp = Blueprint("assignments", __name__, url_prefix="/api")

ASSIGNMENT_SELECT = """
    SELECT a.*, b.name AS base_name,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM assignments a
    JOIN bases b ON b.id = a.base_id
    JOIN equipment_types e ON e.id = a.equipment_type_id
    JOIN users u ON u.id = a.created_by
"""

EXPENDITURE_SELECT = """
    SELECT x.*, b.name AS base_name,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM expenditures x
    JOIN bases b ON b.id = x.base_id
    JOIN equipment_types e ON e.id = x.equipment_type_id
    JOIN users u ON u.id = x.created_by
"""


@assignments_bp.route("/assignments", methods=["GET"])
@authenticate
@require_role("admin", "base_commander")
def list_assignments():
    forced = effective_base_filter(g.user)
    base_id = forced or request.args.get("baseId", type=int)

    sql = ASSIGNMENT_SELECT + " WHERE 1=1"
    params = []
    if base_id:
        sql += " AND a.base_id = ?"
        params.append(base_id)
    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    if equipment_type_id:
        sql += " AND a.equipment_type_id = ?"
        params.append(equipment_type_id)
    status = request.args.get("status")
    if status:
        sql += " AND a.status = ?"
        params.append(status)
    start_date = request.args.get("startDate")
    if start_date:
        sql += " AND a.date >= ?"
        params.append(start_date)
    end_date = request.args.get("endDate")
    if end_date:
        sql += " AND a.date <= ?"
        params.append(end_date)
    sql += " ORDER BY a.date DESC"

    with get_cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    return jsonify([assignment_row_to_dict(r) for r in rows])


@assignments_bp.route("/assignments", methods=["POST"])
@authenticate
@require_role("admin", "base_commander")
def create_assignment():
    forced = effective_base_filter(g.user)
    body = request.get_json(silent=True) or {}

    base_id = forced or body.get("baseId")
    equipment_type_id = body.get("equipmentTypeId")
    personnel_name = body.get("personnelName")
    quantity = body.get("quantity")
    date = body.get("date")

    if not base_id or not equipment_type_id or not personnel_name or not quantity or not date:
        return jsonify(
            {"message": "baseId, equipmentTypeId, personnelName, quantity and date are required."}
        ), 400

    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO assignments
                (base_id, equipment_type_id, personnel_name, personnel_service_id, quantity, date, status, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?, ?)
            """,
            (
                base_id,
                equipment_type_id,
                personnel_name,
                body.get("personnelServiceId"),
                quantity,
                date,
                body.get("notes"),
                g.user["id"],
            ),
        )
        new_id = cur.lastrowid
        cur.execute(ASSIGNMENT_SELECT + " WHERE a.id = ?", (new_id,))
        row = cur.fetchone()

    assignment = assignment_row_to_dict(row)
    record_audit("CREATE_ASSIGNMENT", entity="Assignment", entity_id=new_id, details=assignment, status_code=201)

    return jsonify(assignment), 201


@assignments_bp.route("/assignments/<int:assignment_id>/return", methods=["PATCH"])
@authenticate
@require_role("admin", "base_commander")
def return_assignment(assignment_id):
    with get_cursor() as cur:
        cur.execute("SELECT * FROM assignments WHERE id = ?", (assignment_id,))
        existing = cur.fetchone()

    if not existing:
        return jsonify({"message": "Assignment not found."}), 404

    forced = effective_base_filter(g.user)
    if forced and existing["base_id"] != forced:
        return jsonify({"message": "Not authorized for this base's assignments."}), 403

    body = request.get_json(silent=True) or {}
    returned_date = body.get("returnedDate") or datetime.date.today().isoformat()

    with get_cursor(commit=True) as cur:
        cur.execute(
            "UPDATE assignments SET status = 'returned', returned_date = ? WHERE id = ?",
            (returned_date, assignment_id),
        )
        cur.execute(ASSIGNMENT_SELECT + " WHERE a.id = ?", (assignment_id,))
        row = cur.fetchone()

    assignment = assignment_row_to_dict(row)
    record_audit(
        "RETURN_ASSIGNMENT", entity="Assignment", entity_id=assignment_id,
        details={"returnedDate": returned_date}, status_code=200,
    )

    return jsonify(assignment)


@assignments_bp.route("/expenditures", methods=["GET"])
@authenticate
@require_role("admin", "base_commander")
def list_expenditures():
    forced = effective_base_filter(g.user)
    base_id = forced or request.args.get("baseId", type=int)

    sql = EXPENDITURE_SELECT + " WHERE 1=1"
    params = []
    if base_id:
        sql += " AND x.base_id = ?"
        params.append(base_id)
    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    if equipment_type_id:
        sql += " AND x.equipment_type_id = ?"
        params.append(equipment_type_id)
    start_date = request.args.get("startDate")
    if start_date:
        sql += " AND x.date >= ?"
        params.append(start_date)
    end_date = request.args.get("endDate")
    if end_date:
        sql += " AND x.date <= ?"
        params.append(end_date)
    sql += " ORDER BY x.date DESC"

    with get_cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    return jsonify([expenditure_row_to_dict(r) for r in rows])


@assignments_bp.route("/expenditures", methods=["POST"])
@authenticate
@require_role("admin", "base_commander")
def create_expenditure():
    forced = effective_base_filter(g.user)
    body = request.get_json(silent=True) or {}

    base_id = forced or body.get("baseId")
    equipment_type_id = body.get("equipmentTypeId")
    quantity = body.get("quantity")
    date = body.get("date")

    if not base_id or not equipment_type_id or not quantity or not date:
        return jsonify({"message": "baseId, equipmentTypeId, quantity and date are required."}), 400

    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO expenditures (base_id, equipment_type_id, quantity, date, reason, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (base_id, equipment_type_id, quantity, date, body.get("reason"), g.user["id"]),
        )
        new_id = cur.lastrowid
        cur.execute(EXPENDITURE_SELECT + " WHERE x.id = ?", (new_id,))
        row = cur.fetchone()

    expenditure = expenditure_row_to_dict(row)
    record_audit("CREATE_EXPENDITURE", entity="Expenditure", entity_id=new_id, details=expenditure, status_code=201)

    return jsonify(expenditure), 201
