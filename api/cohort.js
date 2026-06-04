export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).end(); return; }
  try {
    const { product, sp } = req.body;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8096,
        system: [{ type: 'text', text: sp, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: 'Product: ' + product }]
      })
    });
    if (!r.ok) {
      const raw = await r.text();
      let errorMsg;
      try { errorMsg = JSON.parse(raw)?.error?.message || raw; }
      catch { errorMsg = raw || `Anthropic API error: ${r.status}`; }
      res.status(r.status).json({ error: errorMsg }); return;
    }
    const d = await r.json();
    if (d.error) { res.status(400).json({ error: d.error.message }); return; }
    res.status(200).json({ text: d.content?.[0]?.text || '' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
