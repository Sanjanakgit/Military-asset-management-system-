import os
import bcrypt

from db import get_connection, get_cursor


def hash_password(plain):
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def run_schema():
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    conn = get_connection()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()


def seed():
    run_schema()

    with get_cursor(commit=True) as cur:
        cur.execute("INSERT INTO bases (name, location) VALUES (?, ?)", ("Fort Alpha", "Northern Command"))
        alpha_id = cur.lastrowid
        cur.execute("INSERT INTO bases (name, location) VALUES (?, ?)", ("Base Bravo", "Eastern Command"))
        bravo_id = cur.lastrowid
        cur.execute("INSERT INTO bases (name, location) VALUES (?, ?)", ("Camp Charlie", "Southern Command"))
        charlie_id = cur.lastrowid

    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)",
            ("M4 Carbine", "weapon", "units"),
        )
        rifle_id = cur.lastrowid
        cur.execute(
            "INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)",
            ("Armored Personnel Carrier", "vehicle", "units"),
        )
        apc_id = cur.lastrowid
        cur.execute(
            "INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)",
            ("5.56mm Ammunition", "ammunition", "rounds"),
        )
        ammo_id = cur.lastrowid
        cur.execute(
            "INSERT INTO equipment_types (name, category, unit) VALUES (?, ?, ?)",
            ("Reconnaissance Drone", "vehicle", "units"),
        )
        drone_id = cur.lastrowid

    pw_hash = hash_password("Password123!")
    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO users (username, password_hash, full_name, role, base_id) VALUES (?, ?, ?, ?, ?)",
            ("admin", pw_hash, "System Administrator", "admin", None),
        )
        admin_id = cur.lastrowid
        cur.execute(
            "INSERT INTO users (username, password_hash, full_name, role, base_id) VALUES (?, ?, ?, ?, ?)",
            ("cmd.alpha", pw_hash, "Col. J. Reyes", "base_commander", alpha_id),
        )
        commander_alpha_id = cur.lastrowid
        cur.execute(
            "INSERT INTO users (username, password_hash, full_name, role, base_id) VALUES (?, ?, ?, ?, ?)",
            ("cmd.bravo", pw_hash, "Col. S. Kapoor", "base_commander", bravo_id),
        )
        commander_bravo_id = cur.lastrowid
        cur.execute(
            "INSERT INTO users (username, password_hash, full_name, role, base_id) VALUES (?, ?, ?, ?, ?)",
            ("logistics1", pw_hash, "Lt. M. Osei", "logistics_officer", None),
        )
        logistics_id = cur.lastrowid

    purchases = [
        (alpha_id, rifle_id, 50, 900, "2026-01-05", "Colt Defense", admin_id),
        (alpha_id, ammo_id, 20000, 0.5, "2026-01-10", "Federal Premium", logistics_id),
        (bravo_id, apc_id, 3, 550000, "2026-02-01", "General Dynamics", logistics_id),
        (bravo_id, drone_id, 8, 25000, "2026-02-15", "AeroVironment", commander_bravo_id),
        (charlie_id, rifle_id, 30, 900, "2026-03-01", "Colt Defense", admin_id),
    ]
    with get_cursor(commit=True) as cur:
        cur.executemany(
            "INSERT INTO purchases (base_id, equipment_type_id, quantity, unit_cost, date, vendor, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
            purchases,
        )

    transfers = [
        (alpha_id, charlie_id, rifle_id, 10, "2026-03-10", commander_alpha_id),
        (bravo_id, alpha_id, drone_id, 2, "2026-03-12", logistics_id),
        (alpha_id, bravo_id, ammo_id, 5000, "2026-03-18", commander_alpha_id),
    ]
    with get_cursor(commit=True) as cur:
        cur.executemany(
            "INSERT INTO transfers (from_base_id, to_base_id, equipment_type_id, quantity, date, status, created_by) VALUES (?, ?, ?, ?, ?, 'completed', ?)",
            transfers,
        )

    with get_cursor(commit=True) as cur:
        cur.execute(
            "INSERT INTO assignments (base_id, equipment_type_id, personnel_name, personnel_service_id, quantity, date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?)",
            (alpha_id, rifle_id, "Sgt. D. Alvarez", "SVC-10234", 1, "2026-01-20", commander_alpha_id),
        )
        cur.execute(
            "INSERT INTO assignments (base_id, equipment_type_id, personnel_name, personnel_service_id, quantity, date, status, created_by) VALUES (?, ?, ?, ?, ?, ?, 'assigned', ?)",
            (alpha_id, rifle_id, "Cpl. R. Lin", "SVC-10298", 1, "2026-01-21", commander_alpha_id),
        )
        cur.execute(
            "INSERT INTO assignments (base_id, equipment_type_id, personnel_name, personnel_service_id, quantity, date, status, returned_date, created_by) VALUES (?, ?, ?, ?, ?, ?, 'returned', ?, ?)",
            (bravo_id, drone_id, "Capt. N. Fischer", "SVC-20411", 1, "2026-02-20", "2026-03-05", commander_bravo_id),
        )

    expenditures = [
        (alpha_id, ammo_id, 3000, "2026-02-05", "Live-fire training exercise", commander_alpha_id),
        (bravo_id, ammo_id, 800, "2026-03-01", "Range qualification", commander_bravo_id),
    ]
    with get_cursor(commit=True) as cur:
        cur.executemany(
            "INSERT INTO expenditures (base_id, equipment_type_id, quantity, date, reason, created_by) VALUES (?, ?, ?, ?, ?, ?)",
            expenditures,
        )

    print("Seed complete.")
    print("Demo login credentials (all use password: Password123!)")
    print(f"{'username':<14}{'role':<20}{'base'}")
    print(f"{'admin':<14}{'admin':<20}{'-'}")
    print(f"{'cmd.alpha':<14}{'base_commander':<20}{'Fort Alpha'}")
    print(f"{'cmd.bravo':<14}{'base_commander':<20}{'Base Bravo'}")
    print(f"{'logistics1':<14}{'logistics_officer':<20}{'-'}")


if __name__ == "__main__":
    seed()
