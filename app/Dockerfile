FROM node:22-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
COPY scripts/ ./scripts/
RUN yarn install --frozen-lockfile
COPY . .
ARG EXPO_PUBLIC_API_URL=http://localhost:5080
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx expo export --platform web

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n\n  # Hashed static assets — cache forever\n  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {\n    expires 1y;\n    add_header Cache-Control "public, max-age=31536000, immutable";\n    try_files $uri =404;\n  }\n\n  # index.html — never cache so deploys are instant\n  location = /index.html {\n    add_header Cache-Control "no-cache, no-store, must-revalidate";\n    add_header Pragma "no-cache";\n    expires 0;\n  }\n\n  location / {\n    try_files $uri $uri/ /index.html;\n    add_header Cache-Control "no-cache, no-store, must-revalidate";\n  }\n\n  gzip on;\n  gzip_types text/plain text/css application/json application/javascript text/xml application/javascript;\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
