export interface ListItemInput {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string;
  notes: string | null;
}

export interface MatchedLine {
  shopping_item_id: string;
  raw_name: string;
  quantity: number;
  unit: string | null;
  search_query: string;
  tesco_product_name: string;
  confidence: number;
}

export async function matchItemsToTesco(items: ListItemInput[]): Promise<MatchedLine[]> {
  if (items.length === 0) return [];

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return items.map((item) => ({
      shopping_item_id: item.id,
      raw_name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit,
      search_query: item.name,
      tesco_product_name: item.name,
      confidence: 0.3,
    }));
  }

  const payload = items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity ?? 1,
    unit: i.unit,
    category: i.category,
    notes: i.notes,
  }));

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.XAI_MODEL || 'grok-3-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You map informal Slovak household shopping list items to Tesco Slovakia (potravinydomov.itesco.sk) search queries.
Return ONLY valid JSON array, no markdown.
Each element:
{
  "shopping_item_id": "<id from input>",
  "raw_name": "<original name>",
  "quantity": <number>,
  "unit": "<unit or null>",
  "search_query": "<best Tesco.sk search phrase in Slovak>",
  "tesco_product_name": "<likely product title on Tesco>",
  "confidence": <0.0-1.0>
}
Rules:
- Keep user's meaning (slang OK): "sacky do kosa" → "vrecia do koša" or "odpadkové vrecká"
- Prefer common Tesco product naming
- quantity defaults to 1 if unknown
- confidence lower if ambiguous`,
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  if (!res.ok) {
    console.error('Tesco matcher API error', await res.text());
    return fallbackMatch(items);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim() || '[]';
  const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/, '');

  try {
    const parsed = JSON.parse(jsonStr) as MatchedLine[];
    if (!Array.isArray(parsed) || parsed.length === 0) return fallbackMatch(items);
    return parsed.map((row, idx) => ({
      shopping_item_id: row.shopping_item_id || items[idx]?.id || '',
      raw_name: row.raw_name || items[idx]?.name || '',
      quantity: row.quantity ?? items[idx]?.quantity ?? 1,
      unit: row.unit ?? items[idx]?.unit ?? null,
      search_query: row.search_query || row.raw_name || items[idx]?.name || '',
      tesco_product_name: row.tesco_product_name || row.search_query || '',
      confidence: typeof row.confidence === 'number' ? row.confidence : 0.5,
    }));
  } catch {
    return fallbackMatch(items);
  }
}

function fallbackMatch(items: ListItemInput[]): MatchedLine[] {
  return items.map((item) => ({
    shopping_item_id: item.id,
    raw_name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit,
    search_query: item.name,
    tesco_product_name: item.name,
    confidence: 0.4,
  }));
}