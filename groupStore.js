const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'groups.json');

const DEFAULTS = {
  antilink: false,
  antibadword: false,
  antidelete: false,
  antipromote: false,
  antidemote: false,
  antispam: false,
  welcome: false,
  goodbye: false,
  welcomeMessage: null,
  goodbyeMessage: null,
};

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}');
}

function readAll() {
  ensureFile();
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getGroupSettings(jid) {
  const all = readAll();
  return { ...DEFAULTS, ...(all[jid] || {}) };
}

function setGroupSetting(jid, patch) {
  const all = readAll();
  all[jid] = { ...DEFAULTS, ...(all[jid] || {}), ...patch };
  writeAll(all);
  return all[jid];
}

module.exports = { getGroupSettings, setGroupSetting, DEFAULTS };
