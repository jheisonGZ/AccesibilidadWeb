<h1 align="center">
  Aplicación Web Interactiva con Principios de Accesibilidad para apoyar el Bienestar Emocional de Estudiantes Universitarios
</h1>
<img width="1698" height="926" alt="eb47aeb0-6e5a-47e7-8dd3-1e85c0dd24bf" src="https://github.com/user-attachments/assets/369d23bf-0423-4800-971f-b54cca2f7bff" />

---

# Descripción General

Aplicación web interactiva orientada al bienestar emocional de estudiantes universitarios, diseñada bajo principios modernos de accesibilidad digital, experiencia inmersiva y arquitectura escalable. El sistema integra autenticación institucional, entorno 3D interactivo, herramientas de regulación emocional y un backend inteligente para asistencia conversacional.

Desarrollada como proyecto de tesis de grado para Ingeniería en Sistemas en la Universidad del Valle.

La plataforma proporciona un espacio digital seguro, accesible e inmersivo donde los estudiantes pueden autenticarse utilizando su correo institucional, personalizar un avatar e interactuar dentro de un entorno 3D diseñado para promover el bienestar emocional y la relajación.

La aplicación incorpora herramientas orientadas al acompañamiento emocional y la experiencia inclusiva, incluyendo:

* Ejercicios de respiración guiados.
* Cuestionarios de evaluación emocional.
* Zona de relajación inmersiva.
* Recomendaciones personalizadas.
* Asistente conversacional integrado.
* Navegación accesible bajo estándares WCAG 2.1 nivel AA.

El proyecto combina tecnologías modernas de frontend y backend con una arquitectura preparada para escalabilidad, integración de servicios externos y despliegue en producción.

---

# Objetivo de la Investigación

El propósito de esta tesis es desarrollar una aplicación web accesible e inmersiva que contribuya al bienestar emocional de estudiantes universitarios mediante herramientas digitales interactivas, experiencias 3D y asistencia conversacional.

La investigación busca integrar:

* Accesibilidad digital.
* Experiencia de usuario inclusiva.
* Tecnologías web modernas.
* Entornos inmersivos 3D.
* Sistemas conversacionales inteligentes.

Todo ello enfocado en generar un entorno digital seguro y de apoyo emocional para la comunidad estudiantil.

---

# Características Principales

## Frontend

* Autenticación restringida al dominio institucional `@correounivalle.edu.co`.
* Entorno 3D desarrollado con React Three Fiber.
* Sistema de estado global con Zustand.
* Validación tipada y segura mediante Zod.
* Diseño responsive optimizado para múltiples dispositivos.
* Arquitectura modular basada en Next.js App Router.
* Interfaz moderna construida con Tailwind CSS v4.
* Integración preparada para avatares avanzados.

## Backend

* API REST desarrollada con Express.js.
* Integración mediante Groq API.
* Sistema de chat conversacional.
* Configuración CORS para comunicación segura entre cliente y servidor.
* Health checks para monitoreo del servicio.
* Arquitectura preparada para microservicios y despliegue cloud.

## Accesibilidad

La aplicación fue diseñada siguiendo estándares WCAG 2.1 nivel AA, incluyendo:

* Navegación completa por teclado.
* Roles y atributos ARIA.
* Gestión correcta del foco.
* Formularios accesibles y etiquetados.
* Contraste adecuado de colores.
* Compatibilidad con tecnologías asistivas.
* Diseño inclusivo centrado en experiencia de usuario.

La accesibilidad representa uno de los pilares fundamentales de la investigación.

---

# Tecnologías Utilizadas

## Frontend

* Next.js 14 (App Router)
* React
* TypeScript
* React Three Fiber
* Drei
* Tailwind CSS v4
* Zustand
* Zod

## Backend

* Node.js
* Express.js
* Groq SDK
* CORS
* dotenv

## Modelo Conversacional Integrado

* Llama 3.3 70B Versatile
* Groq API

---

# Arquitectura del Sistema

La solución está compuesta por dos capas principales:

## Cliente (Frontend)

Responsable de:

* Renderizado del entorno 3D.
* Gestión de interfaz y experiencia inmersiva.
* Validación de formularios.
* Accesibilidad y navegación.
* Comunicación con APIs backend.

## Servidor (Backend)

Responsable de:

* Procesamiento de solicitudes API.
* Integración con modelos conversacionales.
* Gestión de endpoints de comunicación.
* Control de estado del servicio.
* Escalabilidad futura hacia autenticación y persistencia real.

---

# Instalación del Proyecto

## Clonar Repositorio

Repositorio oficial:

[https://github.com/jheisonGZ/AccesibilidadWeb](https://github.com/jheisonGZ/AccesibilidadWeb)

## Instalación de Dependencias

El proyecto utiliza Node.js y npm para la gestión de dependencias tanto del frontend como del backend.

## Variables de Entorno

El sistema requiere variables de entorno tanto para frontend como backend, incluyendo configuración de autenticación, dominio institucional permitido y claves de integración con Groq API.

---

# Backend Conversacional

El backend fue desarrollado con Express.js e integra un sistema conversacional mediante Groq API.

## Funcionalidades del Backend

* Endpoint principal de comunicación.
* Endpoint de salud del sistema.
* Integración con modelo conversacional.
* Configuración CORS.
* Comunicación segura frontend-backend.
* Arquitectura desacoplada y escalable.

---

# Estructura del Proyecto

La arquitectura del proyecto se encuentra organizada en módulos separados para autenticación, entorno 3D, componentes reutilizables, APIs y lógica global de estado.

El backend se encuentra desacoplado del frontend para facilitar futuras integraciones y escalabilidad.

---

# Despliegue

Actualmente tanto el frontend como el backend se encuentran desplegados en producción.

## Frontend

Desplegado mediante:

* Vercel

## Backend

Desplegado como servicio Node.js compatible con:

* Render
* Railway
* VPS Linux
* Docker

---

# Aporte Académico

Este proyecto representa una propuesta tecnológica orientada a la integración de accesibilidad digital, bienestar emocional y sistemas conversacionales dentro de contextos universitarios.

La tesis busca demostrar cómo las tecnologías web modernas y los entornos inmersivos pueden utilizarse como herramientas de apoyo emocional y experiencia inclusiva para estudiantes de educación superior.

---

# Trabajo Futuro

* Persistencia con PostgreSQL o MongoDB.
* Integración con Firebase o Supabase.
* Sistema de seguimiento emocional.
* Notificaciones inteligentes.
* Avatares avanzados con Ready Player Me.
* Audio ambiental dinámico.
* Sistema multijugador en entorno 3D.
* Panel administrativo.
* Métricas de bienestar emocional.

---

# Autor

## Jheison Estiben Gómez Muñoz

* Ingeniería en Sistemas
* Universidad del Valle

GitHub:

[https://github.com/jheisonGZ](https://github.com/jheisonGZ)

---

# Licencia

Proyecto académico desarrollado como tesis de grado con fines educativos, investigativos y de innovación tecnológica.
