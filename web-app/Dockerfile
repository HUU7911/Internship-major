FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8888/api/v1
ARG VITE_SOCKET_URL=http://localhost:8099
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/authenticate

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SOCKET_URL=${VITE_SOCKET_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_GOOGLE_REDIRECT_URI=${VITE_GOOGLE_REDIRECT_URI}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
