import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pdf_generator import (
    generate_estimate_proposal_pdf,
    save_estimate_pdf_file,
    STATIC_UPLOADS_DIR,
)

SAMPLE_PROPOSAL_DATA = {
    "proposal_date": "08/27/2026",
    "customer_name": "David Martinez",
    "customer_phone": "(760) 555-0199",
    "customer_email": "david.martinez@gmail.com",
    "customer_address": "742 Evergreen Terrace",
    "customer_city": "Escondido, CA 92025",
    "roof_squares": 25.0,
    "roof_pitch": "4:12 Pitch",
    "stories": "1 Story",
    "hero_photo_url": "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80",
    "option_a": {
        "title": "TILE ROOF LIFT & RELAY",
        "subtitle": "REUSE EXISTING TILES",
        "lock_in_price": 26870,
        "standard_price": 31500,
        "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
        "scope_items": [
            "Remove and carefully stage existing roof tiles for reuse.",
            "Remove and dispose of existing underlayment.",
            "Inspect decking and replace up to 3 sheets of plywood as needed.",
            "Install new tile roof underlayment.",
            "Install new flashings, drip edge metal, valley metals, and other necessary metals.",
            "Reinstall existing roof tiles.",
            "Replace broken or unusable tiles up to 10% of existing tiles.",
            "Reseal all roof vents and penetrations.",
            "Paint vent components to match existing tile color.",
            "Clean up and remove all debris.",
            "Final inspection and quality walkthrough.",
        ],
    },
    "option_b": {
        "title": "COMPLETE NEW TILE ROOF SYSTEM",
        "subtitle": "100% NEW TILE INSTALLATION",
        "lock_in_price": 32410,
        "standard_price": 37200,
        "warranty": "10 YEAR WORKMANSHIP | 30 YEAR MANUFACTURER",
        "scope_items": [
            "Remove and dispose of 100% of existing roof tiles.",
            "Remove and dispose of existing underlayment.",
            "Inspect decking and replace up to 4 sheets of plywood as needed.",
            "Install new tile roof underlayment.",
            "Install new flashings, drip edge metal, valley metals, and other necessary metals.",
            "Install 100% brand-new roof tiles (homeowner to select style & color).",
            "Properly install and secure new tile roofing system.",
            "Reseal all roof vents and penetrations.",
            "Paint vent components to match new tile color.",
            "Clean up and remove all debris.",
            "Final inspection and quality walkthrough.",
        ],
    },
    "addon_1": {
        "title": "PREMIUM PSU / PEEL-AND-STICK (TILESEAL) UNDERLAYMENT UPGRADE",
        "description": "Upgrade the standard underlayment to a premium self-adhered peel-and-stick system, such as TileSeal or approved equivalent. Provides a fully adhered secondary water-resistant barrier and improved sealing around fastener penetrations.",
        "price": 2000,
    },
    "addon_2": {
        "title": "PRESSURE WASHING ADD-ON",
        "description": "Professional soft wash of roof tiles, exterior surfaces, walkways, and driveway to remove dirt, mold, mildew, and algae.",
        "price": 3500,
    },
}

async def run_tests():
    print("==================================================")
    print("STARTING PLAYWRIGHT PDF GENERATION AUTOMATED TESTS")
    print("==================================================")

    # 1. Test Multi-Option Proposal
    print("\n[TEST 1] Generating Multi-Option Proposal (Featured Comparison)...")
    pdf_multi = await generate_estimate_proposal_pdf(SAMPLE_PROPOSAL_DATA, template_key="multi_option_proposal")
    assert len(pdf_multi) > 100_000, f"Multi-Option PDF too small: {len(pdf_multi)} bytes"
    saved_url_multi = save_estimate_pdf_file("TEST_MULTI_PROP", pdf_multi)
    print(f"[SUCCESS] Multi-Option PDF generated successfully: {len(pdf_multi):,} bytes")
    print(f"  Saved to: {saved_url_multi}")

    # 2. Test Standard 3-Page Estimate
    print("\n[TEST 2] Generating Standard Roofing Estimate (3-Page Format)...")
    pdf_std = await generate_estimate_proposal_pdf(SAMPLE_PROPOSAL_DATA, template_key="standard_roofing_estimate")
    assert len(pdf_std) > 50_000, f"Standard 3-Page PDF too small: {len(pdf_std)} bytes"
    saved_url_std = save_estimate_pdf_file("TEST_STD_3PAGE", pdf_std)
    print(f"[SUCCESS] Standard 3-Page PDF generated successfully: {len(pdf_std):,} bytes")
    print(f"  Saved to: {saved_url_std}")

    print("\n==================================================")
    print("ALL PLAYWRIGHT PDF GENERATION TESTS PASSED (2/2)!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
