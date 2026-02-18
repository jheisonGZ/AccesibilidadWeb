# Aplicación Web de Bienestar Emocional

Aplicación web interactiva orientada al bienestar emocional de estudiantes universitarios. El sistema integra autenticación institucional, entorno 3D inmersivo y herramientas de regulación emocional, bajo principios de accesibilidad digital (WCAG 2.1 nivel AA).

Desarrollada como proyecto académico para Ingeniería en Sistemas – Universidad del Valle.

---

## Descripción General

La aplicación ofrece un entorno digital seguro donde los estudiantes pueden autenticarse con su correo institucional, seleccionar un avatar personalizado e interactuar dentro de un entorno 3D inmersivo. Además, permite realizar ejercicios de respiración guiados, completar un cuestionario de evaluación emocional, acceder a una zona de relajación y recibir recomendaciones personalizadas.

El proyecto combina desarrollo frontend moderno con criterios sólidos de accesibilidad y experiencia de usuario inclusiva.

---

## Características Principales

- Autenticación restringida a dominio institucional (@correounivalle.edu.co).
- Entorno 3D desarrollado con React Three Fiber.
- Sistema de estado global con Zustand.
- Validación de datos con Zod.
- Diseño responsive con Tailwind CSS.
- Cumplimiento de estándares WCAG 2.1 nivel AA:
  - Navegación por teclado.
  - Roles y atributos ARIA.
  - Contraste adecuado.
  - Gestión correcta del foco.
  - Formularios accesibles y etiquetados.

---

## Tecnologías Utilizadas

- Next.js 14 (App Router)
- TypeScript
- React
- React Three Fiber + Drei
- Tailwind CSS v4
- Zustand
- Zod

---

## Instalación

Clonar el repositorio:

git clone https://github.com/jheisonGZ/AccesibilidadWeb.git  
cd AccesibilidadWeb  

Instalar dependencias:

npm install  

---

## Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

NEXT_PUBLIC_API_BASE=""  
ALLOWED_DOMAIN="@correounivalle.edu.co"  
JWT_SECRET="devsecret"  

---

## Ejecución en Desarrollo

npm run dev  

Abrir en el navegador:

http://localhost:3000

---

## Estructura del Proyecto

/app  
 ├── (auth)/page.tsx              Login y registro  
 ├── avatar/page.tsx              Selección de avatar  
 ├── world/page.tsx               Mundo 3D  
 ├── api/auth/login/route.ts      API de autenticación (mock)  
 ├── api/avatars/select/route.ts  API selección de avatar  
 └── api/sessions/save/route.ts   API guardado de sesión  

/components  
 ├── ui/                          Componentes base accesibles  
 ├── auth/                        Componentes de autenticación  
 ├── avatar/                      Componentes de avatar  
 └── world/                       Componentes del entorno 3D  

/lib  
 ├── store.ts                     Estado global (Zustand)  
 └── api.ts                       Utilidades de API  

---

## Arquitectura y Backend

Actualmente las rutas API implementadas son simuladas (mock) y están preparadas para migración a un backend real.

Posibles extensiones:

- Integración con backend propio (Node.js, NestJS, etc.).
- Base de datos relacional (PostgreSQL) o NoSQL (MongoDB).
- Servicios externos como Supabase o Firebase.
- Integración con Ready Player Me para avatares avanzados.

Ejemplo de migración:

Implementación actual (mock):  
fetch('/api/auth/login')

Migración a backend real:  
fetch('https://tu-backend.com/api/auth/login')

---

## Accesibilidad

La aplicación fue diseñada siguiendo lineamientos WCAG 2.1 nivel AA, incluyendo:

- Navegación completa por teclado.
- Uso correcto de roles ARIA.
- Gestión de foco en modales y elementos interactivos.
- Contraste adecuado de colores.
- Formularios correctamente etiquetados.

La accesibilidad es un eje central del diseño del sistema.

---

## Despliegue

Para producción:

npm run build  

Se recomienda desplegar en Vercel para integración automática con repositorios GitHub.

---

## Trabajo Futuro

- Integración de avatares personalizados con Ready Player Me.
- Conexión a base de datos persistente.
- Sistema de seguimiento de progreso emocional.
- Implementación de notificaciones.
- Incorporación de audio ambiental en zona de relajación.

---

## Autor

Jheison Estiben Gómez Muñoz  
Ingeniería en Sistemas  
Universidad del Valle  

GitHub: https://github.com/jheisonGZ

---

## Licencia

Proyecto académico. Uso educativo.
