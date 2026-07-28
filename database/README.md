<!-- # Database files (SQLite)

- `mams_seeded.sqlite` is the actual, ready-to-use database file, already
  created and filled with demo data by `backend/seed.py`. SQLite databases
  are just a single file, so you can use this immediately.
- `mams_dump.sql` is a plain-text SQL export of that same database (schema
  and data), generated with Python's built-in `sqlite3` module.

## Using the ready-made file directly

Copy `mams_seeded.sqlite` into `backend/data/mams.db` and start the
backend. No setup, no server, nothing to install.

```bash
mkdir -p ../backend/data
cp mams_seeded.sqlite ../backend/data/mams.db
```


```bash
python3 -c "import sqlite3; conn = sqlite3.connect('mams.db'); conn.executescript(open('mams_dump.sql').read())"
```

## Regenerating both files

```bash
cd ../backend
python seed.py
python3 -c "
import sqlite3
conn = sqlite3.connect('data/mams.db')
with open('../database/mams_dump.sql', 'w') as f:
    for line in conn.iterdump():
        f.write('%s\n' % line)
"
cp data/mams.db ../database/mams_seeded.sqlite
```

## Schema notes

- The schema is defined once, in plain SQL, at `backend/schema.sql`. Table
  and column names are snake_case (`base_id`, `equipment_type_id`,
  `created_at`) while the JSON the API returns uses camelCase (`baseId`,
  `equipmentTypeId`) for the frontend. That mapping happens in
  `backend/serializers.py`.
- Role, category, and status columns use `TEXT` with `CHECK` constraints
  instead of a dedicated enum type, since SQLite has no native `ENUM` type.
- All foreign keys (`base_id`, `equipment_type_id`, `created_by`, etc.) are
  declared in `schema.sql`. SQLite only enforces foreign keys when a
  connection turns them on, which `backend/db.py` does for every
  connection it opens. -->
