import http from "node:http";

const PORT = parseInt(process.env.PORT || "8080", 10);

const STRIP_HEADERS = new Set([
  "host", "connection", "keep-alive", "proxy-authenticate", 
  "proxy-authorization", "te", "trailer", "transfer-encoding", 
  "upgrade", "forwarded", "x-forwarded-host", "x-forwarded-proto", 
  "x-forwarded-port", "x-forwarded-for", "x-real-ip", "x-host"
]);

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

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url || '/';
    const urlParts = urlPath.split('?');
    const pathname = urlParts[0];
    const search = urlParts[1] ? '?' + urlParts[1] : '';
    
    const method = req.method || 'GET';
    const target = req.headers['x-host'] || process.env.TARGET_DOMAIN;
    
    // اگر root و بدون target
    if (pathname === "/" && !target && method === "GET") {
      const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>MAHAN CDN</title>
<style>
body{background:#0a0f1d;color:#f1f5f9;font-family:system-ui;padding:20px;max-width:800px;margin:0 auto}
.box{background:#121829;border:1px solid #1e293b;border-radius:12px;padding:24px;margin:20px 0}
h1{color:#00ff66;text-align:center}
input,textarea{width:100%;padding:12px;margin:8px 0;background:#0a0f1d;border:1px solid #1e293b;color:#f1f5f9;border-radius:6px;font-family:monospace;font-size:13px}
textarea{min-height:120px}
button{width:100%;padding:14px;background:#00ff66;color:#020617;border:none;border-radius:8px;font-weight:600;cursor:pointer;margin-top:10px}
button:hover{background:#00cc52}
.out{display:none;margin-top:20px}
.out.show{display:block}
.item{background:#1a2332;padding:12px;margin:10px 0;border-radius:6px;border-left:3px solid #00ff66}
.item pre{margin:8px 0;font-size:11px;overflow-x:auto;white-space:pre-wrap;word-break:break-all}
</style>
</head>
<body>
<h1>⚡ MAHAN CDN</h1>
<div class="box">
<p style="text-align:center;color:#64748b">Railway Relay با x-host routing</p>
<label>🚂 Railway Domain:</label>
<input type="text" id="railway" readonly>
<label>🎯 Target (x-host):</label>
<input type="text" id="target" placeholder="http://example.com:444">
<label>📡 Clean IPs (هر خط یک IP):</label>
<textarea id="ips" placeholder="66.33.22.10
66.33.22.15"></textarea>
<label>🔑 UUID:</label>
<input type="text" id="uuid" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
<button onclick="gen()">✨ تولید کانفیگ</button>
<div class="out" id="out"></div>
</div>
<script>
document.getElementById('railway').value=location.host;
function gen(){
const r=location.host;
const t=document.getElementById('target').value.trim();
const u=document.getElementById('uuid').value.trim();
const ips=document.getElementById('ips').value.trim().split('\\n').filter(x=>x.trim());
if(!t||!u){alert('⚠️ لطفا تمام فیلدها را پر کنید');return}
const out=document.getElementById('out');
out.innerHTML='';
const configs=[];
if(ips.length>0){
ips.forEach((ip,i)=>{
const cfg=buildCfg(ip.trim(),t,u,r);
configs.push(cfg);
out.innerHTML+=\`<div class="item"><b>#\${i+1} → \${ip.trim()}</b><pre>\${cfg}</pre></div>\`;
});
}else{
const cfg=buildCfg(r,t,u,r);
configs.push(cfg);
out.innerHTML+=\`<div class="item"><pre>\${cfg}</pre></div>\`;
}
out.classList.add('show');
}
function buildCfg(addr,tgt,uuid,sni){
const extra={
"xPaddingBytes":"1-1",
"xPaddingObfsMode":true,
"scMaxEachPostBytes":"1000000",
"xPaddingKey":"iran",
"xPaddingHeader":"iran",
"headers":{"x-host":tgt}
};
const e=encodeURIComponent(JSON.stringify(extra));
const p=encodeURIComponent("/IR-NETLIFY");
return \`vless://\${uuid}@\${addr}:443?mode=auto&path=\${p}&security=tls&alpn=h2%2Chttp%2F1.1&encryption=none&extra=\${e}&insecure=0&host=\${sni}&fp=chrome&type=xhttp&allowInsecure=0&sni=\${sni}#@IR_NETLIFY\`;
}
</script>
</body>
</html>`;
      
      res.writeHead(200, {
        "Content-Type": "text/html; charset=UTF-8",
        "Cache-Control": "public, max-age=3600"
      });
      return res.end(html);
    }
    
    if (!target) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Error: x-host header required");
    }
    
    const targetUrl = buildTargetUrl(target, pathname, search);
    
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (STRIP_HEADERS.has(key.toLowerCase())) continue;
      headers[key] = value;
    }
    
    const clientIp = req.headers['x-real-ip'] || 
                     req.headers['x-forwarded-for'] || 
                     req.socket?.remoteAddress;
    if (clientIp) {
      headers['x-forwarded-for'] = clientIp;
    }
    
    const options = {
      method: method,
      headers: headers,
      redirect: "manual"
    };
    
    if (method !== "GET" && method !== "HEAD") {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        options.body = Buffer.concat(chunks);
      }
    }
    
    const response = await fetch(targetUrl, options);
    
    const resHeaders = {};
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "transfer-encoding") {
        resHeaders[key] = value;
      }
    });
    
    resHeaders["Cache-Control"] = response.ok ? "public, max-age=15" : "no-store";
    resHeaders["Vary"] = "x-host";
    
    res.writeHead(response.status, resHeaders);
    
    if (response.body) {
      const reader = response.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(Buffer.from(value));
        }
      } finally {
        reader.releaseLock();
      }
    }
    
    res.end();
    
  } catch (error) {
    console.error("Error:", error.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Bad Gateway");
    }
  }
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

server.on('clientError', (err, socket) => {
  console.error('Client error:', err.message);
  if (!socket.destroyed) {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[MAHAN] Server running on port ${PORT}`);
  console.log(`[MAHAN] Path: /IR-NETLIFY`);
  console.log(`[MAHAN] Remark: @IR_NETLIFY`);
});
