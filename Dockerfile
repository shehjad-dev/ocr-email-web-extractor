FROM node:14

# Set the working directory in the container
WORKDIR /app

# Install Tesseract OCR
RUN apt-get update && apt-get install -y tesseract-ocr

# Copy package.json and package-lock.json (if available) into the container at /app
COPY package*.json ./

# Install any dependencies
RUN npm install

# Copy the rest of your app's source code from your host to your image filesystem.
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define the command to run your app
CMD ["node", "app.js"]