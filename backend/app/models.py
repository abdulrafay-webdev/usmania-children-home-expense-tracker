from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Person(SQLModel, table=True):
    __tablename__ = "person"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    contact: Optional[str] = Field(default=None)
    total_amount_given: float = Field(default=0.0, ge=0.0)
    created_at: datetime = Field(default_factory=utc_now)

    entries: List["Entry"] = Relationship(back_populates="person", cascade_delete=True)

class Entry(SQLModel, table=True):
    __tablename__ = "entry"

    id: Optional[int] = Field(default=None, primary_key=True)
    person_id: int = Field(foreign_key="person.id", index=True, ondelete="CASCADE")
    item_name: str
    quantity: float = Field(default=1.0, gt=0.0)
    item_quality: Optional[str] = Field(default=None)
    price: float = Field(default=0.0, ge=0.0)
    note: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=utc_now)

    person: Optional[Person] = Relationship(back_populates="entries")
