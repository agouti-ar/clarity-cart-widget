export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawKey = process.env.GEMINI_API_KEY || '';
  let apiKey = rawKey.trim().replace(/^["']|["']$/g, '');
  if (apiKey.startsWith('GEMINI_API_KEY=')) {
    apiKey = apiKey.replace('GEMINI_API_KEY=', '').trim();
  }

  if (!apiKey) {
    const err = { error: 'API_KEY_MISSING', message: 'Переменная GEMINI_API_KEY не найдена в Vercel Environment Variables.' };
    return res.status(500).json(err);
  }

  // РЕЖИМ ДИАГНОСТИКИ (если открыть ссылку /api/chat в браузере)
  if (req.method === 'GET') {
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();

      if (listData.error) {
        return res.status(400).json({
          status: 'GOOGLE_REJECTED_KEY',
          google_error: listData.error
        });
      }

      const availableModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace('models/', ''));

      // Тестовый запрос к gemini-2.0-flash или первой найденной модели
      const target = availableModels.find(m => m.includes('2.0-flash')) || availableModels[0] || 'gemini-1.5-flash';
      const testReq = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${target}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Ответь одним словом: Работает!' }] }] })
        }
      );
      const testData = await testReq.json();

      return res.status(200).json({
        status: 'SUCCESS',
        key_length: apiKey.length,
        available_models: availableModels,
        tested_model: target,
        ai_reply: testData.candidates?.[0]?.content?.parts?.[0]?.text || testData
      });
    } catch (e) {
      return res.status(500).json({ status: 'DIAGNOSTIC_CRASH', error: e.message });
    }
  }

  // РАБОЧИЙ РЕЖИМ ДЛЯ ВИДЖЕТА (POST)
  if (req.method === 'POST') {
    try {
      const { question, productContext } = req.body || {};

      const promptText = `You are a helpful e-commerce assistant for "${productContext?.title || 'Product'}".
Details: ${productContext?.description || ''}
Price: ${productContext?.price || ''}
Question: "${question}"
Answer concisely in 1-2 sentences in the question language.`;

      // Пробуем актуальную модель gemini-2.0-flash, затем fallback
      const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];
      let lastError = null;

      for (const m of modelsToTry) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${m}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
          }
        );
        const data = await response.json();
        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return res.status(200).json({ answer: data.candidates[0].content.parts[0].text });
        }
        lastError = data.error?.message || JSON.stringify(data);
      }

      // Возвращаем реальную ошибку в поле answer, чтобы видеть ее прямо в виджете
      return res.status(200).json({ answer: `⚠️ Ошибка Google Gemini: ${lastError}` });
    } catch (error) {
      return res.status(200).json({ answer: `⚠️ Внутренняя ошибка: ${error.message}` });
    }
  }
}
