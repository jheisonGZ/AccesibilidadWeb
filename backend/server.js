app.post('/api/chat', async (req, res) => {
  try {

    console.log('BODY RECIBIDO:', req.body);
    console.log('Groq API:', !!process.env.GROQ_API_KEY);

    const {
      messages = [],
      system = 'Eres un asistente amigable llamado Pixel',
    } = req.body || {};

    /* =========================
       VALIDACIÓN
       ========================= */

    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages debe ser un arreglo',
      });
    }

    /* =========================
       REQUEST A GROQ
       ========================= */

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',

      messages: [
        {
          role: 'system',
          content: system,
        },

        ...messages,
      ],

      temperature: 0.7,
      max_tokens: 500,
    });

    console.log('RESPUESTA GROQ OK');

    const text =
      response?.choices?.[0]?.message?.content ||
      'Lo siento, no pude responder.';

    return res.json({
      content: [{ text }],
    });

  } catch (e) {

    console.error('ERROR COMPLETO CHAT:', e);

    return res.status(500).json({
      error: e.message || 'Error interno chat',
    });
  }
});