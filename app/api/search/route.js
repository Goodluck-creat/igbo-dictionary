const IGBOAPI_BASE = "https://igboapi.com/api/v2";

// The API has returned a plain array in some docs/examples and a wrapped
// object (e.g. { words: [...] } or { docs: [...] }) in others. Handle both
// so a shape change on their end doesn't silently look like "no results".
function extractEntries(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  for (const key of ["words", "docs", "data", "results", "items"]) {
    if (Array.isArray(data[key])) return data[key];
  }

  // A single word object (not wrapped in an array) still counts as one result.
  if (typeof data.word === "string" || typeof data.id === "string") return [data];

  return [];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const keyword = (searchParams.get("keyword") || "").trim();

  if (!keyword) {
    return Response.json({ error: "Type a word to search for." }, { status: 400 });
  }

  const apiKey = process.env.IGBO_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "The server is missing an IGBO_API_KEY. Add one in your environment settings (see README).",
      },
      { status: 500 }
    );
  }

  const url = new URL(`${IGBOAPI_BASE}/words`);
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("dialects", "true");
  url.searchParams.set("examples", "true");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // The Igbo API quickstart docs specify Authorization: Bearer <token>.
        // Some generated API references show X-API-Key instead. Send both so
        // this works regardless of which the live API actually checks.
        Authorization: `Bearer ${apiKey}`,
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      // Igbo API responses for a given word rarely change; a short cache is fine
      next: { revalidate: 3600 },
    });

    const rawBody = await res.text();

    if (!res.ok) {
      return Response.json(
        { error: `Igbo API returned an error (${res.status}). ${rawBody}`.slice(0, 300) },
        { status: res.status }
      );
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return Response.json(
        { error: "Igbo API returned a response that wasn't valid JSON." },
        { status: 502 }
      );
    }

    const results = extractEntries(data);

    // Helpful when debugging in the browser Network tab: if we got a 200 but
    // couldn't find any entries in the expected shapes, surface the raw keys
    // instead of silently returning an empty array.
    if (results.length === 0 && data && typeof data === "object" && !Array.isArray(data)) {
      return Response.json({ results: [], debugShape: Object.keys(data) });
    }

    return Response.json({ results });
  } catch (err) {
    return Response.json(
      { error: "Could not reach the Igbo API. Please try again in a moment." },
      { status: 502 }
    );
  }
}
