#!/bin/sh
set -eu

: "${FRONTEND_API_BASE_URL:=}"
export FRONTEND_API_BASE_URL

envsubst '${FRONTEND_API_BASE_URL}' \
  < /usr/share/nginx/html/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
