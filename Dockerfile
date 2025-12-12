ARG BUILD_FROM
FROM $BUILD_FROM

# Install Node.js
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Install Backend Deps
COPY package.json .
RUN npm install

# Copy Source
COPY . .

# Initial Build of Frontend
WORKDIR /app/client
RUN npm install
RUN npm run build

WORKDIR /app
RUN chmod a+x run.sh
CMD [ "/run.sh" ]
