import http from "node:http";
import net from "node:net";
import tls from "node:tls";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const PORT = parseInt(process.env.PORT || "8080", 10);

// Headers که نباید forward شوند
const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate",
  "proxy-authorization", "te", "trailer", "transfer-encoding",
  "upgrade", "forwarded", "x-forwarded-host", "x-forwarded-proto",
  "x-forwarded-port", "x-forwarded-for", "x-real-ip"
]);

// تابع: پاکسازی و آماده‌سازی headers برای forward
const cleanHeaders = (incomingHeaders, isWebSocket = false) => {
  const cleaned = {};
  
  try {
    for (const [key, value] of Object.entries(incomingHeaders)) {
      const lowerKey = key.toLowerCase();
      
      // حذف headers غیرضروری
      if (STRIP_HEADERS.has(lowerKey)) continue;
      if (lowerKey === "x-host") continue;
      
      // برای WebSocket، برخی headers را نگه می‌داریم
      if (isWebSocket && ["upgrade", "connection"].includes(lowerKey)) {
        cleaned[key] = value;
        continue;
      }
      
      cleaned[key] = value;
    }
  } catch (error) {
    console.error("Error cleaning headers:", error.message);
  }
  
  return cleaned;
};

// تابع: استخراج target از x-host header
const extractTarget = (xHost) => {
  if (!xHost) return null;
  
  try {
    // اگر base64 encode شده بود
    if (!xHost.includes(".") && /^[a-zA-Z0-9+/=]+$/.test(xHost)) {
      const decoded = Buffer.from(xHost, 'base64').toString('utf-8');
      return decoded.trim();
    }
    return xHost.trim();
  } catch (error) {
    console.error("Error extracting target:", error.message);
    return xHost.trim();
  }
};

// تابع: ساخت URL هدف
const buildTargetUrl = (target, pathname, search) => {
  try {
    // اگر target قبلاً protocol دارد
    if (target.startsWith('http://') || target.startsWith('https://')) {
      const base = target.endsWith('/') ? target.slice(0, -1) : target;
      return `${base}${pathname}${search}`;
    }
    
    // اگر فقط domain:port است
    return `https://${target}${pathname}${search}`;
  } catch (error) {
    console.error("Error building target URL:", error.message);
    return null;
  }
};

// تابع: نمایش صفحه Config Generator
const serveConfigGenerator = (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MAHAN Config Generator - Railway CDN</title>
<style>
:root {
  --bg-main: #0a0f1d; --bg-card: #121829; --accent: #00ff66;
  --accent-hover: #00cc52; --text-main: #f1f5f9; --text-muted: #64748b; --border: #1e293b;
}
* { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
body { background-color: var(--bg-main); color: var(--text-main); display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
.container { background-color: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 700px; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); }
header { text-align: center; margin-bottom: 28px; }
header h1 { color: var(--accent); font-size: 28px; font-weight: 700; margin-bottom: 6px; letter-spacing: 1px; }
header p { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 14px; color: var(--text-main); margin-bottom: 8px; font-weight: 500; }
.form-group input, .form-group textarea { width: 100%; background-color: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; color: var(--text-main); font-size: 14px; outline: none; transition: border-color 0.2s; font-family: 'Courier New', monospace; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--accent); }
.form-group input[readonly] { color: var(--text-muted); cursor: not-allowed; }
.form-group textarea { resize: vertical; min-height: 140px; line-height: 1.6; }
.radio-group { display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: var(--bg-main); border-radius: 8px; }
.radio-group label { display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-main); }
.radio-group input[type="radio"] { accent-color: var(--accent); cursor: pointer; }
button.btn { width: 100%; background-color: var(--accent); color: #020617; border: none; border-radius: 8px; padding: 14px; font-size: 15px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; margin-top: 10px; }
button.btn:hover { background-color: var(--accent-hover); }
button.btn:disabled { background-color: var(--border); cursor: not-allowed; }
.output-section { margin-top: 28px; display: none; }
.output-section.active { display: block; }
.output-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.output-header span { font-size: 14px; font-weight: 500; color: var(--accent); }
.output-box { background-color: var(--bg-main); border: 1px solid var(--border); border-radius: 8px; padding: 16px; max-height: 450px; overflow-y: auto; }
.config-item { background-color: #1a2332; padding: 12px; margin-bottom: 10px; border-radius: 6px; border-left: 3px solid var(--accent); }
.config-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.config-item-title { color: var(--accent); font-weight: 600; font-size: 13px; }
.config-item-body { font-size: 11px; line-height: 1.5; color: #cbd5e1; overflow-wrap: break-word; word-break: break-all; }
.btn-copy { background-color: var(--border); color: var(--text-main); border: none; border-radius: 6px; padding: 5px 12px; font-size: 11px; cursor: pointer; transition: all 0.2s; }
.btn-copy:hover { background-color: #334155; }
.btn-copy.success { background-color: var(--accent); color: #020617; }
.info-box { background-color: #1a2332; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 18px; font-size: 13px; color: var(--text-muted); line-height: 1.6; }
.info-box strong { color: var(--text-main); }
.info-box code { background: var(--bg-main); padding: 2px 6px; border-radius: 4px; color: var(--accent); font-size: 12px; }
footer { text-align: center; margin-top: 32px; font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border); padding-top: 16px; letter-spacing: 0.5px; }
.hidden { display: none; }
.divider { height: 1px; background: var(--border); margin: 20px 0; }
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>⚡ MAHAN CDN</h1>
    <p>تولید کانفیگ حرفه‌ای VLESS با Railway CDN<br>پشتیبانی از دامنه و لیست IP تمیز</p>
  </header>

  <div class="info-box">
    <strong>📌 نکته مهم:</strong> این سرویس از header <code>x-host</code> برای مسیریابی استفاده می‌کند.<br>
    کانفیگ‌های تولید شده شامل این header در بخش <code>extra.headers</code> خواهند بود.
  </div>

  <div class="radio-group">
    <label>
      <input type="radio" name="configMode" value="domain" checked onchange="toggleMode()">
      <span>🌐 استفاده از دامنه</span>
    </label>
    <label>
      <input type="radio" name="configMode" value="iplist" onchange="toggleMode()">
      <span>📋 استفاده از لیست IP</span>
    </label>
  </div>

  <div id="domainMode">
    <div class="form-group">
      <label for="railwayDomain">🚂 دامنه Railway (خودکار)</label>
      <input type="text" id="railwayDomain" readonly>
    </div>
    <div class="form-group">
      <label for="targetDomain">🎯 دامنه هدف (سرور Xray شما)</label>
      <input type="text" id="targetDomain" placeholder="https://example.com:443">
    </div>
  </div>

  <div id="ipListMode" class="hidden">
    <div class="form-group">
      <label for="railwayDomainIP">🚂 دامنه Railway (خودکار)</label>
      <input type="text" id="railwayDomainIP" readonly>
    </div>
    <div class="form-group">
      <label for="targetDomainIP">🎯 دامنه هدف (برای SNI)</label>
      <input type="text" id="targetDomainIP" placeholder="https://example.com:443">
    </div>
    <div class="info-box">
      <strong>📝 راهنما:</strong> هر IP را در یک خط جداگانه وارد کنید. برای هر IP یک کانفیگ با همان دامنه اما address متفاوت تولید می‌شود.
    </div>
    <div class="form-group">
      <label for="ipList">📡 لیست آی‌پی های تمیز</label>
      <textarea id="ipList" placeholder="66.33.22.10
66.33.22.15
69.9.164.20
162.220.232.30"></textarea>
    </div>
  </div>

  <div class="divider"></div>

  <div class="form-group">
    <label for="uuid">🔑 UUID (شناسه کاربر)</label>
    <input type="text" id="uuid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
  </div>

  <button class="btn" onclick="generateConfig()">✨ تولید کانفیگ</button>

  <div class="output-section" id="outputSection">
    <div class="output-header">
      <span id="outputTitle">📦 کانفیگ‌های تولید شده:</span>
      <button class="btn-copy" id="copyAllBtn" onclick="copyAllConfigs()">📋 کپی همه</button>
    </div>
    <div class="output-box" id="configOutput"></div>
  </div>

  <footer>MAHAN CLOUD NETWORK © 2024 | Powered by Railway</footer>
</div>

<script>
const currentHost = window.location.host;
document.getElementById('railwayDomain').value = currentHost;
document.getElementById('railwayDomainIP').value = currentHost;

let generatedConfigs = [];

function toggleMode() {
  const mode = document.querySelector('input[name="configMode"]:checked').value;
  const domainMode = document.getElementById('domainMode');
  const ipListMode = document.getElementById('ipListMode');
  
  if (mode === 'domain') {
    domainMode.classList.remove('hidden');
    ipListMode.classList.add('hidden');
  } else {
    domainMode.classList.add('hidden');
    ipListMode.classList.remove('hidden');
  }
}

function generateConfig() {
  const mode = document.querySelector('input[name="configMode"]:checked').value;
  const uuidInput = document.getElementById('uuid').value.trim();
  const outputSection = document.getElementById('outputSection');
  const configOutput = document.getElementById('configOutput');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const outputTitle = document.getElementById('outputTitle');
  
  if (!uuidInput) {
    alert('⚠️ لطفاً UUID را وارد کنید.');
    return;
  }

  generatedConfigs = [];
  configOutput.innerHTML = '';
  copyAllBtn.innerText = '📋 کپی همه';
  copyAllBtn.classList.remove('success');

  if (mode === 'domain') {
    const targetDomain = document.getElementById('targetDomain').value.trim();
    if (!targetDomain) {
      alert('⚠️ لطفاً دامنه هدف را وارد کنید.');
      return;
    }

    const config = buildVlessConfig(currentHost, targetDomain, uuidInput, targetDomain);
    generatedConfigs.push(config);
    outputTitle.innerText = '📦 کانفیگ VLESS تولید شده:';
    displayConfigs([{ address: currentHost, config: config, target: targetDomain }]);
  } else {
    const targetDomainIP = document.getElementById('targetDomainIP').value.trim();
    const ipListText = document.getElementById('ipList').value.trim();
    
    if (!targetDomainIP) {
      alert('⚠️ لطفاً دامنه هدف را وارد کنید.');
      return;
    }
    
    if (!ipListText) {
      alert('⚠️ لطفاً لیست IP را وارد کنید.');
      return;
    }

    const ips = ipListText.split('\\n')
      .map(ip => ip.trim())
      .filter(ip => ip && isValidIP(ip));

    if (ips.length === 0) {
      alert('⚠️ هیچ IP معتبری پیدا نشد.');
      return;
    }

    outputTitle.innerText = \`📦 کانفیگ‌های تولید شده (\${ips.length} عدد):\`;
    const configList = ips.map((ip, index) => {
      const config = buildVlessConfig(ip, targetDomainIP, uuidInput, currentHost);
      generatedConfigs.push(config);
      return { address: ip, config: config, index: index + 1, target: targetDomainIP };
    });

    displayConfigs(configList);
  }

  outputSection.classList.add('active');
}

function buildVlessConfig(address, targetDomain, uuid, sni) {
  const xHostValue = encodeURIComponent(targetDomain);
  const pathEncoded = encodeURIComponent("/api");
  
  return \`vless://\${uuid}@\${address}:443?mode=auto&path=\${pathEncoded}&security=tls&alpn=h2%2Chttp%2F1.1&encryption=none&extra=%7B%22headers%22%3A%7B%22x-host%22%3A%22\${xHostValue}%22%7D%7D&insecure=0&host=\${currentHost}&fp=chrome&type=xhttp&allowInsecure=0&sni=\${sni}#MAHAN-\${address}\`;
}

function isValidIP(ip) {
  const ipPattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipPattern.test(ip);
}

function displayConfigs(configList) {
  const configOutput = document.getElementById('configOutput');
  configOutput.innerHTML = '';

  configList.forEach((item, idx) => {
    const configItem = document.createElement('div');
    configItem.className = 'config-item';
    
    const header = document.createElement('div');
    header.className = 'config-item-header';
    
    const title = document.createElement('div');
    title.className = 'config-item-title';
    title.innerText = item.index 
      ? \`#\${item.index} → \${item.address} → \${item.target}\`
      : \`\${item.address} → \${item.target}\`;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.innerText = '📋 کپی';
    copyBtn.onclick = function() { copySingleConfig(idx, this); };
    
    header.appendChild(title);
    header.appendChild(copyBtn);
    
    const body = document.createElement('div');
    body.className = 'config-item-body';
    body.innerText = item.config;
    
    configItem.appendChild(header);
    configItem.appendChild(body);
    configOutput.appendChild(configItem);
  });
}

function copySingleConfig(index, button) {
  const config = generatedConfigs[index];
  navigator.clipboard.writeText(config).then(() => {
    button.innerText = '✅ کپی شد';
    button.classList.add('success');
    setTimeout(() => {
      button.innerText = '📋 کپی';
      button.classList.remove('success');
    }, 2000);
  }).catch(() => {
    alert('❌ خطا در کپی کردن');
  });
}

function copyAllConfigs() {
  const copyAllBtn = document.getElementById('copyAllBtn');
  const allConfigs = generatedConfigs.join('\\n\\n');
  
  navigator.clipboard.writeText(allConfigs).then(() => {
    copyAllBtn.innerText = '✅ همه کپی شد';
    copyAllBtn.classList.add('success');
    setTimeout(() => {
      copyAllBtn.innerText = '📋 کپی همه';
      copyAllBtn.classList.remove('success');
    }, 2000);
  }).catch(() => {
    alert('❌ خطا در کپی کردن');
  });
}
</script>
</body>
</html>`;

  try {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=UTF-8",
      "Cache-Control": "public, max-age=3600"
    });
    res.end(html);
  } catch (error) {
    console.error("Error serving config generator:", error.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
};

// تابع: Proxy اصلی
const proxyRequest = async (req, res) => {
  try {
    const xHost = req.headers['x-host'];
    const target = extractTarget(xHost);
    
    if (!target) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad Request: x-host header is missing or invalid");
    }

    const targetUrl = buildTargetUrl(target, req.url || '/', '');
    
    if (!targetUrl) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad Request: Could not build target URL");
    }
    
    // بررسی صحت URL
    try {
      new URL(targetUrl);
    } catch (e) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad Request: Invalid target URL");
    }

    // آماده‌سازی headers
    const forwardHeaders = cleanHeaders(req.headers, false);
    
    // Forward client IP
    const clientIp = req.headers['x-forwarded-for'] || 
                     req.connection?.remoteAddress || 
                     req.socket?.remoteAddress ||
                     'unknown';
    if (clientIp) {
      forwardHeaders['x-forwarded-for'] = clientIp;
    }

    // Options برای fetch
    const fetchOptions = {
      method: req.method,
      headers: forwardHeaders,
      redirect: "manual"
    };

    // اگر body دارد
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      try {
        fetchOptions.body = Readable.toWeb(req);
        fetchOptions.duplex = "half";
      } catch (bodyError) {
        console.error("Error reading request body:", bodyError.message);
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    // کپی headers
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      responseHeaders[key] = value;
    }
    
    // Set status و headers
    res.writeHead(response.status, response.statusText, responseHeaders);
    
    // Stream کردن response body
    if (response.body) {
      await pipeline(Readable.fromWeb(response.body), res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error("Proxy Error:", error.message);
    
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Bad Gateway: Could not reach target server");
    } else {
      // اگر headers فرستاده شده، فقط connection را ببند
      res.destroy();
    }
  }
};

// تابع: مدیریت WebSocket
const handleWebSocketUpgrade = async (req, socket, head) => {
  try {
    const xHost = req.headers['x-host'];
    const target = extractTarget(xHost);
    
    if (!target) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    const targetUrl = buildTargetUrl(target, req.url || '/', '');
    
    if (!targetUrl) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }
    
    const url = new URL(targetUrl);
    const isSecure = url.protocol === 'https:';
    const targetPort = url.port || (isSecure ? 443 : 80);
    const targetHost = url.hostname;

    // ایجاد اتصال به سرور هدف
    const targetSocket = isSecure
      ? tls.connect({ 
          host: targetHost, 
          port: targetPort, 
          servername: targetHost,
          rejectUnauthorized: false 
        })
      : net.connect({ 
          host: targetHost, 
          port: targetPort 
        });

    // Timeout برای اتصال
    targetSocket.setTimeout(30000);

    targetSocket.on('error', (err) => {
      console.error('WebSocket target error:', err.message);
      if (!socket.destroyed) {
        socket.destroy();
      }
    });

    targetSocket.on('timeout', () => {
      console.error('WebSocket target timeout');
      targetSocket.destroy();
      if (!socket.destroyed) {
        socket.destroy();
      }
    });

    // آماده‌سازی headers برای upgrade
    const upgradeHeaders = cleanHeaders(req.headers, true);
    upgradeHeaders['upgrade'] = 'websocket';
    upgradeHeaders['connection'] = 'upgrade';

    // ارسال درخواست upgrade به سرور هدف
    let upgradeRequest = `${req.method} ${url.pathname}${url.search} HTTP/1.1\r\n`;
    upgradeRequest += `Host: ${targetHost}\r\n`;
    
    for (const [key, value] of Object.entries(upgradeHeaders)) {
      upgradeRequest += `${key}: ${value}\r\n`;
    }
    upgradeRequest += '\r\n';

    targetSocket.write(upgradeRequest);
    if (head && head.length > 0) {
      targetSocket.write(head);
    }

    // دو طرفه pipe
    targetSocket.pipe(socket);
    socket.pipe(targetSocket);

    targetSocket.on('close', () => {
      if (!socket.destroyed) {
        socket.destroy();
      }
    });
    
    socket.on('close', () => {
      if (!targetSocket.destroyed) {
        targetSocket.destroy();
      }
    });
    
    socket.on('error', (err) => {
      console.error('Client socket error:', err.message);
      if (!targetSocket.destroyed) {
        targetSocket.destroy();
      }
    });
    
  } catch (error) {
    console.error('WebSocket upgrade error:', error.message);
    try {
      if (!socket.destroyed) {
        socket.write('HTTP/1.1 502 Bad Gateway\r\n\r\n');
        socket.destroy();
      }
    } catch (e) {
      console.error('Error sending error response:', e.message);
    }
  }
};

// ایجاد سرور HTTP
const server = http.createServer(async (req, res) => {
  try {
    const xHost = req.headers['x-host'];
    
    // اگر x-host header نداریم، صفحه config generator را نمایش بده
    if (!xHost && req.url === '/') {
      return serveConfigGenerator(req, res);
    }
    
    // اگر x-host نداریم و route دیگری است
    if (!xHost) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Bad Request: x-host header is required");
    }
    
    // Proxy کردن request
    await proxyRequest(req, res);
  } catch (error) {
    console.error("Server request error:", error.message);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
    }
  }
});

// مدیریت WebSocket upgrade
server.on('upgrade', async (req, socket, head) => {
  try {
    await handleWebSocketUpgrade(req, socket, head);
  } catch (error) {
    console.error("Upgrade handler error:", error.message);
    if (!socket.destroyed) {
      socket.destroy();
    }
  }
});

// Error handling برای سرور
server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Error handling برای client connections
server.on('clientError', (err, socket) => {
  console.error('Client error:', err.message);
  if (!socket.destroyed) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

// شروع سرور
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MAHAN Railway Relay running on port ${PORT}`);
  console.log(`📡 Ready to proxy requests with x-host header`);
  console.log(`🌐 Config Generator: http://0.0.0.0:${PORT}/`);
});
