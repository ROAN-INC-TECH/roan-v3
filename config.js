require('dotenv').config();

module.exports = {
  BOT_NAME: '𝗥𝗢𝗔𝗡 𝗠𝗗 𝗩³',
  OWNER_NAME: '𝗠𝗥 𝗥𝗢𝗔𝗡',
  OWNER_NUMBER: process.env.OWNER_NUMBER || '237622348663',
  PREFIX: process.env.PREFIX || '.',
  MODE: process.env.MODE || 'public', // public | private
  SESSION_DIR: process.env.SESSION_DIR || './session',
  AUTOTYPING: process.env.AUTOTYPING === 'true',
  AUTORECORDING: process.env.AUTORECORDING === 'true',
  AUTOVIEWSTATUS: process.env.AUTOVIEWSTATUS === 'true',
  AUTOLIKESTATUS: process.env.AUTOLIKESTATUS === 'true',
  ANTIDELETE: process.env.ANTIDELETE === 'true',
  NEWSLETTER_JIDS: (process.env.NEWSLETTER_JIDS || [
    '120363432899008090@newsletter',
    '120363410601449280@newsletter',
    '1203634427946378181@newsletter',
  ].join(','))
    .split(',')
    .map((j) => j.trim())
    .filter(Boolean),
  AUTO_LIKE_CHANNEL: process.env.AUTO_LIKE_CHANNEL !== 'false',
  CHANNEL_LIKE_EMOJI: process.env.CHANNEL_LIKE_EMOJI || '❤️',
};
