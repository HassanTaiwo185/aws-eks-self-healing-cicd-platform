FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_WS_URL
RUN npm run build


FROM nginxinc/nginx-unprivileged:1.30-alpine

USER root
ARG APK_CACHE_BUST
RUN echo "cache bust: $APK_CACHE_BUST" \
 && apk upgrade --no-cache
USER 101

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080