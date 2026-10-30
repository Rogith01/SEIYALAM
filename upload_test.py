import os
import requests

token = os.environ.get("SEIYALAM_TOKEN")

with open("test-knowledge.pdf", "rb") as pdf:
    response = requests.post(
        "http://127.0.0.1:8000/api/knowledge/documents/",
        headers={"Authorization": "Bearer " + token},
        data={
            "title": "SEIYALAM Test Document",
            "description": "Testing knowledge document upload",
            "company_id": "30001",
        },
        files={"file": ("test-knowledge.pdf", pdf, "application/pdf")},
    )

print("Status:", response.status_code)
print("Response:", response.text)
