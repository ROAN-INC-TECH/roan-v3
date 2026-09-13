const fs = require('fs');
const path = require('path');

/**
 * Charge tous les fichiers de commandes dans /commands
 * Chaque fichier exporte : { category: 'OWNER', commands: [ {name, description, implemented, execute} ] }
 * Retourne :
 *  - categories: { OWNER: [...], GROUP: [...], ... }
 *  - flat: Map(nom_commande -> {command, category})
 */
function loadCommands() {
  const commandsDir = path.join(__dirname, '..', 'commands');
  const categories = {};
  const flat = new Map();

  for (const file of fs.readdirSync(commandsDir)) {
    if (!file.endsWith('.js')) continue;
    const mod = require(path.join(commandsDir, file));
    if (!mod.category || !Array.isArray(mod.commands)) continue;

    categories[mod.category] = mod.commands;
    for (const cmd of mod.commands) {
      flat.set(cmd.name.toLowerCase(), { command: cmd, category: mod.category });
    }
  }

  return { categories, flat };
}

module.exports = { loadCommands };
