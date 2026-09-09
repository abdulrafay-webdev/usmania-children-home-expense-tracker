import hmac
import hashlib
from typing import Optional, Dict
from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Multi-Admin accounts
USERS: Dict[str, Dict[str, str]] = {
    "saifurrehman@gmail.com": {
        "name": "Saif Ur Rehman",
        "email": "saifurrehman@gmail.com",
        "password": "Saif@1234",
        "role": "Administrator",
    },
    "kaleemullah@gmail.com": {
        "name": "Kaleemullah",
        "email": "kaleemullah@gmail.com",
        "password": "Kaleemullah@1234",
        "role": "Administrator",
    },
    "asadullah@gmail.com": {
        "name": "Asadullah",
        "email": "asadullah@gmail.com",
        "password": "Asadullah@1234",
        "role": "Administrator",
    },
}

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

def get_current_user_email(
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    user_email: Optional[str] = None,
) -> str:
    """Extracts and normalizes the logged-in user email for data scoping."""
    candidate = (x_user_email or user_email or "saifurrehman@gmail.com").strip().lower()
    for email in USERS:
        if candidate == email.lower():
            return email
    return candidate

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    input_email = payload.email.strip().lower()
    input_password = payload.password.strip()

    matched_user = None
    for email_key, udata in USERS.items():
        if email_key.lower() == input_email:
            matched_user = udata
            break

    if not matched_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    # Constant-time comparison for password
    password_match = hmac.compare_digest(input_password, matched_user["password"])
    if not password_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials.",
        )

    # Generate a deterministic session token
    token_seed = f"{matched_user['email']}:{matched_user['password']}:usmania-children-home"
    token = hashlib.sha256(token_seed.encode()).hexdigest()

    return LoginResponse(
        status="authenticated",
        token=f"uch_{token}",
        user=UserProfile(
            email=matched_user["email"],
            name=matched_user["name"],
            role=matched_user["role"],
        ),
    )

@router.get("/me", response_model=UserProfile)
def get_current_user(current_email: str = Header("saifurrehman@gmail.com", alias="X-User-Email")):
    user_data = USERS.get(current_email.lower()) or USERS["saifurrehman@gmail.com"]
    return UserProfile(
        email=user_data["email"],
        name=user_data["name"],
        role=user_data["role"],
    )
