FROM node:18-alpine

WORKDIR /app

# Copy frontend files
COPY frontend/ .

# Install static server
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", ".", "-p", "3000"]
