import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NominatimAddress = {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country_code?: string;
};

type NominatimResult = {
  place_id?: number;
  display_name?: string;
  lat?: string;
  lon?: string;
  address?: NominatimAddress;
};

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "private, max-age=300",
    },
  });
}

function cleanText(value: unknown) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function formatAddress(result: NominatimResult) {
  const address = result.address || {};
  const street = [address.house_number, address.road].map(cleanText).filter(Boolean).join(" ");
  const locality = cleanText(address.suburb || address.city || address.town || address.village);
  const state = cleanText(address.state);
  const postcode = cleanText(address.postcode);
  const formatted = [street, locality, [state, postcode].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return formatted || cleanText(result.display_name);
}

export async function GET(request: NextRequest) {
  try {
    const query = cleanText(request.nextUrl.searchParams.get("q"));
    if (query.length < 4) return json(200, { suggestions: [] });

    const params = new URLSearchParams({
      q: `${query}, Queensland, Australia`,
      format: "jsonv2",
      addressdetails: "1",
      countrycodes: "au",
      limit: "6",
      viewbox: "151.6,-27.0,153.8,-28.4",
      bounded: "0",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MotoAndCoCouriers/1.0 address-search",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return json(502, { error: "Address search is temporarily unavailable.", suggestions: [] });

    const rows = await response.json() as NominatimResult[];
    const seen = new Set<string>();
    const suggestions = (Array.isArray(rows) ? rows : [])
      .map((row) => ({
        id: String(row.place_id || `${row.lat || ""},${row.lon || ""}`),
        label: formatAddress(row),
        displayName: cleanText(row.display_name),
        lat: row.lat || "",
        lon: row.lon || "",
      }))
      .filter((row) => row.label && !seen.has(row.label.toLowerCase()) && seen.add(row.label.toLowerCase()))
      .slice(0, 6);

    return json(200, { suggestions });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Address search failed.", suggestions: [] });
  }
}
