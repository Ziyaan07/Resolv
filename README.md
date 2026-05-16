# Private Enterprise Incident Orchestrator (PEIO) / Resolv

A modern internal web platform for company employees to report physical and IT security hazards, and for the security response team to review, manage, and orchestrate responses to those reports.

---

## What you need installed

1. **Node.js** (version 18 or newer) — [https://nodejs.org](https://nodejs.org)
2. A web browser (Chrome, Firefox, Safari, or Edge)
3. A **Supabase** project (for PostgreSQL database and file storage)

Check Node is installed:

```bash
node --version
npm --version
```

---

## How to run the app (step by step)

### 1. Open the project folder in Terminal

```bash
cd "/Users/elc/Documents/3rd Sem/SE Project"
```

### 2. Install dependencies (only needed the first time)

```bash
npm install
```

### 3. Configure your Environment Variables

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your Supabase credentials:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon/public key

### 4. Start the server

```bash
npm start
```

You should see:

```
PEIO server running at http://localhost:3001
```

*Note: The server will automatically seed default accounts into your Supabase database on the first run.*

### 5. Open the app in your browser

Go to: **http://localhost:3001**

### 6. Sign in with a demo account

| Who you are        | Email                     | Password      |
|--------------------|---------------------------|---------------|
| Employee           | `employee@company.com`    | `password123` |
| Security team      | `security@company.com`    | `password123` |

Or, use the **Create Account** tab to initialize a new employee profile.

---

## What each part of the app does

### For employees (Reporters)

1. Sign in or sign up on the home page.
2. You are taken to **Incident Reporting**.
3. Fill in the form: Intel Summary, Vector Category, Detailed Description, Severity Level.
4. **Attach Evidence** (Optional): Drag and drop or select images/PDFs up to 50MB.
5. **Mark the hazard on the map** (required for Physical Security & Facilities) — click the map, search an address, or use “Auto-locate”.
6. Click **Transmit Intel Report**.
7. Your past reports appear below the form in chronological order.

### For the security team (`security@company.com`)

1. Sign in on the home page.
2. You are taken to the **Orchestration Dashboard**.
3. View KPI metrics and the **Threat Vectors** chart.
4. See all employee reports in the Incident Orchestration queue.
5. Filter by priority (Low, Medium, High, Critical).
6. View pinned locations and jump directly to them on the map.
7. Change each report’s status: **Pending** → **Investigating** → **Resolved**.
8. View the **Personnel Roster** to manage active verified identities.

---

## How everything is connected

```
Browser (HTML pages & Tailwind CSS)
    ↓  fetch() calls (JWT Authenticated)
Express server (Node.js)  →  port 3001
    ↓
API routes (/api/auth, /api/incidents, /api/geocode)
    ↓
Supabase (PostgreSQL DB + Storage Buckets)
```

- The **frontend** lives in `public/` (HTML, Tailwind CSS, JavaScript).
- The **backend** lives in `src/` (Express server and API logic).
- **Login/Signup** returns a JWT token; the browser saves it and sends it with every API request via the Authorization header.
- **Data & Files** are saved to your cloud Supabase instance, ensuring persistence and scalability.

---

## Project folder structure

```
SE Project/
├── README.md              ← This file
├── package.json           ← Dependencies and npm scripts
├── .env                   ← Settings (port, JWT secret, Supabase keys)

├── public/                ← Frontend (what you see in the browser)
│   ├── index.html         ← Sign-in / Sign-up page
│   ├── report.html        ← Employee reporting page
│   ├── admin.html         ← Security team console
│   ├── css/styles.css     ← Built Tailwind CSS (do not edit directly)
│   ├── css/input.css      ← Tailwind CSS entry point
│   └── js/                ← Frontend logic (api.js, map-picker.js, admin.js, …)
├── src/                   ← Backend (server code)
│   ├── server.js          ← Starts the app & seeds database
│   ├── app.js             ← Express app setup
│   ├── routes/            ← auth.js, incidents.js (w/ multer), geocode.js
│   ├── middleware/        ← auth.js (JWT authentication)
│   └── data/store.js      ← Supabase DB interaction
└── scripts/               ← Standalone database & utility scripts
    ├── add_column.js
    ├── check_users.js
    ├── create_bucket.js
    └── reset_passwords.js
```

---

## API endpoints (for reference)

| Method | URL | Who can use it | Description |
|--------|-----|----------------|-------------|
| GET | `/api/health` | Anyone | Checks server is up |
| POST | `/api/auth/login` | Anyone | Authenticate and get JWT |
| POST | `/api/auth/signup` | Anyone | Create a new employee account |
| GET | `/api/auth/me` | Signed-in users | Get current user profile |
| GET | `/api/auth/users` | Admin only | List all personnel |
| POST | `/api/incidents` | Employees | Submit report (supports `multipart/form-data` for file uploads) |
| GET | `/api/incidents` | Employees (own) / Admin (all) | Retrieve reports |
| GET | `/api/incidents/:id`| Employees (own) / Admin | Get specific incident details |
| PATCH | `/api/incidents/:id/status`| Admin only | Update incident status |
| GET | `/api/geocode/defaults` | Anyone | Default map center coordinates |
| GET | `/api/geocode/search?q=...`| Signed-in users | Address search via Nominatim |
| GET | `/api/geocode/reverse?lat=&lon=`| Signed-in users | Coordinates → address |

---

## Integrations

### OpenStreetMap (Geocoding)
- **Leaflet** displays OSM map tiles in the browser.
- **Nominatim** (via your backend proxy at `/api/geocode`) powers search and reverse geocoding.
- Set your campus center in `.env`: `CAMPUS_DEFAULT_LAT`, `CAMPUS_DEFAULT_LNG`, `CAMPUS_DEFAULT_ZOOM`.
- Set `NOMINATIM_CONTACT_EMAIL` to a real contact email for production use (OSM usage policy).

### Supabase (Database & Storage)
- **PostgreSQL**: Stores `users`, `incidents`, and `incident_logs`.
- **Storage**: Handles `evidence` file uploads.

---

## Deployment (Render)

This application is configured for seamless deployment to **Render.com** (or Railway/Heroku) as a standard Node.js Web Service.

1. Create a new "Web Service" on Render and connect your GitHub repository.
2. In the setup, ensure the following:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Add your Environment Variables (`SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`).
4. Click Deploy. Render will seamlessly install dependencies, compile the Tailwind CSS, and boot your Express server with full support for 50MB file uploads!

---

## Common problems

### “Cannot find module” or `npm install` errors

Run again from the project folder:

```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### Port 3001 already in use

Another app is using that port. Stop the running process, or change the port in `.env`:

```
PORT=3002
```

### Database or Upload Errors

Ensure your `.env` file contains the correct `SUPABASE_URL` and `SUPABASE_KEY`. If files fail to upload, verify that your Supabase Storage has a bucket named `evidence` configured.

### Stopping the server

In the terminal where the server is running, press **Ctrl + C**.
