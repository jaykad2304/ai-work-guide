#!/bin/bash

echo "Stopping AI Observer..."

# Stop backend
sudo docker-compose down
echo "Backend stopped."

# Kill Vite dev server
pkill -f "vite" 2>/dev/null && echo "Frontend stopped." || echo "Frontend was not running."

echo "All done."
