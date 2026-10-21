#!/bin/sh
set -eu

echo "Applying pending Prisma migrations..."
./node_modules/.bin/prisma migrate deploy

echo "Starting ModelVault..."
exec node server.js
