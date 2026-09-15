export default async function handler(req, res) {
  console.log('🔍 DEBUG: api/chat.js called');
  console.log('Environment GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

  // Жестко отключаем кэш на всех уровнях Vercel
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  let rawKey = process.env.GEMINI_API_KEY || '';
  let apiKey = rawKey.trim().replace(/^["']|["']$/g, '').replace('GEMINI_API_KEY=', '');

  if (!apiKey) {
    return res.status(200).json({ answer: '⚠️ Ошибка: Ключ API не найден.' });
  }

  try {
    const { question, productContext } = req.body || {};
    const promptText = `You are a helpful e-commerce assistant. Product: "${productContext?.title || ''}". Question: "${question}". Answer concisely in 1-2 sentences.`;

    // Тестируем старую 100% стабильную модель на v1, как просил Claude
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
    console.log('📤 Sending to Google API:', url.replace(apiKey, '[REDACTED_KEY]'));

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });

    const data = await response.json();
    
    console.log('📥 Google API response status:', response.status);
    console.log('📥 Google API response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(200).json({ answer: `⚠️ Ошибка Google: ${data.error?.message || 'Неизвестная ошибка API'}` });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Нет ответа от ИИ.';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('💥 Catch error:', error.message);
    return res.status(200).json({ answer: `⚠️ Ошибка сервера: ${error.message}` });
  }
}
