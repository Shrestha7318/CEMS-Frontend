# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Use ci for reproducible installs
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build-time env (Vite reads VITE_* at build time)
ARG VITE_API_BASE_URL
ARG VITE_USE_MOCK
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_USE_MOCK=${VITE_USE_MOCK}

# Build production static files
RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine

# Serve the SPA
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf


HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
