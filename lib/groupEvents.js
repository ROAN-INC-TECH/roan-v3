const { getGroupSettings } = require('./groupStore');

async function handleGroupParticipantsUpdate(sock, update) {
  const { id: jid, participants, action, author } = update;
  const settings = getGroupSettings(jid);

  if (action === 'add' && settings.welcome) {
    for (const p of participants) {
      const text = (settings.welcomeMessage || 'Bienvenue {user} dans le groupe !').replace(
        '{user}', `@${p.split('@')[0]}`
      );
      await sock.sendMessage(jid, { text, mentions: [p] }).catch(() => {});
    }
  }

  if (action === 'remove' && settings.goodbye) {
    for (const p of participants) {
      const text = (settings.goodbyeMessage || 'Au revoir {user} 👋').replace(
        '{user}', `@${p.split('@')[0]}`
      );
      await sock.sendMessage(jid, { text, mentions: [p] }).catch(() => {});
    }
  }

  // author = qui a fait l'action ; si ce n'est pas le bot lui-même, on annule
  if (action === 'promote' && settings.antipromote && author && author !== sock.user.id) {
    await sock.groupParticipantsUpdate(jid, participants, 'demote').catch(() => {});
    await sock.sendMessage(jid, { text: '🚫 Promotion non autorisée, annulée automatiquement.' }).catch(() => {});
  }

  if (action === 'demote' && settings.antidemote && author && author !== sock.user.id) {
    await sock.groupParticipantsUpdate(jid, participants, 'promote').catch(() => {});
    await sock.sendMessage(jid, { text: '🚫 Rétrogradation non autorisée, annulée automatiquement.' }).catch(() => {});
  }
}

module.exports = { handleGroupParticipantsUpdate };
