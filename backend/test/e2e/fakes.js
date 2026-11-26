// Faux prestataires pour les tests de bout en bout (aucun accès à Internet, aucun vrai paiement, aucun vrai email) :
//  - startFakeKonnect : imite l'API Konnect v2 (init-payment, lecture d'un paiement) et permet de « payer » depuis le test ;
//  - startFakeSmtp    : serveur SMTP qui garde les emails reçus, pour lire le code de vérification.
// Le serveur de l'ERP les atteint par KONNECT_API_URL et SMTP_HOST/SMTP_PORT (voir run.sh).
const http = require('http');
const net = require('net');

function startFakeKonnect(port, { apiKey = 'e2e-konnect-key', walletId = 'e2e-wallet' } = {}) {
  const payments = new Map();
  const log = [];
  const state = { failInit: false, failGet: false, seq: 0 };

  const send = (res, status, body) => {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': typeof body === 'string' ? 'text/html' : 'application/json' });
    res.end(text);
  };

  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://x');
      let body = null;
      try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
      log.push({ method: req.method, path: url.pathname, headers: req.headers, body });

      // Page de paiement (le client y saisit sa carte) : inutile ici, le test « paie » directement.
      if (req.method === 'GET' && url.pathname.startsWith('/pay/')) return send(res, 200, '<html>fake pay page</html>');

      if (!url.pathname.startsWith('/api/v2/')) return send(res, 404, { message: 'not found' });
      if (req.headers['x-api-key'] !== apiKey) return send(res, 401, { errors: [{ message: 'Invalid API key' }] });

      if (req.method === 'POST' && url.pathname === '/api/v2/payments/init-payment') {
        if (state.failInit) return send(res, 500, { errors: [{ message: 'Internal error' }] });
        if (!body || body.receiverWalletId !== walletId) return send(res, 400, { errors: [{ message: 'Unknown wallet' }] });
        if (!['TND', 'EUR', 'USD'].includes(body.token) || !Number.isInteger(body.amount) || body.amount <= 0 || !body.orderId) return send(res, 400, { errors: [{ message: 'Invalid payment' }] });
        const ref = `fk${String(++state.seq).padStart(3, '0')}${Math.random().toString(36).slice(2, 10)}`;
        payments.set(ref, { ref, status: 'pending', amount: body.amount, token: body.token, orderId: body.orderId, transactions: [], init: body });
        return send(res, 200, { payUrl: `http://127.0.0.1:${port}/pay/${ref}`, paymentRef: ref });
      }

      const m = req.method === 'GET' && url.pathname.match(/^\/api\/v2\/payments\/([A-Za-z0-9_-]+)$/);
      if (m) {
        if (state.failGet) return send(res, 500, { errors: [{ message: 'Internal error' }] });
        const p = payments.get(m[1]);
        if (!p) return send(res, 404, { message: 'Payment not found' });
        return send(res, 200, { payment: { id: p.ref, status: p.status, amount: p.amount, token: p.token, orderId: p.orderId, transactions: p.transactions } });
      }
      return send(res, 404, { message: 'not found' });
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({
      state,
      log,
      payments,
      /** Dernière ouverture de paiement reçue (corps JSON envoyé par l'ERP). */
      lastInit: () => [...log].reverse().find((l) => l.method === 'POST' && l.path.endsWith('/init-payment')),
      initCount: () => log.filter((l) => l.method === 'POST' && l.path.endsWith('/init-payment')).length,
      refFromPayUrl: (payUrl) => String(payUrl).split('/pay/')[1],
      /** Le client a payé : « completed » avec une transaction réussie (les valeurs peuvent être faussées pour tester les contrôles). */
      pay(ref, over = {}) {
        const p = payments.get(ref);
        if (!p) throw new Error(`Paiement inconnu : ${ref}`);
        Object.assign(p, { status: 'completed', transactions: [{ status: 'success', method: 'bank_card' }], amount: p.init.amount, token: p.init.token, orderId: p.init.orderId }, over);
      },
      setStatus(ref, status, transactions = []) {
        Object.assign(payments.get(ref), { status, transactions });
      },
      close: () => new Promise((r) => server.close(() => r())),
    }));
  });
}

/** Décode le « quoted-printable » d'un message (nodemailer l'utilise pour le texte accentué). */
function decodeQuotedPrintable(text) {
  const joined = text.replace(/=\r?\n/g, '');
  const bytes = [];
  for (let i = 0; i < joined.length; i++) {
    if (joined[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(joined.slice(i + 1, i + 3))) { bytes.push(parseInt(joined.slice(i + 1, i + 3), 16)); i += 2; }
    else bytes.push(...Buffer.from(joined[i], 'utf8'));
  }
  return Buffer.from(bytes).toString('utf8');
}

function startFakeSmtp(port) {
  const mails = [];
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    let buffer = '';
    let inData = false;
    let current = { from: '', to: [], data: '' };
    const line = (s) => socket.write(`${s}\r\n`);
    line('220 fake-smtp ESMTP ready');
    socket.on('error', () => undefined);
    socket.on('data', (chunk) => {
      buffer += chunk;
      for (;;) {
        if (inData) {
          const end = buffer.indexOf('\r\n.\r\n');
          if (end === -1) return;
          current.data = buffer.slice(0, end);
          buffer = buffer.slice(end + 5);
          inData = false;
          mails.push({ ...current, text: decodeQuotedPrintable(current.data), at: Date.now() });
          current = { from: '', to: [], data: '' };
          line('250 OK queued');
          continue;
        }
        const nl = buffer.indexOf('\r\n');
        if (nl === -1) return;
        const cmd = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        const verb = cmd.slice(0, 4).toUpperCase();
        if (verb === 'EHLO') socket.write('250-fake-smtp\r\n250 8BITMIME\r\n');
        else if (verb === 'MAIL') { current.from = cmd.slice(10).replace(/[<>]/g, '').trim(); line('250 OK'); }
        else if (verb === 'RCPT') { current.to.push(cmd.slice(8).replace(/[<>]/g, '').trim().toLowerCase()); line('250 OK'); }
        else if (verb === 'DATA') { inData = true; line('354 End data with <CR><LF>.<CR><LF>'); }
        else if (verb === 'QUIT') { line('221 Bye'); socket.end(); return; }
        else line('250 OK');
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({
      mails,
      /** Code à 6 chiffres contenu dans un email de vérification (null s'il n'y en a pas). */
      codeOf: (mail) => (mail.text.match(/\r?\n\s{2,}(\d{6})\s*\r?\n/) || [])[1] || null,
      /** Attend un email envoyé à cette adresse après le n-ième email déjà reçu, et renvoie son code. */
      async codeFor(email, afterCount = 0, timeoutMs = 8000) {
        const deadline = Date.now() + timeoutMs;
        const to = String(email).toLowerCase();
        while (Date.now() < deadline) {
          const found = mails.slice(afterCount).filter((m) => m.to.includes(to)).map((m) => ({ mail: m, code: (m.text.match(/\r?\n\s{2,}(\d{6})\s*\r?\n/) || [])[1] || null })).filter((x) => x.code).pop();
          if (found) return found.code;
          await new Promise((r) => setTimeout(r, 80));
        }
        throw new Error(`Aucun email avec un code pour ${email}`);
      },
      close: () => new Promise((r) => server.close(() => r())),
    }));
  });
}

module.exports = { startFakeKonnect, startFakeSmtp };
