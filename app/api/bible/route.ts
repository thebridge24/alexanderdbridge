
import { NextRequest, NextResponse } from "next/server";

const NLT_API_URL = "https://api.nlt.to/api/passages";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawRef = searchParams.get("ref")?.trim();

  if (!rawRef) {
    return NextResponse.json(
      { error: "Missing passage reference." },
      { status: 400 },
    );
  }

  const apiKey = process.env.NLT_API_KEY;

  if (!apiKey) {
    console.error("NLT_API_KEY is missing from the environment.");

    return NextResponse.json(
      { error: "Bible API is not configured. Check NLT_API_KEY." },
      { status: 500 },
    );
  }

  // Normalize en dashes and em dashes.
  const ref = rawRef.replace(/[\u2013\u2014]/g, "-");

  const url = new URL(NLT_API_URL);
  url.searchParams.set("ref", ref);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Bridge-Daily-App",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      const providerError = await response.text();

      console.error("NLT API request failed:", {
        reference: ref,
        status: response.status,
        error: providerError.slice(0, 1000),
      });

      return NextResponse.json(
        {
          error: "The Bible provider rejected the request.",
          details:
            process.env.NODE_ENV === "development"
              ? providerError.slice(0, 1000)
              : undefined,
        },
        { status: response.status >= 400 && response.status < 500
          ? response.status
          : 502 },
      );
    }

    const htmlContent = await response.text();

    return NextResponse.json({
      reference: ref,
      htmlContent,
      translation: "NLT",
    });
  } catch (error: unknown) {
  console.error("Bible API route exception:", error);

  const cause =
    error instanceof Error && error.cause instanceof Error
      ? error.cause
      : null;

  const isTimeout =
    cause?.name === "ConnectTimeoutError" ||
    cause?.name === "TimeoutError";

  return NextResponse.json(
    {
      error: isTimeout
        ? "The NLT Bible service took too long to respond. Please try again."
        : "Unable to connect to the NLT Bible service.",
    },
    { status: 502 },
  );
}

}