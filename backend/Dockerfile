FROM maven:3.9.9-eclipse-temurin-17 AS builder

ARG SERVICE_PATH
WORKDIR /workspace

# Copy backend mono-repo and build the selected service.
COPY . .
WORKDIR /workspace/${SERVICE_PATH}
RUN mvn -B -DskipTests clean package

FROM eclipse-temurin:17-jre
ARG SERVICE_PATH
WORKDIR /app

COPY --from=builder /workspace/${SERVICE_PATH}/target/*.jar /app/app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
