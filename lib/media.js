const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function downloadMedia(mediaMessage, type) {
  const stream = await downloadContentFromMessage(mediaMessage, type);
  return streamToBuffer(stream);
}

/** Déballe un message vue-unique (viewOnceMessage / V2 / V2Extension) */
function unwrapViewOnce(message) {
  return (
    message?.viewOnceMessageV2Extension?.message ||
    message?.viewOnceMessageV2?.message ||
    message?.viewOnceMessage?.message ||
    message
  );
}

function getQuotedMessage(msg) {
  return msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
}

module.exports = { streamToBuffer, downloadMedia, unwrapViewOnce, getQuotedMessage };
