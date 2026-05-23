const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.get('/', (req, res) => {
  res.json({ message: 'Backend de Pixel funcionando', status: 'online' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, system } = req.body;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: system || 'Eres un asistente amigable llamado Pixel' },
        ...messages,
      ],
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || 'Lo siento, no pude responder.';
    res.json({ content: [{ text }] });
  } catch (e) {
    console.error('Error chat:', e);
    res.status(500).json({ error: 'Error al contactar con Groq' });
  }
});

// ── Freesound proxy ──────────────────────────────────────────────────────────
// Busca sonidos en Freesound y devuelve hasta 3 resultados con preview URLs.
// El frontend nunca toca la API key — todo pasa por aquí.
app.get('/api/sounds/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Falta el parámetro query' });
    }

    if (!process.env.FREESOUND_API_KEY) {
      return res.status(500).json({ error: 'FREESOUND_API_KEY no configurada en .env' });
    }

    const url =
      `https://freesound.org/apiv2/search/text/` +
      `?query=${encodeURIComponent(query)}` +
      `&fields=id,name,previews,duration` +
      `&filter=duration:[0.5 TO 5]` +
      `&page_size=3` +
      `&token=${process.env.FREESOUND_API_KEY}`;

    const r = await fetch(url);

    if (!r.ok) {
      const body = await r.text();
      console.error('Freesound error:', r.status, body);
      return res.status(r.status).json({ error: `Freesound respondió ${r.status}` });
    }

    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('Error sounds/search:', e);
    res.status(500).json({ error: 'Error buscando sonidos en Freesound' });
  }
});

// ── Freesound preview por ID ─────────────────────────────────────────────────
// Devuelve la preview URL de un sonido específico dado su ID.
// Útil para reconstruir la URL si solo guardaste el ID en Firestore.
app.get('/api/sounds/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!process.env.FREESOUND_API_KEY) {
      return res.status(500).json({ error: 'FREESOUND_API_KEY no configurada en .env' });
    }

    const url =
      `https://freesound.org/apiv2/sounds/${id}/` +
      `?fields=id,name,previews,duration` +
      `&token=${process.env.FREESOUND_API_KEY}`;

    const r = await fetch(url);

    if (!r.ok) {
      return res.status(r.status).json({ error: `Freesound respondió ${r.status}` });
    }

    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error('Error sounds/:id:', e);
    res.status(500).json({ error: 'Error obteniendo sonido de Freesound' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));