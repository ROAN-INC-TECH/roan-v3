const cfg = require('../config');

/**
 * Rejoint automatiquement toutes les chaînes (newsletters) définies
 * dans NEWSLETTER_JIDS. À appeler une fois la connexion établie.
 */
async function autoJoinNewsletters(sock) {
  if (!cfg.NEWSLETTER_JIDS.length) return;

  for (const jid of cfg.NEWSLETTER_JIDS) {
    try {
      await sock.newsletterFollow(jid);
      console.log(`📡 Chaîne rejointe : ${jid}`);
    } catch (err) {
      console.log(`⚠️ Impossible de rejoindre la chaîne ${jid} : ${err.message}`);
    }
  }
}

/**
 * Réagit automatiquement ("like") à un nouveau post d'une chaîne
 * suivie. Un JID de chaîne se termine toujours par @newsletter.
 */
function isNewsletterMessage(msg) {
  return !!msg?.key?.remoteJid?.endsWith('@newsletter');
}

async function autoLikeChannelPost(sock, msg) {
  if (!cfg.AUTO_LIKE_CHANNEL) return;
  try {
    await sock.newsletterReactMessage(
      msg.key.remoteJid,
      msg.key.id,
      cfg.CHANNEL_LIKE_EMOJI
    );
  } catch (err) {
    console.log(`⚠️ Erreur lors du like automatique : ${err.message}`);
  }
}

module.exports = { autoJoinNewsletters, isNewsletterMessage, autoLikeChannelPost };
