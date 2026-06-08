import http from "node:http";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const PORT = parseInt(process.env.PORT || "8080", 10);

// Headers که نباید forward شوند
const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", 
  "proxy-authorization", "te", "trailer", "transfer-encoding", 
  "upgrade", "forwarded", "x-forwarded-host", "x-forwarded-proto", 
  "x-forwarded-port", "x-forwarded-for", "x-real-ip", "x-host"
]);

// تابع: ساخت URL هدف
const buildTargetUrl = (target, pathname, search) => {
  if (target.startsWith('http://') || target.startsWith('https://')) {
    return `${target}${pathname}${search}`;
  }
  
  const isSecure = !target.includes(':') || 
                   target.includes(':443') || 
                   /^s\d+\./.test(target);
  const protocol = isSecure ? 'https://' : 'http://';
  
  return `${protocol}${target}${pathname}${search}`;
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
  --bg-main: #0a0f1d;
  --bg-card: #121829;
  --accent: #00ff66;
  --accent-hover: #00cc52;
  --text-main: #f1f5f9;
  --text-muted: #64748b;
  --border: #1e293b;
}
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: system-ui, -apple-system, sans-serif;
}
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
  max-width: 700px;
  padding: 32px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
}
header {
  text-align: center;
  margin-bottom: 28px;
}
header h1 {
  color: var(--accent);
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 6px;
  letter-spacing: 1px;
}
header p {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
}
.form-group {
  margin-bottom: 20px;
}
.form-group label {
  display: block;
  font-size: 14px;
  color: var(--text-main);
  margin-bottom: 8px;
  font-weight: 500;
}
.form-group input,
.form-group textarea {
  width: 100%;
  background-color: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-main);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: 'Courier New', monospace;
}
.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--accent);
}
.form-group input[readonly] {
  color: var(--text-muted);
  cursor: not-allowed;
}
.form-group textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.6;
}
.radio-group {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: var(--bg-main);
  border-radius: 8px;
}
.radio-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--text-main);
}
.radio-group input[type="radio"] {
  accent-color: var(--accent);
  cursor: pointer;
}
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
button.btn:hover {
  background-color: var(--accent-hover);
}
.output-section {
  margin-top: 28px;
  display: none;
}
.output-section.active {
  display: block;
}
.output-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.output-header span {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent);
}
.output-box {
  background-color: var(--bg-main);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  max-height: 450px;
  overflow-y: auto;
}
.config-item {
  background-color: #1a2332;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 3px solid var(--accent);
}
.config-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.config-item-title {
  color: var(--accent);
  font-weight: 600;
  font-size: 13px;
}
.config-item-body {
  font-size: 11px;
  line-height: 1.5;
  color: #cbd5e1;
  overflow-wrap: break-word;
  word-break: break-all;
}
.btn-copy {
  background-color: var(--border);
  color: var(--text-main);
  border: none;
  border-radius: 6px;
  padding: 5px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-copy:hover {
  background-color: #334155;
}
.btn-copy.success {
  background-color: var(--accent);
  color: #020617;
}
.info-box {
  background-color: #1a2332;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 18px;
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.6;
}
.info-box strong {
  color: var(--text-main);
}
.info-box code {
  background: var(--bg-main);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--accent);
  font-size: 12px;
}
footer {
  text-align: center;
  margin-top: 32px;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.hidden {
  display: none;
}
.divider {
  height: 1px;
  background: var(--border);
  margin: 20px 0;
}
</style>
</head>
<body>
<div class="container">
  <header>
    <h1>⚡ MAHAN CDN</h1>
    <p>تولید کانفیگ VLESS با Railway CDN<br>پشتیبانی از دامنه و لیست IP تمیز</p>
  </header>

  <div class="info-box">
    <strong>📌 تنظیمات:</strong><br>
    • Path: <code>/IR-NETLIFY</code><br>
    • Padding: <code>iran</code><br>
    • Remark: <code>@IR_NETLIFY</code>
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
      <label for="targetDomain">🎯 دامنه/IP سرور Xray شما</label>
      <input type="text" id="targetDomain" placeholder="http://example.com:444">
    </div>
  </div>

  <div id="ipListMode" class="hidden">
    <div class="form-group">
      <label for="railwayDomainIP">🚂 دامنه Railway (خودکار)</label>
      <input type="text" id="railwayDomainIP" readonly>
    </div>
    <div class="form-group">
      <label for="targetDomainIP">🎯 دامنه/IP سرور (برای x-host)</label>
      <input type="text" id="targetDomainIP" placeholder="http://example.com:444">
    </div>
    <div class="info-box">
      <strong>📝 راهنما:</strong> هر IP را در یک خط جداگانه وارد کنید.
    </div>
    <div class="form-group">
      <label for="ipList">📡 لیست آی‌پی های تمیز</label>
      <textarea id="ipList" placeholder="66.33.22.10
66.33.22.15
69.9.164.20"></textarea>
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

  <footer>MAHAN CLOUD NETWORK © 2024 | @IR_NETLIFY</footer>
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
      alert('⚠️ لطفاً دامنه/IP هدف را وارد کنید.');
      return;
    }

    const config = buildVlessConfig(currentHost, targetDomain, uuidInput, currentHost);
    generatedConfigs.push(config);
    outputTitle.innerText = '📦 کانفیگ VLESS تولید شده:';
    displayConfigs([{ address: currentHost, config: config, target: targetDomain }]);
  } else {
    const targetDomainIP = document.getElementById('targetDomainIP').value.trim();
    const ipListText = document.getElementById('ipList').value.trim();
    
    if (!targetDomainIP) {
      alert('⚠️ لطفاً دامنه/IP هدف را وارد کنید.');
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
  const railwayHost = currentHost;
  
  // ساخت extra JSON با تنظیمات دقیق
  const extraJson = {
    "xPaddingBytes": "1-1",
    "xPaddingObfsMode": true,
    "scMaxEachPostBytes": "1000000",
    "xPaddingKey": "iran",
    "xPaddingHeader": "iran",
    "headers": {
      "x-host": targetDomain
    }
  };
  
  const extraEncoded = encodeURIComponent(JSON.stringify(extraJson));
  const pathEncoded = encodeURIComponent("/IR-NETLIFY");
  
  return \`vless://\${uuid}@\${address}:443?mode=auto&path=\${pathEncoded}&security=tls&alpn=h2%2Chttp%2F1.1&encryption=none&extra=\${extraEncoded}&insecure=0&host=\${railwayHost}&fp=chrome&type=xhttp&allowInsecure=0&sni=\${sni}#@IR_NETLIFY\`;
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

  res.writeHead(200, {
    "Content-Type": "text/html; charset=UTF-8",
    "Cache-Control": "public, max-age=3600"
  });
  res.end(html);
};

// ایجاد سرور
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const method = req.method;
    
    // دریافت target از header
    let target = req.headers['x-host'] || process.env.TARGET_DOMAIN;
    
    // اگر root path و بدون target
    if (url.pathname === "/" && !target && method === "GET") {
      return serveConfigGenerator(req, res);
    }
    
    // اگر target نداریم
    if (!target) {
      res.writeHead(400, { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-store"
      });
      return res.end("Error: x-host header is required");
    }
    
    // ساخت URL هدف
    const targetUrl = buildTargetUrl(target, url.pathname, url.search);
    
    // آماده‌سازی headers
    const forwardHeaders = {};
    
    for (const [key, value] of Object.entries(req.headers)) {
      const lowerKey = key.toLowerCase();
      if (STRIP_HEADERS.has(lowerKey)) continue;
      forwardHeaders[key] = value;
    }
    
    const clientIp = req.headers['x-real-ip'] || 
                     req.headers['x-forwarded-for'] || 
                     req.socket.remoteAddress;
    if (clientIp) {
      forwardHeaders['x-forwarded-for'] = clientIp;
    }
    
    const fetchOptions = {
      method: method,
      headers: forwardHeaders,
      redirect: "manual"
    };
    
    if (method !== "GET" && method !== "HEAD") {
      fetchOptions.body = Readable.toWeb(req);
      fetchOptions.duplex = "half";
    }
    
    const response = await fetch(targetUrl, fetchOptions);
    
    const responseHeaders = {};
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase() === "transfer-encoding") continue;
      responseHeaders[key] = value;
    }
    
    responseHeaders["Cache-Control"] = response.ok ? "public, max-age=15" : "no-store";
    responseHeaders["Vary"] = "x-host, accept-encoding";
    
    res.writeHead(response.status, response.statusText, responseHeaders);
    
    if (response.body) {
      await pipeline(Readable.fromWeb(response.body), res);
    } else {
      res.end();
    }
    
  } catch (error) {
    console.error("Relay Error:", error.message);
    if (!res.headersSent) {
      res.writeHead(502, { 
        "Content-Type": "text/plain",
        "Cache-Control": "no-store" 
      });
      res.end("Bad Gateway");
    }
  }
});

server.on('error', (err) => console.error('Server error:', err.message));
server.on('clientError', (err, socket) => {
  if (!socket.destroyed) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MAHAN Railway Relay running on port ${PORT}`);
  console.log(`📡 Ready to proxy with x-host header`);
  console.log(`🎯 Path: /IR-NETLIFY | Remark: @IR_NETLIFY`);
});
