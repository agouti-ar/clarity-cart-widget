export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  let apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return res.status(200).json({ error: 'GEMINI_API_KEY not found in environment' });
  }

  // 🟢 GET: Покажи все доступные модели
  if (req.method === 'GET') {
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listResponse = await fetch(listUrl);
      const listData = await listResponse.json();
      
      return res.status(200).json({
        success: true,
        models: listData.models || [],
        allData: listData
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 🟢 POST: Отправь вопрос
  if (req.method === 'POST') {
    try {
      const { question, productContext } = req.body || {};
      const promptText = `You are a helpful e-commerce assistant. Product: "${productContext?.title || 'Unknown'}". Details: ${productContext?.description || 'None'}. Price: ${productContext?.price || 'Unknown'}. Question: "${question}". Answer concisely in 1-2 sentences.`;

      const modelPriority = [
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];

      let lastError = null;

      for (const model of modelPriority) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
          });

          const data = await response.json();

          if (response.ok && data.candidates) {
            const answer = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ answer });
          } else {
            lastError = data.error?.message;
            continue;
          }
        } catch (err) {
          lastError = err.message;
          continue;
        }
      }

      return res.status(200).json({ answer: `⚠️ No available models. Last error: ${lastError}` });
    } catch (error) {
      return res.status(200).json({ answer: `⚠️ ${error.message}` });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
