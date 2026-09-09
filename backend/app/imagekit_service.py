import os
import io
import time
import base64
import httpx
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

IMAGEKIT_PRIVATE_KEY = os.getenv("IMAGEKIT_PRIVATE_KEY", "").strip()
IMAGEKIT_PUBLIC_KEY = os.getenv("IMAGEKIT_PUBLIC_KEY", "").strip()
IMAGEKIT_URL_ENDPOINT = os.getenv("IMAGEKIT_URL_ENDPOINT", "").strip()

# Local upload directory fallback for offline development (/tmp on Vercel)
if os.environ.get("VERCEL"):
    UPLOAD_DIR = "/tmp/uploads"
else:
    UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")

def is_imagekit_configured() -> bool:
    return bool(IMAGEKIT_PRIVATE_KEY and IMAGEKIT_PUBLIC_KEY and IMAGEKIT_URL_ENDPOINT)

def upload_invoice_image(
    file_bytes: bytes,
    original_filename: str,
    base_request_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Upload an invoice image to ImageKit.
    If ImageKit credentials are not configured, saves locally as fallback.
    """
    safe_name = "".join(c for c in original_filename if c.isalnum() or c in "._- ")
    if not safe_name:
        safe_name = f"invoice_{int(time.time())}.jpg"

    # 1. Upload to ImageKit if credentials are provided
    if is_imagekit_configured():
        try:
            from imagekitio import ImageKit
            ik = ImageKit(
                private_key=IMAGEKIT_PRIVATE_KEY,
                public_key=IMAGEKIT_PUBLIC_KEY,
                url_endpoint=IMAGEKIT_URL_ENDPOINT
            )
            response = ik.files.upload(
                file=file_bytes,
                file_name=safe_name,
                folder="/usmania_invoices",
                use_unique_file_name=True,
                tags=["usmania", "invoice", "receipt"]
            )
            return {
                "url": response.url,
                "file_id": getattr(response, "file_id", str(time.time())),
                "provider": "imagekit",
                "message": "Uploaded to ImageKit successfully"
            }
        except Exception as e:
            # If ImageKit SDK errors, try direct ImageKit REST API with Basic Auth
            try:
                auth_str = base64.b64encode(f"{IMAGEKIT_PRIVATE_KEY}:".encode()).decode()
                headers = {"Authorization": f"Basic {auth_str}"}
                files = {"file": (safe_name, file_bytes)}
                data = {
                    "fileName": safe_name,
                    "folder": "/usmania_invoices",
                    "useUniqueFileName": "true",
                }
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(
                        "https://upload.imagekit.io/api/v1/files/upload",
                        headers=headers,
                        files=files,
                        data=data
                    )
                    if resp.status_code in (200, 201):
                        resp_data = resp.json()
                        return {
                            "url": resp_data.get("url"),
                            "file_id": resp_data.get("fileId", str(time.time())),
                            "provider": "imagekit",
                            "message": "Uploaded to ImageKit successfully via REST API"
                        }
                    else:
                        print(f"ImageKit REST API error ({resp.status_code}): {resp.text}")
            except Exception as rest_err:
                print(f"ImageKit REST upload fallback failed: {rest_err}")
            print(f"ImageKit upload failed ({e}), using local fallback storage.")

    # 2. Fallback: Save locally if offline or no keys configured
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(safe_name)[1] or ".jpg"
    unique_name = f"inv_{int(time.time())}_{os.urandom(4).hex()}{ext}"
    local_path = os.path.join(UPLOAD_DIR, unique_name)
    with open(local_path, "wb") as f:
        f.write(file_bytes)

    # Build access URL
    host = base_request_url.rstrip("/") if base_request_url else "http://localhost:8000"
    local_url = f"{host}/uploads/{unique_name}"

    return {
        "url": local_url,
        "file_id": unique_name,
        "provider": "local",
        "message": "Saved to local uploads (Configure IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT in .env for ImageKit CDN)"
    }
