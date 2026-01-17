#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Production Deployment..."

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Build and start services in detached mode
echo "📦 Building and starting Docker containers..."
docker-compose -f docker-compose.prod.yml up --build -d

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

echo "✅ Deployment complete! Frontend is running on port 80."
echo "🔗 Access the dashboard at http://localhost"
