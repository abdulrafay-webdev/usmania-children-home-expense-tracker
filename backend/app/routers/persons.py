from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from app.database import get_session
from app.models import Person, Entry, Payment, utc_now
from app.schemas import (
    PersonCreate,
    PersonUpdate,
    PersonRead,
    PersonDetailRead,
    EntryRead,
    PaymentCreate,
    PaymentRead,
)
from app.pdf_generator import generate_person_pdf
from app.routers.auth import get_current_user_email
from app.routers.entries import to_entry_read

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
    # Strictly bind new person to the currently logged in user
    creation_date = payload.created_at or utc_now()
    person = Person(
        name=payload.name,
        contact=payload.contact,
        total_amount_given=payload.total_amount_given,
        created_by=current_user_email,
        created_at=creation_date,
    )
    session.add(person)
    session.commit()
    session.refresh(person)

    # If an initial contribution was specified, log it in the payment history
    if person.total_amount_given > 0:
        initial_payment = Payment(
            person_id=person.id,
            amount=person.total_amount_given,
            note="Initial Contribution",
            payment_date=creation_date,
            created_at=creation_date,
        )
        session.add(initial_payment)
        session.commit()

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

    payments_stmt = (
        select(Payment)
        .where(Payment.person_id == person_id)
        .order_by(Payment.payment_date.desc(), Payment.id.desc())
    )
    payments = session.exec(payments_stmt).all()

    total_spent = sum(e.quantity * e.price for e in entries)
    remaining = person.total_amount_given - total_spent

    entry_reads = [to_entry_read(e) for e in entries]
    payment_reads = [
        PaymentRead(
            id=p.id,
            person_id=p.person_id,
            amount=p.amount,
            note=p.note,
            payment_date=p.payment_date,
            created_at=p.created_at,
        )
        for p in payments
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
        payments=payment_reads,
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
    if payload.created_at is not None:
        person.created_at = payload.created_at

    if payload.total_amount_given is not None:
        person.total_amount_given = payload.total_amount_given
        # Keep initial payment in sync if only 1 payment exists
        existing_pmts = session.exec(select(Payment).where(Payment.person_id == person.id)).all()
        if len(existing_pmts) <= 1:
            if existing_pmts:
                existing_pmts[0].amount = payload.total_amount_given
                session.add(existing_pmts[0])
            elif payload.total_amount_given > 0:
                new_pmt = Payment(
                    person_id=person.id,
                    amount=payload.total_amount_given,
                    note="Initial Contribution",
                    payment_date=person.created_at,
                    created_at=person.created_at,
                )
                session.add(new_pmt)

    session.add(person)
    session.commit()
    session.refresh(person)

    entries_stmt = select(Entry).where(Entry.person_id == person.id)
    entries = session.exec(entries_stmt).all()
    return compute_person_read(person, entries)


@router.post("/{person_id}/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def add_person_payment(
    person_id: int,
    payload: PaymentCreate,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    payment_dt = payload.payment_date or utc_now()
    payment = Payment(
        person_id=person.id,
        amount=payload.amount,
        note=payload.note.strip() if payload.note else None,
        payment_date=payment_dt,
        created_at=utc_now(),
    )
    session.add(payment)
    session.commit()

    # Recalculate person's total_amount_given from all payments
    all_pmts = session.exec(select(Payment).where(Payment.person_id == person.id)).all()
    person.total_amount_given = sum(p.amount for p in all_pmts)
    session.add(person)
    session.commit()
    session.refresh(payment)

    return PaymentRead(
        id=payment.id,
        person_id=payment.person_id,
        amount=payment.amount,
        note=payment.note,
        payment_date=payment.payment_date,
        created_at=payment.created_at,
    )


@router.delete("/{person_id}/payments/{payment_id}", status_code=status.HTTP_200_OK)
def delete_person_payment(
    person_id: int,
    payment_id: int,
    session: Session = Depends(get_session),
    current_user_email: str = Depends(get_current_user_email),
):
    person = session.get(Person, person_id)
    if not person or person.created_by != current_user_email:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Person with ID {person_id} not found",
        )

    payment = session.get(Payment, payment_id)
    if not payment or payment.person_id != person_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment record with ID {payment_id} not found",
        )

    session.delete(payment)
    session.commit()

    # Recalculate person's total_amount_given
    all_pmts = session.exec(select(Payment).where(Payment.person_id == person.id)).all()
    person.total_amount_given = sum(p.amount for p in all_pmts)
    session.add(person)
    session.commit()

    return {
        "message": "Payment record deleted successfully",
        "new_total_amount_given": person.total_amount_given,
    }


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

    # Delete all associated payments
    payments_stmt = select(Payment).where(Payment.person_id == person_id)
    payments = session.exec(payments_stmt).all()
    for payment in payments:
        session.delete(payment)

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

    payments_stmt = (
        select(Payment)
        .where(Payment.person_id == person_id)
        .order_by(Payment.payment_date.asc(), Payment.id.asc())
    )
    payments = session.exec(payments_stmt).all()

    pdf_buffer = generate_person_pdf(person, entries, payments)

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
