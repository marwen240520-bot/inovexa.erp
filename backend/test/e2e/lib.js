const BASE = process.env.BASE || 'http://127.0.0.1:4101';
let token = null, failures = 0, passes = 0;
async function api(method, path, body, raw) {
  const res = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  if (raw) return res;
  const text = await res.text(); let json; try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}
function check(name, cond, extra) { if (cond) { passes++; console.log('  ok  ', name); } else { failures++; console.log('  FAIL', name, extra !== undefined ? JSON.stringify(extra).slice(0, 400) : ''); } }
const setToken = (t) => (token = t);
const summary = () => { console.log(`\n${passes} ok, ${failures} échec(s)`); process.exit(failures ? 1 : 0); };
module.exports = { api, check, setToken, summary };
