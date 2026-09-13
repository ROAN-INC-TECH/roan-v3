const cfg = require('./config');
const { startBot } = require('./lib/connection');
const { startWebServer } = require('./web/server');

console.log(`🚀 Démarrage de ${cfg.BOT_NAME} (MR ROAN Inc)...`);
startWebServer();
startBot();
