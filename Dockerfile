# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose Expo ports
# 8081 - Metro bundler
# 19000 - Expo Dev Tools
# 19006 - Web
EXPOSE 8081 19000 19006

# Start Expo
CMD ["npx", "expo", "start", "--web"]

