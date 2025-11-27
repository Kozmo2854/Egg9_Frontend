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

# Accept build-time arguments from Railway
ARG EXPO_PUBLIC_API_URL
ARG EXPO_PUBLIC_APP_ENV=production

# Make them available as environment variables during build
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_APP_ENV=$EXPO_PUBLIC_APP_ENV

# Export web build (creates static files with env vars baked in)
RUN npx expo export -p web

# Install serve to host static files
RUN npm install -g serve

# Railway provides PORT env variable, default to 8081
ENV PORT=8081

# Expose the port
EXPOSE 8081

# Serve the static build on Railway's PORT
CMD serve dist -l $PORT -s

