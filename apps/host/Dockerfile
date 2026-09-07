# Build context: repository root.
FROM node:22-bookworm-slim AS build
ARG REVIEW_REMOTE_URL
ENV REVIEW_REMOTE_URL=$REVIEW_REMOTE_URL
RUN npm install --global pnpm@11.19.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/host/package.json apps/host/
COPY apps/review/package.json apps/review/
COPY packages/contracts/package.json packages/contracts/
COPY packages/ui/package.json packages/ui/
RUN pnpm install --frozen-lockfile
COPY config config
COPY packages packages
COPY apps/host apps/host
RUN pnpm --filter @ordo/contracts build && pnpm --filter @ordo/host build

FROM nginx:1.27-alpine
COPY apps/host/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/host/dist /usr/share/nginx/html
ENV API_UPSTREAM=http://ordo-api
EXPOSE 80
