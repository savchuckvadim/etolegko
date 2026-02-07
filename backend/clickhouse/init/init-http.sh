#!/bin/sh
set -e

CLICKHOUSE_CONTAINER="${CLICKHOUSE_CONTAINER:-promo_code_manager_clickhouse}"

echo "🚀 ClickHouse Init Script"
echo "Target container: ${CLICKHOUSE_CONTAINER}"
echo "Waiting for ClickHouse to be ready..."

# Ждём, пока ClickHouse контейнер станет доступен
MAX_RETRIES=60
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker exec "${CLICKHOUSE_CONTAINER}" clickhouse-client --query "SELECT 1" > /dev/null 2>&1; then
    echo "✅ ClickHouse is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
    echo "⏳ ClickHouse is not ready yet, waiting... (${RETRY_COUNT}/${MAX_RETRIES})"
  fi
  sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ ClickHouse is not available after ${MAX_RETRIES} retries"
  exit 1
fi

# Применяем миграции
echo "📦 Applying migrations..."

# Создаём базу данных
echo "Creating database 'analytics'..."
docker exec "${CLICKHOUSE_CONTAINER}" clickhouse-client --query "CREATE DATABASE IF NOT EXISTS analytics" || {
  echo "⚠️  Failed to create database (may already exist)"
}

# Применяем схему таблиц
echo "Creating tables..."
docker exec -i "${CLICKHOUSE_CONTAINER}" clickhouse-client --database=analytics --multiquery < /schema/001-create-tables.sql || {
  echo "❌ Failed to create tables"
  exit 1
}

echo "✅ Migrations completed successfully!"

# Проверяем результат
echo "📊 Verifying tables..."
docker exec "${CLICKHOUSE_CONTAINER}" clickhouse-client --database=analytics --query "SHOW TABLES"
