const { stub } = require('../lib/stub');
const config = require('../config');
const { sendMainMenu } = require('../lib/menu');

const startTime = Date.now();

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${days}d ${hours}h ${mins}m ${secs}s`;
}

module.exports = {
  category: 'OWNER',
  commands: [
    {
      name: 'menu',
      description: 'Affiche le menu principal (liste interactive des catégories)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sendMainMenu(sock, jid, msg);
      },
    },
    {
      name: 'ping',
      description: "Vérifie le temps de réponse du bot",
      implemented: true,
      async execute(sock, msg, args, jid) {
        const start = Date.now();
        const sent = await sock.sendMessage(jid, { text: '🏓 Pong...' }, { quoted: msg });
        const latency = Date.now() - start;
        await sock.sendMessage(jid, { text: `🏓 Pong ! ${latency}ms`, edit: sent.key });
      },
    },
    {
      name: 'alive',
      description: 'Indique que le bot est en ligne',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sock.sendMessage(jid, {
          text: `✅ *${config.BOT_NAME}* est en ligne !\n⏱️ Uptime : ${formatUptime(Date.now() - startTime)}`,
        }, { quoted: msg });
      },
    },
    {
      name: 'mode',
      description: 'Affiche ou change le mode du bot (public/privé)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sock.sendMessage(jid, { text: `⚙️ Mode actuel : *${config.MODE.toUpperCase()}*` }, { quoted: msg });
      },
    },
    {
      name: 'owner',
      description: 'Affiche le contact du propriétaire',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sock.sendMessage(jid, {
          contacts: {
            displayName: config.OWNER_NAME,
            contacts: [{ vcard:
              `BEGIN:VCARD\nVERSION:3.0\nFN:${config.OWNER_NAME}\nTEL;type=CELL;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\nEND:VCARD` }],
          },
        }, { quoted: msg });
      },
    },
    {
      name: 'runtime',
      description: 'Temps de fonctionnement du bot',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sock.sendMessage(jid, { text: `⏱️ Uptime : ${formatUptime(Date.now() - startTime)}` }, { quoted: msg });
      },
    },
    {
      name: 'info',
      description: 'Informations complètes sur le bot',
      implemented: true,
      async execute(sock, msg, args, jid) {
        await sock.sendMessage(jid, {
          text: `🤖 *${config.BOT_NAME}*\nPréfixe : ${config.PREFIX}\nMode : ${config.MODE}\nUptime : ${formatUptime(Date.now() - startTime)}\nPropriétaire : ${config.OWNER_NAME}`,
        }, { quoted: msg });
      },
    },
    {
      name: 'pair',
      description: 'Génère un pairing code pour lier un nouveau numéro (.pair 237600000000)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const { requestPairingCode } = require('../lib/pairing');
        if (!args[0]) {
          await sock.sendMessage(jid, { text: `❌ Indique un numéro. Exemple : ${config.PREFIX}pair 237600000000` }, { quoted: msg });
          return;
        }
        try {
          const code = await requestPairingCode(args[0]);
          await sock.sendMessage(jid, {
            text: `🔗 Code de pairing pour *${args[0]}* :\n\n*${code}*\n\nDans WhatsApp du numéro à lier : Paramètres > Appareils connectés > Lier un appareil > Lier avec le numéro de téléphone, puis saisis ce code.`,
          }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    stub('autotyping', "Active/désactive le mode 'en train d\u2019écrire' automatique"),
    stub('autorecording', "Active/désactive le mode 'enregistrement vocal' automatique"),
    stub('autoviewstatus', 'Vue automatique des statuts'),
    stub('autolikestatus', 'Like automatique des statuts'),
    stub('antideletem', 'Anti-suppression des messages privés'),
    stub('block', 'Bloque un contact'),
    stub('unblock', 'Débloque un contact'),
  ],
};
