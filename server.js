// ============================================================
//   RK RAJA XWD BOT ❤️ — Render Deploy Ready
//   Express server + Facebook bot + Live Dashboard (all-in-one)
// ============================================================

const express = require("express");
const login   = require("@dongdev/fca-unofficial");

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ================= RUNTIME STATE =================
const runtime = {
  running: false,
  api: null,
  config: null,
  startTime: 0,
  stats: { blocked: 0, abuse: 0, nicks: 0, uptime: 0 },
  logs: [],
  interval: null,
};

const state = {
  gcLocked: false, gcOriginalName: "",
  nickLocked: false, nickMap: {},
  picLocked: false, picOriginalStream: null,
  muteAll: false, antiGali: true,
};

const FULL_GALI = ["ma ki","maki","maa ki","teri ma","bhen ki","behen ki","bhosd","bsdk","madarch","chutiya","gandu","laude","lund","randi","kutti","harami","saala","kutta","kamina"];
const MILD_GALI = ["rk","raja"];

// ================= HELPERS =================
function addLog(msg, type = "info") {
  runtime.logs.push({ time: new Date().toLocaleTimeString(), msg, type });
  if (runtime.logs.length > 80) runtime.logs.shift();
  console.log(`[${type}] ${msg}`);
}
const isAdmin = (id) => runtime.config && String(id) === String(runtime.config.adminUid);
const getPfx  = () => (runtime.config && runtime.config.prefix) || "#";
const isCmd   = (b) => b && b.startsWith(getPfx());
const cmdName = (b) => b.slice(getPfx().length).trim().split(/\s+/)[0].toLowerCase();
const hasGali = (t) => FULL_GALI.some(w => (t || "").toLowerCase().includes(w));
const hasMild = (t) => MILD_GALI.some(w => new RegExp(`\\b${w}\\b`).test((t || "").toLowerCase()));

// ================= MESSAGE HANDLER =================
function handleMessage(api, event) {
  const { threadID, senderID, body, messageID } = event;
  if (String(threadID) !== String(runtime.config.groupUid)) return;
  const admin = isAdmin(senderID);

  if (isCmd(body)) {
    if (!admin) return api.sendMessage("❌ Sirf ADMIN bot use kar sakta hai!", threadID, messageID);
    return handleCommand(api, event, cmdName(body), body);
  }

  if (state.muteAll && !admin) {
    api.unsendMessage(messageID, () => {});
    runtime.stats.blocked++;
    return;
  }

  if (state.antiGali) {
    if (hasGali(body) && !admin) {
      api.unsendMessage(messageID, () => {});
      runtime.stats.abuse++;
      runtime.stats.blocked++;
      return api.sendMessage({
        body: `😎 *RK RAJA TERA BAAP HAI* 🔥\n> @[${senderID}] gali mat de warna kick!`,
        mentions: [{ tag: "@user", id: senderID }],
      }, threadID);
    }
    if (hasMild(body) && !admin) {
      api.sendMessage({
        body: `⚠️ @[${senderID}] "raja" bolne se kuch nahi — *RK RAJA hi tera baap hai* 😎🔥`,
        mentions: [{ tag: "@user", id: senderID }],
      }, threadID);
    }
  }
}

// ================= COMMANDS =================
function handleCommand(api, event, cmd, body) {
  const { threadID, messageID, mentions } = event;
  const args = body.slice(getPfx().length + cmd.length).trim();
  const target = mentions && mentions[0] ? mentions[0].id : null;
  const P = getPfx();

  switch (cmd) {
    case "help":
      api.sendMessage(
`╔══════════════════════════╗
   ❤️ *RK RAJA XWD BOT* ❤️
╚══════════════════════════╝

*🔒 GROUP LOCKS*
 ${P}lockgc     → GC name lock
 ${P}unlockgc   → GC name unlock
 ${P}locknick   → sabke nick lock
 ${P}unlocknick → nick unlock
 ${P}lockpic    → group pic lock
 ${P}unlockpic  → pic unlock

*🔇 MODERATION*
 ${P}muteall    → sirf admin bol sakta
 ${P}unmuteall  → sab bol sakte
 ${P}antigali on/off

*👑 ADMIN*
 ${P}kick @user
 ${P}promote @user
 ${P}demote @user
 ${P}status

_Prefix: ${P} | Admin only_`, threadID, messageID);
      break;

    case "lockgc":   state.gcLocked = true;  api.sendMessage(`🔒 GC LOCKED: *${state.gcOriginalName}*`, threadID, messageID); break;
    case "unlockgc": state.gcLocked = false; api.sendMessage("🔓 GC UNLOCKED", threadID, messageID); break;

    case "locknick":
      api.getThreadInfo(threadID, (e, info) => {
        if (!e && info.userInfo) { state.nickMap = {}; info.userInfo.forEach(u => state.nickMap[u.id] = u.name); }
        state.nickLocked = true;
        runtime.stats.nicks = Object.keys(state.nickMap).length;
        api.sendMessage(`🔒 ${runtime.stats.nicks} nicks LOCKED ✅`, threadID, messageID);
      });
      break;
    case "unlocknick": state.nickLocked = false; api.sendMessage("🔓 Nick UNLOCKED", threadID, messageID); break;

    case "lockpic":
      api.getThreadInfo(threadID, (e, info) => {
        if (!e && info.image) { state.picOriginalStream = info.image; state.picLocked = true; api.sendMessage("🔒 PIC LOCKED ✅", threadID, messageID); }
        else api.sendMessage("❌ Pic nahi mili", threadID, messageID);
      });
      break;
    case "unlockpic": state.picLocked = false; api.sendMessage("🔓 PIC UNLOCKED", threadID, messageID); break;

    case "muteall":   state.muteAll = true;  api.sendMessage("🔇 MUTE-ALL ON — sirf admin bol sakta 😎", threadID, messageID); break;
    case "unmuteall": state.muteAll = false; api.sendMessage("🔊 MUTE-ALL OFF", threadID, messageID); break;

    case "antigali": state.antiGali = args === "on"; api.sendMessage(`🛡️ Anti-Gali: *${state.antiGali ? "ON" : "OFF"}*`, threadID, messageID); break;

    case "kick":
      if (!target) return api.sendMessage("❌ @mention karo", threadID, messageID);
      api.removeUserFromGroup(target, threadID, e => api.sendMessage(e ? "❌ " + e : "👢 KICKED ✅", threadID, messageID));
      break;
    case "promote":
      if (!target) return api.sendMessage("❌ @mention karo", threadID, messageID);
      api.changeAdminStatus(threadID, target, true, e => api.sendMessage(e ? "❌ " + e : "👑 PROMOTED ✅", threadID, messageID));
      break;
    case "demote":
      if (!target) return api.sendMessage("❌ @mention karo", threadID, messageID);
      api.changeAdminStatus(threadID, target, false, e => api.sendMessage(e ? "❌ " + e : "⬇️ DEMOTED ✅", threadID, messageID));
      break;

    case "status":
      api.sendMessage(
`📊 *BOT STATUS*
🔒 GC: ${state.gcLocked ? "ON" : "OFF"}
🔒 Nick: ${state.nickLocked ? "ON" : "OFF"}
🔒 Pic: ${state.picLocked ? "ON" : "OFF"}
🔇 Mute: ${state.muteAll ? "ON" : "OFF"}
🛡️ Anti-Gali: ${state.antiGali ? "ON" : "OFF"}`, threadID, messageID);
      break;
    default:
      api.sendMessage(`❓ Unknown — type *${P}help*`, threadID, messageID);
  }
}

// ================= LOCK ENFORCER =================
function enforceLocks(api) {
  const tid = runtime.config.groupUid;
  if (state.gcLocked && state.gcOriginalName) {
    api.getThreadInfo(tid, (e, info) => {
      if (!e && info.threadName !== state.gcOriginalName) {
        api.setTitle(state.gcOriginalName, tid, () => { addLog("⚠️ GC name reset 🔒", "warn"); api.sendMessage("⚠️ GC name reset 🔒", tid); });
      }
    });
  }
  if (state.nickLocked) {
    api.getThreadInfo(tid, (e, info) => {
      if (e || !info.userInfo) return;
      info.userInfo.forEach(u => {
        if (state.nickMap[u.id] && u.name !== state.nickMap[u.id]) {
          api.changeNickname(state.nickMap[u.id], tid, u.id, () => {});
          addLog(`⚠️ Nick reset for ${u.name}`, "warn");
        }
      });
    });
  }
  if (state.picLocked && state.picOriginalStream) {
    api.getThreadInfo(tid, (e, info) => {
      if (!e && info.image !== state.picOriginalStream) {
        api.changeGroupImage(state.picOriginalStream, tid, () => { addLog("⚠️ Pic reset 🔒", "warn"); api.sendMessage("⚠️ Group pic reset 🔒", tid); });
      }
    });
  }
}

// ================= API: START =================
app.post("/api/start", async (req, res) => {
  if (runtime.running) return res.json({ ok: false, msg: "Bot already running!" });

  const { groupUid, adminUid, prefix, c3c } = req.body;
  if (!groupUid || !adminUid || !c3c) return res.json({ ok: false, msg: "Sab fields bharo bhai!" });

  let appState;
  try {
    appState = JSON.parse(c3c);
    if (!Array.isArray(appState)) throw new Error("Appstate JSON array nahi hai");
  } catch (e) {
    return res.json({ ok: false, msg: "❌ C3C invalid — appstate JSON paste karo" });
  }

  runtime.config = { groupUid: String(groupUid), adminUid: String(adminUid), prefix: prefix || "#" };
  runtime.logs = [];
  runtime.stats = { blocked: 0, abuse: 0, nicks: 0, uptime: 0 };
  state.gcLocked = state.nickLocked = state.picLocked = false;
  state.nickMap = {};
  state.picOriginalStream = null;
  state.gcOriginalName = "";

  addLog("🚀 Bot starting...", "ok");
  addLog(`🆔 Group UID: ${groupUid}`, "info");
  addLog(`👑 Admin UID: ${adminUid}`, "info");
  addLog(`# Prefix: ${runtime.config.prefix}`, "info");

  login({ appState }, (err, api) => {
    if (err) {
      addLog("❌ Login failed: " + err.message, "err");
      return res.json({ ok: false, msg: "Login failed: " + err.message });
    }

    api.setOptions({ listenEvents: true, selfListen: false });
    runtime.api = api;
    runtime.running = true;
    runtime.startTime = Date.now();
    addLog("✅ Login successful — FB account connected", "ok");

    // Auto start locks
    api.getThreadInfo(runtime.config.groupUid, (e, info) => {
      if (e) {
        addLog("❌ Group info fetch failed — group UID check karo", "err");
      } else {
        state.gcOriginalName = info.threadName;
        state.gcLocked = true;
        state.picOriginalStream = info.image || null;
        state.picLocked = !!info.image;
        state.nickMap = {};
        (info.userInfo || []).forEach(u => state.nickMap[u.id] = u.name);
        state.nickLocked = true;
        state.muteAll = true;
        runtime.stats.nicks = Object.keys(state.nickMap).length;
        addLog(`🔒 GC name locked: ${info.threadName}`, "ok");
        addLog(`🔒 ${runtime.stats.nicks} nicknames locked`, "ok");
        addLog(`🔒 Group pic: ${state.picLocked ? "LOCKED" : "skipped"}`, "ok");
        addLog("🔇 MUTE-ALL ON — sirf admin bol sakta", "ok");
        addLog("🛡️ Anti-Gali filter ON", "ok");
        addLog("✅ Bot READY! Sab locks active 🎯", "ok");
        api.sendMessage("✅ *RK RAJA XWD BOT ONLINE* ❤️\n\n🔒 GC lock: ON\n🔒 Nick lock: ON\n🔒 Pic lock: ON\n🔇 Mute-all: ON\n🛡️ Anti-gali: ON\n\nType #help for commands", runtime.config.groupUid);
      }
    });

    api.listenMqtt((err, event) => {
      if (err || event.type !== "message") return;
      handleMessage(api, event);
    });

    runtime.interval = setInterval(() => {
      enforceLocks(api);
      runtime.stats.uptime = Math.floor((Date.now() - runtime.startTime) / 1000);
    }, 20000);

    res.json({ ok: true });
  });
});

// ================= API: STOP =================
app.post("/api/stop", (req, res) => {
  if (!runtime.running) return res.json({ ok: false, msg: "Bot not running" });
  if (runtime.interval) clearInterval(runtime.interval);
  try { runtime.api && runtime.api.logout(() => {}); } catch (e) {}
  runtime.running = false;
  runtime.api = null;
  addLog("⏹ Bot stopped by user", "warn");
  res.json({ ok: true });
});

// ================= API: STATUS =================
app.get("/api/status", (req, res) => {
  if (runtime.running && runtime.startTime) {
    runtime.stats.uptime = Math.floor((Date.now() - runtime.startTime) / 1000);
  }
  res.json({
    running: runtime.running,
    stats: runtime.stats,
    logs: runtime.logs,
    config: runtime.config ? { groupUid: runtime.config.groupUid, adminUid: runtime.config.adminUid, prefix: runtime.config.prefix } : null,
  });
});

// ================= DASHBOARD HTML =================
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>RK RAJA XWD BOT ❤️</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',system-ui,sans-serif}
  html,body{min-height:100vh;background:#06061a;color:#fff;overflow-x:hidden}
  body::before{content:'';position:fixed;inset:0;z-index:-1;
    background:
      radial-gradient(circle at 15% 20%,rgba(168,85,247,.35),transparent 45%),
      radial-gradient(circle at 85% 15%,rgba(236,72,153,.30),transparent 45%),
      radial-gradient(circle at 50% 95%,rgba(34,211,238,.25),transparent 50%);}
  .header{text-align:center;padding:36px 16px 8px}
  .header h1{font-size:clamp(24px,5.5vw,44px);font-weight:900;letter-spacing:1.2px;
    background:linear-gradient(90deg,#a855f7,#ec4899,#22d3ee,#a855f7);
    background-size:300% 100%;-webkit-background-clip:text;background-clip:text;
    color:transparent;animation:shine 4s linear infinite;filter:drop-shadow(0 0 22px rgba(236,72,153,.45))}
  @keyframes shine{0%{background-position:0% 50%}100%{background-position:300% 50%}}
  .header p{color:#a1a1c7;font-size:13px;margin-top:8px;letter-spacing:.4px}
  .wrap{max-width:1180px;margin:0 auto;padding:18px}
  .grid{display:grid;grid-template-columns:1fr 1.15fr;gap:20px}
  @media(max-width:880px){.grid{grid-template-columns:1fr}}
  .card{background:rgba(255,255,255,.05);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,.10);border-radius:22px;padding:22px;
    box-shadow:0 10px 40px rgba(0,0,0,.4);position:relative;overflow:hidden}
  .card::before{content:'';position:absolute;top:-50%;left:-20%;width:220px;height:220px;
    background:radial-gradient(circle,rgba(168,85,247,.3),transparent 70%);filter:blur(30px);pointer-events:none}
  .card h2{font-size:14px;margin-bottom:16px;color:#e9d5ff;letter-spacing:.7px;text-transform:uppercase;display:flex;align-items:center;gap:8px}
  .field{margin-bottom:14px}
  .field label{display:block;font-size:11.5px;color:#a1a1c7;margin-bottom:6px;letter-spacing:.5px;text-transform:uppercase;font-weight:600}
  .field input,.field textarea{width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);
    background:rgba(0,0,0,.4);color:#fff;font-size:14px;outline:none;transition:.25s;font-family:inherit}
  .field input:focus,.field textarea:focus{border-color:#a855f7;box-shadow:0 0 0 3px rgba(168,85,247,.22);background:rgba(0,0,0,.55)}
  .field textarea{resize:vertical;min-height:88px;font-family:'Consolas',monospace;font-size:12px;line-height:1.5}
  .btns{display:flex;gap:12px;margin-top:10px}
  .btn{flex:1;padding:14px;border-radius:14px;border:none;cursor:pointer;font-weight:700;font-size:14px;letter-spacing:.6px;
    transition:.25s;display:flex;align-items:center;justify-content:center;gap:8px;text-transform:uppercase}
  .btn-run{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;box-shadow:0 8px 24px rgba(34,197,94,.4)}
  .btn-run:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px rgba(34,197,94,.55)}
  .btn-stop{background:linear-gradient(135deg,#ef4444,#b91c1c);color:#fff;box-shadow:0 8px 24px rgba(239,68,68,.4)}
  .btn-stop:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 12px 32px rgba(239,68,68,.55)}
  .btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important}
  .statusbar{display:flex;align-items:center;gap:10px;margin-top:16px;padding:12px 14px;border-radius:14px;
    background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.08);font-size:13px}
  .dot{width:11px;height:11px;border-radius:50%;background:#ef4444;box-shadow:0 0 12px #ef4444;flex-shrink:0}
  .dot.live{background:#22c55e;box-shadow:0 0 16px #22c55e;animation:pulse 1.4s infinite}
  @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.35);opacity:.75}}
  .stats{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .stat{background:linear-gradient(145deg,rgba(168,85,247,.20),rgba(236,72,153,.10));
    border:1px solid rgba(255,255,255,.10);border-radius:16px;padding:16px;text-align:center;position:relative;overflow:hidden}
  .stat::after{content:'';position:absolute;inset:0;background:linear-gradient(145deg,transparent,rgba(255,255,255,.04));pointer-events:none}
  .stat .num{font-size:28px;font-weight:800;color:#f0abfc;letter-spacing:1px;line-height:1.1}
  .stat .lbl{font-size:10.5px;color:#c4b5fd;margin-top:5px;letter-spacing:.6px;text-transform:uppercase;font-weight:600}
  .log{height:250px;overflow-y:auto;background:rgba(0,0,0,.5);border-radius:14px;padding:12px;
    font-size:12.5px;font-family:'Consolas',monospace;line-height:1.75;border:1px solid rgba(255,255,255,.08);margin-top:8px}
  .log::-webkit-scrollbar{width:6px}
  .log::-webkit-scrollbar-thumb{background:#a855f7;border-radius:4px}
  .log::-webkit-scrollbar-track{background:transparent}
  .log div{margin-bottom:2px}
  .log .t{color:#64748b;margin-right:6px}
  .log .ok{color:#4ade80}
  .log .warn{color:#fbbf24}
  .log .err{color:#f87171}
  .log .info{color:#38bdf8}
  .cmds{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
  .cmd{background:rgba(168,85,247,.15);border:1px solid rgba(168,85,247,.38);
    color:#e9d5ff;padding:8px 13px;border-radius:11px;font-size:12px;font-family:monospace;
    transition:.2s;cursor:default;font-weight:500}
  .cmd:hover{background:rgba(168,85,247,.32);transform:translateY(-2px);border-color:#a855f7}
  .footer{text-align:center;padding:30px 12px;color:#6b6b8f;font-size:12px;letter-spacing:.4px}
  .footer b{color:#ec4899}
  .toast{position:fixed;top:20px;right:20px;padding:14px 20px;border-radius:12px;
    background:rgba(0,0,0,.9);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:13px;
    z-index:999;opacity:0;transform:translateX(400px);transition:.35s;max-width:300px;backdrop-filter:blur(10px)}
  .toast.show{opacity:1;transform:translateX(0)}
  .toast.ok{border-color:#22c55e;box-shadow:0 0 20px rgba(34,197,94,.35)}
  .toast.err{border-color:#ef4444;box-shadow:0 0 20px rgba(239,68,68,.35)}
</style>
</head>
<body>
<div class="header">
  <h1>RK RAJA XWD BOT ❤️</h1>
  <p>Facebook Group Protector • Auto Moderation • Live Control Panel</p>
</div>
<div class="wrap">
  <div class="grid">
    <div class="card">
      <h2>⚙️ Bot Configuration</h2>
      <div class="field"><label>🆔 Group UID</label><input id="groupUid" placeholder="1234567890123456" /></div>
      <div class="field"><label>👑 Admin UID (FB User ID)</label><input id="adminUid" placeholder="100012345678901" /></div>
      <div class="field"><label># Prefix</label><input id="prefix" value="#" /></div>
      <div class="field"><label>🔗 C3C Paste (AppState JSON)</label><textarea id="c3c" placeholder='[{"key":"c_user","value":"...","domain":".facebook.com"}]'></textarea></div>
      <div class="btns">
        <button class="btn btn-run" id="runBtn" onclick="startBot()">▶ Run</button>
        <button class="btn btn-stop" id="stopBtn" onclick="stopBot()" disabled>⏹ Stop</button>
      </div>
      <div class="statusbar">
        <span class="dot" id="dot"></span>
        <span id="statusText">Offline — Bot is not running</span>
      </div>
    </div>
    <div class="card">
      <h2>📊 Live Dashboard</h2>
      <div class="stats">
        <div class="stat"><div class="num" id="sBlocked">0</div><div class="lbl">Messages Blocked</div></div>
        <div class="stat"><div class="num" id="sNick">0</div><div class="lbl">Nicks Locked</div></div>
        <div class="stat"><div class="num" id="sAbuse">0</div><div class="lbl">Abuse Caught</div></div>
        <div class="stat"><div class="num" id="sUptime">00:00</div><div class="lbl">Uptime</div></div>
      </div>
      <h2 style="margin-top:18px">📜 Activity Log</h2>
      <div class="log" id="log"></div>
    </div>
  </div>
  <div class="card" style="margin-top:20px">
    <h2>📖 All Commands (with prefix)</h2>
    <div class="cmds">
      <span class="cmd">#help</span><span class="cmd">#lockgc</span><span class="cmd">#unlockgc</span>
      <span class="cmd">#locknick</span><span class="cmd">#unlocknick</span><span class="cmd">#lockpic</span>
      <span class="cmd">#unlockpic</span><span class="cmd">#muteall</span><span class="cmd">#unmuteall</span>
      <span class="cmd">#kick @user</span><span class="cmd">#promote @user</span><span class="cmd">#demote @user</span>
      <span class="cmd">#antigali on/off</span><span class="cmd">#status</span>
    </div>
  </div>
  <div class="footer">Made with <b>❤️</b> by RK RAJA • XWD BOT v1.0</div>
</div>

<script>
const $ = id => document.getElementById(id);
let pollTimer = null;

function toast(msg, type='ok'){
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add('show'), 30);
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(), 400); }, 3200);
}

async function startBot(){
  const groupUid = $('groupUid').value.trim();
  const adminUid = $('adminUid').value.trim();
  const prefix   = $('prefix').value.trim() || '#';
  const c3c      = $('c3c').value.trim();

  if(!groupUid){ toast('❌ Group UID daalo','err'); return; }
  if(!adminUid){ toast('❌ Admin UID daalo','err'); return; }
  if(!c3c){ toast('❌ C3C paste karo','err'); return; }

  $('runBtn').disabled = true;
  $('runBtn').textContent = '⏳ Starting...';
  toast('🚀 Bot start ho raha hai...','ok');

  try {
    const res = await fetch('/api/start', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ groupUid, adminUid, prefix, c3c })
    });
    const data = await res.json();
    if(!data.ok){ toast('❌ ' + data.msg, 'err'); $('runBtn').disabled=false; $('runBtn').textContent='▶ Run'; return; }
    $('stopBtn').disabled = false;
    $('runBtn').textContent = '▶ Run';
    $('dot').classList.add('live');
    $('statusText').textContent = 'Online — Bot is running ✅';
    toast('✅ Bot ONLINE!','ok');
    startPolling();
  } catch(e){
    toast('❌ ' + e.message, 'err');
    $('runBtn').disabled = false;
    $('runBtn').textContent = '▶ Run';
  }
}

async function stopBot(){
  $('stopBtn').disabled = true;
  try {
    const res = await fetch('/api/stop', { method:'POST' });
    const data = await res.json();
    if(data.ok){
      $('runBtn').disabled = false;
      $('dot').classList.remove('live');
      $('statusText').textContent = 'Offline — Bot stopped';
      toast('⏹ Bot stopped','err');
      if(pollTimer) clearInterval(pollTimer);
    }
  } catch(e){ toast('❌ ' + e.message, 'err'); }
}

function startPolling(){
  if(pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(fetchStatus, 1800);
  fetchStatus();
}

function fmtTime(s){
  const m = String(Math.floor(s/60)).padStart(2,'0');
  const sec = String(s%60).padStart(2,'0');
  return m + ':' + sec;
}

async function fetchStatus(){
  try {
    const r = await fetch('/api/status');
    const d = await r.json();
    $('sBlocked').textContent = d.stats.blocked;
    $('sNick').textContent    = d.stats.nicks;
    $('sAbuse').textContent   = d.stats.abuse;
    $('sUptime').textContent  = fmtTime(d.stats.uptime || 0);

    const logEl = $('log');
    logEl.innerHTML = d.logs.map(l =>
      '<div><span class="t">[' + l.time + ']</span><span class="' + l.type + '">' + l.msg + '</span></div>'
    ).join('');
    logEl.scrollTop = logEl.scrollHeight;

    if(d.running){
      $('dot').classList.add('live');
      $('statusText').textContent = 'Online — Bot is running ✅';
      $('runBtn').disabled = true;
      $('stopBtn').disabled = false;
    } else {
      $('dot').classList.remove('live');
      $('statusText').textContent = 'Offline — Bot is not running';
      $('runBtn').disabled = false;
      $('stopBtn').disabled = true;
    }
  } catch(e){}
}

fetchStatus();
setInterval(fetchStatus, 2500);
</script>
</body>
</html>`;

app.get("/", (req, res) => res.type("html").send(HTML));

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 RK RAJA XWD BOT server running on port ${PORT}`);
});
