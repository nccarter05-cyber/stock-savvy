// Scan invoice edge function - uses Lovable AI Gateway vision to extract line items
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `You are an expert at extracting structured data from invoices, packing slips, and receipts.

You will receive one or more images that together represent a single invoice/packing slip/receipt. Extract every line item you can read.

Respond with ONLY valid JSON matching exactly this schema (no markdown, no commentary):
{
  "vendor_name": string,           // best guess at the vendor/supplier name, "" if unreadable
  "invoice_date": string,          // ISO format YYYY-MM-DD, "" if unreadable
  "line_items": [
    {
      "item_number": string,       // SKU / product code / item # ("" if none)
      "item_name": string,         // product description
      "quantity": number,          // numeric quantity received
      "unit": string,              // unit of measure e.g. "case", "lb", "ea" ("" if none)
      "unit_price": number         // cost per unit (0 if not shown)
    }
  ]
}

Rules:
- Numbers must be numbers, not strings.
- Skip subtotals, taxes, shipping, totals - only real line items.
- If a field is unreadable use empty string "" (or 0 for numeric fields).
- Return [] for line_items if none found.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const images: string[] = Array.isArray(body?.images) ? body.images : [];

    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'At least one image is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (images.length > 10) {
      return new Response(JSON.stringify({ error: 'Maximum 10 images per scan' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build multimodal user message
    const userContent: Array<Record<string, unknown>> = [
      { type: 'text', text: `Extract all line items from this ${images.length > 1 ? `${images.length}-page ` : ''}invoice. Return JSON only.` },
      ...images.map((url) => ({ type: 'image_url', image_url: { url } })),
    ];

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI gateway error', aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI is busy right now. Please try again in a moment.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits in workspace usage settings.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'AI extraction failed', detail: errText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiJson = await aiResponse.json();
    const rawContent: string = aiJson?.choices?.[0]?.message?.content ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      // try to extract a JSON object from the string
      const match = rawContent.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return new Response(JSON.stringify({ error: 'Could not parse AI response', raw: rawContent }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = parsed as Record<string, unknown>;
    const lineItemsRaw = Array.isArray(result.line_items) ? result.line_items : [];
    const line_items = lineItemsRaw.map((li: any) => ({
      item_number: String(li?.item_number ?? '').trim(),
      item_name: String(li?.item_name ?? '').trim(),
      quantity: Number(li?.quantity) || 0,
      unit: String(li?.unit ?? '').trim(),
      unit_price: Number(li?.unit_price) || 0,
    })).filter((li: any) => li.item_name);

    return new Response(JSON.stringify({
      vendor_name: String(result.vendor_name ?? '').trim(),
      invoice_date: String(result.invoice_date ?? '').trim(),
      line_items,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('scan-invoice error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
