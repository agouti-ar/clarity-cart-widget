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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('SERVER ERROR: GEMINI_API_KEY is missing');
    return res.status(500).json({ error: 'API key is missing on server' });
  }

  try {
    const { question, productContext } = req.body || {};

    const promptText = `You are a helpful e-commerce assistant for the product: "${productContext?.title || 'Product'}".
Product details:
${productContext?.description || ''}
Price: ${productContext?.price || ''}
Shipping: ${productContext?.shippingPolicy || ''}

User Question: "${question}"
Answer concisely, helpfully, and directly in 1-3 sentences in the same language as the question.`;

    // Приоритетные релизные и актуальные эндпоинты
    const candidateEndpoints = [
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
    ];

    let finalData = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });

        if (response.ok) {
          finalData = await response.json();
          break;
        }
      } catch (err) {
        console.warn('Endpoint failed, trying next:', endpoint);
      }
    }

    // Если прямые эндпоинты не ответили, автоопределяем доступную модель через ListModels
    if (!finalData) {
      console.warn('Attempting dynamic model discovery...');
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      
      const matched = listData.models?.find(m => 
        m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash')
      ) || listData.models?.find(m => m.supportedGenerationMethods?.includes('generateContent'));

      if (matched) {
        const dynamicEndpoint = `https://generativelanguage.googleapis.com/v1beta/${matched.name}:generateContent?key=${apiKey}`;
        const dynRes = await fetch(dynamicEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
        });
        if (dynRes.ok) {
          finalData = await dynRes.json();
        }
      }
    }

    if (!finalData) {
      return res.status(404).json({ error: 'No compatible Gemini model found for this key.' });
    }

    const answer = finalData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('INTERNAL SERVER ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
