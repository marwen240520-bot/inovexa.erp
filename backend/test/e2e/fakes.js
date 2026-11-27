// Faux prestataires pour les tests de bout en bout (aucun accès à Internet, aucun vrai paiement, aucun vrai email) :
//  - startFakeFlouci : imite l'API Flouci v2 (generate_payment, verify_payment) et permet de « payer » depuis le test ;
//                      sait aussi signer une notification comme Flouci (en-tête X-Flouci-Signature) ;
//  - startFakeSmtp   : serveur SMTP qui garde les emails reçus, pour lire le code de vérification.
// Le serveur de l'ERP les atteint par FLOUCI_API_URL et SMTP_HOST/SMTP_PORT (voir run.sh).
const http = require('http');
const net = require('net');
const crypto = require('crypto');

function startFakeFlouci(port, { publicToken = 'e2e-flouci-public', privateToken = 'e2e-flouci-private' } = {}) {
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

      if (!url.pathname.startsWith('/api/v2/')) return send(res, 404, { result: { status: 404, message: 'not found' } });
      if (req.headers.authorization !== `Bearer ${publicToken}:${privateToken}`) return send(res, 401, { detail: 'Invalid token' });

      if (req.method === 'POST' && url.pathname === '/api/v2/generate_payment') {
        if (state.failInit) return send(res, 500, { result: { status: 500, message: 'Internal error' } });
        // Comme Flouci : montant en millimes (texte de chiffres), adresses de retour obligatoires.
        if (!body || !/^\d+$/.test(String(body.amount)) || Number(body.amount) <= 0 || !body.success_link || !body.fail_link) {
          return send(res, 200, { result: { status: 400, message: 'Bad Request' } });
        }
        const id = `fk${String(++state.seq).padStart(3, '0')}${crypto.randomBytes(8).toString('hex')}`;
        payments.set(id, { id, status: 'PENDING', type: 'NA', amount: Number(body.amount), developer_tracking_id: body.developer_tracking_id ?? null, init: body });
        return send(res, 200, { result: { success: true, payment_id: id, link: `http://127.0.0.1:${port}/pay/${id}`, developer_tracking_id: body.developer_tracking_id ?? null }, name: 'developers', code: 0, version: 'v2' });
      }

      const m = req.method === 'GET' && url.pathname.match(/^\/api\/v2\/verify_payment\/([A-Za-z0-9_-]+)$/);
      if (m) {
        if (state.failGet) return send(res, 500, { result: { status: 500, message: 'Internal error' } });
        const p = payments.get(m[1]);
        // Flouci répond « introuvable » dans le corps (sans champ success).
        if (!p) return send(res, 200, { result: { status: 404, message: 'Payment not found' } });
        return send(res, 200, {
          success: true,
          result: { type: p.type, amount: p.amount, status: p.status, details: {}, developer_tracking_id: p.developer_tracking_id, settlement_status: p.status === 'SUCCESS' ? 'PROCESSING' : 'NOT_APPLICABLE' },
          status_code: 200, name: 'developers', code: 0, version: '2.0.0',
        });
      }
      return send(res, 404, { result: { status: 404, message: 'not found' } });
    });
  });

  const sign = (paymentId, success, { key = privateToken, t = Math.floor(Date.now() / 1000) } = {}) =>
    `t=${t},v1=${crypto.createHmac('sha256', key).update(`${t}.payment_id=${paymentId}&success=${success}`).digest('hex')}`;

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve({
      state,
      log,
      payments,
      /** Dernière ouverture de paiement reçue (corps JSON envoyé par l'ERP). */
      lastInit: () => [...log].reverse().find((l) => l.method === 'POST' && l.path.endsWith('/generate_payment')),
      initCount: () => log.filter((l) => l.method === 'POST' && l.path.endsWith('/generate_payment')).length,
      verifyCount: () => log.filter((l) => l.method === 'GET' && l.path.includes('/verify_payment/')).length,
      refFromPayUrl: (payUrl) => String(payUrl).split('/pay/')[1],
      /** Le client a payé : « SUCCESS » par carte (les valeurs peuvent être faussées pour tester les contrôles). */
      pay(id, over = {}) {
        const p = payments.get(id);
        if (!p) throw new Error(`Paiement inconnu : ${id}`);
        Object.assign(p, { status: 'SUCCESS', type: 'card', amount: Number(p.init.amount), developer_tracking_id: p.init.developer_tracking_id ?? null }, over);
      },
      setStatus(id, status, over = {}) {
        Object.assign(payments.get(id), { status }, over);
      },
      /** En-tête X-Flouci-Signature d'une notification, comme Flouci la signe (clé et horodatage modifiables). */
      sign,
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

module.exports = { startFakeFlouci, startFakeSmtp };
