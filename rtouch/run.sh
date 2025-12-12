#!/usr/bin/with-contenv bashio
# shellcheck shell=bash

echo "Starting RTOUCH..."
cd /app || exit 1
npm run watch
