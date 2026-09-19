import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_service import send_estimate_proposal_email

async def test_resend():
    print("Testing Resend email service with provided API key...")
    # Load sample PDF
    pdf_path = "static/uploads/estimates/Proposal_DRAFT_20260919_143459.pdf"
    if not os.path.exists(pdf_path):
        # find any pdf
        for f in os.listdir("static/uploads/estimates"):
            if f.endswith(".pdf"):
                pdf_path = os.path.join("static/uploads/estimates", f)
                break

    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    print(f"Loaded PDF attachment: {pdf_path} ({len(pdf_bytes):,} bytes)")

    # Send test email
    res = await send_estimate_proposal_email(
        to_email="delivered@resend.dev", # resend.dev test recipient that always succeeds on sandbox
        customer_name="David Martinez",
        estimate_number="EST-2026-TEST",
        pdf_bytes=pdf_bytes,
        pdf_filename="RiseUp_Roofing_Proposal_EST-2026-TEST.pdf",
        custom_message="Please find your official 2-page proposal attached with locked-in pricing.",
    )

    print("Resend response:", res)

if __name__ == "__main__":
    asyncio.run(test_resend())
