export default async function handler(req, res) {
  // CORS и Антикэш
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Блокируем всё, кроме POST (безопасность)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  if (!apiKey) return res.status(200).json({ answer: '⚠️ Ошибка: Ключ API не настроен.' });

  try {
    const { question, productContext } = req.body || {};
    const promptText = `You are a helpful e-commerce assistant. Product: "${productContext?.title || 'Unknown'}". Details: ${productContext?.description || 'None'}. Price: ${productContext?.price || 'Unknown'}. Question: "${question}". Answer concisely in 1-2 sentences.`;

    const modelPriority = [
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
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
          return res.status(200).json({ 
            answer: data.candidates[0].content.parts[0].text,
            usedModel: model // Возвращаем для аналитики
          });
        } else {
          lastError = data.error?.message;
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    return res.status(200).json({ answer: `⚠️ No available models. Last error: ${lastError}` });
  } catch (error) {
    return res.status(200).json({ answer: `⚠️ ${error.message}` });
  }
}
