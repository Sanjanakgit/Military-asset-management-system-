BEGIN TRANSACTION;
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
INSERT INTO "assignments" VALUES(1,1,1,'Sgt. D. Alvarez','SVC-10234',1,'2026-01-20','assigned',NULL,NULL,2,'2026-07-28 00:43:04');
INSERT INTO "assignments" VALUES(2,1,1,'Cpl. R. Lin','SVC-10298',1,'2026-01-21','assigned',NULL,NULL,2,'2026-07-28 00:43:04');
INSERT INTO "assignments" VALUES(3,2,4,'Capt. N. Fischer','SVC-20411',1,'2026-02-20','returned','2026-03-05',NULL,3,'2026-07-28 00:43:04');
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
INSERT INTO "audit_logs" VALUES(1,1,'admin','LOGIN_SUCCESS',NULL,NULL,'POST','/api/auth/login','127.0.0.1',NULL,200,'2026-07-28 00:43:32');
INSERT INTO "audit_logs" VALUES(2,2,'cmd.alpha','LOGIN_SUCCESS',NULL,NULL,'POST','/api/auth/login','127.0.0.1',NULL,200,'2026-07-28 00:43:32');
INSERT INTO "audit_logs" VALUES(3,4,'logistics1','LOGIN_SUCCESS',NULL,NULL,'POST','/api/auth/login','127.0.0.1',NULL,200,'2026-07-28 00:43:33');
CREATE TABLE bases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "bases" VALUES(1,'Fort Alpha','Northern Command','2026-07-28 00:43:04');
INSERT INTO "bases" VALUES(2,'Base Bravo','Eastern Command','2026-07-28 00:43:04');
INSERT INTO "bases" VALUES(3,'Camp Charlie','Southern Command','2026-07-28 00:43:04');
CREATE TABLE equipment_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK(category IN ('vehicle', 'weapon', 'ammunition')),
    unit TEXT DEFAULT 'unit',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "equipment_types" VALUES(1,'M4 Carbine','weapon','units','2026-07-28 00:43:04');
INSERT INTO "equipment_types" VALUES(2,'Armored Personnel Carrier','vehicle','units','2026-07-28 00:43:04');
INSERT INTO "equipment_types" VALUES(3,'5.56mm Ammunition','ammunition','rounds','2026-07-28 00:43:04');
INSERT INTO "equipment_types" VALUES(4,'Reconnaissance Drone','vehicle','units','2026-07-28 00:43:04');
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
INSERT INTO "expenditures" VALUES(1,1,3,3000,'2026-02-05','Live-fire training exercise',2,'2026-07-28 00:43:04');
INSERT INTO "expenditures" VALUES(2,2,3,800,'2026-03-01','Range qualification',3,'2026-07-28 00:43:04');
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
INSERT INTO "purchases" VALUES(1,1,1,50,900.0,'2026-01-05','Colt Defense',NULL,1,'2026-07-28 00:43:04');
INSERT INTO "purchases" VALUES(2,1,3,20000,0.5,'2026-01-10','Federal Premium',NULL,4,'2026-07-28 00:43:04');
INSERT INTO "purchases" VALUES(3,2,2,3,550000.0,'2026-02-01','General Dynamics',NULL,4,'2026-07-28 00:43:04');
INSERT INTO "purchases" VALUES(4,2,4,8,25000.0,'2026-02-15','AeroVironment',NULL,3,'2026-07-28 00:43:04');
INSERT INTO "purchases" VALUES(5,3,1,30,900.0,'2026-03-01','Colt Defense',NULL,1,'2026-07-28 00:43:04');
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
INSERT INTO "transfers" VALUES(1,1,3,1,10,'2026-03-10','completed',NULL,2,'2026-07-28 00:43:04');
INSERT INTO "transfers" VALUES(2,2,1,4,2,'2026-03-12','completed',NULL,4,'2026-07-28 00:43:04');
INSERT INTO "transfers" VALUES(3,1,2,3,5000,'2026-03-18','completed',NULL,2,'2026-07-28 00:43:04');
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
INSERT INTO "users" VALUES(1,'admin','$2b$12$SmKftXdrO3KGEH.biHOs8eS25BvKWAOOhvJfrDQcA78MIuD/ABHXe','System Administrator','admin',NULL,1,'2026-07-28 00:43:04');
INSERT INTO "users" VALUES(2,'cmd.alpha','$2b$12$SmKftXdrO3KGEH.biHOs8eS25BvKWAOOhvJfrDQcA78MIuD/ABHXe','Col. J. Reyes','base_commander',1,1,'2026-07-28 00:43:04');
INSERT INTO "users" VALUES(3,'cmd.bravo','$2b$12$SmKftXdrO3KGEH.biHOs8eS25BvKWAOOhvJfrDQcA78MIuD/ABHXe','Col. S. Kapoor','base_commander',2,1,'2026-07-28 00:43:04');
INSERT INTO "users" VALUES(4,'logistics1','$2b$12$SmKftXdrO3KGEH.biHOs8eS25BvKWAOOhvJfrDQcA78MIuD/ABHXe','Lt. M. Osei','logistics_officer',NULL,1,'2026-07-28 00:43:04');
DELETE FROM "sqlite_sequence";
INSERT INTO "sqlite_sequence" VALUES('bases',3);
INSERT INTO "sqlite_sequence" VALUES('equipment_types',4);
INSERT INTO "sqlite_sequence" VALUES('users',4);
INSERT INTO "sqlite_sequence" VALUES('purchases',5);
INSERT INTO "sqlite_sequence" VALUES('transfers',3);
INSERT INTO "sqlite_sequence" VALUES('assignments',3);
INSERT INTO "sqlite_sequence" VALUES('expenditures',2);
INSERT INTO "sqlite_sequence" VALUES('audit_logs',3);
COMMIT;
