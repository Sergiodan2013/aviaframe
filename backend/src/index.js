const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));
app.get('/api/hello', (req, res) => res.json({ message: 'Hello from backend' }));

app.post('/public/search', (req, res) => {
  // Placeholder: validate and forward to DRCT adapter (not implemented here)
  const { origin, destination } = req.body || {};
  if (!origin || !destination) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'origin and destination required' }});
  }
  return res.json({
    search_id: 'search-placeholder',
    offers: []
  });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});