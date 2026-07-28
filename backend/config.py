import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "mams.db")

JWT_SECRET = os.environ.get("JWT_SECRET", "mams-secret-key-change-this-in-production")
JWT_EXPIRES_HOURS = 8

PORT = int(os.environ.get("PORT", 5000))
CORS_ORIGIN = os.environ.get("CORS_ORIGIN", "*")
