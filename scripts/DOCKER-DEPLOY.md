# Shop Meal - Docker deployment (development)

This repository is a Maven aggregator with independently versioned Spring Boot
modules. The root `Dockerfile` builds one runnable service at a time with
`mvn -pl <module> -am`, so `contract-service` is included when a service needs it. The shared contract
module is packaged as a normal library JAR (Spring Boot repackaging is skipped
for that module), not as a runnable application.

## 1. Requirements

- Docker Engine and Docker Compose v2
- At least 8 GB RAM recommended for building/running the complete stack
- On Linux, Elasticsearch requires `vm.max_map_count >= 262144`

```bash
sudo sysctl -w vm.max_map_count=262144
```

To persist it after reboot:

```bash
echo 'vm.max_map_count=262144' | sudo tee /etc/sysctl.d/99-elasticsearch.conf
sudo sysctl --system
```

## 2. Configure environment

From the repository root:

```bash
cp .env.docker.example .env
```

Edit `.env`. The included values are for local development only. Configure
Google OAuth, Brevo and PayOS values if you want to use those integrations.

## 3. Validate and build

```bash
docker compose -f docker-compose.yaml config
docker compose -f docker-compose.yaml build
```

The first build downloads Maven dependencies and Node packages and may take
several minutes. Each Spring Boot image is built from the root Maven reactor.

## 4. Start the complete system

```bash
docker compose -f docker-compose.yaml up -d
docker compose -f docker-compose.yaml ps
```

Open:

- Frontend: http://localhost:3000
- API Gateway: http://localhost:8888
- Eureka Dashboard: http://localhost:8761
- Elasticsearch: http://localhost:9200
- MinIO Console: http://localhost:9001 (credentials from `.env`)
- Kafka host bootstrap: `localhost:9092`

Containers on the Compose network use Kafka `broker:9093`, MySQL `mysql:3306`,
MongoDB `mongodb:27017`, Redis `redis:6379`, Elasticsearch `elasticsearch:9200`,
and MinIO `minio:9000`.

The frontend is published on port 3000 because the current Socket.IO server
configuration allows `http://localhost:3000`. The API Gateway CORS configuration
also allows this origin. The order service exposes Socket.IO on port 8099.

## 5. Useful commands

```bash
# Follow all logs
docker compose logs -f

# Follow one service
docker compose logs -f api-gateway

# Restart one service
docker compose restart identity-service

# Rebuild a changed backend module
docker compose build identity-service
docker compose up -d identity-service

# Stop containers but preserve named volumes
docker compose down

# Stop and DELETE all database/message/object-storage data (destructive)
docker compose down -v
```

## 6. Important notes / project-specific adjustments

- The gateway's `WebConfiguration` previously called identity introspection at
  `localhost:8080`. That address points back to the gateway container, so this
  deployment bundle changes it to the configurable `identity.internal-url`
  property and sets it to `http://identity-service:8080`.
- `notification-service` is registered as `notification-service` in Docker so
  it matches the Gateway route `lb://notification-service`; the source YAML
  originally used `notification_service`.
- Elasticsearch security is disabled in this local development Compose file
  to keep the Search Service's HTTP client simple. Do not expose this setup to
  the public internet. Enable authentication/TLS and configure the Search
  Service truststore for production.
- `minio-init` creates the `shop-meal` bucket before `file-service` starts.
- MySQL starts with `identity_db`; the other JDBC URLs use
  `createDatabaseIfNotExist=true` and connect as the configured MySQL user.
- The current project has a Socket.IO server configured on port 8099. The
  frontend build points to `http://localhost:8099`.
- Vite environment variables are embedded at frontend build time. If you
  change `VITE_API_BASE_URL`, `VITE_SOCKET_URL` or Google client settings,
  rebuild `web-app`.
- The current application configuration uses Java 25. The Dockerfiles use
  Java 25 for both Maven compilation and runtime.
- The compose file uses local development credentials by default. Replace
  passwords, JWT key, OAuth secrets, PayOS keys and Brevo key before deployment.
