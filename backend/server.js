'use strict';

/* =========================================================
   DEPENDENCIAS
   ========================================================= */

const express = require('express');
const cors    = require('cors');
const Groq    = require('groq-sdk');

/* =========================================================
   VARIABLES DE ENTORNO
   Solo carga dotenv fuera de producción.
   En Render las vars se inyectan directamente.
   ========================================================= */

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/* =========================================================
   VALIDACIÓN TEMPRANA DE VARIABLES CRÍTICAS
   Falla rápido si falta algo esencial.
   ========================================================= */

const REQUIRED_ENV = ['GROQ_API_KEY'];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Variable de entorno requerida no encontrada: ${key}`);
    process.exit(1);
  }
}

/* =========================================================
   CLIENTES EXTERNOS
   ========================================================= */

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* =========================================================
   APP EXPRESS
   ========================================================= */

const app = express();

/* ---------------------------------------------------------
   CORS
   En producción limita el origen al dominio del frontend.
   --------------------------------------------------------- */

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : true; // true = cualquier origen (útil en desarrollo)

app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ---------------------------------------------------------
   BODY PARSER — limita a 1 MB para prevenir abusos
   --------------------------------------------------------- */

app.use(express.json({ limit: '1mb' }));

/* ---------------------------------------------------------
   LOGGER MÍNIMO (sin dependencias externas)
   --------------------------------------------------------- */

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* =========================================================
   HELPERS
   ========================================================= */

/**
 * Limpia y valida el historial de mensajes.
 * Solo permite roles 'user' y 'assistant' con content string.
 */
function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;

  const VALID_ROLES = new Set(['user', 'assistant']);

  const clean = raw
    .filter(m =>
      m &&
      typeof m === 'object' &&
      VALID_ROLES.has(m.role) &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
    )
    .map(m => ({ role: m.role, content: m.content.trim() }));

  return clean;
}

/* =========================================================
   RUTAS
   ========================================================= */

/* ---------------------------------------------------------
   GET /  — raíz
   --------------------------------------------------------- */

app.get('/', (_req, res) => {
  res.json({
    service: 'Pixel Backend',
    status:  'online',
    version: process.env.npm_package_version || '1.0.0',
  });
});

/* ---------------------------------------------------------
   GET /health  — healthcheck para Render / uptime monitors
   --------------------------------------------------------- */

app.get('/health', (_req, res) => {
  res.status(200).json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    Math.floor(process.uptime()),
  });
});

/* ---------------------------------------------------------
   POST /api/chat  — chatbot principal
   --------------------------------------------------------- */

app.post('/api/chat', async (req, res) => {
  const {
    messages,
    system = 'Eres un asistente amigable llamado Pixel.',
  } = req.body || {};

  /* --- Validación ---------------------------------------- */

  const cleanMessages = sanitizeMessages(messages);

  if (cleanMessages === null) {
    return res.status(400).json({
      error: '"messages" debe ser un arreglo de objetos { role, content }.',
    });
  }

  if (cleanMessages.length === 0) {
    return res.status(400).json({
      error: 'El historial de mensajes está vacío o todos los mensajes son inválidos.',
    });
  }

  if (typeof system !== 'string' || system.trim().length === 0) {
    return res.status(400).json({
      error: '"system" debe ser un string no vacío.',
    });
  }

  /* --- Request a Groq ------------------------------------ */

  try {
    const groqResponse = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens:  1000,
      messages: [
        { role: 'system', content: system.trim() },
        ...cleanMessages,
      ],
    });

    const text =
      groqResponse?.choices?.[0]?.message?.content?.trim() ||
      'Lo siento, no pude generar una respuesta en este momento.';

    return res.json({ content: [{ text }] });

  } catch (err) {
    /* Groq puede devolver errores tipados (AuthenticationError, RateLimitError, etc.) */
    const status  = err?.status  || 500;
    const message = err?.message || 'Error al comunicarse con Groq.';

    console.error(`[/api/chat] Groq error ${status}:`, message);

    /* No expongas el mensaje interno en producción si es 5xx */
    const clientMessage = status >= 500
      ? 'El servicio de IA no está disponible en este momento. Intenta de nuevo.'
      : message;

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: clientMessage,
    });
  }
});

/* ---------------------------------------------------------
   GET /api/sounds/search  — búsqueda en Freesound
   --------------------------------------------------------- */

app.get('/api/sounds/search', async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: 'El parámetro "query" es requerido.' });
  }

  const freesoundKey = process.env.FREESOUND_API_KEY;
  if (!freesoundKey) {
    return res.status(503).json({ error: 'Servicio de sonidos no configurado.' });
  }

  const url =
    `https://freesound.org/apiv2/search/text/` +
    `?query=${encodeURIComponent(query.trim())}` +
    `&fields=id,name,previews,duration` +
    `&filter=duration:[0.5+TO+5]` +
    `&page_size=3` +
    `&token=${freesoundKey}`;

  try {
    const r = await fetch(url);

    if (!r.ok) {
      const body = await r.text();
      console.error(`[/api/sounds/search] Freesound ${r.status}:`, body);
      return res.status(r.status).json({ error: `Freesound respondió con ${r.status}.` });
    }

    const data = await r.json();
    return res.json(data);

  } catch (err) {
    console.error('[/api/sounds/search]', err.message);
    return res.status(500).json({ error: 'Error buscando sonidos.' });
  }
});

/* ---------------------------------------------------------
   GET /api/sounds/:id  — detalle de un sonido
   --------------------------------------------------------- */

app.get('/api/sounds/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || !/^\d+$/.test(id)) {
    return res.status(400).json({ error: 'ID de sonido inválido.' });
  }

  const freesoundKey = process.env.FREESOUND_API_KEY;
  if (!freesoundKey) {
    return res.status(503).json({ error: 'Servicio de sonidos no configurado.' });
  }

  const url =
    `https://freesound.org/apiv2/sounds/${id}/` +
    `?fields=id,name,previews,duration` +
    `&token=${freesoundKey}`;

  try {
    const r = await fetch(url);

    if (!r.ok) {
      return res.status(r.status).json({ error: `Freesound respondió con ${r.status}.` });
    }

    const data = await r.json();
    return res.json(data);

  } catch (err) {
    console.error(`[/api/sounds/${id}]`, err.message);
    return res.status(500).json({ error: 'Error obteniendo el sonido.' });
  }
});

/* ---------------------------------------------------------
   404  — ruta no encontrada
   --------------------------------------------------------- */

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

/* ---------------------------------------------------------
   Error handler global  — captura errores inesperados
   --------------------------------------------------------- */

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Unhandled error]', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

/* =========================================================
   ARRANQUE
   ========================================================= */

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Pixel Backend corriendo en puerto ${PORT}`);
  console.log(`  NODE_ENV   : ${process.env.NODE_ENV || 'development'}`);
  console.log(`  GROQ key   : ${process.env.GROQ_API_KEY ? '✓ presente' : '✗ FALTA'}`);
  console.log(`  Freesound  : ${process.env.FREESOUND_API_KEY ? '✓ presente' : '— no configurada'}`);
  console.log(`  CORS origin: ${ALLOWED_ORIGINS === true ? 'todos (desarrollo)' : ALLOWED_ORIGINS}`);
});

/* =========================================================
   MANEJO DE SEÑALES DEL SISTEMA OPERATIVO
   Permite que Render haga shutdown limpio.
   ========================================================= */

process.on('SIGTERM', () => {
  console.log('[SIGTERM] Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SIGINT] Cerrando servidor...');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});