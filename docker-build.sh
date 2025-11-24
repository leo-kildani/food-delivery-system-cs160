#!/bin/bash

# Build and start the container
docker compose up --build -d

echo "Docker container built and started"
echo "Access your app at http://localhost:3000"
