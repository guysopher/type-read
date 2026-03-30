import { NextRequest, NextResponse } from 'next/server';
import { decodeHtmlEntities, prepareTextForTyping, sanitizeTypingText } from '@/lib/textProcessing';

const OPENAI_API_URL = 'https://api.openai.com/v1/responses';
const DEFAULT_MODEL = process.env.OPENAI_EXTRACT_MODEL || 'gpt-5-mini';
const MAX_SOURCE_CHARS = 18000;

type OpenAIExtraction = {
  title: string;
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    const pageSource = await getPageSource(normalizedUrl);

    if (!pageSource.content || pageSource.content.length < 200) {
      return NextResponse.json(
        { error: 'Could not extract enough readable text from this URL' },
        { status: 400 }
      );
    }

    const extraction = await extractWithOpenAI({
      url: normalizedUrl,
      title: pageSource.title,
      content: pageSource.content,
    });

    const content = prepareTextForTyping(extraction.content);
    const title = sanitizeTypingText(extraction.title || pageSource.title || 'Imported Article').trim();

    if (!content || content.length < 50) {
      return NextResponse.json(
        { error: 'OpenAI did not return enough readable text for typing' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      title: title || 'Imported Article',
      content,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract content from URL' },
      { status: 500 }
    );
  }
}

function normalizeUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') {
    return null;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

async function getPageSource(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TypeRead/1.0; +https://type-read.vercel.app)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch source page: ${response.status}`);
    }

    const body = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/plain')) {
      return {
        title: 'Imported Article',
        content: sanitizeTypingText(body).slice(0, MAX_SOURCE_CHARS),
      };
    }

    const extracted = extractTextFromHtml(body);
    if (extracted.content.length >= 200) {
      return extracted;
    }
  } catch (error) {
    console.warn('Primary page fetch failed, trying reader fallback:', error);
  }

  return fetchReaderFallback(url);
}

async function fetchReaderFallback(url: string): Promise<{ title: string; content: string }> {
  const readerUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(readerUrl, {
    headers: {
      Accept: 'text/plain',
    },
  });

  if (!response.ok) {
    throw new Error(`Reader fallback failed: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n');
  const title = lines[0]?.startsWith('# ') ? lines[0].slice(2).trim() : 'Imported Article';
  const content = sanitizeTypingText(lines.slice(1).join('\n')).slice(0, MAX_SOURCE_CHARS);

  return { title, content };
}

function extractTextFromHtml(html: string): { title: string; content: string } {
  const titleMatch =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i);

  const title = decodeHtmlEntities(titleMatch?.[1]?.trim() || 'Imported Article');

  const bodyText = decodeHtmlEntities(
    html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, ' ')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, ' ')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|article|section|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  );

  return {
    title,
    content: sanitizeTypingText(bodyText).slice(0, MAX_SOURCE_CHARS),
  };
}

async function extractWithOpenAI(input: {
  url: string;
  title: string;
  content: string;
}): Promise<OpenAIExtraction> {
  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      store: false,
      max_output_tokens: 5000,
      text: {
        format: {
          type: 'json_schema',
          name: 'typeread_extraction',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
            },
            required: ['title', 'content'],
          },
        },
      },
      input: [
        {
          role: 'system',
          content: [
            {
              type: 'input_text',
              text:
                'Return JSON matching the requested schema. The content field must contain only paragraphs, with no headings or bullet lists.',
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `Convert the content at this URL into a readable story in paragraphs only.

Be strict about accuracy:
- Every factual statement must be supported by the source.
- Do not infer beyond what the source clearly supports.
- Do not add context from your own knowledge.
- Do not use phrases like “the article”, “the docs”, or “the page”.
- Do not use bullets or headings.
- Do not omit important caveats, limitations, or architectural trade-offs.
- Do not simplify to the point of distortion.

Writing goal:
Rewrite the source so it is easier to read and more natural, while staying fully loyal to the original meaning.

URL: ${input.url}

Source title: ${input.title}

Source content captured from the URL:
${input.content}`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const outputText = extractOpenAIText(data);

  if (!outputText) {
    throw new Error('OpenAI response did not contain output text');
  }

  const parsed = JSON.parse(outputText) as Partial<OpenAIExtraction>;

  if (typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
    throw new Error('OpenAI response did not match the expected schema');
  }

  return {
    title: parsed.title,
    content: parsed.content,
  };
}

function extractOpenAIText(data: any): string {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }

  const output = Array.isArray(data?.output) ? data.output : [];

  for (const item of output) {
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      if (block?.type === 'output_text' && typeof block.text === 'string') {
        return block.text;
      }
    }
  }

  return '';
}
