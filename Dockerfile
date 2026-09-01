# Private-server image for Cadence.
# Stripe secret stays in runtime env — never baked into the image.
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NITRO_PRESET=node-server
RUN npm run build

FROM node:22-bookworm-slim
RUN useradd --create-home --uid 1001 cadence
WORKDIR /app
COPY --from=build --chown=cadence:cadence /app/.output ./.output
USER cadence
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080
EXPOSE 8080
CMD ["node", ".output/server/index.mjs"]
