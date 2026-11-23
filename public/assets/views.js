import {brand, icon, neon} from './art.js';
import {LEGAL, TERMS_VERSION} from './legal.js';
import {LEVELS, MODES, MAJOR, MAJOR_SOUNDS, DOMINIC_LETTERS, PAIRS, RANKS, SUITS, earnedXP, initials, levelFor, pairsFor, score, streak} from './training.js';

export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const route = value => '#' + value;
const link = (label, to, classes = 'btn ghost', glyph) => `<a href="${route(to)}" class="${classes}">${glyph ? icon(glyph) : ''}${esc(label)}</a>`;
const button = (label, action, classes = 'btn', glyph, extra = '') => `<button type="button" class="${classes}" data-action="${action}" ${extra}>${glyph ? icon(glyph) : ''}${esc(label)}</button>`;
const heading = (title, description, category) => `<div class="intro">${category ? `<p class="eyebrow">${esc(category)}</p>` : ''}<h1>${esc(title)}</h1><p>${esc(description)}</p></div>`;
const tag = (text, glyph) => `<span class="tag">${glyph ? icon(glyph) : ''}${esc(text)}</span>`;
export const message = (text = '', error = false, id = 'feedback') => `<p id="${id}" class="message${error ? ' error' : ''}" role="status">${esc(text)}</p>`;
const field = (name, label, type = 'text', attributes = '') => `<label class="field"><span>${esc(label)}</span><input class="input" name="${name}" type="${type}" ${attributes}></label>`;
const submit = (label, glyph) => `<button class="btn primary" type="submit">${glyph ? icon(glyph) : ''}${esc(label)}</button>`;
const select = (name, label, values, chosen) => `<label class="field"><span>${esc(label)}</span><select name="${name}">${values.map(([key, value]) => `<option value="${esc(key)}"${key === chosen ? ' selected' : ''}>${esc(value)}</option>`).join('')}</select></label>`;
const textarea = (name, label, value = '', attributes = '') => `<label class="field"><span>${esc(label)}</span><textarea name="${name}" rows="3" ${attributes}>${esc(value)}</textarea></label>`;
const back = (label, path) => `<div class="back">${link(label, path, 'btn ghost', 'back')}</div>`;
const pages = [['inicio','Início','Início','home'],['treinos','Treinos','Treinos','grid'],['progresso','Meu progresso','Progresso','graph'],['biblioteca','Biblioteca','Biblioteca','book']];
const suffix = (number, unit) => `${number} ${unit}${number === 1 ? '' : 's'}`;
const dateFormat = new Intl.DateTimeFormat('pt-BR', {dateStyle:'short'});
const xpValue = events => events.reduce((sum, e) => sum + earnedXP(e.correct, e.total, e.level), 0);
const recentFirst = events => [...events].sort((a, b) => b.at - a.at);
const stats = data => [
  ['bolt', 'violet', xpValue(data.events) + ' XP', 'Experiência'],
  ['flame', 'amber', suffix(streak(data.events), 'dia'), 'Sequência de treinos'],
  ['target', 'cyan', data.events.length + (Number(data.legacy?.totalSessions) || 0), 'Sessões concluídas']
];
const nav = (current, mobile = false) => pages.map(([key, title, short, glyph]) => `<a class="nav-link" href="#${key}"${current === key ? ' aria-current="page"' : ''}>${icon(glyph)}<span>${mobile ? short : title}</span></a>`).join('');

export function shell(view, current, user, sync) {
  const currentName = pages.find(([key]) => key === current)?.[1] || 'Conta';
  const identity = user ? esc(user.name) : 'Modo visitante';
  return `<div class="shell">
      <aside class="rail">${brand()}<p class="eyebrow nav-caption">Treino</p>
        <nav class="nav-links" aria-label="Navegação principal">${nav(current)}</nav>
        <div class="rail-end">${button('Instalar aplicativo','install','btn ghost','plus')}
          <a class="account-line" href="#${user ? 'conta' : 'auth/login'}"><span class="avatar" aria-hidden="true">${user ? esc(user.name.charAt(0).toUpperCase()) : icon('user')}</span>
          <div><strong>${identity}</strong><p class="small muted">${user ? 'Minha conta' : 'Progresso local'}</p></div></a>
        </div>
      </aside>
      <div class="workspace">
        <header class="topbar">${brand()}<div class="breadcrumb">${icon('grid')} <span>${currentName}</span></div>
          <div class="topbar-end">
            <span class="tag" id="sync-status">${esc(sync)}</span>
            ${user ? link('Minha conta','conta','btn ghost','user') : link('Entrar', 'auth/login', 'btn ghost', 'user') + link('Criar conta', 'auth/signup', 'btn primary')}
          </div>
        </header>
        <main id="content" tabindex="-1">${view}
          <footer class="footer">${button('Termos de Uso','terms','btn link')}${button('Privacidade','privacy','btn link')}</footer>
        </main>
      </div>
      <nav class="mobile-nav" aria-label="Navegação principal">${nav(current, true)}</nav>
    </div><dialog id="modal" aria-labelledby="modal-title"></dialog>`;
}

export function dashboard(data, user, filter) {
  const last = recentFirst(data.events)[0]?.mode;
  const start = last && MODES[last] ? last : 'major';
  return `${heading(user ? 'Olá, ' + user.name.split(' ')[0] + '!' : 'Sua central de treino', 'Exercite a memória com técnicas que você pode levar para os estudos, os jogos e o dia a dia.')}
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-layout"><div class="hero-copy">
        <span class="tag pulse-dot">${last ? 'Continue seu treino' : 'Treino gratuito'}</span>
        <h2 id="hero-title">Treine sua <em>memória.</em></h2>
        <p>${last ? 'Retome ' + esc(MODES[start].name) + ' e acompanhe sua evolução a cada sessão.' : 'Comece com o Sistema Maior. Associe números a imagens mentais e teste o que consegue lembrar.'}</p>
        ${link(last ? 'Retomar treino' : 'Começar agora', 'treino/' + start, 'btn primary', 'bolt')}
      </div><div class="orbit" aria-hidden="true"><canvas id="orbit"></canvas></div></div>
    </section>
    <div class="stat-grid">${stats(data).map(([glyph, color, value, label]) => `<div class="stat">${neon(glyph,color)}<div><strong>${esc(value)}</strong><span class="muted small">${esc(label)}</span></div></div>`).join('')}</div>
    ${catalog(data, filter)}`;
}
export function catalog(data, filter, separate = false) {
  const categories = ['Todas', 'Números', 'Estudos', 'Baralho'];
  return `${separate ? heading('Modalidades de treino', 'Escolha o que quer memorizar e avance no seu ritmo.') : ''}
    <section aria-labelledby="catalog-title"><div class="section-head">
      <div><h2 id="catalog-title">${separate ? 'Escolha seu treino' : 'Escolha uma modalidade'}</h2></div>
      <div class="filters" aria-label="Filtrar modalidades">${categories.map(category => button(category, 'filter', 'btn ghost', '', `data-value="${category}" aria-pressed="${filter === category}"`)).join('')}</div>
    </div>
    <div class="mode-grid">${Object.entries(MODES).filter(([, mode]) => filter === 'Todas' || mode.category === filter).map(([key, mode]) => `<a class="mode-card ${mode.color}" href="#treino/${key}">
      <div class="mode-card-top">${neon(mode.icon, mode.color)}${tag(mode.category)}</div>
      <h3>${mode.name}</h3><p>${mode.description}</p>
      <div class="mode-card-bottom"><span>Nível ${levelFor(data.events,key)} · ${mode.label}</span>${icon('arrow')}</div>
    </a>`).join('')}</div></section>`;
}

export function detail(key, data, selected) {
  const mode = MODES[key];
  const unlocked = levelFor(data.events, key);
  const levels = LEVELS.map((name, i) => {
    const index = i + 1;
    const status = index > unlocked ? 'Bloqueado' : index === unlocked ? 'Progresso atual' : 'Concluído';
    return `<li class="level-row"${index === unlocked ? ' aria-current="step"' : ''}><span class="level-num">${index}</span><strong>${name}</strong>${tag(status, index > unlocked ? 'lock' : index < unlocked ? 'check' : 'target')}</li>`;
  }).join('');
  const levelsAvailable = LEVELS.slice(0, unlocked).map((name, i) => [String(i+1), `${i+1} · ${name}`]);
  const setup = [
    select('level', 'Nível', levelsAvailable, String(selected.level || unlocked)),
    key === 'major' ? select('range', 'Cartões', [['pairs','Pares de 00 a 99'],['single','Dígitos de 0 a 9'],['all','Pares e dígitos']], selected.range) : '',
    key === 'dominic' ? select('range', 'Treinar', [['pairs','Pessoas e ações do seu repertório'],['initials','Iniciais de todos os pares']], selected.range) : '',
    key === 'numbers' ? select('method', 'Técnica de apoio', [['major','Sistema Maior'],['dominic','Sistema Dominic']], selected.method) : '',
    key === 'study' ? select('range', 'Cartões', [['examples','Usar exemplos'], ...(data.library.study?.length ? [['custom','Usar meus cartões']] : [])], selected.range) : '',
    ['major','dominic'].includes(key) ? `<label class="check"><input type="checkbox" name="reverse"${selected.reverse ? ' checked' : ''}><span>Inverter pergunta e resposta</span></label>` : ''
  ].join('');
  const table = key === 'major' || key === 'dominic'
    ? `<div class="chip-grid" aria-label="Referência">${(key === 'major' ? MAJOR_SOUNDS : [...DOMINIC_LETTERS]).map((entry,i) => `<div class="chip">${i}<br>${entry}</div>`).join('')}</div>` : '';
  return `${back('Todos os treinos', 'treinos')}
    <div class="detail-title">${neon(mode.icon,mode.color)}<h1>${mode.name}</h1></div><p class="muted intro">${mode.description}</p>
    <div class="split"><section class="surface stack"><h2>Preparar sessão</h2>
      <form data-form="start" data-mode="${key}" class="fields">${setup}${submit('Iniciar treino','bolt')}</form>
      <h3>Como praticar</h3><p class="muted">${mode.technique}</p>
      ${table}<ol class="steps">${mode.steps.map(step => `<li>${step}</li>`).join('')}</ol>
      ${['major','dominic','loci','study'].includes(key) ? `<div>${link('Editar meu material', 'biblioteca/' + key, 'btn ghost','book')}</div>` : ''}
    </section>
    <section class="surface stack"><h2>Níveis do treino</h2><p class="muted small">Faça duas sessões com pelo menos 80% de acertos no nível atual para liberar o próximo.</p><ol class="level-list">${levels}</ol></section></div>`;
}

const card = (value, asButton = false, action = '', disabled = false, position) => {
  const suit = SUITS.find(item => item.key === value.slice(-1));
  const rank = value.slice(0,-1);
  const label = rank + ' de ' + suit.name;
  const inside = `${position ? `<small>${position}</small>` : ''}${rank}<span aria-hidden="true">${suit.symbol}</span>`;
  const cls = 'play-card' + (suit.red ? ' red' : '') + (position ? ' selected-card' : '');
  if (!asButton) return `<span class="${cls}" role="img" aria-label="${label}">${inside}</span>`;
  return `<button type="button" class="${cls}" data-action="${action}" data-value="${esc(value)}" aria-label="${position ? 'Remover ' : ''}${label}"${disabled ? ' disabled' : ''}>${inside}</button>`;
};
const renderValue = (value, kind) => kind === 'cards' && value ? card(value) : esc(value) || 'Em branco';

export function running(run) {
  const {key, round, step, index, correct, feedback, answers} = run;
  const mode = MODES[key];
  let content = '';
  let state = '';
  const progress = step === 'result' ? round.items.length : round.kind === 'flash' ? index : step === 'recall' ? 1 : 0;
  const total = round.kind === 'flash' ? round.items.length : 2;
  if (step === 'result') {
    const accuracy = score(correct, round.items.length);
    content = `<section class="surface stack"><div class="stack center">${neon('trophy','green')}<h1>Sessão concluída</h1><p class="stat-num">${accuracy}%</p>
      <p>${correct} de ${round.items.length} acertos · +${earnedXP(correct, round.items.length, run.level)} XP</p>
      <p class="muted">${run.levelUp ? 'Você liberou o nível ' + (run.level + 1) + '.' : 'O resultado foi adicionado ao seu progresso.'}</p>
      <div class="actions">${button('Treinar novamente', 'repeat', 'btn primary','refresh')}${link('Ver meu progresso','progresso','btn ghost','graph')}</div></div>
      <h3>Conferir respostas</h3><div class="feedback-grid">${feedback.map((item,i) => `<div class="feedback-item${item.hit ? '' : ' miss'}"><strong>${i+1}. ${item.hit ? 'Acerto' : 'Revisar'}</strong><p class="small">${item.question ? esc(item.question) : 'Esperado'} · ${renderValue(item.expected, round.kind)}</p>${item.actual != null && !item.hit ? `<p class="small muted">Sua resposta: ${renderValue(item.actual, round.kind)}</p>` : ''}</div>`).join('')}</div>
    </section>`;
  } else if (round.kind === 'flash' && step !== 'study') {
    const item = round.items[index];
    state = `Cartão ${index+1} de ${total}`;
    content = `<section class="surface stack"><h1>${esc(mode.name)}</h1><p class="muted">${run.revealed ? 'Confira a resposta e marque se você conseguiu lembrar.' : 'Pense na resposta antes de revelar.'}</p>
      <div class="flash-box" aria-live="polite"><span class="flash-front">${esc(item.front)}</span>
        ${item.clue ? `<span class="tag">${esc(item.clue)}</span>` : ''}
        ${run.revealed ? `<div class="fade-up"><p class="flash-answer">${esc(item.back)}</p>${item.hint ? `<p class="muted small">${esc(item.hint)}</p>` : ''}</div>` : ''}</div>
      <div class="actions">${run.revealed ? button('Não lembrei','review-miss','btn ghost') + button('Lembrei','review-hit','btn primary','check') : button('Revelar resposta','reveal','btn primary','arrow')}</div>
    </section>`;
  } else if (step === 'study') {
    state = 'Leitura dos cartões';
    content = `<section class="surface stack"><h1>Estude os cartões</h1><p class="muted">Leia cada pergunta e associe a resposta a algo que você já sabe.</p>
      <div class="feedback-grid">${round.items.map(item => `<div class="loci-item"><strong>${esc(item.front)}</strong><span class="muted">${esc(item.back)}</span></div>`).join('')}</div>
      <div>${button('Começar a recordar','recall','btn primary','arrow')}</div></section>`;
  } else if (step === 'memorize') {
    state = 'Fase de memorização';
    let items = '';
    if (round.kind === 'cards') items = `<div class="token-row">${round.items.map(value => card(value)).join('')}</div>`;
    if (round.kind === 'loci') items = `<div class="loci-grid">${round.items.map((item,i) => `<div class="loci-item"><span class="muted small">${i+1}. ${esc(round.places[i])}</span><strong>${esc(item)}</strong></div>`).join('')}</div>`;
    if (round.kind === 'numbers') {
      const nums = round.items.join('').match(/.{2}/g);
      items = `<div class="token-row">${nums.map(value => `<span class="token">${value}</span>`).join('')}</div>`;
    }
    content = `<section class="surface stack"><h1>Memorize na ordem</h1><p class="muted">${esc(mode.technique)}</p>
      ${items}<div>${button('Ocultar e responder','recall','btn primary','arrow')}</div></section>`;
  } else {
    state = 'Fase de recuperação';
    let fields = '';
    if (round.kind === 'cards') {
      fields = `<p class="muted small">Escolhidas ${answers.length} de ${round.items.length}. Toque em uma carta escolhida para removê-la.</p>
        <div class="token-row">${answers.map((value,i) => card(value, true, 'remove-card', false, i+1)).join('')}</div>
        ${select('suit','Naipe disponível',SUITS.map(suit => [suit.key, suit.name[0].toUpperCase()+suit.name.slice(1) + ' ' + suit.symbol]),run.suit)}
        <div class="card-picker">${RANKS.map(rank => card(rank+run.suit,true,'pick-card',answers.includes(rank+run.suit) || answers.length >= round.items.length)).join('')}</div>`;
    }
    if (round.kind === 'numbers') fields = field('answer','Dígitos na ordem','text',`inputmode="numeric" autocomplete="off" maxlength="${round.items.length}" pattern="[0-9]*"`);
    if (round.kind === 'loci') fields = `<div class="loci-grid">${round.places.map((place,i) => field('part'+i, `${i+1}. ${place}`, 'text', 'maxlength="60" autocomplete="off"')).join('')}</div>`;
    content = `<section class="surface stack"><h1>O que você lembra?</h1><p class="muted">Responda na ordem em que os itens apareceram. Você pode deixar respostas em branco.</p>
      <form class="fields" data-form="answer">${fields}<div>${submit('Corrigir respostas','check')}</div></form></section>`;
  }
  return `<div class="run"><div class="run-top">${tag(mode.name + ' · Nível ' + run.level)}
    ${step !== 'result' ? button('Sair da sessão','leave','btn ghost','close') : ''}</div>
    ${step !== 'result' ? `<div class="run-top"><span class="small muted">${state}</span></div><progress value="${progress}" max="${total}" aria-label="${state}"></progress>` : ''}
    ${message(run.notice || '', Boolean(run.notice), 'run-feedback')}${content}</div>`;
}

export function progress(data) {
  const events = recentFirst(data.events);
  return `${heading('Meu progresso','Acompanhe sua prática e veja onde vale revisar.')}
  <div class="stat-grid">${stats(data).map(([glyph,color,value,label]) => `<div class="stat">${neon(glyph,color)}<div><strong>${esc(value)}</strong><span class="muted small">${esc(label)}</span></div></div>`).join('')}</div>
  <div class="section-head"><h2>Por modalidade</h2></div>
  <div class="rows">${Object.entries(MODES).map(([key, mode]) => {
    const workouts = events.filter(event => event.mode === key);
    const best = workouts.length ? Math.max(...workouts.map(e => score(e.correct,e.total))) + '%' : 'Sem registros';
    const next = levelFor(events,key);
    return `<div class="data-row"><div><strong>${mode.name}</strong><p class="muted small">${suffix(workouts.length,'sessão').replace('sessãos','sessões')} · Melhor: ${best}</p></div>${link('Nível ' + next, 'treino/' + key, 'btn ghost')}</div>`;
  }).join('')}</div>
  ${data.legacy?.totalSessions ? `<section class="surface stack"><h2>Histórico anterior</h2><p class="muted">Sessões: ${Number(data.legacy.totalSessions) || 0}. Maior sequência registrada: ${Number(data.legacy.bestSequenceLength) || 0} itens.</p></section>` : ''}
  <div class="section-head"><h2>Sessões recentes</h2></div>
  ${events.length ? `<div class="rows">${events.slice(0,12).map(event => `<div class="data-row"><div><strong>${MODES[event.mode]?.name || 'Treino'}</strong><p class="muted small">${dateFormat.format(event.at)} · Nível ${event.level} · ${event.seconds}s</p></div>${tag(score(event.correct,event.total) + '% de acertos','check')}</div>`).join('')}</div>` :
    `<div class="surface stack"><p class="muted">Complete o primeiro treino para começar seu histórico.</p><div>${link('Ver modalidades','treinos','btn primary','arrow')}</div></div>`}`;
}

export function library(data, tab, chosen) {
  const all = ['major','dominic','loci','study'];
  const active = all.includes(tab) ? tab : 'major';
  const tabs = all.map(key => `<a class="btn ghost" href="#biblioteca/${key}"${key === active ? ' aria-current="page"' : ''}>${esc(MODES[key].name)}</a>`).join('');
  const root = `${heading('Minha biblioteca','Adapte as associações ao que você consegue imaginar com facilidade.')}<nav class="filters back" aria-label="Biblioteca">${tabs}</nav>${message()}`;
  const cards = data.library.study || [];
  const paired = pairsFor(data.library);
  if (active === 'study') {
    return root + `<section class="surface stack"><h2>Seus cartões de estudo</h2><form class="fields" data-form="study">
      ${textarea('front','Pergunta ou pista','','maxlength="300" required')}${textarea('back','Resposta','','maxlength="500" required')}
      <div>${submit('Adicionar cartão','plus')}</div></form>
      ${cards.length ? `<div class="rows">${cards.map(item => `<div class="data-row"><div><strong>${esc(item.front)}</strong><p class="muted small">${esc(item.back)}</p></div>${button('Remover','remove-study','btn ghost','close',`data-value="${esc(item.id)}"`)}</div>`).join('')}</div>` : '<p class="muted small">Nenhum cartão próprio. O treino também tem cartões de exemplo.</p>'}
    </section>`;
  }
  if (active === 'loci') return root + `<section class="surface stack"><h2>Sua rota</h2><p class="muted">Digite de 3 a 15 pontos familiares, um por linha e na ordem da caminhada. Deixe em branco para usar a rota de exemplo.</p>
    <form class="fields" data-form="places">${textarea('places','Locais',data.library.places?.join('\n'),'maxlength="1150"')}<div>${submit('Salvar rota','check')}</div></form></section>`;
  if (active === 'dominic') {
    const num = /^\d{2}$/.test(chosen) ? chosen : '00';
    const pair = paired[num] || [];
    return root + `<section class="surface stack"><h2>Seu repertório Dominic</h2><p class="muted">${Object.keys(paired).length} de 100 pares preenchidos. Prefira pessoas conhecidas e ações distintas.</p>
    <form class="fields" data-form="dominic" data-number="${num}">${select('pair','Par e iniciais',PAIRS.map(key => [key,key + ' · ' + initials(key) + (paired[key] ? ' ✓' : '')]),num)}
      ${field('person','Pessoa','text',`maxlength="80" required value="${esc(pair[0])}"`)}
      ${field('action','Ação','text',`maxlength="80" required value="${esc(pair[1])}"`)}
      <div>${submit('Salvar associação','check')}</div></form></section>`;
  }
  const num = Object.hasOwn(MAJOR, chosen) ? chosen : '00';
  const pair = data.library.major?.[num];
  return root + `<section class="surface stack"><h2>Associações do Sistema Maior</h2><p class="muted">Escolha um número. Se deixar a palavra vazia, será usada a associação original.</p>
      <form class="fields" data-form="major" data-number="${num}">${select('pair','Número',Object.keys(MAJOR).sort((a,b) => a.length-b.length || a.localeCompare(b)).map(key => [key,key + ' · ' + (data.library.major?.[key]?.word || MAJOR[key])]),num)}
      ${field('word','Sua palavra','text',`maxlength="100" placeholder="${esc(MAJOR[num])}" value="${esc(pair?.word)}"`)}
      ${textarea('hint','Pista visual (opcional)',pair?.hint,'maxlength="500"')}
      <div>${submit('Salvar associação','check')}</div></form></section>`;
}

const legalAcceptance = () => `<div class="stack"><label class="check"><input type="checkbox" name="terms" required><span>Li e aceito os Termos de Uso e estou ciente do Aviso de Privacidade.</span></label>
  <div class="auth-footer">${button('Ler termos','terms','btn link')}${button('Ler privacidade','privacy','btn link')}</div></div>`;
const offersOption = checked => `<label class="check"><input type="checkbox" name="offers"${checked ? ' checked' : ''}><span>Quero ver ofertas de serviços do Mnemônix dentro da plataforma. Posso mudar essa preferência na minha conta.</span></label>`;
const password = (name, label, autocomplete = 'new-password') => field(name,label,'password',`autocomplete="${autocomplete}" ${autocomplete === 'new-password' ? 'minlength="8" maxlength="72"' : 'maxlength="256"'} required`);

export function authScreen(view, info) {
  const variants = {
    login: ['Entrar', 'Acesse seu progresso de qualquer dispositivo.', 'user'],
    signup: ['Criar sua conta', 'Salve seus treinos e acompanhe sua evolução.', 'plus'],
    confirm: ['Confirme seu e-mail', 'Abra o link do Mnemônix enviado para sua caixa de entrada. Confira também a pasta de spam.', 'mail'],
    verify: ['Validar e-mail', 'Confirme que este endereço pertence a você.', 'mail'],
    forgot: ['Recuperar senha', 'Informe o e-mail vinculado à sua conta.', 'lock'],
    reset: ['Criar nova senha', 'Escolha uma senha com pelo menos 8 caracteres.', 'lock'],
    accept: ['Aceite os termos', 'Leia os termos atualizados para continuar usando sua conta.', 'book']
  };
  const [title, caption, glyph] = variants[view] || variants.login;
  const email = field('email','E-mail','email',`autocomplete="email" maxlength="254" value="${esc(info.email)}" required`);
  const relevant = [
    view === 'login' ? field('identifier','E-mail ou nome de usuário','text',`autocomplete="username" maxlength="254" value="${esc(info.email)}" required`) + password('password','Senha','current-password') + submit('Entrar','arrow') : '',
    view === 'signup' ? field('name','Seu nome','text','autocomplete="name" minlength="2" maxlength="80" required') + email + password('password','Senha (mínimo 8 caracteres)') + legalAcceptance() + offersOption(false) + submit('Criar conta','arrow') : '',
    view === 'forgot' ? email + submit('Enviar link','mail') : '',
    view === 'verify' ? submit('Confirmar meu e-mail','check') : '',
    view === 'reset' ? password('password','Nova senha') + submit('Salvar nova senha','check') : '',
    view === 'accept' ? legalAcceptance() + submit('Aceitar e continuar','check') : ''
  ].join('');
  const availability = info.note || (view === 'signup' && info.registration === false ? 'A confirmação de e-mail ainda não está disponível neste ambiente. Você pode explorar os treinos como visitante.' : '');
  return `<div class="auth-shell"><main id="content" class="auth-card" tabindex="-1">${brand()}${neon(glyph)}
    <h1>${title}</h1><p class="muted">${caption}</p>${message(availability, info.error, 'authfeedback')}
    ${relevant ? `<form class="fields" data-form="auth" data-view="${view}">${relevant}</form>` : ''}
    <div class="auth-footer">${view === 'login' ? link('Esqueci minha senha','auth/forgot','btn link') + link('Criar conta','auth/signup','btn link')
      : view === 'accept' ? '' : link('Voltar para entrar','auth/login','btn link')}
      ${view === 'accept' ? button('Treinar como visitante','logout','btn ghost') : link('Treinar como visitante','inicio','btn ghost')}</div>
  </main></div><dialog id="modal" aria-labelledby="modal-title"></dialog>`;
}

export function account(data, user, sync, guestHasData) {
  return `${heading('Minha conta','Gerencie seus dados, preferências e progresso.')}
    <div class="split">
      <section class="surface stack"><h2>${esc(user.name)}</h2><p class="muted">${esc(user.email)}</p><div>${tag(user.verified ? 'E-mail confirmado' : 'Conta anterior à validação', user.verified ? 'check' : 'mail')}</div>
      <div class="actions">${button('Sair da conta','logout','btn ghost')}${button('Instalar aplicativo','install','btn ghost','plus')}</div>
      ${message(sync, false, 'account-sync')}${button('Sincronizar agora','retry','btn ghost','refresh')}
      ${guestHasData ? button('Importar treino de visitante','import-guest','btn ghost','plus') : ''}
      <h3>Dados dos treinos</h3><p class="muted small">Exporte um arquivo de backup ou recupere uma exportação do Sistema Maior anterior.</p>
      <div class="actions">${button('Exportar meus dados','export','btn ghost')}${button('Importar backup antigo','import-file','btn ghost')}<input id="import-file" type="file" accept="application/json,.json" hidden></div>${message()}</section>
      <section class="surface stack"><h2>Privacidade</h2>
        <form data-form="offers" class="fields">${offersOption(data.preferences.offers)}<div>${submit('Salvar preferência','check')}</div></form>
        <div class="actions">${button('Aviso de Privacidade','privacy','btn link')}${button('Termos de Uso','terms','btn link')}</div>
        <h3>Solicitar atendimento</h3><p class="muted small">Para acesso, correção ou exclusão, registre sua solicitação.</p>
        <form data-form="privacy" class="fields">${select('kind','Tipo de solicitação',[['access','Acesso aos dados'],['correction','Correção'],['deletion','Exclusão'],['other','Outros']])}
        ${textarea('details','Descreva sua solicitação','','maxlength="1000" required')}<div>${submit('Registrar solicitação','arrow')}</div></form>${message('',false,'privacy-feedback')}
      </section>
      <section class="surface stack"><h2>Segurança</h2><form data-form="password" class="fields">
        ${password('current','Senha atual','current-password')}${password('password','Nova senha')}<div>${submit('Alterar senha','lock')}</div></form>${message('',false,'password-feedback')}
      </section>
    </div>`;
}

export function legalDialog(key) {
  const info = LEGAL[key];
  return `<div class="stack"><h2 id="modal-title">${info.title}</h2><p class="muted small">Versão ${TERMS_VERSION}</p>
    <div class="legal-list">${info.sections.map(([title, body]) => `<p class="muted small"><strong>${title}</strong><br>${body}</p>`).join('')}</div>
    <div>${button('Fechar','close','btn primary','check')}</div></div>`;
}
export function genericDialog(title, description, action, label, glyph = 'arrow') {
  return `<div class="stack"><h2 id="modal-title">${esc(title)}</h2><p class="muted">${esc(description)}</p><div class="actions">
    ${action ? button(label,action,'btn primary',glyph) : ''}${button(action ? 'Cancelar' : 'Fechar','close','btn ghost')}</div></div>`;
}
