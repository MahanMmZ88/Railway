import http from "node:http";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// گرفتن متغیرها (بدون کرش کردن در صورت خالی بودن)
const getTargetBase       = () => (process.env.TARGET_DOMAIN      || "").replace(/\/$/, "");
const getPublicRelayPath  = () => normalizeRelayPath(process.env.PUBLIC_RELAY_PATH || "/api");
const getRelayPath         = () => normalizeRelayPath(process.env.RELAY_PATH        || "/api");
const getRelayKey          = () => (process.env.RELAY_KEY          || "").trim();

const UPSTREAM_TIMEOUT_MS = parsePositiveInt(process.env.UPSTREAM_TIMEOUT_MS, 0, 1000);
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
]);

let inFlight = 0;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // مقادیر متغیرها در لحظه ریکوئست خوانده می‌شوند
  const TARGET_BASE = getTargetBase();
  const PUBLIC_RELAY_PATH = getPublicRelayPath();
  const RELAY_PATH = getRelayPath();
  const RELAY_KEY = getRelayKey();

  // ── Debug endpoint ──────────────────────────────────────────────────────────
  if (url.pathname === "/__debug") {
    const body = JSON.stringify({
      TARGET_BASE,
      PUBLIC_RELAY_PATH,
      RELAY_PATH,
      RELAY_KEY_SET:        !!RELAY_KEY,
      UPSTREAM_TIMEOUT_MS,
      MAX_INFLIGHT,
      inFlight,
    }, null, 2);
    res.writeHead(200, { "content-type": "application/json" });
    return res.end(body);
  }

  // ── بررسی روتینگ اصلی برای لود کردن پنل یا اجرای رله ─────────────────────────
  const normalizedPath = normalizeIncomingPath(url.pathname);
  const isRelayRoute = isAllowedRelayPath(normalizedPath, PUBLIC_RELAY_PATH);

  // اگر کاربر مسیر رله را صدا نزند، پنل مدرن کانفیگ‌ساز Mahan Panel لود می‌شود
  if (!isRelayRoute) {
    res.writeHead(200, { "content-type": "text/html; charset=UTF-8" });
    return res.end(`
      <!DOCTYPE html>
      <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mahan Panel - Config Generator</title>
        <style>
          :root {
            --bg-main: #0a0f1d;
            --bg-card: #121829;
            --accent: #00ff66;
            --accent-hover: #00cc52;
            --text-main: #f1f5f9;
            --text-muted: #64748b;
            --border: #1e293b;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
          body {
            background-color: var(--bg-main);
            color: var(--text-main);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          .container {
            background-color: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            width: 100%;
            max-width: 550px;
            padding: 32px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
          header { text-align: center; margin-bottom: 28px; }
          header h1 { color: var(--accent); font-size: 24px; font-weight: 700; margin-bottom: 6px; letter-spacing: 1px; }
          header p { color: var(--text-muted); font-size: 14px; }
          .form-group { margin-bottom: 20px; }
          .form-group label { display: block; font-size: 14px; color: var(--text-main); margin-bottom: 8px; font-weight: 500; }
          .form-group input {
            width: 100%;
            background-color: var(--bg-main);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            color: var(--text-main);
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
          }
          .form-group input:focus { border-color: var(--accent); }
          .form-group input[readonly] { color: var(--text-muted); cursor: not-allowed; }
          button.btn {
            width: 100%;
            background-color: var(--accent);
            color: #020617;
            border: none;
            border-radius: 8px;
            padding: 14px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s;
            margin-top: 10px;
          }
          button.btn:hover { background-color: var(--accent-hover); }
          .output-section { margin-top: 28px; display: none; }
          .output-section.active { display: block; }
          .output-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .output-header span { font-size: 14px; font-weight: 500; }
          .output-box {
            position: relative;
            background-color: var(--bg-main);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            font-size: 13px;
            word-break: break-all;
            color: #94a3b8;
            direction: ltr;
            text-align: left;
            min-height: 60px;
          }
          .btn-copy {
            background-color: var(--border);
            color: var(--text-main);
            border: none;
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .btn-copy:hover { background-color: #334155; }
          .btn-copy.success { background-color: var(--accent); color: #020617; }
          footer { text-align: center; margin-top: 32px; font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px; letter-spacing: 0.5px; }
        </style>
      </head>
      <body>

        <div class="container">
          <header>
            <h1>MAHAN PANEL</h1>
            <p>سامانه هوشمند تولید کانفیگ اختصاصی رله</p>
          </header>

          <div class="form-group">
            <label for="domain">دامنه شناسایی شده (خودکار)</label>
            <input type="text" id="domain" readonly>
          </div>

          <div class="form-group">
            <label for="uuid">شناسه کاربر (UUID)</label>
            <input type="text" id="uuid" placeholder="مثال: abb4792d-cde2-4067-8aa3-499959de5d3e">
          </div>

          <button class="btn" onclick="generateConfig()">تولید لینک کانفیگ</button>

          <div class="output-section" id="outputSection">
            <div class="output-header">
              <span>لینک کانفیگ VLESS اختصاصی شما:</span>
              <button class="btn-copy" id="copyBtn" onclick="copyToClipboard()">کپی کانفیگ</button>
            </div>
            <div class="output-box" id="configOutput"></div>
          </div>

          <footer>MAHAN CLOUD NETWORK</footer>
        </div>

        <script>
          // تشخیص خودکار دامنه‌ای که سایت در حال حاضر روی آن باز شده است
          const currentHost = window.location.host;
          document.getElementById('domain').value = currentHost;

          // متغیر مسیر رله عمومی دریافتی از سمت سرور node
          const publicPath = encodeURIComponent("${PUBLIC_RELAY_PATH}");

          function generateConfig() {
            const uuidInput = document.getElementById('uuid').value.trim();
            const outputSection = document.getElementById('outputSection');
            const configOutput = document.getElementById('configOutput');
            const copyBtn = document.getElementById('copyBtn');

            if (!uuidInput) {
              alert('لطفاً ابتدا فیلد UUID را پر کنید.');
              return;
            }

            // ریست کردن وضعیت دکمه کپی
            copyBtn.innerText = "کپی کانفیگ";
            copyBtn.classList.remove('success');

            // ساخت دقیق استراکچر لینک کانفیگ منطبق با فیلدهای جایگزین شده دینامیک
            const config = "vless://" + uuidInput + "@" + currentHost + ":443?mode=auto&path=" + publicPath + "&security=tls&alpn=http%2F1.1%2Ch2&encryption=none&insecure=0&host=" + currentHost + "&fp=chrome&type=xhttp&allowInsecure=0&sni=" + currentHost + "#Railway-mahan";

            configOutput.innerText = config;
            outputSection.classList.add('active');
          }

          function copyToClipboard() {
            const configText = document.getElementById('configOutput').innerText;
            const copyBtn = document.getElementById('copyBtn');

            navigator.clipboard.writeText(configText).then(() => {
              copyBtn.innerText = "کپی شد! ✓";
              copyBtn.classList.add('success');
            }).catch(err => {
              alert('خطا در کپی کردن متن.');
            });
          }
        </script>
      </body>
      </html>
    `);
  }

  // ── Config checks ───────────────────────────────────────────────────────────
  if (!TARGET_BASE)           return end(res, 500, "Misconfigured: TARGET_DOMAIN is not set");
  if (!RELAY_PATH)            return end(res, 500, "Misconfigured: RELAY_PATH is not set");
  if (RELAY_PATH === "/")     return end(res, 500, "Misconfigured: RELAY_PATH cannot be '/'");
  if (!PUBLIC_RELAY_PATH)     return end(res, 500, "Misconfigured: PUBLIC_RELAY_PATH is not set");
  if (PUBLIC_RELAY_PATH==="/")return end(res, 500, "Misconfigured: PUBLIC_RELAY_PATH cannot be '/'");
  if (RELAY_KEY && RELAY_KEY.length < 16) return end(res, 500, "Misconfigured: RELAY_KEY is too short");

  if (!ALLOWED_METHODS.has(req.method))
    return end(res, 405, "Method Not Allowed", { allow: "GET, HEAD, POST" });

  // ── Auth ────────────────────────────────────────────────────────────────────
  if (RELAY_KEY) {
    const token = (req.headers["x-relay-key"] || "").toString();
    if (token !== RELAY_KEY) return end(res, 403, "Forbidden");
  }

  // ── Inflight limit ──────────────────────────────────────────────────────────
  if (inFlight >= MAX_INFLIGHT) {
    res.setHeader("retry-after", "1");
    return end(res, 503, "Server Busy: Too Many Inflight Requests");
  }
  inFlight++;

  try {
    const upstreamPath = mapPublicPathToRelayPath(normalizedPath, PUBLIC_RELAY_PATH, RELAY_PATH);
    const targetUrl    = `${TARGET_BASE}${upstreamPath}${url.search || ""}`;

    // ── Forward headers ───────────────────────────────────────────────────────
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower))   continue;
      if (lower === "x-relay-key")    continue;
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
    if (err?.name === "AbortError") {
      if (!res.headersSent) end(res, 504, "Gateway Timeout: Upstream Timeout");
    } else {
      if (!res.headersSent) end(res, 502, "Bad Gateway: " + String(err));
    }
  } finally {
    inFlight = Math.max(0, inFlight - 1);
  }
});

server.listen(PORT, () => {
  console.log(`MAHAN XHTTP Relay listening on port ${PORT}`);
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
