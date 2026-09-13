const cfg = require('../config');
const { loadCommands } = require('./commandLoader');
const fs = require('fs');
const path = require('path');

const MENU_IMAGE = path.join(__dirname, '..', 'assets', 'menu.jpg');
const MENU_SONG = path.join(__dirname, '..', 'assets', 'menu.mp3');

const CATEGORY_EMOJI = {
  OWNER: '👑',
  GROUP: '👥',
  TOOLS: '🛠️',
  GAME: '🎲',
  FUN: '🎉',
};

// Au-delà de ce nombre de commandes, on bascule sur une liste
// interactive (listMessage) au lieu de boutons (buttonsMessage),
// WhatsApp limitant les boutons natifs à un petit nombre lisible.
const BUTTON_LIMIT = 3;

/**
 * Menu principal : une liste interactive avec une section
 * "Catégories", une ligne par catégorie.
 */
async function sendMainMenu(sock, jid, quotedMsg) {
  const { categories } = loadCommands();

  const rows = Object.keys(categories).map((cat) => ({
    title: `${CATEGORY_EMOJI[cat] || '📁'} ${cat}`,
    description: `${categories[cat].length} commande(s)`,
    rowId: `menu_cat_${cat}`,
  }));

  // 1. Image locale du menu (bannière)
  if (fs.existsSync(MENU_IMAGE)) {
    await sock.sendMessage(jid, {
      image: fs.readFileSync(MENU_IMAGE),
      caption: `╔══━━─ *${cfg.BOT_NAME}* ─━━══╗\nPréfixe : *${cfg.PREFIX}*\nPropriétaire : *${cfg.OWNER_NAME}*`,
    }, { quoted: quotedMsg });
  }

  // 2. Son local du menu (notification sonore)
  if (fs.existsSync(MENU_SONG)) {
    await sock.sendMessage(jid, {
      audio: fs.readFileSync(MENU_SONG),
      mimetype: 'audio/mp4',
      ptt: false,
    }, { quoted: quotedMsg });
  }

  // 3. Liste interactive des catégories
  await sock.sendMessage(jid, {
    text: `Choisis une catégorie ci-dessous 👇`,
    footer: 'MR ROAN Inc',
    title: `📜 MENU`,
    buttonText: 'Voir les catégories',
    sections: [
      {
        title: 'Catégories disponibles',
        rows,
      },
    ],
  }, { quoted: quotedMsg });
}

/**
 * Menu d'une catégorie : boutons natifs si peu de commandes,
 * sinon liste interactive.
 */
async function sendCategoryMenu(sock, jid, category, quotedMsg) {
  const { categories } = loadCommands();
  const commands = categories[category];
  if (!commands) {
    await sock.sendMessage(jid, { text: `❌ Catégorie introuvable.` }, { quoted: quotedMsg });
    return;
  }

  const header = `${CATEGORY_EMOJI[category] || '📁'} *${category}*\nPréfixe : ${cfg.PREFIX}\n`;

  if (commands.length <= BUTTON_LIMIT) {
    // Boutons natifs (buttonsMessage)
    await sock.sendMessage(jid, {
      text: header + commands.map((c) => `• ${c.name} — ${c.description}`).join('\n'),
      footer: 'MR ROAN Inc',
      buttons: commands.map((c) => ({
        buttonId: `${cfg.PREFIX}${c.name}`,
        buttonText: { displayText: c.name.toUpperCase() },
        type: 1,
      })),
      headerType: 1,
    }, { quoted: quotedMsg });
  } else {
    // Liste interactive (listMessage)
    await sock.sendMessage(jid, {
      text: header,
      footer: 'MR ROAN Inc',
      title: `${category} — ${commands.length} commandes`,
      buttonText: 'Voir les commandes',
      sections: [
        {
          title: category,
          rows: commands.map((c) => ({
            title: c.name.toUpperCase(),
            description: c.description,
            rowId: `${cfg.PREFIX}${c.name}`,
          })),
        },
      ],
    }, { quoted: quotedMsg });
  }
}

module.exports = { sendMainMenu, sendCategoryMenu, CATEGORY_EMOJI };
