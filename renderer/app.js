'use strict';
/* Orbit desktop, renderer. Données : même format que l'app mobile (v2). */
const api = window.orbit;
const $ = (s) => document.querySelector(s);
const ACC = ['#8B5CF6', '#22D3EE', '#F472B6', '#34D399', '#FBBF24', '#FB7185', '#60A5FA', '#A3E635'];
const DAY = 86400000;
const PREFIX = 'orbit-img://';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = (n) => String(n).padStart(2, '0');
const fmt = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
const todayIdx = () => (new Date().getDay() + 6) % 7;
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const imgSrc = (ref) => (typeof ref === 'string' && ref.startsWith(PREFIX) ? 'orbit-file://img/' + encodeURIComponent(ref.slice(PREFIX.length)) : ref);
function tagColor(t) { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return ACC[h % ACC.length]; }
function moveItem(a, f, t) { const [x] = a.splice(f, 1); a.splice(t, 0, x); }

const P = {
  back: '<polyline points="15 18 9 12 15 6"/>', next: '<polyline points="9 18 15 12 9 6"/>',
  settings: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>', x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  cash: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  board: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.5" transform="rotate(-20 12 12)"/>',
  arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  barchart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  spend: '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>',
  today: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
  cloudOff: '<path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3"/><line x1="1" y1="1" x2="23" y2="23"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
};
const ic = (n, s = 18, w = 2) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]}</svg>`;
const THEMES = {
  night: { bg: '#0A0A14', s1: '#12121F', s2: '#1A1A2B', s3: '#22223A', bd: '#25253A', tx: '#EEEEF8', mu: '#8A8AA6', fa: '#4B4B66', on: '#0A0A14', scheme: 'dark' },
  ink: { bg: '#000000', s1: '#0C0C0C', s2: '#161616', s3: '#1F1F1F', bd: '#242424', tx: '#F5F5F5', mu: '#8C8C8C', fa: '#525252', on: '#000000', scheme: 'dark' },
  light: { bg: '#F5F5FA', s1: '#FFFFFF', s2: '#ECECF4', s3: '#E1E1EC', bd: '#DCDCE8', tx: '#14141F', mu: '#5F5F73', fa: '#9A9AAE', on: '#FFFFFF', scheme: 'light' },
};
const THEME_NAMES = ['night', 'ink', 'light'];
function applyTheme(name) {
  const th = THEMES[name] || THEMES.night;
  const r = document.documentElement.style;
  r.setProperty('--bg', th.bg); r.setProperty('--s1', th.s1); r.setProperty('--s2', th.s2); r.setProperty('--s3', th.s3);
  r.setProperty('--bd', th.bd); r.setProperty('--tx', th.tx); r.setProperty('--mu', th.mu); r.setProperty('--fa', th.fa);
  r.setProperty('--on', th.on); r.style = r.style;
  document.documentElement.style.colorScheme = th.scheme;
  document.body.classList.toggle('lighttheme', name === 'light');
}

const KIND_IC = { board: 'board', timetable: 'calendar', commissions: 'cash', payments: 'card', budget: 'wallet', chart: 'barchart' };
const MONEY_KINDS = ['commissions', 'payments', 'budget'];
const isMoneyKind = (k) => MONEY_KINDS.includes(k);
const isBudgetKind = (k) => k === 'budget';
const moneySign = (k) => (k === 'commissions' ? 1 : -1);

const L = {
  en: {
    'tabs': 'Tabs', 'tabs.new': 'New tab', 'tabs.edit': 'Edit tab', 'tabs.name': 'Tab name', 'tabs.color': 'Color', 'tabs.type': 'Type', 'tabs.hours': 'Visible hours', 'tabs.delete': 'Delete tab', 'tabs.deleteTitle': 'Delete this tab?', 'tabs.deleteMsg': 'Its {n} page(s) and their images will be permanently deleted.', 'tabs.nameErr': 'Enter a tab name',
    'kind.board': 'Board', 'kind.timetable': 'Timetable', 'kind.commissions': 'Commissions', 'kd.board': 'Cards with checklists, tags and deadlines', 'kd.timetable': 'Weekly grid of recurring slots', 'kd.commissions': 'Board with client, price and payment',
    'f.all': 'All', 'f.todo': 'To do', 'f.done': 'Done', 'e.all': 'No pages yet. Press N or click New page.', 'e.todo': 'Everything here is done.', 'e.done': 'Nothing finished yet.', 'e.search': 'No results for "{q}".',
    'dragHint': 'Drag cards to reorder', 'search': 'Search…', 'newPage': 'New page',
    'cancel': 'Cancel', 'save': 'Save', 'create': 'Create', 'delete': 'Delete', 'add': 'Add', 'close': 'Close',
    'p.newIn': 'New page in {tab}', 'p.edit': 'Edit page', 'p.title': 'Title', 'p.desc': 'Description, notes, links…', 'p.markDone': 'Mark as done', 'p.images': 'Images', 'p.dropImages': 'Drop images here, paste with Ctrl+V, or', 'p.browse': 'browse', 'p.delTitle': 'Delete this page?', 'p.delMsg': '"{t}" and its images will be deleted.', 'p.created': 'Created {d}', 'p.updated': ', edited {d}', 'p.done': 'Done', 'p.todo': 'To do', 'p.clickTodo': 'Click to mark as to do', 'p.clickDone': 'Click to mark as done', 'p.description': 'Description', 'p.checklist': 'Checklist', 'p.addItem': 'Add an item and press Enter', 'p.tags': 'Tags', 'p.addTag': 'Add a tag and press Enter', 'p.deadline': 'Deadline', 'p.client': 'Client', 'p.clientPh': 'Client name', 'p.price': 'Price', 'p.paid': 'Paid', 'p.unpaid': 'Unpaid', 'p.markPaid': 'Mark as paid', 'p.day': 'Day', 'p.start': 'Start', 'p.end': 'End', 'p.color': 'Color', 'p.endErr': 'End time must be after start time', 'p.titleErr': 'Enter a title', 'p.newSlot': 'New slot', 'p.editSlot': 'Edit slot',
    'due.today': 'Due today', 'due.tomorrow': 'Due tomorrow', 'due.in': 'Due in {n}d', 'due.late': 'Overdue {n}d', 'm.paid': '{v} paid', 'm.pending': '{v} pending', 'v.week': 'Week', 'v.day': 'Day',
    's.title': 'Settings', 's.lang': 'Language', 's.sync': 'Backup and phone sync', 's.syncHint': 'Export on one device, import the file on the other. Works with backups from the Orbit phone app.', 's.export': 'Export backup', 's.exportHint': 'All tabs, pages and images in one .json file.', 's.import': 'Import backup', 's.importHint': 'Replaces everything currently in Orbit.', 's.importTitle': 'Replace all data?', 's.importMsg': 'Current tabs, pages and images will be replaced by the backup.', 's.replace': 'Replace', 's.imported': 'Backup imported', 's.exported': 'Backup saved', 's.invalid': 'This file is not an Orbit backup.', 's.folder': 'Open data folder', 's.folderHint': 'Where Orbit keeps your data on this PC.', 's.keys': 'Keyboard shortcuts',
    's.auto': 'Automatic backups', 's.autoHint': 'Orbit keeps a copy of your data every day (last 10). Click one to restore it.', 's.autoNone': 'No automatic backup yet.', 's.restoreTitle': 'Restore this backup?', 's.restoreMsg': '{tabs} tab(s) and {pages} page(s) from {date}. Your current data will be replaced (a copy is kept).', 's.restore': 'Restore', 's.restored': 'Backup restored', 's.pages': '{pages} pages',
    'k.new': 'New page or slot', 'k.search': 'Search', 'k.tabs': 'Switch tab', 'k.esc': 'Close panel or window', 'k.save': 'Save in editor',
    'account.title': 'Account', 'account.notConfigured': 'Account sync is not set up in this version yet.',
    'account.pitch': 'Sync Orbit between your PC and phone', 'account.pitchSub': 'Your data stays available offline and syncs whenever you are connected.',
    'account.signIn': 'Sign in', 'account.signUp': 'Create account', 'account.email': 'Email', 'account.password': 'Password', 'account.confirm': 'Confirm password',
    'account.forgot': 'Forgot password?', 'account.resetSent': 'Password reset email sent to {email}.', 'account.mismatch': 'Passwords do not match.', 'account.needEmail': 'Enter your email first.',
    'account.internet': 'Requires an internet connection.', 'account.signedInAs': 'Signed in as', 'account.syncNow': 'Sync now', 'account.syncing': 'Syncing…',
    'account.synced': 'Synced {time}', 'account.never': 'Not synced yet', 'account.offline': 'Offline. Orbit will sync when you are back online.', 'account.errorStatus': 'Sync failed: {msg}',
    'account.auto': 'Changes sync automatically on all your devices signed in to this account.', 'account.signOut': 'Sign out', 'account.signOutTitle': 'Sign out?',
    'account.signOutMsg': 'Your data stays on this PC but will stop syncing.', 'account.notSignedIn': 'Not signed in', 'account.offlineOk': 'Everything else in Orbit works offline.',
    'time.now': 'just now', 'time.min': '{n} min ago', 'time.h': '{n} h ago', 'time.d': '{n} d ago',
    'err.NETWORK': 'No internet connection.', 'err.EMAIL_EXISTS': 'An account already exists with this email.', 'err.EMAIL_NOT_FOUND': 'Wrong email or password.', 'err.INVALID_PASSWORD': 'Wrong email or password.', 'err.INVALID_LOGIN_CREDENTIALS': 'Wrong email or password.',
    'err.WEAK_PASSWORD': 'Password must be at least 6 characters.', 'err.INVALID_EMAIL': 'Invalid email address.', 'err.MISSING_PASSWORD': 'Enter a password.', 'err.TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many attempts, try again later.',
    'err.OPERATION_NOT_ALLOWED': 'Email sign-in is disabled in Firebase.', 'err.PERMISSION_DENIED': 'Access denied by the database rules.', 'err.NOT_FOUND': 'The database has not been created yet.',
    'err.NOT_CONFIGURED': 'Account sync is not set up.', 'err.USER_DISABLED': 'This account is disabled.', 'err.UNKNOWN': 'Something went wrong ({code}).',
    'update.title': 'An update is available', 'update.body': 'Orbit {v} is ready. It downloads, installs and restarts on its own, and keeps all your data.', 'update.later': 'Got it', 'update.now': 'Update',
    'update.downloading': 'Downloading… {p}%', 'update.installing': 'Installing…', 'update.section': 'Updates', 'update.check': 'Check for updates', 'update.upToDate': 'Orbit is up to date.',
    'update.failed': 'Could not check for updates. Are you online?', 'update.version': 'Version {v}', 'update.dev': 'Updates only work in the installed app.',
    'kind.payments': 'Payments', 'kind.chart': 'Charts', 'kd.payments': 'What you owe: who, how much, paid or not', 'kd.chart': 'Charts from another tab or your own numbers',
    'p.creditor': 'Owed to', 'p.creditorPh': 'Person or company', 'p.amount': 'Amount', 'p.markRepaid': 'Mark as repaid', 'p.repaid': 'Repaid', 'p.toPay': 'To pay',
    'money.repaid': '{v} repaid', 'money.due': '{v} to pay',
    'chart.type': 'Chart type', 'chart.bar': 'Bars', 'chart.line': 'Line', 'chart.donut': 'Ring', 'chart.source': 'Data', 'chart.manual': 'My own values', 'chart.tab': 'From a tab',
    'chart.pickTab': 'Tab', 'chart.metric': 'What to show', 'chart.addPoint': 'Add a value', 'chart.label': 'Label', 'chart.value': 'Value', 'chart.noData': 'No data yet',
    'metric.money.status': 'Paid vs unpaid', 'metric.money.month': 'Amount per month', 'metric.money.client': 'Amount per person', 'metric.pages.status': 'Done vs to do', 'metric.pages.tag': 'Pages per tag',
    'profile.title': 'Profile', 'profile.namePh': 'Name shown in Orbit', 'profile.change': 'Change photo', 'profile.remove': 'Remove photo', 'profile.hello': 'Hi {name}',
    'kind.expenses': 'Spending', 'kd.expenses': 'What you spend: what, how much, when',
    'p.payee': 'Paid to', 'p.payeePh': 'Shop, site, person', 'p.spent': 'Spent', 'p.toSpend': 'Planned', 'p.markSpent': 'Mark as paid',
    'money.spent': '{v} spent', 'money.planned': '{v} planned',
    'news.title': "What's new", 'news.build': 'Build {b}', 'news.see': "What's new", 'theme.title': 'Theme', 'theme.night': 'Night', 'theme.ink': 'Ink', 'theme.light': 'Light',
    'chart.all': 'All money tabs', 'flow.in': 'Money in', 'flow.out': 'Money out', 'flow.balance': 'Balance',
    'metric.flow.inout': 'Money in and out', 'metric.flow.balance': 'Money left over time', 'metric.budget.spentMonth': 'Spending per period', 'p.addSpending': 'Add a payment', 'p.amount2': 'Amount', 'metric.flow.month': 'Net per period', 'metric.flow.tab': 'Total per tab',
    'search.global': 'All tabs', 'search.none': 'Nothing found for "{q}"',
    'overview.title': 'Today', 'overview.next': 'Coming up', 'overview.deadlines': 'Deadlines this week', 'overview.money': 'Money',
    'overview.empty': 'Nothing planned. Enjoy.', 'overview.in': 'in {v}', 'overview.now': 'now', 'overview.earned': 'To receive', 'overview.owed': 'To pay',
    'p.duplicate': 'Duplicate', 'p.copy': '{title} (copy)', 'p.move': 'Move to…', 'p.moved': 'Moved to {tab}', 'p.noTarget': 'No other tab of this type',
    'tpl.save': 'Save as template', 'tpl.saved': 'Template saved', 'tpl.use': 'Templates',
    'kind.budget': 'Budgets', 'kd.budget': 'A budget per item, and what is left',
    'p.budget': 'Budget', 'p.spentSoFar': 'Spent so far', 'p.remaining': 'Left', 'p.over': 'Over by {v}',
    'budget.total': '{v} budget', 'budget.spent': '{v} spent', 'budget.left': '{v} left',
    'metric.budget.remaining': 'Left per budget', 'metric.budget.split': 'Spent vs left',
    'chart.range': 'Period', 'range.12m': '12 months', 'range.6m': '6 months', 'range.30d': '30 days', 'range.7d': '7 days',
    'days.short': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'days.long': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  },
  fr: {
    'tabs': 'Onglets', 'tabs.new': 'Nouvel onglet', 'tabs.edit': "Modifier l'onglet", 'tabs.name': "Nom de l'onglet", 'tabs.color': 'Couleur', 'tabs.type': 'Type', 'tabs.hours': 'Heures affichées', 'tabs.delete': "Supprimer l'onglet", 'tabs.deleteTitle': "Supprimer l'onglet ?", 'tabs.deleteMsg': 'Ses {n} page(s) et leurs images seront supprimées définitivement.', 'tabs.nameErr': 'Entrez un nom',
    'kind.board': 'Tableau', 'kind.timetable': 'Emploi du temps', 'kind.commissions': 'Commissions', 'kd.board': 'Cartes avec checklists, tags et deadlines', 'kd.timetable': 'Grille hebdomadaire de créneaux', 'kd.commissions': 'Tableau avec client, prix et paiement',
    'f.all': 'Tout', 'f.todo': 'À faire', 'f.done': 'Fait', 'e.all': 'Aucune page. Appuyez sur N ou cliquez sur Nouvelle page.', 'e.todo': 'Tout est fait ici.', 'e.done': 'Rien de terminé pour le moment.', 'e.search': 'Aucun résultat pour « {q} ».',
    'dragHint': 'Glissez les cartes pour réorganiser', 'search': 'Rechercher…', 'newPage': 'Nouvelle page',
    'cancel': 'Annuler', 'save': 'Enregistrer', 'create': 'Créer', 'delete': 'Supprimer', 'add': 'Ajouter', 'close': 'Fermer',
    'p.newIn': 'Nouvelle page dans {tab}', 'p.edit': 'Modifier la page', 'p.title': 'Titre', 'p.desc': 'Description, notes, liens…', 'p.markDone': 'Marquer comme fait', 'p.images': 'Images', 'p.dropImages': 'Déposez des images ici, collez avec Ctrl+V, ou', 'p.browse': 'parcourir', 'p.delTitle': 'Supprimer la page ?', 'p.delMsg': '« {t} » et ses images seront supprimées.', 'p.created': 'Créée le {d}', 'p.updated': ', modifiée le {d}', 'p.done': 'Terminé', 'p.todo': 'À faire', 'p.clickTodo': 'Cliquez pour remettre à faire', 'p.clickDone': 'Cliquez pour marquer comme fait', 'p.description': 'Description', 'p.checklist': 'Checklist', 'p.addItem': 'Ajoutez un élément puis Entrée', 'p.tags': 'Tags', 'p.addTag': 'Ajoutez un tag puis Entrée', 'p.deadline': 'Deadline', 'p.client': 'Client', 'p.clientPh': 'Nom du client', 'p.price': 'Prix', 'p.paid': 'Payé', 'p.unpaid': 'Non payé', 'p.markPaid': 'Marquer comme payé', 'p.day': 'Jour', 'p.start': 'Début', 'p.end': 'Fin', 'p.color': 'Couleur', 'p.endErr': "L'heure de fin doit être après le début", 'p.titleErr': 'Entrez un titre', 'p.newSlot': 'Nouveau créneau', 'p.editSlot': 'Modifier le créneau',
    'due.today': "Pour aujourd'hui", 'due.tomorrow': 'Pour demain', 'due.in': 'Dans {n} j', 'due.late': 'En retard de {n} j', 'm.paid': '{v} payé', 'm.pending': '{v} en attente', 'v.week': 'Semaine', 'v.day': 'Jour',
    's.title': 'Réglages', 's.lang': 'Langue', 's.sync': 'Sauvegarde et synchro téléphone', 's.syncHint': "Exportez sur un appareil, importez le fichier sur l'autre. Compatible avec les sauvegardes de l'app Orbit mobile.", 's.export': 'Exporter une sauvegarde', 's.exportHint': 'Tous les onglets, pages et images dans un fichier .json.', 's.import': 'Importer une sauvegarde', 's.importHint': "Remplace tout le contenu actuel d'Orbit.", 's.importTitle': 'Remplacer toutes les données ?', 's.importMsg': 'Les onglets, pages et images actuels seront remplacés par la sauvegarde.', 's.replace': 'Remplacer', 's.imported': 'Sauvegarde importée', 's.exported': 'Sauvegarde enregistrée', 's.invalid': "Ce fichier n'est pas une sauvegarde Orbit.", 's.folder': 'Ouvrir le dossier des données', 's.folderHint': 'Là où Orbit garde vos données sur ce PC.', 's.keys': 'Raccourcis clavier',
    's.auto': 'Sauvegardes automatiques', 's.autoHint': 'Orbit garde une copie de vos données chaque jour (10 dernières). Cliquez pour restaurer.', 's.autoNone': 'Aucune sauvegarde automatique pour le moment.', 's.restoreTitle': 'Restaurer cette sauvegarde ?', 's.restoreMsg': '{tabs} onglet(s) et {pages} page(s) du {date}. Vos données actuelles seront remplacées (une copie est gardée).', 's.restore': 'Restaurer', 's.restored': 'Sauvegarde restaurée', 's.pages': '{pages} pages',
    'k.new': 'Nouvelle page ou créneau', 'k.search': 'Rechercher', 'k.tabs': "Changer d'onglet", 'k.esc': 'Fermer le panneau ou la fenêtre', 'k.save': "Enregistrer dans l'éditeur",
    'account.title': 'Compte', 'account.notConfigured': "La synchro de compte n'est pas encore configurée dans cette version.",
    'account.pitch': 'Synchronise Orbit entre ton PC et ton téléphone', 'account.pitchSub': 'Tes données restent disponibles hors ligne et se synchronisent dès que tu es connecté.',
    'account.signIn': 'Se connecter', 'account.signUp': 'Créer un compte', 'account.email': 'E-mail', 'account.password': 'Mot de passe', 'account.confirm': 'Confirmer le mot de passe',
    'account.forgot': 'Mot de passe oublié ?', 'account.resetSent': 'E-mail de réinitialisation envoyé à {email}.', 'account.mismatch': 'Les mots de passe ne correspondent pas.', 'account.needEmail': "Entre d'abord ton e-mail.",
    'account.internet': 'Nécessite une connexion internet.', 'account.signedInAs': 'Connecté en tant que', 'account.syncNow': 'Synchroniser maintenant', 'account.syncing': 'Synchronisation…',
    'account.synced': 'Synchronisé {time}', 'account.never': 'Pas encore synchronisé', 'account.offline': "Hors ligne. Orbit se synchronisera au retour d'internet.", 'account.errorStatus': 'Échec de la synchro : {msg}',
    'account.auto': 'Les modifications se synchronisent automatiquement sur tous tes appareils connectés à ce compte.', 'account.signOut': 'Se déconnecter', 'account.signOutTitle': 'Se déconnecter ?',
    'account.signOutMsg': 'Tes données restent sur ce PC, mais ne se synchroniseront plus.', 'account.notSignedIn': 'Non connecté', 'account.offlineOk': "Tout le reste d'Orbit fonctionne hors ligne.",
    'time.now': "à l'instant", 'time.min': 'il y a {n} min', 'time.h': 'il y a {n} h', 'time.d': 'il y a {n} j',
    'err.NETWORK': 'Pas de connexion internet.', 'err.EMAIL_EXISTS': 'Un compte existe déjà avec cet e-mail.', 'err.EMAIL_NOT_FOUND': 'E-mail ou mot de passe incorrect.', 'err.INVALID_PASSWORD': 'E-mail ou mot de passe incorrect.', 'err.INVALID_LOGIN_CREDENTIALS': 'E-mail ou mot de passe incorrect.',
    'err.WEAK_PASSWORD': 'Le mot de passe doit faire au moins 6 caractères.', 'err.INVALID_EMAIL': 'Adresse e-mail invalide.', 'err.MISSING_PASSWORD': 'Entre un mot de passe.', 'err.TOO_MANY_ATTEMPTS_TRY_LATER': 'Trop de tentatives, réessaie plus tard.',
    'err.OPERATION_NOT_ALLOWED': 'La connexion par e-mail est désactivée dans Firebase.', 'err.PERMISSION_DENIED': 'Accès refusé par les règles de la base de données.', 'err.NOT_FOUND': "La base de données n'est pas encore créée.",
    'err.NOT_CONFIGURED': "La synchro de compte n'est pas configurée.", 'err.USER_DISABLED': 'Ce compte est désactivé.', 'err.UNKNOWN': 'Une erreur est survenue ({code}).',
    'update.title': 'Une mise à jour est disponible', 'update.body': "Orbit {v} est prête. Elle se télécharge, s'installe et redémarre toute seule, en gardant toutes tes données.", 'update.later': "J'ai compris", 'update.now': 'Mettre à jour',
    'update.downloading': 'Téléchargement… {p} %', 'update.installing': 'Installation…', 'update.section': 'Mises à jour', 'update.check': 'Rechercher une mise à jour', 'update.upToDate': 'Orbit est à jour.',
    'update.failed': 'Impossible de vérifier les mises à jour. Es-tu connecté à internet ?', 'update.version': 'Version {v}', 'update.dev': "Les mises à jour ne fonctionnent que dans l'app installée.",
    'kind.payments': 'Paiements', 'kind.chart': 'Graphiques', 'kd.payments': "Ce que tu dois : à qui, combien, payé ou non", 'kd.chart': "Graphiques d'un autre onglet ou de tes propres chiffres",
    'p.creditor': 'Dû à', 'p.creditorPh': 'Personne ou entreprise', 'p.amount': 'Montant', 'p.markRepaid': 'Marquer comme remboursé', 'p.repaid': 'Remboursé', 'p.toPay': 'À payer',
    'money.repaid': '{v} remboursé', 'money.due': '{v} à payer',
    'chart.type': 'Type de graphique', 'chart.bar': 'Barres', 'chart.line': 'Courbe', 'chart.donut': 'Anneau', 'chart.source': 'Données', 'chart.manual': 'Mes propres valeurs', 'chart.tab': 'Depuis un onglet',
    'chart.pickTab': 'Onglet', 'chart.metric': 'Ce qui est affiché', 'chart.addPoint': 'Ajouter une valeur', 'chart.label': 'Libellé', 'chart.value': 'Valeur', 'chart.noData': 'Pas encore de données',
    'metric.money.status': 'Payé et non payé', 'metric.money.month': 'Montant par mois', 'metric.money.client': 'Montant par personne', 'metric.pages.status': 'Fait et à faire', 'metric.pages.tag': 'Pages par tag',
    'profile.title': 'Profil', 'profile.namePh': 'Nom affiché dans Orbit', 'profile.change': 'Changer la photo', 'profile.remove': 'Retirer la photo', 'profile.hello': 'Salut {name}',
    'kind.expenses': 'Dépenses', 'kd.expenses': 'Ce que tu dépenses : quoi, combien, quand',
    'p.payee': 'Payé à', 'p.payeePh': 'Boutique, site, personne', 'p.spent': 'Payé', 'p.toSpend': 'Prévu', 'p.markSpent': 'Marquer comme payé',
    'money.spent': '{v} dépensé', 'money.planned': '{v} prévu',
    'news.title': 'Nouveautés', 'news.build': 'Build {b}', 'news.see': 'Nouveautés', 'theme.title': 'Thème', 'theme.night': 'Nuit', 'theme.ink': 'Encre', 'theme.light': 'Clair',
    'chart.all': 'Tous les onglets argent', 'flow.in': 'Entrées', 'flow.out': 'Sorties', 'flow.balance': 'Solde',
    'metric.flow.inout': 'Entrées et sorties', 'metric.flow.balance': 'Argent restant dans le temps', 'metric.budget.spentMonth': 'Dépenses par période', 'p.addSpending': 'Ajouter un paiement', 'p.amount2': 'Montant', 'metric.flow.month': 'Net par période', 'metric.flow.tab': 'Total par onglet',
    'search.global': 'Tous les onglets', 'search.none': 'Aucun résultat pour « {q} »',
    'overview.title': "Aujourd'hui", 'overview.next': 'À venir', 'overview.deadlines': 'Deadlines cette semaine', 'overview.money': 'Argent',
    'overview.empty': 'Rien de prévu. Profite.', 'overview.in': 'dans {v}', 'overview.now': 'maintenant', 'overview.earned': 'À recevoir', 'overview.owed': 'À payer',
    'p.duplicate': 'Dupliquer', 'p.copy': '{title} (copie)', 'p.move': 'Déplacer vers…', 'p.moved': 'Déplacé vers {tab}', 'p.noTarget': 'Aucun autre onglet de ce type',
    'tpl.save': 'Enregistrer comme modèle', 'tpl.saved': 'Modèle enregistré', 'tpl.use': 'Modèles',
    'kind.budget': 'Budgets', 'kd.budget': "Un budget par poste, et ce qu'il en reste",
    'p.budget': 'Budget', 'p.spentSoFar': 'Déjà dépensé', 'p.remaining': 'Restant', 'p.over': 'Dépassé de {v}',
    'budget.total': '{v} de budget', 'budget.spent': '{v} dépensé', 'budget.left': '{v} restant',
    'metric.budget.remaining': 'Restant par budget', 'metric.budget.split': 'Dépensé et restant',
    'chart.range': 'Période', 'range.12m': '12 mois', 'range.6m': '6 mois', 'range.30d': '30 jours', 'range.7d': '7 jours',
    'days.short': ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], 'days.long': ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'],
  },
};

const S = {
  data: null, filter: 'all', search: '', view: 'week', day: todayIdx(),
  detailId: null, detailAnim: false, editor: null, tabEd: null, settings: false, confirm: null, viewer: null,
  animKey: '', popId: null, lastRatio: 0, dragPage: null, dragTab: null, scrolledTT: null, version: '', snaps: [],
  newsOpen: false,
  account: { configured: false, user: null, status: 'idle', lastSync: null, error: null }, accountOpen: false, globalSearch: false, overviewOpen: false,
  auth: { mode: 'signIn', email: '', password: '', confirm: '', error: '', info: '', busy: false },
  update: { open: false, state: 'idle', version: '', percent: 0, checking: false },
};
const lang = () => S.data?.settings?.language || 'en';
function T(k, p) { let s = (L[lang()] || L.en)[k] ?? L.en[k] ?? k; if (typeof s !== 'string') return s; if (p) s = s.replace(/\{(\w+)\}/g, (_, x) => p[x] ?? ''); return s; }
const loc = () => (lang() === 'fr' ? 'fr-FR' : 'en-GB');
const fdate = (ts) => new Date(ts).toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' });
function money(v) { const d = v % 1 ? 2 : 0; try { return new Intl.NumberFormat(loc(), { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(v); } catch (e) { return v + ' €'; } }
const sod = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
function due(p) {
  if (p.deadline == null || p.done) return null;
  const n = Math.round((sod(p.deadline) - sod(Date.now())) / DAY);
  if (n < 0) return { l: T('due.late', { n: -n }), c: '#FF4D6D' };
  if (n === 0) return { l: T('due.today'), c: '#FBBF24' };
  if (n === 1) return { l: T('due.tomorrow'), c: '#FBBF24' };
  return { l: T('due.in', { n }), c: n <= 3 ? '#FBBF24' : '#8A8AA6' };
}
const chip = (label, color, icon, extra = '') => `<span class="chip" style="color:${color};border-color:${color}55;background:${color}17">${icon ? ic(icon, 12, 2.4) : ''}<span style="overflow:hidden;text-overflow:ellipsis">${esc(label)}</span>${extra}</span>`;
const checkBtn = (on, C, a, id, s = 24) => `<button class="chk ${on ? 'on' : ''} ${S.popId === id ? 'pop' : ''}" data-a="${a}" data-id="${id}" style="--c:${C};width:${s}px;height:${s}px" aria-label="toggle">${ic('check', s * 0.6, 3)}</button>`;
const segBtn = (label, active, C, a, v, icon) => `<button data-a="${a}" data-v="${v}" style="${active ? `background:${C}26;border-color:${C}88;color:${C}` : ''}">${icon ? ic(icon, 15) : ''}${esc(label)}</button>`;
function toast(msg) { $('#toast').innerHTML = `<div class="toast">${esc(msg)}</div>`; clearTimeout(toast.t); toast.t = setTimeout(() => ($('#toast').innerHTML = ''), 2400); }

let logoSeq = 0;
function logoSVG(size, sat = '#22D3EE', { intro = false, period = 8 } = {}) {
  const id = ++logoSeq;
  const ring = (cls = '', extra = '') => `<ellipse class="${cls}" cx="54" cy="54" rx="34" ry="13" fill="none" stroke="#8B5CF6" transform="rotate(-24 54 54)" ${extra}/>`;
  const orbitPath = 'M88,54 A34,13 0 1,1 20,54 A34,13 0 1,1 88,54';
  return `<svg class="${intro ? 'ilogo' : 'logo'}" width="${size}" height="${size}" viewBox="0 0 108 108" aria-hidden="true">
  <defs>
    <clipPath id="lf${id}"><rect x="0" y="54" width="108" height="60" transform="rotate(-24 54 54)"/></clipPath>
    <filter id="lg${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  ${ring('ring', `stroke-width="6" opacity=".5" filter="url(#lg${id})"`)}
  ${ring('ring', 'stroke-width="3.5" stroke-linecap="round"')}
  <circle class="planet" cx="54" cy="54" r="11" fill="#EEEEF8"/>
  <g clip-path="url(#lf${id})">${ring('ring', 'stroke-width="3.5" stroke-linecap="round"')}</g>
  <g transform="rotate(-24 54 54)">
    <g class="satg">
      <circle r="7" fill="${sat}" opacity=".75" filter="url(#lg${id})"/>
      <circle r="4.5" fill="${sat}"/>
      ${intro
        ? `<animateMotion dur="1.25s" begin="0.6s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.45 0 0.55 1" path="${orbitPath}"/><set attributeName="opacity" to="1" begin="0.6s" fill="freeze"/>`
        : `<animateMotion dur="${period}s" repeatCount="indefinite" path="${orbitPath}"/>`}
    </g>
  </g>
</svg>`;
}

/* ---------- Data ---------- */
const PAGE_DEFAULTS = { description: '', done: false, images: [], tags: [], checklist: [], deadline: null, client: '', price: null, paid: false, day: 0, start: 540, end: 600, color: null, chartType: 'bar', source: 'manual', sourceTabId: null, metric: 'money.status', points: [], range: '6m', spent: 0, entries: [] };
function defaultData() {
  const tabs = [
    { id: uid(), name: 'Timetable', color: ACC[0], kind: 'timetable', startHour: 7, endHour: 22 },
    { id: uid(), name: 'Games', color: ACC[1], kind: 'board', startHour: 7, endHour: 22 },
    { id: uid(), name: 'Commissions', color: ACC[2], kind: 'commissions', startHour: 7, endHour: 22 },
  ];
  return { version: 2, settings: { language: 'en', theme: 'night', seenBuild: 0 }, activeTabId: tabs[0].id, tabs, pages: Object.fromEntries(tabs.map((t) => [t.id, []])), deleted: { tabs: {}, pages: {} }, orderUpdatedAt: 0, profile: { name: '', photo: null }, profileUpdatedAt: 0, templates: [] };
}
function migrate(d) {
  if (!d || !Array.isArray(d.tabs) || d.tabs.length === 0) return defaultData();
  const tabs = d.tabs.map((t) => ({ kind: t.name === 'Timetable' ? 'timetable' : t.name === 'Commissions' ? 'commissions' : 'board', startHour: 7, endHour: 22, updatedAt: 0, ...t }));
  const pages = {};
  tabs.forEach((t) => {
    if (t.kind === 'expenses') {
      t.kind = 'budget';
      pages[t.id] = (d.pages?.[t.id] || []).map((p) => ({ ...PAGE_DEFAULTS, ...p,
        entries: Array.isArray(p.entries) && p.entries.length ? p.entries : (p.paid && p.price ? [{ id: uid(), amount: p.price, date: p.deadline ?? p.createdAt ?? Date.now(), label: '' }] : []) }));
      return;
    }
    pages[t.id] = (d.pages?.[t.id] || []).map((p) => ({ ...PAGE_DEFAULTS, ...p }));
  });
  return { version: 2, settings: { language: 'en', theme: 'night', seenBuild: 0, ...(d.settings || {}) }, activeTabId: tabs.some((t) => t.id === d.activeTabId) ? d.activeTabId : tabs[0].id, tabs, pages, deleted: { tabs: { ...(d.deleted?.tabs || {}) }, pages: { ...(d.deleted?.pages || {}) } }, orderUpdatedAt: d.orderUpdatedAt || 0, profile: { name: '', photo: null, ...(d.profile || {}) }, profileUpdatedAt: d.profileUpdatedAt || 0, templates: Array.isArray(d.templates) ? d.templates : [] };
}
let saveTimer;
function persist(fromSync) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => api.save(S.data), 300);
  if (!fromSync) scheduleSync();
}

/* ---------- Compte et synchro ---------- */
const Cloud = window.OrbitCloud;
const CFG = (window.ORBIT_CONFIG || {}).firebase || {};
const cloud = Cloud.createCloud({
  apiKey: CFG.apiKey, projectId: CFG.projectId,
  http: (req) => api.request(req),
  session: { get: () => api.sessionGet(), set: (v) => api.sessionSet(v) },
  images: {
    nameOf: (ref) => (String(ref).startsWith(PREFIX) ? String(ref).slice(PREFIX.length) : decodeURIComponent(String(ref).split('/').pop())),
    refOf: (name) => PREFIX + name,
    exists: (name) => api.imageExists(name),
    readB64: (name) => api.imageB64(name),
    writeB64: (name, b64) => api.imageWrite(name, b64),
  },
});
const syncPart = (d) => ({ tabs: d.tabs, pages: d.pages, deleted: d.deleted || { tabs: {}, pages: {} }, orderUpdatedAt: d.orderUpdatedAt || 0, profile: d.profile || { name: '', photo: null }, profileUpdatedAt: d.profileUpdatedAt || 0 });
const now = () => Date.now();
function tomb(kind, id) { S.data.deleted = S.data.deleted || { tabs: {}, pages: {} }; S.data.deleted[kind][id] = now(); }
function errText(code) { const k = 'err.' + code, m = T(k); return m === k ? T('err.UNKNOWN', { code }) : m; }
function ago(ts) {
  if (!ts) return '';
  const s = Math.max(0, (now() - ts) / 1000);
  if (s < 60) return T('time.now');
  if (s < 3600) return T('time.min', { n: Math.floor(s / 60) });
  if (s < 86400) return T('time.h', { n: Math.floor(s / 3600) });
  return T('time.d', { n: Math.floor(s / 86400) });
}
let syncBusy = false, syncPending = false, syncTimer = null, preferRemote = false;
function setAccount(patch) { Object.assign(S.account, patch); renderSide(); renderAccount(); }
function scheduleSync(delay = 4000) {
  if (!S.account.user) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(runSync, delay);
}
async function runSync() {
  if (!cloud.configured || !S.account.user) return;
  if (syncBusy) { syncPending = true; return; }
  syncBusy = true;
  setAccount({ status: 'syncing', error: null });
  try {
    const r = await cloud.sync(syncPart(S.data), { preferRemote });
    preferRemote = false;
    const merged = cloud.apply(syncPart(S.data), r.remoteAfter, r.replaced);
    if (Cloud.stable(syncPart(S.data)) !== Cloud.stable(merged)) {
      Object.assign(S.data, merged);
      if (!S.data.tabs.some((t) => t.id === S.data.activeTabId)) S.data.activeTabId = S.data.tabs[0].id;
      if (S.detailId && !findPage(S.detailId)) S.detailId = null;
      renderAll();
      persist(true);
    }
    const t = now();
    try { localStorage.setItem('orbit.lastSync', String(t)); } catch (e) {}
    setAccount({ status: 'idle', lastSync: t, error: null });
  } catch (e) {
    const code = (e && e.code) || 'UNKNOWN';
    if (code === 'NOT_SIGNED_IN') setAccount({ user: null, status: 'idle' });
    else setAccount({ status: code === 'NETWORK' ? 'offline' : 'error', error: code });
  } finally {
    syncBusy = false;
    if (syncPending) { syncPending = false; scheduleSync(1500); }
  }
}
window.addEventListener('focus', () => scheduleSync(800));
window.addEventListener('beforeunload', () => { clearTimeout(saveTimer); try { api.saveSync(S.data); } catch (e) {} });
function commit() { renderAll(); persist(); }

const tabs = () => S.data.tabs;
const activeTab = () => tabs().find((t) => t.id === S.data.activeTabId) || tabs()[0];
function findPage(id) { for (const k in S.data.pages) { const p = S.data.pages[k].find((x) => x.id === id); if (p) return { p, tabId: k }; } return null; }
const allImages = () => Object.values(S.data.pages).flat().flatMap((p) => p.images || []);

/* ---------- Render ---------- */
function renderAll() { renderSide(); renderMain(); renderPanel(); renderSettings(); renderEditor(); renderTabEd(); renderAccount(); renderUpdate(); renderMove(); renderOverview(); renderNews(); renderConfirm(); renderViewer(); }

function renderSide() {
  const act = activeTab();
  $('#side').innerHTML = `
  <div class="brand">${logoSVG(34, act.color)}<b>Orbit</b></div>
  ${S.data.profile && (S.data.profile.name || S.data.profile.photo) ? `<button class="profrow" data-a="settings">
      ${S.data.profile.photo ? `<img src="${imgSrc(S.data.profile.photo)}" alt="">` : `<span class="profph" style="color:${act.color};border-color:${act.color}66">${esc((S.data.profile.name || '?')[0].toUpperCase())}</span>`}
      <span>${esc(S.data.profile.name || '')}</span></button>` : ''}
  <div class="side-label">${T('tabs')}</div>
  <div class="tablist">${tabs().map((t, i) => `
    <div class="tabitem ${t.id === act.id ? 'active' : ''}" draggable="true" data-a="tab-select" data-id="${t.id}" data-tab-index="${i}" style="--c:${t.color}">
      <span class="dot" style="background:${t.color};${t.id === act.id ? `box-shadow:0 0 10px ${t.color}` : ''}"></span>
      <span class="name">${esc(t.name)}</span>
      <span style="color:var(--fa)">${ic(KIND_IC[t.kind], 14)}</span>
      <span class="count">${S.data.pages[t.id].length}</span>
      <button class="more" data-a="tab-edit" data-id="${t.id}" aria-label="edit">${ic('more', 16)}</button>
    </div>`).join('')}</div>
  <button class="side-add" data-a="tab-new">${ic('plus', 16)}${T('tabs.new')}</button>
  <div class="grow"></div>
  <button class="side-btn" data-a="overview">${ic('today', 17)}<span style="flex:1;text-align:left">${T('overview.title')}</span></button>
  <button class="side-btn" data-a="account">
    <span style="position:relative;display:grid;place-items:center;width:17px">${ic('user', 17)}${S.account.user ? `<i class="sdot" style="background:${S.account.status === 'error' ? 'var(--dg)' : S.account.status === 'offline' ? 'var(--wa)' : act.color}"></i>` : ''}</span>
    <span style="flex:1;min-width:0;text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${S.account.user ? esc(S.account.user.email) : T('account.title')}</span>
    ${S.account.status === 'syncing' ? `<span class="spin" style="color:var(--mu)">${ic('refresh', 14)}</span>` : ''}
  </button>
  <button class="side-btn" data-a="settings">${ic('settings', 17)}${T('s.title')}</button>
  <div class="shortcuts"><span><kbd>N</kbd> ${T('newPage')}</span><span><kbd>1</kbd>–<kbd>9</kbd> ${T('tabs')}</span></div>`;
}

function renderMain() {
  const tab = activeTab(), C = tab.color, pages = S.data.pages[tab.id], tt = tab.kind === 'timetable', com = isMoneyKind(tab.kind), pay = tab.kind === 'payments', chart = tab.kind === 'chart';
  document.documentElement.style.setProperty('--accent', C);
  $('#orb').innerHTML = [1, 0.82, 0.64, 0.46, 0.3].map((l) => `<i style="width:${460 * l}px;height:${460 * l}px;background:${C}"></i>`).join('');
  const done = pages.filter((p) => p.done).length, ratio = pages.length ? done / pages.length : 0;
  let h = `<div class="htop">
    <h1 class="tname">${esc(tab.name)}</h1>
    <span class="kindchip">${ic(KIND_IC[tab.kind], 14)}${T('kind.' + tab.kind)}</span>
    <div class="grow"></div>
    ${!tt ? `<label class="search">${ic('search', 16)}<input id="search" type="text" placeholder="${T('search')}" value="${esc(S.search)}"><button data-a="search-global" title="${T('search.global')}" style="color:${S.globalSearch ? C : 'var(--fa)'}">${ic('board', 15)}</button></label>` : ''}
    <button class="primary" data-a="new" style="--c:${C}">${ic('plus', 16, 2.6)}${tt ? T('p.newSlot') : T('newPage')}<kbd>N</kbd></button>
  </div>`;
  if (tt) {
    h += `<div class="hrow"><div class="seg">${segBtn(T('v.week'), S.view === 'week', C, 'view', 'week', 'grid')}${segBtn(T('v.day'), S.view === 'day', C, 'view', 'day', 'calendar')}</div>
      ${S.view === 'day' ? `<div class="daypick">${T('days.short').map((d, i) => `<button data-a="day" data-v="${i}" style="${i === S.day ? `background:${C};border-color:${C};color:var(--on);box-shadow:0 0 12px ${C}88` : ''}">${d}</button>`).join('')}</div>` : ''}</div>`;
  } else if (isBudgetKind(tab.kind)) {
    const b = budgetTotals(pages);
    h += `<div class="hrow"><div style="display:flex;gap:8px;flex-wrap:wrap">
      ${chip(T('budget.total', { v: money(b.budget) }), C, 'wallet')}
      ${chip(T('budget.spent', { v: money(b.spent) }), '#8A8AA6', 'spend')}
      ${chip(T('budget.left', { v: money(b.left) }), b.left < 0 ? '#FF4D6D' : '#34D399', 'check')}
    </div><div class="grow"></div></div>`;
  } else if (chart) {
    h += '';
  } else {
    let moneyHtml = '';
    if (com) {
      let pd = 0, pe = 0;
      pages.forEach((p) => { if (p.price != null) p.paid ? (pd += p.price) : (pe += p.price); });
      moneyHtml = `<div style="display:flex;gap:8px">${chip(T(tab.kind === 'expenses' ? 'money.spent' : pay ? 'money.repaid' : 'm.paid', { v: money(pd) }), C, 'check')}${chip(T(tab.kind === 'expenses' ? 'money.planned' : pay ? 'money.due' : 'm.pending', { v: money(pe) }), '#FBBF24', 'clock')}</div>`;
    }
    h += `<div class="hrow">
      <div class="seg">${['all', 'todo', 'done'].map((f) => segBtn(T('f.' + f), S.filter === f, C, 'filter', f)).join('')}</div>
      <div class="prog"><div class="track"><div class="fill" id="pfill" style="width:${S.lastRatio * 100}%;background:${C};box-shadow:0 0 10px ${C}"></div></div><span class="pt">${done}/${pages.length}</span></div>
      ${moneyHtml}<div class="grow"></div>
      ${S.filter === 'all' && !S.search && pages.length > 1 ? `<span class="hint">${T('dragHint')}</span>` : ''}
    </div>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { const f = $('#pfill'); if (f) f.style.width = ratio * 100 + '%'; }));
    S.lastRatio = ratio;
  }
  $('#head').innerHTML = h;
  renderBody();
}

function matches(p, q) {
  if (!q) return true;
  q = q.toLowerCase();
  return [p.title, p.description, p.client, ...(p.tags || []), ...(p.checklist || []).map((c) => c.text)].some((x) => String(x || '').toLowerCase().includes(q));
}

function renderBody() {
  const tab = activeTab(), C = tab.color, pages = S.data.pages[tab.id], tt = tab.kind === 'timetable';
  const body = $('#body');
  const key = tab.id + S.filter + S.view + S.day + lang();
  body.className = 'body' + (tt ? ' tt' : '') + (key !== S.animKey ? ' anim' : '');
  S.animKey = key;
  if (tt) {
    body.innerHTML = ttHTML(tab, pages);
    if (S.scrolledTT !== tab.id + S.view) { S.scrolledTT = tab.id + S.view; body.scrollTop = Math.max(0, (new Date().getHours() - tab.startHour - 1) * 64); }
  } else if (tab.kind === 'chart') {
    const shown = pages.filter((p) => matches(p, S.search));
    body.innerHTML = shown.length
      ? `<div class="cards charts">${shown.map((p, i) => `
        <div class="card chartcard" data-a="open" data-id="${p.id}" style="--c:${tab.color};animation-delay:${Math.min(i, 12) * 28}ms">
          <div class="cin"><div class="trow"><span class="ctitle">${esc(p.title)}</span><span style="color:var(--fa)">${ic(KIND_IC.chart, 15)}</span></div>
          <div class="chartbox">${chartSVG(p.chartType, buildSeries(p, tab.color), tab.color, 360, p.chartType === 'donut' ? 200 : 180)}</div>
          ${p.description ? `<div class="desc" style="margin-left:0">${esc(p.description)}</div>` : ''}</div>
        </div>`).join('')}</div>`
      : `<div class="empty"><div class="eicon" style="border-color:${tab.color}55;color:${tab.color};box-shadow:0 0 26px ${tab.color}44">${ic('barchart', 32, 1.8)}</div>${T('e.all')}</div>`;
  } else {
    if (S.globalSearch && S.search.trim()) {
      const groups = tabs().map((tb) => ({ tb, list: (S.data.pages[tb.id] || []).filter((p) => matches(p, S.search)) })).filter((g) => g.list.length);
      body.innerHTML = groups.length
        ? groups.map((g) => `<div class="gsgroup"><div class="gshead"><i class="dot" style="background:${g.tb.color}"></i>${esc(g.tb.name)}<span style="color:var(--fa);font-size:12px">${g.list.length}</span></div>
            <div class="cards">${g.list.slice(0, 24).map((p, i) => cardHTML(p, g.tb, i, false)).join('')}</div></div>`).join('')
        : `<div class="empty">${T('search.none', { q: esc(S.search) })}</div>`;
      S.popId = null;
      return;
    }
    let shown = S.filter === 'todo' ? pages.filter((p) => !p.done) : S.filter === 'done' ? pages.filter((p) => p.done) : pages;
    shown = shown.filter((p) => matches(p, S.search));
    const drag = S.filter === 'all' && !S.search;
    body.innerHTML = shown.length
      ? `<div class="cards">${shown.map((p, i) => cardHTML(p, tab, i, drag)).join('')}</div>`
      : `<div class="empty"><div class="eicon" style="border-color:${C}55;color:${C};box-shadow:0 0 26px ${C}44">${ic(S.search ? 'search' : 'planet', 32, 1.6)}</div>${S.search ? esc(T('e.search', { q: S.search })) : T('e.' + S.filter)}</div>`;
  }
  S.popId = null;
}

function cardHTML(p, tab, i, drag) {
  const bud = isBudgetKind(tab.kind);
  const bTotal = p.price || 0, bSpent = spentOf(p), bLeft = bTotal - bSpent;
  const bRatio = bTotal > 0 ? Math.min(1, bSpent / bTotal) : 0;
  const bColor = bLeft < 0 ? 'var(--dg)' : bRatio > 0.8 ? 'var(--wa)' : tab.color;
  const C = tab.color, com = isMoneyKind(tab.kind) && !isBudgetKind(tab.kind), pay = tab.kind === 'payments', spend = false, d = due(p), cd = p.checklist.filter((c) => c.done).length;
  let meta = '';
  if (com && p.price != null) meta += chip(p.paid ? T(spend ? 'p.spent' : pay ? 'p.repaid' : 'p.paid') : T(spend ? 'p.toSpend' : pay ? 'p.toPay' : 'p.unpaid'), p.paid ? '#8A8AA6' : '#FBBF24', p.paid ? 'check' : 'clock');
  if (d) meta += chip(d.l, d.c, 'flag');
  if (p.checklist.length) meta += chip(cd + '/' + p.checklist.length, cd === p.checklist.length ? C : '#8A8AA6', 'list');
  if (p.images.length > 1) meta += `<span class="mt">${ic('image', 13)}${p.images.length}</span>`;
  p.tags.slice(0, 4).forEach((t) => (meta += chip(t, tagColor(t))));
  if (p.tags.length > 4) meta += `<span class="mt">+${p.tags.length - 4}</span>`;
  return `<div class="card ${p.done ? 'done' : ''} ${S.detailId === p.id ? 'sel' : ''}" data-a="open" data-id="${p.id}" ${drag ? `draggable="true" data-drag-page="${p.id}"` : ''} style="--c:${C};animation-delay:${Math.min(i, 14) * 28}ms">
    ${p.images[0] ? `<img class="cover" src="${imgSrc(p.images[0])}" alt="" draggable="false">` : ''}
    <div class="cin">
      <div class="trow">${bud ? '' : checkBtn(p.done, C, 'toggle', p.id)}<span class="ctitle ${p.done ? 'strike' : ''}">${esc(p.title)}</span>${(com || bud) && p.price != null ? `<b style="font-size:15px;color:${p.paid ? 'var(--mu)' : C}">${money(p.price)}</b>` : ''}</div>
      ${com && p.client ? `<div class="sub">${esc(p.client)}</div>` : ''}
      ${bud && bTotal > 0 ? `<div class="track" style="margin:10px 0 0 0"><div class="fill" style="width:${bRatio * 100}%;background:${bColor};box-shadow:0 0 10px ${bColor}"></div></div>
        <div style="display:flex;justify-content:space-between;margin:6px 0 0 0;font-size:12.5px"><span style="color:var(--mu)">${T('budget.spent', { v: money(bSpent) })}</span><b style="color:${bColor}">${bLeft < 0 ? T('p.over', { v: money(-bLeft) }) : T('budget.left', { v: money(bLeft) })}</b></div>` : ''}
      ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
      ${meta ? `<div class="meta">${meta}</div>` : ''}
    </div>
  </div>`;
}

const METRICS = ['money.status', 'money.month', 'money.client', 'pages.status', 'pages.tag'];
const FLOW_METRICS = ['flow.balance', 'flow.month', 'flow.tab'];
const BUDGET_METRICS = ['budget.remaining', 'budget.split', 'budget.spentMonth'];
const entriesOf = (p) => (Array.isArray(p.entries) ? p.entries : []);
const spentOf = (p) => (entriesOf(p).length ? entriesOf(p).reduce((n, e) => n + (+e.amount || 0), 0) : +p.spent || 0);
const leftOf = (p) => (p.price || 0) - spentOf(p);
function movements() {
  const out = [];
  tabs().forEach((tab) => {
    const list = S.data.pages[tab.id] || [];
    if (tab.kind === 'commissions' || tab.kind === 'payments') {
      const sign = moneySign(tab.kind);
      list.forEach((p) => { if (p.price != null && p.paid) out.push({ at: p.deadline ?? p.updatedAt ?? p.createdAt ?? 0, amount: sign * p.price, tab }); });
    } else if (tab.kind === 'budget') {
      list.forEach((p) => {
        const es = entriesOf(p);
        if (es.length) es.forEach((e) => out.push({ at: e.date ?? p.updatedAt ?? 0, amount: -(+e.amount || 0), tab }));
        else if (p.spent) out.push({ at: p.updatedAt ?? p.createdAt ?? 0, amount: -p.spent, tab });
      });
    }
  });
  return out.sort((a, b) => a.at - b.at);
}
const RANGES = ['12m', '6m', '30d', '7d'];
const isRanged = (m) => ['money.month', 'flow.month', 'flow.balance', 'budget.spentMonth'].includes(m);
function buckets(range) {
  const out = [], n = new Date();
  if (range === '30d' || range === '7d') {
    const days = range === '7d' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() - i);
      out.push({ key: `d${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: d.toLocaleDateString(loc(), days === 7 ? { weekday: 'short' } : { day: 'numeric' }), end: new Date(d).setHours(23, 59, 59, 999) });
    }
    return out;
  }
  const months = range === '12m' ? 12 : 6;
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
    out.push({ key: `m${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(loc(), { month: 'short' }), end: new Date(n.getFullYear(), n.getMonth() - i + 1, 0, 23, 59, 59).getTime() });
  }
  return out;
}
const bucketKey = (ts, range) => { const d = new Date(ts); return range === '30d' || range === '7d' ? `d${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : `m${d.getFullYear()}-${d.getMonth()}`; };
function budgetTotals(list) {
  const budget = list.reduce((n, p) => n + (p.price || 0), 0);
  const spent = list.reduce((n, p) => n + spentOf(p), 0);
  return { budget, spent, left: budget - spent };
}
const shade = (i) => ACC[i % ACC.length];
const topN = (map, n = 6) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
function moneyTotals() {
  let income = 0, spent = 0, toReceive = 0, toPay = 0;
  tabs().forEach((t) => {
    const list = S.data.pages[t.id] || [];
    if (t.kind === 'commissions') list.forEach((p) => { if (p.price != null) p.paid ? (income += p.price) : (toReceive += p.price); });
    else if (t.kind === 'payments') list.forEach((p) => { if (p.price != null) p.paid ? (spent += p.price) : (toPay += p.price); });
    else if (t.kind === 'budget') list.forEach((p) => { spent += spentOf(p); });
  });
  return { income, spent, toReceive, toPay, balance: income - spent };
}
function buildSeries(page, accent) {
  if (page.source === 'all') {
    const mv = movements();
    const range = page.range || '6m';
    if (page.metric === 'flow.month') {
      return buckets(range).map(({ key, label }) => {
        const sum = mv.reduce((acc, m) => (bucketKey(m.at, range) === key ? acc + m.amount : acc), 0);
        return { label, value: sum, color: sum < 0 ? '#FF4D6D' : accent };
      });
    }
    if (page.metric === 'flow.tab') {
      const map = {};
      mv.forEach((m) => { map[m.tab.name] = (map[m.tab.name] || 0) + m.amount; });
      return topN(map).map(([label, value], i) => ({ label, value, color: value < 0 ? '#FF4D6D' : shade(i) }));
    }
    if (page.metric === 'flow.inout') {
      const income = mv.filter((m) => m.amount > 0).reduce((n, m) => n + m.amount, 0);
      const out = -mv.filter((m) => m.amount < 0).reduce((n, m) => n + m.amount, 0);
      return [
        { label: T('flow.in'), value: income, color: '#34D399' },
        { label: T('flow.out'), value: out, color: '#FF4D6D' },
        { label: T('flow.balance'), value: income - out, color: income - out < 0 ? '#FBBF24' : accent },
      ];
    }
    return buckets(range).map(({ label, end }) => {
      const total = mv.reduce((n, m) => (m.at <= end ? n + m.amount : n), 0);
      return { label, value: total, color: total < 0 ? '#FF4D6D' : accent };
    });
  }
  if (page.source !== 'tab') return (page.points || []).map((p, i) => ({ label: p.label || '—', value: +p.value || 0, color: p.color || shade(i) }));
  const tab = tabs().find((x) => x.id === page.sourceTabId);
  if (!tab) return [];
  const list = S.data.pages[tab.id] || [];
  const money = isMoneyKind(tab.kind);
  switch (page.metric) {
    case 'money.status': {
      if (!money) return [];
      let paid = 0, pending = 0;
      list.forEach((p) => { if (p.price != null) p.paid ? (paid += p.price) : (pending += p.price); });
      const k = tab.kind;
      const lp = k === 'expenses' ? 'p.spent' : k === 'payments' ? 'p.repaid' : 'p.paid';
      const lu = k === 'expenses' ? 'p.toSpend' : k === 'payments' ? 'p.toPay' : 'p.unpaid';
      return [{ label: T(lp), value: paid, color: accent }, { label: T(lu), value: pending, color: '#FBBF24' }];
    }
    case 'money.month': {
      if (!money) return [];
      const range = page.range || '6m';
      const sign = moneySign(tab.kind);
      return buckets(range).map(({ key, label }) => {
        const sum = list.reduce((acc, p) => (p.price != null && p.paid && bucketKey(p.deadline ?? p.createdAt ?? 0, range) === key ? acc + sign * p.price : acc), 0);
        return { label, value: sum, color: sum < 0 ? '#FF4D6D' : accent };
      });
    }
    case 'budget.remaining':
      return list.slice(0, 8).map((p, i) => ({ label: p.title, value: leftOf(p), color: leftOf(p) < 0 ? '#FF4D6D' : shade(i) }));
    case 'budget.spentMonth': {
      const range = page.range || '6m';
      return buckets(range).map(({ key, label }) => {
        const sum = list.reduce((n, p) => n + entriesOf(p).reduce((m, e) => (bucketKey(e.date ?? 0, range) === key ? m + (+e.amount || 0) : m), 0), 0);
        return { label, value: sum, color: sum ? '#FF4D6D' : accent };
      });
    }
    case 'budget.split': {
      const b = budgetTotals(list);
      return [{ label: T('p.spentSoFar'), value: b.spent, color: '#FF4D6D' }, { label: T('p.remaining'), value: Math.max(0, b.left), color: accent }];
    }
    case 'money.client': {
      if (!money) return [];
      const map = {};
      list.forEach((p) => { if (p.price != null) { const k = (p.client || '—').trim() || '—'; map[k] = (map[k] || 0) + p.price; } });
      return topN(map).map(([label, value], i) => ({ label, value, color: shade(i) }));
    }
    case 'pages.tag': {
      const map = {};
      list.forEach((p) => (p.tags || []).forEach((tg) => { map[tg] = (map[tg] || 0) + 1; }));
      return topN(map).map(([label, value], i) => ({ label, value, color: shade(i) }));
    }
    default: {
      const done = list.filter((p) => p.done).length;
      return [{ label: T('f.done'), value: done, color: accent }, { label: T('f.todo'), value: list.length - done, color: '#8A8AA6' }];
    }
  }
}
const niceN = (v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v * 10) / 10);
function chartSVG(type, pts, color, w, h, labels = true) {
  pts = (pts || []).filter((p) => p && isFinite(p.value));
  if (!pts.length) return `<div style="color:var(--mu);font-size:13px;padding:20px 0;text-align:center">${T('chart.noData')}</div>`;
  const pad = labels ? 26 : 8, innerH = h - (labels ? 22 : 6) - 8;
  const hi = Math.max(...pts.map((p) => p.value), 0), lo = Math.min(...pts.map((p) => p.value), 0);
  const span = hi - lo || 1;
  const yOf = (v) => 8 + ((hi - v) / span) * innerH;
  const zero = yOf(0);
  if (type === 'donut') {
    const total = pts.reduce((n, p) => n + Math.abs(p.value), 0) || 1;
    const r = Math.min(w, h) / 2 - 16, cx = w / 2, cy = h / 2, circ = 2 * Math.PI * r;
    let off = 0;
    const arcs = pts.map((p) => {
      const len = (Math.abs(p.value) / total) * circ;
      const el = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.color || color}" stroke-width="18" stroke-linecap="round" stroke-dasharray="${Math.max(0, len - 2)} ${circ}" stroke-dashoffset="${-off}"/>`;
      off += len;
      return el;
    }).join('');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><g transform="rotate(-90 ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--s2)" stroke-width="18"/>${arcs}</g><text x="${cx}" y="${cy + 7}" fill="var(--tx)" font-size="20" font-weight="800" text-anchor="middle">${niceN(total)}</text></svg>`;
  }
  const stepW = (w - pad) / pts.length;
  if (type === 'line') {
    const x = (i) => pad + stepW * i + stepW / 2;
    const y = (v) => yOf(v);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <line x1="${pad}" y1="${zero}" x2="${w}" y2="${zero}" stroke="var(--bd)"/>
      <path d="${d} L${x(pts.length - 1)},${zero} L${x(0)},${zero} Z" fill="${color}" fill-opacity=".14"/>
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.5" fill="${color}"/>`).join('')}
      ${labels ? pts.map((p, i) => `<text x="${x(i)}" y="${h - 6}" fill="var(--mu)" font-size="11" text-anchor="middle">${esc(String(p.label).slice(0, 8))}</text>`).join('') : ''}
    </svg>`;
  }
  const bw = Math.min(stepW * 0.62, 46);
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="${pad}" y1="${zero}" x2="${w}" y2="${zero}" stroke="var(--bd)"/>
    ${pts.map((p, i) => {
      const neg = p.value < 0, bh = Math.max(2, Math.abs(yOf(p.value) - zero)), bx = pad + stepW * i + (stepW - bw) / 2;
      return `<rect x="${bx}" y="${neg ? zero : zero - bh}" width="${bw}" height="${bh}" rx="6" fill="${p.color || color}" opacity=".9"/>
        ${labels ? `<text x="${bx + bw / 2}" y="${neg ? zero + bh + 12 : zero - bh - 5}" fill="${neg ? 'var(--dg)' : 'var(--mu)'}" font-size="10.5" text-anchor="middle">${niceN(p.value)}</text><text x="${bx + bw / 2}" y="${h - 6}" fill="var(--mu)" font-size="11" text-anchor="middle">${esc(String(p.label).slice(0, 8))}</text>` : ''}`;
    }).join('')}
  </svg>`;
}

function lanes(evs) {
  const s = [...evs].sort((a, b) => a.start - b.start || a.end - b.end), ends = [];
  const pl = s.map((e) => { let l = ends.findIndex((x) => x <= e.start); if (l < 0) { l = ends.length; ends.push(e.end); } else ends[l] = e.end; return { e, l }; });
  const n = Math.max(1, ends.length);
  return pl.map((x) => ({ ...x, n }));
}
function ttHTML(tab, pages) {
  const sH = tab.startHour ?? 7, eH = Math.max(sH + 1, tab.endHour ?? 22), H = 64;
  const days = S.view === 'day' ? [S.day] : [0, 1, 2, 3, 4, 5, 6], n = days.length, ti = todayIdx();
  const dt = new Date(), nm = dt.getHours() * 60 + dt.getMinutes();
  const hours = []; for (let x = sH; x < eH; x++) hours.push(x);
  const toY = (m) => ((Math.min(Math.max(m, sH * 60), eH * 60) - sH * 60) / 60) * H;
  const C = tab.color, tot = (eH - sH) * H;
  let o = `<div class="dayhead">${days.map((d) => `<div class="dh" style="${d === ti ? `color:${C};font-weight:800` : ''}">${S.view === 'day' ? T('days.long')[d] : T('days.long')[d]}<i class="tdot" style="${d === ti ? `background:${C};box-shadow:0 0 8px ${C}` : ''}"></i></div>`).join('')}</div>`;
  o += `<div class="grid"><div class="gut" style="height:${tot}px">${hours.map((x) => `<span class="hr" style="top:${(x - sH) * H - 8}px">${pad(x)}:00</span>`).join('')}</div><div class="area" style="height:${tot}px">`;
  o += [...hours, eH].map((x) => `<div class="hl" style="top:${(x - sH) * H}px"></div>`).join('');
  o += days.map((d, ci) => `<div class="col" style="left:${(ci * 100) / n}%;width:${100 / n}%;${d === ti ? `background:${C}0B` : ''}">${hours.map((x) => `<button class="slot" data-a="slot" data-day="${d}" data-h="${x}" style="top:${(x - sH) * H}px;height:${H}px" aria-label="new slot">${ic('plus', 16)}</button>`).join('')}</div>`).join('');
  let k = 0;
  days.forEach((d, ci) => lanes(pages.filter((p) => p.day === d && p.end > sH * 60 && p.start < eH * 60)).forEach(({ e, l, n: ln }) => {
    const c = e.color || C, top = toY(e.start), hh = Math.max(24, toY(e.end) - top - 2), w = 100 / n / ln;
    o += `<button class="ev ${S.detailId === e.id ? 'sel' : ''}" data-a="open" data-id="${e.id}" style="--c:${c};top:${top + 1}px;height:${hh}px;left:calc(${(ci * 100) / n + l * w}% + 2px);width:calc(${w}% - 4px);background:${c}2E;border-color:${c}66;animation-delay:${Math.min(k++, 24) * 18}ms">
      <div class="evt" style="-webkit-line-clamp:${hh > 70 ? 3 : hh > 44 ? 2 : 1}">${esc(e.title)}</div>${hh > 40 ? `<div class="evh">${fmt(e.start)} – ${fmt(e.end)}</div>` : ''}</button>`;
  }));
  if (days.includes(ti) && nm >= sH * 60 && nm <= eH * 60) o += `<div class="now" style="top:${toY(nm) - 1}px;left:${(days.indexOf(ti) * 100) / n}%;width:${100 / n}%;background:${C};box-shadow:0 0 10px ${C}"></div>`;
  return o + '</div></div>';
}

function renderPanel() {
  const el = $('#panel');
  const f = S.detailId && findPage(S.detailId);
  if (!f) { el.classList.remove('open'); S.detailId = null; return; }
  const { p, tabId } = f, tab = tabs().find((t) => t.id === tabId), tt = tab.kind === 'timetable', com = isMoneyKind(tab.kind), pay = tab.kind === 'payments', spend = false, chart = tab.kind === 'chart';
  const C = tt ? p.color || tab.color : tab.color, d = due(p), cd = p.checklist.filter((c) => c.done).length;
  const st = el.querySelector('.pscroll')?.scrollTop || 0;
  let o = `<div class="pin" style="--c:${C}">
    <div class="orb" style="width:340px;height:340px;top:-170px;right:-120px">${[1, 0.82, 0.64, 0.46, 0.3].map((l) => `<i style="width:${340 * l}px;height:${340 * l}px;background:${C}"></i>`).join('')}</div>
    <div class="pbar"><button class="iconbtn" data-a="d-close" title="${T('close')} (Esc)">${ic('x', 18)}</button><div class="grow"></div>
      <button class="iconbtn" data-a="d-duplicate" title="${T('p.duplicate')}">${ic('copy', 17)}</button>
      <button class="iconbtn" data-a="d-move" title="${T('p.move')}">${ic('move', 17)}</button>
      <button class="iconbtn" data-a="d-edit" title="${tt ? T('p.editSlot') : T('p.edit')}">${ic('edit', 17)}</button>
      <button class="iconbtn danger" data-a="d-delete" title="${T('delete')}">${ic('trash', 17)}</button></div>
    <div class="pscroll ${S.detailAnim ? 'anim-in' : ''}">
    <div>
      <span class="pill" style="color:${C};border-color:${C}66;background:${C}18"><span class="dot" style="width:7px;height:7px;background:${C};box-shadow:0 0 6px ${C}"></span>${esc(tab.name)}</span>
      <h1 class="dtitle ${!tt && p.done ? 'strike' : ''}">${esc(p.title)}</h1>
      ${com && p.client ? `<div style="color:var(--mu);font-size:15px;margin-top:4px">${esc(p.client)}</div>` : ''}
      <div style="color:var(--fa);font-size:12.5px;margin-top:6px">${T('p.created', { d: fdate(p.createdAt) })}${p.updatedAt !== p.createdAt ? T('p.updated', { d: fdate(p.updatedAt) }) : ''}</div>
    </div>`;
  if (isBudgetKind(tab.kind) && p.price != null) {
    const sp = spentOf(p), left = leftOf(p), ratio = p.price > 0 ? Math.min(1, sp / p.price) : 0;
    const bc = left < 0 ? 'var(--dg)' : ratio > 0.8 ? 'var(--wa)' : C;
    o += `<div class="box" style="display:block;border-color:${C}55;margin-top:18px">
      <div style="font-size:24px;font-weight:800;color:${bc}">${left < 0 ? T('p.over', { v: money(-left) }) : T('budget.left', { v: money(left) })}</div>
      <div class="track" style="margin-top:12px"><div class="fill" style="width:${ratio * 100}%;background:${bc};box-shadow:0 0 10px ${bc}"></div></div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;color:var(--mu);font-size:13px"><span>${T('budget.spent', { v: money(sp) })}</span><span>${T('budget.total', { v: money(p.price) })}</span></div>
      <div style="display:flex;gap:8px;margin-top:14px"><input class="inp" id="spendAmount" inputmode="decimal" placeholder="${T('p.amount2')}" style="flex:1;--c:${C}"><button class="btn fillc" data-a="d-spend" style="--c:${C}">${ic('plus', 16)}${T('p.addSpending')}</button></div>
      ${entriesOf(p).slice().reverse().slice(0, 10).map((e) => `<div class="entryrow"><span style="flex:1;color:var(--mu);font-size:13px">${fdate(e.date)}</span><b style="color:var(--dg);font-size:13.5px">-${money(e.amount)}</b><button data-a="d-unspend" data-id="${e.id}" style="color:var(--fa)">${ic('x', 15)}</button></div>`).join('')}
      </div>`;
  } else if (chart) {
    const series = buildSeries(p, C);
    o += `<div class="box" style="display:block;border-color:${C}55;margin-top:18px;padding:12px">
      <div class="chartbox">${chartSVG(p.chartType, series, C, 380, p.chartType === 'donut' ? 230 : 200)}</div></div>
      <div style="margin-top:12px;display:flex;flex-direction:column;gap:8px">${series.map((x) => `<div style="display:flex;align-items:center;gap:10px"><i class="bigdot" style="background:${x.color || C}"></i><span style="flex:1;color:var(--mu);font-size:13.5px">${esc(x.label)}</span><b style="font-size:13.5px">${Math.round(x.value * 100) / 100}</b></div>`).join('')}</div>`;
  } else if (tt) o += `<div class="box" style="display:block;border-color:${C}66;box-shadow:0 0 24px ${C}33;margin-top:18px"><div style="color:${C};font-weight:700;font-size:13px">${T('days.long')[p.day]}</div><div style="font-size:30px;font-weight:800;margin-top:2px;font-variant-numeric:tabular-nums">${fmt(p.start)} – ${fmt(p.end)}</div></div>`;
  else if (!chart) o += `<div>
    <button class="box" data-a="d-toggle" style="margin-top:18px;${p.done ? `border-color:${C}88;background:${C}14` : ''}">${checkBtn(p.done, C, 'd-toggle', 'd' + p.id, 28)}<div style="margin-left:14px;flex:1;text-align:left"><div style="font-weight:700;font-size:15px">${p.done ? T('p.done') : T('p.todo')}</div><div style="color:var(--mu);font-size:12.5px;margin-top:2px">${p.done ? T('p.clickTodo') : T('p.clickDone')}</div></div></button>
    ${com && p.price != null ? `<button class="box" data-a="d-paid" style="${p.paid ? `border-color:${C}88` : ''}"><div style="flex:1;text-align:left"><div style="font-size:22px;font-weight:800">${money(p.price)}</div><div style="font-size:12.5px;margin-top:2px;color:${p.paid ? C : 'var(--wa)'}">${p.paid ? T(spend ? 'p.spent' : pay ? 'p.repaid' : 'p.paid') : T(spend ? 'p.toSpend' : pay ? 'p.toPay' : 'p.unpaid')}</div></div>${checkBtn(p.paid, C, 'd-paid', 'p' + p.id, 28)}</button>` : ''}
  </div>`;
  if (!tt && !chart && (p.deadline != null || p.tags.length)) o += `<div class="meta" style="margin:16px 0 0">${p.deadline != null ? chip(fdate(p.deadline) + (d ? '  ' + d.l : ''), d ? d.c : '#8A8AA6', 'flag') : ''}${p.tags.map((t) => chip(t, tagColor(t))).join('')}</div>`;
  if (p.description) o += `<div><div class="label">${T('p.description')}</div><div class="ptext">${esc(p.description)}</div></div>`;
  if (!tt && !chart && p.checklist.length) o += `<div><div class="label">${T('p.checklist')} (${cd}/${p.checklist.length})</div><div style="background:var(--s1);border:1px solid var(--bd);border-radius:14px;padding:4px 10px">${p.checklist.map((c) => `<button class="checkrow" data-a="d-item" data-id="${c.id}">${checkBtn(c.done, C, 'd-item', c.id, 20)}<span style="flex:1;font-size:14px;text-align:left" class="${c.done ? 'strike' : ''}">${esc(c.text)}</span></button>`).join('')}</div></div>`;
  if (p.images.length) o += `<div><div class="label">${T('p.images')} (${p.images.length})</div><div class="imgs">${p.images.map((u, i) => `<button data-a="view-img" data-i="${i}"><img src="${imgSrc(u)}" alt="" draggable="false"></button>`).join('')}</div></div>`;
  el.innerHTML = o + '</div></div>';
  el.classList.add('open');
  if (!S.detailAnim) el.querySelector('.pscroll').scrollTop = st;
  S.detailAnim = false;
  S.popId = null;
}

/* ---------- Editor ---------- */
function openEditor(tabId, page, defaults) {
  const tab = tabs().find((t) => t.id === tabId);
  const base = { title: '', description: '', images: [], done: false, tags: [], checklist: [], deadline: null, client: '', price: '', paid: false, day: todayIdx(), start: 540, end: 600, color: null, chartType: 'bar', source: 'manual', sourceTabId: null, metric: 'money.status', points: [], range: '6m', spent: '' };
  const d = page ? { ...base, ...JSON.parse(JSON.stringify(page)), price: page.price != null ? String(page.price) : '', spent: page.spent != null ? String(page.spent) : '' } : { ...base, ...(defaults || {}) };
  S.editor = { tabId, id: page ? page.id : null, d, original: page ? [...page.images] : [], err: '', _tag: '', _item: '', first: true };
  renderEditor();
  setTimeout(() => $('#m-editor .big')?.focus(), 30);
}
function renderEditor() {
  const E = S.editor, el = $('#m-editor');
  if (!E) { el.innerHTML = ''; return; }
  const tab = tabs().find((t) => t.id === E.tabId), d = E.d, tt = tab.kind === 'timetable', com = isMoneyKind(tab.kind), pay = tab.kind === 'payments', spend = false, budget = isBudgetKind(tab.kind), chart = tab.kind === 'chart';
  const C = tt ? d.color || tab.color : tab.color;
  const st = el.querySelector('.mbody')?.scrollTop || 0;
  const head = E.id ? (tt ? T('p.editSlot') : T('p.edit')) : tt ? T('p.newSlot') : T('p.newIn', { tab: tab.name });
  const dl = d.deadline != null ? (() => { const x = new Date(d.deadline); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; })() : '';
  let o = `<div class="mwrap" data-a="e-backdrop" style="${E.first ? '' : 'animation:none'}"><div class="modal" style="--c:${C};border-color:${C}55;box-shadow:0 0 50px ${C}26;${E.first ? '' : 'animation:none'}">
    <div class="mhead"><h2 style="color:var(--mu);font-weight:600">${esc(head)}</h2><button class="iconbtn" data-a="e-close">${ic('x', 18)}</button></div>
    <div class="mbody">
      ${!E.id && (S.data.templates || []).filter((x) => x.kind === tab.kind).length ? `<div class="tplrow">${(S.data.templates || []).filter((x) => x.kind === tab.kind).map((x) => `<button class="tplchip" data-a="e-tpl" data-id="${x.id}" style="border-color:${C}66;color:${C}">${ic('copy', 13)}${esc(x.name)}</button>`).join('')}</div>` : ''}
      <input class="big" data-f="title" value="${esc(d.title)}" placeholder="${T('p.title')}" maxlength="120">${E.err ? `<div class="err">${E.err}</div>` : ''}`;
  if (tt) {
    o += `<div class="label" style="margin-top:12px">${T('p.day')}</div><div class="daypick">${T('days.short').map((x, i) => `<button data-a="e-day" data-v="${i}" style="flex:1;${d.day === i ? `background:${C};border-color:${C};color:var(--on);box-shadow:0 0 12px ${C}88` : ''}">${x}</button>`).join('')}</div>
      <div class="two"><div><div class="label">${T('p.start')}</div><input class="inp" type="time" data-f="start" value="${fmt(d.start)}"></div><div><div class="label">${T('p.end')}</div><input class="inp" type="time" data-f="end" value="${fmt(d.end)}"></div></div>
      <div class="label">${T('p.color')}</div><div class="sw">${ACC.map((c) => { const a = (d.color || tab.color) === c; return `<button class="swb" data-a="e-color" data-v="${c}" style="${a ? `border-color:${c}` : ''}"><i style="background:${c};${a ? `box-shadow:0 0 12px ${c}` : ''}"></i></button>`; }).join('')}</div>`;
  }
  if (budget) o += `<div class="two">
      <div><div class="label" style="margin-top:12px">${T('p.budget')} (€)</div><input class="inp" data-f="price" inputmode="decimal" value="${esc(d.price)}" placeholder="0"></div>
      <div><div class="label" style="margin-top:12px">${T('p.spentSoFar')} (€)</div><input class="inp" data-f="spent" inputmode="decimal" value="${esc(d.spent ?? '')}" placeholder="0"></div></div>`;
  if (com) o += `<div class="two"><div><div class="label" style="margin-top:12px">${T(spend ? 'p.payee' : pay ? 'p.creditor' : 'p.client')}</div><input class="inp" data-f="client" value="${esc(d.client)}" placeholder="${T(spend ? 'p.payeePh' : pay ? 'p.creditorPh' : 'p.clientPh')}"></div>
      <div><div class="label" style="margin-top:12px">${T(pay || spend ? 'p.amount' : 'p.price')} (€)</div><input class="inp" data-f="price" inputmode="decimal" value="${esc(d.price)}" placeholder="0"></div></div>
      <button class="box" data-a="e-paid" style="justify-content:space-between;${d.paid ? `border-color:${C}88` : ''}"><span>${T(spend ? 'p.markSpent' : pay ? 'p.markRepaid' : 'p.markPaid')}</span>${checkBtn(d.paid, C, 'e-paid', 'ep', 24)}</button>`;
  if (chart) {
    const seg = (val, key, label, icon) => `<button data-a="e-ctype" data-v="${val}" style="${d.chartType === val ? `background:${C}26;border-color:${C}88;color:${C}` : ''}">${ic(icon, 15)}${label}</button>`;
    o += `<div class="label">${T('chart.type')}</div>
      <div class="seg">${seg('bar', 'bar', T('chart.bar'), 'barchart')}${seg('line', 'line', T('chart.line'), 'arrow')}${seg('donut', 'donut', T('chart.donut'), 'clock')}</div>
      ${isRanged(d.metric) && d.source !== 'manual' ? `<div class="label">${T('chart.range')}</div><div class="seg">${RANGES.map((r) => segBtn(T('range.' + r), (d.range || '6m') === r, C, 'e-crange', r)).join('')}</div>` : ''}
      <div class="label">${T('chart.source')}</div>
      <div class="seg">${segBtn(T('chart.manual'), !d.source || d.source === 'manual', C, 'e-csource', 'manual')}${segBtn(T('chart.tab'), d.source === 'tab', C, 'e-csource', 'tab')}${segBtn(T('chart.all'), d.source === 'all', C, 'e-csource', 'all')}</div>`;
    if (d.source === 'all') {
      o += `<div class="label">${T('chart.metric')}</div>${FLOW_METRICS.map((m) => `
        <button class="kind" data-a="e-cmetric" data-v="${m}" style="${d.metric === m ? `border-color:${C}99;background:${C}14` : ''}"><span style="flex:1;text-align:left">${T('metric.' + m)}</span>${d.metric === m ? ic('check', 16) : ''}</button>`).join('')}
        <div class="chartbox" style="margin-top:14px">${chartSVG(d.chartType, buildSeries({ ...d, source: 'all' }, C), C, 420, 190)}</div>`;
    } else if (d.source === 'tab') {
      o += `<div class="label">${T('chart.pickTab')}</div>${tabs().filter((x) => x.kind !== 'chart').map((x) => `
        <button class="kind" data-a="e-ctab" data-v="${x.id}" style="${d.sourceTabId === x.id ? `border-color:${x.color}99;background:${x.color}14` : ''}"><i class="dot" style="background:${x.color}"></i><span style="flex:1;text-align:left">${esc(x.name)}</span>${d.sourceTabId === x.id ? ic('check', 16) : ''}</button>`).join('')}
        <div class="label">${T('chart.metric')}</div>${((tabs().find((x) => x.id === d.sourceTabId) || {}).kind === 'budget' ? BUDGET_METRICS : METRICS).map((m) => `
        <button class="kind" data-a="e-cmetric" data-v="${m}" style="${d.metric === m ? `border-color:${C}99;background:${C}14` : ''}"><span style="flex:1;text-align:left">${T('metric.' + m)}</span>${d.metric === m ? ic('check', 16) : ''}</button>`).join('')}`;
    } else {
      o += `<div class="label">${T('chart.value')}</div>${(d.points || []).map((pt) => `
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <input class="inp" style="flex:1.6" data-cf="label" data-id="${pt.id}" value="${esc(pt.label)}" placeholder="${T('chart.label')}">
          <input class="inp" style="flex:1" data-cf="value" data-id="${pt.id}" value="${esc(pt.value)}" placeholder="0" inputmode="decimal">
          <button class="iconbtn" data-a="e-cpoint-rm" data-id="${pt.id}" style="width:40px;height:40px">${ic('x', 16)}</button>
        </div>`).join('')}
        <button class="btn ghost" data-a="e-cpoint-add" style="width:100%;justify-content:center">${ic('plus', 16)}${T('chart.addPoint')}</button>
        <div class="chartbox" style="margin-top:14px">${chartSVG(d.chartType, (d.points || []).map((x, i) => ({ label: x.label || '—', value: +x.value || 0, color: shade(i) })), C, 420, 180)}</div>`;
    }
  }
  o += `<div class="label">${T('p.description')}</div><textarea class="inp" data-f="description" placeholder="${T('p.desc')}">${esc(d.description)}</textarea>`;
  if (!tt && !chart) {
    o += `<button class="box" data-a="e-done" style="justify-content:space-between;${d.done ? `border-color:${C}88` : ''}"><span>${T('p.markDone')}</span>${checkBtn(d.done, C, 'e-done', 'ed', 24)}</button>
      <div class="two">
        <div><div class="label">${T('p.deadline')}</div><div style="display:flex;gap:6px"><input class="inp" type="date" data-f="deadline" value="${dl}">${d.deadline != null ? `<button class="iconbtn" data-a="e-dl-clear" style="height:40px;width:40px">${ic('x', 16)}</button>` : ''}</div></div>
        <div><div class="label">${T('p.tags')}</div><input class="inp" data-f="_tag" value="${esc(E._tag)}" placeholder="${T('p.addTag')}"></div>
      </div>
      ${d.tags.length ? `<div class="meta" style="margin:10px 0 0">${d.tags.map((t) => chip(t, tagColor(t), null, `<button data-a="e-tag-rm" data-v="${esc(t)}">${ic('x', 11, 2.6)}</button>`)).join('')}</div>` : ''}
      <div class="label">${T('p.checklist')}</div>
      ${d.checklist.map((c) => `<div class="checkrow">${checkBtn(c.done, C, 'e-item', c.id, 20)}<span style="flex:1" class="${c.done ? 'strike' : ''}">${esc(c.text)}</span><button data-a="e-item-rm" data-id="${c.id}" style="color:var(--fa)">${ic('x', 15)}</button></div>`).join('')}
      <input class="inp" data-f="_item" value="${esc(E._item)}" placeholder="${T('p.addItem')}" style="margin-top:4px">`;
  }
  o += `<button class="btn ghost" data-a="e-tpl-save" style="width:100%;justify-content:center;margin-top:18px">${ic('bookmark', 16)}${T('tpl.save')}</button>
      <div class="label">${T('p.images')}</div>
      <div class="drop" id="dropzone">
        ${d.images.length ? `<div class="imgs four" style="margin-bottom:10px">${d.images.map((u, i) => `<div class="imgbox"><img src="${imgSrc(u)}" alt="" draggable="false"><button class="rm" data-a="e-img-rm" data-i="${i}">${ic('x', 12, 2.6)}</button></div>`).join('')}</div>` : ''}
        <div style="color:var(--mu);font-size:13px;display:flex;align-items:center;gap:6px">${ic('image', 16)}${T('p.dropImages')} <button data-a="e-img-add" style="color:${C};font-weight:700">${T('p.browse')}</button></div>
      </div>
    </div>
    <div class="mfoot"><span class="hint" style="margin-right:auto;align-self:center"><kbd>Ctrl</kbd> <kbd>Enter</kbd></span><button class="btn ghost" data-a="e-close">${T('cancel')}</button><button class="btn fillc" data-a="e-save">${T('save')}</button></div>
  </div></div>`;
  el.innerHTML = o;
  if (!E.first) el.querySelector('.mbody').scrollTop = st;
  E.first = false;
  S.popId = null;
}
function addTag() { const E = S.editor, v = E._tag.replace(/,+$/, '').trim(); if (v && !E.d.tags.includes(v)) E.d.tags.push(v); E._tag = ''; renderEditor(); $('[data-f="_tag"]')?.focus(); }
function addItem() { const E = S.editor, v = E._item.trim(); if (!v) return; E.d.checklist.push({ id: uid(), text: v, done: false }); E._item = ''; renderEditor(); $('[data-f="_item"]')?.focus(); }
function closeEditor() {
  const E = S.editor; if (!E) return;
  const added = E.d.images.filter((r) => !E.original.includes(r));
  if (added.length) api.deleteImages(added);
  S.editor = null; renderEditor();
}
function saveEditor() {
  const E = S.editor, tab = tabs().find((t) => t.id === E.tabId), d = E.d, tt = tab.kind === 'timetable';
  if (!d.title.trim()) { E.err = T('p.titleErr'); renderEditor(); return; }
  if (tt && d.end <= d.start) { E.err = T('p.endErr'); renderEditor(); return; }
  if (E._tag.trim() && !d.tags.includes(E._tag.trim())) d.tags.push(E._tag.trim());
  const pr = parseFloat(String(d.price).replace(',', '.'));
  const removed = E.original.filter((r) => !d.images.includes(r));
  if (removed.length) api.deleteImages(removed);
  const out = { title: d.title.trim(), description: d.description.trim(), images: d.images, done: d.done, tags: d.tags, checklist: d.checklist, deadline: d.deadline, client: String(d.client || '').trim(), price: isNaN(pr) ? null : pr, paid: d.paid, day: d.day, start: d.start, end: d.end, color: d.color, chartType: d.chartType, source: d.source, sourceTabId: d.sourceTabId, metric: d.metric, range: d.range || '6m', spent: parseFloat(String(d.spent).replace(',', '.')) || 0, points: (d.points || []).map((x) => ({ id: x.id, label: String(x.label || '').trim(), value: parseFloat(String(x.value).replace(',', '.')) || 0 })), updatedAt: Date.now() };
  const list = S.data.pages[E.tabId];
  if (E.id) Object.assign(list.find((p) => p.id === E.id), out);
  else { const id = uid(); list.unshift({ ...PAGE_DEFAULTS, id, createdAt: Date.now(), ...out }); S.data.orderUpdatedAt = now(); }
  S.editor = null;
  S.animKey = '';
  commit();
}
async function addImageFiles(files) {
  if (!S.editor) return;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const buf = new Uint8Array(await file.arrayBuffer());
    const ref = await api.saveImageBuffer(buf, (file.type.split('/')[1] || 'png').replace('jpeg', 'jpg'));
    if (S.editor) S.editor.d.images.push(ref); else api.deleteImages([ref]);
  }
  renderEditor();
}

/* ---------- Tab editor, settings, confirm, viewer ---------- */
function openTabEd(tab) {
  S.tabEd = { id: tab ? tab.id : null, d: tab ? { ...tab } : { name: '', color: ACC[Math.floor(Math.random() * ACC.length)], kind: 'board', startHour: 7, endHour: 22 }, err: '', first: true };
  renderTabEd();
  setTimeout(() => $('[data-tf="name"]')?.focus(), 30);
}
function renderTabEd() {
  const X = S.tabEd, el = $('#m-tab');
  if (!X) { el.innerHTML = ''; return; }
  const d = X.d, C = d.color;
  const stepper = (v, a) => `<div class="stepper"><button data-a="${a}" data-v="-1">${ic('minus', 16)}</button><span>${pad(v)}:00</span><button data-a="${a}" data-v="1">${ic('plus', 16)}</button></div>`;
  el.innerHTML = `<div class="mwrap" data-a="t-backdrop" style="z-index:55;${X.first ? '' : 'animation:none'}"><div class="modal small" style="--c:${C};border-color:${C}55;box-shadow:0 0 50px ${C}2A;${X.first ? '' : 'animation:none'}">
    <div class="mhead"><h2>${X.id ? T('tabs.edit') : T('tabs.new')}</h2><button class="iconbtn" data-a="t-close">${ic('x', 18)}</button></div>
    <div class="mbody">
      <input class="inp" data-tf="name" value="${esc(d.name)}" placeholder="${T('tabs.name')}" maxlength="32">${X.err ? `<div class="err">${X.err}</div>` : ''}
      ${!X.id ? `<div class="label">${T('tabs.type')}</div>${['board', 'timetable', 'commissions', 'payments', 'budget', 'chart'].map((k) => { const a = d.kind === k; return `<button class="kind" data-a="t-kind" data-v="${k}" style="${a ? `border-color:${C}99;background:${C}14` : ''}"><span style="color:${a ? C : 'var(--mu)'}">${ic(KIND_IC[k], 20)}</span><span style="flex:1;text-align:left"><b style="display:block;${a ? '' : 'color:var(--mu)'}">${T('kind.' + k)}</b><span style="color:var(--fa);font-size:12px">${T('kd.' + k)}</span></span></button>`; }).join('')}` : ''}
      ${d.kind === 'timetable' ? `<div class="label">${T('tabs.hours')}</div><div style="display:flex;align-items:center;gap:12px">${stepper(d.startHour, 't-hs')}<span style="color:var(--fa)">${ic('arrow', 16)}</span>${stepper(d.endHour, 't-he')}</div>` : ''}
      <div class="label">${T('tabs.color')}</div><div class="sw">${ACC.map((c) => `<button class="swb" data-a="t-color" data-v="${c}" style="${c === C ? `border-color:${c}` : ''}"><i style="background:${c};${c === C ? `box-shadow:0 0 12px ${c}` : ''}"></i></button>`).join('')}</div>
    </div>
    <div class="mfoot">${X.id && tabs().length > 1 ? `<button class="btn" data-a="t-delete" style="color:var(--dg);margin-right:auto">${ic('trash', 16)}${T('tabs.delete')}</button>` : ''}<button class="btn ghost" data-a="t-close">${T('cancel')}</button><button class="btn fillc" data-a="t-save">${X.id ? T('save') : T('create')}</button></div>
  </div></div>`;
  X.first = false;
}

function renderSettings() {
  const el = $('#m-settings');
  if (!S.settings) { el.innerHTML = ''; return; }
  const C = activeTab().color;
  const first = S.settings === 'first';
  el.innerHTML = `<div class="mwrap" data-a="s-backdrop" style="${first ? '' : 'animation:none'}"><div class="modal small" style="--c:${C};border-color:var(--bd);${first ? '' : 'animation:none'}">
    <div class="mhead"><h2 style="font-size:20px">${T('s.title')}</h2><button class="iconbtn" data-a="s-close">${ic('x', 18)}</button></div>
    <div class="mbody">
      <div class="label" style="margin-top:4px">${T('theme.title')}</div>
      <div class="seg">${THEME_NAMES.map((n) => segBtn(T('theme.' + n), (S.data.settings.theme || 'night') === n, C, 's-theme', n)).join('')}</div>
      <div class="label">${T('profile.title')}</div>
      <div class="action" style="cursor:default;gap:16px">
        <button data-a="pf-photo" title="${T('profile.change')}">
          ${S.data.profile?.photo ? `<img class="pfimg" src="${imgSrc(S.data.profile.photo)}" alt="">` : `<span class="pfimg pfempty" style="color:${C};border-color:${C}66">${ic('camera', 22)}</span>`}
        </button>
        <span style="flex:1">
          <input class="inp" data-pf="name" value="${esc(S.data.profile?.name || '')}" placeholder="${T('profile.namePh')}" maxlength="40" style="--c:${C};font-weight:700">
          <button data-a="${S.data.profile?.photo ? 'pf-rm' : 'pf-photo'}" style="color:${C};font-size:12px;font-weight:600;margin-top:8px;display:block">${S.data.profile?.photo ? T('profile.remove') : T('profile.change')}</button>
        </span>
      </div>
      <div class="label">${T('s.lang')}</div>
      <div class="seg">${segBtn('English', lang() === 'en', C, 's-lang', 'en')}${segBtn('Français', lang() === 'fr', C, 's-lang', 'fr')}</div>
      <div class="label">${T('s.sync')}</div>
      <p style="color:var(--fa);font-size:12.5px;margin:-2px 0 10px;line-height:1.5">${T('s.syncHint')}</p>
      <button class="action" data-a="s-export"><span class="aicon" style="background:${C}22;color:${C}">${ic('upload', 19)}</span><span style="flex:1;text-align:left"><b style="display:block">${T('s.export')}</b><span style="color:var(--mu);font-size:12px">${T('s.exportHint')}</span></span></button>
      <button class="action" data-a="s-import"><span class="aicon" style="background:#FBBF2422;color:#FBBF24">${ic('download', 19)}</span><span style="flex:1;text-align:left"><b style="display:block">${T('s.import')}</b><span style="color:var(--mu);font-size:12px">${T('s.importHint')}</span></span></button>
      <button class="action" data-a="s-folder"><span class="aicon" style="background:var(--s2);color:var(--mu)">${ic('folder', 19)}</span><span style="flex:1;text-align:left"><b style="display:block">${T('s.folder')}</b><span style="color:var(--mu);font-size:12px">${T('s.folderHint')}</span></span></button>
      <div class="label">${T('s.auto')}</div>
      <p style="color:var(--fa);font-size:12.5px;margin:-2px 0 10px;line-height:1.5">${T('s.autoHint')}</p>
      ${S.snaps.length ? S.snaps.map((sn) => `<button class="action" data-a="s-snap" data-v="${esc(sn.name)}" style="padding:10px 13px"><span style="color:${C}">${ic('clock', 17)}</span><span style="flex:1;text-align:left;text-transform:capitalize">${esc(snapLabel(sn.name))}</span><span style="color:var(--mu);font-size:12px">${T('s.pages', { pages: sn.pages })}</span></button>`).join('') : `<p style="color:var(--mu);font-size:13px">${T('s.autoNone')}</p>`}
      <div class="label">${T('update.section')}</div>
      <div class="action" style="cursor:default;flex-wrap:wrap">
        ${logoSVG(38, C)}
        <span style="flex:1;text-align:left"><b style="display:block">Orbit</b><span style="color:var(--mu);font-size:12px">${T('update.version', { v: esc(S.version) })}</span></span>
        <button class="btn ghost" data-a="s-news">${ic('bookmark', 15)}${T('news.see')}</button>
        <button class="btn ghost" data-a="u-check" ${S.update.checking ? 'disabled' : ''}>${S.update.checking ? `<span class="spin">${ic('refresh', 15)}</span>` : ic('refresh', 15)}${T('update.check')}</button>
      </div>
      <p class="netnote">${ic('wifi', 13)}${T('account.internet')}</p>
      <div class="label">${T('s.keys')}</div>
      <div class="kbdlist">
        <span><kbd>N</kbd></span><span>${T('k.new')}</span>
        <span><kbd>Ctrl</kbd><kbd>F</kbd></span><span>${T('k.search')}</span>
        <span><kbd>1</kbd>–<kbd>9</kbd></span><span>${T('k.tabs')}</span>
        <span><kbd>Ctrl</kbd><kbd>Enter</kbd></span><span>${T('k.save')}</span>
        <span><kbd>Esc</kbd></span><span>${T('k.esc')}</span>
      </div>

    </div>
  </div></div>`;
  S.settings = true;
}

function snapLabel(name) {
  const m = name.match(/orbit-(\d{4}-\d{2}-\d{2})(?:T(\d{2})-(\d{2}))?/);
  if (!m) return name;
  const date = new Date(`${m[1]}T12:00:00`).toLocaleDateString(loc(), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  return m[2] ? `${date}, ${m[2]}:${m[3]}` : date;
}

function renderAccount() {
  const el = $('#m-account');
  if (!S.accountOpen) { el.innerHTML = ''; return; }
  const C = activeTab().color, A_ = S.account, F = S.auth;
  const first = S.accountOpen === 'first';
  const net = `<p class="netnote" style="justify-content:center">${ic('wifi', 13)}${T('account.internet')}</p>`;
  let body;
  if (!A_.configured) {
    body = `<div class="acard">${ic('cloudOff', 30, 1.6)}<b style="margin-top:8px">${T('account.notConfigured')}</b><span style="color:var(--mu);font-size:13px">${T('account.offlineOk')}</span></div>`;
  } else if (A_.user) {
    const sc = A_.status === 'error' ? 'var(--dg)' : A_.status === 'offline' ? 'var(--wa)' : C;
    const st = A_.status === 'syncing' ? T('account.syncing') : A_.status === 'offline' ? T('account.offline') : A_.status === 'error' ? T('account.errorStatus', { msg: errText(A_.error) }) : A_.lastSync ? T('account.synced', { time: ago(A_.lastSync) }) : T('account.never');
    body = `
      <div style="display:flex;flex-direction:column;align-items:center;margin-top:6px">
        ${S.data.profile?.photo ? `<img class="avatar" style="border-color:${C}88;box-shadow:0 0 26px ${C}66;object-fit:cover" src="${imgSrc(S.data.profile.photo)}" alt="">` : `<div class="avatar" style="color:${C};border-color:${C}88;box-shadow:0 0 26px ${C}66">${esc((S.data.profile?.name || A_.user.email || '?')[0].toUpperCase())}</div>`}
        ${S.data.profile?.name ? `<b style="font-size:18px;margin-top:12px">${T('profile.hello', { name: esc(S.data.profile.name) })}</b>` : ''}
        <span style="color:var(--mu);font-size:13px;margin-top:12px">${T('account.signedInAs')}</span>
        <b style="font-size:16px;margin-top:2px">${esc(A_.user.email)}</b>
      </div>
      <div class="acard" style="align-items:stretch;text-align:left">
        <div style="display:flex;align-items:center;gap:10px">${A_.status === 'syncing' ? `<span class="spin" style="color:${C}">${ic('refresh', 16)}</span>` : `<i class="bigdot" style="background:${sc};box-shadow:0 0 10px ${sc}"></i>`}<b style="font-size:14px">${esc(st)}</b></div>
        <span style="color:var(--mu);font-size:13px;line-height:1.5">${T('account.auto')}</span>
        <button class="btn fillc" data-a="acc-sync" style="--c:${C};justify-content:center;margin-top:6px" ${A_.status === 'syncing' ? 'disabled' : ''}>${ic('refresh', 16)}${T('account.syncNow')}</button>
        ${net}
      </div>
      <button class="btn" data-a="acc-signout" style="color:var(--dg);margin:18px auto 0;display:flex">${ic('logout', 16)}${T('account.signOut')}</button>`;
  } else {
    const signUp = F.mode === 'signUp';
    const disabled = F.busy || !F.email.trim() || !F.password;
    body = `
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center">
        ${logoSVG(84, C)}
        <b style="font-size:20px;margin-top:10px;letter-spacing:-.3px">${T('account.pitch')}</b>
        <span style="color:var(--mu);font-size:13px;margin-top:6px;line-height:1.5">${T('account.pitchSub')}</span>
      </div>
      <div class="seg" style="margin-top:18px">${segBtn(T('account.signIn'), !signUp, C, 'acc-mode', 'signIn')}${segBtn(T('account.signUp'), signUp, C, 'acc-mode', 'signUp')}</div>
      <input class="inp" style="--c:${C};margin-top:14px" data-af="email" type="email" autocomplete="email" placeholder="${T('account.email')}" value="${esc(F.email)}">
      <input class="inp" style="--c:${C};margin-top:10px" data-af="password" type="password" autocomplete="${signUp ? 'new-password' : 'current-password'}" placeholder="${T('account.password')}" value="${esc(F.password)}">
      ${signUp ? `<input class="inp" style="--c:${C};margin-top:10px" data-af="confirm" type="password" autocomplete="new-password" placeholder="${T('account.confirm')}" value="${esc(F.confirm)}">` : ''}
      ${F.error ? `<div class="err">${esc(F.error)}</div>` : ''}${F.info ? `<div class="err" style="color:${C}">${esc(F.info)}</div>` : ''}
      <button class="btn fillc" data-a="acc-submit" style="--c:${C};width:100%;justify-content:center;margin-top:14px;padding:12px;${disabled ? 'opacity:.45' : ''}" ${disabled ? 'disabled' : ''}>${F.busy ? `<span class="spin">${ic('refresh', 16)}</span>` : ''}${signUp ? T('account.signUp') : T('account.signIn')}</button>
      ${signUp ? '' : `<button data-a="acc-forgot" style="display:block;margin:10px auto 0;color:${C};font-weight:600">${T('account.forgot')}</button>`}
      ${net}
      <p style="color:var(--fa);font-size:12px;text-align:center;margin-top:2px">${T('account.offlineOk')}</p>`;
  }
  el.innerHTML = `<div class="mwrap" data-a="acc-backdrop" style="${first ? '' : 'animation:none'}"><div class="modal small" style="--c:${C};border-color:${C}44;box-shadow:0 0 50px ${C}22;${first ? '' : 'animation:none'}">
    <div class="mhead"><h2 style="font-size:20px">${T('account.title')}</h2><button class="iconbtn" data-a="acc-close">${ic('x', 18)}</button></div>
    <div class="mbody">${body}</div></div></div>`;
  S.accountOpen = true;
}

function renderUpdate() {
  const el = $('#m-update'), U = S.update;
  if (!U.open) { el.innerHTML = ''; return; }
  const C = activeTab().color;
  const busy = U.state === 'downloading' || U.state === 'ready';
  el.innerHTML = `<div class="mwrap" style="z-index:65"><div class="modal small" style="--c:${C};border-color:${C}55;box-shadow:0 0 60px ${C}33;text-align:center">
    <div class="mbody" style="padding-top:26px;display:flex;flex-direction:column;align-items:center">
      ${logoSVG(80, C)}
      <h2 style="font-size:21px;font-weight:800;margin-top:12px">${T('update.title')}</h2>
      <p style="color:var(--mu);margin-top:8px;line-height:1.55">${T('update.body', { v: esc(U.version || '') })}</p>
      ${U.state === 'downloading' ? `<div class="track" style="width:100%;margin-top:16px"><div class="fill" style="width:${U.percent}%;background:${C};box-shadow:0 0 10px ${C}"></div></div><span style="color:var(--mu);font-size:12.5px;margin-top:6px">${T('update.downloading', { p: U.percent })}</span>` : ''}
      ${U.state === 'ready' ? `<span style="color:${C};font-size:13px;margin-top:12px">${T('update.installing')}</span>` : ''}
      ${U.state === 'error' ? `<div class="err">${T('update.failed')}</div>` : ''}
      <p class="netnote" style="justify-content:center;margin-top:12px">${ic('wifi', 13)}${T('account.internet')}</p>
    </div>
    <div class="mfoot" style="justify-content:stretch">
      <button class="btn ghost" data-a="u-later" style="flex:1;justify-content:center" ${busy ? 'disabled' : ''}>${T('update.later')}</button>
      <button class="btn fillc" data-a="u-now" style="flex:1;justify-content:center" ${busy ? 'disabled' : ''}>${busy ? `<span class="spin">${ic('refresh', 15)}</span>` : ''}${T('update.now')}</button>
    </div>
  </div></div>`;
}

function askConfirm(title, msg, okLabel, ok) { S.confirm = { title, msg, okLabel, ok }; renderConfirm(); }
function renderConfirm() {
  const c = S.confirm, el = $('#confirm');
  if (!c) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="mwrap" style="z-index:60"><div class="modal small" style="border-color:#FF4D6D55;box-shadow:0 0 40px #FF4D6D22">
    <div class="mbody" style="padding-top:22px"><h2 style="font-size:18px;font-weight:700">${esc(c.title)}</h2><p style="color:var(--mu);margin-top:8px;line-height:1.5">${esc(c.msg)}</p></div>
    <div class="mfoot"><button class="btn ghost" data-a="c-no">${T('cancel')}</button><button class="btn red" data-a="c-ok">${esc(c.okLabel || T('delete'))}</button></div>
  </div></div>`;
}

function renderMove() {
  const el = $('#m-move');
  if (!S.moveOpen) { el.innerHTML = ''; return; }
  const C = activeTab().color;
  el.innerHTML = `<div class="mwrap" style="z-index:58"><div class="modal small" style="--c:${C}">
    <div class="mhead"><h2>${T('p.move')}</h2><button class="iconbtn" data-a="mv-close">${ic('x', 18)}</button></div>
    <div class="mbody">${S.moveOpen.map((x) => `<button class="kind" data-a="mv-pick" data-id="${x.id}"><i class="dot" style="background:${x.color}"></i><span style="flex:1;text-align:left">${esc(x.name)}</span>${ic('next', 16)}</button>`).join('')}</div>
  </div></div>`;
}

function renderOverview() {
  const el = $('#m-overview');
  if (!S.overviewOpen) { el.innerHTML = ''; return; }
  const C = activeTab().color, DAY = 86400000;
  const nowD = new Date(), nowMin = nowD.getHours() * 60 + nowD.getMinutes(), today = todayIdx();
  const slots = [], deadlines = [];
  tabs().forEach((tab) => (S.data.pages[tab.id] || []).forEach((p) => {
    if (tab.kind === 'timetable') { if (p.day === today && p.end > nowMin) slots.push({ tab, p }); }
    else if (!p.done && p.deadline != null && p.deadline - Date.now() < 7 * DAY) deadlines.push({ tab, p });
  }));
  slots.sort((a, b) => a.p.start - b.p.start);
  deadlines.sort((a, b) => a.p.deadline - b.p.deadline);
  const m = moneyTotals();
  const hasMoney = tabs().some((t) => isMoneyKind(t.kind));
  const until = (start) => { const mins = start - nowMin; return mins <= 0 ? T('overview.now') : T('overview.in', { v: mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')}` }); };
  const dayText = (ts) => { const n = Math.round((new Date(ts).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / DAY); return n < 0 ? T('due.late', { n: -n }) : n === 0 ? T('due.today') : n === 1 ? T('due.tomorrow') : T('due.in', { n }); };
  const row = (tabId, pageId, inner) => `<button class="action" data-a="ov-open" data-tab="${tabId}" data-id="${pageId}" style="margin-bottom:8px">${inner}</button>`;
  el.innerHTML = `<div class="mwrap"><div class="modal" style="--c:${C}">
    <div class="mhead"><h2 style="font-size:20px;text-transform:capitalize">${T('overview.title')}</h2><button class="iconbtn" data-a="ov-close">${ic('x', 18)}</button></div>
    <div class="mbody">
      ${slots.length ? `<div class="label" style="margin-top:2px">${T('overview.next')}</div>${slots.slice(0, 6).map(({ tab, p }) => row(tab.id, p.id, `
        <span class="ovtime" style="background:${(p.color || tab.color)}22;color:${p.color || tab.color}">${fmt(p.start)}</span>
        <span style="flex:1;text-align:left"><b style="display:block">${esc(p.title)}</b><span style="color:var(--mu);font-size:12.5px">${until(p.start)}</span></span>`)).join('')}` : ''}
      ${deadlines.length ? `<div class="label">${T('overview.deadlines')}</div>${deadlines.slice(0, 8).map(({ tab, p }) => { const late = p.deadline < Date.now(); return row(tab.id, p.id, `
        <span style="color:${late ? 'var(--dg)' : 'var(--wa)'}">${ic('flag', 18)}</span>
        <span style="flex:1;text-align:left"><b style="display:block">${esc(p.title)}</b><span style="color:${late ? 'var(--dg)' : 'var(--mu)'};font-size:12.5px">${dayText(p.deadline)} · ${esc(tab.name)}</span></span>`); }).join('')}` : ''}
      ${hasMoney ? `<div class="label">${T('overview.money')}</div>
        <div style="display:flex;gap:10px">
          <div class="ovmoney" style="border-color:${C}55"><span>${T('overview.earned')}</span><b style="color:${C}">${money(m.toReceive)}</b></div>
          <div class="ovmoney" style="border-color:#FF4D6D44"><span>${T('overview.owed')}</span><b style="color:var(--dg)">${money(m.toPay)}</b></div>
        </div>
        <div class="ovmoney" style="margin-top:10px;border-color:${m.balance < 0 ? '#FBBF24' : '#34D399'}55"><span>${T('flow.balance')}</span><b style="color:${m.balance < 0 ? '#FBBF24' : '#34D399'}">${money(m.balance)}</b></div>` : ''}
      ${!slots.length && !deadlines.length && !hasMoney ? `<p style="color:var(--mu);text-align:center;padding:40px 0">${T('overview.empty')}</p>` : ''}
    </div>
  </div></div>`;
}

const BUILD = 9;
const CHANGELOG = [
  { build: 9, date: '2026-09-18',
    fr: ["Onglet Dépenses retiré : les budgets enregistrent les dépenses, avec leur date", "Courbe de l'argent façon bourse : chaque entrée monte, chaque dépense descend", "Graphique « + / − par période », plus de solde inutile", "Plus de case « à faire » sur les budgets et les graphiques", 'Thèmes : Nuit, Encre et Clair', 'Ce journal des nouveautés'],
    en: ['Spending tab removed: budgets record spending with a date', 'Money curve like a stock chart', '"+ / − per period" chart, no more useless balance', 'No more "to do" checkbox on budgets and charts', 'Themes: Night, Ink and Light', 'This update log'] },
  { build: 8, date: '2026-09-18', fr: ['Budgets avec dépenses datées', 'Périodes 12 mois, 6 mois, 30 jours, 7 jours'], en: ['Budgets with dated spending', '12 months, 6 months, 30 days, 7 days ranges'] },
  { build: 6, date: '2026-09-17', fr: ['Recherche dans tous les onglets', "Vue d'ensemble du jour", 'Dupliquer et déplacer une page', 'Modèles de page'], en: ['Search across every tab', 'Today overview', 'Duplicate and move a page', 'Page templates'] },
  { build: 2, date: '2026-09-17', fr: ['Onglets Paiements et Graphiques', 'Profil avec nom et photo'], en: ['Payments and Charts tabs', 'Profile with name and photo'] },
];

function renderNews() {
  const el = $('#m-news');
  if (!S.newsOpen) { el.innerHTML = ''; return; }
  const C = activeTab().color;
  const since = S.newsOpen === 'new' ? (S.data.settings.seenBuild || 0) : 0;
  const list = CHANGELOG.filter((c) => c.build > since);
  el.innerHTML = `<div class="mwrap" style="z-index:62"><div class="modal" style="--c:${C};border-color:${C}44">
    <div class="mhead"><h2 style="font-size:20px">${T('news.title')}</h2><button class="iconbtn" data-a="news-close">${ic('x', 18)}</button></div>
    <div class="mbody">
      ${(list.length ? list : CHANGELOG).map((c, i) => `<div class="newscard" style="${i === 0 ? `border-color:${C}55` : ''}">
        <div class="newshead"><b style="color:${C}">${T('news.build', { b: c.build })}</b><span style="color:var(--fa);font-size:12.5px">${new Date(c.date).toLocaleDateString(loc(), { day: 'numeric', month: 'long' })}</span></div>
        ${(c[lang()] || c.en).map((x) => `<div class="newsitem"><i style="background:${C}"></i><span>${esc(x)}</span></div>`).join('')}
      </div>`).join('')}
    </div></div></div>`;
}

function renderViewer() {
  const v = S.viewer, el = $('#viewer');
  if (!v) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="viewer" data-a="v-close">
    <div class="vtop"><span style="opacity:.8">${v.i + 1} / ${v.imgs.length}</span><button class="vbtn" style="position:static;transform:none;width:40px;height:40px" data-a="v-close">${ic('x', 20)}</button></div>
    ${v.imgs.length > 1 ? `<button class="vbtn" style="left:24px" data-a="v-prev">${ic('back', 24)}</button><button class="vbtn" style="right:24px" data-a="v-next">${ic('next', 24)}</button>` : ''}
    <img src="${imgSrc(v.imgs[v.i])}" alt="" data-a="v-noop">
  </div>`;
}

/* ---------- Actions ---------- */
function toggleDetail(id) { S.detailId = S.detailId === id ? null : id; S.detailAnim = true; renderPanel(); renderBody(); }
const A = {
  'tab-select': (d) => { if (S.data.activeTabId === d.id) return; S.data.activeTabId = d.id; S.filter = 'all'; S.search = ''; S.detailId = null; commit(); },
  'tab-edit': (d) => openTabEd(tabs().find((t) => t.id === d.id)),
  'tab-new': () => openTabEd(null),
  settings: async () => { S.settings = 'first'; try { S.snaps = await api.listSnapshots(); } catch (e) { S.snaps = []; } renderSettings(); },
  filter: (d) => { S.filter = d.v; renderMain(); },
  view: (d) => { S.view = d.v; renderMain(); },
  day: (d) => { S.day = +d.v; renderMain(); },
  new: () => {
    const tab = activeTab();
    let df = {};
    if (tab.kind === 'timetable') { const h = Math.min(Math.max(new Date().getHours() + 1, tab.startHour), tab.endHour - 1); df = { day: S.view === 'day' ? S.day : todayIdx(), start: h * 60, end: (h + 1) * 60 }; }
    openEditor(tab.id, null, df);
  },
  slot: (d) => { const h = +d.h; openEditor(activeTab().id, null, { day: +d.day, start: h * 60, end: Math.min((h + 1) * 60, 1439) }); },
  open: (d) => {
    const f = findPage(d.id);
    if (f && f.tabId !== S.data.activeTabId) { S.data.activeTabId = f.tabId; S.globalSearch = false; S.search = ''; S.detailId = d.id; S.detailAnim = true; commit(); return; }
    toggleDetail(d.id);
  },
  toggle: (d) => { const f = findPage(d.id); f.p.done = !f.p.done; f.p.updatedAt = Date.now(); S.popId = d.id; commit(); },
  'd-close': () => { S.detailId = null; renderPanel(); renderBody(); },
  'd-toggle': () => { const f = findPage(S.detailId); f.p.done = !f.p.done; f.p.updatedAt = now(); S.popId = 'd' + f.p.id; commit(); },
  'd-paid': () => { const f = findPage(S.detailId); f.p.paid = !f.p.paid; f.p.updatedAt = now(); S.popId = 'p' + f.p.id; commit(); },
  'd-item': (d) => { const f = findPage(S.detailId); const c = f.p.checklist.find((x) => x.id === d.id); c.done = !c.done; f.p.updatedAt = now(); S.popId = d.id; commit(); },
  'd-edit': () => { const f = findPage(S.detailId); openEditor(f.tabId, f.p); },
  'd-spend': () => {
    const el = document.getElementById('spendAmount');
    const value = parseFloat(String(el && el.value).replace(',', '.'));
    if (!isFinite(value) || value <= 0) return;
    const f = findPage(S.detailId);
    const base = entriesOf(f.p).length ? entriesOf(f.p) : (f.p.spent ? [{ id: uid(), amount: f.p.spent, date: f.p.createdAt ?? now(), label: '' }] : []);
    f.p.entries = [...base, { id: uid(), amount: value, date: now(), label: '' }];
    f.p.updatedAt = now();
    commit();
  },
  'd-unspend': (d) => {
    const f = findPage(S.detailId);
    f.p.entries = entriesOf(f.p).filter((e) => e.id !== d.id);
    f.p.updatedAt = now();
    commit();
  },
  'd-duplicate': () => {
    const f = findPage(S.detailId);
    const copy = { ...f.p, id: uid(), title: T('p.copy', { title: f.p.title }), images: [], createdAt: now(), updatedAt: now() };
    S.data.pages[f.tabId].unshift(copy);
    S.data.orderUpdatedAt = now();
    S.detailId = copy.id;
    S.animKey = '';
    commit();
  },
  'd-move': () => {
    const f = findPage(S.detailId);
    const tab = tabs().find((t) => t.id === f.tabId);
    const targets = tabs().filter((x) => x.kind === tab.kind && x.id !== tab.id);
    if (!targets.length) { toast(T('p.noTarget')); return; }
    S.moveOpen = targets.map((x) => ({ id: x.id, name: x.name, color: x.color }));
    renderMove();
  },
  'mv-close': () => { S.moveOpen = null; renderMove(); },
  'mv-pick': (d) => {
    const f = findPage(S.detailId);
    const target = tabs().find((x) => x.id === d.id);
    S.data.pages[f.tabId] = S.data.pages[f.tabId].filter((x) => x.id !== f.p.id);
    S.data.pages[d.id] = [{ ...f.p, updatedAt: now() }, ...(S.data.pages[d.id] || [])];
    S.data.orderUpdatedAt = now();
    S.moveOpen = null;
    S.detailId = null;
    S.animKey = '';
    commit();
    renderMove();
    toast(T('p.moved', { tab: target ? target.name : '' }));
  },
  overview: () => { S.overviewOpen = true; renderOverview(); },
  'ov-close': () => { S.overviewOpen = false; renderOverview(); },
  'ov-open': (d) => {
    S.overviewOpen = false; renderOverview();
    S.data.activeTabId = d.tab; S.filter = 'all'; S.search = ''; S.detailId = d.id; S.detailAnim = true;
    commit();
  },
  'search-global': () => { S.globalSearch = !S.globalSearch; renderMain(); setTimeout(() => { const el = $('#search'); if (el) el.focus(); }, 30); },
  'd-delete': () => {
    const f = findPage(S.detailId);
    askConfirm(T('p.delTitle'), T('p.delMsg', { t: f.p.title }), T('delete'), () => {
      api.deleteImages(f.p.images);
      S.data.pages[f.tabId] = S.data.pages[f.tabId].filter((p) => p.id !== f.p.id);
      tomb('pages', f.p.id);
      S.detailId = null; S.animKey = ''; commit();
    });
  },
  'view-img': (d) => { const f = findPage(S.detailId); S.viewer = { imgs: f.p.images, i: +d.i }; renderViewer(); },
  'v-close': () => { S.viewer = null; renderViewer(); },
  'v-prev': () => { const v = S.viewer; v.i = (v.i - 1 + v.imgs.length) % v.imgs.length; renderViewer(); },
  'v-next': () => { const v = S.viewer; v.i = (v.i + 1) % v.imgs.length; renderViewer(); },
  'v-noop': () => {},
  'e-backdrop': (d, t, e) => { if (e.target === t) closeEditor(); },
  'e-close': () => closeEditor(),
  'e-save': () => saveEditor(),
  'e-day': (d) => { S.editor.d.day = +d.v; renderEditor(); },
  'e-color': (d) => { S.editor.d.color = d.v; renderEditor(); },
  'e-paid': () => { S.editor.d.paid = !S.editor.d.paid; S.popId = 'ep'; renderEditor(); },
  'e-done': () => { S.editor.d.done = !S.editor.d.done; S.popId = 'ed'; renderEditor(); },
  'e-dl-clear': () => { S.editor.d.deadline = null; renderEditor(); },
  'e-tag-rm': (d) => { S.editor.d.tags = S.editor.d.tags.filter((t) => t !== d.v); renderEditor(); },
  'e-item': (d) => { const c = S.editor.d.checklist.find((x) => x.id === d.id); c.done = !c.done; S.popId = d.id; renderEditor(); },
  'e-item-rm': (d) => { S.editor.d.checklist = S.editor.d.checklist.filter((x) => x.id !== d.id); renderEditor(); },
  'e-ctype': (d) => { S.editor.d.chartType = d.v; renderEditor(); },
  'e-csource': (d) => { S.editor.d.source = d.v; renderEditor(); },
  'e-ctab': (d) => { S.editor.d.sourceTabId = d.v; renderEditor(); },
  'e-cmetric': (d) => { S.editor.d.metric = d.v; renderEditor(); },
  'e-crange': (d) => { S.editor.d.range = d.v; renderEditor(); },
  'e-tpl': (d) => {
    const tpl = (S.data.templates || []).find((x) => x.id === d.id);
    if (!tpl) return;
    Object.assign(S.editor.d, tpl.page, { price: tpl.page.price != null ? String(tpl.page.price) : '', images: [] });
    renderEditor();
  },
  'e-tpl-save': () => {
    const d = S.editor.d, tab = tabs().find((t) => t.id === S.editor.tabId);
    const { images, ...rest } = d;
    const name = (d.title || '').trim() || tab.name;
    S.data.templates = [...(S.data.templates || []), { id: uid(), name, kind: tab.kind, page: { ...rest, price: parseFloat(String(d.price).replace(',', '.')) || null, images: [] } }];
    persist();
    toast(T('tpl.saved'));
    renderEditor();
  },
  'e-cpoint-add': () => { S.editor.d.points = [...(S.editor.d.points || []), { id: uid(), label: '', value: '' }]; renderEditor(); },
  'e-cpoint-rm': (d) => { S.editor.d.points = S.editor.d.points.filter((x) => x.id !== d.id); renderEditor(); },
  'e-img-add': async () => { const refs = await api.pickImages(); if (!S.editor) { api.deleteImages(refs); return; } S.editor.d.images.push(...refs); renderEditor(); },
  'e-img-rm': (d) => {
    const E = S.editor, [ref] = E.d.images.splice(+d.i, 1);
    if (ref && !E.original.includes(ref)) api.deleteImages([ref]);
    renderEditor();
  },
  't-backdrop': (d, t, e) => { if (e.target === t) { S.tabEd = null; renderTabEd(); } },
  't-close': () => { S.tabEd = null; renderTabEd(); },
  't-kind': (d) => { S.tabEd.d.kind = d.v; renderTabEd(); },
  't-color': (d) => { S.tabEd.d.color = d.v; renderTabEd(); },
  't-hs': (d) => { const x = S.tabEd.d; x.startHour = Math.max(0, Math.min(x.endHour - 1, x.startHour + +d.v)); renderTabEd(); },
  't-he': (d) => { const x = S.tabEd.d; x.endHour = Math.min(24, Math.max(x.startHour + 1, x.endHour + +d.v)); renderTabEd(); },
  't-save': () => {
    const X = S.tabEd, d = X.d;
    if (!d.name.trim()) { X.err = T('tabs.nameErr'); renderTabEd(); return; }
    if (X.id) Object.assign(tabs().find((t) => t.id === X.id), { name: d.name.trim(), color: d.color, startHour: d.startHour, endHour: d.endHour, updatedAt: now() });
    else { const id = uid(); tabs().push({ id, name: d.name.trim(), color: d.color, kind: d.kind, startHour: d.startHour, endHour: d.endHour, updatedAt: now() }); S.data.pages[id] = []; S.data.orderUpdatedAt = now(); S.data.activeTabId = id; S.filter = 'all'; S.search = ''; S.detailId = null; }
    S.tabEd = null; commit();
  },
  't-delete': () => {
    const X = S.tabEd, n = S.data.pages[X.id].length;
    askConfirm(T('tabs.deleteTitle'), T('tabs.deleteMsg', { n }), T('delete'), () => {
      api.deleteImages(S.data.pages[X.id].flatMap((p) => p.images));
      tomb('tabs', X.id); S.data.pages[X.id].forEach((p) => tomb('pages', p.id)); S.data.orderUpdatedAt = now();
      S.data.tabs = tabs().filter((t) => t.id !== X.id);
      delete S.data.pages[X.id];
      if (S.data.activeTabId === X.id) S.data.activeTabId = tabs()[0].id;
      if (S.detailId && !findPage(S.detailId)) S.detailId = null;
      S.tabEd = null; commit();
    });
  },
  'c-no': () => { S.confirm = null; renderConfirm(); },
  'c-ok': () => { const c = S.confirm; S.confirm = null; renderConfirm(); c.ok(); },
  's-backdrop': (d, t, e) => { if (e.target === t) { S.settings = false; renderSettings(); } },
  's-close': () => { S.settings = false; renderSettings(); },
  's-theme': (d) => { S.data.settings.theme = d.v; applyTheme(d.v); commit(); renderSettings(); },
  's-news': () => { S.newsOpen = true; renderNews(); },
  'news-close': () => { S.newsOpen = false; S.data.settings.seenBuild = BUILD; persist(); renderNews(); },
  's-lang': (d) => { S.data.settings.language = d.v; document.documentElement.lang = d.v; commit(); },
  's-export': async () => { const r = await api.exportBackup(S.data); if (r?.path) toast(T('s.exported')); },
  's-import': () => askConfirm(T('s.importTitle'), T('s.importMsg'), T('s.replace'), async () => {
    const r = await api.importBackup();
    if (!r || r.canceled) return;
    if (r.error) { toast(T('s.invalid')); return; }
    await api.snapshotNow(S.data, 'before-import');
    const keepLang = lang();
    const prev = S.data;
    S.data = migrate(r.data);
    Object.assign(S.data, Cloud.stampReplacement(syncPart(prev), syncPart(S.data), now()));
    S.data.settings.language = keepLang;
    S.detailId = null; S.filter = 'all'; S.search = ''; S.animKey = '';
    commit();
    toast(T('s.imported'));
  }),
  's-folder': () => api.openDataFolder(),
  'pf-photo': async () => {
    const refs = await api.pickImages();
    if (!refs.length) return;
    const old = S.data.profile?.photo;
    S.data.profile = { ...(S.data.profile || {}), photo: refs[0] };
    S.data.profileUpdatedAt = now();
    if (old) api.deleteImages([old]);
    commit(); renderSettings();
  },
  'pf-rm': () => {
    const old = S.data.profile?.photo;
    S.data.profile = { ...(S.data.profile || {}), photo: null };
    S.data.profileUpdatedAt = now();
    if (old) api.deleteImages([old]);
    commit(); renderSettings();
  },
  account: () => { S.accountOpen = 'first'; S.auth.error = ''; S.auth.info = ''; renderAccount(); },
  'acc-close': () => { S.accountOpen = false; renderAccount(); },
  'acc-backdrop': (d, t, e) => { if (e.target === t) { S.accountOpen = false; renderAccount(); } },
  'acc-mode': (d) => { S.auth.mode = d.v; S.auth.error = ''; S.auth.info = ''; renderAccount(); },
  'acc-submit': async () => {
    const F = S.auth;
    F.error = ''; F.info = '';
    if (F.mode === 'signUp' && F.password !== F.confirm) { F.error = T('account.mismatch'); renderAccount(); return; }
    F.busy = true; renderAccount();
    try {
      const user = F.mode === 'signIn' ? await cloud.signIn(F.email, F.password) : await cloud.signUp(F.email, F.password);
      F.password = ''; F.confirm = '';
      preferRemote = F.mode === 'signIn';
      S.account.user = user;
      F.busy = false;
      setAccount({ error: null });
      runSync();
    } catch (e) {
      F.busy = false;
      F.error = errText((e && e.code) || 'UNKNOWN');
      renderAccount();
    }
  },
  'acc-forgot': async () => {
    const F = S.auth;
    F.error = ''; F.info = '';
    if (!F.email.trim()) { F.error = T('account.needEmail'); renderAccount(); return; }
    try { await cloud.resetPassword(F.email); F.info = T('account.resetSent', { email: F.email.trim() }); } catch (e) { F.error = errText((e && e.code) || 'UNKNOWN'); }
    renderAccount();
  },
  'acc-sync': () => runSync(),
  'acc-signout': () => askConfirm(T('account.signOutTitle'), T('account.signOutMsg'), T('account.signOut'), async () => {
    await cloud.signOut();
    clearTimeout(syncTimer);
    try { localStorage.removeItem('orbit.lastSync'); } catch (e) {}
    setAccount({ user: null, status: 'idle', lastSync: null, error: null });
  }),
  'u-check': async () => {
    S.update.checking = true; renderSettings();
    const r = await api.updateCheck();
    S.update.checking = false; renderSettings();
    if (r.state === 'available') { Object.assign(S.update, { open: true, state: 'available', version: r.version, percent: 0 }); renderUpdate(); }
    else if (r.state === 'none') toast(T('update.upToDate'));
    else if (r.state === 'dev') toast(T('update.dev'));
    else toast(T('update.failed'));
  },
  'u-later': () => { S.update.open = false; renderUpdate(); },
  'u-now': async () => {
    Object.assign(S.update, { state: 'downloading', percent: 0 }); renderUpdate();
    const ok = await api.updateDownload();
    if (!ok) { S.update.state = 'error'; renderUpdate(); }
  },
  's-snap': (d) => {
    const sn = S.snaps.find((x) => x.name === d.v); if (!sn) return;
    askConfirm(T('s.restoreTitle'), T('s.restoreMsg', { tabs: sn.tabs, pages: sn.pages, date: snapLabel(sn.name) }), T('s.restore'), async () => {
      const data = await api.readSnapshot(sn.name);
      await api.snapshotNow(S.data, 'before-restore');
      const keepLang = lang();
      const prev = S.data;
      S.data = migrate(data);
      Object.assign(S.data, Cloud.stampReplacement(syncPart(prev), syncPart(S.data), now()));
      S.data.settings.language = keepLang;
      S.detailId = null; S.filter = 'all'; S.search = ''; S.animKey = '';
      commit(); toast(T('s.restored'));
      S.snaps = await api.listSnapshots(); renderSettings();
    });
  },
};

document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-a]');
  if (!t) return;
  const fn = A[t.dataset.a];
  if (fn) { e.stopPropagation(); fn(t.dataset, t, e); }
});

document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'search') { S.search = t.value; renderBody(); return; }
  if (t.dataset.tf && S.tabEd) { S.tabEd.d.name = t.value; return; }
  if (t.dataset.pf) {
    S.data.profile = { ...(S.data.profile || {}), name: t.value };
    S.data.profileUpdatedAt = now();
    persist();
    renderSide();
    return;
  }
  if (t.dataset.cf && S.editor) {
    const pt = (S.editor.d.points || []).find((x) => x.id === t.dataset.id);
    if (pt) pt[t.dataset.cf] = t.value;
    return;
  }
  if (t.dataset.af) {
    S.auth[t.dataset.af] = t.value;
    const btn = document.querySelector('[data-a="acc-submit"]');
    if (btn) { const dis = S.auth.busy || !S.auth.email.trim() || !S.auth.password; btn.disabled = dis; btn.style.opacity = dis ? '.45' : ''; }
    return;
  }
  const f = t.dataset.f;
  if (!f || !S.editor) return;
  const E = S.editor, d = E.d;
  if (f === 'start' || f === 'end') { if (t.value) { const [a, b] = t.value.split(':'); d[f] = +a * 60 + +b; } }
  else if (f === 'deadline') { if (t.value) { const [y, m, dd] = t.value.split('-'); d.deadline = new Date(+y, +m - 1, +dd, 12).getTime(); } else d.deadline = null; }
  else if (f === '_tag') { E._tag = t.value; if (t.value.endsWith(',')) addTag(); }
  else if (f === '_item') E._item = t.value;
  else d[f] = t.value;
});
document.addEventListener('change', (e) => { if (e.target.dataset.f === 'deadline' && S.editor) renderEditor(); });

document.addEventListener('keydown', (e) => {
  const tag = e.target.tagName, typing = tag === 'INPUT' || tag === 'TEXTAREA';
  if (e.key === 'Escape') {
    if (S.viewer) return A['v-close']();
    if (S.confirm) return A['c-no']();
    if (S.update.open && !['downloading', 'ready'].includes(S.update.state)) return A['u-later']();
    if (S.accountOpen) return A['acc-close']();
    if (S.tabEd) return A['t-close']();
    if (S.editor) return closeEditor();
    if (S.settings) return A['s-close']();
    if (typing && e.target.id === 'search') { S.search = ''; renderMain(); return; }
    if (S.detailId) return A['d-close']();
    return;
  }
  if (S.viewer) { if (e.key === 'ArrowLeft') A['v-prev'](); if (e.key === 'ArrowRight') A['v-next'](); return; }
  if (S.editor) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); saveEditor(); return; }
    if (e.key === 'Enter' && e.target.dataset.f === '_tag') { e.preventDefault(); addTag(); return; }
    if (e.key === 'Enter' && e.target.dataset.f === '_item') { e.preventDefault(); addItem(); return; }
    if (e.key === 'Enter' && e.target.dataset.f === 'title') { e.preventDefault(); return; }
    return;
  }
  if (S.tabEd) { if (e.key === 'Enter') { e.preventDefault(); A['t-save'](); } return; }
  if (S.accountOpen) { if (e.key === 'Enter' && e.target.dataset.af) { e.preventDefault(); A['acc-submit'](); } return; }
  if (S.update.open) return;
  if (S.confirm) { if (e.key === 'Enter') { e.preventDefault(); A['c-ok'](); } return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { const s = $('#search'); if (s) { e.preventDefault(); s.focus(); s.select(); } return; }
  if (typing || e.ctrlKey || e.metaKey || e.altKey || S.settings) return;
  if (e.key.toLowerCase() === 'n') { e.preventDefault(); A.new(); return; }
  if (/^[1-9]$/.test(e.key)) { const t = tabs()[+e.key - 1]; if (t) A['tab-select']({ id: t.id }); }
});

/* Paste and drop images into the editor */
document.addEventListener('paste', (e) => {
  if (!S.editor) return;
  const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); addImageFiles(files); }
});

/* Drag and drop: cards, tabs, image files */
document.addEventListener('dragstart', (e) => {
  const card = e.target.closest?.('[data-drag-page]');
  const tab = e.target.closest?.('[data-tab-index]');
  if (card) { S.dragPage = card.dataset.dragPage; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
  else if (tab) { S.dragTab = +tab.dataset.tabIndex; tab.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
});
document.addEventListener('dragover', (e) => {
  const isFiles = [...(e.dataTransfer?.types || [])].includes('Files');
  if (isFiles) { e.preventDefault(); const z = e.target.closest?.('#dropzone'); document.querySelectorAll('.drop.over').forEach((x) => x !== z && x.classList.remove('over')); if (z) z.classList.add('over'); return; }
  const card = e.target.closest?.('[data-drag-page]');
  const tab = e.target.closest?.('[data-tab-index]');
  if ((S.dragPage && card) || (S.dragTab != null && tab)) {
    e.preventDefault();
    document.querySelectorAll('.over').forEach((x) => x.classList.remove('over'));
    (card || tab).classList.add('over');
  }
});
document.addEventListener('dragleave', (e) => { if (e.target.classList?.contains('over') && !e.target.contains(e.relatedTarget)) e.target.classList.remove('over'); });
document.addEventListener('drop', (e) => {
  const isFiles = [...(e.dataTransfer?.types || [])].includes('Files');
  if (isFiles) {
    e.preventDefault();
    document.querySelectorAll('.drop.over').forEach((x) => x.classList.remove('over'));
    if (S.editor) addImageFiles([...e.dataTransfer.files]);
    return;
  }
  const card = e.target.closest?.('[data-drag-page]');
  const tab = e.target.closest?.('[data-tab-index]');
  if (S.dragPage && card) {
    e.preventDefault();
    const list = S.data.pages[activeTab().id];
    const from = list.findIndex((p) => p.id === S.dragPage), to = list.findIndex((p) => p.id === card.dataset.dragPage);
    if (from > -1 && to > -1 && from !== to) { moveItem(list, from, to); S.data.orderUpdatedAt = now(); commit(); }
  } else if (S.dragTab != null && tab) {
    e.preventDefault();
    const to = +tab.dataset.tabIndex;
    if (to !== S.dragTab) { moveItem(S.data.tabs, S.dragTab, to); S.data.orderUpdatedAt = now(); commit(); }
  }
});
document.addEventListener('dragend', () => {
  S.dragPage = null; S.dragTab = null;
  document.querySelectorAll('.dragging,.over').forEach((x) => x.classList.remove('dragging', 'over'));
});

/* Refresh the "now" line in the timetable */
setInterval(() => { if (activeTab().kind === 'timetable' && !S.editor) { const b = $('#body'), st = b.scrollTop; renderBody(); b.classList.remove('anim'); b.scrollTop = st; } }, 60000);

/* ---------- Intro ---------- */
function playIntro() {
  const el = $('#intro');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.innerHTML = `<div class="intro" id="introInner">
    <div class="iglow">${[1, 0.78, 0.56, 0.36].map((l) => `<i style="width:${420 * l}px;height:${420 * l}px"></i>`).join('')}</div>
    ${logoSVG(170, '#22D3EE', { intro: true })}
    <div class="word">Orbit</div>
  </div>`;
  const inner = $('#introInner');
  setTimeout(() => inner && inner.classList.add('sat-on'), 600);
  const done = () => { el.innerHTML = ''; };
  inner.addEventListener('click', () => { inner.style.animation = 'introOut .25s ease-in forwards'; setTimeout(done, 260); });
  setTimeout(done, 2400);
}

/* ---------- Boot ---------- */
(async function boot() {
  playIntro();
  S.data = migrate(await api.load());
  document.documentElement.lang = lang();
  try { S.version = await api.version(); } catch (e) {}
  S.account.configured = cloud.configured;
  try { S.account.user = await cloud.user(); } catch (e) {}
  let last = 0;
  try { last = +localStorage.getItem('orbit.lastSync'); } catch (e) {}
  S.account.lastSync = last || null;
  applyTheme(S.data.settings.theme || 'night');
  renderAll();
  persist(true);
  if (!S.data.settings.seenBuild) { S.data.settings.seenBuild = BUILD; persist(true); }
  else if (S.data.settings.seenBuild < BUILD) { setTimeout(() => { S.newsOpen = 'new'; renderNews(); }, 900); }
  if (S.account.user) runSync();
  api.onUpdateStatus((p) => {
    Object.assign(S.update, p);
    if (p.state === 'ready') { clearTimeout(saveTimer); try { api.saveSync(S.data); } catch (e) {} api.updateInstall(); }
    renderUpdate();
  });
  setTimeout(async () => {
    const r = await api.updateCheck();
    if (r.state === 'available') { Object.assign(S.update, { open: true, state: 'available', version: r.version, percent: 0 }); renderUpdate(); }
  }, 2500);
  setInterval(() => { if (S.accountOpen) renderAccount(); }, 30000);
})();
