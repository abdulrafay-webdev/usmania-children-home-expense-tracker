from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.database import get_session
from app.models import Person, Entry
from app.schemas import DashboardSummary, RecentEntry, PersonRead

router = APIRouter(tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(session: Session = Depends(get_session)):
    persons = session.exec(select(Person).order_by(Person.created_at.desc())).all()
    entries = session.exec(select(Entry).order_by(Entry.created_at.desc())).all()

    total_persons = len(persons)
    total_amount_collected = sum(p.total_amount_given for p in persons)
    total_spent = sum(e.quantity * e.price for e in entries)
    total_remaining = total_amount_collected - total_spent

    # Person map for fast lookup
    person_map = {p.id: p.name for p in persons}

    # Recent entries (last 10)
    recent_entries: List[RecentEntry] = []
    for e in entries[:10]:
        recent_entries.append(
            RecentEntry(
                id=e.id,
                person_id=e.person_id,
                person_name=person_map.get(e.person_id, "Unknown"),
                item_name=e.item_name,
                quantity=e.quantity,
                item_quality=e.item_quality,
                price=e.price,
                line_total=round(e.quantity * e.price, 2),
                note=e.note,
                created_at=e.created_at,
            )
        )

    # Recent persons (last 5)
    recent_persons: List[PersonRead] = []
    for p in persons[:5]:
        p_entries = [e for e in entries if e.person_id == p.id]
        p_spent = sum(e.quantity * e.price for e in p_entries)
        recent_persons.append(
            PersonRead(
                id=p.id,
                name=p.name,
                contact=p.contact,
                total_amount_given=p.total_amount_given,
                created_at=p.created_at,
                total_spent=round(p_spent, 2),
                remaining_balance=round(p.total_amount_given - p_spent, 2),
                entries_count=len(p_entries),
            )
        )

    return DashboardSummary(
        total_persons=total_persons,
        total_amount_collected=round(total_amount_collected, 2),
        total_spent=round(total_spent, 2),
        total_remaining=round(total_remaining, 2),
        recent_entries=recent_entries,
        recent_persons=recent_persons,
    )
