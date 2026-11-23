import { SEED_SINGLE, SEED_WORDS } from './seed.js';

export const MODES = {
  major: {name: 'Sistema Maior', icon: 'hash', color: 'violet', category: 'Números', description: 'Transforme números em palavras que você consegue visualizar.', label: 'Flashcards', technique: 'Converta dígitos em sons consonantais. Use vogais para formar uma palavra sem alterar o número. Exemplo: 12 → T + N → tênis.', steps: ['Veja o número e tente lembrar a palavra.', 'Revele a resposta e avalie se acertou.', 'Personalize as associações para torná-las mais memoráveis.']},
  dominic: {name: 'Sistema Dominic', icon: 'user', color: 'cyan', category: 'Números', description: 'Converta números em pessoas e ações memoráveis.', label: 'Pessoas e ações', technique: 'Na técnica de Dominic O’Brien, cada par vira duas letras pelas iniciais. O primeiro par indica a pessoa e o segundo, a ação. Exemplo: 15 82 → Albert Einstein, do par 15, toca violão, ação do par 82.', steps: ['Aprenda os pares e suas iniciais.', 'Revele a pessoa e a ação e confira sua resposta.', 'Use o editor para adicionar pessoas e ações até completar os 100 pares.']},
  loci: {name: 'Palácio da Memória', icon: 'buildings', color: 'pink', category: 'Estudos', description: 'Percorra um lugar familiar para lembrar itens na ordem certa.', label: 'Método de loci', technique: 'Escolha uma rota familiar. Em cada ponto, imagine uma cena exagerada ligando o lugar ao item. Depois, percorra a rota mentalmente.', steps: ['Memorize um item em cada local.', 'Tente visualizar a cena em cada parada.', 'Digite os itens na ordem do percurso.']},
  cards: {name: 'Baralho', icon: 'cards', color: 'amber', category: 'Baralho', description: 'Memorize a sequência de cartas e avance até o baralho completo.', label: 'Ordem das cartas', technique: 'Assinale o valor e o naipe de cada carta na ordem em que apareceu. Você pode ligar as cartas em uma história ou colocá-las nos pontos de um palácio.', steps: ['Observe as cartas na ordem apresentada.', 'Selecione a mesma sequência sem consultar as cartas.', 'Reveja acertos e erros ao final.']},
  numbers: {name: 'Sequências de Números', icon: 'numbers', color: 'green', category: 'Números', description: 'Recorde sequências cada vez maiores, dígito por dígito.', label: 'Sequências', technique: 'Agrupe os dígitos em pares. Transforme cada grupo em palavra no Sistema Maior ou use pessoas e ações do Sistema Dominic.', steps: ['Observe a sequência completa.', 'Crie suas associações antes de ocultar os números.', 'Digite todos os dígitos na ordem correta.']},
  study: {name: 'Memória para Estudos', icon: 'book', color: 'blue', category: 'Estudos', description: 'Pratique recuperação ativa com perguntas e materiais próprios.', label: 'Revisão ativa', technique: 'Leia e compreenda antes de esconder o material. Tente recuperar a resposta sem consultar. Revise novamente depois de um intervalo.', steps: ['Use os exemplos ou adicione seus próprios cartões.', 'Leia as respostas antes de começar a recordar.', 'Confira cada resposta e deixe o app programar suas revisões.']}
};
export const LEVELS = ['Fundamentos', 'Explorador', 'Praticante', 'Avançado', 'Mestre'];
export const MAJOR = Object.fromEntries([...SEED_SINGLE.map((word, n) => [String(n), word]), ...SEED_WORDS.map((word, n) => [String(n).padStart(2, '0'), word])]);
export const MAJOR_SOUNDS = ['R', 'T / D', 'N / NH', 'M', 'C / K / Q', 'L / LH', 'S / Z / Ç', 'F / V', 'G / J / CH', 'P / B'];
export const DOMINIC_LETTERS = 'OABCDESGHN';
export const PAIRS = Array.from({length: 100}, (_, n) => String(n).padStart(2, '0'));
export const DOMINIC = {
  '00': ['Otto Oliveira', 'abrindo um guarda-chuva'], '11': ['Ana Amélia', 'acendendo um farol'],
  '12': ['Ayrton Bueno', 'trocando um pneu'], '13': ['Alice Carvalho', 'pintando um mural'],
  '14': ['Augusto Dias', 'batendo um tambor'], '15': ['Albert Einstein', 'escrevendo numa lousa'],
  '22': ['Bruno Barbosa', 'cortando papel'], '27': ['Bill Gates', 'digitando em um computador'],
  '33': ['Carlos Cruz', 'empilhando caixas'], '44': ['Dora Duarte', 'plantando uma árvore'],
  '55': ['Eva Esteves', 'costurando uma bandeira'], '66': ['Sofia Santos', 'assoprando uma vela'],
  '77': ['Gilberto Gil', 'cantando em um palco'], '82': ['Heitor Barros', 'tocando violão'],
  '88': ['Helena Helena', 'descascando laranjas'], '99': ['Nina Neves', 'desenhando estrelas']
};
const WORDS = 'abacaxi sino girafa bicicleta acordeão castelo lâmpada pinguim tábua diamante foguete bússola peixe janela cavalo sofá violão pera escada camelo violino barco floresta pipoca relâmpago gelo cobra lua guarda-chuva tijolo tigre papel anel violoncelo pérola montanha laranja nuvem tambor coelho ampulheta chave robô mochila abóbora chaleira telescópio sapato borboleta poltrona'.split(' ');
const PLACES = ['Portão', 'Entrada', 'Tapete', 'Sofá', 'Mesa', 'Janela', 'Estante', 'Corredor', 'Espelho', 'Porta do quarto', 'Cama', 'Armário', 'Escrivaninha', 'Cortina', 'Varanda'];
export const SAMPLE_STUDY = [
  {id: 'sample01', front: 'Qual é a capital do Paraná?', back: 'Curitiba'},
  {id: 'sample02', front: 'Qual é a unidade de medida da força?', back: 'Newton (N)'},
  {id: 'sample03', front: 'Qual é o resultado de 7 × 8?', back: '56'},
  {id: 'sample04', front: 'Qual técnica liga itens a pontos de uma rota?', back: 'Método de loci (Palácio da Memória)'},
  {id: 'sample05', front: 'Qual planeta está mais perto do Sol?', back: 'Mercúrio'},
  {id: 'sample06', front: 'Qual é a fórmula da área de um círculo?', back: 'A = πr²'}
];
export const SUITS = [{key: 'S', symbol: '♠', name: 'espadas'}, {key: 'H', symbol: '♥', name: 'copas', red: true}, {key: 'C', symbol: '♣', name: 'paus'}, {key: 'D', symbol: '♦', name: 'ouros', red: true}];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const emptyProgress = () => ({events: [], library: {}, reviews: {}, preferences: {offers: false}});
export const initials = value => [...value].map(digit => DOMINIC_LETTERS[Number(digit)]).join('');
export const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ');
export const score = (correct, total) => total > 0 ? Math.round(100 * correct / total) : 0;
export const earnedXP = (correct, total, level) => 10 + correct * 4 + level * 3 + (correct === total ? 12 : 0);
export const day = timestamp => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

export function streak(events, now = new Date()) {
  const days = new Set(events.map(event => day(event.at)));
  const cursor = new Date(now);
  if (!days.has(day(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(day(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function levelFor(events, mode) {
  const successes = [0, 0, 0, 0, 0];
  for (const event of events) {
    if (event.mode === mode && score(event.correct, event.total) >= 80 && event.level >= 1 && event.level <= 5) successes[event.level - 1]++;
  }
  const first = successes.findIndex(count => count < 2);
  return first < 0 ? 5 : first + 1;
}

export function reviewResult(previous, hit, now = Date.now()) {
  const box = hit ? Math.min(5, (previous?.box ?? 0) + 1) : 0;
  const intervals = [0, 1, 2, 4, 8, 16];
  return {box, at: now, due: now + (box ? intervals[box] * 86400000 : 10 * 60000), count: (previous?.count ?? 0) + 1};
}

export function shuffled(values, random = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function pairsFor(library) {
  return {...DOMINIC, ...library.dominic};
}

export function makeRound(mode, level, library, reviews, options = {}, random = Math.random) {
  const sizes = [5, 8, 12, 18, 25];
  const n = sizes[level - 1];
  if (mode === 'cards') {
    const deck = SUITS.flatMap(suit => RANKS.map(rank => `${rank}${suit.key}`));
    return {kind: 'cards', items: shuffled(deck, random).slice(0, [4, 8, 16, 26, 52][level - 1])};
  }
  if (mode === 'numbers') {
    const size = [6, 10, 16, 24, 36][level - 1];
    const available = options.method === 'dominic' ? Object.keys(pairsFor(library)) : PAIRS;
    const items = Array.from({length: size / 2}, () => available[Math.floor(random() * available.length)]).join('').split('');
    return {kind: 'numbers', items};
  }
  if (mode === 'loci') {
    const places = library.places?.length >= 3 ? library.places : PLACES;
    const amount = Math.min(places.length, [3, 5, 7, 10, 15][level - 1]);
    return {kind: 'loci', places: places.slice(0, amount), items: shuffled(WORDS, random).slice(0, amount)};
  }
  let items;
  if (mode === 'major') {
    const keys = options.range === 'single' ? Object.keys(MAJOR).filter(key => key.length === 1)
      : options.range === 'all' ? Object.keys(MAJOR) : PAIRS;
    items = keys.map(key => ({id: key, front: key, back: library.major?.[key]?.word || MAJOR[key], hint: library.major?.[key]?.hint}));
  } else if (mode === 'dominic') {
    const pairs = pairsFor(library);
    const keys = options.range === 'initials' ? PAIRS : Object.keys(pairs);
    items = keys.map(key => ({
      id: options.range === 'initials' ? 'initials' + key : key,
      front: key,
      back: options.range === 'initials' ? initials(key) : pairs[key].join(' · '),
      clue: options.range === 'initials' ? '' : initials(key)
    }));
  } else {
    items = options.range === 'custom' && library.study?.length ? library.study : SAMPLE_STUDY;
  }
  if (options.reverse) {
    items = items.map(({front, back, ...item}) => ({...item, front: back, back: front, clue: '', hint: ''}));
  }
  const dueOf = item => reviews[mode + ':' + item.id + (options.reverse ? ':reverse' : '')]?.due ?? 0;
  const due = shuffled(items, random).sort((a, b) => dueOf(a) - dueOf(b));
  return {kind: 'flash', items: due.slice(0, n), preview: mode === 'study'};
}
