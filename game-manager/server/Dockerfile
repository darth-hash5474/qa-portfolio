FROM node:16-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
ENV PORT=5000
EXPOSE 5000
CMD ["node", "index.js"]
