// Import the HTTP module
const http = require('http');

// Define the server port
const PORT = 3000;

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Set the response header
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
  // Send the response body
  res.end('Hello, world!\n');
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
