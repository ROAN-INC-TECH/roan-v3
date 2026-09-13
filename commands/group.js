const { getGroupSettings, setGroupSetting } = require('../lib/groupStore');
const { isGroupAdmin, extractTargetJid, requireGroup, requireSenderAdmin, requireBotAdmin } = require('../lib/groupHelpers');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function toggleArg(args) {
  const v = (args[0] || '').toLowerCase();
  if (['on', 'activer', 'oui'].includes(v)) return true;
  if (['off', 'desactiver', 'désactiver', 'non'].includes(v)) return false;
  return null;
}

module.exports = {
  category: 'GROUP',
  commands: [
    {
      name: 'tagall',
      description: 'Mentionne tous les membres du groupe',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const text = args.join(' ') || '📢 Attention tout le monde :';
        const lines = metadata.participants.map((p) => `@${p.id.split('@')[0]}`).join('\n');
        await sock.sendMessage(jid, { text: `${text}\n\n${lines}`, mentions: metadata.participants.map((p) => p.id) }, { quoted: msg });
      },
    },
    {
      name: 'hidetag',
      description: 'Mentionne tout le monde sans afficher la liste',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        await sock.sendMessage(jid, {
          text: args.join(' ') || '\u200b',
          mentions: metadata.participants.map((p) => p.id),
        }, { quoted: msg });
      },
    },
    {
      name: 'kick',
      description: 'Expulse un membre (en réponse à son message ou mention)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const target = extractTargetJid(msg, args);
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Mentionne, réponds à, ou indique un numéro.' }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        await sock.sendMessage(jid, { text: `✅ @${target.split('@')[0]} expulsé.`, mentions: [target] }, { quoted: msg });
      },
    },
    {
      name: 'kicknum',
      description: 'Expulse un membre par numéro (.kicknum 237600000000)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        if (!args[0]) {
          await sock.sendMessage(jid, { text: '❌ Indique un numéro.' }, { quoted: msg });
          return;
        }
        const target = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        await sock.groupParticipantsUpdate(jid, [target], 'remove');
        await sock.sendMessage(jid, { text: `✅ @${target.split('@')[0]} expulsé.`, mentions: [target] }, { quoted: msg });
      },
    },
    {
      name: 'add',
      description: 'Ajoute un membre au groupe (.add 237600000000)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        if (!args[0]) {
          await sock.sendMessage(jid, { text: '❌ Indique un numéro.' }, { quoted: msg });
          return;
        }
        const target = `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
        try {
          await sock.groupParticipantsUpdate(jid, [target], 'add');
          await sock.sendMessage(jid, { text: `✅ @${target.split('@')[0]} ajouté.`, mentions: [target] }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Impossible d'ajouter ce numéro (confidentialité ou déjà membre).` }, { quoted: msg });
        }
      },
    },
    {
      name: 'promote',
      description: 'Promeut un membre admin',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const target = extractTargetJid(msg, args);
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Mentionne, réponds à, ou indique un numéro.' }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, [target], 'promote');
        await sock.sendMessage(jid, { text: `⬆️ @${target.split('@')[0]} est maintenant admin.`, mentions: [target] }, { quoted: msg });
      },
    },
    {
      name: 'demote',
      description: 'Rétrograde un admin',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const target = extractTargetJid(msg, args);
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Mentionne, réponds à, ou indique un numéro.' }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, [target], 'demote');
        await sock.sendMessage(jid, { text: `⬇️ @${target.split('@')[0]} n'est plus admin.`, mentions: [target] }, { quoted: msg });
      },
    },
    {
      name: 'promoteall',
      description: 'Promeut tous les membres',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const targets = metadata.participants.filter((p) => !isGroupAdmin(metadata, p.id)).map((p) => p.id);
        if (!targets.length) {
          await sock.sendMessage(jid, { text: 'Tout le monde est déjà admin.' }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, targets, 'promote');
        await sock.sendMessage(jid, { text: `⬆️ ${targets.length} membre(s) promu(s) admin.` }, { quoted: msg });
      },
    },
    {
      name: 'demoteall',
      description: 'Rétrograde tous les admins',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const targets = metadata.participants
          .filter((p) => isGroupAdmin(metadata, p.id) && p.id !== sock.user.id)
          .map((p) => p.id);
        if (!targets.length) {
          await sock.sendMessage(jid, { text: "Aucun admin à rétrograder." }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, targets, 'demote');
        await sock.sendMessage(jid, { text: `⬇️ ${targets.length} admin(s) rétrogradé(s).` }, { quoted: msg });
      },
    },
    {
      name: 'groupinfo',
      description: 'Informations sur le groupe',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter((p) => isGroupAdmin(metadata, p.id)).length;
        const created = metadata.creation ? new Date(metadata.creation * 1000).toLocaleDateString('fr-FR') : 'inconnue';
        await sock.sendMessage(jid, {
          text: `📋 *${metadata.subject}*\n\n👥 Membres : ${metadata.participants.length}\n👑 Admins : ${admins}\n📅 Créé le : ${created}\n📝 Description : ${metadata.desc || 'aucune'}`,
        }, { quoted: msg });
      },
    },
    {
      name: 'setname',
      description: 'Change le nom du groupe (.setname Nouveau nom)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        if (!args.length) {
          await sock.sendMessage(jid, { text: '❌ Indique le nouveau nom.' }, { quoted: msg });
          return;
        }
        await sock.groupUpdateSubject(jid, args.join(' '));
        await sock.sendMessage(jid, { text: '✅ Nom du groupe mis à jour.' }, { quoted: msg });
      },
    },
    {
      name: 'setdesc',
      description: 'Change la description du groupe',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        if (!args.length) {
          await sock.sendMessage(jid, { text: '❌ Indique la nouvelle description.' }, { quoted: msg });
          return;
        }
        await sock.groupUpdateDescription(jid, args.join(' '));
        await sock.sendMessage(jid, { text: '✅ Description mise à jour.' }, { quoted: msg });
      },
    },
    {
      name: 'close',
      description: 'Ferme le groupe (seuls les admins écrivent)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        await sock.groupSettingUpdate(jid, 'announcement');
        await sock.sendMessage(jid, { text: '🔒 Groupe fermé.' }, { quoted: msg });
      },
    },
    {
      name: 'open',
      description: 'Ouvre le groupe à tous',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        await sock.groupSettingUpdate(jid, 'not_announcement');
        await sock.sendMessage(jid, { text: '🔓 Groupe ouvert.' }, { quoted: msg });
      },
    },
    {
      name: 'opentime',
      description: "Programme l'ouverture du groupe dans X minutes (.opentime 30)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const minutes = parseInt(args[0], 10);
        if (!minutes || minutes <= 0) {
          await sock.sendMessage(jid, { text: '❌ Indique un nombre de minutes valide.' }, { quoted: msg });
          return;
        }
        setTimeout(() => {
          sock.groupSettingUpdate(jid, 'not_announcement').catch(() => {});
          sock.sendMessage(jid, { text: '🔓 Groupe ouvert automatiquement.' }).catch(() => {});
        }, minutes * 60 * 1000);
        await sock.sendMessage(jid, { text: `⏱️ Ouverture programmée dans ${minutes} min (annulée si le bot redémarre entretemps).` }, { quoted: msg });
      },
    },
    {
      name: 'closetime',
      description: 'Programme la fermeture du groupe dans X minutes (.closetime 30)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const minutes = parseInt(args[0], 10);
        if (!minutes || minutes <= 0) {
          await sock.sendMessage(jid, { text: '❌ Indique un nombre de minutes valide.' }, { quoted: msg });
          return;
        }
        setTimeout(() => {
          sock.groupSettingUpdate(jid, 'announcement').catch(() => {});
          sock.sendMessage(jid, { text: '🔒 Groupe fermé automatiquement.' }).catch(() => {});
        }, minutes * 60 * 1000);
        await sock.sendMessage(jid, { text: `⏱️ Fermeture programmée dans ${minutes} min (annulée si le bot redémarre entretemps).` }, { quoted: msg });
      },
    },
    {
      name: 'glink',
      description: "Récupère le lien d'invitation du groupe",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const code = await sock.groupInviteCode(jid);
        await sock.sendMessage(jid, { text: `🔗 https://chat.whatsapp.com/${code}` }, { quoted: msg });
      },
    },
    {
      name: 'creategc',
      description: 'Crée un nouveau groupe (.creategc Nom | 237600000000,237600000001)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const raw = args.join(' ');
        const [name, numbersRaw] = raw.split('|').map((s) => s?.trim());
        if (!name) {
          await sock.sendMessage(jid, { text: '❌ Format : .creategc Nom du groupe | numéro1,numéro2' }, { quoted: msg });
          return;
        }
        const participants = (numbersRaw || '')
          .split(',')
          .map((n) => n.trim().replace(/[^0-9]/g, ''))
          .filter(Boolean)
          .map((n) => `${n}@s.whatsapp.net`);
        await sock.groupCreate(name, participants);
        await sock.sendMessage(jid, { text: `✅ Groupe *${name}* créé.` }, { quoted: msg });
      },
    },
    {
      name: 'acceptall',
      description: "Accepte toutes les demandes d'adhésion en attente",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const pending = await sock.groupRequestParticipantsList(jid);
        if (!pending.length) {
          await sock.sendMessage(jid, { text: 'Aucune demande en attente.' }, { quoted: msg });
          return;
        }
        await sock.groupRequestParticipantsUpdate(jid, pending.map((p) => p.jid), 'approve');
        await sock.sendMessage(jid, { text: `✅ ${pending.length} demande(s) acceptée(s).` }, { quoted: msg });
      },
    },
    {
      name: 'rejectall',
      description: "Rejette toutes les demandes d'adhésion en attente",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const pending = await sock.groupRequestParticipantsList(jid);
        if (!pending.length) {
          await sock.sendMessage(jid, { text: 'Aucune demande en attente.' }, { quoted: msg });
          return;
        }
        await sock.groupRequestParticipantsUpdate(jid, pending.map((p) => p.jid), 'reject');
        await sock.sendMessage(jid, { text: `🚫 ${pending.length} demande(s) rejetée(s).` }, { quoted: msg });
      },
    },
    {
      name: 'antilink',
      description: 'Anti-lien dans le groupe (.antilink on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antilink on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antilink: value });
        await sock.sendMessage(jid, { text: `🔗 Anti-lien ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'antibadword',
      description: 'Anti-grossièretés dans le groupe (.antibadword on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antibadword on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antibadword: value });
        await sock.sendMessage(jid, { text: `🤬 Anti-grossièretés ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'antidelete',
      description: 'Anti-suppression des messages du groupe (.antidelete on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antidelete on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antidelete: value });
        await sock.sendMessage(jid, { text: `🗑️ Anti-suppression ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'antipromote',
      description: 'Empêche les promotions non autorisées (.antipromote on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antipromote on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antipromote: value });
        await sock.sendMessage(jid, { text: `👑 Anti-promotion ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'antidemote',
      description: 'Empêche les rétrogradations non autorisées (.antidemote on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antidemote on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antidemote: value });
        await sock.sendMessage(jid, { text: `👑 Anti-rétrogradation ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'antispam',
      description: 'Anti-spam dans le groupe (.antispam on / off)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .antispam on | off' }, { quoted: msg });
          return;
        }
        setGroupSetting(jid, { antispam: value });
        await sock.sendMessage(jid, { text: `🚫 Anti-spam ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'welcome',
      description: 'Message de bienvenue automatique (.welcome on [message avec {user}])',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .welcome on [message] | .welcome off' }, { quoted: msg });
          return;
        }
        const customMessage = args.slice(1).join(' ') || null;
        setGroupSetting(jid, { welcome: value, ...(customMessage ? { welcomeMessage: customMessage } : {}) });
        await sock.sendMessage(jid, { text: `👋 Message de bienvenue ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'goodbye',
      description: "Message d'au revoir automatique (.goodbye on [message avec {user}])",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        const value = toggleArg(args);
        if (value === null) {
          await sock.sendMessage(jid, { text: 'Usage : .goodbye on [message] | .goodbye off' }, { quoted: msg });
          return;
        }
        const customMessage = args.slice(1).join(' ') || null;
        setGroupSetting(jid, { goodbye: value, ...(customMessage ? { goodbyeMessage: customMessage } : {}) });
        await sock.sendMessage(jid, { text: `👋 Message d'au revoir ${value ? 'activé' : 'désactivé'}.` }, { quoted: msg });
      },
    },
    {
      name: 'setppgc',
      description: 'Change la photo du groupe (répond à une image)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        if (!(await requireSenderAdmin(sock, msg, jid, metadata))) return;
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;

        const quotedImage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
        const directImage = msg.message?.imageMessage;
        const target = quotedImage || directImage;
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Réponds à une image avec .setppgc' }, { quoted: msg });
          return;
        }
        try {
          const stream = await downloadContentFromMessage(target, 'image');
          const buffer = await streamToBuffer(stream);
          await sock.updateProfilePicture(jid, buffer);
          await sock.sendMessage(jid, { text: '✅ Photo du groupe mise à jour.' }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'tagadmins',
      description: 'Mentionne uniquement les admins',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const admins = metadata.participants.filter((p) => isGroupAdmin(metadata, p.id)).map((p) => p.id);
        const lines = admins.map((id) => `@${id.split('@')[0]}`).join('\n');
        await sock.sendMessage(jid, { text: `👑 Admins :\n${lines}`, mentions: admins }, { quoted: msg });
      },
    },
    {
      name: 'kickadmins',
      description: 'Expulse tous les admins (réservé au propriétaire du groupe)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const sender = msg.key.participant || msg.key.remoteJid;
        if (sender !== metadata.owner && !isGroupAdmin(metadata, sender)) {
          await sock.sendMessage(jid, { text: '❌ Réservé aux admins/propriétaire du groupe.' }, { quoted: msg });
          return;
        }
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const targets = metadata.participants
          .filter((p) => isGroupAdmin(metadata, p.id) && p.id !== sock.user.id)
          .map((p) => p.id);
        if (!targets.length) {
          await sock.sendMessage(jid, { text: 'Aucun admin à expulser.' }, { quoted: msg });
          return;
        }
        await sock.groupParticipantsUpdate(jid, targets, 'remove');
        await sock.sendMessage(jid, { text: `✅ ${targets.length} admin(s) expulsé(s).` }, { quoted: msg });
      },
    },
    {
      name: 'kickall',
      description: 'Expulse tous les membres (réservé au propriétaire du groupe)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const sender = msg.key.participant || msg.key.remoteJid;
        if (sender !== metadata.owner) {
          await sock.sendMessage(jid, { text: '❌ Réservé au propriétaire du groupe.' }, { quoted: msg });
          return;
        }
        if (!(await requireBotAdmin(sock, msg, jid, metadata))) return;
        const targets = metadata.participants.map((p) => p.id).filter((id) => id !== sock.user.id);
        await sock.groupParticipantsUpdate(jid, targets, 'remove');
        await sock.sendMessage(jid, { text: `✅ ${targets.length} membre(s) expulsé(s).` }, { quoted: msg });
      },
    },
    {
      name: 'tag',
      description: 'Répond à un message en mentionnant son auteur (.tag ton message)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const target = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Réponds à un message avec .tag.' }, { quoted: msg });
          return;
        }
        await sock.sendMessage(jid, { text: args.join(' ') || '👋', mentions: [target] }, { quoted: msg });
      },
    },
    {
      name: 'leave',
      description: 'Le bot quitte le groupe',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        await sock.sendMessage(jid, { text: '👋 À bientôt !' }, { quoted: msg });
        await sock.groupLeave(jid);
      },
    },
    {
      name: 'groupstatus',
      description: 'Statistiques et réglages du groupe',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const metadata = await sock.groupMetadata(jid);
        const s = getGroupSettings(jid);
        const flag = (v) => (v ? '✅' : '❌');
        await sock.sendMessage(jid, {
          text: `📊 *${metadata.subject}*\n👥 ${metadata.participants.length} membres\n\n${flag(s.antilink)} antilink\n${flag(s.antibadword)} antibadword\n${flag(s.antidelete)} antidelete\n${flag(s.antipromote)} antipromote\n${flag(s.antidemote)} antidemote\n${flag(s.antispam)} antispam\n${flag(s.welcome)} welcome\n${flag(s.goodbye)} goodbye`,
        }, { quoted: msg });
      },
    },
    {
      name: 'poll',
      description: 'Crée un sondage (.poll Question ? | Option 1 | Option 2)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!(await requireGroup(sock, msg, jid))) return;
        const parts = args.join(' ').split('|').map((s) => s.trim()).filter(Boolean);
        if (parts.length < 3) {
          await sock.sendMessage(jid, { text: 'Usage : .poll Question ? | Option 1 | Option 2 | ...' }, { quoted: msg });
          return;
        }
        const [name, ...values] = parts;
        await sock.sendMessage(jid, {
          poll: { name, values, selectableCount: 1 },
        }, { quoted: msg });
      },
    },
  ],
};
