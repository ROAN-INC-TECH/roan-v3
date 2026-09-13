const { stub } = require('../lib/stub');

module.exports = {
  category: 'FUN',
  commands: [
    stub('truth', 'Question vérité aléatoire'),
    stub('dare', 'Défi aléatoire (action ou vérité)'),
    stub('joke', 'Blague aléatoire'),
    stub('meme', 'Envoie un mème aléatoire'),
    stub('ship', 'Calcule la compatibilité entre deux personnes'),
    stub('rate', 'Note un mot/une personne sur 100'),
    stub('flirt', 'Phrase de drague aléatoire'),
    stub('roast', 'Répartie/pique aléatoire'),
    stub('compliment', 'Compliment aléatoire'),
    stub('wouldyou', 'Tu préfères... ?'),
    stub('8ball', 'Boule magique 8'),
  ],
};
