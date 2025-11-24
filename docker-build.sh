#!/bin/bash
# Load environment variables from .env.local and build Docker container

# Export all variables from .env.local
set -a
source .env.local
set +a

# Build and start the container
docker compose up --build -d

echo "✅ Docker container built and started"
echo "🌐 Access your app at http://localhost:3000"
