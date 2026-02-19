# ---- Dev stage ----
FROM docker.io/oven/bun:1.2.18 AS dev

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy remaining source
COPY . .

COPY entrypoint.sh .
ENTRYPOINT ["./entrypoint.sh"]

EXPOSE 3000

CMD ["bun", "run", "dev"]


# ---- Production stage ----
FROM docker.io/oven/bun:1.2.18 AS production

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY src/ ./src/
COPY migrations/ ./migrations/
COPY tsconfig.json ./

COPY entrypoint.sh .
ENTRYPOINT ["./entrypoint.sh"]

EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "run", "start"]
