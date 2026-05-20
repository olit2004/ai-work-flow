# Use official lightweight Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Expose Vite default dev server port
EXPOSE 5173

# Run the Vite dev server bound to all interfaces
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
