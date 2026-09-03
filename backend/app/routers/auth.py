import hmac
import hashlib
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Admin credentials requested by user
ADMIN_EMAIL = "saifurrehman@gmail.com"
ADMIN_PASSWORD = "Saif@1234"
ADMIN_NAME = "Saif Ur Rehman"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    email: str
    name: str
    role: str

class LoginResponse(BaseModel):
    status: str
    token: str
    user: UserProfile

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    input_email = payload.email.strip().lower()
    input_password = payload.password.strip()

    # Constant-time comparison to protect against timing attacks
    email_match = hmac.compare_digest(input_email, ADMIN_EMAIL.lower())
    password_match = hmac.compare_digest(input_password, ADMIN_PASSWORD)

    if not (email_match and password_match):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    # Generate a deterministic session token
    token_seed = f"{ADMIN_EMAIL}:{ADMIN_PASSWORD}:usmania-children-home"
    token = hashlib.sha256(token_seed.encode()).hexdigest()

    return LoginResponse(
        status="authenticated",
        token=f"uch_{token}",
        user=UserProfile(
            email=ADMIN_EMAIL,
            name=ADMIN_NAME,
            role="Administrator",
        ),
    )

@router.get("/me", response_model=UserProfile)
def get_current_user():
    return UserProfile(
        email=ADMIN_EMAIL,
        name=ADMIN_NAME,
        role="Administrator",
    )
