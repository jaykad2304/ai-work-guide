#!/bin/bash
set -e

echo "Starting AI Observer..."

# Start backend
sudo docker-compose up --build -d
echo "Backend running on http://localhost:8000"

# Start frontend
cd frontend && npm run dev
