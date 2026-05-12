FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Copy shared utilities
COPY shared /app/shared
EXPOSE 4000-4005
CMD ["node", "src/index.js"]
