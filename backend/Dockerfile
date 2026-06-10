# ============================================
# BarberMaster - Backend Dockerfile
# ============================================
# Build context: raíz del proyecto (.)
# docker build -f backend/Dockerfile .

FROM node:18-alpine

# Instalar tzdata para zona horaria correcta
RUN apk add --no-cache tzdata

WORKDIR /app

# Copiar package.json del backend e instalar dependencias
COPY backend/package*.json ./
RUN npm install --production

# Copiar backend y frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Exponer puerto
EXPOSE 3000

# Comando de inicio
CMD ["node", "backend/server.js"]
