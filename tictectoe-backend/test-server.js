const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Test server is running!' });
});

const PORT = process.env.PORT || 3001;
console.log(`Starting test server on port ${PORT}`);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
}); 