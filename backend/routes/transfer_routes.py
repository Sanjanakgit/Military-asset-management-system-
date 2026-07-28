from flask import Blueprint, request, jsonify, g

from db import get_cursor
from auth import authenticate, require_role
from audit import record_audit
from serializers import transfer_row_to_dict

transfers_bp = Blueprint("transfers", __name__, url_prefix="/api/transfers")

SELECT_WITH_JOINS = """
    SELECT t.*, fb.name AS from_base_name, tb.name AS to_base_name,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM transfers t
    JOIN bases fb ON fb.id = t.from_base_id
    JOIN bases tb ON tb.id = t.to_base_id
    JOIN equipment_types e ON e.id = t.equipment_type_id
    JOIN users u ON u.id = t.created_by
"""


@transfers_bp.route("", methods=["GET"])
@authenticate
def list_transfers():
    sql = SELECT_WITH_JOINS + " WHERE 1=1"
    params = []

    if g.user["role"] == "base_commander":
        my_base = g.user.get("baseId")
        sql += " AND (t.from_base_id = ? OR t.to_base_id = ?)"
        params += [my_base, my_base]
    else:
        base_id = request.args.get("baseId", type=int)
        if base_id:
            sql += " AND (t.from_base_id = ? OR t.to_base_id = ?)"
            params += [base_id, base_id]

    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    if equipment_type_id:
        sql += " AND t.equipment_type_id = ?"
        params.append(equipment_type_id)
    start_date = request.args.get("startDate")
    if start_date:
        sql += " AND t.date >= ?"
        params.append(start_date)
    end_date = request.args.get("endDate")
    if end_date:
        sql += " AND t.date <= ?"
        params.append(end_date)

    sql += " ORDER BY t.date DESC"

    with get_cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    return jsonify([transfer_row_to_dict(r) for r in rows])


@transfers_bp.route("", methods=["POST"])
@authenticate
@require_role("admin", "base_commander", "logistics_officer")
def create_transfer():
    body = request.get_json(silent=True) or {}
    from_base_id = body.get("fromBaseId")
    to_base_id = body.get("toBaseId")
    equipment_type_id = body.get("equipmentTypeId")
    quantity = body.get("quantity")
    date = body.get("date")

    if not from_base_id or not to_base_id or not equipment_type_id or not quantity or not date:
        return jsonify(
            {"message": "fromBaseId, toBaseId, equipmentTypeId, quantity and date are required."}
        ), 400
    if int(from_base_id) == int(to_base_id):
        return jsonify({"message": "fromBaseId and toBaseId must be different bases."}), 400
    if quantity <= 0:
        return jsonify({"message": "quantity must be a positive number."}), 400

    if g.user["role"] == "base_commander" and int(from_base_id) != g.user.get("baseId"):
        return jsonify(
            {"message": "Base commanders can only initiate transfers originating from their own base."}
        ), 403

    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, date, status, notes, created_by)
            VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)
            """,
            (from_base_id, to_base_id, equipment_type_id, quantity, date, body.get("notes"), g.user["id"]),
        )
        new_id = cur.lastrowid

        cur.execute(SELECT_WITH_JOINS + " WHERE t.id = ?", (new_id,))
        row = cur.fetchone()

    transfer = transfer_row_to_dict(row)
    record_audit("CREATE_TRANSFER", entity="Transfer", entity_id=new_id, details=transfer, status_code=201)

    return jsonify(transfer), 201
