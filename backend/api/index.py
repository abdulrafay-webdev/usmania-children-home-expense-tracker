import sys
import os

# Ensure the backend directory is in the Python path for Vercel serverless function execution
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.abspath(os.path.join(current_dir, ".."))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from app.main import app  # ASGI app callable for Vercel
