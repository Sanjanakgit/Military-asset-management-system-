from flask import Blueprint, request, jsonify, g

from db import get_cursor
from auth import authenticate, require_role, effective_base_filter
from audit import record_audit
from serializers import purchase_row_to_dict

purchases_bp = Blueprint("purchases", __name__, url_prefix="/api/purchases")

SELECT_WITH_JOINS = """
    SELECT p.*, b.name AS base_name, b.location AS base_location,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM purchases p
    JOIN bases b ON b.id = p.base_id
    JOIN equipment_types e ON e.id = p.equipment_type_id
    JOIN users u ON u.id = p.created_by
"""


@purchases_bp.route("", methods=["GET"])
@authenticate
def list_purchases():
    forced = effective_base_filter(g.user)
    base_id = forced or request.args.get("baseId", type=int)
    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    start_date = request.args.get("startDate")
    end_date = request.args.get("endDate")

    sql = SELECT_WITH_JOINS + " WHERE 1=1"
    params = []
    if base_id:
        sql += " AND p.base_id = ?"
        params.append(base_id)
    if equipment_type_id:
        sql += " AND p.equipment_type_id = ?"
        params.append(equipment_type_id)
    if start_date:
        sql += " AND p.date >= ?"
        params.append(start_date)
    if end_date:
        sql += " AND p.date <= ?"
        params.append(end_date)
    sql += " ORDER BY p.date DESC"

    with get_cursor() as cur:
        cur.execute(sql, tuple(params))
        rows = cur.fetchall()

    return jsonify([purchase_row_to_dict(r) for r in rows])


@purchases_bp.route("", methods=["POST"])
@authenticate
@require_role("admin", "base_commander", "logistics_officer")
def create_purchase():
    forced = effective_base_filter(g.user)
    body = request.get_json(silent=True) or {}

    base_id = forced or body.get("baseId")
    equipment_type_id = body.get("equipmentTypeId")
    quantity = body.get("quantity")
    date = body.get("date")

    if not base_id or not equipment_type_id or not quantity or not date:
        return jsonify({"message": "baseId, equipmentTypeId, quantity and date are required."}), 400
    if quantity <= 0:
        return jsonify({"message": "quantity must be a positive number."}), 400

    with get_cursor(commit=True) as cur:
        cur.execute(
            """
            INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, date, vendor, notes, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                base_id,
                equipment_type_id,
                quantity,
                body.get("unitCost"),
                date,
                body.get("vendor"),
                body.get("notes"),
                g.user["id"],
            ),
        )
        new_id = cur.lastrowid

        cur.execute(SELECT_WITH_JOINS + " WHERE p.id = ?", (new_id,))
        row = cur.fetchone()

    purchase = purchase_row_to_dict(row)
    record_audit("CREATE_PURCHASE", entity="Purchase", entity_id=new_id, details=purchase, status_code=201)

    return jsonify(purchase), 201
