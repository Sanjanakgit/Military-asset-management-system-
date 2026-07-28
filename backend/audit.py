import json
from flask import g, request

from db import get_cursor


def record_audit(action, entity=None, entity_id=None, details=None, status_code=None):
    try:
        user = getattr(g, "user", None)
        sql = """
            INSERT INTO audit_logs
                (user_id, username, action, entity, entity_id, method, path, ip_address, details, status_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        params = (
            user["id"] if user else None,
            user["username"] if user else "anonymous",
            action,
            entity,
            entity_id,
            request.method,
            request.full_path.rstrip("?"),
            request.remote_addr,
            json.dumps(details, default=str) if details else None,
            status_code,
        )
        with get_cursor(commit=True) as cur:
            cur.execute(sql, params)
    except Exception as exc:
        print(f"Audit log write failed: {exc}")
