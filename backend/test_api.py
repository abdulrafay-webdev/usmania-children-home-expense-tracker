import io
from fastapi.testclient import TestClient
from app.main import app
from app.database import init_db

# Initialize database schema
init_db()

client = TestClient(app)

def test_full_flow():
    print("--- 1. Testing Root Endpoint ---")
    res = client.get("/")
    assert res.status_code == 200
    print("Root response:", res.json())

    print("\n--- 2. Testing Create Person ---")
    person_payload = {
        "name": "Haji Muhammad Iqbal",
        "contact": "0300-9876543",
        "total_amount_given": 150000.0,
    }
    res = client.post("/persons", json=person_payload)
    assert res.status_code == 201, res.text
    person_data = res.json()
    person_id = person_data["id"]
    print(f"Created person #{person_id}: {person_data['name']}, Given: {person_data['total_amount_given']}, Spent: {person_data['total_spent']}, Remaining: {person_data['remaining_balance']}")
    assert person_data["total_spent"] == 0.0
    assert person_data["remaining_balance"] == 150000.0

    print("\n--- 3. Testing Validation (Negative amount / Empty name) ---")
    invalid_res = client.post("/persons", json={"name": "", "total_amount_given": -50})
    assert invalid_res.status_code == 422
    print("Invalid person creation rejected with status 422 as expected.")

    print("\n--- 4. Testing Add Entries Under Person ---")
    entry_1 = {
        "item_name": "Wheat Flour Bags (20kg)",
        "quantity": 10.0,
        "item_quality": "Grade A Super Fine",
        "price": 2800.0,
        "note": "For kitchen breakfast & dinner ration",
    }
    res_e1 = client.post(f"/persons/{person_id}/entries", json=entry_1)
    assert res_e1.status_code == 201, res_e1.text
    e1_data = res_e1.json()
    e1_id = e1_data["id"]
    print(f"Added Entry #{e1_id}: {e1_data['item_name']} - Line Total: {e1_data['line_total']} (Expected: 28,000.0)")
    assert e1_data["line_total"] == 28000.0

    entry_2 = {
        "item_name": "Winter Warm Blankets",
        "quantity": 25.0,
        "item_quality": "Double Ply Premium",
        "price": 3200.0,
        "note": "Distributed to orphan children rooms",
    }
    res_e2 = client.post(f"/persons/{person_id}/entries", json=entry_2)
    assert res_e2.status_code == 201
    e2_data = res_e2.json()
    e2_id = e2_data["id"]
    print(f"Added Entry #{e2_id}: {e2_data['item_name']} - Line Total: {e2_data['line_total']} (Expected: 80,000.0)")
    assert e2_data["line_total"] == 80000.0

    print("\n--- 5. Testing Get Person Detail & Computed Balance ---")
    res_detail = client.get(f"/persons/{person_id}")
    assert res_detail.status_code == 200
    detail = res_detail.json()
    expected_spent = 28000.0 + 80000.0 # 108,000.0
    expected_remaining = 150000.0 - 108000.0 # 42,000.0
    print(f"Detail check: Total Given = {detail['total_amount_given']}, Total Spent = {detail['total_spent']}, Remaining = {detail['remaining_balance']}")
    assert detail["total_spent"] == expected_spent
    assert detail["remaining_balance"] == expected_remaining
    assert len(detail["entries"]) == 2

    print("\n--- 6. Testing Edit Entry ---")
    res_edit_entry = client.put(f"/entries/{e1_id}", json={"quantity": 12.0})
    assert res_edit_entry.status_code == 200
    updated_e1 = res_edit_entry.json()
    assert updated_e1["quantity"] == 12.0
    assert updated_e1["line_total"] == 33600.0
    print(f"Updated Entry #{e1_id} quantity to 12.0, new line total: {updated_e1['line_total']}")

    print("\n--- 7. Testing Dashboard Summary ---")
    res_summary = client.get("/summary")
    assert res_summary.status_code == 200
    summary = res_summary.json()
    print(f"Summary: Persons={summary['total_persons']}, Collected={summary['total_amount_collected']}, Spent={summary['total_spent']}, Remaining={summary['total_remaining']}")
    assert summary["total_persons"] >= 1
    assert summary["total_amount_collected"] >= 150000.0

    print("\n--- 8. Testing PDF Export Endpoint ---")
    res_pdf = client.get(f"/persons/{person_id}/pdf")
    assert res_pdf.status_code == 200
    assert res_pdf.headers["content-type"] == "application/pdf"
    pdf_bytes = res_pdf.content
    assert pdf_bytes.startswith(b"%PDF"), "PDF stream must start with %PDF header"
    print(f"PDF exported successfully! Header: {res_pdf.headers.get('content-disposition')}, File Size: {len(pdf_bytes)} bytes")

    print("\n--- 9. Testing Delete Entry ---")
    res_del_entry = client.delete(f"/entries/{e2_id}")
    assert res_del_entry.status_code == 200
    print(f"Deleted Entry #{e2_id}:", res_del_entry.json())

    # Check updated balance after deleting entry
    res_after_del = client.get(f"/persons/{person_id}")
    assert len(res_after_del.json()["entries"]) == 1
    print(f"Balance after entry deletion: Spent = {res_after_del.json()['total_spent']}, Remaining = {res_after_del.json()['remaining_balance']}")

    print("\n--- 10. Testing Delete Person (Cascade Delete) ---")
    res_del_person = client.delete(f"/persons/{person_id}")
    assert res_del_person.status_code == 200
    print(f"Deleted Person #{person_id}:", res_del_person.json())

    # Verify 404 on deleted person
    assert client.get(f"/persons/{person_id}").status_code == 404
    print("Verified person is no longer accessible (404).")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY! [SUCCESS]")

if __name__ == "__main__":
    test_full_flow()
