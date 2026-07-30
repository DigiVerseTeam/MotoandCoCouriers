from __future__ import annotations

import csv
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "baseline" / "v2.0"
FULL_SOURCE = BASELINE / "full-source"


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def require_file(path: Path) -> None:
    if not path.is_file():
        fail(f"missing file: {path.relative_to(ROOT)}")


def require_dir(path: Path) -> None:
    if not path.is_dir():
        fail(f"missing folder: {path.relative_to(ROOT)}")


def sheet_names(xlsx_path: Path) -> list[str]:
    try:
        with zipfile.ZipFile(xlsx_path) as archive:
            xml = archive.read("xl/workbook.xml")
    except Exception as exc:  # noqa: BLE001 - this is a verification helper
        fail(f"cannot inspect workbook {xlsx_path.relative_to(ROOT)}: {exc}")

    ns = {"main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    root = ET.fromstring(xml)
    return [sheet.attrib.get("name", "") for sheet in root.findall(".//main:sheet", ns)]


def docx_text(docx_path: Path) -> str:
    try:
        with zipfile.ZipFile(docx_path) as archive:
            xml = archive.read("word/document.xml")
    except Exception as exc:  # noqa: BLE001
        fail(f"cannot inspect document {docx_path.relative_to(ROOT)}: {exc}")

    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    root = ET.fromstring(xml)
    return "\n".join(node.text or "" for node in root.findall(".//w:t", ns))


def csv_rows(path: Path) -> list[dict[str, str]]:
    require_file(path)
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def verify() -> None:
    require_dir(FULL_SOURCE)

    expected_zips = [
        FULL_SOURCE / "MotoCo_BOAS_v2.0_Draft.zip",
        FULL_SOURCE / "MotoCo_SOPs_v2.0_Draft.zip",
        FULL_SOURCE / "MotoCo_Policies_v2.0_Draft.zip",
        FULL_SOURCE / "MotoCo_Journeys_v2.0_Draft.zip",
        BASELINE / "MotoCo_Full_Baseline_v2.0_Draft.zip",
        BASELINE / "MotoCo_Baseline_v2.0_Documentation_Pack.zip",
    ]
    for path in expected_zips:
        require_file(path)
        if path.stat().st_size <= 0:
            fail(f"empty zip file: {path.relative_to(ROOT)}")

    with zipfile.ZipFile(BASELINE / "MotoCo_Baseline_v2.0_Documentation_Pack.zip") as archive:
        documentation_pack_entries = set(archive.namelist())
    if "motoandco-legal-pages.html" in documentation_pack_entries:
        fail("documentation pack still contains loose root legal page")
    if "src/content/legal/motoandco-legal-pages.v2.html" not in documentation_pack_entries:
        fail("documentation pack missing source-code legal page")

    sidecars = list(FULL_SOURCE.rglob("*.inspect.ndjson"))
    if sidecars:
        fail(f"unexpected inspect sidecars remain: {len(sidecars)}")

    boas = FULL_SOURCE / "BOAS" / "MotoCo_Unified_BOAS_Hierarchy_v2.0.xlsx"
    require_file(boas)
    boas_sheets = set(sheet_names(boas))
    for sheet in ["V2 Baseline Control", "V2 Policy Impact", "V2 Data Objects"]:
        if sheet not in boas_sheets:
            fail(f"BOAS missing required sheet: {sheet}")

    sop_folder = FULL_SOURCE / "SOP"
    sop_manifest = sop_folder / "SOP_v2_baseline_manifest.csv"
    sop_rows = csv_rows(sop_manifest)
    sop_xlsx = sorted(sop_folder.glob("*.xlsx"))
    if len(sop_xlsx) < 27:
        fail(f"expected at least 27 SOP workbooks, found {len(sop_xlsx)}")
    if len(sop_rows) < 27:
        fail(f"expected at least 27 SOP manifest rows, found {len(sop_rows)}")
    required_sop_tokens = [
        "SOP-BIL-04",
        "SOP-PUP-02",
        "SOP-DEL-04",
        "SOP-DEL-05",
        "SOP-RUN-04",
        "SOP-MDM-01",
        "SOP-MDM-02",
        "SOP-PRV-02",
        "SOP-IAM-01",
        "SOP-IAM-04",
        "SOP-OPS-01",
    ]
    sop_names = " ".join(path.name for path in sop_xlsx)
    for token in required_sop_tokens:
        if token not in sop_names:
            fail(f"SOP set missing {token}")
    missing_baseline_sheet = [
        path.name for path in sop_xlsx if "Baseline Update" not in set(sheet_names(path))
    ]
    if missing_baseline_sheet:
        fail(f"SOP workbooks missing Baseline Update sheet: {missing_baseline_sheet[:5]}")

    policy_folder = FULL_SOURCE / "policies"
    policy_manifest = policy_folder / "Policy_v2_baseline_manifest.csv"
    policy_rows = csv_rows(policy_manifest)
    policy_docx = sorted(policy_folder.glob("Policy-*-v2.0.docx"))
    if len(policy_docx) != 28:
        fail(f"expected 28 policy DOCX files, found {len(policy_docx)}")
    if len(policy_rows) != 28:
        fail(f"expected 28 policy manifest rows, found {len(policy_rows)}")
    stale_claims = [
        "xero is active",
        "xero is the active invoice provider",
        "ficeda is active",
        "receiver phone is required",
        "sla monitoring is in scope",
        "hcm requirements are in scope",
    ]
    for docx in policy_docx:
        text = docx_text(docx)
        lowered = text.lower()
        if "version: v2.0" not in lowered:
            fail(f"policy missing v2.0 notice: {docx.name}")
        if "status: draft for approval" not in lowered:
            fail(f"policy missing draft status notice: {docx.name}")
        for claim in stale_claims:
            if claim in lowered:
                fail(f"stale policy claim found in {docx.name}: {claim}")

    policy_expectations = {
        "Policy-09-PricingSchedule-v2.0.docx": [
            "1 tyre $18.50",
            "2 tyres $24.00",
            "3 tyres $33.00",
            "4+ tyres $12.30 each",
            "up to 5kg $17.20",
            "5-10kg $21.00",
            "10kg+ from $25.00",
            "return to supplier pre-labelled $6.00",
            "out-of-zone delivery $10.00",
        ],
        "Policy-10-InvoicingPaymentTerms-v2.0.docx": [
            "V1 invoices are generated as portal PDF downloads",
            "No accounting API/OpenClaw/Xero integration is part of the V1 baseline",
        ],
        "Policy-15-GoodsAcceptance-v2.0.docx": [
            "Driver item count occurs at pickup",
            "Receiver phone is not mandatory",
            "receiver name and signature are mandatory",
        ],
        "Policy-16-VendorPickupStandards-v2.0.docx": [
            "Active V1 suppliers are Link International, A1 Accessories, McLeods, Gas Imports, and Whites Powersports",
            "Ficeda is removed from the active supplier network",
        ],
        "Policy-22-DriverScheduling-v2.0.docx": [
            "Driver must be able to create a daily run",
            "planned milk-run package",
            "no con note/customer missed portal entry",
        ],
        "Policy-24-RevenueReportingFinancialControls-v2.0.docx": [
            "generated invoice PDF",
            "corrected-invoice handling are outside V1 runtime",
            "No Xero, OpenClaw, or accounting API integration is part of the V1 baseline",
            "payment records",
        ],
    }
    policy_lookup = {path.name: path for path in policy_docx}
    for name, expected_texts in policy_expectations.items():
        text = docx_text(policy_lookup[name])
        lowered_text = text.lower()
        for expected in expected_texts:
            if expected.lower() not in lowered_text:
                fail(f"policy {name} missing expected v2 rule: {expected}")

    journey_folder = FULL_SOURCE / "journeys"
    journey_manifest = journey_folder / "Journey_v2_baseline_manifest.csv"
    journey_rows = csv_rows(journey_manifest)
    if len(journey_rows) < 10:
        fail(f"expected journey manifest rows, found {len(journey_rows)}")
    if len(list(journey_folder.glob("*-v2.0.xlsx"))) < 5:
        fail("expected at least five versioned journey/BOAS workbooks")
    if len(list(journey_folder.glob("*-v2.0.json"))) < 4:
        fail("expected at least four versioned journey JSON files")
    if not (journey_folder / "GAPS-REGISTER-v2.0.html").is_file():
        fail("missing versioned gaps register HTML")

    source_legal_html = ROOT / "src" / "content" / "legal" / "motoandco-legal-pages.v2.html"
    legal_html = FULL_SOURCE / "legal" / "MotoCo_Legal_Pages_v2.0_Draft.html"
    require_file(source_legal_html)
    require_file(legal_html)
    source_legal_text = source_legal_html.read_text(encoding="utf-8")
    legal_text = legal_html.read_text(encoding="utf-8")
    if source_legal_text != legal_text:
        fail("source legal draft and baseline legal draft differ")
    stale_legal_phrases = [
        "Zoho",
        "Netlify",
        "90 days",
        "photo captured as POD",
        "GPS coordinates",
        "Order placed Monday by 12pm",
    ]
    for phrase in stale_legal_phrases:
        if phrase in legal_text:
            fail(f"stale legal page phrase remains: {phrase}")
    for expected in [
        "Draft v2.0",
        "12:30pm Brisbane time",
        "Ficeda is not part of the active pickup network",
        "PDF invoices",
        "receiver name and receiver signature",
        "GPS is not required",
        "retained for 7 years",
        "Australia/Sydney",
        "Vercel",
        "Supabase",
    ]:
        if expected not in legal_text:
            fail(f"legal page missing expected v2 wording: {expected}")

    register_rows = csv_rows(BASELINE / "version-control-register.csv")
    tbd_rows = csv_rows(BASELINE / "tbd-approval-register.csv")
    if len(tbd_rows) < 30:
        fail(f"expected at least 30 TBD approval rows, found {len(tbd_rows)}")
    uat_rows = csv_rows(BASELINE / "uat-test-scripts-v1.csv")
    if len(uat_rows) < 25:
        fail(f"expected at least 25 UAT rows, found {len(uat_rows)}")
    register_ids = {row["document_id"] for row in register_rows}
    for document_id in [
        "BOAS-FULL-002",
        "SOP-FULL-002",
        "POL-FULL-002",
        "UJ-FULL-002",
        "FULL-PACK-002",
        "DOC-PACK-002",
        "TBD-REG-002",
        "UAT-001",
        "LEGAL-HTML-002",
        "LEGAL-SRC-002",
    ]:
        if document_id not in register_ids:
            fail(f"version register missing {document_id}")

    print("Full baseline v2.0 verification passed")
    print(f"BOAS workbook: 1")
    print(f"SOP workbooks: {len(sop_xlsx)}")
    print(f"Policy DOCX files: {len(policy_docx)}")
    print(f"Journey manifest rows: {len(journey_rows)}")
    print(f"Zip bundles: {len(expected_zips)}")


if __name__ == "__main__":
    verify()
