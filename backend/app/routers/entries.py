import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.database import get_session
from app.models import Person, Entry
from app.schemas import EntryCreate, EntryUpdate, EntryRead
from app.routers.auth import get_current_user_email

router = APIRouter(tags=["Entries"])


def get_entry_invoice_urls(entry: Entry) -> List[str]:
    urls: List[str] = []
    if entry.invoice_urls:
        try:
            parsed = json.loads(entry.invoice_urls)
            if isinstance(parsed, list):
                urls.extend([u for u in parsed if isinstance(u, str) and u.strip()])
            elif isinstance(parsed, str) and parsed.strip():
                urls.append(parsed.strip())
        except Exception:
            urls.extend([u.strip() for u in entry.invoice_urls.split(",") if u.strip()])
    if not urls and entry.invoice_url and entry.invoice_url.strip():
        urls.append(entry.invoice_url.strip())
    return urls


def to_entry_read(entry: Entry) -> EntryRead:
    urls = get_entry_invoice_urls(entry)
    primary_url = urls[0] if urls else entry.invoice_url
    return EntryRead(
        id=entry.id,
        person_id=entry.person_id,
        item_name=entry.item_name,
        quantity=entry.quantity,
        item_quality=entry.item_quality,
        price=entry.price,
        line_total=round(entry.quantity * entry.price, 2),
        note=entry.note,
        invoice_url=primary_url,
        invoice_file_id=entry.invoice_file_id,
        invoice_urls=urls,
        created_at=entry.created_at,
    )


@router.post(
    "/persons/{person_id}/entries",
    response_model=EntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_entry(
    person_id: int,
    payload: EntryCreate,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    inv_urls = payload.invoice_urls or []
    if not inv_urls and payload.invoice_url:
        inv_urls = [payload.invoice_url]
    
    primary_url = inv_urls[0] if inv_urls else payload.invoice_url
    inv_urls_str = json.dumps(inv_urls) if inv_urls else None

    entry = Entry(
        person_id=person_id,
        item_name=payload.item_name,
        quantity=payload.quantity,
        item_quality=payload.item_quality,
        price=payload.price,
        note=payload.note,
        invoice_url=primary_url,
        invoice_file_id=payload.invoice_file_id,
        invoice_urls=inv_urls_str,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)

    return to_entry_read(entry)


@router.put("/entries/{entry_id}", response_model=EntryRead)
def update_entry(
    entry_id: int,
    payload: EntryUpdate,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    entry = session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} not found",
        )

    person = session.get(Person, entry.person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} not found",
        )

    if payload.item_name is not None:
        entry.item_name = payload.item_name
    if payload.quantity is not None:
        entry.quantity = payload.quantity
    if payload.item_quality is not None:
        entry.item_quality = payload.item_quality
    if payload.price is not None:
        entry.price = payload.price
    if payload.note is not None:
        entry.note = payload.note

    if payload.invoice_urls is not None:
        inv_urls = [u for u in payload.invoice_urls if u and u.strip()]
        entry.invoice_urls = json.dumps(inv_urls) if inv_urls else None
        entry.invoice_url = inv_urls[0] if inv_urls else None
    elif payload.invoice_url is not None:
        entry.invoice_url = payload.invoice_url
        entry.invoice_urls = json.dumps([payload.invoice_url]) if payload.invoice_url else None

    if payload.invoice_file_id is not None:
        entry.invoice_file_id = payload.invoice_file_id

    session.add(entry)
    session.commit()
    session.refresh(entry)

    return to_entry_read(entry)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_200_OK)
def delete_entry(
    entry_id: int,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    entry = session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} not found",
        )

    person = session.get(Person, entry.person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} not found",
        )

    session.delete(entry)
    session.commit()
    return {"message": f"Entry '{entry.item_name}' was deleted successfully."}
