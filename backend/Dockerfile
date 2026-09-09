FROM node:22-bookworm-slim
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/src ./src
COPY frontend /app/frontend
COPY database /app/database
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
