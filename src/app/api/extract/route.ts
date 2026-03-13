import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Use jina.ai reader API to extract readable content
    const readerUrl = `https://r.jina.ai/${url}`;

    const response = await fetch(readerUrl, {
      headers: {
        "Accept": "text/plain",
      },
    });

    if (!response.ok) {
      // Fallback: try to fetch and parse HTML directly
      return await fallbackExtract(url);
    }

    const text = await response.text();

    // Parse the response - jina.ai returns markdown with title
    const lines = text.split("\n");
    let title = "Article";
    let content = text;

    // First line is usually the title (# Title)
    if (lines[0]?.startsWith("# ")) {
      title = lines[0].slice(2).trim();
      content = lines.slice(1).join("\n");
    }

    // Clean up the content
    content = cleanContent(content);

    if (!content || content.length < 50) {
      return await fallbackExtract(url);
    }

    return NextResponse.json({ title, content });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract content from URL" },
      { status: 500 }
    );
  }
}

async function fallbackExtract(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TypeRead/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "Article";

    // Extract text content - simple approach
    let content = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
      // Remove HTML tags but keep text
      .replace(/<[^>]+>/g, " ")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, " ")
      .trim();

    content = cleanContent(content);

    if (!content || content.length < 50) {
      return NextResponse.json(
        { error: "Could not extract readable content from this URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({ title, content });
  } catch (error) {
    console.error("Fallback extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract content from URL" },
      { status: 500 }
    );
  }
}

function cleanContent(content: string): string {
  return content
    // Remove markdown links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "")
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    // Remove headers
    .replace(/^#+\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Remove bullet points and numbered lists
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    // Clean up whitespace
    .replace(/\s+/g, " ")
    .trim();
}
