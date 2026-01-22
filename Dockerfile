# Use Node 20 Alpine
FROM node:20-alpine

RUN apk add --no-cache \
  libc6-compat \
  python3 \
  make \
  g++


# Set working directory
# WORKDIR /usr/src/app
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./

# Install dependencies
RUN pnpm install

# Copy Prisma folder first
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Copy rest of the source code
COPY . .

ENV DATABASE_URL="postgresql://agimtula_user:agimtula_password@db:5432/agimtula_db"

# Generate Prisma client
RUN pnpm prisma:generate

# Build the application
RUN pnpm build


# ✅ Fix permissions for dist and node_modules
# RUN mkdir -p /usr/src/app/dist && chmod -R 777 /usr/src/app

COPY entrypoint.sh /app/
RUN chmod +x /app/entrypoint.sh


# Expose port
EXPOSE 3000

ENTRYPOINT ["entrypoint.sh"]
# Default command
CMD ["pnpm", "run", "start:dev"]



