# Build from the repository root:
#   docker build -f backend/Dockerfile -t gd-united-list-backend .
FROM node:22-bookworm-slim AS build
WORKDIR /app/backend
COPY backend/package.json ./
RUN npm install
COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/tests ./tests
COPY shared /app/shared
RUN npx tsc --noEmit

FROM node:22-bookworm-slim
WORKDIR /app/backend
ENV NODE_ENV=production
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/src ./src
COPY --from=build /app/backend/package.json ./package.json
COPY --from=build /app/backend/tsconfig.json ./tsconfig.json
COPY --from=build /app/shared /app/shared
RUN mkdir -p /app/backend/data && chown -R node:node /app
USER node
EXPOSE 3001
CMD ["npx", "tsx", "src/server.ts"]
