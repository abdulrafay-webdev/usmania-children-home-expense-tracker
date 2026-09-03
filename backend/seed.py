"""
Seed script to populate initial sample persons and expense entries
for Usmania Children Home.
Run with:
    python seed.py
"""
from datetime import datetime, timezone
from sqlmodel import Session, select
from app.database import engine, init_db
from app.models import Person, Entry

def seed_data():
    init_db()
    with Session(engine) as session:
        # Check if persons already exist
        existing = session.exec(select(Person)).first()
        if existing:
            print("Database already contains data. Skipping seeding.")
            return

        print("Seeding sample persons and expense entries for Usmania Children Home...")

        # Person 1
        p1 = Person(
            name="Haji Muhammad Rashid",
            contact="0300-4567891",
            total_amount_given=120000.0,
            created_at=datetime.now(timezone.utc),
        )
        session.add(p1)
        session.commit()
        session.refresh(p1)

        entries_p1 = [
            Entry(
                person_id=p1.id,
                item_name="Flour & Wheat Bags (20kg)",
                quantity=10.0,
                item_quality="Premium Grade A",
                price=2600.0,
                note="Monthly ration for main orphan kitchen",
                created_at=datetime.now(timezone.utc),
            ),
            Entry(
                person_id=p1.id,
                item_name="Cooking Oil Tins (16 Liters)",
                quantity=4.0,
                item_quality="Branded / First Quality",
                price=8500.0,
                note="Kitchen cooking supplies",
                created_at=datetime.now(timezone.utc),
            ),
            Entry(
                person_id=p1.id,
                item_name="Sugar Bags (50kg)",
                quantity=1.0,
                item_quality="White Crystal",
                price=7200.0,
                note="Breakfast & tea for children",
                created_at=datetime.now(timezone.utc),
            ),
        ]
        session.add_all(entries_p1)

        # Person 2
        p2 = Person(
            name="Syed Tariq Mahmood",
            contact="0321-7654321",
            total_amount_given=75000.0,
            created_at=datetime.now(timezone.utc),
        )
        session.add(p2)
        session.commit()
        session.refresh(p2)

        entries_p2 = [
            Entry(
                person_id=p2.id,
                item_name="School Uniforms (Sets)",
                quantity=15.0,
                item_quality="Custom Stitched",
                price=2200.0,
                note="For primary class students",
                created_at=datetime.now(timezone.utc),
            ),
            Entry(
                person_id=p2.id,
                item_name="School Shoes & Socks",
                quantity=15.0,
                item_quality="Service / Bata Quality",
                price=1800.0,
                note="Standard black school footwear",
                created_at=datetime.now(timezone.utc),
            ),
        ]
        session.add_all(entries_p2)

        # Person 3
        p3 = Person(
            name="Al-Khidmat Welfare Trust",
            contact="042-35800000",
            total_amount_given=200000.0,
            created_at=datetime.now(timezone.utc),
        )
        session.add(p3)
        session.commit()
        session.refresh(p3)

        entries_p3 = [
            Entry(
                person_id=p3.id,
                item_name="Medical Health Checkups & Vitamins",
                quantity=40.0,
                item_quality="Pediatric Supplements",
                price=650.0,
                note="Quarterly general health checkup",
                created_at=datetime.now(timezone.utc),
            ),
            Entry(
                person_id=p3.id,
                item_name="Textbooks & Stationary Packs",
                quantity=40.0,
                item_quality="Punjab Textbook Board",
                price=1400.0,
                note="New academic session books & notebooks",
                created_at=datetime.now(timezone.utc),
            ),
        ]
        session.add_all(entries_p3)

        session.commit()
        print("Sample data successfully seeded!")

if __name__ == "__main__":
    seed_data()
