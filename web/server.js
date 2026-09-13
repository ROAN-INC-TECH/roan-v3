const express = require('express');
const path = require('path');
const cfg = require('../config');
const { requestPairingCode, getStatus } = require('../lib/pairing');

function startWebServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/status', (req, res) => {
    res.json({ botName: cfg.BOT_NAME, owner: cfg.OWNER_NAME, ...getStatus() });
  });

  app.post('/api/pair', async (req, res) => {
    const { number } = req.body || {};
    if (!number) {
      return res.status(400).json({ error: 'Numéro requis.' });
    }
    try {
      const code = await requestPairingCode(number);
      res.json({ code });
    } catch (err) {
      res.status(400).json({ error: err.message || 'Impossible de générer le code.' });
    }
  });

  app.listen(port, () => {
    console.log(`🌐 Page de pairing disponible sur le port ${port}`);
  });
}

module.exports = { startWebServer };
