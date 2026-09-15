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
    console.error('SERVER ERROR: GEMINI_API_KEY is not defined in environment variables');
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('GEMINI API ERROR RESPONSE:', JSON.stringify(data));
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('INTERNAL SERVER ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
