import http from "node:http";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// پورت خودکار توسط Railway تنظیم می‌شود
const PORT = parseInt(process.env.PORT || "8080", 10);

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
const MAX_INFLIGHT = 1024; // ظرفیت پردازش همزمان پکت‌ها برای پایداری پینگ ماهان

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  // ── صفحه فرانت‌باند پیش‌فرض (Mahan Panel) ────────────────────────────────────
  // اگر هدر x-host فرستاده نشود (مثل مرورگر عادی یا اسکنرها)، این صفحه باز می‌شود
  if (!req.headers["x-host"]) {
    res.writeHead(200, { "content-type": "text/html; charset=UTF-8" });
    return res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mahan Panel</title>
        <style>
          body { background-color: #111; color: #eee; font-family: sans-serif; text-align: center; padding-top: 15%; }
          h1 { color: #00ff66; }
        </style>
      </head>
      <body>
        <h1>Mahan Panel</h1>
        <p>The network connection is established successfully.</p>
        <hr style="width:200px; border-color:#333;">
        <p style="font-size:12px; color:#666;">MAHAN CLOUD NETWORK</p>
      </body>
      </html>
    `);
  }

  // ── استخراج هوشمند آدرس مقصد از هدر x-host ──────────────────────────────────
  let targetBase = req.headers["x-host"].toString().trim();

  // اگر هدر به صورت Base64 انکود شده باشد، آن را دکود می‌کند
  if (!targetBase.includes(".") && /^[a-zA-Z0-9+/=]+$/.test(targetBase)) {
    try {
      targetBase = Buffer.from(targetBase, "base64").toString("utf-8").trim();
    } catch (e) {}
  }

  targetBase = targetBase.replace(/\/$/, "");
  if (!targetBase.startsWith("http")) {
    targetBase = `https://${targetBase}`; // پیش‌فرض روی پروتکل امن HTTPS
  }

  // بررسی متد ریکوئست
  if (!ALLOWED_METHODS.has(req.method)) {
    res.writeHead(405, { "allow": "GET, HEAD, POST" });
    return res.end("Method Not Allowed");
  }

  // ── کنترل بارگذاری سرور برای پایداری پینگ ───────────────────────────────────
  if (inFlight >= MAX_INFLIGHT) {
    res.setHeader("retry-after", "1");
    res.writeHead(503);
    return res.end("Server Busy");
  }
  inFlight++;

  try {
    // ساخت آدرس کامل مقصد بر اساس روتینگ کلاینت (Wildcard / Every Path)
    const targetUrl = new URL(req.url, targetBase);

    // ── فیلتر و بازسازی هدرها ─────────────────────────────────────────────────
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower) || lower === "x-host") continue;
      if (FORWARD_HEADER_EXACT.has(lower) || FORWARD_HEADER_PREFIXES.some(p => lower.startsWith(p))) {
        forwardHeaders[lower] = value;
      }
    }

    // تنظیم هدر هاست مقصد برای عبور از فایروال سرور اصلی
    forwardHeaders["host"] = targetUrl.host;

    // فوروارد کردن آی‌پی کلاینت
    const clientIp = req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    if (clientIp) forwardHeaders["x-forwarded-for"] = clientIp;

    const fetchOpts = {
      method: req.method,
      headers: forwardHeaders,
      redirect: "manual",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOpts.body = Readable.toWeb(req);
      fetchOpts.duplex = "half";
    }

    // ── ارسال پکت به مقصد نهایی تعیین شده در هدر ───────────────────────────────
    const upstream = await fetch(targetUrl.toString(), fetchOpts);

    res.statusCode = upstream.status;
    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding" || lower === "connection") continue;
      try { res.setHeader(key, value); } catch {}
    }

    // امضای اختصاصی شبکه MAHAN
    res.setHeader("server", "MAHAN");

    if (!upstream.body) {
      res.end();
    } else {
      await pipeline(Readable.fromWeb(upstream.body), res);
    }

  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(502);
      res.end("Bad Gateway: " + String(err));
    }
  } finally {
    inFlight = Math.max(0, inFlight - 1);
  }
});

server.listen(PORT, () => {
  console.log(`MAHAN Dynamic Relay active on port ${PORT}`);
});
