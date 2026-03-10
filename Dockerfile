# Build context: project root (betix/)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ src/

ENV NODE_ENV=production
ENV BETIX_PORT=3000
EXPOSE 3000

CMD ["node", "src/app.js"]
