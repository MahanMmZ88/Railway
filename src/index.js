import http from "node:http";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const PORT = parseInt(process.env.PORT || "8080", 10);

const STRIP_HEADERS = new Set([
  "host", "connection", "proxy-connection", "keep-alive", "via",
  "proxy-authenticate", "proxy-authorization", "te", "trailer",
  "transfer-encoding", "upgrade", "forwarded", "x-forwarded-host",
  "x-forwarded-proto", "x-forwarded-port", "x-forwarded-for", "x-real-ip",
]);

const server = http.createServer(async (req, res) => {
  try {
    let targetBase = req.headers["x-host"];

    if (!targetBase) {
      res.writeHead(400, { "content-type": "text/plain" });
      return res.end("Missing x-host header");
    }

    if (!targetBase.includes(".") && /^[a-zA-Z0-9+/=]+$/.test(targetBase)) {
      try {
        targetBase = Buffer.from(targetBase, 'base64').toString('utf-8').trim();
      } catch (e) {}
    }

    targetBase = targetBase.replace(/\/$/, "");
    if (!targetBase.startsWith("http")) {
      targetBase = `https://${targetBase}`;
    }

    const targetUrl = new URL(req.url, targetBase);

    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (STRIP_HEADERS.has(lower) || lower === "x-host") continue;
      forwardHeaders[lower] = value;
    }

    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
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

    const upstream = await fetch(targetUrl.toString(), fetchOpts);

    res.statusCode = upstream.status;
    for (const [key, value] of upstream.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding" || lower === "connection") continue;
      res.setHeader(key, value);
    }

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
  }
});

server.listen(PORT, () => {
  console.log(`Relay active on port ${PORT}`);
});
