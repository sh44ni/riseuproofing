import os
import base64
from typing import Dict, Any
from datetime import datetime
from jinja2 import Environment, FileSystemLoader
from playwright.async_api import async_playwright

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates", "estimates")
STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
STATIC_UPLOADS_DIR = os.path.join(STATIC_DIR, "uploads", "estimates")

os.makedirs(STATIC_UPLOADS_DIR, exist_ok=True)

jinja_env = Environment(loader=FileSystemLoader(TEMPLATES_DIR), autoescape=True)

import mimetypes

def _to_data_uri(path_or_url: str) -> str:
    if not path_or_url:
        return path_or_url
    if path_or_url.startswith("data:") or path_or_url.startswith("http://") or path_or_url.startswith("https://"):
        return path_or_url
    
    clean = path_or_url.lstrip("/")
    # Check possible relative locations
    candidate_paths = [
        os.path.join(STATIC_DIR, clean.replace("static/", "", 1) if clean.startswith("static/") else clean),
        os.path.join(STATIC_DIR, "images", "estimates", os.path.basename(clean)),
        os.path.join(STATIC_DIR, clean),
    ]
    for p in candidate_paths:
        if os.path.exists(p) and os.path.isfile(p):
            mime, _ = mimetypes.guess_type(p)
            mime = mime or "image/jpeg"
            try:
                with open(p, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("utf-8")
                return f"data:{mime};base64,{b64}"
            except Exception:
                pass
    return path_or_url

# Default high-res house fallback image (Photo 1)
DEFAULT_HOUSE_IMAGE = "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80"
DEFAULT_UNDERLAYMENT_IMAGE = "/static/images/estimates/underlayment_roll.jpg"
DEFAULT_PRESSURE_WASHER_IMAGE = "/static/images/estimates/pressure_washer.jpg"

DEFAULT_PROPOSAL_DATA = {
    "proposal_date": datetime.now().strftime("%m/%d/%Y"),
    "customer_name": "David Martinez",
    "customer_address": "742 Evergreen Terrace",
    "customer_city": "Escondido, CA 92025",
    "roof_squares": 25.0,
    "roof_pitch": "4:12 Pitch",
    "stories": "1 Story",
    "hero_photo_url": DEFAULT_HOUSE_IMAGE,
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
        ]
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
        ]
    },
    "addon_1": {
        "title": "PREMIUM PSU / PEEL-AND-STICK (TILESEAL) UNDERLAYMENT UPGRADE",
        "description": "Upgrade the standard underlayment to a premium self-adhered peel-and-stick system, such as TileSeal or approved equivalent. Provides a fully adhered secondary water-resistant barrier and improved sealing around fastener penetrations.",
        "price": 2000,
        "image_url": DEFAULT_UNDERLAYMENT_IMAGE,
    },
    "addon_2": {
        "title": "PRESSURE WASHING ADD-ON",
        "description": "Professional soft wash of roof tiles, exterior surfaces, walkways, and driveway to remove dirt, mold, mildew, and algae.",
        "price": 3500,
        "image_url": DEFAULT_PRESSURE_WASHER_IMAGE,
    }
}

def merge_proposal_defaults(user_data: Dict[str, Any]) -> Dict[str, Any]:
    merged = dict(DEFAULT_PROPOSAL_DATA)
    if not user_data:
        return merged

    for key, val in user_data.items():
        if isinstance(val, dict) and key in merged and isinstance(merged[key], dict):
            sub_merged = dict(merged[key])
            sub_merged.update(val)
            merged[key] = sub_merged
        else:
            merged[key] = val
    return merged

TEMPLATE_MAP = {
    "multi_option_proposal": "multi_option_proposal.html",
    "standard_roofing_estimate": "standard_roofing_estimate.html",
}

async def render_proposal_html(proposal_data: Dict[str, Any], template_key: str = "multi_option_proposal") -> str:
    merged = merge_proposal_defaults(proposal_data)
    
    # Process Photos 1, 2, and 3 into data URIs for 100% offline self-contained PDF rendering
    if merged.get("hero_photo_url"):
        merged["hero_photo_url"] = _to_data_uri(merged["hero_photo_url"])
        
    if "addon_1" in merged and isinstance(merged["addon_1"], dict):
        img_val = merged["addon_1"].get("image_url") or merged["addon_1"].get("imageUrl") or DEFAULT_UNDERLAYMENT_IMAGE
        merged["addon_1"]["image_url"] = _to_data_uri(img_val)
        merged["addon_1"]["imageUrl"] = merged["addon_1"]["image_url"]
        
    if "addon_2" in merged and isinstance(merged["addon_2"], dict):
        img_val = merged["addon_2"].get("image_url") or merged["addon_2"].get("imageUrl") or DEFAULT_PRESSURE_WASHER_IMAGE
        merged["addon_2"]["image_url"] = _to_data_uri(img_val)
        merged["addon_2"]["imageUrl"] = merged["addon_2"]["image_url"]

    template_file = TEMPLATE_MAP.get(template_key, "multi_option_proposal.html")
    template = jinja_env.get_template(template_file)
    return template.render(proposal=merged)


import sys
import asyncio
from playwright.sync_api import sync_playwright

def _generate_pdf_worker(html_content: str) -> bytes:
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        page = browser.new_page()
        page.set_viewport_size({"width": 816, "height": 1056})
        page.set_content(html_content, wait_until="networkidle", timeout=30000)
        pdf_bytes = page.pdf(
            format="Letter",
            print_background=True,
            margin={"top": "0in", "right": "0in", "bottom": "0in", "left": "0in"},
            prefer_css_page_size=True,
        )
        browser.close()
        return pdf_bytes

async def generate_estimate_proposal_pdf(proposal_data: Dict[str, Any], template_key: str = "multi_option_proposal") -> bytes:
    """
    Renders high-fidelity Letter PDF using Playwright headless Chromium
    executed in a worker thread for 100% Windows event-loop compatibility.
    """
    html_content = await render_proposal_html(proposal_data, template_key=template_key)
    return await asyncio.to_thread(_generate_pdf_worker, html_content)

def save_estimate_pdf_file(estimate_identifier: str, pdf_bytes: bytes) -> str:
    """
    Saves PDF bytes to static uploads directory and returns the public relative URL.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    clean_id = str(estimate_identifier).replace("/", "_").replace("\\", "_").replace(" ", "_")
    filename = f"Proposal_{clean_id}_{timestamp}.pdf"
    file_path = os.path.join(STATIC_UPLOADS_DIR, filename)
    
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)
        
    return f"/static/uploads/estimates/{filename}"
