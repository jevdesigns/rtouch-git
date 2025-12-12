ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM}

ENV LANG C.UTF-8

# Install build and runtime deps
RUN apk add --no-cache nodejs npm bash

WORKDIR /app

# Copy package manifest and install backend deps
COPY package.json package-lock.json* ./
RUN npm install --production || true

# Copy the add-on files
COPY . /app

# Build frontend (install dev deps if needed)
WORKDIR /app/client
RUN npm install --production || npm install
RUN npm run build || true

WORKDIR /app
RUN chmod a+x /run.sh || chmod a+x run.sh

CMD [ "/run.sh" ]
