const sessions = new Map(); // clé: `${game}:${jid}` -> état

function getSession(game, jid) {
  return sessions.get(`${game}:${jid}`) || null;
}

function setSession(game, jid, state) {
  sessions.set(`${game}:${jid}`, state);
}

function clearSession(game, jid) {
  sessions.delete(`${game}:${jid}`);
}

module.exports = { getSession, setSession, clearSession };
