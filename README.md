# Aplicación Web de Bienestar Emocional

Aplicación web interactiva con principios de accesibilidad para apoyar el bienestar emocional de estudiantes universitarios.

## Características

- 🔐 Autenticación institucional (@correounivalle.edu.co)
- 👤 Selección de avatar personalizado
- 🌍 Entorno 3D inmersivo con React Three Fiber
- 🫁 Ejercicios de respiración interactivos
- 📋 Cuestionario de evaluación emocional
- 🧘 Zona de relajación
- 💡 Recomendaciones personalizadas
- ♿ Accesibilidad WCAG AA (navegación por teclado, ARIA, contraste)

## Tecnologías

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **3D**: React Three Fiber + Drei
- **Estado**: Zustand
- **Validación**: Zod

## Instalación

\`\`\`bash
npm install
\`\`\`

## Variables de Entorno

Crea un archivo `.env.local`:

\`\`\`env
NEXT_PUBLIC_API_BASE=""
ALLOWED_DOMAIN="@correounivalle.edu.co"
JWT_SECRET="devsecret"
\`\`\`

## Desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

\`\`\`
/app
  /(auth)/page.tsx          # Login/Registro
  /avatar/page.tsx          # Selección de avatar
  /world/page.tsx           # Mundo 3D
  /api/auth/login/route.ts  # API de autenticación
  /api/avatars/select/route.ts  # API de selección de avatar
  /api/sessions/save/route.ts   # API de guardado de sesión

/components
  /ui                       # Componentes UI base
  /auth                     # Componentes de autenticación
  /avatar                   # Componentes de avatar
  /world                    # Componentes del mundo 3D

/lib
  store.ts                  # Estado global (Zustand)
  api.ts                    # Utilidades de API
\`\`\`

## Migración a Backend Real

Las rutas API actuales son mock y están diseñadas para ser fácilmente migrables:

1. **Autenticación**: Reemplaza `/api/auth/login` con tu servicio de autenticación
2. **Base de datos**: Conecta a una base de datos real (PostgreSQL, MongoDB, etc.)
3. **Almacenamiento**: Usa servicios como Supabase, Firebase, o tu propio backend
4. **Avatares**: Integra Ready Player Me para avatares personalizados

### Ejemplo de migración:

\`\`\`typescript
// Antes (mock)
const response = await fetch('/api/auth/login', { ... })

// Después (backend real)
const response = await fetch('https://tu-backend.com/api/auth/login', { ... })
\`\`\`

## Accesibilidad

- ✅ Navegación completa por teclado
- ✅ Roles y atributos ARIA
- ✅ Contraste de color WCAG AA
- ✅ Focus visible en todos los elementos interactivos
- ✅ Trampas de foco en modales
- ✅ Etiquetas descriptivas en formularios

## Deploy

### Vercel (Recomendado)

\`\`\`bash
npm run build
\`\`\`

Luego conecta tu repositorio a Vercel para deploy automático.

## TODO

- [ ] Integrar Ready Player Me para avatares personalizados
- [ ] Conectar a base de datos real
- [ ] Implementar sistema de notificaciones
- [ ] Agregar más ejercicios de relajación
- [ ] Implementar sistema de seguimiento de progreso
- [ ] Agregar audio ambiente para zona de relajación

## Licencia

Proyecto académico - Universidad del Valle
