PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS expenditures;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS transfers;
DROP TABLE IF EXISTS purchases;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS equipment_types;
DROP TABLE IF EXISTS bases;

CREATE TABLE bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('vehicle', 'weapon', 'ammunition')),
    unit TEXT DEFAULT 'unit',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'base_commander', 'logistics_officer')),
    base_id INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id)
);

CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost REAL,
    date TEXT NOT NULL,
    vendor TEXT,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_base_id INTEGER NOT NULL,
    to_base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'in_transit', 'cancelled')),
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_base_id) REFERENCES bases(id),
    FOREIGN KEY (to_base_id) REFERENCES bases(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    personnel_name TEXT NOT NULL,
    personnel_service_id TEXT,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'returned')),
    returned_date TEXT,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE expenditures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_id INTEGER NOT NULL,
    equipment_type_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    date TEXT NOT NULL,
    reason TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (base_id) REFERENCES bases(id),
    FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id INTEGER,
    method TEXT,
    path TEXT,
    ip_address TEXT,
    details TEXT,
    status_code INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

PRAGMA foreign_keys = ON;
