# OpenTales - Gestor de Campañas de Rol

## Descripción del Proyecto
El objetivo es crear una aplicación de código abierto similar a [Legendkeeper](https://www.legendkeeper.com/) pero en español. Esta herramienta permitirá a los usuarios (Game Masters y Jugadores) gestionar sus mundos y campañas de rol de manera intuitiva y visualmente atractiva.

## Funcionalidades Principales
1.  **Gestión de Campañas**: Crear y organizar campañas con mapas, notas y wikis interconectadas.
2.  **Creación de Personajes**: Fichas de personaje personalizables y vinculadas al mundo.
3.  **Acceso Móvil**: Interfaz responsive para que los jugadores consulten el progreso y sus fichas desde el móvil.
4.  **Mapas Interactivos**: (Futuro) Capacidad de subir mapas y añadir pines con información.

## Stack Tecnológico (Propuesto)
-   **Frontend**: React (Vite) o Next.js (por definir según complejidad de backend).
-   **Estilos**: CSS Modules o TailwindCSS (si se prefiere).
-   **Estado**: Zustand o Context API.
-   **Persistencia**: ~~LocalStorage (inicialmente)~~ → **Supabase (Implementado)**.
-   **Base de Datos**: Supabase PostgreSQL.
-   **Autenticación**: Supabase Auth (próximamente).
-   **Deploy**: Docker + Nginx + Portainer.

## Configuración de Supabase
-   **URL**: https://bhvjyodxidmmjjggsnni.supabase.co
-   **Tablas**: `characters`, `campaigns`
-   **RLS**: Habilitado (usuarios solo ven sus propios datos)
-   **Variables de entorno**: `.env` (no commitear, usar `.env.example` como plantilla)

## Reglas de Diseño (Usuario)
-   **Estética Premium**: Colores vibrantes, modo oscuro, glassmorphism.
-   **Tipografía**: Moderna (Inter, Roboto, Outfit).
-   **UX**: Micro-animaciones y transiciones suaves.
-   **Responsive**: Diseño "Mobile First" para jugadores.

## Historial
-   2026-02-12: Inicialización del proyecto y estructura básica.
-   2026-02-13: Sistema de personajes, mapas interactivos, layout responsive.
-   2026-02-14: Deploy en Docker/Portainer, integración con Supabase.

