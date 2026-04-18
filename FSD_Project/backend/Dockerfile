# Use official Java image
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Build project
RUN mvn clean package

# Run application
CMD ["java", "-jar", "target/*.jar"]
