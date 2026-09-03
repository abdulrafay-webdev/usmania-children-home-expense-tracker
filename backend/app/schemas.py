from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

class PersonBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Name of person")
    contact: Optional[str] = Field(default=None, max_length=100, description="Phone or contact info")
    total_amount_given: float = Field(default=0.0, ge=0.0, description="Total amount contributed")

    @field_validator("name")
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be blank")
        return v

class PersonCreate(PersonBase):
    pass

class PersonUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    contact: Optional[str] = Field(default=None, max_length=100)
    total_amount_given: Optional[float] = Field(default=None, ge=0.0)

    @field_validator("name")
    def name_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Name cannot be blank")
        return v

class EntryBase(BaseModel):
    item_name: str = Field(..., min_length=1, max_length=255, description="Item or expense description")
    quantity: float = Field(..., gt=0.0, description="Quantity (must be greater than 0)")
    item_quality: Optional[str] = Field(default=None, max_length=100, description="e.g. Branded, Local, High grade")
    price: float = Field(..., ge=0.0, description="Unit price or rate")
    note: Optional[str] = Field(default=None, max_length=1000, description="Optional notes")

    @field_validator("item_name")
    def item_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Item name cannot be blank")
        return v

class EntryCreate(EntryBase):
    pass

class EntryUpdate(BaseModel):
    item_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    quantity: Optional[float] = Field(default=None, gt=0.0)
    item_quality: Optional[str] = Field(default=None, max_length=100)
    price: Optional[float] = Field(default=None, ge=0.0)
    note: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("item_name")
    def item_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Item name cannot be blank")
        return v

class EntryRead(BaseModel):
    id: int
    person_id: int
    item_name: str
    quantity: float
    item_quality: Optional[str] = None
    price: float
    line_total: float
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PersonRead(BaseModel):
    id: int
    name: str
    contact: Optional[str] = None
    total_amount_given: float
    created_at: datetime
    total_spent: float
    remaining_balance: float
    entries_count: int

    class Config:
        from_attributes = True

class PersonDetailRead(PersonRead):
    entries: List[EntryRead] = []

class RecentEntry(EntryRead):
    person_name: str

class DashboardSummary(BaseModel):
    total_persons: int
    total_amount_collected: float
    total_spent: float
    total_remaining: float
    recent_entries: List[RecentEntry] = []
    recent_persons: List[PersonRead] = []
