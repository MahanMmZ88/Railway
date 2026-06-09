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
  for (let i = 0; i < 16; i++) ray += hex.charAt(Math.floor(Math.random() * hex.length));
  return `${ray}${getRandomElement(datacenters)}`;
};

const generateRequestId = () => {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    "-" + Math.random().toString(36).substring(2, 7) +
    "-" + Math.random().toString(36).substring(2, 7);
};

// ── GitHub Pages URL ──────────────────────────────────────
const snow_j6x87yva = "https://mahanmmz88.github.io/ir-railway/";

const decodeObfuscatedHost = (hostHeader) => {
  if (!hostHeader) return null;
  if (!hostHeader.includes(".") && /^[a-zA-Z0-9+/=]+$/.test(hostHeader)) {
    try { return atob(hostHeader).trim(); } catch (e) { return hostHeader; }
  }
  return hostHeader;
};

const injectDynamicEntropy = (baseUrl) => {
  try {
    const urlObj = new URL(baseUrl);
    const timeToken = Math.floor(Date.now() / 7200000).toString(36); // ✅ سطح 3: 2 ساعت
    urlObj.searchParams.set("v", timeToken);
    return urlObj.toString();
  } catch (e) { return baseUrl; }
};

const SEARCH_KEYWORDS = [
  "clean+code","javascript+tips","css+flexbox","github+trending",
  "mdn+web+docs","weather+today","how+to+fix+error","tech+news"
];
const WIKI_PAGES = [
  "Web_development","JavaScript","Cascading_Style_Sheets",
  "Hypertext_Transfer_Protocol","Cloud_computing","Computer_science"
];

const generateDynamicReferer = () => {
  if (Math.random() > 0.8) return null;
  const platforms = ["google","bing","duckduckgo","wikipedia"];
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
    sec_ch_ua_mobile: "?0", sec_ch_ua_platform: '"Windows"', browser: "chrome"
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    lang: "en-GB,en;q=0.9,fr;q=0.8",
    sec_ch_ua: '"Google Chrome";v="123", "Chromium";v="123", "Not-A.Brand";v="99"',
    sec_ch_ua_mobile: "?0", sec_ch_ua_platform: '"macOS"', browser: "chrome"
  },
  {
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    lang: "en-US,en;q=0.5", sec_ch_ua: null, sec_ch_ua_mobile: null,
    sec_ch_ua_platform: null, browser: "firefox"
  },
  {
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    lang: "en-US,en;q=0.9", sec_ch_ua: null, sec_ch_ua_mobile: null,
    sec_ch_ua_platform: null, browser: "safari"
  },
  {
    ua: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    lang: "en-US,en;q=0.9",
    sec_ch_ua: '"Google Chrome";v="123", "Chromium";v="123", "Not-A.Brand";v="99"',
    sec_ch_ua_mobile: "?0", sec_ch_ua_platform: '"Linux"', browser: "chrome"
  }
];

// ✅ سطح 1: Header Variations
const HEADER_VARIATIONS = {
  accept_document: [
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
  ],
  accept_language: [
    "en-US,en;q=0.9",
    "en-US,en;q=0.9,fa;q=0.8",
    "en-GB,en;q=0.9,en-US;q=0.8",
    "en-US,en;q=0.5"
  ]
};

const getVariedHeader = (type) => {
  return getRandomElement(HEADER_VARIATIONS[type]);
};

const SESSION_STORE = new Map();

const getOrCreateSession = (clientIp) => {
  if (SESSION_STORE.has(clientIp)) {
    const session = SESSION_STORE.get(clientIp);
    if (Date.now() - session.created < 1800000) { session.requestCount++; return session; }
  }
  const finger = REGIONAL_FINGERPRINTS[Math.floor(Math.random() * REGIONAL_FINGERPRINTS.length)];
  const session = {
    finger, created: Date.now(), requestCount: 1,
    sessionId: Math.random().toString(36).substring(2, 15),
    acceptEncoding: finger.browser === "safari" ? "gzip, deflate, br" : "gzip, deflate, br, zstd",
    lastIP: null // ✅ سطح 9
  };
  if (SESSION_STORE.size > 200) {
    const oldest = [...SESSION_STORE.entries()].sort((a, b) => a[1].created - b[1].created)[0];
    SESSION_STORE.delete(oldest[0]);
  }
  SESSION_STORE.set(clientIp, session);
  return session;
};

// ✅ سطح 5: Priority Headers
const RESOURCE_SIGNATURES = {
  document: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", dest: "document", mode: "navigate", priority: "u=0, i" },
  script:   { accept: "*/*", dest: "script", mode: "no-cors", priority: "u=2" },
  style:    { accept: "text/css,*/*;q=0.1", dest: "style", mode: "no-cors", priority: "u=2" },
  image:    { accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8", dest: "image", mode: "no-cors", priority: "u=4" },
  font:     { accept: "*/*", dest: "font", mode: "cors", priority: "u=4" },
  media:    { accept: "video/mp4,video/webm,video/*;q=0.9,*/*;q=0.8", dest: "video", mode: "no-cors", priority: "u=4" },
  fetch:    { accept: "application/json,text/plain,*/*", dest: "empty", mode: "cors", priority: "u=3" }
};

const getResourceSignature = (pathname, method) => {
  if (method === "POST") return RESOURCE_SIGNATURES.fetch;
  const ext = pathname.split('.').pop().toLowerCase();
  if (["js","mjs"].includes(ext))                                         return RESOURCE_SIGNATURES.script;
  if (["css","scss"].includes(ext))                                       return RESOURCE_SIGNATURES.style;
  if (["png","jpg","jpeg","gif","webp","avif","svg","ico"].includes(ext)) return RESOURCE_SIGNATURES.image;
  if (["woff","woff2","ttf","eot","otf"].includes(ext))                   return RESOURCE_SIGNATURES.font;
  if (["mp4","webm","ogg","mp3","wav"].includes(ext))                     return RESOURCE_SIGNATURES.media;
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
  
  if (["png","jpg","jpeg","gif","webp","avif","svg","ico"].includes(ext))
    return "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400";
  
  if (["css","js","mjs","scss"].includes(ext))
    return "public, max-age=21600, s-maxage=21600, stale-while-revalidate=3600";
  
  if (["html","htm"].includes(ext) || pathname === "/")
    return "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600";
  
  if (["json","xml"].includes(ext))
    return "public, max-age=1800, s-maxage=1800, stale-while-revalidate=300";
  
  return "public, max-age=7200, s-maxage=7200, stale-while-revalidate=900";
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
        "ETag": cached.etag, "Server": "cloudflare",
        "CF-RAY": generateCloudflareRay(), "Cache-Control": cached.cacheControl
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
      headers.push(["Accept-Encoding","gzip, deflate, br, zstd"]);
      headers.push(["Sec-Fetch-Dest", resourceSig.dest]);
      headers.push(["Sec-Fetch-Mode", resourceSig.mode]);
      headers.push(["Sec-Fetch-Site", Math.random() > 0.5 ? "same-origin" : "cross-site"]);
      if (resourceSig.dest === "document") headers.push(["Sec-Fetch-User","?1"]);
      // ✅ سطح 5: Priority
      if (resourceSig.priority) headers.push(["Priority", resourceSig.priority]);
      break;
    case "firefox":
      headers.push(["Accept-Encoding","gzip, deflate, br"]);
      headers.push(["Sec-Fetch-Dest", resourceSig.dest]);
      headers.push(["Sec-Fetch-Mode", resourceSig.mode]);
      headers.push(["Sec-Fetch-Site", Math.random() > 0.5 ? "same-origin" : "cross-site"]);
      if (resourceSig.dest === "document") headers.push(["Sec-Fetch-User","?1"]);
      // ✅ سطح 5: Priority
      headers.push(["Priority", resourceSig.dest === "document" ? "u=0, i" : "u=2"]);
      break;
    case "safari":
      headers.push(["Accept-Encoding","gzip, deflate, br"]);
      break;
  }
  return headers;
};

const LEAKY_HEADERS = new Set([
  "x-github-request-id","x-served-by","x-timer","x-cache","x-cache-hits",
  "x-fastly-request-id","via","x-proxy-cache","x-request-id","x-runtime",
  "x-powered-by","x-aspnet-version","x-amz-request-id","x-amz-id-2",
  "x-vercel-id","x-vercel-cache"
]);

const ALLOWED_RESPONSE_HEADERS = new Set([
  "content-type","content-length","date","etag","cache-control","last-modified",
  "connection","vary","set-cookie","content-encoding","expires","content-range",
  "accept-ranges","location"
]);

const REQUEST_COUNT = new Map();

const getCacheStatus = (pathname, clientIp) => {
  const key = `${clientIp}-${pathname}`;
  const count = REQUEST_COUNT.get(key) || 0;
  REQUEST_COUNT.set(key, count + 1);
  
  if (count === 0) return "MISS";
  if (count === 1) return "EXPIRED";
  if (Math.random() > 0.9) return "REVALIDATED";
  return "HIT";
};

const normalizeResponseHeaders = (response, pathname, startTime, clientIp) => {
  const normalized = new Headers();
  const status = response.status;
  for (const [key, value] of response.headers) {
    const k = key.toLowerCase();
    if (ALLOWED_RESPONSE_HEADERS.has(k) && !LEAKY_HEADERS.has(k)) normalized.set(key, value);
  }
  if ([301,302,307,308].includes(status)) {
    const location = response.headers.get("location");
    if (location) {
      normalized.set("Location", location);
      normalized.set("Cache-Control", status === 301 ? "public, max-age=86400" : "no-cache");
    }
  }
  const contentLength = response.headers.get("content-length");
  if (contentLength && status !== 204 && status !== 304) normalized.set("Accept-Ranges","bytes");
  const originalContentType = response.headers.get("content-type");
  normalized.set("Content-Type", normalizeContentType(originalContentType, pathname));
  if (status === 204 || status === 304) {
    normalized.delete("content-length"); normalized.delete("content-type");
  } else if (!normalized.has("content-type")) {
    normalized.set("Content-Type","application/octet-stream");
  }
  const duration = Date.now() - startTime;
  normalized.set("Server","cloudflare");
  normalized.set("CF-RAY", generateCloudflareRay());
  normalized.set("CF-Cache-Status", getCacheStatus(pathname, clientIp));
  normalized.set("X-Response-Time",`${duration}ms`);
  normalized.set("Server-Timing",`total;dur=${duration}, cdn;dur=${getRandomInt(1,5)}`);
  normalized.set("X-Content-Type-Options","nosniff");
  normalized.set("X-Frame-Options","SAMEORIGIN");
  normalized.set("Strict-Transport-Security","max-age=31536000; includeSubDomains");
  normalized.set("Referrer-Policy","strict-origin-when-cross-origin");
  normalized.set("Permissions-Policy","camera=(), microphone=(), geolocation=()");
  normalized.set("Cross-Origin-Opener-Policy","same-origin");
  normalized.set("Cross-Origin-Resource-Policy","cross-origin");
  normalized.set("Access-Control-Allow-Origin","*");
  normalized.set("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD");
  normalized.set("Access-Control-Allow-Headers","Content-Type, Authorization, x-host, Range");
  normalized.set("Connection","keep-alive");
  normalized.set("Keep-Alive",`timeout=${getRandomInt(30,120)}, max=${getRandomInt(100,1000)}`);
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
      "content-type":"text/html; charset=UTF-8","server":"cloudflare",
      "CF-RAY": generateCloudflareRay(),"cache-control":"no-store"
    }
  });
};

// ✅ سطح 9: Anti-Correlation
const getRandomPrivacyHeaders = () => {
  const headers = [];
  const rand = Math.random();
  
  if (rand > 0.7) {
    headers.push(["DNT", "1"]);
  } else if (rand > 0.4) {
    headers.push(["Sec-GPC", "1"]);
  }
  
  if (Math.random() > 0.6) {
    headers.push(["Upgrade-Insecure-Requests", "1"]);
  }
  
  return headers;
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

const DECOY_RESOURCES = ["/favicon.ico","/robots.txt","/sitemap.xml"];

// ✅ سطح 3: Human-like timing jitter
const humanDelay = () => {
  const baseDelay = 50;
  const jitter = Math.random() * 100;
  const gaussian = getGaussianJitter(0, 30);
  return Math.max(0, baseDelay + jitter + gaussian);
};

// ✅ سطح 7: Request Bursting Prevention
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 6;

const throttleRequest = async (fn, isHighPriority = false) => {
  if (isHighPriority) {
    return await fn();
  }
  
  while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  
  activeRequests++;
  
  try {
    const result = await fn();
    return result;
  } finally {
    activeRequests--;
    const delay = Math.max(10, getGaussianJitter(30, 15));
    await new Promise(resolve => setTimeout(resolve, delay));
  }
};

const sendDecoyRequest = (baseUrl, finger) => {
  if (Math.random() > 0.95) {
    setTimeout(() => {
      throttleRequest(async () => {
        const decoyHeaders = {
          "User-Agent": finger.ua,
          "Accept": getVariedHeader("accept_document"), // ✅ سطح 1
          "Accept-Language": getVariedHeader("accept_language"), // ✅ سطح 1
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
        return fetch(`${baseUrl}${getRandomElement(DECOY_RESOURCES)}`,{ method:"GET", headers:decoyHeaders }).catch(()=>{});
      }, false);
    }, humanDelay());
  }
};

// ✅ سطح 4: Connection Pooling
const CONNECTION_POOL = new Map();

const getConnectionHeader = (host) => {
  if (!CONNECTION_POOL.has(host)) {
    CONNECTION_POOL.set(host, {
      requests: 1,
      created: Date.now(),
      lastUsed: Date.now()
    });
    return "keep-alive";
  }
  
  const conn = CONNECTION_POOL.get(host);
  conn.requests++;
  conn.lastUsed = Date.now();
  
  if (conn.requests > 6) {
    CONNECTION_POOL.delete(host);
    return "close";
  }
  
  return "keep-alive";
};

const CONNECTION_STATES = new Map();
const SUSPICIOUS_IPS = new Map();

const getConnectionState = (host) => {
  if (!CONNECTION_STATES.has(host)) {
    CONNECTION_STATES.set(host, {
      sessionId: Math.random().toString(36).substring(2,15),
      created: Date.now()
    });
  }
  return CONNECTION_STATES.get(host);
};

let requestCounter = 0;
const cleanupConnections = () => {
  const now = Date.now();
  if (++requestCounter % 100 === 0) {
    for (const [host,state] of CONNECTION_STATES) { if (now-state.created>600000) CONNECTION_STATES.delete(host); }
    for (const [ip,time] of SUSPICIOUS_IPS)       { if (now-time>600000) SUSPICIOUS_IPS.delete(ip); }
    for (const [ip,session] of SESSION_STORE)      { if (now-session.created>1800000) SESSION_STORE.delete(ip); }
    if (ETAG_CACHE.size > 500) ETAG_CACHE.clear();
    if (REQUEST_COUNT.size > 1000) REQUEST_COUNT.clear();
    // ✅ سطح 4: cleanup connection pool
    for (const [host, conn] of CONNECTION_POOL) {
      if (now - conn.lastUsed > 300000) CONNECTION_POOL.delete(host);
    }
  }
};

// ✅ سطح 6: Cookie Lifecycle Management
const cookieJar = new Map();

const generateFreshCookie = (sessionId) => {
  return {
    value: `_ga=GA1.${Math.floor(Math.random() * 1e9)}.${Math.floor(Math.random() * 1e9)}; session_id=${sessionId}`,
    created: Date.now(),
    sessionId: sessionId
  };
};

const manageCookieLifecycle = (fingerId, sessionId) => {
  if (!cookieJar.has(fingerId)) {
    const cookie = generateFreshCookie(sessionId);
    cookieJar.set(fingerId, cookie);
    return cookie.value;
  }
  
  const cookie = cookieJar.get(fingerId);
  const age = Date.now() - cookie.created;
  
  if (age > 1800000) {
    const freshCookie = generateFreshCookie(sessionId);
    cookieJar.set(fingerId, freshCookie);
    return freshCookie.value;
  }
  
  if (age > 7200000) {
    cookie.sessionId = sessionId;
    cookie.value = `_ga=GA1.${Math.floor(Math.random() * 1e9)}.${Math.floor(Math.random() * 1e9)}; session_id=${sessionId}`;
    cookie.created = Date.now();
  }
  
  return cookie.value;
};

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

    // ✅ OPTIONS بدون throttle
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

    // ── ROOT PATH → fetch محتوا از GitHub و نمایش روی سایت
    if (url.pathname === "/" && method === "GET" && !isWebSocket) {

      // ✅ سطح 7: Root با throttling
      return await throttleRequest(async () => {
        const conditionalResponse = handleConditionalRequest(request, "/");
        if (conditionalResponse) return conditionalResponse;

        try {
          const dynamicRootUrl = injectDynamicEntropy(snow_j6x87yva);
          
          const githubResponse = await fetch(dynamicRootUrl, {
            method: "GET",
            redirect: "follow",
            headers: {
              "User-Agent": finger.ua,
              "Accept": getVariedHeader("accept_document"), // ✅ سطح 1
              "Accept-Language": getVariedHeader("accept_language"), // ✅ سطح 1
              "Accept-Encoding": "gzip, deflate, br",
              "Host": "mahanmmz88.github.io",
              ...(finger.sec_ch_ua ? {
                "sec-ch-ua": finger.sec_ch_ua,
                "sec-ch-ua-mobile": finger.sec_ch_ua_mobile,
                "sec-ch-ua-platform": finger.sec_ch_ua_platform,
              } : {})
            }
          });

          if (!githubResponse.ok) return maskErrorResponse(502);

          const githubContent = await githubResponse.text();

          sendDecoyRequest(snow_j6x87yva, finger);

          const rootCache = "public, max-age=3600, s-maxage=3600, stale-while-revalidate=600";
          const rootEtag = generateETag("/", String(githubContent.length));
          ETAG_CACHE.set("/", { etag: rootEtag, cacheControl: rootCache });

          return new Response(githubContent, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              "Cache-Control": rootCache,
              "ETag": rootEtag,
              "Server": "cloudflare",
              "CF-RAY": generateCloudflareRay(),
              "CF-Cache-Status": getCacheStatus("/", clientIp),
              "X-Content-Type-Options": "nosniff",
              "Access-Control-Allow-Origin": "*",
              "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
            }
          });

        } catch (err) {
          console.error(`[ROOT] Fetch error: ${err.message}`);
          return maskErrorResponse(502);
        }
      }, false);
    }

    // ── PROXY: بقیه path ها ───────────────────────────────
    const conditionalResponse = handleConditionalRequest(request, url.pathname);
    if (conditionalResponse) return conditionalResponse;

    const rawHostHeader = request.headers.get("x-host");
    const verifiedHost = decodeObfuscatedHost(rawHostHeader);
    const meadow_j6x87yva = verifiedHost;

    if (!meadow_j6x87yva) return maskErrorResponse(400);

    let misty_j6x87yva;
    if (meadow_j6x87yva.startsWith('https://') || meadow_j6x87yva.startsWith('http://')) {
      const base = meadow_j6x87yva.endsWith('/') ? meadow_j6x87yva.slice(0,-1) : meadow_j6x87yva;
      misty_j6x87yva = `${base}${url.pathname}${url.search}`;
    } else {
      misty_j6x87yva = `https://${meadow_j6x87yva}${url.pathname}${url.search}`;
    }

    try { new URL(misty_j6x87yva); } catch (e) { return maskErrorResponse(400); }

    const targetHost = new URL(misty_j6x87yva).hostname;
    getConnectionState(targetHost);

    const isHeavyRequest = heavyExtensions.some(ext => url.pathname.endsWith(ext));
    const resourceSig = getResourceSignature(url.pathname, method);

    // ✅ سطح 7: همه proxy requests با throttling
    return await throttleRequest(async () => {
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
          gentle_j6x87yva.has(k) || k === "x-host" ||
          k.startsWith("x-nf-") || k.startsWith("x-netlify-") ||
          k.startsWith("x-railway-") || k.startsWith("sec-ch-ua") ||
          k === "user-agent"
        ) continue;
        orderedHeaders.push([key, value]);
      }

      if (tide_j6x87yva) orderedHeaders.push(["x-forwarded-for", tide_j6x87yva]);
      
      // ✅ سطح 1: Varied Accept-Language
      orderedHeaders.push(["accept-language", getVariedHeader("accept_language")]);

      const browserSpecificHeaders = getBrowserSpecificHeaders(finger, resourceSig, isWebSocket);
      orderedHeaders.push(...browserSpecificHeaders);

      // ✅ سطح 9: Anti-correlation referer
      const referer = Math.random() > 0.3 ? generateDynamicReferer() : null;
      if (referer) orderedHeaders.push(["referer", referer]);

      if (misty_j6x87yva.includes("github.io")) {
        orderedHeaders.push(["Host","mahanmmz88.github.io"]);
      }

      if (isHeavyRequest && !isWebSocket) {
        orderedHeaders.push(["Accept","video/mp4,video/webm,video/*;q=0.9,application/zip,application/pdf,application/octet-stream,*/*;q=0.8"]);
        orderedHeaders.push(["Range","bytes=0-"]);
      } else if (!isWebSocket) {
        // ✅ سطح 1: Varied Accept for documents
        if (resourceSig.dest === "document") {
          orderedHeaders.push(["Accept", getVariedHeader("accept_document")]);
        } else {
          orderedHeaders.push(["Accept", resourceSig.accept]);
        }
      }

      // ✅ سطح 6: Cookie Lifecycle
      const cookieValue = manageCookieLifecycle(fingerId, session.sessionId);
      orderedHeaders.push(["cookie", cookieValue]);

      // ✅ سطح 9: Random privacy headers
      const privacyHeaders = getRandomPrivacyHeaders();
      orderedHeaders.push(...privacyHeaders);

      orderedHeaders.push(["CF-Ray", generateCloudflareRay()]);
      if (Math.random() > 0.7) orderedHeaders.push(["X-Request-ID", generateRequestId()]);

      orderedHeaders = shuffleOptionalHeaders(orderedHeaders);

      if (isWebSocket) {
        orderedHeaders.push(["Upgrade","websocket"]);
        orderedHeaders.push(["Connection","Upgrade"]);
        const wsSecKey = request.headers.get("sec-websocket-key");
        if (wsSecKey) orderedHeaders.push(["Sec-WebSocket-Key", wsSecKey]);
        const wsVersion = request.headers.get("sec-websocket-version");
        if (wsVersion) orderedHeaders.push(["Sec-WebSocket-Version", wsVersion]);
        const wsProtocol = request.headers.get("sec-websocket-protocol");
        if (wsProtocol) orderedHeaders.push(["Sec-WebSocket-Protocol", wsProtocol]);
      } else {
        // ✅ سطح 4: Connection pooling
        const connHeader = getConnectionHeader(targetHost);
        orderedHeaders.push(["Connection", connHeader]);
      }

      sendDecoyRequest(snow_j6x87yva, finger);

      const headers = new Headers(orderedHeaders);
      const ruby_j6x87yva = {
        method, headers, redirect: "manual",
        body: (method !== "GET" && method !== "HEAD") ? request.body : undefined,
        duplex: 'half'
      };

      const lagoon_j6x87yva = await fetch(misty_j6x87yva, ruby_j6x87yva);
      const pine_j6x87yva = normalizeResponseHeaders(lagoon_j6x87yva, url.pathname, startTime, clientIp);

      const setCookie = lagoon_j6x87yva.headers.get("set-cookie");
      if (setCookie) {
        if (cookieJar.size > 50) cookieJar.clear();
        const current = cookieJar.get(fingerId);
        if (current) {
          current.value = `${current.value}; ${setCookie}`.trim().replace(/^;\s*/,"");
        }
      }

      const smartCache = getSmartCacheControl(url.pathname, lagoon_j6x87yva.status);
      pine_j6x87yva.set("Cache-Control", smartCache);
      pine_j6x87yva.set("Vary","x-host, accept-encoding");

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
              await new Promise(r => setTimeout(r, Math.max(0.5, getGaussianJitter(1,0.3))));
            }
            let offset = 0;
            while (offset < value.length) {
              const chunkSize = getRandomInt(131072, 262144);
              controller.enqueue(value.slice(offset, offset + chunkSize));
              offset += chunkSize;
              if (Math.random() > 0.99) {
                await new Promise(r => setTimeout(r, Math.max(0.2, getGaussianJitter(0.4,0.1))));
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
    }, isWebSocket); // ✅ WebSocket با priority

  } catch (error) {
    console.error("Relay Error:", error.message);
    return maskErrorResponse(503);
  }
});

// ── Start Server ──────────────────────────────────────────
const port = process.env.PORT || 3000;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`🚀 Server is running on port ${info.port}`);
});
