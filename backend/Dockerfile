FROM node:20-alpine

WORKDIR /app

# Install deps first
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev=false

COPY . .

RUN npm run build

EXPOSE 3000

# Run migrations/seed on container start (safe to run multiple times)
CMD ["sh", "-lc", "npm run db:migrate && npm run db:seed && npm run start"]
