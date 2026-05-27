const VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings";

export async function generateEmbedding(text: string): Promise<number[]> {
  const res = await fetch(VOYAGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3",
      input: [text],
      input_type: "document",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage AI error ${res.status}: ${body}`);
  }

  const json = await res.json() as { data: Array<{ embedding: number[] }> };
  return json.data[0].embedding;
}

type LineItem = { description?: string | null };

export function buildEmbeddingText(
  categoryName: string,
  publicSummary: string | null | undefined,
  lineItems: LineItem[]
): string {
  const parts: string[] = [categoryName];
  if (publicSummary?.trim()) parts.push(publicSummary.trim());
  const itemDescriptions = lineItems
    .map((li) => li.description?.trim())
    .filter(Boolean);
  if (itemDescriptions.length > 0) {
    parts.push(`Line items: ${itemDescriptions.join(", ")}`);
  }
  return parts.join(". ");
}
