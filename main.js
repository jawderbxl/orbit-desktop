// Orbit desktop : processus principal (fichiers locaux, images, sauvegardes). Aucun accès réseau.
const { app, BrowserWindow, ipcMain, dialog, protocol, net, shell, Menu, nativeImage, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([
  { scheme: 'orbit-file', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const PREFIX = 'orbit-img://'; // même format de référence que les sauvegardes mobiles
let DATA_DIR, DATA_FILE, IMG_DIR, win;

function ensureDirs() {
  DATA_DIR = app.getPath('userData');
  DATA_FILE = path.join(DATA_DIR, 'orbit-data.json');
  IMG_DIR = path.join(DATA_DIR, 'images');
  fs.mkdirSync(IMG_DIR, { recursive: true });
}

const newName = (ext) => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
function safeExt(e) {
  e = String(e || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (e === 'jpeg') return 'jpg';
  return ['jpg', 'png', 'gif', 'webp', 'bmp'].includes(e) ? e : 'jpg';
}
function writeImage(buf, ext) {
  const name = newName(safeExt(ext));
  fs.writeFileSync(path.join(IMG_DIR, name), buf);
  return PREFIX + name;
}
function refPath(ref) {
  if (typeof ref !== 'string' || !ref.startsWith(PREFIX)) return null;
  return path.join(IMG_DIR, path.basename(ref.slice(PREFIX.length)));
}
const pageCount = (d) => Object.values(d?.pages || {}).reduce((n, l) => n + (l?.length || 0), 0);
const snapDir = () => { const d = path.join(DATA_DIR, 'backups'); fs.mkdirSync(d, { recursive: true }); return d; };
function readValid(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!d || !Array.isArray(d.tabs) || !d.tabs.length) throw new Error('invalid');
  return d;
}
function listSnapshots() {
  try {
    return fs.readdirSync(snapDir()).filter((f) => f.endsWith('.json')).sort().reverse().map((name) => ({ name, file: path.join(snapDir(), name) }));
  } catch (_) { return []; }
}
function snapshot(json, data, label) {
  if (pageCount(data) === 0) return;
  const name = label
    ? `orbit-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}-${label}.json`
    : `orbit-${new Date().toISOString().slice(0, 10)}.json`;
  fs.writeFileSync(path.join(snapDir(), name), json);
  listSnapshots().slice(10).forEach((s) => { try { fs.unlinkSync(s.file); } catch (_) {} });
}
function saveData(data) {
  const json = JSON.stringify(data);
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, json);
  if (fs.readFileSync(tmp, 'utf8') !== json) throw new Error('verify failed');
  fs.renameSync(tmp, DATA_FILE);
  try { snapshot(json, data); } catch (_) {}
}

function createWindow() {
  win = new BrowserWindow({
    width: 1380, height: 880, minWidth: 980, minHeight: 640,
    backgroundColor: '#0A0A14', title: 'Orbit', show: false, autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false },
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
}

app.whenReady().then(() => {
  ensureDirs();
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  protocol.handle('orbit-file', (req) => {
    const name = path.basename(decodeURIComponent(new URL(req.url).pathname));
    return net.fetch(pathToFileURL(path.join(IMG_DIR, name)).toString());
  });
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('load', () => {
  for (const file of [DATA_FILE, DATA_FILE + '.tmp']) {
    if (!fs.existsSync(file)) continue;
    try { return readValid(file); } catch (_) {
      try { fs.copyFileSync(file, `${file}.corrupt-${Date.now()}`); } catch (__) {}
    }
  }
  for (const snap of listSnapshots()) { try { return readValid(snap.file); } catch (_) {} }
  return null;
});
ipcMain.handle('list-snapshots', () => listSnapshots().map((s) => {
  try { const d = readValid(s.file); return { name: s.name, tabs: d.tabs.length, pages: pageCount(d) }; } catch (_) { return null; }
}).filter(Boolean));
ipcMain.handle('read-snapshot', (_e, name) => readValid(path.join(snapDir(), path.basename(name))));
ipcMain.handle('snapshot-now', (_e, { data, label }) => { try { snapshot(JSON.stringify(data), data, label); } catch (_) {} return true; });
ipcMain.handle('save', (_e, data) => { saveData(data); return true; });
ipcMain.on('save-sync', (e, data) => { try { saveData(data); e.returnValue = true; } catch (_) { e.returnValue = false; } });

ipcMain.handle('pick-images', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }] });
  if (r.canceled) return [];
  return r.filePaths.map((p) => writeImage(fs.readFileSync(p), path.extname(p).slice(1)));
});
ipcMain.handle('save-image-buffer', (_e, { buffer, ext }) => writeImage(Buffer.from(buffer), ext));
ipcMain.handle('delete-images', (_e, refs) => {
  (refs || []).forEach((r) => { const p = refPath(r); if (p) { try { fs.unlinkSync(p); } catch (_) {} } });
  return true;
});

ipcMain.handle('export-backup', async (_e, data) => {
  const def = `orbit-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('documents'), def), filters: [{ name: 'Orbit backup', extensions: ['json'] }] });
  if (r.canceled || !r.filePath) return { canceled: true };
  const clone = JSON.parse(JSON.stringify(data));
  const images = {};
  for (const k of Object.keys(clone.pages || {})) {
    for (const p of clone.pages[k]) {
      p.images = (p.images || []).filter((ref) => {
        const fp = refPath(ref);
        if (!fp || !fs.existsSync(fp)) return false;
        const name = path.basename(fp);
        if (!images[name]) images[name] = fs.readFileSync(fp).toString('base64');
        return true;
      });
    }
  }
  fs.writeFileSync(r.filePath, JSON.stringify({ app: 'orbit', format: 1, exportedAt: Date.now(), data: clone, images }));
  return { path: r.filePath };
});

ipcMain.handle('import-backup', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Orbit backup', extensions: ['json'] }, { name: 'All files', extensions: ['*'] }] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  let parsed;
  try { parsed = JSON.parse(fs.readFileSync(r.filePaths[0], 'utf8')); } catch (_) { return { error: 'invalid' }; }
  if (parsed?.app !== 'orbit' || !Array.isArray(parsed?.data?.tabs)) return { error: 'invalid' };
  const data = parsed.data;
  for (const k of Object.keys(data.pages || {})) {
    for (const p of data.pages[k]) {
      p.images = (p.images || []).map((ref) => {
        if (typeof ref !== 'string' || !ref.startsWith(PREFIX)) return null;
        const name = ref.slice(PREFIX.length);
        const b64 = parsed.images?.[name];
        if (!b64) return null;
        try { return writeImage(Buffer.from(b64, 'base64'), path.extname(name).slice(1)); } catch (_) { return null; }
      }).filter(Boolean);
    }
  }
  return { data };
});

ipcMain.handle('open-data-folder', () => shell.openPath(DATA_DIR));
ipcMain.handle('app-version', () => app.getVersion());

/* ---------- Compte : requêtes réseau (uniquement vers Firebase), session chiffrée, images ---------- */
const ALLOWED_HOSTS = new Set(['identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firestore.googleapis.com']);
ipcMain.handle('request', async (_e, { url, method, headers, body }) => {
  let u;
  try { u = new URL(url); } catch (_) { return { status: 0, data: null }; }
  if (u.protocol !== 'https:' || !ALLOWED_HOSTS.has(u.host)) return { status: 0, data: null };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const res = await net.fetch(url, { method, headers, body, signal: ctrl.signal });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { status: res.status, data };
  } catch (_) {
    return { status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
});

const sessionFile = () => path.join(DATA_DIR, 'session.bin');
ipcMain.handle('session-get', () => {
  try {
    const buf = fs.readFileSync(sessionFile());
    return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(buf) : buf.toString('utf8');
  } catch (_) { return null; }
});
ipcMain.handle('session-set', (_e, value) => {
  try {
    if (!value) { fs.rmSync(sessionFile(), { force: true }); return true; }
    fs.writeFileSync(sessionFile(), safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(value) : Buffer.from(value, 'utf8'));
  } catch (_) {}
  return true;
});

ipcMain.handle('image-exists', (_e, name) => fs.existsSync(path.join(IMG_DIR, path.basename(String(name)))));
ipcMain.handle('image-b64', (_e, name) => {
  const file = path.join(IMG_DIR, path.basename(String(name)));
  let img = nativeImage.createFromPath(file);
  if (img.isEmpty()) return null;
  const { width } = img.getSize();
  if (width > 1280) img = img.resize({ width: 1280, quality: 'good' });
  let buf = img.toJPEG(70);
  if (buf.length * 1.37 > 950000) buf = img.resize({ width: Math.min(900, img.getSize().width), quality: 'good' }).toJPEG(50);
  return buf.toString('base64');
});
ipcMain.handle('image-write', (_e, { name, b64 }) => {
  fs.writeFileSync(path.join(IMG_DIR, path.basename(String(name))), Buffer.from(b64, 'base64'));
  return true;
});

/* ---------- Mises à jour (GitHub Releases) ---------- */
let autoUpdater = null;
try {
  ({ autoUpdater } = require('electron-updater'));
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  const send = (p) => { if (win && !win.isDestroyed()) win.webContents.send('update-status', p); };
  autoUpdater.on('download-progress', (p) => send({ state: 'downloading', percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', () => send({ state: 'ready' }));
  autoUpdater.on('error', (e) => send({ state: 'error', message: String((e && e.message) || e) }));
} catch (_) { autoUpdater = null; }

const isNewer = (a, b) => {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
};
ipcMain.handle('update-check', async () => {
  if (!app.isPackaged || !autoUpdater) return { state: 'dev' };
  try {
    const r = await autoUpdater.checkForUpdates();
    const v = r && r.updateInfo && r.updateInfo.version;
    return v && isNewer(v, app.getVersion()) ? { state: 'available', version: v } : { state: 'none' };
  } catch (e) {
    return { state: 'error', message: String((e && e.message) || e) };
  }
});
ipcMain.handle('update-download', async () => {
  try { await autoUpdater.downloadUpdate(); return true; } catch (e) { return false; }
});
ipcMain.handle('update-install', () => { setImmediate(() => autoUpdater.quitAndInstall(false, true)); return true; });
