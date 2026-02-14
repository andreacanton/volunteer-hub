# ---- Build stage ----
FROM docker.io/instrumentisto/flutter:3.32 AS build

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .
RUN flutter build web

# ---- Serve stage ----
FROM docker.io/nginx:alpine AS production

COPY --from=build /app/build/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
