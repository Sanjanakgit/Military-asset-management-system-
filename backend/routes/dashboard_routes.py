from flask import Blueprint, request, jsonify, g

from db import get_cursor
from auth import authenticate, effective_base_filter
from balance import get_dashboard_metrics
from serializers import purchase_row_to_dict, transfer_row_to_dict

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

PURCHASE_SELECT = """
    SELECT p.*, b.name AS base_name, b.location AS base_location,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM purchases p
    JOIN bases b ON b.id = p.base_id
    JOIN equipment_types e ON e.id = p.equipment_type_id
    JOIN users u ON u.id = p.created_by
"""

TRANSFER_SELECT = """
    SELECT t.*, fb.name AS from_base_name, tb.name AS to_base_name,
           e.name AS equipment_name, e.category AS equipment_category, e.unit AS equipment_unit,
           u.username AS creator_username, u.full_name AS creator_full_name
    FROM transfers t
    JOIN bases fb ON fb.id = t.from_base_id
    JOIN bases tb ON tb.id = t.to_base_id
    JOIN equipment_types e ON e.id = t.equipment_type_id
    JOIN users u ON u.id = t.created_by
"""


def _resolve_base_id():
    forced = effective_base_filter(g.user)
    requested = request.args.get("baseId", type=int)
    return forced or requested or None


@dashboard_bp.route("/metrics", methods=["GET"])
@authenticate
def get_metrics():
    base_id = _resolve_base_id()
    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    start_date = request.args.get("startDate") or None
    end_date = request.args.get("endDate") or None

    metrics = get_dashboard_metrics(
        base_id=base_id, equipment_type_id=equipment_type_id, start_date=start_date, end_date=end_date
    )
    return jsonify(metrics)


@dashboard_bp.route("/net-movement-detail", methods=["GET"])
@authenticate
def get_net_movement_detail():
    base_id = _resolve_base_id()
    equipment_type_id = request.args.get("equipmentTypeId", type=int)
    start_date = request.args.get("startDate") or None
    end_date = request.args.get("endDate") or None

    with get_cursor() as cur:
        sql, params = PURCHASE_SELECT + " WHERE 1=1", []
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
        cur.execute(sql, tuple(params))
        purchases = [purchase_row_to_dict(r) for r in cur.fetchall()]

        base_transfer_sql = TRANSFER_SELECT + " WHERE t.status = 'completed'"

        sql_in, params_in = base_transfer_sql, []
        if base_id:
            sql_in += " AND t.to_base_id = ?"
            params_in.append(base_id)
        if equipment_type_id:
            sql_in += " AND t.equipment_type_id = ?"
            params_in.append(equipment_type_id)
        if start_date:
            sql_in += " AND t.date >= ?"
            params_in.append(start_date)
        if end_date:
            sql_in += " AND t.date <= ?"
            params_in.append(end_date)
        sql_in += " ORDER BY t.date DESC"
        cur.execute(sql_in, tuple(params_in))
        transfers_in = [transfer_row_to_dict(r) for r in cur.fetchall()]

        sql_out, params_out = base_transfer_sql, []
        if base_id:
            sql_out += " AND t.from_base_id = ?"
            params_out.append(base_id)
        if equipment_type_id:
            sql_out += " AND t.equipment_type_id = ?"
            params_out.append(equipment_type_id)
        if start_date:
            sql_out += " AND t.date >= ?"
            params_out.append(start_date)
        if end_date:
            sql_out += " AND t.date <= ?"
            params_out.append(end_date)
        sql_out += " ORDER BY t.date DESC"
        cur.execute(sql_out, tuple(params_out))
        transfers_out = [transfer_row_to_dict(r) for r in cur.fetchall()]

    return jsonify({"purchases": purchases, "transfersIn": transfers_in, "transfersOut": transfers_out})
