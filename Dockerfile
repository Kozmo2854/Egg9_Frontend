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

# Create .env from .env.example
RUN cp .env.example .env || touch .env

# Export web build (creates static files)
RUN npx expo export -p web

# Install serve to host static files
RUN npm install -g serve

# Railway provides PORT env variable, default to 8081
ENV PORT=8081

# Expose the port
EXPOSE 8081

# Serve the static build on Railway's PORT
CMD serve dist -l $PORT -s

