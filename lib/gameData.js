const HANGMAN_WORDS = [
  'ordinateur', 'programmation', 'baleine', 'montagne', 'telephone',
  'clavier', 'banane', 'soleil', 'musique', 'voiture', 'crocodile',
  'bibliotheque', 'chocolat', 'parapluie', 'aeroport',
];

const EMOJI_QUIZZES = [
  { emojis: '🍎🐍', answers: ['adam et eve', "adam et \u00e8ve"] },
  { emojis: '🦁👑', answers: ['le roi lion'] },
  { emojis: '🕷️👨', answers: ['spiderman', 'spider-man'] },
  { emojis: '❄️👸', answers: ['la reine des neiges', 'frozen'] },
  { emojis: '🚢🧊', answers: ['titanic'] },
  { emojis: '🐭🏰', answers: ['disneyland', 'mickey'] },
  { emojis: '👦🪄⚡', answers: ['harry potter'] },
  { emojis: '🍕🐢', answers: ['tortues ninja', 'les tortues ninja'] },
];

const GAME_FACTS = [
  "Le tout premier jeu vidéo créé pour le grand public est souvent considéré comme Pong, sorti en 1972.",
  "Minecraft s'est vendu à plus de 300 millions d'exemplaires, ce qui en fait l'un des jeux les plus vendus de l'histoire.",
  "Le personnage de Mario s'appelait à l'origine 'Jumpman' dans Donkey Kong avant de prendre son nom actuel.",
  "Tetris a été créé en 1984 par un ingénieur soviétique, Alexey Pajitnov.",
  "La série Pokémon a généré plus de revenus que n'importe quelle autre franchise de divertissement au monde.",
  "Le mot 'esport' désigne la compétition de jeux vidéo organisée, aujourd'hui suivie par des millions de spectateurs.",
  "Pac-Man a été conçu en s'inspirant de la forme d'une pizza à laquelle il manquerait une part.",
  "Le jeu Doom (1993) est régulièrement porté sur des appareils improbables, des calculatrices aux distributeurs automatiques.",
  "La manette de jeu vidéo avec croix directionnelle a été popularisée par Nintendo dans les années 1980.",
  "Le speedrunning consiste à terminer un jeu le plus vite possible, parfois en exploitant des bugs du jeu.",
];

module.exports = { HANGMAN_WORDS, EMOJI_QUIZZES, GAME_FACTS };
