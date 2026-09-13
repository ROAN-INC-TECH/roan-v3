function isGroupAdmin(metadata, participantJid) {
  const p = metadata.participants.find((x) => x.id === participantJid);
  return !!p && (p.admin === 'admin' || p.admin === 'superadmin');
}

/**
 * Détermine le JID cible d'une commande : membre mentionné,
 * sinon auteur du message cité, sinon numéro passé en argument.
 */
function extractTargetJid(msg, args) {
  const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
  if (mentioned) return mentioned;

  const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
  if (quotedParticipant) return quotedParticipant;

  if (args[0]) {
    const cleaned = args[0].replace(/[^0-9]/g, '');
    if (cleaned) return `${cleaned}@s.whatsapp.net`;
  }
  return null;
}

async function requireGroup(sock, msg, jid) {
  if (!jid.endsWith('@g.us')) {
    await sock.sendMessage(jid, { text: '❌ Cette commande fonctionne uniquement dans un groupe.' }, { quoted: msg });
    return false;
  }
  return true;
}

async function requireSenderAdmin(sock, msg, jid, metadata) {
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!isGroupAdmin(metadata, sender)) {
    await sock.sendMessage(jid, { text: '❌ Réservé aux admins du groupe.' }, { quoted: msg });
    return false;
  }
  return true;
}

async function requireBotAdmin(sock, msg, jid, metadata) {
  if (!isGroupAdmin(metadata, sock.user.id)) {
    await sock.sendMessage(jid, { text: '❌ Je dois être admin du groupe pour faire ça.' }, { quoted: msg });
    return false;
  }
  return true;
}

module.exports = {
  isGroupAdmin,
  extractTargetJid,
  requireGroup,
  requireSenderAdmin,
  requireBotAdmin,
};
