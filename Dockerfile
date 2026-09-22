# =========================================================
# Root Dockerfile: Single-Container Fullstack Deployment
# (Suitable for AWS App Runner, Render, Railway, DigitalOcean)
# =========================================================

# Stage 1: Build React/Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python/Django Backend
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy Django backend application
COPY Hotelcrm/ /app/

# Copy built frontend production dist directory into Django static directory
COPY --from=frontend-builder /frontend/dist /app/frontend_dist

EXPOSE 8000

# Execute database migrations, static collection, and launch Gunicorn WSGI server
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn core.wsgi:application --bind 0.0.0.0:8000 --workers 3"]
