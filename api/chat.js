export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let rawKey = process.env.GEMINI_API_KEY || '';
  let apiKey = rawKey.trim().replace(/^["']|["']$/g, '').replace('GEMINI_API_KEY=', '');

  if (!apiKey) {
    return res.status(200).json({ answer: '⚠️ Ошибка: Ключ API не найден на сервере Vercel.' });
  }

  try {
    const { question, productContext } = req.body || {};
    const promptText = `You are a helpful e-commerce assistant. Product: "${productContext?.title || 'Unknown'}". Details: ${productContext?.description || 'None'}. Price: ${productContext?.price || 'Unknown'}. Question: "${question}". Answer concisely in 1-2 sentences.`;

    // СТРОГО v1 (без beta) и самая стабильная модель
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(200).json({ answer: `⚠️ Ошибка Google: ${data.error?.message || 'Неизвестная ошибка API'}` });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Нет ответа от ИИ.';
    return res.status(200).json({ answer });
  } catch (error) {
    return res.status(200).json({ answer: `⚠️ Ошибка сервера: ${error.message}` });
  }
}
