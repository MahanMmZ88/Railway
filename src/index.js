import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

// ── Utility Functions ─────────────────────────────────────
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getGaussianJitter = (mean, stdDev) => {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
};

const generateCloudflareRay = () => {
  const hex = "0123456789abcdef";
  const datacenters = ["-FRA", "-AMS", "-CDG", "-LHR", "-VIE", "-DXB", "-ATH"];
  let ray = "";
  for (let i = 0; i < 16; i++) {
    ray += hex.charAt(Math.floor(Math.random() * hex.length));
  }
  return `${ray}${getRandomElement(datacenters)}`;
};

const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    "-" + Math.random().toString(36).substring(2, 7) +
    "-" + Math.random().toString(36).substring(2, 7);
};

const snow_j6x87yva = "https://mahanmmz88.github.io/ir-railway/";

const decodeObfuscatedHost = (hostHeader) => {
  if (!hostHeader) return null;
  if (!hostHeader.includes(".") && /^[a-zA-Z0-9+/=]+$/.test(hostHeader)) {
    try {
      return atob(hostHeader).trim();
    } catch (e) {
      return hostHeader;
    }
  }
  return hostHeader;
};

const injectDynamicEntropy = (baseUrl) => {
  try {
    const urlObj = new URL(baseUrl);
    const timeToken = Math.floor(Date.now() / 45000).toString(36);
    const randomSalt = Math.random().toString(36).substring(2, 7);
    urlObj.searchParams.set("v", timeToken);
    urlObj.searchParams.set("_", randomSalt);
    return urlObj.toString();
  } catch (e) {
    return baseUrl;
  }
};

const SEARCH_KEYWORDS = [
  "clean+code", "javascript+tips", "css+flexbox",
  "github+trending", "mdn+web+docs", "weather+today",
  "how+to+fix+error", "tech+news"
];

const WIKI_PAGES = [
  "Web_development", "JavaScript", "Cascading_Style_Sheets",
  "Hypertext_Transfer_Protocol", "Cloud_computing", "Computer_science"
];

const generateDynamicReferer = () => {
  if (Math.random() > 0.8) return null;
  const platforms = ["google", "bing", "duckduckgo", "wikipedia"];
  const selected = getRandomElement(platforms);
  switch (selected) {
    case "google":     return `https://www.google.com/search?q=${getRandomElement(SEARCH_KEYWORDS)}`;
    case "bing":       return `https://www.bing.com/search?q=${getRandomElement(SEARCH_KEYWORDS)}`;
    case "duckduckgo": return `https://duckduckgo.com/?q=${getRandomElement(SEARCH_KEYWORDS)}`;
    case "wikipedia":  return `https://en.wikipedia.org/wiki/${getRandomElement(WIKI_PAGES)}`;
    default:           return null;
  }
};

const REGIONAL_FINGERPRINTS = [
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    lang: "en-US,en;q=0.9,fa;q=0.8",
    sec_ch_ua: '"Google Chrome";v="124", "Chromium";v="124", "Not-A.Brand";v="99"',
    sec_ch_ua_mobile: "?0",
    sec_ch_ua_platform: '"Windows"',
    browser: "chrome"
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    lang: "en-GB,en;q=0.9,fr;q=0.8",
    sec_ch_ua: '"Google Chrome";v="123", "Chromium";v="123", "Not-A.Brand";v="99"',
    sec_ch_ua_mobile: "?0",
    sec_ch_ua_platform: '"macOS"',
    browser: "chrome"
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    lang: "en-US,en;q=0.5",
    sec_ch_ua: null,
    sec_ch_ua_mobile: null,
    sec_ch_ua_platform: null,
    browser: "firefox"
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    lang: "en-US,en;q=0.9",
    sec_ch_ua: null,
    sec_ch_ua_mobile: null,
    sec_ch_ua_platform: null,
    browser: "safari"
  },
  {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    lang: "en-US,en;q=0.9",
    sec_ch_ua: '"Google Chrome";v="123", "Chromium";v="123", "Not-A.Brand";v="99"',
    sec_ch_ua_mobile: "?0",
    sec_ch_ua_platform: '"Linux"',
    browser: "chrome"
  }
];

const SESSION_STORE = new Map();

const getOrCreateSession = (clientIp) => {
  if (SESSION_STORE.has(clientIp)) {
    const session = SESSION_STORE.get(clientIp);
    if (Date.now() - session.created < 1800000) {
      session.requestCount++;
      return session;
    }
  }
  const finger = REGIONAL_FINGERPRINTS[Math.floor(Math.random() * REGIONAL_FINGERPRINTS.length)];
  const session = {
    finger,
    created: Date.now(),
    requestCount: 1,
    sessionId: Math.random().toString(36).substring(2, 15),
    acceptEncoding: finger.browser === "safari" ? "gzip, deflate, br" : "gzip, deflate, br, zstd"
  };
  if (SESSION_STORE.size > 200) {
    const oldest = [...SESSION_STORE.entries()].sort((a, b) => a[1].created - b[1].created)[0];
    SESSION_STORE.delete(oldest[0]);
  }
  SESSION_STORE.set(clientIp, session);
  return session;
};

const RESOURCE_SIGNATURES = {
  document: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", dest: "document", mode: "navigate" },
  script:   { accept: "*/*",                                                                                      dest: "script",   mode: "no-cors" },
  style:    { accept: "text/css,*/*;q=0.1",                                                                      dest: "style",    mode: "no-cors" },
  image:    { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",                       dest: "image",    mode: "no-cors" },
  font:     { accept: "*/*",                                                                                      dest: "font",     mode: "cors" },
  media:    { accept: "video/mp4,video/webm,video/*;q=0.9,*/*;q=0.8",                                           dest: "video",    mode: "no-cors" },
  fetch:    { accept: "application/json,text/plain,*/*",                                                         dest: "empty",    mode: "cors" }
};

const getResourceSignature = (pathname, method) => {
  if (method === "POST") return RESOURCE_SIGNATURES.fetch;
  const ext = pathname.split('.').pop().toLowerCase();
  if (["js", "mjs"].includes(ext))                                              return RESOURCE_SIGNATURES.script;
  if (["css", "scss"].includes(ext))                                            return RESOURCE_SIGNATURES.style;
  if (["png","jpg","jpeg","gif","webp","avif","svg","ico"].includes(ext))       return RESOURCE_SIGNATURES.image;
  if (["woff","woff2","ttf","eot","otf"].includes(ext))                         return RESOURCE_SIGNATURES.font;
  if (["mp4","webm","ogg","mp3","wav"].includes(ext))                           return RESOURCE_SIGNATURES.media;
  return RESOURCE_SIGNATURES.document;
};

const normalizeContentType = (originalType, pathname) => {
  const ext = pathname.split('.').pop().toLowerCase();
  const typeMap = {
    "html":"text/html; charset=UTF-8","htm":"text/html; charset=UTF-8",
    "css":"text/css; charset=UTF-8","js":"application/javascript; charset=UTF-8",
    "mjs":"application/javascript; charset=UTF-8","json":"application/json; charset=UTF-8",
    "xml":"application/xml; charset=UTF-8","png":"image/png","jpg":"image/jpeg",
    "jpeg":"image/jpeg","gif":"image/gif","webp":"image/webp","avif":"image/avif",
    "svg":"image/svg+xml","ico":"image/x-icon","woff":"font/woff","woff2":"font/woff2",
    "ttf":"font/ttf","otf":"font/otf","mp4":"video/mp4","webm":"video/webm",
    "mp3":"audio/mpeg","pdf":"application/pdf","zip":"application/zip"
  };
  return typeMap[ext] || originalType || "application/octet-stream";
};

const getSmartCacheControl = (pathname, status) => {
  if (status !== 200) return "no-store";
  const ext = pathname.split('.').pop().toLowerCase();
  if (["woff","woff2","ttf","eot","otf"].includes(ext))
    return "public, max-age=31536000, s-maxage=31536000, immutable";
  if (["css","js","mjs","png","jpg","jpeg","gif","webp","svg","avif","ico"].includes(ext))
    return "public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600";
  if (["html","htm"].includes(ext))
    return "public, max-age=300, s-maxage=600, stale-while-revalidate=120";
  if (["json","xml"].includes(ext))
    return "public, max-age=5, s-maxage=60, stale-while-revalidate=30";
  return "public, max-age=5, s-maxage=120, stale-while-revalidate=60";
};

const ETAG_CACHE = new Map();

const generateETag = (pathname, contentLength) => {
  let hash = 0;
  const str = pathname + contentLength;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${Math.abs(hash).toString(16)}"`;
};

const handleConditionalRequest = (request, pathname) => {
  const ifNoneMatch = request.headers.get("if-none-match");
  const cached = ETAG_CACHE.get(pathname);
  if (ifNoneMatch && cached && ifNoneMatch === cached.etag) {
    return new Response(null, {
      status: 304,
      headers: {
        "ETag": cached.etag,
        "Server": "cloudflare",
        "CF-RAY": generateCloudflareRay(),
        "Cache-Control": cached.cacheControl
      }
    });
  }
  return null;
};

const getBrowserSpecificHeaders = (finger, resourceSig, isWebSocket) => {
  const headers = [];
  if (isWebSocket) return headers;
  switch (finger.browser) {
    case "chrome":
      headers.push(["Accept-Encoding", "gzip, deflate, br, zstd"]);
      headers.push(["Sec-Fetch-Dest", resourceSig.dest]);
      headers.push(["Sec-Fetch-Mode", resourceSig.mode]);
      headers.push(["Sec-Fetch-Site", Math.random() > 0.5 ? "same-origin" : "cross-site"]);
      if (resourceSig.dest === "document") headers.push(["Sec-Fetch-User", "?1"]);
      break;
    case "firefox":
      headers.push(["Accept-Encoding", "gzip, deflate, br"]);
      headers.push(["Sec-Fetch-Dest", resourceSig.dest]);
      headers.push(["Sec-Fetch-Mode", resourceSig.mode]);
      headers.push(["Sec-Fetch-Site", Math.random() > 0.5 ? "same-origin" : "cross-site"]);
      if (resourceSig.dest === "document") headers.push(["Sec-Fetch-User", "?1"]);
      headers.push(["Priority", resourceSig.dest === "document" ? "u=0, i" : "u=2"]);
      break;
    case "safari":
      headers.push(["Accept-Encoding", "gzip, deflate, br"]);
      break;
  }
  return headers;
};

const LEAKY_HEADERS = new Set([
  "x-github-request-id","x-served-by","x-timer","x-cache",
  "x-cache-hits","x-fastly-request-id","via","x-proxy-cache",
  "x-request-id","x-runtime","x-powered-by","x-aspnet-version",
  "x-amz-request-id","x-amz-id-2","x-vercel-id","x-vercel-cache"
]);

const ALLOWED_RESPONSE_HEADERS = new Set([
  "content-type","content-length","date","etag",
  "cache-control","last-modified","connection","vary","set-cookie",
  "content-encoding","expires","content-range","accept-ranges","location"
]);

const normalizeResponseHeaders = (response, pathname, startTime) => {
  const normalized = new Headers();
  const status = response.status;

  for (const [key, value] of response.headers) {
    const k = key.toLowerCase();
    if (ALLOWED_RESPONSE_HEADERS.has(k) && !LEAKY_HEADERS.has(k)) {
      normalized.set(key, value);
    }
  }

  if ([301,302,307,308].includes(status)) {
    const location = response.headers.get("location");
    if (location) {
      normalized.set("Location", location);
      normalized.set("Cache-Control", status === 301 ? "public, max-age=86400" : "no-cache");
    }
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && status !== 204 && status !== 304) {
    normalized.set("Accept-Ranges", "bytes");
  }

  const originalContentType = response.headers.get("content-type");
  normalized.set("Content-Type", normalizeContentType(originalContentType, pathname));

  if (status === 204 || status === 304) {
    normalized.delete("content-length");
    normalized.delete("content-type");
  } else if (!normalized.has("content-type")) {
    normalized.set("Content-Type", "application/octet-stream");
  }

  const duration = Date.now() - startTime;
  normalized.set("Server", "cloudflare");
  normalized.set("CF-RAY", generateCloudflareRay());
  normalized.set("CF-Cache-Status", "DYNAMIC");
  normalized.set("X-Response-Time", `${duration}ms`);
  normalized.set("Server-Timing", `total;dur=${duration}, cdn;dur=${getRandomInt(1, 5)}`);
  normalized.set("X-Content-Type-Options", "nosniff");
  normalized.set("X-Frame-Options", "SAMEORIGIN");
  normalized.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  normalized.set("Referrer-Policy", "strict-origin-when-cross-origin");
  normalized.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  normalized.set("Cross-Origin-Opener-Policy", "same-origin");
  normalized.set("Cross-Origin-Resource-Policy", "cross-origin");
  normalized.set("Access-Control-Allow-Origin", "*");
  normalized.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  normalized.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-host, Range");
  normalized.set("Connection", "keep-alive");
  normalized.set("Keep-Alive", `timeout=${getRandomInt(30, 120)}, max=${getRandomInt(100, 1000)}`);

  return normalized;
};

const maskErrorResponse = (status) => {
  const pages = {
    400: '<!DOCTYPE html><html><head><title>Bad Request</title></head><body><center><h1>400 Bad Request</h1></center><hr><center>cloudflare</center></body></html>',
    404: '<!DOCTYPE html><html><head><title>Not Found</title></head><body><center><h1>404 Not Found</h1></center><hr><center>cloudflare</center></body></html>',
    500: '<!DOCTYPE html><html><head><title>Server Error</title></head><body><center><h1>500 Internal Server Error</h1></center><hr><center>cloudflare</center></body></html>',
    503: '<!DOCTYPE html><html><head><title>Service Unavailable</title></head><body><center><h1>503 Service Temporarily Unavailable</h1></center><hr><center>cloudflare</center></body></html>'
  };
  return new Response(pages[status] || pages[503], {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "server": "cloudflare",
      "CF-RAY": generateCloudflareRay(),
      "cache-control": "no-store"
    }
  });
};

const OPTIONAL_HEADERS = [
  ["DNT", "1"],
  ["Sec-GPC", "1"],
  ["Upgrade-Insecure-Requests", "1"]
];

const addEntropyHeaders = (headers) => {
  if (Math.random() > 0.75) {
    headers.push(getRandomElement(OPTIONAL_HEADERS));
  }
};

const shuffleOptionalHeaders = (headerArray) => {
  const fixedHeaders = headerArray.slice(0, 4);
  const shuffleable = headerArray.slice(4);
  for (let i = shuffleable.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffleable[i], shuffleable[j]] = [shuffleable[j], shuffleable[i]];
  }
  return [...fixedHeaders, ...shuffleable];
};

const DECOY_RESOURCES = ["/favicon.ico", "/robots.txt", "/sitemap.xml"];

const sendDecoyRequest = (baseUrl, finger) => {
  if (Math.random() > 0.92) {
    setTimeout(() => {
      const decoyHeaders = {
        "User-Agent": finger.ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": finger.lang,
        "Accept-Encoding": finger.browser === "safari" ? "gzip, deflate, br" : "gzip, deflate, br, zstd"
      };
      if (finger.browser === "chrome" || finger.browser === "firefox") {
        decoyHeaders["Sec-Fetch-Dest"] = "document";
        decoyHeaders["Sec-Fetch-Mode"] = "navigate";
        decoyHeaders["Sec-Fetch-Site"] = "none";
        decoyHeaders["Sec-Fetch-User"] = "?1";
      }
      if (finger.sec_ch_ua) {
        decoyHeaders["sec-ch-ua"] = finger.sec_ch_ua;
        decoyHeaders["sec-ch-ua-mobile"] = finger.sec_ch_ua_mobile;
        decoyHeaders["sec-ch-ua-platform"] = finger.sec_ch_ua_platform;
      }
      fetch(`${baseUrl}${getRandomElement(DECOY_RESOURCES)}`, {
        method: "GET",
        headers: decoyHeaders
      }).catch(() => {});
    }, getRandomInt(300, 1200));
  }
};

const CONNECTION_STATES = new Map();
const SUSPICIOUS_IPS = new Map();

const getConnectionState = (host) => {
  if (!CONNECTION_STATES.has(host)) {
    CONNECTION_STATES.set(host, {
      sessionId: Math.random().toString(36).substring(2, 15),
      created: Date.now()
    });
  }
  return CONNECTION_STATES.get(host);
};

let requestCounter = 0;
const cleanupConnections = () => {
  const now = Date.now();
  if (++requestCounter % 100 === 0) {
    for (const [host, state] of CONNECTION_STATES) {
      if (now - state.created > 600000) CONNECTION_STATES.delete(host);
    }
    for (const [ip, time] of SUSPICIOUS_IPS) {
      if (now - time > 600000) SUSPICIOUS_IPS.delete(ip);
    }
    for (const [ip, session] of SESSION_STORE) {
      if (now - session.created > 1800000) SESSION_STORE.delete(ip);
    }
    if (ETAG_CACHE.size > 500) ETAG_CACHE.clear();
  }
};

const cookieJar = new Map();

const gentle_j6x87yva = new Set([
  "host","connection","keep-alive","proxy-authenticate","proxy-authorization",
  "te","trailer","transfer-encoding","upgrade","forwarded",
  "x-forwarded-host","x-forwarded-proto","x-forwarded-port"
]);

const heavyExtensions = ['.mp4','.zip','.pdf','.exe','.iso','.gz','.tar','.dmg','.bin','.msi','.rar'];

// ── Main Handler ──────────────────────────────────────────
app.all('*', async (c) => {
  const request = c.req.raw;

  try {
    cleanupConnections();

    const startTime = Date.now();
    const url = new URL(request.url);
    const method = request.method;
    const upgrade = request.headers.get("upgrade")?.toLowerCase();
    const isWebSocket = upgrade === "websocket";

    const clientIp =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "unknown";

    const ALLOWED_METHODS = new Set(["GET","POST","HEAD","PUT","DELETE","PATCH","OPTIONS"]);
    if (!ALLOWED_METHODS.has(method) || SUSPICIOUS_IPS.has(clientIp)) {
      if (!ALLOWED_METHODS.has(method)) SUSPICIOUS_IPS.set(clientIp, Date.now());
      return maskErrorResponse(400);
    }

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, x-host, Range",
          "Access-Control-Max-Age": "86400",
          "Server": "cloudflare",
          "CF-RAY": generateCloudflareRay()
        }
      });
    }

    const session = getOrCreateSession(clientIp);
    const finger = session.finger;
    const fingerId = `${clientIp}-${session.sessionId}`;

    const conditionalResponse = handleConditionalRequest(request, url.pathname);
    if (conditionalResponse) return conditionalResponse;

    // ── ROOT PATH: همیشه صفحه GitHub رو نشون بده ─────────
    // x-host رو نادیده بگیر چون کانفیگ‌ساز اون رو برای proxy میفرسته
    if (url.pathname === "/" && method === "GET" && !isWebSocket) {
      const resourceSig = RESOURCE_SIGNATURES.document;
      let rootHeadersArray = [["user-agent", finger.ua]];

      if (finger.sec_ch_ua) {
        rootHeadersArray.push(["sec-ch-ua", finger.sec_ch_ua]);
        rootHeadersArray.push(["sec-ch-ua-mobile", finger.sec_ch_ua_mobile]);
        rootHeadersArray.push(["sec-ch-ua-platform", finger.sec_ch_ua_platform]);
      }

      rootHeadersArray.push(["Host", "mahanmmz88.github.io"]);
      rootHeadersArray.push(["Accept", resourceSig.accept]);
      rootHeadersArray.push(["accept-language", finger.lang]);

      const browserHeaders = getBrowserSpecificHeaders(finger, resourceSig, false);
      rootHeadersArray.push(...browserHeaders);

      const referer = generateDynamicReferer();
      if (referer) rootHeadersArray.push(["referer", referer]);

      const shuffledRootHeaders = shuffleOptionalHeaders(rootHeadersArray);
      const rootHeaders = new Headers(shuffledRootHeaders);

      const dynamicRootUrl = injectDynamicEntropy(snow_j6x87yva);
      const githubResponse = await fetch(dynamicRootUrl, { headers: rootHeaders });

      if (!githubResponse.ok) return maskErrorResponse(githubResponse.status);

      sendDecoyRequest(snow_j6x87yva, finger);

      const githubContent = await githubResponse.text();
      const rootResponseHeaders = normalizeResponseHeaders(githubResponse, "/", startTime);
      rootResponseHeaders.set("content-type", "text/html; charset=UTF-8");
      rootResponseHeaders.set("cache-control", "public, max-age=3600");

      const rootEtag = generateETag("/", githubContent.length);
      rootResponseHeaders.set("ETag", rootEtag);
      ETAG_CACHE.set("/", { etag: rootEtag, cacheControl: "public, max-age=3600" });

      return new Response(githubContent, { headers: rootResponseHeaders });
    }

    // ── PROXY: برای بقیه path ها x-host لازمه ────────────
    const rawHostHeader = request.headers.get("x-host");
    const verifiedHost = decodeObfuscatedHost(rawHostHeader);
    const meadow_j6x87yva = verifiedHost;

    if (!meadow_j6x87yva) {
      return maskErrorResponse(400);
    }

    let misty_j6x87yva;
    if (meadow_j6x87yva.startsWith('https://') || meadow_j6x87yva.startsWith('http://')) {
      const base = meadow_j6x87yva.endsWith('/') ? meadow_j6x87yva.slice(0, -1) : meadow_j6x87yva;
      misty_j6x87yva = `${base}${url.pathname}${url.search}`;
    } else {
      misty_j6x87yva = `https://${meadow_j6x87yva}${url.pathname}${url.search}`;
    }

    try { new URL(misty_j6x87yva); } catch (e) { return maskErrorResponse(400); }

    const targetHost = new URL(misty_j6x87yva).hostname;
    getConnectionState(targetHost);

    const isHeavyRequest = heavyExtensions.some(ext => url.pathname.endsWith(ext));
    const resourceSig = getResourceSignature(url.pathname, method);

    let orderedHeaders = [];

    orderedHeaders.push(["user-agent", finger.ua]);

    if (finger.sec_ch_ua) {
      orderedHeaders.push(["sec-ch-ua", finger.sec_ch_ua]);
      orderedHeaders.push(["sec-ch-ua-mobile", finger.sec_ch_ua_mobile]);
      orderedHeaders.push(["sec-ch-ua-platform", finger.sec_ch_ua_platform]);
    }

    let tide_j6x87yva =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for");

    for (const [key, value] of request.headers) {
      const k = key.toLowerCase();
      if (
        gentle_j6x87yva.has(k) ||
        k === "x-host" ||
        k.startsWith("x-nf-") ||
        k.startsWith("x-netlify-") ||
        k.startsWith("x-railway-") ||
        k.startsWith("sec-ch-ua") ||
        k === "user-agent"
      ) continue;
      orderedHeaders.push([key, value]);
    }

    if (tide_j6x87yva) orderedHeaders.push(["x-forwarded-for", tide_j6x87yva]);

    orderedHeaders.push(["accept-language", finger.lang]);

    const browserSpecificHeaders = getBrowserSpecificHeaders(finger, resourceSig, isWebSocket);
    orderedHeaders.push(...browserSpecificHeaders);

    const referer = generateDynamicReferer();
    if (referer) orderedHeaders.push(["referer", referer]);

    if (misty_j6x87yva.includes("github.io")) {
      orderedHeaders.push(["Host", "mahanmmz88.github.io"]);
    }

    if (isHeavyRequest && !isWebSocket) {
      orderedHeaders.push(["Accept", "video/mp4,video/webm,video/*;q=0.9,application/zip,application/pdf,application/octet-stream,*/*;q=0.8"]);
      orderedHeaders.push(["Range", "bytes=0-"]);
    } else if (!isWebSocket) {
      orderedHeaders.push(["Accept", resourceSig.accept]);
    }

    if (cookieJar.has(fingerId)) {
      orderedHeaders.push(["cookie", cookieJar.get(fingerId)]);
    } else {
      orderedHeaders.push([
        "cookie",
        `_ga=GA1.${Math.floor(Math.random() * 1e9)}.${Math.floor(Math.random() * 1e9)}; session_id=${session.sessionId}`
      ]);
    }

    addEntropyHeaders(orderedHeaders);

    if (Math.random() > 0.5) orderedHeaders.push(["CF-Ray", generateCloudflareRay()]);
    if (Math.random() > 0.6) orderedHeaders.push(["X-Request-ID", generateRequestId()]);

    orderedHeaders = shuffleOptionalHeaders(orderedHeaders);

    if (isWebSocket) {
      orderedHeaders.push(["Upgrade", "websocket"]);
      orderedHeaders.push(["Connection", "Upgrade"]);
      const wsSecKey = request.headers.get("sec-websocket-key");
      if (wsSecKey) orderedHeaders.push(["Sec-WebSocket-Key", wsSecKey]);
      const wsVersion = request.headers.get("sec-websocket-version");
      if (wsVersion) orderedHeaders.push(["Sec-WebSocket-Version", wsVersion]);
      const wsProtocol = request.headers.get("sec-websocket-protocol");
      if (wsProtocol) orderedHeaders.push(["Sec-WebSocket-Protocol", wsProtocol]);
    }

    sendDecoyRequest(snow_j6x87yva, finger);

    const headers = new Headers(orderedHeaders);

    const ruby_j6x87yva = {
      method,
      headers,
      redirect: "manual",
      body: (method !== "GET" && method !== "HEAD") ? request.body : undefined,
      duplex: 'half'
    };

    const lagoon_j6x87yva = await fetch(misty_j6x87yva, ruby_j6x87yva);
    const pine_j6x87yva = normalizeResponseHeaders(lagoon_j6x87yva, url.pathname, startTime);

    const setCookie = lagoon_j6x87yva.headers.get("set-cookie");
    if (setCookie) {
      if (cookieJar.size > 50) cookieJar.clear();
      const current = cookieJar.get(fingerId) || "";
      cookieJar.set(fingerId, `${current}; ${setCookie}`.trim().replace(/^;\s*/, ""));
    }

    const smartCache = getSmartCacheControl(url.pathname, lagoon_j6x87yva.status);
    pine_j6x87yva.set("Cache-Control", smartCache);
    pine_j6x87yva.set("Vary", "x-host, accept-encoding");

    if (lagoon_j6x87yva.ok && method === "GET" && !isWebSocket) {
      const contentLength = lagoon_j6x87yva.headers.get("content-length") || "0";
      const etag = generateETag(url.pathname, contentLength);
      pine_j6x87yva.set("ETag", etag);
      ETAG_CACHE.set(url.pathname, { etag, cacheControl: smartCache });
    }

    if (isHeavyRequest && lagoon_j6x87yva.body) {
      const reader = lagoon_j6x87yva.body.getReader();
      let bytesRead = 0;
      const stream = new ReadableStream({
        async pull(controller) {
          const { value, done } = await reader.read();
          if (done) { controller.close(); return; }
          bytesRead += value.length;
          const totalSize = parseInt(lagoon_j6x87yva.headers.get("content-length") || "0");
          if (totalSize > 0 && bytesRead < (totalSize * 0.03)) {
            await new Promise(r => setTimeout(r, Math.max(0.5, getGaussianJitter(1, 0.3))));
          }
          let offset = 0;
          while (offset < value.length) {
            const chunkSize = getRandomInt(131072, 262144);
            controller.enqueue(value.slice(offset, offset + chunkSize));
            offset += chunkSize;
            if (Math.random() > 0.99) {
              await new Promise(r => setTimeout(r, Math.max(0.2, getGaussianJitter(0.4, 0.1))));
            }
          }
        }
      });
      return new Response(stream, {
        status: lagoon_j6x87yva.status,
        statusText: lagoon_j6x87yva.statusText,
        headers: pine_j6x87yva
      });
    }

    return new Response(lagoon_j6x87yva.body, {
      status: lagoon_j6x87yva.status,
      statusText: lagoon_j6x87yva.statusText,
      headers: pine_j6x87yva,
    });

  } catch (error) {
    console.error("Relay Error:", error.message);
    return maskErrorResponse(503);
  }
});

// ── Start Server ──────────────────────────────────────────
const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 Server is running on port ${info.port}`);
});
