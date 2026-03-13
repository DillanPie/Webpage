# Step 1: Use an official, lightweight Node.js image
FROM node:20-alpine

# Step 2: Set the working directory inside the container
WORKDIR /app

# Step 3: Copy package files and install dependencies.
# This leverages Docker's layer caching. This step only re-runs if your package files change.
COPY package*.json ./
RUN npm ci

# Step 4: Copy the rest of your source code
COPY . .

# Step 5: Run the Vite build process
RUN npm run build

# The result is a /app/dist folder inside the image's filesystem.
