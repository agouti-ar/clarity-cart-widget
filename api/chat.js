export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Санитарная очистка ключа от кавычек, пробелов и случайных префиксов
  let rawKey = process.env.GEMINI_API_KEY || '';
  let apiKey = rawKey.trim();
  if (apiKey.startsWith('GEMINI_API_KEY=')) {
    apiKey = apiKey.replace('GEMINI_API_KEY=', '').trim();
  }
  apiKey = apiKey.replace(/^["']|["']$/g, '').trim();

  if (!apiKey) {
    console.error('SERVER ERROR: GEMINI_API_KEY is missing');
    return res.status(500).json({ error: 'API key is missing on server' });
  }

  try {
    const { question, productContext } = req.body || {};

    const promptText = `You are a helpful e-commerce assistant for "${productContext?.title || 'Product'}".
Product details:
${productContext?.description || ''}
Price: ${productContext?.price || ''}
Shipping: ${productContext?.shippingPolicy || ''}

Question: "${question}"
Answer concisely, helpfully, and directly in 1-3 sentences in the same language as the question.`;

    // 1. Запрашиваем актуальный список моделей Google для этого ключа
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();

    if (listData.error) {
      console.error('GOOGLE AUTH/KEY ERROR:', JSON.stringify(listData.error));
      return res.status(400).json({ error: listData.error.message });
    }

    // Выводим в лог Vercel точные имена моделей
    const available = (listData.models || [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => m.name);

    console.log('ACTIVE AVAILABLE MODELS:', available.join(', '));

    // Выбираем самую быструю доступную модель (flash или любую первую подходящую)
    const targetModel = available.find(name => name.includes('flash')) || available[0];

    if (!targetModel) {
      console.error('NO GENERATE MODELS IN LIST:', JSON.stringify(listData));
      return res.status(404).json({ error: 'No compatible models found for this API key.' });
    }

    console.log('SELECTED MODEL:', targetModel);

    // 2. Отправляем запрос к гарантированно существующей модели
    const generateRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${targetModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      }
    );

    const generateData = await generateRes.json();

    if (!generateRes.ok) {
      console.error('GENERATION ERROR:', JSON.stringify(generateData));
      return res.status(generateRes.status).json({ error: generateData.error?.message || 'Generation error' });
    }

    const answer = generateData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return res.status(200).json({ answer });

  } catch (error) {
    console.error('INTERNAL HANDLER CRASH:', error);
    return res.status(500).json({ error: error.message });
  }
}
