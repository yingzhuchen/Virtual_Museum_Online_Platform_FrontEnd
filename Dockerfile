FROM node:20-alpine as build

WORKDIR /src

RUN corepack enable

COPY . .
RUN pnpm install --production --frozen-lockfile

RUN pnpm build

FROM node:20-alpine as output

WORKDIR /app

COPY --from=build /src/.output ./

CMD ["node", "server/index.mjs"]