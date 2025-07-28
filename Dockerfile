# Use Node.js LTS version
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the application code
COPY . .

# Expose the application port
EXPOSE 5050

# Start the application
CMD ["npm", "start"]
