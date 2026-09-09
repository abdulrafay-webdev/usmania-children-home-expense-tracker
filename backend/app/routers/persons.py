from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.database import get_session
from app.models import Person, Entry
from app.schemas import (
    PersonCreate,
    PersonUpdate,
    PersonRead,
    PersonDetailRead,
    EntryRead,
)
from app.pdf_generator import generate_person_pdf
from app.routers.auth import get_current_user_email

router = APIRouter(prefix="/persons", tags=["Persons"])


def compute_person_read(person: Person, entries: List[Entry]) -> PersonRead:
    total_spent = sum(e.quantity * e.price for e in entries)
    remaining = person.total_amount_given - total_spent
    return PersonRead(
        id=person.id,
        name=person.name,
        contact=person.contact,
        total_amount_given=person.total_amount_given,
        created_at=person.created_at,
        created_by=getattr(person, "created_by", "saifurrehman@gmail.com") or "saifurrehman@gmail.com",
        total_spent=round(total_spent, 2),
        remaining_balance=round(remaining, 2),
        entries_count=len(entries),
    )


@router.post("", response_model=PersonRead, status_code=status.HTTP_201_CREATED)
def create_person(
    payload: PersonCreate,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    owner = payload.created_by or current_user_email
    person = Person(
        name=payload.name,
        contact=payload.contact,
        total_amount_given=payload.total_amount_given,
        created_by=owner,
    )
    session.add(person)
    session.commit()
    session.refresh(person)
    return compute_person_read(person, [])


@router.get("", response_model=List[PersonRead])
def list_persons(
    search: Optional[str] = Query(None, description="Search by person name or contact"),
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    query = select(Person).where(Person.created_by == current_user_email)
    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.where(
            (Person.name.ilike(search_pattern)) | (Person.contact.ilike(search_pattern))
        )
    query = query.order_by(Person.created_at.desc())
    persons = session.exec(query).all()

    results: List[PersonRead] = []
    for person in persons:
        entries_stmt = select(Entry).where(Entry.person_id == person.id)
        entries = session.exec(entries_stmt).all()
        results.append(compute_person_read(person, entries))

    return results


@router.get("/{person_id}", response_model=PersonDetailRead)
def get_person(
    person_id: int,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    entries_stmt = (
        select(Entry)
        .where(Entry.person_id == person_id)
        .order_by(Entry.created_at.desc())
    )
    entries = session.exec(entries_stmt).all()

    total_spent = sum(e.quantity * e.price for e in entries)
    remaining = person.total_amount_given - total_spent

    entry_reads = [
        EntryRead(
            id=e.id,
            person_id=e.person_id,
            item_name=e.item_name,
            quantity=e.quantity,
            item_quality=e.item_quality,
            price=e.price,
            line_total=round(e.quantity * e.price, 2),
            note=e.note,
            created_at=e.created_at,
        )
        for e in entries
    ]

    return PersonDetailRead(
        id=person.id,
        name=person.name,
        contact=person.contact,
        total_amount_given=person.total_amount_given,
        created_at=person.created_at,
        total_spent=round(total_spent, 2),
        remaining_balance=round(remaining, 2),
        entries_count=len(entries),
        entries=entry_reads,
    )


@router.put("/{person_id}", response_model=PersonRead)
def update_person(
    person_id: int,
    payload: PersonUpdate,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    if payload.name is not None:
        person.name = payload.name
    if payload.contact is not None:
        person.contact = payload.contact
    if payload.total_amount_given is not None:
        person.total_amount_given = payload.total_amount_given

    session.add(person)
    session.commit()
    session.refresh(person)

    entries_stmt = select(Entry).where(Entry.person_id == person.id)
    entries = session.exec(entries_stmt).all()
    return compute_person_read(person, entries)


@router.delete("/{person_id}", status_code=status.HTTP_200_OK)
def delete_person(
    person_id: int,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    # Delete all associated entries
    entries_stmt = select(Entry).where(Entry.person_id == person_id)
    entries = session.exec(entries_stmt).all()
    for entry in entries:
        session.delete(entry)

    session.delete(person)
    session.commit()
    return {"message": f"Person '{person.name}' and all associated entries were deleted successfully."}


@router.get("/{person_id}/pdf")
def export_person_pdf(
    person_id: int,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    entries_stmt = (
        select(Entry)
        .where(Entry.person_id == person_id)
        .order_by(Entry.created_at.asc())
    )
    entries = session.exec(entries_stmt).all()

    pdf_buffer = generate_person_pdf(person, entries)

    # Sanitize name for filename
    safe_name = "".join(c for c in person.name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
    filename = f"Usmania_Children_Home_Balance_Statement_{safe_name}_ID{person.id}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
