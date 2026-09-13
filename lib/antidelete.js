const { getGroupSettings } = require('./groupStore');

const cache = new Map(); // key.id -> { sender, message }
const MAX_CACHE = 500;

function cacheMessage(msg) {
  if (!msg.message || !msg.key?.remoteJid?.endsWith('@g.us')) return;
  cache.set(msg.key.id, {
    sender: msg.key.participant || msg.key.remoteJid,
    message: msg.message,
  });
  if (cache.size > MAX_CACHE) {
    cache.delete(cache.keys().next().value);
  }
}

async function handleMessageUpdates(sock, updates) {
  for (const { key, update } of updates) {
    const jid = key.remoteJid;
    if (!jid?.endsWith('@g.us')) continue;
    if (update.message !== null) continue; // pas une suppression

    const settings = getGroupSettings(jid);
    if (!settings.antidelete) continue;

    const cached = cache.get(key.id);
    if (!cached) continue;

    try {
      await sock.sendMessage(jid, {
        text: `🗑️ Message supprimé par @${cached.sender.split('@')[0]} :`,
        mentions: [cached.sender],
      });
      await sock.relayMessage(jid, cached.message, {});
    } catch (err) {
      console.log(`⚠️ Anti-delete : ${err.message}`);
    }
  }
}

module.exports = { cacheMessage, handleMessageUpdates };
