# Usmania Children Home — Expense & Donation Tracker

A full-stack web application designed for **Usmania Children Home** to manage donor contributions, record itemized line-item expenditures, calculate real-time remaining balances, and generate professional PDF statements.

---

## 🏛️ Architecture & Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Lucide Icons
- **Backend**: FastAPI (Python 3.10+) with `app` package directory
- **ORM & Database**: SQLModel / SQLAlchemy + Neon Postgres (Serverless Postgres)
  *(Includes automatic local SQLite fallback for instant offline testing)*
- **PDF Engine**: ReportLab (High-resolution, pure-Python financial statements)
- **Deployment Platform**: Vercel (Next.js Frontend & Vercel Python Serverless Functions for FastAPI)

---

## 📂 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app with CORS & router registration
│   │   ├── database.py          # SQLModel engine & session dependency
│   │   ├── models.py            # Person and Entry SQLModel tables
│   │   ├── schemas.py           # Pydantic validation schemas
│   │   ├── pdf_generator.py     # ReportLab PDF statement generation
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── persons.py       # CRUD & PDF export for persons
│   │       ├── entries.py       # CRUD for line-item expense entries
│   │       └── dashboard.py     # Aggregate metrics & summary
│   ├── api/
│   │   └── index.py             # Vercel serverless function entrypoint
│   ├── vercel.json              # Vercel Python backend configuration
│   ├── requirements.txt         # Python dependencies
│   ├── seed.py                  # Initial seed data script
│   ├── test_api.py              # Automated API & PDF test suite
│   ├── .env.example             # Backend environment template
│   └── .env                     # Local backend environment file
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Dashboard (Total donors, collected, spent, remaining)
│   │   ├── layout.tsx           # Global layout with branding & navbar
│   │   ├── globals.css          # Tailwind CSS styles
│   │   ├── persons/
│   │   │   ├── page.tsx         # Donors list page (search, sort, actions)
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Person detail, live balance & entries table
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive navigation bar
│   │   ├── PersonModal.tsx      # Add & edit donor modal with validation
│   │   ├── EntryModal.tsx       # Add & edit expense entry modal with live line total
│   │   └── ConfirmModal.tsx     # Reusable confirmation dialog for deletions
│   ├── lib/
│   │   └── api.ts               # Typed API client for FastAPI backend
│   ├── .env.example             # Frontend environment template
│   └── .env.local               # Frontend local environment file
│
└── README.md                    # Setup and deployment documentation
```

---

## 🔑 Credentials & Environment Variables

Before deploying or running with a remote database, obtain the following credentials:

### 1. `DATABASE_URL` (Neon Postgres Connection String)
- **Where to obtain**:
  1. Visit [https://console.neon.tech](https://console.neon.tech) and log in or sign up.
  2. Click **Create Project** (e.g. name it `usmania-expense-tracker`).
  3. Under the **Dashboard** -> **Connection Details**, ensure **Pooled connection** or standard connection is selected.
  4. Copy the connection string starting with `postgresql://...`
  5. Paste into `backend/.env`:
     ```env
     DATABASE_URL=postgresql://<user>:<password>@<ep-subdomain>.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
  *(Note: If `DATABASE_URL` is omitted locally, the app gracefully falls back to `sqlite:///./expense_tracker.db` so you can test immediately without any cloud account.)*

### 2. `NEXT_PUBLIC_API_URL` (FastAPI Backend URL)
- For local development: `http://localhost:8000`
- For production: The deployed URL of your backend on Vercel (e.g. `https://usmania-backend.vercel.app`)
- Stored in `frontend/.env.local`:
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:8000
  ```

---

## 🚀 Running Locally

### Step 1: Start the FastAPI Backend

1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   - **Windows PowerShell**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Populate sample donors and expenses:
   ```bash
   python seed.py
   ```
5. Run the development server referencing the `app` package:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   Backend will be running at: **`http://localhost:8000`**  
   Interactive Swagger API docs available at: **`http://localhost:8000/docs`**

---

### Step 2: Start the Next.js Frontend

1. Open a new terminal in the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
   Frontend will be running at: **`http://localhost:3000`**

---

## 🧪 Running Backend Automated Tests

An automated test script verifying all 10 core API workflows and PDF generation is included:

```bash
cd backend
python test_api.py
```

Tests verify:
1. Root health status endpoint (`/`)
2. Creating a donor (`POST /persons`)
3. Validation preventing negative amounts or empty names (HTTP 422)
4. Adding itemized expense entries (`POST /persons/{id}/entries`)
5. Retrieving person detail and live calculated balances (`GET /persons/{id}`)
6. Editing expense entries and recalculating line totals (`PUT /entries/{id}`)
7. Aggregate dashboard summary calculations (`GET /summary`)
8. Backend PDF statement generation and download headers (`GET /persons/{id}/pdf`)
9. Entry deletion and balance restoration (`DELETE /entries/{id}`)
10. Donor deletion with cascade entry removal (`DELETE /persons/{id}`)

---

## ☁️ Deployment Guide (Vercel)

Both the Next.js frontend and FastAPI backend are configured for Vercel deployment.

### Deploying the Backend on Vercel:
1. Push this repository to GitHub.
2. In Vercel, import the repository and set the **Root Directory** to `backend`.
3. In Project Settings -> **Environment Variables**, add:
   - `DATABASE_URL`: Your Neon Postgres connection string.
4. Deploy. Vercel will build the Python runtime using `backend/vercel.json` and `backend/api/index.py`.

### Deploying the Frontend on Vercel:
1. In Vercel, import the repository and set the **Root Directory** to `frontend`.
2. In Project Settings -> **Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL`: Your deployed FastAPI backend URL (e.g. `https://your-backend.vercel.app`).
3. Deploy. Next.js App Router will be live with high availability and global edge routing.
