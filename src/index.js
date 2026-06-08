import http from "node:http";

const PORT = parseInt(process.env.PORT || "8080", 10);

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(err => {
    console.error('[ERROR]', err.message);
    if (!res.headersSent) {
      try {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Bad Gateway');
      } catch (e) {
        res.destroy();
      }
    }
  });
});

async function handleRequest(req, res) {
  const target = req.headers['x-host'] || process.env.TARGET_DOMAIN;
  const path = req.url || '/';
  const method = req.method || 'GET';
  
  // صفحه اصلی
  if (path === '/' && !target && method === 'GET') {
    const html = getHTML();
    res.writeHead(200, { 
      'Content-Type': 'text/html; charset=UTF-8',
      'Content-Length': Buffer.byteLength(html)
    });
    res.end(html);
    return;
  }
  
  // بدون target
  if (!target) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('x-host header required');
    return;
  }
  
  // ساخت URL
  let targetUrl = target;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const isSecure = !targetUrl.includes(':') || targetUrl.includes(':443');
    targetUrl = (isSecure ? 'https://' : 'http://') + targetUrl;
  }
  targetUrl += path;
  
  // ساخت headers
  const headers = {};
  for (const key in req.headers) {
    const lower = key.toLowerCase();
    if (lower === 'host' || lower === 'x-host' || lower === 'connection') continue;
    headers[key] = req.headers[key];
  }
  
  // خواندن body
  let body = undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks = [];
    try {
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        body = Buffer.concat(chunks);
      }
    } catch (e) {
      console.error('[BODY READ ERROR]', e.message);
    }
  }
  
  // درخواست به target
  let response;
  try {
    response = await fetch(targetUrl, {
      method: method,
      headers: headers,
      body: body,
      redirect: 'manual'
    });
  } catch (fetchError) {
    console.error('[FETCH ERROR]', fetchError.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Cannot connect to target');
    return;
  }
  
  // ارسال response
  try {
    const resHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        resHeaders[key] = value;
      }
    });
    
    res.writeHead(response.status, resHeaders);
    
    if (response.body) {
      const reader = response.body.getReader();
      let reading = true;
      
      while (reading) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            reading = false;
            break;
          }
          if (value && value.length > 0) {
            res.write(Buffer.from(value));
          }
        } catch (readError) {
          console.error('[READ ERROR]', readError.message);
          reading = false;
        }
      }
      
      try {
        reader.releaseLock();
      } catch (e) {}
    }
    
    res.end();
  } catch (writeError) {
    console.error('[WRITE ERROR]', writeError.message);
    try {
      res.destroy();
    } catch (e) {}
  }
}

function getHTML() {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MAHAN CDN</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0f1d;color:#f1f5f9;font-family:system-ui;padding:20px}
.container{max-width:700px;margin:0 auto;background:#121829;border:1px solid #1e293b;border-radius:12px;padding:24px}
h1{color:#00ff66;text-align:center;margin-bottom:20px}
label{display:block;color:#64748b;font-size:13px;margin:12px 0 4px}
input,textarea{width:100%;padding:10px;background:#0a0f1d;border:1px solid #1e293b;color:#f1f5f9;border-radius:6px;font-family:monospace;font-size:12px}
textarea{min-height:100px;resize:vertical}
button{width:100%;padding:12px;background:#00ff66;color:#020617;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:15px}
button:hover{background:#00cc52}
.out{margin-top:20px;display:none}
.out.show{display:block}
.item{background:#1a2332;padding:10px;margin:8px 0;border-radius:6px;border-left:3px solid #00ff66}
.item pre{font-size:10px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;color:#cbd5e1;margin-top:5px}
.info{background:#1a2332;padding:10px;border-radius:6px;font-size:12px;color:#64748b;margin-bottom:15px}
</style>
</head>
<body>
<div class="container">
<h1>⚡ MAHAN CDN</h1>
<div class="info">
Path: <code>/IR-NETLIFY</code> | Padding: <code>iran</code> | Remark: <code>@IR_NETLIFY</code>
</div>
<label>🚂 Railway Domain</label>
<input type="text" id="railway" readonly>
<label>🎯 Target Server (x-host)</label>
<input type="text" id="target" placeholder="http://example.com:444" value="http://example.com:444">
<label>📡 Clean IPs (optional, one per line)</label>
<textarea id="ips" placeholder="66.33.22.10
66.33.22.15
69.9.164.20"></textarea>
<label>🔑 UUID</label>
<input type="text" id="uuid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
<button onclick="generate()">✨ Generate Config</button>
<div class="out" id="output"></div>
</div>
<script>
document.getElementById('railway').value=location.host;
function generate(){
const rail=location.host;
const tgt=document.getElementById('target').value.trim();
const uuid=document.getElementById('uuid').value.trim();
const ipsText=document.getElementById('ips').value.trim();
if(!tgt||!uuid){alert('⚠️ Please fill target and UUID');return}
const ips=ipsText?ipsText.split('\\n').map(x=>x.trim()).filter(x=>x):[];
const out=document.getElementById('output');
out.innerHTML='';
const configs=[];
if(ips.length>0){
ips.forEach((ip,i)=>{
const cfg=build(ip,tgt,uuid,rail);
configs.push(cfg);
out.innerHTML+=\`<div class="item"><b>#\${i+1}: \${ip}</b><pre>\${cfg}</pre></div>\`;
});
}else{
const cfg=build(rail,tgt,uuid,rail);
configs.push(cfg);
out.innerHTML+=\`<div class="item"><pre>\${cfg}</pre></div>\`;
}
out.classList.add('show');
}
function build(addr,tgt,uuid,sni){
const extra={"xPaddingBytes":"1-1","xPaddingObfsMode":true,"scMaxEachPostBytes":"1000000","xPaddingKey":"iran","xPaddingHeader":"iran","headers":{"x-host":tgt}};
const e=encodeURIComponent(JSON.stringify(extra));
const p=encodeURIComponent("/IR-NETLIFY");
return\`vless://\${uuid}@\${addr}:443?mode=auto&path=\${p}&security=tls&alpn=h2%2Chttp%2F1.1&encryption=none&extra=\${e}&insecure=0&host=\${sni}&fp=chrome&type=xhttp&allowInsecure=0&sni=\${sni}#@IR_NETLIFY\`;
}
</script>
</body>
</html>`;
}

// Error handlers
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('[SERVER ERROR]', err.message);
  }
});

server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) {
    return;
  }
  try {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch (e) {}
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT]', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION]', err);
});

// Graceful shutdown
let isShuttingDown = false;

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('[SHUTDOWN] Closing server...');
  
  server.close(() => {
    console.log('[SHUTDOWN] Server closed');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced exit');
    process.exit(1);
  }, 5000);
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MAHAN] ✓ Server running on port ${PORT}`);
  console.log(`[MAHAN] ✓ Path: /IR-NETLIFY`);
  console.log(`[MAHAN] ✓ Remark: @IR_NETLIFY`);
  console.log(`[MAHAN] ✓ Ready to accept connections`);
});

// Keep-alive
setInterval(() => {
  const mem = process.memoryUsage();
  console.log(`[HEALTH] Memory: ${Math.round(mem.heapUsed / 1024 / 1024)}MB`);
}, 60000);
