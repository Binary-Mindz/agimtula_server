#!/bin/bash

echo "🚀 Starting Docker containers and setting up the database..."

set -e  # Exit immediately if a command fails

# Determine docker compose command
if command -v docker compose &> /dev/null; then
    DC="docker compose"
elif command -v docker-compose &> /dev/null; then
    DC="docker-compose"
else
    echo "❌ Docker Compose is not installed."
    exit 1
fi

DB_SERVICE="db"         # Name of your database service in docker-compose.yml
REDIS_SERVICE="redis"   # Name of redis service in docker-compose.yml
REDIS_PORT=6379         # Redis default port

# Check if containers are already running
RUNNING_CONTAINERS=$($DC ps -q)

# CHUNK_SIZE=[ -z "$RUNNING_CONTAINERS" ]

echo $RUNNING_CONTAINERS

if [ -z "$RUNNING_CONTAINERS" ]; then
    echo "🔹 Running Docker containers with dev profile..."
    $DC --profile dev up -d
else
    echo "ℹ️ Docker containers already running, skipping start."
    exit 0
fi

# Wait for Postgres to be ready
echo "🔹 Waiting for Postgres to be ready..."
MAX_RETRIES=30
count=0
until $DC exec -T -e PGPASSWORD=$DB_PASSWORD $DB_SERVICE pg_isready -U $DB_USER -d $DB_NAME > /dev/null 2>&1; do
    count=$((count+1))
    if [ $count -ge $MAX_RETRIES ]; then
        echo "❌ Postgres did not become ready in time."
        exit 1
    fi
    echo "⏳ Waiting for database... ($count/$MAX_RETRIES)"
    sleep 2
done
echo "✅ Postgres is ready!"

# Wait for Redis
echo "🔹 Waiting for Redis to be ready..."
count=0
until $DC exec -T $REDIS_SERVICE redis-cli ping | grep -q "PONG"; do
    count=$((count+1))
    if [ $count -ge $MAX_RETRIES ]; then
        echo "❌ Redis did not become ready in time."
        exit 1
    fi
    echo "⏳ Waiting for Redis... ($count/$MAX_RETRIES)"
    sleep 2
done
echo "✅ Redis is ready!"


# Run application
echo "🔹 Starting the application..."
pnpm start:dev