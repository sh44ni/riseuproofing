import base64
import os
from typing import Dict, Any, Optional, List
import httpx
from app.core.config import settings

RESEND_API_URL = "https://api.resend.com/emails"

async def send_estimate_proposal_email(
    to_email: str,
    customer_name: str,
    estimate_number: str,
    pdf_bytes: bytes,
    pdf_filename: Optional[str] = None,
    subject: Optional[str] = None,
    custom_message: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Sends an estimate proposal email with the official PDF attached using the Resend API.
    """
    key = api_key or getattr(settings, "RESEND_API_KEY", "")
    if not key:
        raise ValueError("Resend API key is not configured.")

    if not pdf_filename:
        pdf_filename = f"RiseUp_Roofing_Proposal_{estimate_number}.pdf"

    if not subject:
        subject = f"Your Official Roofing Estimate & Proposal - Rise Up Roofing ({estimate_number})"

    # Encode PDF to base64 for Resend attachment
    encoded_pdf = base64.b64encode(pdf_bytes).decode("utf-8")

    # Email HTML body
    message_paragraphs = ""
    if custom_message and custom_message.strip():
        message_paragraphs = f"<div style='background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 16px 0; font-style: italic; color: #334155;'>{custom_message.strip()}</div>"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #0f172a; margin: 0; padding: 24px; background-color: #f1f5f9;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        <!-- Header Banner -->
        <div style="background-color: #091b36; padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
            Rise Up Roofing &amp; Construction
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #38bdf8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.15em;">
            Roofing | Solar | General Construction • Lic #1096492
          </p>
        </div>

        <!-- Body -->
        <div style="padding: 28px 24px;">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>{customer_name}</strong>,</p>
          <p style="font-size: 14px; color: #334155;">
            Thank you for considering <strong>Rise Up Roofing &amp; Construction</strong> for your roofing project. We have finalized your tailored, 2-page proposal detailing full project specifications, high-grade underlayment options, and our 20-day Lock-In savings.
          </p>

          {message_paragraphs}

          <div style="margin: 24px 0; padding: 16px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
            <div style="font-size: 12px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.05em;">
              Proposal Attachment Included
            </div>
            <div style="font-size: 13px; color: #15803d; margin-top: 4px;">
              Your official 2-page proposal document (<strong>{pdf_filename}</strong>) is attached to this email for your records and review.
            </div>
          </div>

          <p style="font-size: 14px; color: #334155;">
            Please review the attached PDF at your convenience. Should you have any questions or wish to secure your scheduling window, simply reply directly to this email or call our team at <strong>(760) 622 - 1230</strong>.
          </p>

          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            <strong>Rise Up Roofing &amp; Construction</strong><br>
            2182 S El Camino Real, Ste 202, Oceanside, CA 92054<br>
            Phone: (760) 622 - 1230 • Email: marc@riseuprac.com<br>
            Website: <a href="https://riseuprac.com" style="color: #0284c7; text-decoration: none;">https://riseuprac.com</a>
          </div>
        </div>

        <!-- Trust Badges Strip -->
        <div style="background-color: #f8fafc; padding: 12px 24px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.06em;">
          Owens Corning Preferred Contractor &bull; Veteran Owned &bull; BBB A+ Accredited
        </div>
      </div>
    </body>
    </html>
    """

    # From address: Resend verified custom domain
    from_email = getattr(settings, "RESEND_FROM_EMAIL", "Rise Up Roofing <estimates@riseuprac.com>")

    resend_payload = {
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
        "attachments": [
            {
                "filename": pdf_filename,
                "content": encoded_pdf,
            }
        ],
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(RESEND_API_URL, json=resend_payload, headers=headers)
        if resp.status_code in (200, 201):
            return {
                "success": True,
                "data": resp.json(),
                "recipient": to_email,
                "filename": pdf_filename,
            }
        else:
            error_data = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {"error": resp.text}
            return {
                "success": False,
                "status_code": resp.status_code,
                "error": error_data,
                "recipient": to_email,
            }
