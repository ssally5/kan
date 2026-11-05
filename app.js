import { accountForm, optionalRecoveryEmail } from './account.js';
import {words, layouts, freshState} from './data.js';
const $ = s => document.querySelector(s), esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const paths = {
  search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  saved:'<path d="M6 3h12v18l-6-4-6 4z"/>',
  review:'<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/><path d="M12 7v5l3 2"/>',
  quiz:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m9 12 2 2 4-5"/>',
  scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 9h10M7 13h10M7 17h6"/>',
  history:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
  settings:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  folder:'<path d="M3 6h7l2 3h9v11H3z"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  book:'<path d="M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-4-1-7-1-10 1z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>'
};
const icon = n => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[n] || paths.book}</svg>`;
let state = freshState(),
  demo = false,
  page = 'search',
  query = '',
  mode = 'Auto',
  folder = 'all',
  selectedFolders = new Set(),
  selecting = false,
  traditional = false,
  intervals = [1, 2, 3, 5, 7, 10],
  schedule = 'days',
  quiz = null,
  paused = null,
  detailStack = [],
  lastFocus = null,
  historyOrigin = 'All',
  historyQuery = '',
  scanText = '',
  imageURL = '',
  activeLayout = 0,
  sessionNumber = 0,
  pendingSave = null;
const ch = w => traditional ? w.tr:w.ch, dueIds = () => Object.keys(state.review).map(Number).filter(id => state.review[id].due <= (schedule === 'days' ? Date.now():sessionNumber));
const btn = (text, action, cls = '') => `<button class="${cls}" data-action="${action}">${text}</button>`;
function toast(t) {
  $('#toast').textContent = t;
  $('#toast').style.display = 'block';
  setTimeout(() => $('#toast').style.display = 'none', 3200)
}
function modal(html) {
  lastFocus = document.activeElement;
  $('#modal').innerHTML = `<div class="modalshade"><section class="modal" role="dialog" aria-modal="true" aria-label="Kan dialog"><div class="modalhead"><span class="eyebrow">KAN · ${demo ? 'DEMO WORKSPACE':'EXPLORE CHINESE'}</span>${btn('✕', 'close', 'ghost small')}</div>${html}</section></div>`;
  $('#modal button')?.focus()
}
function close() {
  $('#modal').innerHTML = '';
  lastFocus?.focus()
}
function heading(title, sub = '') {
  return `<div class="heading"><h1>${title}</h1>${sub ? `<p>${sub}</p>`:''}</div>`
}
function row(w, origin = 'Chinese') {
  return `<button class="wordrow" data-word="${w.id}" data-origin="${origin}"><span class="han">${ch(w)}</span><span class="wordtext"><div class="pinyin">${w.py}</div><div class="meaning">${w.en}</div></span><span class="hsk">HSK ${w.hsk}</span><span class="arrow">›</span></button>`
}
function wordlist(ids, origin = 'Chinese') {
  return `<div class="card wordlist">${ids.map(id => row(words[id], origin)).join('') || '<div class="empty">No words here yet.</div>'}</div>`
}
function guestGate() {
  modal(`<h2>Sign in required</h2><div class="notice">This frontend preview has no account service yet. Explore a temporary demo workspace, or preview the account screens. Demo changes reset when you refresh.</div><div class="toolbar">${btn('Open demo', 'demo', 'primary')}${btn('Sign in', 'auth-login')}${btn('Create account', 'auth-signup')}</div>`)
}
function protectedPage() {
  return `<div class="card empty">${icon('saved')}<h2>Sign in required</h2><p>Sign in to save vocabulary and study progress.</p>${btn('Open demo', 'demo', 'primary')} ${btn('Sign in', 'auth-login')}<p><small>Frontend preview · no accounts or data are stored</small></p></div>`
}
const navs = [['search', 'Search'], ['saved', 'Saved Words'], ['review', 'Spaced Review'], ['quiz', 'Quiz'], ['scan', 'Scan'], ['history', 'Search History']];
function render() {
  $('#app').innerHTML = `<aside class="sidebar">${btn('✕', 'menu', 'sidebar-close ghost')}<div class="brand"><span class="seal">看</span><div>kan</div></div><nav class="nav">${navs.map(([p, n]) => `<button data-nav="${p}" class="${page === p ? 'active':''}">${icon(p)}${n}${p === 'review' && demo ? `<span class="count">${dueIds().length}</span>`:''}</button>`).join('')}</nav><div class="sidebar-bottom"><nav class="nav"><button data-nav="settings" class="${page === 'settings' ? 'active':''}">${icon('settings')}Settings & Account</button></nav><div class="account"><span class="avatar">${demo ? '学':'人'}</span><div>${demo ? 'Demo learner':'Guest'}<small>${demo ? 'Temporary workspace':'Not signed in'}</small></div></div></div></aside><main class="main"><header class="topbar"><div>${btn(icon('menu'), 'menu', 'mobile-menu ghost')}<span class="breadcrumb">${navs.find(n => n[0] === page)?.[1] || 'Settings & Account'}</span></div><div class="topright"><span class="tag">FRONTEND PREVIEW</span><span class="muted">${traditional ? '繁體中文':'简体中文'}</span>${btn(demo ? 'Demo account':'Sign in', demo ? 'account':'auth-login', 'small ghost')}</div></header><div id="content">${content()}</div><footer class="footer"><span>Sample dictionary · ${demo ? 'Demo changes reset on refresh':'No guest data is stored'}</span></footer></main>`;
  bindInputs()
}
function content() {
  if(quiz)return quizView();
  switch(page) {
    case'search':
      return searchPage();
    case'saved':
      return savedPage();
    case'review':
      return reviewPage();
    case'quiz':
      return quizSetup();
    case'scan':
      return scanPage();
    case'history':
      return historyPage();
    default:
      return settingsPage()
  }
}
function searchPage() {
  return `${heading('Search')}<div class="searchbox">${icon('search')}<input id="search" aria-label="Search dictionary" placeholder="Search Chinese, pinyin, or English…" value="${esc(query)}" autocomplete="off"><select id="mode" aria-label="Search type">${['Auto', 'English', 'Pinyin'].map(x => `<option ${mode === x ? 'selected':''}>${x}</option>`).join('')}</select></div><div class="hint">Examples: ${['学习', 'peng you', 'discover', '今天我们一起去学校'].map(x => `<button data-query="${x}">${x}</button>`).join('')}</div><div class="columns"><section><div class="sectiontitle"><h2 id="results-title">${query ? 'Search results':'Sample words'}</h2></div><div id="results">${searchResults()}</div></section><aside class="aside"><div class="card study"><h2>Spaced Review</h2>${demo ? `<div class="study-count">${dueIds().length}<small>words ready to review</small></div>${btn('Start review ' + icon('arrow'), 'start-review', 'primary')}<div class="stats"><div><strong>${state.saved.size}</strong><small>saved words</small></div><div><strong>${state.completed.length}</strong><small>completed</small></div></div>`:`${btn('Open demo ' + icon('arrow'), 'demo', 'primary')}`}</div><div class="card quick"><button data-nav="quiz"><span class="badgeicon">${icon('quiz')}</span><span><strong>Quiz</strong></span><span>↗</span></button><button data-nav="scan"><span class="badgeicon">${icon('scan')}</span><span><strong>Scan</strong></span><span>↗</span></button></div></aside></div>`
}
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f\s1-5]/g, '');
function searchResults() {
  if(!query.trim())return wordlist([0, 1, 2, 3, 4]);
  const q = query.trim().toLowerCase();
  let found = words.filter(w => (mode !== 'Pinyin' && mode !== 'English' && (w.ch.includes(q) || w.tr.includes(q))) || (mode !== 'English' && normalize(w.py).includes(normalize(q))) || (mode !== 'Pinyin' && w.en.toLowerCase().includes(q)));
  if(found.length)return wordlist(found.map(w => w.id), mode === 'Auto' ? (/[\u3400-\u9fff]/.test(q) ? 'Chinese':found.some(w => normalize(w.py).includes(normalize(q))) ? 'Pinyin':'English'):mode);
  if(/[\u3400-\u9fff]/.test(q) && q.length > 3)return `<div class="card"><div class="eyebrow">INTERACTIVE READING</div>${tokens(q)}<p class="muted">Tap a recognized word to explore it. Unlinked characters aren’t in this sample dictionary.</p></div>`;
  return '<div class="card empty">No sample matches yet.<p>This preview contains 20 curated entries. Full dictionary coverage comes with the dictionary backend slice.</p></div>'
}
function tokens(text, origin = 'Chinese') {
  let out = '',
    i = 0,
    sorted = [...words].sort((a, b) => b.ch.length - a.ch.length);
  while(i < text.length) {
    let w = sorted.find(w => text.startsWith(w.ch, i) || text.startsWith(w.tr, i));
    if(w) {
      out+=`<button data-word="${w.id}" data-origin="${origin}">${ch(w)}</button>`;
      i+=w.ch.length
    }else{
      out+=esc(text[i]);
      i++
    }
  }
  return `<div class="tokens">${out}</div>`
}
function openWord(id, origin = 'Chinese', nested = false) {
  if(!nested)detailStack = [];
  detailStack.push({id, origin});
  if(demo) {
    state.history = state.history.filter(x => x.id !== id);
    state.history.unshift({id, origin})
  }
  const w = words[id];
  modal(`${detailStack.length > 1 ? btn('← Back to previous word', 'detail-back', 'ghost small'):''}<div class="detailhan">${ch(w)}</div><div class="row spread"><span class="pinyin" style="font-size:18px">${w.py}</span><span class="hsk">HSK ${w.hsk} · sample label</span></div><div class="muted">${traditional ? 'Simplified: ' + w.ch:'Traditional: ' + w.tr}</div><div class="detaildefs">${w.en}</div><div class="eyebrow">IN CONTEXT</div><div class="example">${tokens(w.ex, origin)}<span class="muted">${w.translation}</span></div><div class="toolbar">${btn(demo && state.saved.has(id) ? 'Manage saved word':'＋ Save word', 'save-panel:' + id, 'primary full')}</div>`)
}
function savePanel(id) {
  if(!demo) {
    pendingSave = id;
    return guestGate()
  }
  modal(`<h2>Save ${ch(words[id])}</h2><p class="muted">Select folders for this word.</p>${state.folders.map(f => `<label class="check"><input type="checkbox" name="savefolder" value="${f.id}" ${f.words.includes(id) ? 'checked':''}>${esc(f.name)}</label>`).join('')}<label>New folder (optional)</label><input id="newfolder" class="full" placeholder="Folder name"><label class="check"><input id="addreview" type="checkbox" ${state.review[id] ? 'checked':''}>Add to spaced review</label><p class="muted">Words without a folder appear in Unorganized.</p>${btn('Save changes', 'save-word:' + id, 'primary full')}${state.saved.has(id) ? btn('Remove saved word', 'remove-word:' + id, 'danger ghost full'):''}`)
}
function savedPage() {
  let title = folder === 'all' ? 'All saved words':folder === 'unorganized' ? 'Unorganized':state.folders.find(f => f.id === folder)?.name || 'All saved words';
  let ids = folder === 'all' ? [...state.saved]:folder === 'unorganized' ? [...state.saved].filter(id => !state.folders.some(f => f.words.includes(id))):state.folders.find(f => f.id === folder)?.words || [];
  return heading('Saved Words') + (!demo ? protectedPage():`<div class="toolbar">${btn('All saved words · ' + state.saved.size, 'folder:all', folder === 'all' ? 'primary':'')}${btn('Unorganized', 'folder:unorganized', folder === 'unorganized' ? 'primary':'')}<span style="flex:1"></span>${btn(selecting ? 'Done selecting':'Select folders', 'select-folders')}${btn('＋ New folder', 'new-folder')}</div><div class="grid">${state.folders.map(f => `<button class="card folder ${selectedFolders.has(f.id) ? 'primary':''}" data-action="folder:${f.id}">${icon('folder')} ${selecting ? (selectedFolders.has(f.id) ? '☑':'☐'):''}<strong>${esc(f.name)}</strong><small>${f.words.length} words</small></button>`).join('')}</div>${selecting ? `<div class="toolbar"><span>${selectedFolders.size} selected</span>${btn('Add to review', 'bulk-review')}${btn('Quiz words', 'bulk-quiz')}${btn('Delete folders', 'bulk-delete', 'danger')}</div>`:''}<div class="sectiontitle space"><h2>${esc(title)} <span>· ${ids.length} words</span></h2>${typeof folder === 'number' ? `<div>${btn('Rename', 'rename-folder', 'small')}${btn('Quiz', 'folder-quiz', 'small')}${btn('Delete', 'delete-folder', 'small danger')}</div>`:''}</div>${wordlist([...ids].reverse())}`)
}
function reviewPage() {
  return heading('Spaced Review') + (!demo ? protectedPage():`<div class="card study"><div class="row spread"><div><h2>${dueIds().length} words due for review</h2><p>Overdue words remain available for review.</p></div><div><label for="review-count">Words this time</label><input id="review-count" type="number" min="1" max="${Math.max(1, dueIds().length)}" value="${Math.max(1, dueIds().length)}" style="width:85px"></div></div>${btn(dueIds().length ? 'Start review →':'Review early', 'start-review', 'primary')}</div><div class="toolbar">${btn('＋ Add words or folders', 'add-backlog')}${btn('Manage backlog', 'manage-backlog')}${btn('Completed backlog · ' + state.completed.length, 'completed')}</div><div class="sectiontitle"><h2>Review levels</h2><span>${schedule === 'days' ? 'Calendar days':'Review sessions'}</span></div><div class="levels">${intervals.map((n, i) => `<div class="card level"><small>LEVEL ${i + 1}</small><strong>${Object.values(state.review).filter(x => x.level === i).length}</strong><small>${n} ${schedule}</small></div>`).join('')}</div><div class="notice">Wrong returns to Level 1. Right repeats the current interval. Easy advances a level. Graduation follows a successful final-interval review.</div><label for="review-layout">Flashcard layout</label>${layoutSelect('review-layout')}<div class="stats"><div><strong>${Object.keys(state.review).length}</strong><small>active words</small></div><div><strong>${state.completed.length}</strong><small>completed words</small></div></div>`)
}
function layoutSelect(id) {
  return `<select id="${id}" class="full">${layouts.map((l, i) => `<option value="${i}">${l[0]} → ${l[2].map(x => ({ch:'Chinese', py:'Pinyin', en:'English'}[x])).join(' + ')}</option>`).join('')}</select>`
}
function quizSetup() {
  return heading('Quiz') + `<div class="card wide">${paused && demo ? `<div class="notice row spread">You have a paused quiz. ${btn('Resume', 'resume', 'small primary')}</div>`:''}<div class="form-grid"><div><label for="quiz-source">Choose your vocabulary</label><select id="quiz-source" class="full"><option value="random">Random HSK words</option value="folders" ${demo ? '':'disabled'}>Selected saved folders</option></select><div id="source-options"><label>HSK levels</label><div class="chips">${[1, 2, 3, 4, 5, 6].map(n => `<label class="check"><input type="checkbox" name="hsk" value="${n}" ${n < 4 ? 'checked':''}>${n}</label>`).join('')}</div></div><label for="quiz-length">Number of words</label><select id="quiz-length" class="full">${[10, 20, 30, 50, 'All', 'Custom'].map(n => `<option>${n}</option>`).join('')}</select><input id="custom-length" class="full space" type="number" min="1" placeholder="Custom word count" hidden></div><div><label for="quiz-layout">Flashcard layout</label>${layoutSelect('quiz-layout')}<label for="quiz-script">Character display</label><select id="quiz-script" class="full"><option value="default">Use my preference</option value="simplified">Simplified 简体</option><option value="traditional">Traditional 繁體</option></select><div class="notice">Reveal answers optionally, then grade Wrong, Right, or Easy. Quiz grades never change spaced review levels.</div></div></div><div class="toolbar">${btn('Start quiz ' + icon('arrow'), 'start-quiz', 'primary')}<span class="muted">${demo ? 'Pause and resume within this demo session.':'Guest quizzes are temporary. Refreshing discards progress.'}</span></div><small class="muted">20 sample words available across HSK 1–6. Quiz length is capped to matching words.</small></div>`
}
function quizView() {
  if(quiz.done)return resultsView();
  let w = words[quiz.ids[quiz.index]],
    layout = layouts[quiz.layout],
    character = quiz.script === 'traditional' ? w.tr:quiz.script === 'simplified' ? w.ch:ch(w);
  const field = f => `<div class="${{ch:'han', py:'pinyin', en:'meaning'}[f]}">${f === 'ch' ? character:w[f]}</div>`;
  return heading(quiz.practice ? 'Practice':quiz.review ? 'Spaced Review':'Quiz', 'You can grade without revealing the answer.') + `<div class="flash"><div class="row spread"><span>Card ${quiz.index + 1} of ${quiz.ids.length}</span>${btn(demo && !quiz.review ? 'Pause quiz':'Exit session', 'exit-quiz', 'small ghost')}</div><div class="progress"><div style="width:${quiz.index/quiz.ids.length*100}%"></div></div><div class="card flashcard">${layout[1].map(field).join('')}<div style="width:65%;border-top:1px solid var(--line);margin:12px"></div>${layout[2].map(f => quiz.revealed.includes(f) ? field(f):btn('Reveal ' + ({ch:'Chinese', py:'pinyin', en:'meaning'}[f]), 'reveal:' + f, 'full')).join('')}</div><div class="grades">${btn('↺ Wrong', 'grade:Wrong', 'danger')}${btn('✓ Right', 'grade:Right')}${btn('✧ Easy', 'grade:Easy', 'primary')}</div><p class="muted">${quiz.review && !quiz.practice ? 'Wrong: reset · Right: repeat · Easy: advance':'Scheduled progress stays unchanged.'}</p></div>`
}
function resultsView() {
  const counts = g => quiz.results.filter(r => r.grade === g).length;
  return heading(quiz.review ? 'Review Results':'Quiz Results') + `<div class="card"><div class="row spread"><div><span class="eyebrow">ACCURACY</span><div class="study-count">${Math.round((counts('Right') + counts('Easy'))/quiz.results.length*100)}%</div></div><div class="stats">${['Wrong', 'Right', 'Easy'].map(g => `<div><strong>${counts(g)}</strong><small>${g}</small></div>`).join('')}</div></div><div class="toolbar">${btn('Quiz again', 'again', 'primary')}${btn('Quiz missed', 'missed')}${btn('Save all', 'save-results:all')}${btn('Save missed', 'save-results:missed')}${btn('Done', 'done')}</div><div class="notice">${quiz.review ? 'Submitted review grades are applied to this temporary demo workspace.':'Quiz results do not change your spaced review schedule.'} Completed quiz reports are not retained after you leave.</div>${quiz.results.map(r => `<div class="row">${row(words[r.id])}<span class="resultgrade">${r.grade}</span></div>`).join('')}</div>`
}
function scanPage() {
  return heading('Scan') + `<div class="wide"><div class="scanbox">${imageURL ? `<img class="scanpreview" src="${imageURL}" alt="Selected image preview">`:icon('scan')}<p class="muted">Upload an image or take a photo.</p><div class="toolbar" style="justify-content:center">${btn('Choose image', 'upload', 'primary')}${btn('Take photo', 'camera')}</div><input type="file" id="upload" accept="image/*" hidden><input type="file" id="camera" accept="image/*" capture="environment" hidden></div><div class="notice">Image preview is available. OCR will be connected in a backend slice. For now, try the sample passage or type your own Chinese below.</div><div class="sectiontitle"><h2>Recognized text</h2>${btn('Use sample passage', 'sample-scan', 'small')}</div><textarea id="scan-text" class="full" placeholder="Paste or correct Chinese text here…">${esc(scanText)}</textarea><div class="toolbar">${btn('Look up words', 'segment', 'primary')}${btn('Clear', 'clear-scan', 'ghost')}</div><div id="scan-result">${scanText ? `<div class="card">${tokens(scanText, 'Scan')}</div>`:''}</div></div>`
}
function historyPage() {
  return heading('Search History', 'Opened entries, most recent first.') + (!demo ? protectedPage():`<div class="toolbar"><input id="history-search" placeholder="Search your history" aria-label="Search history" value="${esc(historyQuery)}"><select id="history-origin" aria-label="Lookup origin">${['All', 'Chinese', 'Pinyin', 'English', 'Scan'].map(s => `<option ${historyOrigin === s ? 'selected':''}>${s}</option>`).join('')}</select>${btn('Clear history', 'clear-history', 'danger small')}</div><div id="history-list">${historyList()}</div>`)
}
function historyList() {
  let entries = state.history.filter(x => (historyOrigin === 'All' || x.origin === historyOrigin) && normalize(words[x.id].ch + words[x.id].py + words[x.id].en).includes(normalize(historyQuery)));
  return `<div class="card wordlist">${entries.map(x => `<div class="row">${row(words[x.id], x.origin)}${btn('×', 'delete-history:' + x.id, 'ghost small')}</div>`).join('') || '<div class="empty">No history yet. Only opened words appear here.</div>'}</div>`
}
function settingsPage() {
  return heading('Settings & Account') + `<div class="wide card"><h2>Language & display</h2><label for="script">Chinese characters</label><select id="script" class="full"><option value="simplified" ${traditional ? '':'selected'}>Simplified 简体中文</option><option value="traditional" ${traditional ? 'selected':''}>Traditional 繁體中文</option></select><p class="muted">Character display does not change saved words or progress.</p><h2 class="space">Spaced review</h2><label for="schedule">Schedule by</label><select id="schedule" class="full"><option value="days" ${schedule === 'days' ? 'selected':''}>Calendar days</option><option value="sessions" ${schedule === 'sessions' ? 'selected':''}>Complete review sessions</option></select><label>Intervals, from Level 1 to Level 6</label><div class="intervals">${intervals.map((v, i) => `<input type="number" min="1" max="365" value="${v}" name="interval" aria-label="Level ${i + 1} interval">`).join('')}</div><p class="muted">Changing intervals preserves levels and recalculates future reviews. Session-mode completion requires a full pass through the current backlog.</p>${btn('Save preferences', 'save-settings', 'primary')}<h2 class="space">Account</h2><div class="notice">Authentication is a frontend preview. No passwords or recovery details are saved or transmitted.</div>${demo ? `<p>Demo learner · temporary workspace</p><div class="toolbar">${btn('Manage credentials', 'credentials')}${btn('Leave demo', 'logout')}${btn('Delete account', 'delete-account', 'danger')}</div>`:`<div class="toolbar">${btn('Sign in', 'auth-login')}${btn('Create account', 'auth-signup')}${btn('Forgot password?', 'auth-recovery', 'ghost')}</div>`}</div>`
}
function addReview(ids) {
  ids.forEach(id => {
    state.saved.add(id);
    if(!state.review[id]) {
      state.review[id] = {level:0, due:0};
      state.completed = state.completed.filter(x => x !== id)
    }
  })
}
function startQuiz(ids, review = false, practice = false, layout = 0, script = 'default') {
  if(!ids.length)return toast('Choose at least one matching word.');
  quiz = {ids:[...new Set(ids)], index:0, results:[], revealed:[], review, practice, layout, script, cohort:review ? Object.keys(state.review).map(Number):[]};
  close();
  render()
}
function auth(type) {
  modal(accountForm(type) + `<div class="toolbar">${btn('Open demo', 'demo', 'ghost')}${btn(type === 'login' ? 'Create account':'Sign in', type === 'login' ? 'auth-signup':'auth-login', 'ghost small')}${type === 'login' ? btn('Forgot password?', 'auth-recovery', 'ghost small'):''}</div>`);
  $('#auth-form').onsubmit = e => {
    e.preventDefault();
    e.target.reset();
    toast('Preview complete. Account service is not connected.')
  }
}
function bindInputs() {
  if($('#search'))$('#search').oninput = e => {
    query = e.target.value;
    $('#results').innerHTML = searchResults();
    $('#results-title').textContent = query ? 'Search results':'Sample words'
  };
  if($('#mode'))$('#mode').onchange = e => {
    mode = e.target.value;
    $('#results').innerHTML = searchResults()
  };
  if($('#quiz-source'))$('#quiz-source').onchange = e => {
    $('#source-options').innerHTML = e.target.value === 'folders' ? `<label>Choose one or more folders</label>${state.folders.map(f => `<label class="check"><input type="checkbox" name="quizfolder" value="${f.id}">${esc(f.name)}</label>`).join('')}`:`<label>HSK levels</label><div class="chips">${[1, 2, 3, 4, 5, 6].map(n => `<label class="check"><input type="checkbox" name="hsk" value="${n}" checked>${n}</label>`).join('')}</div>`
  };
  if($('#quiz-length'))$('#quiz-length').onchange = e => $('#custom-length').hidden = e.target.value !== 'Custom';
  if($('#scan-text'))$('#scan-text').oninput = e => scanText = e.target.value;
  ['upload', 'camera'].forEach(id => {
    if($('#' + id))$('#' + id).onchange = e => {
      const f = e.target.files[0];
      if(!f)return;
      if(!f.type.startsWith('image/'))return toast('Please choose an image.');
      if(imageURL)URL.revokeObjectURL(imageURL);
      imageURL = URL.createObjectURL(f);
      render();
      toast('Image ready. OCR is not connected yet.')
    }
  });
  if($('#history-search'))$('#history-search').oninput = e => {
    historyQuery = e.target.value;
    $('#history-list').innerHTML = historyList()
  };
  if($('#history-origin'))$('#history-origin').onchange = e => {
    historyOrigin = e.target.value;
    $('#history-list').innerHTML = historyList()
  }
}
function askName(title, action, value = '') {
  modal(`<h2>${title}</h2><label for="folder-name">Folder name</label><input id="folder-name" maxlength="70" class="full" value="${esc(value)}"><div class="toolbar">${btn('Save', action, 'primary')}${btn('Cancel', 'close')}</div>`)
}
function confirmBox(title, text, action) {
  modal(`<h2>${title}</h2><p class="muted">${text}</p><div class="toolbar">${btn('Confirm', action, 'primary')}${btn('Cancel', 'close')}</div>`)
}
async function action(a) {
  const [key, v] = a.split(':');
  switch(key) {
    case'menu':
      $('.sidebar').classList.toggle('open');
      break;
    case'close':
      close();
      break;
    case'account':
      page = 'settings';
      render();
      break;
    case'demo':
      demo = true;
      close();
      render();
      toast('Demo workspace opened. Changes last until refresh.');
      if(pendingSave !== null) {
        let id = pendingSave;
        pendingSave = null;
        savePanel(id)
      }
      break;
    case'auth-login':
      auth('login');
      break;
    case'auth-signup':
      auth('signup');
      break;
    case'auth-recovery':
      auth('recovery');
      break;
    case'detail-back':
      detailStack.pop();
      {
        let prev = detailStack.pop();
        openWord(prev.id, prev.origin, true)
      }
      break;
    case'save-panel':
      savePanel( + v);
      break;
    case'save-word':
      {
        let id = + v;
        state.saved.add(id);
        let chosen = [...document.querySelectorAll('[name=savefolder]:checked')].map(x => + x.value);
        state.folders.forEach(f => {
          f.words = f.words.filter(x => x !== id);
          if(chosen.includes(f.id))f.words.push(id)
        });
        let name = $('#newfolder').value.trim();
        if(name)state.folders.push({id:Date.now(), name, words:[id]});
        if($('#addreview').checked)addReview([id]);else delete state.review[id];
        close();
        render();
        toast('Word saved in this demo.');
        break
      }
    case'remove-word':
      state.saved.delete( + v);
      state.folders.forEach(f => f.words = f.words.filter(x => x !== + v));
      close();
      render();
      toast('Removed from saved words. Review status kept separately.');
      break;
    case'folder':
      {
        let id = isNaN( + v) ? v: + v;
        if(selecting && typeof id === 'number') {
          selectedFolders.has(id) ? selectedFolders.delete(id):selectedFolders.add(id)
        }else folder = id;
        render();
        break
      }
    case'select-folders':
      selecting = !selecting;
      selectedFolders.clear();
      render();
      break;
    case'new-folder':
      askName('New folder', 'create-folder');
      break;
    case'create-folder':
    case'rename-commit':
      {
        let name = $('#folder-name').value.trim();
        if(!name)return toast('Enter a folder name.');
        if(key === 'create-folder')state.folders.push({id:Date.now(), name, words:[]});else state.folders.find(f => f.id === folder).name = name;
        close();
        render();
        break
      }
    case'rename-folder':
      askName('Rename folder', 'rename-commit', state.folders.find(f => f.id === folder).name);
      break;
    case'delete-folder':
      selectedFolders = new Set([folder]);
    case'bulk-delete':
      if(!selectedFolders.size)return toast('Select a folder first.');
      confirmBox('Delete selected folders?', 'The words stay saved. Words with no other folder move to Unorganized.', 'confirm-folders');
      break;
    case'confirm-folders':
      state.folders = state.folders.filter(f => !selectedFolders.has(f.id));
      selectedFolders.clear();
      folder = 'all';
      close();
      render();
      break;
    case'bulk-review':
    case'bulk-quiz':
    case'folder-quiz':
      {
        let fs = key === 'folder-quiz' ? [folder]:[...selectedFolders];
        let ids = [...new Set(state.folders.filter(f => fs.includes(f.id)).flatMap(f => f.words))];
        if(!ids.length)return toast('Choose a folder containing words.');
        if(key === 'bulk-review') {
          addReview(ids);
          render();
          toast('Words added. Existing review levels were preserved.')
        }else{
          page = 'quiz';
          startQuiz(ids)
        }
        break
      }
    case'add-backlog':
      modal(`<h2>Add to review</h2><label>Saved words</label>${[...state.saved].map(id => `<label class="check"><input name="backlog-word" value="${id}" type="checkbox" ${state.review[id] ? 'disabled':''}>${ch(words[id])} · ${words[id].en} ${state.review[id] ? '(already active)':''}</label>`).join('')}<label>Or whole folders</label>${state.folders.map(f => `<label class="check"><input name="backlog-folder" value="${f.id}" type="checkbox">${esc(f.name)}</label>`).join('')}${btn('Add selected', 'commit-backlog', 'primary full space')}`);
      break;
    case'commit-backlog':
      {
        let ids = [...document.querySelectorAll('[name=backlog-word]:checked')].map(x => + x.value), fs = [...document.querySelectorAll('[name=backlog-folder]:checked')].map(x => + x.value);
        ids.push(...state.folders.filter(f => fs.includes(f.id)).flatMap(f => f.words));
        addReview(ids);
        close();
        render();
        toast('Review backlog updated.');
        break
      }
    case'manage-backlog':
      modal(`<h2>Active backlog</h2>${intervals.map((_, i) => `<h3>Level ${i + 1}</h3>${Object.keys(state.review).filter(id => state.review[id].level === i).map(id => `<div class="row spread"><span>${ch(words[id])}</span>${btn('Remove', 'remove-backlog:' + id, 'small danger')}</div>`).join('') || '<p class="muted">No words at this level.</p>'}`).join('')}`);
      break;
    case'remove-backlog':
      delete state.review[v];
      render();
      action('manage-backlog');
      break;
    case'completed':
      modal(`<h2>Completed backlog</h2>${state.completed.map(id => `<div class="row">${row(words[id])}${btn('Re-add', 'readd:' + id, 'small')}</div>`).join('') || '<p class="muted">No completed words yet.</p>'}`);
      break;
    case'readd':
      addReview([ + v]);
      close();
      render();
      break;
    case'start-review':
      if(!demo)return guestGate();
      activeLayout = + ($('#review-layout')?.value || 0);
      if(!dueIds().length) {
        if(!Object.keys(state.review).length)return toast('Add some words to your backlog first.');
        confirmBox('No words due', 'Use Quiz for practice, or continue without changing review levels.', 'early-review');
        break
      }
      {
        let count = + ($('#review-count')?.value || dueIds().length);
        if(!Number.isInteger(count) || count < 1)return toast('Choose at least one word.');
        page = 'review';
        startQuiz(dueIds().slice(0, count), true, false, activeLayout)
      }
      break;
    case'early-review':
      startQuiz(Object.keys(state.review).map(Number), true, true, activeLayout);
      break;
    case'start-quiz':
      {
        let ids;
        if($('#quiz-source').value === 'folders') {
          let fs = [...document.querySelectorAll('[name=quizfolder]:checked')].map(x => + x.value);
          ids = [...new Set(state.folders.filter(f => fs.includes(f.id)).flatMap(f => f.words))]
        }else{
          let levels = [...document.querySelectorAll('[name=hsk]:checked')].map(x => + x.value);
          ids = words.filter(w => levels.includes(w.hsk)).map(w => w.id)
        }
        let n = $('#quiz-length').value;
        n = n === 'All' ? ids.length:n === 'Custom' ? + $('#custom-length').value: + n;
        if(!Number.isInteger(n) || n < 1)return toast('Enter a valid quiz length.');
        for(let i = ids.length - 1;i > 0;i--) {
          let j = Math.floor(Math.random()*(i + 1));
          [ids[i], ids[j]] = [ids[j], ids[i]]
        }
        startQuiz(ids.slice(0, n), false, false, + $('#quiz-layout').value, $('#quiz-script').value);
        break
      }
    case'reveal':
      quiz.revealed.push(v);
      render();
      break;
    case'grade':
      {
        let id = quiz.ids[quiz.index];
        quiz.results.push({id, grade:v});
        if(quiz.review && !quiz.practice) {
          let r = state.review[id];
          if(v === 'Wrong')r.level = 0;else if(v === 'Easy') {
            if(r.level === 5) {
              state.completed.push(id);
              delete state.review[id]
            }else r.level++
          }
          if(state.review[id])r.due = schedule === 'days' ? Date.now() + intervals[r.level]*86400000:sessionNumber + intervals[r.level] + 1
        }
        quiz.index++;
        quiz.revealed = [];
        if(quiz.index === quiz.ids.length) {
          quiz.done = true;
          if(quiz.review && !quiz.practice && quiz.cohort.every(id => quiz.results.some(r => r.id === id)))sessionNumber++
        }
        render();
        break
      }
    case'exit-quiz':
      if(demo && !quiz.review)paused = quiz;
      quiz = null;
      render();
      break;
    case'resume':
      quiz = paused;
      paused = null;
      render();
      break;
    case'again':
      startQuiz(quiz.ids);
      break;
    case'missed':
      {
        let ids = quiz.results.filter(x => x.grade === 'Wrong').map(x => x.id);
        if(!ids.length)return toast('No missed words.');
        startQuiz(ids);
        break
      }
    case'done':
      quiz = null;
      render();
      break;
    case'save-results':
      if(!demo)return guestGate();
      {
        let ids = quiz.results.filter(x => v === 'all' || x.grade === 'Wrong').map(x => x.id);
        if(!ids.length)return toast('No missed words to save.');
        storeResultIds = ids;
        askName('Save quiz words', 'commit-results', v === 'all' ? 'Quiz collection':'Words to revisit');
        break
      }
    case'commit-results':
      {
        let name = $('#folder-name').value.trim();
        if(!name)return toast('Enter a folder name.');
        state.folders.push({id:Date.now(), name, words:storeResultIds});
        storeResultIds.forEach(id => state.saved.add(id));
        close();
        toast('Quiz words saved to a new folder.');
        break
      }
    case'upload':
    case'camera':
      $('#' + key).click();
      break;
    case'sample-scan':
      scanText = '今天我们一起去学校。我们喜欢学习中文。';
      render();
      break;
    case'segment':
      scanText = $('#scan-text').value;
      $('#scan-result').innerHTML = `<div class="card">${tokens(scanText, 'Scan')}</div>`;
      break;
    case'clear-scan':
      scanText = '';
      if(imageURL)URL.revokeObjectURL(imageURL);
      imageURL = '';
      render();
      break;
    case'delete-history':
      state.history = state.history.filter(x => x.id !== + v);
      render();
      break;
    case'clear-history':
      confirmBox('Clear your history?', 'Your saved words and review progress will remain.', 'confirm-history');
      break;
    case'confirm-history':
      state.history = [];
      close();
      render();
      break;
    case'save-settings':
      {
        let values = [...document.querySelectorAll('[name=interval]')].map(x => + x.value);
        if(values.some(x => !Number.isInteger(x) || x < 1 || x > 365))return toast('Use whole-number intervals between 1 and 365.');
        traditional = $('#script').value === 'traditional';
        let newSchedule = $('#schedule').value, changed = newSchedule !== schedule || values.some((x, i) => x !== intervals[i]);
        schedule = newSchedule;
        intervals = values;
        if(changed)Object.values(state.review).forEach(r => r.due = schedule === 'days' ? Date.now() + values[r.level]*86400000:sessionNumber + values[r.level]);
        render();
        toast('Preferences updated for this session.');
        break
      }
    case'credentials':
      modal('<h2>Manage credentials</h2><div class="notice">Preview only. No credentials will be changed.</div><label>Username</label><input class="full" value="demo_learner"><label>New password</label><input class="full" type="password" placeholder="Preview password">' + optionalRecoveryEmail() + btn('Preview update', 'credential-preview', 'primary full space'));
      break;
    case'credential-preview':
      close();
      toast('Account updates will be connected in the auth slice.');
      break;
    case'logout':
      demo = false;
      state = freshState();
      paused = null;
      quiz = null;
      close();
      render();
      break;
    case'delete-account':
      modal(`<h2>Delete your account?</h2><p class="muted">The final account flow will permanently remove vocabulary, folders, reviews, history, and paused quizzes. Here, this only resets the demo.</p><label>Type DELETE to confirm</label><input id="delete-confirm" class="full">${btn('Delete demo data', 'confirm-account', 'danger full space')}`);
      break;
    case'confirm-account':
      if($('#delete-confirm').value !== 'DELETE')return toast('Type DELETE to confirm.');
      action('logout');
      toast('Demo data cleared.');
      break
  }
}
let storeResultIds = [];
document.addEventListener('click', e => {
  let t = e.target.closest('button');
  if(!t)return;
  if(t.dataset.nav) {
    let dest = t.dataset.nav;
    if(quiz && !quiz.done && demo && !quiz.review)paused = quiz;
    quiz = null;
    page = dest;
    close();
    render();
    return
  }
  if(t.dataset.word !== undefined)return openWord( + t.dataset.word, t.dataset.origin || 'Chinese', !!$('#modal').children.length);
  if(t.dataset.query !== undefined) {
    query = t.dataset.query;
    render();
    $('#search').focus();
    return
  }
  if(t.dataset.action)action(t.dataset.action)
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape') {
    close();
    $('.sidebar')?.classList.remove('open')
  }
  if(e.key === 'Tab' && $('#modal').children.length) {
    let els = [...$('#modal').querySelectorAll('button,input,select,textarea')].filter(x => !x.disabled && !x.hidden);
    let first = els[0], last = els.at( - 1);
    if(e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus()
    }else if(!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus()
    }
  }
});
render();
