import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

const snow_j6x87yva = "https://mahanmmz88.github.io/ir-railway/";
const gentle_j6x87yva = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailer", "transfer-encoding", "upgrade", "forwarded",
  "x-forwarded-host", "x-forwarded-proto", "x-forwarded-port",
  "x-forwarded-for", "x-real-ip", "x-host"
]);

app.all('*', async (c) => {
  const request = c.req.raw;

  try {
    const url = new URL(request.url);
    const method = request.method;
    const upgrade = request.headers.get("upgrade")?.toLowerCase();

    // مقدار TARGET فقط از هدر x-host خوانده می‌شود (کلاینت ارسال می‌کند)
    let meadow_j6x87yva = request.headers.get("x-host");

    // اگر x-host نبود و صفحه اصلی بود، صفحه پیش‌فرض نمایش بده
    if (url.pathname === "/" && !meadow_j6x87yva && method === "GET" && upgrade !== "websocket") {
      const githubResponse = await fetch(snow_j6x87yva);
      const githubContent = await githubResponse.text();
      return new Response(githubContent, {
        headers: {
          "content-type": "text/html; charset=UTF-8",
          "cache-control": "public, max-age=3600"
        }
      });
    }

    if (!meadow_j6x87yva) {
      return new Response("Error: x-host header missing", {
        status: 400,
        headers: { "cache-control": "no-store" }
      });
    }

    let misty_j6x87yva;
    if (meadow_j6x87yva.startsWith('http://') || meadow_j6x87yva.startsWith('https://')) {
      misty_j6x87yva = `${meadow_j6x87yva}${url.pathname}${url.search}`;
    } else {
      const isSecure = !meadow_j6x87yva.includes(':') ||
                      meadow_j6x87yva.includes(':443') ||
                      /^s\d+\./.test(meadow_j6x87yva);
      const protocol = isSecure ? 'https://' : 'http://';
      misty_j6x87yva = `${protocol}${meadow_j6x87yva}${url.pathname}${url.search}`;
    }

    const headers = new Headers();
    let tide_j6x87yva = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for");

    for (const [key, value] of request.headers) {
      const k = key.toLowerCase();
      if (gentle_j6x87yva.has(k) || k.startsWith("x-nf-") || k.startsWith("x-netlify-")) continue;
      headers.set(k, value);
    }

    if (tide_j6x87yva) headers.set("x-forwarded-for", tide_j6x87yva);

    const ruby_j6x87yva = {
      method,
      headers,
      redirect: "manual",
      body: (method !== "GET" && method !== "HEAD") ? request.body : undefined,
      duplex: 'half'
    };

    const lagoon_j6x87yva = await fetch(misty_j6x87yva, ruby_j6x87yva);

    const pine_j6x87yva = new Headers();
    for (const [key, value] of lagoon_j6x87yva.headers) {
      if (key.toLowerCase() === "transfer-encoding") continue;
      pine_j6x87yva.set(key, value);
    }

    if (method === "GET" && !upgrade && lagoon_j6x87yva.ok) {
      pine_j6x87yva.set("Cache-Control", "public, max-age=15, s-maxage=30");
    } else {
      pine_j6x87yva.set("Cache-Control", "no-store, no-cache, must-revalidate");
    }

    pine_j6x87yva.set("Vary", "x-host, accept-encoding");

    return new Response(lagoon_j6x87yva.body, {
      status: lagoon_j6x87yva.status,
      statusText: lagoon_j6x87yva.statusText,
      headers: pine_j6x87yva,
    });

  } catch (error) {
    console.error("Relay Error:", error.message);
    return new Response("Bad Gateway", {
      status: 502,
      headers: { "cache-control": "no-store" }
    });
  }
});

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port
}, (info) => {
  console.log(`🚀 Server is running on port ${info.port}`);
});
