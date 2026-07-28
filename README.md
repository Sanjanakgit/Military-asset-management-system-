 <!-- Military Asset Management System (MAMS) -->

A full-stack system for tracking military asset movement, assignment, and
expenditure across multiple bases, with role-based access control and
transaction auditing.


<!-- OPtion 1 -->
WE can run have Docker Desktop installed, this single command starts 
the backend, and the frontend together:

```bash
docker compose up -d
```
```bash
docker compose exec backend python seed.py
```

Now open:
- Frontend: http://localhost:3000
- Backend health check: http://localhost:5000/api/health

To stop everything: `docker compose down` 

<!-- OPtion 2 -->

 <!-- 2. Backend (Python/Flask) -->
```bash
cd backend
python -m venv venv && source venv/bin/activate   
pip install -r requirements.txt
python seed.py             #create Table
python app.py                # http://localhost:5000
```
 <!-- 3. Frontend (React) -->
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

<!-- Demo logins (password for all: `Password123!`) --> -->
| Username     | Role              | Base scope |
|--------------|-------------------|------------|
| admin        | admin             | all bases |
| cmd.alpha    | base_commander    | Fort Alpha |
| cmd.bravo    | base_commander    | Base Bravo |
| logistics1   | logistics_officer | all bases (purchases/transfers only) |


backend/
  config.py         All settings in one place - edit this, no .env needed
  app.py              Flask app + HTTP access logging
  db.py                SQLite connection helper (Python's built-in sqlite3)
  schema.sql            Plain CREATE TABLE statements (no ORM)
  seed.py                 Creates the database file + demo data
  auth.py                   JWT login + role checks
  audit.py                    Writes every action to the audit_logs table
  balance.py                    Dashboard calculations
  serializers.py                  Turns SQL rows into JSON for the frontend
  routes/                          One file per feature area
  data/                              mams.db lives here once you seed it
  Dockerfile
frontend/
  src/config.js       The one line to edit for the backend's address
  Dockerfile
database/             A ready-made SQLite file + SQL dump
docs/                 PDF project report
docker-compose.yml    Runs backend + frontend together
render.yaml           Backend deployment blueprint for Render
netlify.toml          Frontend deployment settings for Netlify

<!-- Deploying live (Frontend on Netlify, Backend on Render) -->

<!-- 1. Get a real MySQL database reachable from the internet:
 Render does
   not offer one-click managed MySQL, so use a free/low-cost external
   provider such as PlanetScale, Aiven, Railway, or AWS RDS. This is the
   database that keeps your data after hosting — every purchase, transfer,
   and assignment made on your live site is saved here permanently.
2. Backend → Render: push this repo to GitHub, then in Render choose
   "New +" → "Blueprint" and point it at the repo (it reads `render.yaml`
   automatically). Fill in `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   with your MySQL provider's details in Render's dashboard (these are
   just fields you type into Render's website - still no `.env` file).
   After the first deploy, open Render's Shell tab and run
   `python seed.py` once to create the tables.
3. Frontend → Netlify:before pushing, open `frontend/src/config.js`
   and change `API_URL` to your Render backend's URL
   (e.g. `"https://mams-backend.onrender.com/api"`). Commit and push, then
   in Netlify choose "Add new site" → point it at the repo
   (`netlify.toml` sets the build settings automatically).
4. Once the frontend is live, go back to Render's dashboard and set
   `CORS_ORIGIN` to your Netlify URL instead of `*`, so only your frontend
   can call the API. -->

<!-- See docs/PROJECT_REPORT.pdf -->
