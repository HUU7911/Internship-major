# syntax=docker/dockerfile:1.7

# This is a multi-module Maven reactor. Build the requested service together
# with its reactor dependencies (notably contract-service).
FROM maven:3.9-eclipse-temurin-25 AS builder

WORKDIR /workspace
COPY . .

ARG SERVICE_MODULE
ARG SERVICE_ARTIFACT

RUN --mount=type=cache,target=/root/.m2 \
    set -eux; \
    test -n "${SERVICE_MODULE}"; \
    test -n "${SERVICE_ARTIFACT}"; \
    mvn -B -ntp -f pom.xml -pl "${SERVICE_MODULE}" -am -DskipTests package; \
    JAR_PATH="$(find "${SERVICE_MODULE}/target" -maxdepth 1 -type f -name "${SERVICE_ARTIFACT}-*.jar" ! -name "*.original" -print -quit)"; \
    test -n "${JAR_PATH}"; \
    cp "${JAR_PATH}" /tmp/app.jar

FROM eclipse-temurin:25-jre AS runtime

WORKDIR /app

RUN useradd --system --uid 10001 --create-home spring \
    && mkdir -p /app/upload \
    && chown -R spring:spring /app

COPY --from=builder --chown=spring:spring /tmp/app.jar /app/app.jar

USER spring:spring

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
