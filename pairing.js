let sockInstance = null;

function setSocket(sock) {
  sockInstance = sock;
}

function getSocket() {
  return sockInstance;
}

function getStatus() {
  if (!sockInstance) return { connected: false, user: null };
  return {
    connected: !!sockInstance.user,
    user: sockInstance.user ? { id: sockInstance.user.id, name: sockInstance.user.name } : null,
  };
}

async function requestPairingCode(rawNumber) {
  if (!sockInstance) {
    throw new Error("Le bot n'est pas encore initialisé, réessaie dans quelques secondes.");
  }
  if (sockInstance.user) {
    throw new Error('Le bot est déjà connecté à un numéro. Déconnecte-le (supprime le dossier session) avant de relier un nouveau numéro.');
  }
  const cleaned = rawNumber.replace(/[^0-9]/g, '');
  if (cleaned.length < 8) {
    throw new Error('Numéro invalide. Utilise le format international sans + (ex: 237600000000).');
  }
  const code = await sockInstance.requestPairingCode(cleaned);
  return code.match(/.{1,4}/g)?.join('-') || code;
}

module.exports = { setSocket, getSocket, getStatus, requestPairingCode };
