const cfg = require('../config');
const { loadCommands } = require('./commandLoader');
const { sendCategoryMenu } = require('./menu');
const { moderateMessage } = require('./groupModeration');

/**
 * Extrait le texte utile d'un message, qu'il vienne d'un texte
 * classique, d'une réponse à un bouton ou d'une réponse à une liste.
 */
function extractText(message) {
  if (!message) return null;
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId;
  }
  if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
    return message.listResponseMessage.singleSelectReply.selectedRowId;
  }
  return null;
}

async function handleMessage(sock, msg) {
  try {
    if (!msg.message || msg.key.fromMe) return;
    const jid = msg.key.remoteJid;

    if (await moderateMessage(sock, msg)) return;

    const text = extractText(msg.message);
    if (!text) return;

    // Clic sur une catégorie du menu principal
    if (text.startsWith('menu_cat_')) {
      const category = text.replace('menu_cat_', '');
      await sendCategoryMenu(sock, jid, category, msg);
      return;
    }

    // Commande classique avec préfixe
    if (!text.startsWith(cfg.PREFIX)) return;
    const [rawName, ...args] = text.slice(cfg.PREFIX.length).trim().split(/\s+/);
    const name = rawName.toLowerCase();

    const { flat } = loadCommands();
    const entry = flat.get(name);
    if (!entry) return;

    await entry.command.execute(sock, msg, args, jid);
  } catch (err) {
    console.error('Erreur handler:', err);
  }
}

module.exports = { handleMessage };
