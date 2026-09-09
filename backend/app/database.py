import os
from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Fallback for local development if DATABASE_URL is not set
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./expense_tracker.db"

# Neon Postgres and generic PostgreSQL compatibility
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Handle SQLite vs Postgres connection arguments
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL / Neon Postgres
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_pre_ping=True,
        pool_recycle=300
    )

def init_db():
    SQLModel.metadata.create_all(engine)
    # Ensure newly added columns exist on existing database tables (Neon Postgres / SQLite)
    with Session(engine) as session:
        try:
            if DATABASE_URL.startswith("sqlite"):
                try:
                    session.connection().exec_driver_sql("ALTER TABLE entry ADD COLUMN invoice_url VARCHAR")
                except Exception:
                    pass
                try:
                    session.connection().exec_driver_sql("ALTER TABLE entry ADD COLUMN invoice_file_id VARCHAR")
                except Exception:
                    pass
                try:
                    session.connection().exec_driver_sql("ALTER TABLE person ADD COLUMN created_by VARCHAR DEFAULT 'saifurrehman@gmail.com'")
                except Exception:
                    pass
                try:
                    session.connection().exec_driver_sql("UPDATE person SET created_by = 'saifurrehman@gmail.com' WHERE created_by IS NULL")
                except Exception:
                    pass
            else:
                session.connection().exec_driver_sql("ALTER TABLE entry ADD COLUMN IF NOT EXISTS invoice_url VARCHAR")
                session.connection().exec_driver_sql("ALTER TABLE entry ADD COLUMN IF NOT EXISTS invoice_file_id VARCHAR")
                session.connection().exec_driver_sql("ALTER TABLE person ADD COLUMN IF NOT EXISTS created_by VARCHAR DEFAULT 'saifurrehman@gmail.com'")
                session.connection().exec_driver_sql("UPDATE person SET created_by = 'saifurrehman@gmail.com' WHERE created_by IS NULL")
                session.commit()
        except Exception:
            pass

def get_session():
    with Session(engine) as session:
        yield session
