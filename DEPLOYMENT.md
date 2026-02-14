# OpenTales - Deployment Guide

## 🐳 Docker Deployment

### Quick Start

1. **Build the image:**
```bash
docker-compose build
```

2. **Run the container:**
```bash
docker-compose up -d
```

3. **Access the app:**
- Local: http://localhost:3000
- Production: Configure your reverse proxy to point to port 3000

### Manual Docker Commands

```bash
# Build
docker build -t opentales:latest .

# Run
docker run -d -p 3000:80 --name opentales-app opentales:latest

# Stop
docker stop opentales-app

# Remove
docker rm opentales-app
```

## 🔧 Configuration

### Port Mapping
By default, the app runs on port 3000. To change it, edit `docker-compose.yml`:
```yaml
ports:
  - "YOUR_PORT:80"
```

### Reverse Proxy (Nginx/Traefik)
If you're using a reverse proxy, point it to `http://localhost:3000`

Example Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📦 Production Optimizations

The Docker image includes:
- ✅ Multi-stage build (smaller image size)
- ✅ Nginx for serving static files
- ✅ Gzip compression
- ✅ Security headers
- ✅ SPA routing support
- ✅ Asset caching

## 🔄 Updates

To update the app:
```bash
git pull
docker-compose down
docker-compose build
docker-compose up -d
```

## 🐛 Troubleshooting

**Container won't start:**
```bash
docker logs opentales-app
```

**Port already in use:**
Change the port in `docker-compose.yml`

**Build fails:**
Make sure you have Node.js dependencies installed locally first:
```bash
npm install
```
