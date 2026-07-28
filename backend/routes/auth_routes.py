import bcrypt
from flask import Blueprint, request, jsonify, g

from db import get_cursor
from auth import authenticate, generate_token
from audit import record_audit
from serializers import base_to_dict

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True) or {}
    username = body.get("username")
    password = body.get("password")

    if not username or not password:
        return jsonify({"message": "username and password are required."}), 400

    with get_cursor() as cur:
        cur.execute(
            """
            SELECT u.*, b.id AS base_table_id, b.name AS base_name, b.location AS base_location
            FROM users u
            LEFT JOIN bases b ON b.id = u.base_id
            WHERE u.username = ?
            """,
            (username,),
        )
        user = cur.fetchone()

    if not user or not user["is_active"]:
        record_audit("LOGIN_FAILED", details={"username": username}, status_code=401)
        return jsonify({"message": "Invalid credentials."}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8")):
        record_audit("LOGIN_FAILED", details={"username": username}, status_code=401)
        return jsonify({"message": "Invalid credentials."}), 401

    payload = {
        "id": user["id"],
        "username": user["username"],
        "fullName": user["full_name"],
        "role": user["role"],
        "baseId": user["base_id"],
    }
    token = generate_token(payload)

    g.user = payload
    record_audit("LOGIN_SUCCESS", status_code=200)

    base = None
    if user["base_id"]:
        base = base_to_dict({"id": user["base_table_id"], "name": user["base_name"], "location": user["base_location"]})

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "fullName": user["full_name"],
                "role": user["role"],
                "baseId": user["base_id"],
                "base": base,
            },
        }
    )


@auth_bp.route("/me", methods=["GET"])
@authenticate
def me():
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT u.id, u.username, u.full_name, u.role, u.base_id, u.is_active,
                   b.id AS base_table_id, b.name AS base_name, b.location AS base_location
            FROM users u
            LEFT JOIN bases b ON b.id = u.base_id
            WHERE u.id = ?
            """,
            (g.user["id"],),
        )
        user = cur.fetchone()

    if not user:
        return jsonify({"message": "User not found."}), 404

    base = None
    if user["base_id"]:
        base = base_to_dict({"id": user["base_table_id"], "name": user["base_name"], "location": user["base_location"]})

    return jsonify(
        {
            "id": user["id"],
            "username": user["username"],
            "fullName": user["full_name"],
            "role": user["role"],
            "baseId": user["base_id"],
            "isActive": bool(user["is_active"]),
            "base": base,
        }
    )
