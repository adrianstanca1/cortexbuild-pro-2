FROM node:22-alpine AS base
RUN apk add --no-cache python3 make g++ vips-dev

FROM base AS build
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

FROM base AS production
WORKDIR /app
RUN apk add --no-cache vips-dev
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/src /app/src
COPY --from=build /app/static /app/static
COPY --from=build /app/package.json /app/package.json
EXPOSE 3000
CMD ["node", "src/index.js"]
