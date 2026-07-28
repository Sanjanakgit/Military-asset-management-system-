from flask import Blueprint, request, jsonify

from db import get_cursor
from auth import authenticate, require_role
from serializers import base_to_dict, equipment_type_to_dict

reference_bp = Blueprint("reference", __name__, url_prefix="/api")


@reference_bp.route("/bases", methods=["GET"])
@authenticate
def list_bases():
    with get_cursor() as cur:
        cur.execute("SELECT * FROM bases ORDER BY name ASC")
        rows = cur.fetchall()
    return jsonify([base_to_dict(r) for r in rows])


@reference_bp.route("/bases", methods=["POST"])
@authenticate
@require_role("admin")
def create_base():
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    location = body.get("location")
    if not name:
        return jsonify({"message": "name is required."}), 400

    with get_cursor(commit=True) as cur:
        cur.execute("INSERT INTO bases (name, location) VALUES (?, ?)", (name, location))
        new_id = cur.lastrowid

    return jsonify(base_to_dict({"id": new_id, "name": name, "location": location})), 201


@reference_bp.route("/equipment-types", methods=["GET"])
@authenticate
def list_equipment_types():
    with get_cursor() as cur:
        cur.execute("SELECT * FROM equipment_types ORDER BY name ASC")
        rows = cur.fetchall()
    return jsonify([equipment_type_to_dict(r) for r in rows])


@reference_bp.route("/equipment-types", methods=["POST"])
@authenticate
@require_role("admin")
def create_equipment_type():
    body = request.get_json(silent=True) or {}
    name = body.get("name")
    category = body.get("category")
    unit = body.get("unit") or "unit"
    if not name or not category:
        return jsonify({"message": "name and category are required."}), 400

    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)", (name, category, unit)
        )
        new_id = cur.lastrowid

    return jsonify(equipment_type_to_dict({"id": new_id, "name": name, "category": category, "unit": unit})), 201
