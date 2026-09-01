FROM node:22-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=optional
COPY . .
RUN npm run build:web
ENV PORT=8080 HOST=0.0.0.0 NODE_ENV=production
EXPOSE 8080
CMD ["npx", "tsx", "--tsconfig", "apps/api/tsconfig.json", "apps/api/src/main.ts"]
