FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production || true
COPY src ./src
EXPOSE 8080
CMD ["node", "src/index.js"]