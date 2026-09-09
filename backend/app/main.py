import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import persons, entries, dashboard, auth, upload
from app.imagekit_service import UPLOAD_DIR

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    init_db()
    yield

app = FastAPI(
    title="Usmania Children Home - Expense Tracker API",
    description="Full-stack donation and expense tracking API for Usmania Children Home",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "https://usmania-children-home.vercel.app",
    "https://usmania-children-home-expense-track.vercel.app",
    "*",  # Allow all origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Mount local uploads directory for fallback access
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(persons.router)
app.include_router(entries.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "organization": "Usmania Children Home",
        "service": "Expense Tracker API",
        "status": "online",
        "docs_url": "/docs",
    }
