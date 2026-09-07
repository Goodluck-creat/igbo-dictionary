const IGBOAPI_BASE = "https://igboapi.com/api/v2";

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
        "X-API-Key": apiKey,
        Accept: "application/json",
      },
      // Igbo API responses for a given word rarely change; a short cache is fine
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const body = await res.text();
      return Response.json(
        { error: `Igbo API returned an error (${res.status}). ${body}`.slice(0, 300) },
        { status: res.status }
      );
    }

    const data = await res.json();
    return Response.json({ results: data });
  } catch (err) {
    return Response.json(
      { error: "Could not reach the Igbo API. Please try again in a moment." },
      { status: 502 }
    );
  }
}
