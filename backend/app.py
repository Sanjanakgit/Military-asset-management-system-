import os
import time
import logging
from logging.handlers import RotatingFileHandler

from flask import Flask, request, jsonify, g
from flask_cors import CORS

import config
from routes.auth_routes import auth_bp
from routes.reference_routes import reference_bp
from routes.dashboard_routes import dashboard_bp
from routes.purchase_routes import purchases_bp
from routes.transfer_routes import transfers_bp
from routes.assignment_routes import assignments_bp


def create_app():
    app = Flask(__name__)

    CORS(app, origins=[config.CORS_ORIGIN])

    logs_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    access_logger = logging.getLogger("access")
    access_logger.setLevel(logging.INFO)
    handler = RotatingFileHandler(os.path.join(logs_dir, "access.log"), maxBytes=5_000_000, backupCount=3)
    handler.setFormatter(logging.Formatter("%(message)s"))
    access_logger.addHandler(handler)

    @app.before_request
    def _start_timer():
        g._start_time = time.time()

    @app.after_request
    def _log_access(response):
        try:
            duration_ms = round((time.time() - getattr(g, "_start_time", time.time())) * 1000, 2)
            access_logger.info(
                '%s - "%s %s" %s %sms - %s',
                request.remote_addr,
                request.method,
                request.full_path.rstrip("?"),
                response.status_code,
                duration_ms,
                request.headers.get("User-Agent", "-"),
            )
        except Exception:
            pass
        return response

    @app.route("/api/health", methods=["GET"])
    def health():
        import datetime

        return jsonify({"status": "ok", "time": datetime.datetime.utcnow().isoformat() + "Z"})

    app.register_blueprint(auth_bp)
    app.register_blueprint(reference_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(purchases_bp)
    app.register_blueprint(transfers_bp)
    app.register_blueprint(assignments_bp)

    @app.errorhandler(Exception)
    def handle_error(err):
        code = getattr(err, "code", 500)
        if not isinstance(code, int):
            code = 500
        app.logger.exception(err)
        message = str(err) if code < 500 else "Internal server error."
        return jsonify({"message": message}), code

    return app


app = create_app()
print("=== Flask application started successfully ===")
print(app.url_map)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.PORT, debug=True)
