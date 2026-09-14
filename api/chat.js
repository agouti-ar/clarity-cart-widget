export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, productData } = req.body;

  if (!question || !productData) {
    return res.status(400).json({ error: 'Missing question or productData' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const prompt = `You are ClarityCart AI, an expert e-commerce product consultant. Answer the shopper's question strictly based on the provided product context:
Title: ${productData.title}
Price: ${productData.price}
Description: ${productData.description}
Shipping & Returns: ${productData.shippingPolicy}

Rules:
1. Keep your answers concise, helpful, and friendly (1 to 3 sentences maximum).
2. Respond strictly in the SAME language the user asked their question in (e.g. English, Ukrainian, German, Spanish).
3. If the context does not contain the answer, politely advise contacting store support rather than hallucinating details.
4. Smart Sizing: If the shopper asks for size recommendations comparing to other brands (e.g. Nike, Adidas) or provides foot length in cm/inches, provide an accurate, helpful recommendation based on standard shoe sizing charts and state whether this model runs narrow, true to size, or wide.

Shopper's question: ${question}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      return res.status(500).json({ error: 'Failed to fetch response from AI' });
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate an answer.";

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
