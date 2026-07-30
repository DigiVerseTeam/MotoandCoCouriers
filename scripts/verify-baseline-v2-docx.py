from pathlib import Path
import re
import sys
import zipfile


BASE = Path("baseline") / "v2.0"
EXPECTED = {
    "MotoCo_Baseline_Documentation_Control_v2.0.docx": ("DOC-BASE-CTRL-002", "v2.0"),
    "MotoCo_BOAS_Baseline_Addendum_v2.0.docx": ("BOAS-ADD-002", "v2.0"),
    "MotoCo_SOP_Baseline_Addendum_v1.3.docx": ("SOP-ADD-001", "v1.3"),
    "MotoCo_Policy_Baseline_Addendum_v2.0.docx": ("POL-ADD-002", "v2.0"),
}

FORBIDDEN_ACTIVE_CLAIMS = [
    "Xero is active",
    "Zoho is active",
    "Ficeda is active",
    "Receiver phone is required",
    "SLA monitoring is in scope",
    "HCM requirements are in scope",
]


def read_doc_text(path):
    with zipfile.ZipFile(path) as archive:
        xml = archive.read("word/document.xml").decode("utf-8", errors="ignore")
    text = re.sub(r"<[^>]+>", " ", xml)
    text = re.sub(r"\s+", " ", text)
    return xml, text


def main():
    failures = []
    for filename, (doc_id, version) in EXPECTED.items():
        path = BASE / filename
        if not path.exists():
            failures.append(f"missing {filename}")
            continue
        xml, text = read_doc_text(path)
        table_count = xml.count("<w:tbl>")
        if doc_id not in text:
            failures.append(f"{filename} missing document id {doc_id}")
        if version not in text:
            failures.append(f"{filename} missing version {version}")
        for claim in FORBIDDEN_ACTIVE_CLAIMS:
            if claim in text:
                failures.append(f"{filename} has stale active claim: {claim}")
        if len(text) < 1000:
            failures.append(f"{filename} appears too short")
        print(f"{filename}: ok text_chars={len(text)} tables={table_count}")

    register = BASE / "version-control-register.csv"
    if not register.exists():
        failures.append("missing version-control-register.csv")
    else:
        register_text = register.read_text(encoding="utf-8")
        for filename in EXPECTED:
            if filename not in register_text:
                failures.append(f"version register missing {filename}")

    if failures:
        print("FAIL")
        for failure in failures:
            print(f"- {failure}")
        sys.exit(1)
    print("PASS baseline v2.0 docx structural verification")


if __name__ == "__main__":
    main()
