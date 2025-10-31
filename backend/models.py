from pydantic import BaseModel, EmailStr
from typing import Optional
from passlib.context import CryptContext
from datetime import datetime, date

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------- AUTH -----------

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    hashed_password: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ----------- SUBSCRIPTIONS -----------

class SubscriptionBase(BaseModel):
    title: str
    amount: float
    renewal_date: str  # e.g. "2025-06-15"
    category: Optional[str] = "Øvrige"
    logo_url: Optional[str] = None
    currency: Optional[str] = "DKK"
    transaction_date: Optional[str] = None  # Date of the actual transaction from bank data
    frequency: Optional[str] = "måned"  # Payment frequency
    source: Optional[str] = "manual"  # manual, tink, pdf, email
    confidence_score: Optional[int] = None  # AI confidence (0-100)
    notes: Optional[str] = None

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionInDB(SubscriptionBase):
    id: int
    owner_id: int
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------- PASSWORD UTILS -----------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
