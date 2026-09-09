from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from app.imagekit_service import upload_invoice_image, is_imagekit_configured

router = APIRouter(prefix="/upload", tags=["Uploads"])

@router.get("/status")
def get_upload_status():
    return {
        "imagekit_configured": is_imagekit_configured(),
        "provider": "imagekit" if is_imagekit_configured() else "local_fallback"
    }

@router.post("/invoice")
async def upload_invoice(
    request: Request,
    file: UploadFile = File(...)
):
    # Validate content type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif", "application/pdf"]
    content_type = file.content_type or ""
    if content_type.lower() not in allowed_types and not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf")):
        raise HTTPException(
            status_code=400,
            detail="Only image files (JPG, PNG, WEBP, GIF) or PDF invoices are supported."
        )

    # Read bytes with size limit (max 15 MB)
    max_bytes = 15 * 1024 * 1024
    file_bytes = await file.read()
    if len(file_bytes) > max_bytes:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 15MB.")

    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    base_url = str(request.base_url)
    result = upload_invoice_image(
        file_bytes=file_bytes,
        original_filename=file.filename or "invoice.jpg",
        base_request_url=base_url
    )

    return result
