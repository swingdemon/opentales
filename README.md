# OpenTales 🎲

Una aplicación open-source para gestionar campañas de rol, inspirada en LegendKeeper pero en español.

## ✨ Características

- 🗺️ **Mapas Interactivos** - Sube tus mundos y añade pines con información
- 📖 **Wiki Enlazada** - Crea artículos sobre lore, personajes y lugares
- 👥 **Gestión de Personajes** - Fichas completas y editables en tiempo real
- 📱 **Mobile First** - Diseño responsive para consultar desde el móvil
- 🎨 **Diseño Premium** - Interfaz moderna con glassmorphism y animaciones

## 🚀 Deployment con Docker

### Requisitos
- Docker & Docker Compose
- Node.js 20+ (solo para desarrollo)

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/opentales.git
cd opentales

# Construir y levantar con Docker Compose
docker-compose up -d --build

# La app estará disponible en http://localhost:3000
```

### Deployment con Portainer

1. En Portainer, ve a **Stacks** → **Add Stack**
2. Selecciona **Repository**
3. Pega la URL del repositorio: `https://github.com/tu-usuario/opentales`
4. Archivo de compose: `docker-compose.yml`
5. Click en **Deploy**

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más detalles.

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build
```

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + Vite
- **Routing**: React Router v6
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React
- **Estilos**: CSS Vanilla (Variables CSS + Glassmorphism)
- **Persistencia**: LocalStorage (migración a Supabase en progreso)

## 📝 Roadmap

- [x] Sistema de campañas
- [x] Gestión de personajes
- [x] Mapas interactivos con pines
- [x] Diseño responsive
- [ ] Autenticación con Supabase
- [ ] Base de datos en la nube
- [ ] Wiki colaborativa
- [ ] Sistema de permisos (GM/Jugadores)
- [ ] Modo offline

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Este proyecto está en desarrollo activo.

## 📄 Licencia

MIT License - Siéntete libre de usar este proyecto para tus campañas.

---

**Hecho con ❤️ para la comunidad de rol en español**
