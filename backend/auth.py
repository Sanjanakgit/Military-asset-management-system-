import datetime
from functools import wraps

import jwt
from flask import request, jsonify, g

import config


def generate_token(payload):
    to_encode = dict(payload)
    to_encode["exp"] = datetime.datetime.utcnow() + datetime.timedelta(hours=config.JWT_EXPIRES_HOURS)
    return jwt.encode(to_encode, config.JWT_SECRET, algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])


def authenticate(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        token = header[7:] if header.startswith("Bearer ") else None

        if not token:
            return jsonify({"message": "Missing authentication token."}), 401

        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            return jsonify({"message": "Invalid or expired token."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"message": "Invalid or expired token."}), 401

        g.user = payload
        return fn(*args, **kwargs)

    return wrapper


def require_role(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = getattr(g, "user", None)
            if not user:
                return jsonify({"message": "Not authenticated."}), 401
            if user["role"] not in allowed_roles:
                return jsonify(
                    {"message": f"Access denied. Requires one of: {', '.join(allowed_roles)}."}
                ), 403
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def effective_base_filter(user):
    if user["role"] == "base_commander":
        return user.get("baseId")
    return None
