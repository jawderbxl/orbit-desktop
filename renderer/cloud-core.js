/* Orbit cloud : compte (Firebase Auth) + synchronisation (Firestore) via REST.
 * Fichier partagé à l'identique entre l'app mobile et l'app PC.
 * Les données restent d'abord locales ; la synchro fusionne les deux côtés page par page.
 */
(function (root, factory) {
  const lib = factory();
  if (typeof module === 'object' && module.exports) module.exports = lib;
  else root.OrbitCloud = lib;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const N = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);

  function stable(v) {
    if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
    return JSON.stringify(v === undefined ? null : v);
  }

  // local / résultat : { tabs, pages: { tabId: [page] }, deleted: { tabs, pages }, orderUpdatedAt }
  // remote : { meta: { tabs, tabOrder, pageOrder, deleted, orderUpdatedAt } | null, pages: [page + tabId] }
  function mergeState(local, remote) {
    const lDel = local.deleted || {};
    const rm = remote.meta || { tabs: [], tabOrder: [], pageOrder: {}, deleted: {}, orderUpdatedAt: 0 };
    const deleted = { tabs: { ...(lDel.tabs || {}) }, pages: { ...(lDel.pages || {}) } };
    for (const kind of ['tabs', 'pages']) {
      for (const [id, ts] of Object.entries((rm.deleted || {})[kind] || {})) deleted[kind][id] = Math.max(N(deleted[kind][id]), N(ts));
    }
    const alive = (kind, item) => !(item.id in deleted[kind]) || deleted[kind][item.id] < N(item.updatedAt);

    const tabMap = new Map();
    (rm.tabs || []).forEach((t) => tabMap.set(t.id, t));
    local.tabs.forEach((t) => {
      const r = tabMap.get(t.id);
      if (!r || N(t.updatedAt) >= N(r.updatedAt)) tabMap.set(t.id, t);
    });
    const remoteOrderWins = N(rm.orderUpdatedAt) > N(local.orderUpdatedAt);
    const baseOrder = remoteOrderWins ? rm.tabOrder || [] : local.tabs.map((t) => t.id);
    const tabIds = [...new Set([...baseOrder, ...local.tabs.map((t) => t.id), ...(rm.tabs || []).map((t) => t.id)])]
      .filter((id) => tabMap.has(id) && alive('tabs', tabMap.get(id)));
    const profile = N(rm.profileUpdatedAt) > N(local.profileUpdatedAt) ? rm.profile : local.profile;
    const profileUpdatedAt = Math.max(N(local.profileUpdatedAt), N(rm.profileUpdatedAt));
    if (!tabIds.length) return { tabs: local.tabs, pages: local.pages, deleted, orderUpdatedAt: N(local.orderUpdatedAt), profile: local.profile, profileUpdatedAt };
    const tabs = tabIds.map((id) => tabMap.get(id));

    const pageMap = new Map();
    (remote.pages || []).forEach((p) => pageMap.set(p.id, p));
    for (const [tabId, list] of Object.entries(local.pages || {})) {
      for (const p of list) {
        const lp = { ...p, tabId };
        const r = pageMap.get(p.id);
        if (!r || N(lp.updatedAt) >= N(r.updatedAt)) pageMap.set(p.id, lp);
      }
    }
    const localOrder = Object.fromEntries(Object.entries(local.pages || {}).map(([k, l]) => [k, l.map((p) => p.id)]));
    const remoteOrder = rm.pageOrder || {};
    const first = remoteOrderWins ? remoteOrder : localOrder;
    const second = remoteOrderWins ? localOrder : remoteOrder;
    const pages = {};
    const placed = new Set();
    const strip = (p) => { const { tabId, ...clean } = p; return clean; };
    for (const t of tabs) {
      pages[t.id] = [];
      for (const id of [...(first[t.id] || []), ...(second[t.id] || [])]) {
        if (placed.has(id)) continue;
        const p = pageMap.get(id);
        if (!p || p.tabId !== t.id || !alive('pages', p)) continue;
        placed.add(id);
        pages[t.id].push(strip(p));
      }
    }
    for (const p of pageMap.values()) {
      if (placed.has(p.id) || !pages[p.tabId] || !alive('pages', p)) continue;
      placed.add(p.id);
      pages[p.tabId].unshift(strip(p));
    }
    return { tabs, pages, deleted, orderUpdatedAt: Math.max(N(local.orderUpdatedAt), N(rm.orderUpdatedAt)), profile: profile || { name: '', photo: null }, profileUpdatedAt };
  }

  function planPush(merged, remote) {
    const rp = new Map((remote.pages || []).map((p) => [p.id, p]));
    const allPages = [];
    const upserts = [];
    const keep = new Set();
    for (const [tabId, list] of Object.entries(merged.pages)) {
      for (const p of list) {
        const withTab = { ...p, tabId };
        allPages.push(withTab);
        keep.add(p.id);
        const r = rp.get(p.id);
        if (!r || stable(r) !== stable(withTab)) upserts.push(withTab);
      }
    }
    const deletes = (remote.pages || []).filter((r) => !keep.has(r.id)).map((r) => r.id);
    const meta = {
      tabs: merged.tabs,
      tabOrder: merged.tabs.map((t) => t.id),
      pageOrder: Object.fromEntries(Object.entries(merged.pages).map(([k, l]) => [k, l.map((p) => p.id)])),
      deleted: merged.deleted,
      orderUpdatedAt: merged.orderUpdatedAt,
      profile: merged.profile,
      profileUpdatedAt: merged.profileUpdatedAt,
    };
    return { upserts, deletes, meta, metaChanged: stable(meta) !== stable(remote.meta || null), allPages };
  }

  function isConfigured(cfg) {
    return !!(cfg && cfg.apiKey && cfg.projectId && !/YOUR_|TON_|PASTE/i.test(cfg.apiKey + cfg.projectId));
  }

  function createCloud({ apiKey, projectId, http, session: store, images }) {
    const configured = isConfigured({ apiKey, projectId });
    const ID = 'https://identitytoolkit.googleapis.com/v1/accounts:';
    const FS = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
    const docPath = (p) => `projects/${projectId}/databases/(default)/documents/${p}`;
    let sess = null;
    let loaded = false;

    const fail = (code, status) => { const e = new Error(code); e.code = code; e.status = status; return e; };

    async function call(url, { method = 'GET', headers = {}, body } = {}) {
      let res;
      try { res = await http({ url, method, headers, body }); } catch (e) { throw fail('NETWORK'); }
      if (!res || res.status === 0) throw fail('NETWORK');
      if (res.status >= 200 && res.status < 300) return res.data;
      const err = (res.data && res.data.error) || {};
      const m = String(err.message || '');
      const code = /^[A-Z_]{4,}/.test(m) ? m.match(/^[A-Z_]+/)[0] : err.status || `HTTP_${res.status}`;
      throw fail(code, res.status);
    }

    async function load() {
      if (loaded) return sess;
      loaded = true;
      try {
        const raw = await store.get();
        const s = raw ? JSON.parse(raw) : null;
        if (s && s.refreshToken) sess = { ...s, idToken: null, expiresAt: 0 };
      } catch (e) {}
      return sess;
    }
    async function persist() {
      try { await store.set(sess ? JSON.stringify({ uid: sess.uid, email: sess.email, refreshToken: sess.refreshToken }) : null); } catch (e) {}
    }

    async function authWith(endpoint, email, password) {
      if (!configured) throw fail('NOT_CONFIGURED');
      const d = await call(`${ID}${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: String(email).trim(), password, returnSecureToken: true }),
      });
      sess = { uid: d.localId, email: d.email, idToken: d.idToken, refreshToken: d.refreshToken, expiresAt: Date.now() + N(+d.expiresIn) * 1000 };
      loaded = true;
      await persist();
      return { uid: sess.uid, email: sess.email };
    }

    async function token() {
      await load();
      if (!sess) throw fail('NOT_SIGNED_IN');
      if (sess.idToken && Date.now() < sess.expiresAt - 60000) return sess.idToken;
      try {
        const d = await call(`https://securetoken.googleapis.com/v1/token?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(sess.refreshToken)}`,
        });
        sess = { ...sess, idToken: d.id_token, refreshToken: d.refresh_token, expiresAt: Date.now() + N(+d.expires_in) * 1000 };
        await persist();
        return sess.idToken;
      } catch (e) {
        if (e.code !== 'NETWORK' && e.status && e.status < 500) { sess = null; await persist(); }
        throw e;
      }
    }

    const auth = async () => ({ Authorization: `Bearer ${await token()}` });
    async function getDoc(path) {
      try { return await call(`${FS}/${path}`, { headers: await auth() }); } catch (e) { if (e.status === 404) return null; throw e; }
    }
    async function listDocs(path, maskField) {
      const out = [];
      let pt = '';
      do {
        const q = `pageSize=300${maskField ? `&mask.fieldPaths=${maskField}` : ''}${pt ? `&pageToken=${encodeURIComponent(pt)}` : ''}`;
        const d = await call(`${FS}/${path}?${q}`, { headers: await auth() });
        ((d && d.documents) || []).forEach((x) => out.push(x));
        pt = (d && d.nextPageToken) || '';
      } while (pt);
      return out;
    }
    async function commit(writes) {
      for (let i = 0; i < writes.length; i += 200) {
        await call(`${FS}:commit`, { method: 'POST', headers: { ...(await auth()), 'Content-Type': 'application/json' }, body: JSON.stringify({ writes: writes.slice(i, i + 200) }) });
      }
    }
    const jsonFields = (obj) => ({ json: { stringValue: JSON.stringify(obj) }, updatedAt: { integerValue: String(Math.round(N(obj.updatedAt))) } });
    const parseDoc = (doc) => { try { const s = doc && doc.fields && doc.fields.json && doc.fields.json.stringValue; return s ? JSON.parse(s) : null; } catch (e) { return null; } };
    const baseName = (n) => String(n).split('/').pop();

    const mapImages = (state, fn) => ({
      ...state,
      profile: state.profile ? { ...state.profile, photo: state.profile.photo ? fn(state.profile.photo) : null } : state.profile,
      pages: Object.fromEntries(Object.entries(state.pages || {}).map(([k, l]) => [k, l.map((p) => ({ ...p, images: (p.images || []).map(fn).filter(Boolean) }))])),
    });
    const toNames = (s) => mapImages(s, images.nameOf);
    const toRefs = (s) => mapImages(s, images.refOf);

    const emptyLike = (s) => ({
      tabs: [], pages: {}, orderUpdatedAt: 0,
      deleted: { tabs: { ...((s.deleted || {}).tabs || {}) }, pages: { ...((s.deleted || {}).pages || {}) } },
    });
    const pageTotal = (s) => Object.values(s.pages || {}).reduce((n, l) => n + l.length, 0);

    // options.preferRemote : premier appareil connecté à un compte existant alors qu'il est vide localement
    async function sync(local, options = {}) {
      if (!configured) throw fail('NOT_CONFIGURED');
      await token();
      const root = `users/${sess.uid}`;
      const [metaDoc, pageDocs] = await Promise.all([getDoc(`${root}/sync/meta`), listDocs(`${root}/pages`)]);
      const remote = { meta: parseDoc(metaDoc), pages: pageDocs.map(parseDoc).filter(Boolean) };
      const replaced = !!(options.preferRemote && remote.meta && (remote.meta.tabs || []).length && pageTotal(local) === 0);
      const merged = mergeState(toNames(replaced ? emptyLike(local) : local), remote);
      const plan = planPush(merged, remote);
      const writes = [];
      plan.upserts.forEach((p) => writes.push({ update: { name: docPath(`${root}/pages/${p.id}`), fields: jsonFields(p) } }));
      plan.deletes.forEach((id) => writes.push({ delete: docPath(`${root}/pages/${id}`) }));
      if (plan.metaChanged) writes.push({ update: { name: docPath(`${root}/sync/meta`), fields: jsonFields(plan.meta) } });
      if (writes.length) await commit(writes);

      const stats = { pushed: plan.upserts.length, removed: plan.deletes.length, uploaded: 0, downloaded: 0, failedImages: 0 };
      const needed = new Set();
      if (merged.profile && merged.profile.photo) needed.add(merged.profile.photo);
      Object.values(merged.pages).forEach((l) => l.forEach((p) => (p.images || []).forEach((n) => needed.add(n))));
      if (needed.size) {
        const remoteImgs = new Set((await listDocs(`${root}/images`, 'ext')).map((d) => baseName(d.name)));
        for (const name of needed) {
          try {
            const has = await images.exists(name);
            if (has && !remoteImgs.has(name)) {
              const b64 = await images.readB64(name);
              if (b64 && b64.length < 1000000) {
                await commit([{ update: { name: docPath(`${root}/images/${name}`), fields: { b64: { stringValue: b64 }, ext: { stringValue: 'jpg' } } } }]);
                stats.uploaded++;
              } else stats.failedImages++;
            } else if (!has && remoteImgs.has(name)) {
              const d = await getDoc(`${root}/images/${name}`);
              const b64 = d && d.fields && d.fields.b64 && d.fields.b64.stringValue;
              if (b64) { await images.writeB64(name, b64); stats.downloaded++; }
            }
          } catch (e) {
            if (e.code === 'NETWORK') throw e;
            stats.failedImages++;
          }
        }
      }
      return { remoteAfter: { meta: plan.meta, pages: plan.allPages }, stats, replaced };
    }

    // Fusionne le résultat d'une synchro dans l'état local actuel (qui a pu changer pendant la synchro)
    function apply(current, remoteAfter, replaced) {
      const base = replaced && pageTotal(current) === 0 ? emptyLike(current) : current;
      return toRefs(mergeState(toNames(base), remoteAfter));
    }

    return {
      configured,
      async user() { await load(); return sess ? { uid: sess.uid, email: sess.email } : null; },
      signIn: (email, password) => authWith('signInWithPassword', email, password),
      signUp: (email, password) => authWith('signUp', email, password),
      async resetPassword(email) {
        if (!configured) throw fail('NOT_CONFIGURED');
        await call(`${ID}sendOobCode?key=${apiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email: String(email).trim() }) });
      },
      async signOut() { sess = null; loaded = true; await persist(); },
      sync,
      apply,
    };
  }

  // Tampons de synchro à poser sur un état "remplacé" (import, restauration) pour qu'il gagne partout
  function stampReplacement(prev, next, now) {
    const deleted = { tabs: { ...((prev.deleted || {}).tabs || {}) }, pages: { ...((prev.deleted || {}).pages || {}) } };
    const nextTabIds = new Set(next.tabs.map((t) => t.id));
    const nextPageIds = new Set(Object.values(next.pages).flat().map((p) => p.id));
    prev.tabs.forEach((t) => { if (!nextTabIds.has(t.id)) deleted.tabs[t.id] = now; });
    Object.values(prev.pages).flat().forEach((p) => { if (!nextPageIds.has(p.id)) deleted.pages[p.id] = now; });
    nextTabIds.forEach((id) => delete deleted.tabs[id]);
    nextPageIds.forEach((id) => delete deleted.pages[id]);
    return {
      ...next,
      tabs: next.tabs.map((t) => ({ ...t, updatedAt: now })),
      profile: next.profile || prev.profile,
      profileUpdatedAt: now,
      pages: Object.fromEntries(Object.entries(next.pages).map(([k, l]) => [k, l.map((p) => ({ ...p, updatedAt: now }))])),
      deleted,
      orderUpdatedAt: now,
    };
  }

  const ERROR_CODES = ['NETWORK', 'NOT_CONFIGURED', 'NOT_SIGNED_IN', 'EMAIL_EXISTS', 'EMAIL_NOT_FOUND', 'INVALID_PASSWORD', 'INVALID_LOGIN_CREDENTIALS', 'WEAK_PASSWORD', 'INVALID_EMAIL', 'MISSING_PASSWORD', 'TOO_MANY_ATTEMPTS_TRY_LATER', 'OPERATION_NOT_ALLOWED', 'PERMISSION_DENIED', 'NOT_FOUND', 'USER_DISABLED'];

  return { createCloud, mergeState, planPush, stampReplacement, isConfigured, stable, ERROR_CODES };
});
