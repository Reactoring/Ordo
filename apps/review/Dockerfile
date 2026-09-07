# Build context: repository root.
FROM node:22-bookworm-slim AS build
ARG HOST_URL
ENV HOST_URL=$HOST_URL
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
COPY apps/review apps/review
RUN pnpm --filter @ordo/contracts build && pnpm --filter @ordo/review build

FROM nginx:1.27-alpine
COPY apps/review/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/apps/review/dist /usr/share/nginx/html
ENV HOST_ORIGIN=http://localhost:3000
EXPOSE 80
