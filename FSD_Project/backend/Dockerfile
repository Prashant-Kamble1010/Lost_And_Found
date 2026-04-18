# Use official Java image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build the project
RUN ./mvnw clean package || mvn clean package

# Run the jar file
CMD ["java", "-jar", "target/*.jar"]
