const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');

/* =========================================================
   CARGA DE VARIABLES DE ENTORNO
   ========================================================= */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

/* =========================================================
   CONFIGURACIÓN GLOBAL
   ========================================================= */

/**
 * Configuración CORS
 * Permite solicitudes desde el frontend React.
 */
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * Middleware para parsear JSON
 */
app.use(express.json());

/* =========================================================
   CLIENTE GROQ AI
   ========================================================= */

/**
 * Cliente principal para generación de respuestas
 * del chatbot Pixel.
 */
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* =========================================================
   RUTAS BASE / HEALTHCHECK
   ========================================================= */

/**
 * Ruta raíz
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Backend de Pixel funcionando',
    status: 'online',
  });
});

/**
 * Healthcheck para Render / monitoreo
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   CHATBOT API
   ========================================================= */

/**
 * Endpoint principal del chatbot.
 *
 * Recibe:
 * - system: prompt del sistema
 * - messages: historial de conversación
 *
 * Retorna:
 * - respuesta generada por Groq
 */
app.post('/api/chat', async (req, res) => {
  try {

    /* -----------------------------------------
       BODY VALIDATION
       ----------------------------------------- */

    const {
      messages = [],
      system = 'Eres un asistente amigable llamado Pixel',
    } = req.body || {};

    /**
     * Validación básica del array de mensajes
     */
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        error: 'messages debe ser un arreglo',
      });
    }

    /* -----------------------------------------
       DEBUG LOGS
       ----------------------------------------- */

    console.log('Nueva solicitud chat');
    console.log('Mensajes recibidos:', messages.length);

    /* -----------------------------------------
       GROQ REQUEST
       ----------------------------------------- */

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
      max_tokens: 1000,
    });

    /* -----------------------------------------
       RESPUESTA FINAL
       ----------------------------------------- */

    const text =
      response?.choices?.[0]?.message?.content ||
      'Lo siento, no pude responder en este momento.';

    res.json({
      content: [{ text }],
    });

  } catch (e) {

    /* -----------------------------------------
       ERROR HANDLER
       ----------------------------------------- */

    console.error('Error chat:', e);

    res.status(500).json({
      error: 'Error al contactar con Groq',
    });
  }
});

/* =========================================================
   FREESOUND SEARCH API
   ========================================================= */

/**
 * Buscar sonidos cortos desde Freesound.
 *
 * Ejemplo:
 * /api/sounds/search?query=relax
 */
app.get('/api/sounds/search', async (req, res) => {
  try {

    const { query } = req.query;

    /* -----------------------------------------
       VALIDACIONES
       ----------------------------------------- */

    if (!query) {
      return res.status(400).json({
        error: 'Falta el parámetro query',
      });
    }

    const apiKey = process.env.FREESOUND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'FREESOUND_API_KEY no configurada',
      });
    }

    /* -----------------------------------------
       URL FREESOUND
       ----------------------------------------- */

    const url =
      `https://freesound.org/apiv2/search/text/` +
      `?query=${encodeURIComponent(query)}` +
      `&fields=id,name,previews,duration` +
      `&filter=duration:[0.5 TO 5]` +
      `&page_size=3` +
      `&token=${apiKey}`;

    /* -----------------------------------------
       REQUEST
       ----------------------------------------- */

    const r = await fetch(url);

    if (!r.ok) {
      const body = await r.text();

      console.error('Freesound error:', r.status, body);

      return res.status(r.status).json({
        error: `Freesound respondió ${r.status}`,
      });
    }

    const data = await r.json();

    res.json(data);

  } catch (e) {

    console.error('Error sounds/search:', e);

    res.status(500).json({
      error: 'Error buscando sonidos en Freesound',
    });
  }
});

/* =========================================================
   FREESOUND SOUND DETAIL API
   ========================================================= */

/**
 * Obtener detalle de sonido por ID.
 */
app.get('/api/sounds/:id', async (req, res) => {
  try {

    const { id } = req.params;

    const apiKey = process.env.FREESOUND_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'FREESOUND_API_KEY no configurada',
      });
    }

    const url =
      `https://freesound.org/apiv2/sounds/${id}/` +
      `?fields=id,name,previews,duration` +
      `&token=${apiKey}`;

    const r = await fetch(url);

    if (!r.ok) {
      return res.status(r.status).json({
        error: `Freesound respondió ${r.status}`,
      });
    }

    const data = await r.json();

    res.json(data);

  } catch (e) {

    console.error('Error sounds/:id:', e);

    res.status(500).json({
      error: 'Error obteniendo sonido de Freesound',
    });
  }
});

/* =========================================================
   START SERVER
   ========================================================= */

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Backend corriendo en puerto ${PORT}`);
});