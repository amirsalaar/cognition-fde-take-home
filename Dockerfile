# Multi-stage build. Non-root runtime. No image publishing anywhere.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Full toolchain for lint, typecheck, unit tests, migrations, and seeding.
FROM node:20-alpine AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

FROM dev AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN AUTH_SECRET=build-placeholder npm run build

# Playwright E2E runner with browsers preinstalled.
FROM mcr.microsoft.com/playwright:v1.54.2-noble AS e2e
WORKDIR /app
COPY --from=deps --chown=pwuser:pwuser /app/node_modules ./node_modules
COPY --chown=pwuser:pwuser . .
RUN npx prisma generate \
  && chown -R pwuser:pwuser /app/node_modules/.prisma /app/node_modules/@prisma \
  && chown pwuser:pwuser /app
USER pwuser
CMD ["npx", "playwright", "test"]

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
USER app
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=20 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "server.js"]
