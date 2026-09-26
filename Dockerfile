FROM node:24.21.0-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24.21.0-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
USER node
CMD ["npm", "run", "start"]
