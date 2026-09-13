const { getSession, setSession, clearSession } = require('../lib/gameSessions');
const { HANGMAN_WORDS, EMOJI_QUIZZES, GAME_FACTS } = require('../lib/gameData');

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function renderHangmanBoard(word, guessed) {
  return word
    .split('')
    .map((l) => (guessed.has(l) ? l : '_'))
    .join(' ');
}

module.exports = {
  category: 'GAME',
  commands: [
    {
      name: 'rps',
      description: 'Pierre-Feuille-Ciseaux contre le bot (.rps pierre)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const choices = ['pierre', 'feuille', 'ciseaux'];
        const beats = { pierre: 'ciseaux', feuille: 'pierre', ciseaux: 'feuille' };
        const user = normalize(args[0] || '');
        if (!choices.includes(user)) {
          await sock.sendMessage(jid, { text: 'Usage : .rps pierre | feuille | ciseaux' }, { quoted: msg });
          return;
        }
        const bot = choices[randomInt(0, 2)];
        let result;
        if (bot === user) result = '🤝 Égalité !';
        else if (beats[user] === bot) result = '🎉 Tu gagnes !';
        else result = '🤖 Le bot gagne !';
        await sock.sendMessage(jid, { text: `Toi : ${user}\nBot : ${bot}\n\n${result}` }, { quoted: msg });
      },
    },
    {
      name: 'rpsls',
      description: 'Pierre-Feuille-Ciseaux-Lézard-Spock (.rpsls spock)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const choices = ['pierre', 'feuille', 'ciseaux', 'lezard', 'spock'];
        const beats = {
          pierre: ['ciseaux', 'lezard'],
          feuille: ['pierre', 'spock'],
          ciseaux: ['feuille', 'lezard'],
          lezard: ['spock', 'feuille'],
          spock: ['ciseaux', 'pierre'],
        };
        const user = normalize(args[0] || '');
        if (!choices.includes(user)) {
          await sock.sendMessage(jid, { text: 'Usage : .rpsls pierre | feuille | ciseaux | lezard | spock' }, { quoted: msg });
          return;
        }
        const bot = choices[randomInt(0, 4)];
        let result;
        if (bot === user) result = '🤝 Égalité !';
        else if (beats[user].includes(bot)) result = '🎉 Tu gagnes !';
        else result = '🤖 Le bot gagne !';
        await sock.sendMessage(jid, { text: `Toi : ${user}\nBot : ${bot}\n\n${result}` }, { quoted: msg });
      },
    },
    {
      name: 'dice',
      description: 'Lance un ou plusieurs dés (.dice ou .dice 3)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const count = Math.min(Math.max(parseInt(args[0], 10) || 1, 1), 10);
        const rolls = Array.from({ length: count }, () => randomInt(1, 6));
        const text = count === 1
          ? `🎲 Tu as fait un ${rolls[0]} !`
          : `🎲 ${rolls.join(' + ')} = ${rolls.reduce((a, b) => a + b, 0)}`;
        await sock.sendMessage(jid, { text }, { quoted: msg });
      },
    },
    {
      name: 'coin',
      description: 'Pile ou face',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const result = Math.random() < 0.5 ? 'Pile' : 'Face';
        await sock.sendMessage(jid, { text: `🪙 ${result} !` }, { quoted: msg });
      },
    },
    {
      name: 'numberbattle',
      description: 'Bataille de nombres contre le bot (1-100)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const you = randomInt(1, 100);
        const bot = randomInt(1, 100);
        let result;
        if (you === bot) result = '🤝 Égalité !';
        else if (you > bot) result = '🎉 Tu gagnes !';
        else result = '🤖 Le bot gagne !';
        await sock.sendMessage(jid, { text: `Toi : ${you}\nBot : ${bot}\n\n${result}` }, { quoted: msg });
      },
    },
    {
      name: 'hangman',
      description: 'Jeu du pendu (.hangman start | .hangman <lettre> | .hangman stop)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const action = normalize(args[0] || '');

        if (action === 'stop') {
          clearSession('hangman', jid);
          await sock.sendMessage(jid, { text: '🛑 Partie arrêtée.' }, { quoted: msg });
          return;
        }

        if (action === 'start' || !getSession('hangman', jid)) {
          const word = HANGMAN_WORDS[randomInt(0, HANGMAN_WORDS.length - 1)];
          const state = { word, guessed: new Set(), wrong: 0, maxWrong: 6 };
          setSession('hangman', jid, state);
          await sock.sendMessage(jid, {
            text: `🎯 Pendu lancé ! ${word.length} lettres.\n${renderHangmanBoard(word, state.guessed)}\n\nDevine une lettre avec .hangman <lettre>`,
          }, { quoted: msg });
          return;
        }

        const state = getSession('hangman', jid);
        const letter = normalize(args[0] || '')[0];
        if (!letter) {
          await sock.sendMessage(jid, { text: 'Usage : .hangman <lettre>' }, { quoted: msg });
          return;
        }
        if (state.guessed.has(letter)) {
          await sock.sendMessage(jid, { text: `Tu as déjà proposé "${letter}".` }, { quoted: msg });
          return;
        }
        state.guessed.add(letter);
        if (!state.word.includes(letter)) state.wrong += 1;

        const won = state.word.split('').every((l) => state.guessed.has(l));
        const lost = state.wrong >= state.maxWrong;

        if (won) {
          clearSession('hangman', jid);
          await sock.sendMessage(jid, { text: `🎉 Gagné ! Le mot était *${state.word}*.` }, { quoted: msg });
          return;
        }
        if (lost) {
          clearSession('hangman', jid);
          await sock.sendMessage(jid, { text: `💀 Perdu ! Le mot était *${state.word}*.` }, { quoted: msg });
          return;
        }

        setSession('hangman', jid, state);
        await sock.sendMessage(jid, {
          text: `${renderHangmanBoard(state.word, state.guessed)}\n❌ Erreurs : ${state.wrong}/${state.maxWrong}`,
        }, { quoted: msg });
      },
    },
    {
      name: 'guess',
      description: 'Devine le nombre (.guess start [max] | .guess <nombre> | .guess stop)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const first = normalize(args[0] || '');

        if (first === 'stop') {
          clearSession('guess', jid);
          await sock.sendMessage(jid, { text: '🛑 Partie arrêtée.' }, { quoted: msg });
          return;
        }

        if (first === 'start' || !getSession('guess', jid)) {
          const max = Math.min(Math.max(parseInt(args[1], 10) || 100, 10), 1000);
          setSession('guess', jid, { target: randomInt(1, max), max, attempts: 0 });
          await sock.sendMessage(jid, { text: `🔢 J'ai choisi un nombre entre 1 et ${max}. Devine avec .guess <nombre>` }, { quoted: msg });
          return;
        }

        const state = getSession('guess', jid);
        const value = parseInt(args[0], 10);
        if (Number.isNaN(value)) {
          await sock.sendMessage(jid, { text: 'Usage : .guess <nombre>' }, { quoted: msg });
          return;
        }
        state.attempts += 1;

        if (value === state.target) {
          clearSession('guess', jid);
          await sock.sendMessage(jid, { text: `🎉 Trouvé en ${state.attempts} essai(s) ! C'était ${state.target}.` }, { quoted: msg });
          return;
        }

        setSession('guess', jid, state);
        await sock.sendMessage(jid, { text: value < state.target ? '📈 Plus grand !' : '📉 Plus petit !' }, { quoted: msg });
      },
    },
    {
      name: 'math',
      description: 'Quiz de calcul mental (.math pour une question, .math <réponse> pour répondre)',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const existing = getSession('math', jid);

        if (existing && args.length) {
          const answer = parseFloat(args[0]);
          if (answer === existing.answer) {
            clearSession('math', jid);
            await sock.sendMessage(jid, { text: `🎉 Exact ! ${existing.question} = ${existing.answer}` }, { quoted: msg });
          } else {
            await sock.sendMessage(jid, { text: '❌ Pas tout à fait, réessaie avec .math <réponse>' }, { quoted: msg });
          }
          return;
        }

        const a = randomInt(1, 50);
        const b = randomInt(1, 50);
        const ops = ['+', '-', '*'];
        const op = ops[randomInt(0, 2)];
        // eslint-disable-next-line no-eval
        const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
        const question = `${a} ${op} ${b}`;
        setSession('math', jid, { question, answer });
        await sock.sendMessage(jid, { text: `🧠 Combien font ${question} ?\nRéponds avec .math <réponse>` }, { quoted: msg });
      },
    },
    {
      name: 'emojiquiz',
      description: "Devine le mot à partir d'emojis (.emojiquiz | .emojiquiz <réponse>)",
      implemented: true,
      async execute(sock, msg, args, jid) {
        const existing = getSession('emojiquiz', jid);

        if (existing && args.length) {
          const answer = normalize(args.join(' '));
          if (existing.answers.some((a) => normalize(a) === answer)) {
            clearSession('emojiquiz', jid);
            await sock.sendMessage(jid, { text: `🎉 Bravo ! C'était bien "${existing.answers[0]}".` }, { quoted: msg });
          } else {
            await sock.sendMessage(jid, { text: '❌ Pas ça, réessaie avec .emojiquiz <réponse>' }, { quoted: msg });
          }
          return;
        }

        const quiz = EMOJI_QUIZZES[randomInt(0, EMOJI_QUIZZES.length - 1)];
        setSession('emojiquiz', jid, quiz);
        await sock.sendMessage(jid, { text: `${quiz.emojis}\n\nDevine avec .emojiquiz <réponse>` }, { quoted: msg });
      },
    },
    {
      name: 'gamefact',
      description: 'Anecdote aléatoire sur le jeu vidéo',
      implemented: true,
      async execute(sock, msg, args, jid) {
        const fact = GAME_FACTS[randomInt(0, GAME_FACTS.length - 1)];
        await sock.sendMessage(jid, { text: `🎮 ${fact}` }, { quoted: msg });
      },
    },
  ],
};
