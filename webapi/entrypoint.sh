#!/bin/sh
set -e

echo "Running database migrations..."
bun run migrate
echo "Migrations complete."

exec "$@"
