const { getGroupSettings } = require('./groupStore');

const LINK_REGEX = /(https?:\/\/|www\.|chat\.whatsapp\.com|wa\.me)/i;
const DEFAULT_BAD_WORDS = ['badword1', 'badword2']; // à compléter selon les besoins

const spamTracker = new Map();
const SPAM_WINDOW_MS = 10000;
const SPAM_LIMIT = 6;

/**
 * Retourne true si le message a été traité (supprimé) par la
 * modération et ne doit donc pas être interprété comme une commande.
 */
async function moderateMessage(sock, msg) {
  const jid = msg.key.remoteJid;
  if (!jid?.endsWith('@g.us') || msg.key.fromMe) return false;

  const settings = getGroupSettings(jid);
  if (!settings.antilink && !settings.antibadword && !settings.antispam) return false;

  const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
  const sender = msg.key.participant || msg.key.remoteJid;

  if (settings.antilink && LINK_REGEX.test(text)) {
    await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
    await sock.sendMessage(jid, {
      text: `🚫 Lien détecté, message supprimé.`,
      mentions: [sender],
    }).catch(() => {});
    return true;
  }

  if (settings.antibadword && DEFAULT_BAD_WORDS.some((w) => text.toLowerCase().includes(w))) {
    await sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
    await sock.sendMessage(jid, { text: `⚠️ Merci de rester correct.`, mentions: [sender] }).catch(() => {});
    return true;
  }

  if (settings.antispam) {
    const key = `${jid}:${sender}`;
    const now = Date.now();
    const entry = spamTracker.get(key) || { count: 0, windowStart: now };
    if (now - entry.windowStart > SPAM_WINDOW_MS) {
      entry.count = 0;
      entry.windowStart = now;
    }
    entry.count += 1;
    spamTracker.set(key, entry);

    if (entry.count > SPAM_LIMIT) {
      await sock.sendMessage(jid, {
        text: `🚫 @${sender.split('@')[0]} ralentis, tu spammes.`,
        mentions: [sender],
      }).catch(() => {});
      entry.count = 0;
    }
  }

  return false;
}

module.exports = { moderateMessage, DEFAULT_BAD_WORDS };
