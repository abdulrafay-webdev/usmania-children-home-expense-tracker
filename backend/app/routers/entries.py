from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.database import get_session
from app.models import Person, Entry
from app.schemas import EntryCreate, EntryUpdate, EntryRead

router = APIRouter(tags=["Entries"])


def to_entry_read(entry: Entry) -> EntryRead:
    return EntryRead(
        id=entry.id,
        person_id=entry.person_id,
        item_name=entry.item_name,
        quantity=entry.quantity,
        item_quality=entry.item_quality,
        price=entry.price,
        line_total=round(entry.quantity * entry.price, 2),
        note=entry.note,
        invoice_url=entry.invoice_url,
        invoice_file_id=entry.invoice_file_id,
        created_at=entry.created_at,
    )


@router.post(
    "/persons/{person_id}/entries",
    response_model=EntryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_entry(
    person_id: int, payload: EntryCreate, session: Session = Depends(get_session)
):
    person = session.get(Person, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    entry = Entry(
        person_id=person_id,
        item_name=payload.item_name,
        quantity=payload.quantity,
        item_quality=payload.item_quality,
        price=payload.price,
        note=payload.note,
        invoice_url=payload.invoice_url,
        invoice_file_id=payload.invoice_file_id,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)

    return to_entry_read(entry)


@router.put("/entries/{entry_id}", response_model=EntryRead)
def update_entry(
    entry_id: int, payload: EntryUpdate, session: Session = Depends(get_session)
):
    entry = session.get(Entry, entry_id)
    if not entry:
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
    if payload.invoice_url is not None:
        entry.invoice_url = payload.invoice_url
    if payload.invoice_file_id is not None:
        entry.invoice_file_id = payload.invoice_file_id

    session.add(entry)
    session.commit()
    session.refresh(entry)

    return to_entry_read(entry)


@router.delete("/entries/{entry_id}", status_code=status.HTTP_200_OK)
def delete_entry(entry_id: int, session: Session = Depends(get_session)):
    entry = session.get(Entry, entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry with ID {entry_id} not found",
        )

    session.delete(entry)
    session.commit()
    return {"message": f"Entry '{entry.item_name}' was deleted successfully."}
