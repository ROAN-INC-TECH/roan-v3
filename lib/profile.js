const fs = require('fs');
const path = require('path');

const DEFAULT_IMAGE = path.join(__dirname, '..', 'assets', 'menu.jpg');

/**
 * Applique une photo de profil au compte WhatsApp du bot lui-même.
 * Appelée automatiquement à la connexion, et réutilisable par la
 * commande .dp.
 */
async function setBotProfilePicture(sock, imageBuffer) {
  const buffer = imageBuffer || (fs.existsSync(DEFAULT_IMAGE) ? fs.readFileSync(DEFAULT_IMAGE) : null);
  if (!buffer) throw new Error('Aucune image disponible (assets/menu.jpg manquant).');
  await sock.updateProfilePicture(sock.user.id, buffer);
}

module.exports = { setBotProfilePicture, DEFAULT_IMAGE };
