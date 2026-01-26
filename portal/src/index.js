const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  res.send('<html><body><h1>Aviaframe Portal</h1><p>Replace with real portal</p></body></html>');
});

app.listen(port, () => {
  console.log(`Portal listening on port ${port}`);
});