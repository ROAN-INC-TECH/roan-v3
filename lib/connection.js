const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const cfg = require('../config');
const { handleMessage } = require('./handler');
const { setSocket } = require('./pairing');
const { autoJoinNewsletters, isNewsletterMessage, autoLikeChannelPost } = require('./newsletter');
const { setBotProfilePicture } = require('./profile');
const { handleGroupParticipantsUpdate } = require('./groupEvents');
const { cacheMessage, handleMessageUpdates } = require('./antidelete');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(cfg.SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: [cfg.BOT_NAME, 'Chrome', '1.0.0'],
  });

  setSocket(sock);
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('📲 Scanne ce QR code (ou utilise la page web pour un pairing code) :');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Connexion fermée.', shouldReconnect ? 'Reconnexion...' : 'Déconnecté (relance le pairing).');
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`✅ ${cfg.BOT_NAME} est connecté à WhatsApp !`);
      autoJoinNewsletters(sock);
      setBotProfilePicture(sock).catch((err) => console.log(`⚠️ Photo de profil non appliquée : ${err.message}`));
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    cacheMessage(msg);
    if (isNewsletterMessage(msg)) {
      await autoLikeChannelPost(sock, msg);
      return;
    }
    await handleMessage(sock, msg);
  });

  sock.ev.on('messages.update', async (updates) => {
    await handleMessageUpdates(sock, updates);
  });

  sock.ev.on('group-participants.update', async (update) => {
    await handleGroupParticipantsUpdate(sock, update);
  });

  return sock;
}

module.exports = { startBot };
