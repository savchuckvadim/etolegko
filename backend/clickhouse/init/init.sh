#!/bin/sh
set -e

CLICKHOUSE_HOST="${CLICKHOUSE_HOST:-clickhouse}"
CLICKHOUSE_PORT="${CLICKHOUSE_PORT:-9000}"
CLICKHOUSE_USER="${CLICKHOUSE_USER:-default}"
CLICKHOUSE_PASSWORD="${CLICKHOUSE_PASSWORD:-}"

echo "🚀 ClickHouse Init Script"
echo "Target: ${CLICKHOUSE_USER}@${CLICKHOUSE_HOST}:${CLICKHOUSE_PORT}"
echo "Waiting for ClickHouse to be ready..."

# Ждём, пока ClickHouse станет доступен
MAX_RETRIES=30
RETRY_COUNT=0

CLIENT_OPTS="--host ${CLICKHOUSE_HOST} --port ${CLICKHOUSE_PORT} --user ${CLICKHOUSE_USER}"
if [ -n "${CLICKHOUSE_PASSWORD}" ]; then
  CLIENT_OPTS="${CLIENT_OPTS} --password ${CLICKHOUSE_PASSWORD}"
fi

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if clickhouse-client ${CLIENT_OPTS} --query "SELECT 1" > /dev/null 2>&1; then
    echo "✅ ClickHouse is ready!"
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ ClickHouse is not ready yet, waiting... (${RETRY_COUNT}/${MAX_RETRIES})"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ ClickHouse is not available after ${MAX_RETRIES} retries"
  exit 1
fi

# Применяем миграции
echo "📦 Applying migrations..."

# Создаём базу данных
echo "Creating database 'analytics'..."
clickhouse-client ${CLIENT_OPTS} --query "CREATE DATABASE IF NOT EXISTS analytics"

# Применяем схему таблиц
echo "Creating tables..."
clickhouse-client ${CLIENT_OPTS} --database analytics --multiquery < /schema/001-create-tables.sql

echo "✅ Migrations completed successfully!"

# Проверяем результат
echo "📊 Verifying tables..."
clickhouse-client ${CLIENT_OPTS} --database analytics --query "SHOW TABLES"
