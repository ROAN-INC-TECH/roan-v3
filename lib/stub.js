/**
 * Génère une commande "stub" (pas encore codée) qui répond juste
 * qu'elle est en développement. Permet de faire apparaître toutes
 * les commandes dans le menu dès maintenant, et de les coder une
 * par une ensuite sans toucher au menu.
 */
function stub(name, description) {
  return {
    name,
    description,
    implemented: false,
    async execute(sock, msg, args, jid) {
      await sock.sendMessage(jid, {
        text: `🚧 *${name.toUpperCase()}* est en cours de développement.`,
      }, { quoted: msg });
    },
  };
}

module.exports = { stub };
