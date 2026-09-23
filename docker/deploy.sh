#!/bin/bash
# MahaTest Production Deploy Script
# Run from /home/ubuntu/mahatest on the EC2 server
# Usage: ./docker/deploy.sh

set -e

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building new API image..."
docker compose -f docker/docker-compose.prod.yml build api

echo "==> Restarting API with zero downtime..."
docker compose -f docker/docker-compose.prod.yml up -d --no-deps api

echo "==> Cleaning up old images..."
docker image prune -f

echo "==> Deploy complete! Checking health..."
sleep 5
curl -sf http://localhost:4000/health && echo " API is healthy" || echo " WARNING: health check failed"
