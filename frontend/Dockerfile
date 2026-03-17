# frontend/Dockerfile

# 1. Use Node.js image
FROM node:20-alpine

# 2. Set working directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy the rest of the code
COPY . .

# 6. Build the application
RUN npm run build

# 7. Expose port (Next.js runs on 3000 inside container; docker-compose maps host 3001 -> container 3000)
EXPOSE 3000

# 8. Start Next.js in Production mode
CMD ["npm", "run", "start"]