FROM python:3.11-slim as backend-builder

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM node:20-alpine as frontend-builder

WORKDIR /app
COPY frontend/package*.json .
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim

WORKDIR /app

COPY backend/ ./backend/
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

COPY --from=frontend-builder /app/dist ./frontend/dist

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
