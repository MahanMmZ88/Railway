import http from "node:http";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const PUBLIC_RELAY_PATH  = normalizeRelayPath(process.env.PUBLIC_RELAY_PATH || "/IR-NETLIFY");
const RELAY_PATH         = normalizeRelayPath(process.env.RELAY_PATH        || "/IR-NETLIFY");
const UPSTREAM_TIMEOUT_MS = parsePositiveInt(process.env.UPSTREAM_TIMEOUT_MS, 30000, 1000);
const MAX_INFLIGHT       = parsePositiveInt(process.env.MAX_INFLIGHT, 512, 1);
const PORT               = parseInt(process.env.PORT || "8080", 10);

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST"]);

const FORWARD_HEADER_EXACT = new Set([
  "accept", "accept-encoding", "accept-language", "cache-control",
  "content-length", "content-type", "pragma", "range", "referer", "user-agent",
]);

const FORWARD_HEADER_PREFIXES = ["sec-ch-", "sec-fetch-"];

const STRIP_HEADERS = new Set([
  "host", "connection", "proxy-connection", "keep-alive", "via",
  "proxy-authenticate", "proxy-authorization", "te", "trailer",
  "transfer-encoding", "upgrade", "forwarded", "x-forwarded-host",
  "x-forwarded-proto", "x-forwarded-port", "x-forwarded-for", "x-real-ip",
  "x-host"
]);

let inFlight = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // ── Root path: Config Generator ───────────────────────────────────────────
  if (url.pathname === "/" && req.method === "GET") {
    return serveConfigGenerator(req, res);
  }

  // ── Debug endpoint ──────────────────────────────────────────────────────────
  if (url.pathname === "/__debug") {
    const body = JSON.stringify({
      PUBLIC_RELAY_PATH,
      RELAY_PATH,
      UPSTREAM_TIMEOUT_MS,
      MAX_INFLIGHT,
      inFlight,
    }, null, 2);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(body);
  }

  // ── Get target from x-host header ──────────────────────────────────────────
  const targetBase = (req.headers["x-host"] || "").trim().replace(/\/$/, "");
  
  if (!targetBase) {
    return end(res, 400, "Bad Request: x-host header is required");
  }

  // ── Config checks ───────────────────────────────────────────────────────────
  if (!RELAY_PATH)            return end(res, 500, "Misconfigured: RELAY_PATH is not set");
  if (RELAY_PATH === "/")     return end(res, 500, "Misconfigured: RELAY_PATH cannot be '/'");
  if (!PUBLIC_RELAY_PATH)     return end(res, 500, "Misconfigured: PUBLIC_RELAY_PATH is not set");
  if (PUBLIC_RELAY_PATH==="/")return end(res, 500, "Misconfigured: PUBLIC_RELAY_PATH cannot be '/'");

  // ── Routing ─────────────────────────────────────────────────────────────────
  const normalizedPath = normalizeIncomingPath(url.pathname);
  if (!isAllowedRelayPath(normalizedPath, PUBLIC_RELAY_PATH))
    return end(res, 404, "Not Found");

  if (!ALLOWED_METHODS.has(req.method))
    return end(res, 405, "Method Not Allowed", { allow: "GET, HEAD, POST" });

  // ── Inflight limit ──────────────────────────────────────────────────────────
  if (inFlight >= MAX_INFLIGHT) {
    res.setHeader("retry-after", "1");
    return end(res, 503, "Server Busy: Too Many Inflight Requests");
  }
  inFlight++;

  try {
    const upstreamPath = mapPublicPathToRelayPath(normalizedPath, PUBLIC_RELAY_PATH, RELAY_PATH);
    const targetUrl    = `${targetBase}${upstreamPath}${url.search || ""}`;

    // ── Forward headers ───────────────────────────────────────────────────────
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower))   continue;
      if (!shouldForwardHeader(lower)) continue;
      forwardHeaders[lower] = value;
    }
    const clientIp = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "";
    if (clientIp) forwardHeaders["x-forwarded-for"] = clientIp;

    // ── Fetch upstream ────────────────────────────────────────────────────────
    const hasBody  = req.method !== "GET" && req.method !== "HEAD";
    const abortCtrl = new AbortController();
    let timeoutRef = null;
    if (UPSTREAM_TIMEOUT_MS > 0) {
      timeoutRef = setTimeout(() => abortCtrl.abort(), UPSTREAM_TIMEOUT_MS);
    }

    try {
      const fetchOpts = {
        method:   req.method,
        headers:  forwardHeaders,
        redirect: "manual",
        signal:   abortCtrl.signal,
      };
      if (hasBody) {
        fetchOpts.body   = Readable.toWeb(req);
        fetchOpts.duplex = "half";
      }

      const upstream = await fetch(targetUrl, fetchOpts);

      res.statusCode = upstream.status;
      for (const [key, value] of upstream.headers.entries()) {
        const lower = key.toLowerCase();
        if (lower === "transfer-encoding" || lower === "connection") continue;
        try { res.setHeader(key, value); } catch {}
      }

      if (!upstream.body) {
        res.end();
      } else {
        await pipeline(Readable.fromWeb(upstream.body), res);
      }
    } finally {
      if (timeoutRef) clearTimeout(timeoutRef);
    }

  } catch (err) {
    console.error("[RELAY ERROR]", err.message);
    if (err?.name === "AbortError") {
      if (!res.headersSent) end(res, 504, "Gateway Timeout");
    } else {
      if (!res.headersSent) end(res, 502, "Bad Gateway");
    }
  } finally {
    inFlight = Math.max(0, inFlight - 1);
  }
});

// ── Config Generator ─────────────────────────────────────────────────────────
function serveConfigGenerator(req, res) {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MAHAN CDN - Config Generator</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0f1d;color:#f1f5f9;font-family:system-ui;padding:20px}
.container{max-width:700px;margin:0 auto;background:#121829;border:1px solid #1e293b;border-radius:12px;padding:24px}
h1{color:#00ff66;text-align:center;margin-bottom:20px;font-size:24px}
.info{background:#1a2332;padding:12px;border-radius:6px;font-size:12px;color:#64748b;margin-bottom:15px;line-height:1.6}
.info code{background:#0a0f1d;padding:2px 6px;border-radius:4px;color:#00ff66}
label{display:block;color:#64748b;font-size:13px;margin:12px 0 4px;font-weight:500}
input,textarea{width:100%;padding:10px;background:#0a0f1d;border:1px solid #1e293b;color:#f1f5f9;border-radius:6px;font-family:monospace;font-size:12px}
input:focus,textarea:focus{border-color:#00ff66;outline:none}
input[readonly]{color:#64748b;cursor:not-allowed}
textarea{min-height:100px;resize:vertical;line-height:1.5}
.radio-group{display:flex;gap:15px;margin:15px 0;padding:12px;background:#0a0f1d;border-radius:6px}
.radio-group label{margin:0;display:flex;align-items:center;gap:6px;cursor:pointer;color:#f1f5f9}
.radio-group input[type="radio"]{accent-color:#00ff66}
button{width:100%;padding:12px;background:#00ff66;color:#020617;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:15px;font-size:14px}
button:hover{background:#00cc52}
.out{margin-top:20px;display:none}
.out.show{display:block}
.item{background:#1a2332;padding:10px;margin:8px 0;border-radius:6px;border-left:3px solid #00ff66}
.item-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.item-title{color:#00ff66;font-weight:600;font-size:12px}
.item pre{font-size:10px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;color:#cbd5e1;line-height:1.4}
.btn-copy{background:#1e293b;color:#f1f5f9;border:none;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer}
.btn-copy:hover{background:#334155}
.btn-copy.success{background:#00ff66;color:#020617}
.hidden{display:none}
footer{text-align:center;margin-top:20px;padding-top:15px;border-top:1px solid #1e293b;font-size:11px;color:#64748b}
</style>
</head>
<body>
<div class="container">
<h1>⚡ MAHAN CDN</h1>
<div class="info">
<strong>📌 تنظیمات:</strong><br>
UUID: <code>@IR_NETLIFY</code> | 
Path: <code>/IR-NETLIFY</code> | 
Padding: <code>iran</code>
</div>

<div class="radio-group">
<label>
<input type="radio" name="mode" value="domain" checked onchange="toggleMode()">
<span>🌐 دامنه</span>
</label>
<label>
<input type="radio" name="mode" value="iplist" onchange="toggleMode()">
<span>📋 لیست IP</span>
</label>
</div>

<div id="domainMode">
<label>🚂 Railway Domain (خودکار)</label>
<input type="text" id="railway" readonly>
<label>🎯 Target Server (x-host)</label>
<input type="text" id="target" placeholder="http://example.com:444" value="http://example.com:444">
</div>

<div id="ipListMode" class="hidden">
<label>🚂 Railway Domain (خودکار)</label>
<input type="text" id="railwayIP" readonly>
<label>🎯 Target Server (x-host)</label>
<input type="text" id="targetIP" placeholder="http://example.com:444" value="http://example.com:444">
<div class="info">
<strong>📝 راهنما:</strong> هر IP را در یک خط جداگانه وارد کنید.
</div>
<label>📡 Clean IPs</label>
<textarea id="ips" placeholder="66.33.22.10
66.33.22.15
69.9.164.20"></textarea>
</div>

<button onclick="generate()">✨ تولید کانفیگ</button>

<div class="out" id="output"></div>

<footer>MAHAN CLOUD NETWORK © 2024 | @IR_NETLIFY</footer>
</div>

<script>
const host = location.host;
document.getElementById('railway').value = host;
document.getElementById('railwayIP').value = host;

function toggleMode() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  document.getElementById('domainMode').classList.toggle('hidden', mode !== 'domain');
  document.getElementById('ipListMode').classList.toggle('hidden', mode !== 'iplist');
}

function generate() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const out = document.getElementById('output');
  
  out.innerHTML = '';
  const configs = [];

  if (mode === 'domain') {
    const target = document.getElementById('target').value.trim();
    if (!target) {
      alert('⚠️ لطفاً Target را وارد کنید');
      return;
    }
    const cfg = build(host, target, host);
    configs.push(cfg);
    out.innerHTML = \`<div class="item"><div class="item-header"><span class="item-title">\${host}</span><button class="btn-copy" onclick="copy(this, 0)">📋 کپی</button></div><pre>\${cfg}</pre></div>\`;
  } else {
    const target = document.getElementById('targetIP').value.trim();
    const ipsText = document.getElementById('ips').value.trim();
    if (!target || !ipsText) {
      alert('⚠️ لطفاً Target و لیست IP را وارد کنید');
      return;
    }
    const ips = ipsText.split('\\n').map(x => x.trim()).filter(x => x);
    ips.forEach((ip, i) => {
      const cfg = build(ip, target, host);
      configs.push(cfg);
      out.innerHTML += \`<div class="item"><div class="item-header"><span class="item-title">#\${i+1}: \${ip}</span><button class="btn-copy" onclick="copy(this, \${i})">📋 کپی</button></div><pre>\${cfg}</pre></div>\`;
    });
  }

  out.classList.add('show');
  window.allConfigs = configs;
}

function build(addr, tgt, sni) {
  const extra = {
    "xPaddingBytes": "1-1",
    "xPaddingObfsMode": true,
    "scMaxEachPostBytes": "1000000",
    "xPaddingKey": "iran",
    "xPaddingHeader": "iran",
    "headers": {"x-host": tgt}
  };
  const e = encodeURIComponent(JSON.stringify(extra));
  const p = encodeURIComponent("/IR-NETLIFY");
  
  return \`vless://%40IR_NETLIFY@\${addr}:443?mode=auto&path=\${p}&security=tls&alpn=h2%2Chttp%2F1.1&encryption=none&extra=\${e}&insecure=0&host=\${sni}&fp=chrome&type=xhttp&allowInsecure=0&sni=\${sni}#@IR_NETLIFY\`;
}

function copy(btn, idx) {
  const cfg = window.allConfigs[idx];
  navigator.clipboard.writeText(cfg).then(() => {
    btn.textContent = '✅ کپی شد';
    btn.classList.add('success');
    setTimeout(() => {
      btn.textContent = '📋 کپی';
      btn.classList.remove('success');
    }, 2000);
  }).catch(() => alert('❌ خطا در کپی'));
}
</script>
</body>
</html>`;

  res.writeHead(200, {
    "Content-Type": "text/html; charset=UTF-8",
    "Cache-Control": "public, max-age=3600"
  });
  res.end(html);
}

// ── Error handling ───────────────────────────────────────────────────────────
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err.message);
});

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) return;
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch (e) {}
});

process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err.message, err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED]', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MAHAN] ✓ Server running on port ${PORT}`);
  console.log(`[MAHAN] ✓ Public Path: ${PUBLIC_RELAY_PATH}`);
  console.log(`[MAHAN] ✓ Relay Path: ${RELAY_PATH}`);
  console.log(`[MAHAN] ✓ UUID: @IR_NETLIFY`);
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function end(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function shouldForwardHeader(name) {
  if (FORWARD_HEADER_EXACT.has(name)) return true;
  for (const prefix of FORWARD_HEADER_PREFIXES)
    if (name.startsWith(prefix)) return true;
  return false;
}

function isAllowedRelayPath(pathname, publicPath) {
  return pathname === publicPath || pathname.startsWith(`${publicPath}/`);
}

function mapPublicPathToRelayPath(pathname, publicPath, relayPath) {
  if (pathname === publicPath) return relayPath;
  return `${relayPath}${pathname.slice(publicPath.length)}`;
}

function normalizeRelayPath(rawPath) {
  if (!rawPath) return "";
  const p = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function normalizeIncomingPath(pathname) {
  if (!pathname) return "/";
  let p = String(pathname).replace(/\/{2,}/g, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function parsePositiveInt(raw, fallback, min) {
  const v = Number(raw);
  if (!Number.isFinite(v) || v < min) return fallback;
  return Math.trunc(v);
}
