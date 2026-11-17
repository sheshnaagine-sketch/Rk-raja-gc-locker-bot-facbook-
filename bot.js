// ============================================================
//   RK RAJA XWD BOT ❤️  —  FULL FACEBOOK BOT
//   GC Lock • Nick Lock • Pic Lock • Mute-All • Anti-Gali
// ============================================================

const fs = require("fs");
const login = require("@dongdev/fca-unofficial");

// ================= CONFIG (yaha apni details daalo) =================
const CONFIG = {
  // Tera Facebook User ID (dashboard se milega ya profile URL se)
  ADMIN_ID: "100012345678901",

  // Group Thread ID (jis group me bot chalana hai)
  GROUP_UID: "1234567890123456",

  // Prefix
  PREFIX: "#",

  // Bot ka naam
  BOT_NAME: "RK RAJA XWD BOT ❤️",
};

// ================= STATE (locks on/off) =================
const state = {
  gcLocked: false,
  gcOriginalName: "",
  nickLocked: false,
  nickMap: {}, // userId -> original nickname
  picLocked: false,
  picOriginalStream: null,
  muteAll: false,
  antiGali: true,
};

// ================= GALI LIST =================
const FULL_GALI = [
  "ma ki", "maki", "maa ki", "teri ma", "bhen ki", "behen ki",
  "bhosd", "bsdk", "madarch", "chutiya", "gandu", "laude", "lund",
  "randi", "kutti", "harami", "saala", "kutta", "kamina",
];

const MILD_GALI = ["rk", "raja"];

// ================= HELPERS =================
const isAdmin = (id) => String(id) === String(CONFIG.ADMIN_ID);
const isCmd = (body) => body && body.startsWith(CONFIG.PREFIX);
const cmdName = (body) =>
  body.slice(CONFIG.PREFIX.length).trim().split(/\s+/)[0].toLowerCase();

const hasGali = (text) => {
  const t = (text || "").toLowerCase();
  return FULL_GALI.some((w) => t.includes(w));
};

const hasMildGali = (text) => {
  const t = (text || "").toLowerCase();
  return MILD_GALI.some((w) => new RegExp(`\\b${w}\\b`).test(t));
};

// ================= LOGIN & START =================
login(
  { appState: JSON.parse(fs.readFileSync("appstate.json", "utf8")) },
  (err, api) => {
    if (err) return console.error("❌ Login failed:", err);

    api.setOptions({ listenEvents: true, selfListen: false });

    console.log(`🚀 ${CONFIG.BOT_NAME} online!`);

    // Sab locks auto-ON kar do start hote hi
    autoStart(api);

    // Har message pe handler
    api.listenMqtt((err, event) => {
      if (err) return console.error(err);
      if (event.type !== "message") return;
      if (event.threadID !== CONFIG.GROUP_UID) return;

      handleMessage(api, event);
    });

    // Har 20 second me locks check karo (agar koi change kare to reset)
    setInterval(() => enforceLocks(api), 20000);
  }
);

// ================= AUTO START (locks ON) =================
function autoStart(api) {
  // GC name save + lock
  api.getThreadInfo(CONFIG.GROUP_UID, (err, info) => {
    if (!err) state.gcOriginalName = info.threadName;
    state.gcLocked = true;
    console.log("🔒 GC name locked:", state.gcOriginalName);
  });

  // Sab members ka nick save + lock
  api.getThreadInfo(CONFIG.GROUP_UID, (err, info) => {
    if (!err && info.userInfo) {
      info.userInfo.forEach((u) => {
        state.nickMap[u.id] = u.name;
      });
    }
    state.nickLocked = true;
    console.log(`🔒 ${Object.keys(state.nickMap).length} nick locked`);
  });

  // Group pic save + lock
  api.getThreadInfo(CONFIG.GROUP_UID, (err, info) => {
    if (!err && info.image) {
      state.picOriginalStream = info.image;
      state.picLocked = true;
      console.log("🔒 Group pic locked");
    }
  });

  // Mute-all ON
  state.muteAll = true;
  console.log("🔇 Mute-All ON (sirf admin bol sakta)");
}

// ================= MAIN MESSAGE HANDLER =================
async function handleMessage(api, event) {
  const { threadID, senderID, body, messageID } = event;
  const admin = isAdmin(senderID);

  // ---------- 1. COMMAND (sirf admin) ----------
  if (isCmd(body)) {
    if (!admin) {
      return api.sendMessage(
        "❌ Sirf ADMIN bot use kar sakta hai!",
        threadID,
        messageID
      );
    }
    return handleCommand(api, event, cmdName(body), body);
  }

  // ---------- 2. MUTE-ALL (non-admin message delete) ----------
  if (state.muteAll && !admin) {
    api.unsendMessage(messageID, (err) => {
      if (err) console.error("Delete error:", err);
    });
    return;
  }

  // ---------- 3. ANTI-GALI ----------
  if (state.antiGali) {
    // Full gali → delete + reply
    if (hasGali(body) && !admin) {
      api.unsendMessage(messageID, () => {});

      api.sendMessage(
        {
          body: `😎 *RK RAJA TERA BAAP HAI* 🔥\n> @[${senderID}] gali mat de warna kick!`,
          mentions: [{ tag: "@user", id: senderID }],
        },
        threadID,
        messageID
      );
      return;
    }

    // Mild gali (rk/raja) → warning
    if (hasMildGali(body) && !admin) {
      api.sendMessage(
        {
          body: `⚠️ @[${senderID}] "raja" bolne se kuch nahi hoga — *RK RAJA hi tera baap hai* 😎🔥`,
          mentions: [{ tag: "@user", id: senderID }],
        },
        threadID
      );
    }
  }
}

// ================= COMMAND HANDLER =================
function handleCommand(api, event, cmd, body) {
  const { threadID, messageID, mentions } = event;
  const args = body.slice(CONFIG.PREFIX.length + cmd.length).trim();

  switch (cmd) {
    case "help":
      api.sendMessage(
        `╔══════════════════════════╗
   ❤️ *${CONFIG.BOT_NAME}* ❤️
╚══════════════════════════╝

*🔒 GROUP LOCKS*
 ${CONFIG.PREFIX}lockgc     → GC name lock
 ${CONFIG.PREFIX}unlockgc   → GC name unlock
 ${CONFIG.PREFIX}locknick   → sabke nick lock
 ${CONFIG.PREFIX}unlocknick → nick unlock
 ${CONFIG.PREFIX}lockpic    → group pic lock
 ${CONFIG.PREFIX}unlockpic  → pic unlock

*🔇 MODERATION*
 ${CONFIG.PREFIX}muteall    → sirf admin bol sakta
 ${CONFIG.PREFIX}unmuteall  → sab bol sakte
 ${CONFIG.PREFIX}antigali on/off

*👑 ADMIN*
 ${CONFIG.PREFIX}kick @user
 ${CONFIG.PREFIX}promote @user
 ${CONFIG.PREFIX}demote @user
 ${CONFIG.PREFIX}status

_Prefix: ${CONFIG.PREFIX} | Admin only_`,
        threadID,
        messageID
      );
      break;

    // ----- GC NAME -----
    case "lockgc":
      state.gcLocked = true;
      api.sendMessage(
        `🔒 GC name LOCKED ✅\nCurrent: *${state.gcOriginalName}*`,
        threadID,
        messageID
      );
      break;

    case "unlockgc":
      state.gcLocked = false;
      api.sendMessage("🔓 GC name UNLOCKED", threadID, messageID);
      break;

    // ----- NICKNAME -----
    case "locknick": {
      api.getThreadInfo(threadID, (err, info) => {
        if (!err && info.userInfo) {
          state.nickMap = {};
          info.userInfo.forEach((u) => {
            state.nickMap[u.id] = u.name;
          });
        }
        state.nickLocked = true;
        api.sendMessage(
          `🔒 *${Object.keys(state.nickMap).length}* members ke nick LOCKED ✅`,
          threadID,
          messageID
        );
      });
      break;
    }

    case "unlocknick":
      state.nickLocked = false;
      api.sendMessage("🔓 Nickname lock OFF", threadID, messageID);
      break;

    // ----- GROUP PIC -----
    case "lockpic":
      api.getThreadInfo(threadID, (err, info) => {
        if (!err && info.image) {
          state.picOriginalStream = info.image;
          state.picLocked = true;
          api.sendMessage("🔒 Group DP LOCKED ✅", threadID, messageID);
        } else {
          api.sendMessage("❌ Group pic nahi mili", threadID, messageID);
        }
      });
      break;

    case "unlockpic":
      state.picLocked = false;
      api.sendMessage("🔓 Group DP UNLOCKED", threadID, messageID);
      break;

    // ----- MUTE ALL -----
    case "muteall":
      state.muteAll = true;
      api.sendMessage(
        "🔇 *MUTE-ALL ON*\nAb sirf ADMIN bol sakta hai 😎",
        threadID,
        messageID
      );
      break;

    case "unmuteall":
      state.muteAll = false;
      api.sendMessage("🔊 MUTE-ALL OFF", threadID, messageID);
      break;

    // ----- ANTI GALI -----
    case "antigali":
      state.antiGali = args === "on";
      api.sendMessage(
        `🛡️ Anti-Gali: *${state.antiGali ? "ON" : "OFF"}*`,
        threadID,
        messageID
      );
      break;

    // ----- KICK -----
    case "kick": {
      const target = mentions && mentions[0] ? mentions[0].id : null;
      if (!target)
        return api.sendMessage(
          "❌ Kisko kick karna hai? @mention karo",
          threadID,
          messageID
        );
      api.removeUserFromGroup(target, threadID, (err) => {
        if (err)
          return api.sendMessage("❌ Kick failed: " + err, threadID, messageID);
        api.sendMessage("👢 User KICKED ✅", threadID, messageID);
      });
      break;
    }

    // ----- PROMOTE -----
    case "promote": {
      const target = mentions && mentions[0] ? mentions[0].id : null;
      if (!target)
        return api.sendMessage(
          "❌ @mention karo",
          threadID,
          messageID
        );
      api.changeAdminStatus(threadID, target, true, (err) => {
        if (err)
          return api.sendMessage(
            "❌ Promote failed: " + err,
            threadID,
            messageID
          );
        api.sendMessage("👑 User PROMOTED ✅", threadID, messageID);
      });
      break;
    }

    // ----- DEMOTE -----
    case "demote": {
      const target = mentions && mentions[0] ? mentions[0].id : null;
      if (!target)
        return api.sendMessage(
          "❌ @mention karo",
          threadID,
          messageID
        );
      api.changeAdminStatus(threadID, target, false, (err) => {
        if (err)
          return api.sendMessage(
            "❌ Demote failed: " + err,
            threadID,
            messageID
          );
        api.sendMessage("⬇️ User DEMOTED ✅", threadID, messageID);
      });
      break;
    }

    // ----- STATUS -----
    case "status":
      api.sendMessage(
        `📊 *BOT STATUS*\n
🔒 GC Lock: ${state.gcLocked ? "ON" : "OFF"}
🔒 Nick Lock: ${state.nickLocked ? "ON" : "OFF"}
🔒 Pic Lock: ${state.picLocked ? "ON" : "OFF"}
🔇 Mute-All: ${state.muteAll ? "ON" : "OFF"}
🛡️ Anti-Gali: ${state.antiGali ? "ON" : "OFF"}`,
        threadID,
        messageID
      );
      break;

    default:
      api.sendMessage(
        `❓ Unknown command. Type *${CONFIG.PREFIX}help*`,
        threadID,
        messageID
      );
  }
}

// ================= LOCK ENFORCER (auto reset) =================
function enforceLocks(api) {
  const threadID = CONFIG.GROUP_UID;

  // 1. GC NAME
  if (state.gcLocked && state.gcOriginalName) {
    api.getThreadInfo(threadID, (err, info) => {
      if (!err && info.threadName !== state.gcOriginalName) {
        api.setTitle(state.gcOriginalName, threadID, () => {
          api.sendMessage(
            "⚠️ GC name change detect — reset to original 🔒",
            threadID
          );
        });
      }
    });
  }

  // 2. NICKNAMES
  if (state.nickLocked) {
    api.getThreadInfo(threadID, (err, info) => {
      if (err || !info.userInfo) return;
      info.userInfo.forEach((user) => {
        const original = state.nickMap[user.id];
        if (original && user.name !== original) {
          api.changeNickname(original, threadID, user.id, () => {});
        }
      });
    });
  }

  // 3. GROUP PIC
  if (state.picLocked && state.picOriginalStream) {
    api.getThreadInfo(threadID, (err, info) => {
      if (!err && info.image !== state.picOriginalStream) {
        api.changeGroupImage(state.picOriginalStream, threadID, () => {
          api.sendMessage(
            "⚠️ Group DP change detect — reset 🔒",
            threadID
          );
        });
      }
    });
  }
}
