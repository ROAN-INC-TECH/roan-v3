const sharp = require('sharp');
const axios = require('axios');
const FormData = require('form-data');
const QRCode = require('qrcode');
const { evaluate } = require('mathjs');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const translate = require('@iamtraction/google-translate');

const { downloadMedia, unwrapViewOnce, getQuotedMessage } = require('../lib/media');
const { videoBufferToMp3 } = require('../lib/ffmpegTools');
const { setBotProfilePicture } = require('../lib/profile');
const cfg = require('../config');

module.exports = {
  category: 'TOOLS',
  commands: [
    {
      name: 'vv',
      description: 'Révèle un message vue unique (réponds au message)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quoted = getQuotedMessage(msg);
        if (!quoted) {
          await sock.sendMessage(jid, { text: '❌ Réponds à un message vue unique avec .vv' }, { quoted: msg });
          return;
        }
        const inner = unwrapViewOnce(quoted);
        const imageMsg = inner.imageMessage;
        const videoMsg = inner.videoMessage;
        if (!imageMsg && !videoMsg) {
          await sock.sendMessage(jid, { text: "❌ Ce message n'est pas un vue unique image/vidéo." }, { quoted: msg });
          return;
        }
        try {
          if (imageMsg) {
            const buffer = await downloadMedia(imageMsg, 'image');
            await sock.sendMessage(jid, { image: buffer, caption: imageMsg.caption || '' }, { quoted: msg });
          } else {
            const buffer = await downloadMedia(videoMsg, 'video');
            await sock.sendMessage(jid, { video: buffer, caption: videoMsg.caption || '' }, { quoted: msg });
          }
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'sticker',
      description: 'Convertit une image ou une courte vidéo (répondue ou envoyée) en sticker',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quotedMsg = getQuotedMessage(msg);
        const imageTarget = msg.message?.imageMessage || quotedMsg?.imageMessage;
        const videoTarget = msg.message?.videoMessage || quotedMsg?.videoMessage;

        if (!imageTarget && !videoTarget) {
          await sock.sendMessage(jid, { text: '❌ Envoie ou réponds à une image/vidéo avec .sticker' }, { quoted: msg });
          return;
        }
        try {
          const buffer = await downloadMedia(imageTarget || videoTarget, imageTarget ? 'image' : 'video');
          const sticker = new Sticker(buffer, {
            pack: cfg.BOT_NAME,
            author: cfg.OWNER_NAME,
            type: StickerTypes.FULL,
            quality: 70,
          });
          const webp = await sticker.toBuffer();
          await sock.sendMessage(jid, { sticker: webp }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'toimg',
      description: 'Convertit un sticker (répondu) en image',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quotedSticker = getQuotedMessage(msg)?.stickerMessage;
        if (!quotedSticker) {
          await sock.sendMessage(jid, { text: '❌ Réponds à un sticker avec .toimg' }, { quoted: msg });
          return;
        }
        try {
          const buffer = await downloadMedia(quotedSticker, 'sticker');
          const png = await sharp(buffer).png().toBuffer();
          await sock.sendMessage(jid, { image: png }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'tomp3',
      description: 'Extrait l\u2019audio d\u2019une vidéo (répondue) en mp3',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quotedVideo = getQuotedMessage(msg)?.videoMessage || msg.message?.videoMessage;
        if (!quotedVideo) {
          await sock.sendMessage(jid, { text: '❌ Réponds à une vidéo avec .tomp3' }, { quoted: msg });
          return;
        }
        try {
          const buffer = await downloadMedia(quotedVideo, 'video');
          const mp3 = await videoBufferToMp3(buffer);
          await sock.sendMessage(jid, { audio: mp3, mimetype: 'audio/mpeg' }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'jid',
      description: 'Affiche le JID du chat (et de la personne citée le cas échéant)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        let text = `🆔 JID du chat : \`${jid}\``;
        if (quotedParticipant) text += `\n🆔 JID cité : \`${quotedParticipant}\``;
        await sock.sendMessage(jid, { text }, { quoted: msg });
      },
    },
    {
      name: 'calc',
      description: 'Calculatrice (.calc 12*(3+4))',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args.length) {
          await sock.sendMessage(jid, { text: 'Usage : .calc 12*(3+4)' }, { quoted: msg });
          return;
        }
        try {
          const result = evaluate(args.join(' '));
          await sock.sendMessage(jid, { text: `🧮 ${args.join(' ')} = ${result}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: '❌ Expression invalide.' }, { quoted: msg });
        }
      },
    },
    {
      name: 'ssweb',
      description: "Capture d'écran d'un site web (.ssweb https://exemple.com)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args[0]) {
          await sock.sendMessage(jid, { text: 'Usage : .ssweb https://exemple.com' }, { quoted: msg });
          return;
        }
        try {
          const url = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
          const shotUrl = `https://s.wordpress.com/mshots/v1/${encodeURIComponent(url)}?w=1280`;
          const res = await axios.get(shotUrl, { responseType: 'arraybuffer' });
          await sock.sendMessage(jid, { image: Buffer.from(res.data), caption: `📸 ${url}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Capture impossible : ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'dp',
      description: 'Change la photo de profil du bot (répond à une image, sinon utilise assets/menu.jpg)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        try {
          const quotedImage = getQuotedMessage(msg)?.imageMessage;
          const directImage = msg.message?.imageMessage;
          const target = quotedImage || directImage;
          const buffer = target ? await downloadMedia(target, 'image') : null;
          await setBotProfilePicture(sock, buffer);
          await sock.sendMessage(jid, { text: '✅ Photo de profil du bot mise à jour.' }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'take',
      description: "Change le nom/auteur d'un sticker (réponds à un sticker : .take Pack | Auteur)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quotedSticker = getQuotedMessage(msg)?.stickerMessage;
        if (!quotedSticker) {
          await sock.sendMessage(jid, { text: '❌ Réponds à un sticker avec .take Pack | Auteur' }, { quoted: msg });
          return;
        }
        const [pack, author] = args.join(' ').split('|').map((s) => s?.trim());
        try {
          const buffer = await downloadMedia(quotedSticker, 'sticker');
          const sticker = new Sticker(buffer, {
            pack: pack || cfg.BOT_NAME,
            author: author || cfg.OWNER_NAME,
            type: StickerTypes.FULL,
            quality: 70,
          });
          const webp = await sticker.toBuffer();
          await sock.sendMessage(jid, { sticker: webp }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'delete',
      description: "Supprime un message envoyé par le bot (réponds au message à supprimer)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (!ctx?.stanzaId) {
          await sock.sendMessage(jid, { text: '❌ Réponds au message du bot à supprimer.' }, { quoted: msg });
          return;
        }
        try {
          await sock.sendMessage(jid, {
            delete: {
              remoteJid: jid,
              fromMe: true,
              id: ctx.stanzaId,
              participant: jid.endsWith('@g.us') ? sock.user.id : undefined,
            },
          });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'url',
      description: 'Upload un fichier (répondu) et retourne son lien',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const quoted = getQuotedMessage(msg);
        const target = quoted?.imageMessage || quoted?.videoMessage || quoted?.documentMessage || msg.message?.imageMessage || msg.message?.videoMessage;
        if (!target) {
          await sock.sendMessage(jid, { text: '❌ Réponds à une image/vidéo/document avec .url' }, { quoted: msg });
          return;
        }
        try {
          const type = target.mimetype?.startsWith('video') ? 'video' : target.mimetype?.startsWith('image') ? 'image' : 'document';
          const buffer = await downloadMedia(target, type);
          const form = new FormData();
          form.append('reqtype', 'fileupload');
          form.append('fileToUpload', buffer, `file.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'bin'}`);
          const res = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
          await sock.sendMessage(jid, { text: `🔗 ${res.data}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Upload impossible : ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'idch',
      description: "Récupère l'ID d'une chaîne à partir de son lien (.idch https://whatsapp.com/channel/xxxx)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args[0]) {
          await sock.sendMessage(jid, { text: 'Usage : .idch https://whatsapp.com/channel/xxxx' }, { quoted: msg });
          return;
        }
        try {
          const code = args[0].split('/').pop();
          const metadata = await sock.newsletterMetadata('invite', code);
          await sock.sendMessage(jid, { text: `🆔 ${metadata.id}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Impossible de récupérer l'ID (vérifie le lien, ou méthode non supportée par ce fork) : ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'translate',
      description: 'Traduit un texte, langue source détectée automatiquement (.translate fr Hello world)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (args.length < 2) {
          await sock.sendMessage(jid, { text: 'Usage : .translate <langue_cible> <texte> (ex: .translate fr Hello)' }, { quoted: msg });
          return;
        }
        const targetLang = args[0];
        const text = args.slice(1).join(' ');
        try {
          const result = await translate(text, { to: targetLang });
          await sock.sendMessage(jid, { text: `🌐 ${result.text}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'apk',
      description: 'Recherche une application sur le Play Store (.apk whatsapp)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args.length) {
          await sock.sendMessage(jid, { text: 'Usage : .apk nom_de_app' }, { quoted: msg });
          return;
        }
        try {
          const gplay = require('google-play-scraper');
          const results = await gplay.search({ term: args.join(' '), num: 1 });
          if (!results.length) {
            await sock.sendMessage(jid, { text: 'Aucune application trouvée.' }, { quoted: msg });
            return;
          }
          const app = results[0];
          await sock.sendMessage(jid, {
            image: { url: app.icon },
            caption: `📱 *${app.title}*\n⭐ ${app.scoreText || 'N/A'}\n👨‍💻 ${app.developer}\n🔗 ${app.url}`,
          }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'checkban',
      description: 'Vérifie si un numéro est enregistré sur WhatsApp (.checkban 237600000000)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args[0]) {
          await sock.sendMessage(jid, { text: 'Usage : .checkban 237600000000' }, { quoted: msg });
          return;
        }
        try {
          const number = args[0].replace(/[^0-9]/g, '');
          const [result] = await sock.onWhatsApp(number);
          await sock.sendMessage(jid, {
            text: result?.exists
              ? `✅ Ce numéro est actif sur WhatsApp.`
              : `⚠️ Ce numéro n'est pas trouvé (banni, inexistant, ou confidentialité stricte).`,
          }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
    {
      name: 'weather',
      description: 'Météo d\u2019une ville (.weather Douala)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args.length) {
          await sock.sendMessage(jid, { text: 'Usage : .weather Douala' }, { quoted: msg });
          return;
        }
        try {
          const city = args.join(' ');
          const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}`, { params: { format: '3' } });
          await sock.sendMessage(jid, { text: `☁️ ${res.data}` }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Ville introuvable ou service indisponible.` }, { quoted: msg });
        }
      },
    },
    {
      name: 'define',
      description: "Définition d'un mot anglais (.define house)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args.length) {
          await sock.sendMessage(jid, { text: 'Usage : .define house (mots en anglais uniquement)' }, { quoted: msg });
          return;
        }
        try {
          const word = args[0];
          const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
          const meaning = res.data?.[0]?.meanings?.[0];
          const def = meaning?.definitions?.[0]?.definition;
          await sock.sendMessage(jid, {
            text: def ? `📖 *${word}* (${meaning.partOfSpeech})\n${def}` : 'Définition introuvable.',
          }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ Mot introuvable.` }, { quoted: msg });
        }
      },
    },
    {
      name: 'qr',
      description: 'Génère un QR code (.qr texte ou lien)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        if (!args.length) {
          await sock.sendMessage(jid, { text: 'Usage : .qr <texte ou lien>' }, { quoted: msg });
          return;
        }
        try {
          const buffer = await QRCode.toBuffer(args.join(' '), { width: 512 });
          await sock.sendMessage(jid, { image: buffer, caption: '📎 QR code généré.' }, { quoted: msg });
        } catch (err) {
          await sock.sendMessage(jid, { text: `❌ ${err.message}` }, { quoted: msg });
        }
      },
    },
  ],
};
