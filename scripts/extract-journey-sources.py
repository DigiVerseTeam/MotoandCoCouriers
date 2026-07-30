from pathlib import Path
import json
import zipfile


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "baseline" / "v2.0" / "full-source" / "journeys"
ORIGINAL = OUT / "original"
JOURNEY_ZIPS = [
    ROOT / "customer journey.zip",
    ROOT / "user journeys and gaps.zip",
]

BASELINE_NOTE = {
    "baseline_version": "v2.0",
    "status": "Draft for approval",
    "created": "2026-07-02",
    "changes": [
        "Simplified Customer Login / Courier Business Login entry model.",
        "Super Admin provisioning included.",
        "Driver pickup item count occurs at pickup, not delivery.",
        "Receiver phone is not required for POD.",
        "Driver same-device offline outbox is not live until sync succeeds.",
        "Driver can bring forward a complete future order under SOP-RUN-04 conditions.",
        "Billing V1 uses portal-generated invoice PDF and Admin manual email.",
        "SLA monitoring and HCM requirements are outside logistics portal scope.",
    ],
    "open_approvals": [
        "Policy Owner/legal owner approval TBD",
        "Privacy Owner is role-based GM Moto & Co Logistics; retained role/contact evidence required",
        "Minimum supported driver device/browser TBD",
        "Invoice PDF UAT evidence and manual payment evidence format required",
    ],
}


def safe_name(name):
    return Path(name).name


def main():
    ORIGINAL.mkdir(parents=True, exist_ok=True)
    manifest = [["source_archive", "source_file", "baseline_file", "version", "status"]]

    for archive_path in JOURNEY_ZIPS:
        if not archive_path.exists():
            continue
        with zipfile.ZipFile(archive_path) as archive:
            for member in archive.namelist():
                if member.endswith("/") or member.startswith("__MACOSX/"):
                    continue
                filename = safe_name(member)
                if not filename.lower().endswith((".xlsx", ".json", ".html")):
                    continue
                source_bytes = archive.read(member)
                source_path = ORIGINAL / filename
                source_path.write_bytes(source_bytes)

                if filename.lower().endswith(".json"):
                    try:
                        data = json.loads(source_bytes.decode("utf-8-sig"))
                    except Exception:
                        data = {"raw_source_file": filename}
                    if isinstance(data, dict):
                        data["_baseline_v2_control"] = BASELINE_NOTE
                    else:
                        data = {"source": data, "_baseline_v2_control": BASELINE_NOTE}
                    out_name = filename.replace(".json", "-v2.0.json")
                    (OUT / out_name).write_text(json.dumps(data, indent=2), encoding="utf-8")
                    manifest.append([archive_path.name, filename, out_name, "v2.0", "Draft for approval"])
                elif filename.lower().endswith(".html"):
                    out_name = filename.replace(".html", "-v2.0.html")
                    html = source_bytes.decode("utf-8", errors="ignore")
                    banner = (
                        "<!-- Moto and Co Couriers baseline v2.0 draft for approval. "
                        "See baseline/v2.0/full-source/journeys/Journey_v2_baseline_manifest.csv. -->\n"
                    )
                    (OUT / out_name).write_text(banner + html, encoding="utf-8")
                    manifest.append([archive_path.name, filename, out_name, "v2.0", "Draft for approval"])
                else:
                    # XLSX files are transformed by build-full-journey-v2-workbooks.mjs.
                    out_name = filename.replace(".xlsx", "-v2.0.xlsx")
                    manifest.append([archive_path.name, filename, out_name, "v2.0", "Draft for approval"])

    (OUT / "Journey_v2_baseline_manifest.csv").write_text(
        "\n".join(",".join(f'"{str(cell).replace(chr(34), chr(34) + chr(34))}"' for cell in row) for row in manifest),
        encoding="utf-8",
    )
    print(f"Extracted journeys to {OUT}")


if __name__ == "__main__":
    main()
