import {drawOrbit} from './art.js';
import {account, authScreen, catalog, dashboard, detail, genericDialog, legalDialog, library, progress, running, shell} from './views.js';
import {TERMS_VERSION} from './legal.js';
import {MODES, SUITS, day, emptyProgress, levelFor, makeRound, normalize, reviewResult} from './training.js';
import {applyChange, fromLegacy, getAccountCopy, getPending, loadGuest, putAccountCopy, putPending, request, saveGuest} from './progress.js';

const root = document.querySelector('#app');
const announcement = document.querySelector('#announcement');
const titles = {inicio: 'Início', treinos: 'Treinos', treino: 'Treino', progresso: 'Meu progresso', biblioteca: 'Biblioteca', conta: 'Minha conta', auth: 'Acesso'};
const memory = {
  user: null, registration: null, data: loadGuest(), sync: 'Progresso neste aparelho', pending: [],
  filter: 'Todas', chosen: '', loadVersion: 0, run: null, options: {}, authEmail: '', authNote: '', authError: false
};
let syncing = false;
let orbitWatch;
let installPrompt;
let lastPath = '';

const parts = () => (location.hash.slice(1) || 'inicio').split('/');
const navigate = path => {
  if (location.hash === '#' + path) render(true);
  else location.hash = path;
};
const announce = text => { announcement.textContent = text; };
const find = selector => root.querySelector(selector);
function setMessage(id, text, error = false) {
  const node = find('#' + id);
  if (!node) return;
  node.textContent = text;
  node.classList.toggle('error', error);
}
function setSync(text) {
  memory.sync = text;
  const badge = find('#sync-status');
  if (badge) badge.textContent = text;
  setMessage('account-sync', text);
}
function render(focus = false) {
  const [page, secondary] = parts();
  const current = Object.hasOwn(titles,page) ? page : 'inicio';
  const auth = current === 'auth' ? secondary || 'login' : memory.user && !memory.user.terms ? 'accept' : current === 'conta' && !memory.user ? 'login' : null;
  orbitWatch?.disconnect();
  document.title = (titles[current] || 'Início') + ' · Mnemônix';
  if (auth) {
    root.innerHTML = authScreen(auth, {email: memory.authEmail, note: memory.authNote, error: memory.authError, registration: memory.registration});
  } else {
    let view;
    const {data, user, filter, run} = memory;
    if (current === 'treino' && run && run.key === secondary) view = running(run);
    else if (current === 'treino' && Object.hasOwn(MODES,secondary)) view = detail(secondary, data, memory.options[secondary] || {});
    else if (current === 'treinos') view = catalog(data, filter, true);
    else if (current === 'progresso') view = progress(data);
    else if (current === 'biblioteca') view = library(data, secondary, memory.chosen);
    else if (current === 'conta') {
      const guest = loadGuest();
      view = account(data,user,memory.sync,guest.events.length > 0 || Object.keys(guest.library.major || {}).length > 0 ||
        Object.keys(guest.library.dominic || {}).length > 0 || guest.library.study?.length > 0 || guest.library.places?.length > 0);
    } else view = dashboard(data,user,filter);
    root.innerHTML = shell(view, current === 'treino' ? 'treinos' : current, user, memory.sync);
    const canvas = find('#orbit');
    if (canvas) {
      orbitWatch = new ResizeObserver(() => drawOrbit(canvas));
      orbitWatch.observe(canvas);
    }
  }
  if (focus) {
    window.scrollTo(0,0);
    find('#content')?.focus({preventScroll:true});
  }
}

function save(change) {
  const user = memory.user;
  applyChange(memory.data, change);
  if (!user) {
    setSync(saveGuest(memory.data) ? 'Progresso neste aparelho' : 'Armazenamento local indisponível');
    return;
  }
  memory.pending.push({...change, id: crypto.randomUUID()});
  if (putPending(user, memory.pending)) setSync('Aguardando sincronização');
  else setSync('Falha ao guardar cópia local. Mantenha esta aba aberta.');
  void flush();
}
async function flush() {
  const user = memory.user;
  if (syncing || !user || !user.terms || !memory.pending.length) return;
  syncing = true;
  try {
    while (memory.user?.id === user.id && memory.pending.length) {
      const item = memory.pending[0];
      setSync('Sincronizando…');
      const {state} = await request('data',item);
      if (memory.user?.id !== user.id) return;
      memory.pending.shift();
      putPending(user,memory.pending);
      putAccountCopy(user,state);
      memory.data = memory.pending.reduce(applyChange,state);
    }
    if (memory.user?.id === user.id) setSync('Sincronizado');
  } catch (error) {
    if (memory.user?.id === user.id) setSync(error.status === 401 ? 'Sessão expirada. Entre para sincronizar.' : 'Sincronização pendente');
  } finally {
    syncing = false;
    if (memory.user?.id && memory.user.id !== user.id && memory.pending.length) void flush();
  }
}
async function activate(user, rerender = true) {
  const attempt = ++memory.loadVersion;
  memory.user = user;
  if (!user) {
    memory.data = loadGuest();
    memory.pending = [];
    setSync('Progresso neste aparelho');
    if (rerender) render(false);
    return;
  }
  memory.pending = getPending(user);
  memory.data = memory.pending.reduce(applyChange,getAccountCopy(user) || emptyProgress());
  setSync('Carregando progresso…');
  if (rerender) render(false);
  if (!user.terms) return;
  try {
    const {state} = await request('data');
    if (attempt !== memory.loadVersion) return;
    putAccountCopy(user,state);
    memory.data = memory.pending.reduce(applyChange,state);
    setSync(memory.pending.length ? 'Aguardando sincronização' : 'Sincronizado');
    if (!memory.run && !find('form:focus-within') && !find('dialog[open]')) render(false);
  } catch (error) {
    if (attempt === memory.loadVersion) setSync(error.status === 401 ? 'Sessão expirada. Entre novamente.' : 'Progresso local disponível');
  }
  if (attempt === memory.loadVersion) void flush();
}

function start(key, options) {
  if (!Object.hasOwn(MODES,key)) return;
  const level = Math.max(1, Math.min(levelFor(memory.data.events,key), Number(options.level) || 1));
  memory.options[key] = {...options,level};
  const round = makeRound(key,level,memory.data.library,memory.data.reviews,options);
  memory.run = {key, level, options, round, step: round.preview ? 'study' : round.kind === 'flash' ? 'flash' : 'memorize',
    index:0, revealed:false, correct:0, started:Date.now(), feedback:[], reviews:{}, answers:[], suit:SUITS[0].key};
  render(true);
}
function finish() {
  const run = memory.run;
  const before = levelFor(memory.data.events, run.key);
  run.step = 'result';
  save({event:{id:crypto.randomUUID(), mode:run.key, level:run.level, correct:run.correct, total:run.round.items.length,
    seconds:Math.min(86400,Math.floor((Date.now() - run.started)/1000)), at:Date.now()}, reviews:run.reviews});
  run.levelUp = levelFor(memory.data.events,run.key) > before;
  render(true);
  announce('Treino concluído. ' + run.correct + ' acertos.');
}
function rate(hit) {
  const run = memory.run;
  if (!run?.revealed || run.step !== 'flash') return;
  const item = run.round.items[run.index];
  const id = run.key + ':' + item.id + (run.options.reverse ? ':reverse' : '');
  run.reviews[id] = reviewResult(memory.data.reviews[id],hit);
  run.feedback.push({question:item.front, expected:item.back, hit});
  if (hit) run.correct++;
  run.index++;
  run.revealed = false;
  if (run.index >= run.round.items.length) finish();
  else {
    render(false);
    find('[data-action="reveal"]')?.focus({preventScroll:true});
    announce('Cartão ' + (run.index + 1) + ' de ' + run.round.items.length);
  }
}
function answer(values) {
  const run = memory.run;
  const {round} = run;
  const actual = round.kind === 'cards' ? run.answers : round.kind === 'numbers' ? String(values.answer || '').split('')
    : round.places.map((_, i) => values['part' + i]);
  run.feedback = round.items.map((expected, i) => {
    const value = actual[i] || '';
    return {expected, actual:value, hit:normalize(expected) === normalize(value), question:round.places?.[i]};
  });
  run.correct = run.feedback.filter(item => item.hit).length;
  finish();
}
function modal(html) {
  const node = find('#modal');
  node.innerHTML = html;
  if (!node.open) node.showModal();
}
function download() {
  const blob = new Blob([JSON.stringify({schemaVersion:3, exportedAt:new Date().toISOString(), state:memory.data},null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mnemonix-' + day(Date.now()) + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
function showUserMessage(text, isError = false) {
  memory.authNote = text;
  memory.authError = isError;
  setMessage('authfeedback',text,isError);
}
async function handleAuth(form, values) {
  const action = form.dataset.view;
  const [,, token] = parts();
  const payload = {...values, terms:values.terms === 'on', offers:values.offers === 'on', termsVersion:TERMS_VERSION, token};
  if (values.email) memory.authEmail = values.email;
  if (values.identifier && values.identifier.includes('@')) memory.authEmail = values.identifier;
  const result = await request('auth', {...payload, action});
  showUserMessage(result.message || '');
  if (result.user) {
    memory.run = null;
    void activate(result.user, false);
    navigate(result.user.terms ? 'inicio' : 'auth/accept');
  } else if (action === 'signup') navigate('auth/confirm');
  else if (action === 'verify' || action === 'reset') {
    sessionStorage.setItem('mnemonix_login_notice', result.message);
    location.replace('#auth/login');
  }
}
async function logout() {
  try {
    await request('auth', {action:'logout'});
    memory.run = null;
    await activate(null,false);
    memory.authNote = '';
    navigate('inicio');
  } catch (error) {
    if (parts()[0] === 'auth') showUserMessage(error.message,true);
    else setMessage('feedback',error.message,true);
  }
}

document.addEventListener('submit', async event => {
  const form = event.target;
  const key = form.dataset.form;
  if (!key) return;
  event.preventDefault();
  if (form.dataset.busy) return;
  const button = form.querySelector('[type=submit]');
  const values = Object.fromEntries(new FormData(form));
  if (key === 'start') return start(form.dataset.mode,{...values, reverse:values.reverse === 'on'});
  if (key === 'answer') return answer(values);
  form.dataset.busy = '1';
  button.disabled = true;
  const feedback = key === 'auth' ? 'authfeedback' : key === 'privacy' ? 'privacy-feedback' : key === 'password' ? 'password-feedback' : 'feedback';
  setMessage(feedback,'');
  try {
    if (key === 'auth') await handleAuth(form,values);
    if (key === 'major') save({library:{major:{[form.dataset.number]:{word:values.word.trim(),hint:values.hint.trim()}}}});
    if (key === 'dominic') {
      const pair = [values.person.trim(),values.action.trim()];
      if (pair.some(item => !item)) throw new Error('Preencha a pessoa e a ação.');
      save({library:{dominic:{[form.dataset.number]:pair}}});
    }
    if (key === 'study') {
      const cards = memory.data.library.study || [];
      if (cards.length >= 200) throw new Error('O limite é de 200 cartões. Remova um cartão para incluir outro.');
      if (!values.front.trim() || !values.back.trim()) throw new Error('Informe a pergunta e a resposta.');
      save({library:{study:[...cards,{id:crypto.randomUUID(),front:values.front.trim(),back:values.back.trim()}]}});
      render(false);
    }
    if (key === 'places') {
      const places = values.places.split('\n').map(place => place.trim()).filter(Boolean);
      if ((places.length > 0 && places.length < 3) || places.length > 15 || places.some(place => place.length > 75)) throw new Error('Informe de 3 a 15 pontos com até 75 caracteres cada.');
      save({library:{places}});
    }
    if (key === 'offers') save({preferences:{offers:values.offers === 'on'}});
    if (key === 'privacy') {
      const result = await request('data',{action:'privacy',...values});
      form.reset();
      setMessage(feedback,result.message);
    }
    if (key === 'password') {
      const result = await request('auth',{action:'change_password',...values});
      form.reset();
      setMessage(feedback,result.message);
    }
    if (['major','dominic','study','places'].includes(key)) setMessage(feedback,'Guardado.');
    if (key === 'offers') setMessage(feedback,'Preferência atualizada.');
  } catch (error) {
    if (key === 'auth') showUserMessage(error.message,true);
    else setMessage(feedback,error.message,true);
  } finally {
    delete form.dataset.busy;
    button.disabled = false;
  }
});

document.addEventListener('change', async event => {
  const {target} = event;
  if (target.name === 'pair') {
    memory.chosen = target.value;
    render(false);
    find('[name="pair"]')?.focus({preventScroll:true});
  }
  if (target.name === 'suit' && memory.run?.step === 'recall') {
    memory.run.suit = target.value;
    render(false);
    find('[name="suit"]')?.focus({preventScroll:true});
  }
  if (target.id === 'import-file' && target.files?.[0]) {
    const file = target.files[0];
    target.value = '';
    try {
      if (file.size > 1e6) throw new Error('O arquivo de backup deve ter até 1 MB.');
      const parsed = JSON.parse(await file.text());
      const items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items) || !items.some(item => item && typeof item.numberValue === 'string')) throw new Error('Escolha um backup válido do Sistema Maior.');
      const legacy = fromLegacy(items);
      save({library:legacy.library,reviews:legacy.reviews});
      setMessage('feedback','Associações e revisões importadas.');
    } catch (error) { setMessage('feedback',error.message,true); }
  }
});

document.addEventListener('click', async event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  const value = control.dataset.value;
  const run = memory.run;
  if (action === 'filter') {
    memory.filter = value;
    render(false);
    find('[aria-pressed="true"]')?.focus({preventScroll:true});
  }
  if (action === 'terms' || action === 'privacy') modal(legalDialog(action));
  if (action === 'close') find('#modal')?.close();
  if (action === 'reveal' && run?.step === 'flash') {
    run.revealed = true;
    render(false);
    find('[data-action="review-hit"]')?.focus({preventScroll:true});
  }
  if (action === 'review-hit' || action === 'review-miss') rate(action === 'review-hit');
  if (action === 'recall' && run) {
    run.step = run.step === 'study' ? 'flash' : 'recall';
    render(true);
    find('[name="answer"],[name="part0"],[data-action="reveal"]')?.focus({preventScroll:true});
  }
  if (action === 'pick-card' && run?.step === 'recall' && !run.answers.includes(value) && run.answers.length < run.round.items.length) {
    run.answers.push(value);
    render(false);
    find('[data-action="pick-card"]:not(:disabled)')?.focus({preventScroll:true});
  }
  if (action === 'remove-card' && run) {
    run.answers = run.answers.filter(selected => selected !== value);
    render(false);
    find('[data-action="remove-card"], [name="suit"]')?.focus({preventScroll:true});
  }
  if (action === 'repeat' && run) start(run.key,{...run.options,level:levelFor(memory.data.events,run.key)});
  if (action === 'leave') modal(genericDialog('Sair da sessão?','Esta sessão vai terminar sem registrar resultado.','leave-confirm','Sair da sessão','close'));
  if (action === 'leave-confirm') {
    memory.run = null;
    render(true);
  }
  if (action === 'remove-study') {
    save({library:{study:(memory.data.library.study || []).filter(item => item.id !== value)}});
    render(false);
    announce('Cartão removido.');
  }
  if (action === 'logout') await logout();
  if (action === 'retry') {
    if (memory.pending.length) await flush();
    else if (memory.user) await activate(memory.user,false);
  }
  if (action === 'export') download();
  if (action === 'import-file') find('#import-file')?.click();
  if (action === 'import-guest') modal(genericDialog('Importar treinos deste aparelho?', 'Suas sessões locais serão adicionadas à conta. Associações locais do mesmo número terão prioridade.', 'sync-guest','Importar treinos','check'));
  if (action === 'sync-guest') {
    find('#modal')?.close();
    const guest = loadGuest();
    const existing = new Set(memory.data.events.map(item => item.id));
    const library = {...guest.library};
    if (library.study?.length) {
      const cards = new Map((memory.data.library.study || []).map(item => [item.id,item]));
      library.study.forEach(item => cards.set(item.id,item));
      library.study = [...cards.values()].slice(0,200);
    }
    save({library,reviews:guest.reviews});
    guest.events.filter(item => !existing.has(item.id)).forEach(item => save({event:item}));
    setMessage('feedback','Progresso local adicionado à fila de sincronização.');
  }
  if (action === 'install') {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      await prompt.prompt();
    } else modal(genericDialog('Instalar o Mnemônix','Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial. No Safari, a opção fica em Compartilhar.'));
  }
});

window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; });
window.addEventListener('online', () => { if (memory.user) void flush(); });
window.addEventListener('hashchange', () => {
  const [page, sub] = parts();
  if (lastPath !== location.hash) {
    if (!lastPath.startsWith('#auth/') || page !== 'auth') {
      memory.authNote = '';
      memory.authError = false;
    }
    if (page === 'auth' && sub === 'login') {
      const note = sessionStorage.getItem('mnemonix_login_notice');
      memory.authNote = note || '';
      memory.authError = false;
      sessionStorage.removeItem('mnemonix_login_notice');
    }
    if (page !== 'treino' || sub !== memory.run?.key) memory.run = null;
    memory.chosen = '';
  }
  lastPath = location.hash;
  render(true);
});
lastPath = location.hash;
render();
request('auth').then(result => {
  memory.registration = result.registration;
  if (result.user) void activate(result.user);
  else if (parts()[1] === 'signup' && !find('form:focus-within') && !find('dialog[open]')) render(false);
}).catch(error => {
  if (error.status === 503) {
    memory.registration = false;
    if (parts()[1] === 'signup' && !find('form:focus-within') && !find('dialog[open]')) render(false);
  }
});
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'}).catch(() => {});
