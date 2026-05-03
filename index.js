const { 
    makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion, 
    jidNormalizedUser 
} = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); 
const path = require('path');
const express = require('express');
const pino = require('pino');

// ============================================================================
// 🛡️ SYSTEM CONFIGURATION & ANTI-CRASH
// ============================================================================
process.setMaxListeners(100);

process.on('uncaughtException', (err) => {
    console.error('\n🚨 [VORTEX FATAL ERROR] Caught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n🚨 [VORTEX CRITICAL] Unhandled Rejection:', reason);
});

// ============================================================================
// 🌐 EXPRESS SERVER (FOR RAILWAY 24/7 UPTIME)
// ============================================================================
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;font-family:sans-serif;">🚀 VORTEX V57 PEAK ENGINE ACTIVE</h1>');
});

app.listen(port, () => {
    console.log(`\n☁️ [VORTEX SERVER] Active and listening on Port ${port}`);
});

// ============================================================================
// 🤖 TELEGRAM BOT SETUP & CONSTANTS
// ============================================================================
const TELEGRAM_TOKEN = '8569454590:AAFjwkNU2XktPWQPKOrEd8GF0tVjuubMof4'; 
const OWNER_ID = 5524906942; 
const OWNER_USERNAME = '@Naimish555';

const tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const activeClients = new Map();
let userStates = {};

let knownBotUsers = [];
const groupMetaCache = new Map();

const BOT_USERS_FILE = './bot_users.json';
const ADMIN_CONFIG_FILE = './admin_config.json';
const SESSIONS_DIR = path.join(__dirname, 'multi_sessions');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

if (fs.existsSync(BOT_USERS_FILE)) { 
    try { knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE));
    } 
    catch(e) {} 
}

let adminConfig = {
    testModeEnabled: false, 
    fsubEnabled: false, fsubChannels: [], 
    approvalRequired: false, botAlerts: true, 
    admins: [], allowedUsers: [], bannedUsers: [], revokedUsers: [], securityConfigs: {}, 
    featurePerms: { 
        login: ['owner','admin','user'], massadd: ['owner','admin','user'], creategroup: ['owner','admin','user'], 
        joingroup: ['owner','admin','user'], renamegroups: ['owner','admin','user'], extractlinks: ['owner','admin','user'], 
        approve: ['owner','admin','user'], pendinglist: ['owner','admin','user'], autokick: ['owner','admin','user'], broadcast: ['owner','admin','user'], 
        stats: ['owner','admin','user'], security: ['owner','admin'] 
    }
};

if (fs.existsSync(ADMIN_CONFIG_FILE)) { try { adminConfig = { ...adminConfig, ...JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE)) };
} catch(e) { } }
function saveAdminConfig() { try { fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(adminConfig, null, 4));
} catch (err) { } }

function getSecurityConfig(userId) {
    if (!adminConfig.securityConfigs[userId]) { 
        adminConfig.securityConfigs[userId] = { 
            enabled: false, ruleType: 'WHITELIST', countries: ['91'], vipNumbers: [], 
            autoKickEnabled: false, strikeCount: 3, violations: {}, targetMode: 'ALL', 
            targetGroups: [], stats: { deleted: 0, kicked: 0 } 
        };
    }
    return adminConfig.securityConfigs[userId];
}

function getState(userId) {
    if (!userStates[userId]) { 
        userStates[userId] = { 
            action: null, adminGroups: [], currentPage: 0, flowContext: '', selectedGroupsArray: [], 
            tempData: {}, language: 'Eɴɢʟɪsʜ', groupConfig: { baseName: '', count: 0, memberId: '', desc: '', pfpPath: null, settings: { msgsAdminOnly: false, infoAdminOnly: false } } 
        };
    }
    return userStates[userId];
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `\n${DIVIDER}\n👑 _VORTEX V57 PEAK_ | Oᴡɴᴇʀ: ${OWNER_USERNAME}`;

// ============================================================================
// 🌍 DEEP MULTI-LANGUAGE PACK
// ============================================================================
const texts = {
    'Eɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Rᴇǫᴜɪʀᴇᴅ)", 
        login: "🔐 Lᴏɢɪɴ WA", massadd: "👥 Mᴀss Aᴅᴅ (Sᴡᴀʀᴍ)", autoGroup: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", extract: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", pendingList: "📋 Pᴇɴᴅɪɴɢ Lɪsᴛ", kick: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", 
        broadcast: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", stats: "📊 Bᴏᴛ Sᴛᴀᴛs", shield: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", lang: "Lᴀɴɢᴜᴀɢᴇ",
        helpMsg: "📖 *AUTO DELETE HELP*\n\n1. *WHITELIST:* Only numbers starting with the allowed Country Codes (e.g. 91) can send messages.\n2. *BLACKLIST:* Messages from specified Country Codes will be deleted. Others allowed.\n3. *VIP NUMBERS:* Messages from these exact numbers will NEVER be deleted, bypassing all rules.",
        infoWh: "INFO: ONLY THE SPECIFIED COUNTRY CODES CAN SEND MESSAGES. ALL OTHERS WILL BE DELETED!",
        infoBl: "INFO: MESSAGES FROM THE SPECIFIED COUNTRY CODES WILL BE DELETED!"
    },
    'Hɪɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ Hᴀɪ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Kᴀʀᴏ)", 
        login: "🔐 WA Lᴏɢɪɴ Kᴀʀᴏ", massadd: "👥 Eᴋ Sᴀᴀᴛʜ Aᴅᴅ", autoGroup: "➕ Gʀᴏᴜᴘs Bᴀɴᴀᴏ", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Nᴀᴀᴍ Bᴀᴅʟᴏ", extract: "🔗 Lɪɴᴋs Nɪᴋᴀʟᴏ", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", pendingList: "📋 Pᴇɴᴅɪɴɢ Lɪsᴛ", kick: "⚔️ Aᴜᴛᴏ Nɪᴋᴀʟᴏ", 
        broadcast: "📢 Sᴀʙᴋᴏ Msɢ Bʜᴇᴊᴏ", stats: "📊 Bᴏᴛ Kɪ Sᴛᴀᴛs", shield: "🛡️ Aᴜᴛᴏ Msɢ Dᴇʟᴇᴛᴇ", lang: "Bʜᴀsʜᴀ",
        helpMsg: "📖 *AUTO DELETE HELP*\n\n1. *WHITELIST:* Sirf set kiye gaye code (jaise 91) wale log msg kar payenge.\n2. *BLACKLIST:* Set kiye gaye code wale logo ka msg delete hoga, baaki sabka aayega.\n3. *VIP NUMBERS:* In numbers ka msg kabhi delete nahi hoga chahe jo bhi rule ho.",
        infoWh: "INFO: SIRF WAHI DESH MSG KAR PAYENGE JO LIST ME HAIN. BAAKI SAB DELETE HONGE!",
        infoBl: "INFO: JO DESH LIST ME HAIN SIRF UNKE MSG DELETE HONGE!"
    },
    'Iɴᴅᴏɴᴇsɪᴀɴ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Tᴇʀʜᴜʙᴜɴɢ & Sɪᴀᴘ", statusOffline: "🔴 WA Tɪᴅᴀᴋ Tᴇʀʜᴜʙᴜɴɢ (Wᴀᴊɪʙ Lᴏɢɪɴ)", 
        login: "🔐 Mᴀsᴜᴋ WA", massadd: "👥 Tᴀᴍʙᴀʜ Mᴀssᴀʟ", autoGroup: "➕ Bᴜᴀᴛ Gʀᴜᴘ", join: "📥 Gᴀʙᴜɴɢ Oᴛᴏᴍᴀᴛɪs", 
        rename: "✏️ Uʙᴀʜ Nᴀᴍᴀ Gʀᴜᴘ", extract: "🔗 Aᴍʙɪʟ Tᴀᴜᴛᴀɴ", approve: "👥 Sᴇᴛᴜᴊᴜɪ Oᴛᴏᴍᴀᴛɪs", pendingList: "📋 Pᴇɴᴅɪɴɢ Lɪsᴛ", kick: "⚔️ Tᴇɴᴅᴀɴɢ Oᴛᴏᴍᴀᴛɪs", 
        broadcast: "📢 Sɪᴀʀᴀɴ", stats: "📊 Sᴛᴀᴛɪsᴛɪᴋ Bᴏᴛ", shield: "🛡️ Hᴀᴘᴜs Pᴇsᴀɴ Oᴛᴏ", lang: "Bᴀʜᴀsᴀ",
        helpMsg: "📖 *BANTUAN HAPUS OTOMATIS*\n\n1. *WHITELIST:* Hanya nomor dari Kode Negara yang diizinkan (misal 62) yang dapat mengirim pesan.\n2. *BLACKLIST:* Pesan dari Kode Negara yang ditentukan akan dihapus.\n3. *NOMOR VIP:* Pesan dari nomor-nomor ini TIDAK AKAN PERNAH dihapus, melewati semua aturan.",
        infoWh: "INFO: HANYA KODE NEGARA TERTENTU YANG DAPAT MENGIRIM PESAN. YANG LAIN AKAN DIHAPUS!",
        infoBl: "INFO: PESAN DARI KODE NEGARA YANG DITENTUKAN AKAN DIHAPUS!"
    }
};

// ============================================================================
// 💀 IDLE SESSION REAPER
// ============================================================================
const IDLE_THRESHOLD = 20 * 60 * 1000; 
setInterval(() => {
    const now = Date.now();
    activeClients.forEach((session, userId) => {
        if (session.isReady && (now - session.lastSeen > IDLE_THRESHOLD)) {
            if (session.client) { 
                try { session.client.ws.close(); session.client.ev.removeAllListeners(); } catch(e){}
            }
            activeClients.delete(userId);
            safeSend(userId, "⚠️ *System Alert:*\nYour WhatsApp session was hibernated to save Server RAM due to 20 mins of inactivity. It will automatically resume on your next command.");
        }
    });
}, 5 * 60 * 1000); 

function updateActivity(userId) {
    const session = activeClients.get(userId);
    if (session) { session.lastSeen = Date.now();
    } 
    else {
        const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
        if (fs.existsSync(sessionPath)) { safeSend(userId, "📡 *Resuming hibernated connection...*"); startBaileysClient(userId, userId);
        }
    }
}

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================
async function safeSend(chatId, text, options = {}) { try { return await tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
} catch (e) { return null; } }

function createProgressBar(current, total) {
    if (total === 0) return `[██████████] 100%`;
    const length = 10;
    const filled = Math.round((current / total) * length);
    const empty = Math.max(0, length - filled);
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round((current / total) * 100)}%`;
}

async function sendLongReport(chatId, text, filename, options = {}) { if (text.length > 3900) { const fp = path.join(__dirname, `${filename}_${chatId}.txt`);
fs.writeFileSync(fp, text); await tgBot.sendDocument(chatId, fp, { caption: `📄 *REPORT*\n${FOOTER}`, parse_mode: 'Markdown', ...options }); fs.unlinkSync(fp); } else { safeSend(chatId, text, options);
} }
function hasFeatureAccess(userId, featureKey) { let role = userId === OWNER_ID ? 'owner' : (adminConfig.admins.includes(userId) ? 'admin' : 'user');
return adminConfig.featurePerms[featureKey] && adminConfig.featurePerms[featureKey].includes(role); }

async function checkAccess(userId, chatId, msgObj = null) { 
    if (adminConfig.bannedUsers.includes(userId)) {
        safeSend(chatId, "🚫 *ACCESS DENIED*\nYou have been permanently banned from using this bot by the Administrator.");
        return false;
    }
    
    if (adminConfig.revokedUsers && adminConfig.revokedUsers.includes(userId)) { 
        safeSend(chatId, `🔒 *ACCESS REVOKED*\nAapka access manually hata diya gaya hai. Admin se phirse permission lein.`);
        return false; 
    }

    if (adminConfig.approvalRequired && userId !== OWNER_ID && !adminConfig.admins.includes(userId) && !adminConfig.allowedUsers.includes(userId)) {
        safeSend(chatId, "🔒 *PRIVATE BOT*\nThis bot is currently in Private Mode. You need approval from the Owner to use it.");
        return false;
    }

    if (adminConfig.fsubEnabled && adminConfig.fsubChannels.length > 0 && userId !== OWNER_ID) {
        let isSubscribed = true;
        let joinButtons = [];
        for (let ch of adminConfig.fsubChannels) {
            try {
                let chId = typeof ch === 'object' ? ch.id : ch;
                let chLink = typeof ch === 'object' ? ch.link : `https://t.me/${chId.replace('@', '')}`;
                
                const member = await tgBot.getChatMember(chId, userId);
                if (member.status === 'left' || member.status === 'kicked') {
                    isSubscribed = false;
                    joinButtons.push([{ text: `📢 Jᴏɪɴ Cʜᴀɴɴᴇʟ`, url: chLink }]);
                }
            } catch (e) {
                isSubscribed = false;
                let chLink = typeof ch === 'object' ? ch.link : `https://t.me/${(typeof ch === 'object' ? ch.id : ch).replace('@', '')}`;
                joinButtons.push([{ text: `📢 Jᴏɪɴ Cʜᴀɴɴᴇʟ`, url: chLink }]);
            } 
        }
        if (!isSubscribed) { 
            safeSend(chatId, `⚠️ *ACCESS DENIED*\n\nPʟᴇᴀsᴇ ᴊᴏɪɴ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟs ᴛᴏ ᴜsᴇ VORTEX!`, { reply_markup: { inline_keyboard: joinButtons } });
            return false; 
        }
    }

    if (!knownBotUsers.includes(userId)) { 
        knownBotUsers.push(userId);
        try { fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(knownBotUsers)); } catch(e) {} 
        if (adminConfig.botAlerts && msgObj) {
            const userName = msgObj.from?.first_name || 'Unknown';
            safeSend(OWNER_ID, `🚨 *NEW USER DETECTED*\n${DIVIDER}\n👤 *Nᴀᴍᴇ:* ${userName}\n🆔 *ID:* \`${userId}\`\n${FOOTER}`);
        } else if (adminConfig.botAlerts) {
            safeSend(OWNER_ID, `🔔 *NEW USER ALERT*\nID: ${userId} just started the bot.`);
        }
    } 
    return true; 
}

// ============================================================================
// 🚀 BAILEYS CORE ENGINE WITH WATCHDOG & ALERTS
// ============================================================================
async function startBaileysClient(userId, chatId, cleanNumber = null) {
    const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    if(chatId) safeSend(chatId, `📡 *Booting Vortex Engine...*`);
    const client = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: pino({ level: 'silent' }), browser: ['Ubuntu', 'Chrome', '120.0.0.0'], syncFullHistory: false, generateHighQualityLinkPreview: false });
    activeClients.set(userId, { client: client, status: 'initializing', isReady: false, lastSeen: Date.now() });
    client.ev.on('creds.update', saveCreds);

    let watchdog = setTimeout(() => {
        const cur = activeClients.get(userId);
        if (cur && !cur.isReady) {
            if(chatId) safeSend(chatId, `❌ *TIMEOUT:*\nMᴇᴛᴀ API ɪs ɴᴏᴛ ʀᴇsᴘᴏɴᴅɪɴɢ. Pʀᴏᴄᴇss ᴋɪʟʟᴇᴅ ᴛᴏ sᴀᴠᴇ RAM. Pʟᴇᴀsᴇ ᴛʀʏ ᴀɢᴀɪɴ.`);
            activeClients.delete(userId);
            try { client.ws.close(); client.ev.removeAllListeners(); } catch(e){}
            if (fs.existsSync(sessionPath)) { try { fs.rmSync(sessionPath, { recursive: true, force: true }); } catch(e){} }
        }
    }, 60000);

    let pairingCodeRequested = false;
    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && chatId) {
            if (cleanNumber) {
                if (!pairingCodeRequested) {
                    pairingCodeRequested = true; 
                    setTimeout(async () => {
                        try { const code = await client.requestPairingCode(cleanNumber); const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code; safeSend(userId, `🔑 *PAIRING CODE:*\n\n\`${formattedCode}\`\n\n1️⃣ Open WhatsApp > Linked Devices > Link with number\n2️⃣ Enter code.`); } 
                        catch(e) { safeSend(userId, `❌ Pairing failed: ${e.message}`); pairingCodeRequested = false; }
                    }, 3000);
                }
            } else {
                if (!pairingCodeRequested) { pairingCodeRequested = true; tgBot.sendPhoto(userId, `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`, { caption: `📷 *PAIR QR CODE*\nScan to connect.` });
                }
            }
        }
        if (connection === 'open') {
            clearTimeout(watchdog);
            const cs = activeClients.get(userId);
            if (cs) { cs.isReady = true; cs.status = 'connected'; cs.lastSeen = Date.now();
            }
            await safeSend(userId, `✅ *AUTHENTICATION SUCCESSFUL*\nVortex Engine is Live & Connected!`);
            sendMainMenu(userId, userId); 
        }
        if (connection === 'close') {
            clearTimeout(watchdog);
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                if (statusCode === DisconnectReason.restartRequired) {
                    try { client.ws.close(); client.ev.removeAllListeners(); } catch(e){}
                    startBaileysClient(userId, null);
                }
                else { activeClients.delete(userId); safeSend(userId, `⚠️ *Timeout/Blocked:* Server rejected connection. Try 'Login WA' again.`);
                }
            } else { activeClients.delete(userId);
                if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true }); safeSend(userId, `🚨 *WA DISCONNECTED*\nSession Wiped completely.`);
            }
        }
    });
    client.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]; if (!msg.message || msg.key.fromMe) return;
        const sec = getSecurityConfig(userId); if (!sec.enabled) return;
        const remoteJid = msg.key.remoteJid; if (!remoteJid.endsWith('@g.us')) return; 
        if (sec.targetMode !== 'ALL' && !sec.targetGroups.includes(remoteJid)) return;
        const participant = msg.key.participant || remoteJid; const authorNum = participant.split('@')[0];
        if (sec.vipNumbers.includes(authorNum)) return; 

        let shouldDelete = false; let matchedCode = sec.countries.find(c => authorNum.startsWith(c));
        if (sec.ruleType === 'WHITELIST') { if (sec.countries.length > 0 && !matchedCode) shouldDelete = true; } 
        else if (sec.ruleType === 'BLACKLIST') { if (matchedCode) shouldDelete = true; }
        if (!shouldDelete) return;

        try {
            let groupMetadata = groupMetaCache.get(remoteJid);
            if (!groupMetadata) {
                try {
                    groupMetadata = await client.groupMetadata(remoteJid);
                    groupMetaCache.set(remoteJid, groupMetadata);
                    setTimeout(() => groupMetaCache.delete(remoteJid), 5 * 60 * 1000); 
                } catch(e) { return; }
            }

            const botJid = jidNormalizedUser(client.user.id);
            if (!groupMetadata.participants.find(p => p.id === botJid)?.admin) return;
            if (groupMetadata.participants.find(p => p.id === participant)?.admin) return;

            await client.sendMessage(remoteJid, { delete: msg.key });
            
            let msgContent = msg.message.conversation || msg.message.extendedTextMessage?.text || '[MEDIA / STICKER]';

            sec.stats.deleted += 1; sec.violations[participant] = (sec.violations[participant] || 0) + 1; saveAdminConfig();
            const strikes = sec.violations[participant];
            if (strikes >= sec.strikeCount && sec.autoKickEnabled) {
                await client.groupParticipantsUpdate(remoteJid, [participant], 'remove');
                sec.stats.kicked += 1; sec.violations[participant] = 0; saveAdminConfig();
                safeSend(OWNER_ID, `⚔️ *AUTO KICK EXECUTED*\n🎯 Group: ${groupMetadata.subject}\n💀 Target: +${authorNum}\n⚠️ Reason: ${strikes} Strikes Reached.`);
            } else {
                let sWarn = sec.autoKickEnabled ? `⚠️ Strike: ${strikes}/${sec.strikeCount}` : `⚠️ Strike: ${strikes} (Auto-Kick OFF)`;
                safeSend(OWNER_ID, `🛡️ *VORTEX ALERT: MESSAGE INTERCEPTED*\n${DIVIDER}\n🎯 Group: ${groupMetadata.subject}\n👤 Sender: +${authorNum}\n📄 Msg: _"${msgContent}"_\n${sWarn}\n💥 Action: Instantly Deleted`);
            }
        } catch(e) {}
    });
}
if (fs.existsSync(SESSIONS_DIR)) { fs.readdirSync(SESSIONS_DIR).forEach(dir => { if (dir.startsWith('session_')) { const uid = dir.split('session_')[1]; startBaileysClient(uid, null); } });
}

// ============================================================================
// 📱 PREMIUM UI RENDERING FUNCTIONS (DEEP NESTED MENUS)
// ============================================================================
function sendMainMenu(chatId, userId) {
    const state = getState(userId);
    state.action = null; 
    const isReady = activeClients.get(userId)?.isReady; const t = texts[state.language] || texts['Eɴɢʟɪsʜ']; 
    let kb = [];
    if (!isReady && hasFeatureAccess(userId, 'login')) kb.push([{ text: t.login, callback_data: 'menu_login' }]);
    else if (isReady) kb.push([{ text: `🔓 Lᴏɢᴏᴜᴛ`, callback_data: 'menu_logout_confirm' }]);
    if (hasFeatureAccess(userId, 'massadd')) kb.push([{ text: t.massadd, callback_data: 'menu_mass_add' }]);
    let r1 = []; if (hasFeatureAccess(userId, 'creategroup')) r1.push({ text: t.autoGroup, callback_data: 'menu_creategroup' });
    if (hasFeatureAccess(userId, 'joingroup')) r1.push({ text: t.join, callback_data: 'menu_joingroup' }); if (r1.length > 0) kb.push(r1);
    let r2 = [];
    if (hasFeatureAccess(userId, 'renamegroups')) r2.push({ text: t.rename, callback_data: 'menu_rename_groups' }); if (hasFeatureAccess(userId, 'extractlinks')) r2.push({ text: t.extract, callback_data: 'menu_extractlinks' });
    if (r2.length > 0) kb.push(r2);
    let r3 = []; if (hasFeatureAccess(userId, 'approve')) r3.push({ text: t.approve, callback_data: 'menu_approve' });
    if (hasFeatureAccess(userId, 'autokick')) r3.push({ text: t.kick, callback_data: 'menu_autokick' }); if (r3.length > 0) kb.push(r3);
    let r4 = [];
    if (hasFeatureAccess(userId, 'broadcast')) r4.push({ text: t.broadcast, callback_data: 'menu_broadcast' }); if (hasFeatureAccess(userId, 'stats')) r4.push({ text: t.stats, callback_data: 'menu_stats' });
    if (r4.length > 0) kb.push(r4);
    
    let r5 = [];
    if (hasFeatureAccess(userId, 'pendinglist')) r5.push({ text: t.pendingList, callback_data: 'menu_pending_list' });
    if (r5.length > 0) kb.push(r5);
    
    if (hasFeatureAccess(userId, 'security')) kb.push([{ text: t.shield, callback_data: 'menu_security' }]);
    kb.push([{ text: `🌐 ${t.lang}: ${state.language}`, callback_data: 'menu_toggle_lang' }]); 
    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) kb.push([{ text: `👑 SYSTEM ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    const humanStatus = isReady ? t.statusOnline : (adminConfig.testModeEnabled ? "🟡 Oғғʟɪɴᴇ [TEST MODE]" : t.statusOffline);
    safeSend(chatId, `${t.menuTitle} \n${DIVIDER}\n${t.statusLabel}: ${humanStatus}\n\n_System running at Peak Capacity_${FOOTER}`, { reply_markup: { inline_keyboard: kb } });
}

function sendShieldMenu(chatId, userId, messageId = null) {
    const sec = getSecurityConfig(userId); const state = getState(userId);
    state.action = null;
    const t = texts[state.language] || texts['Eɴɢʟɪsʜ'];
    const powerStr = sec.enabled ? '🟢 ONLINE' : '🔴 OFFLINE';
    const scopeStr = sec.targetMode === 'ALL' ? '🌐 ALL GROUPS' : (sec.targetMode === 'LINKS' ? `🔗 VIA LINKS (${sec.targetGroups.length})` : `🎯 SELECTED (${sec.targetGroups.length})`);
    const ruleStr = sec.ruleType === 'WHITELIST' ? '🟢 ALLOW ONLY (WHITELIST)' : '🔴 BLOCK ONLY (BLACKLIST)';
    const kickStr = sec.autoKickEnabled ? '⏸️ ON' : '⏸️ OFF';
    const infoStr = sec.ruleType === 'WHITELIST' ? t.infoWh : t.infoBl;
    const text = `🛡️ *AUTO DELETE GC MSG*\n${DIVIDER}\n*MASTER POWER:* ${powerStr}\n*TARGET SCOPE:* ${scopeStr}\n*RULES MODE:* ${ruleStr}\n*AUTO-KICK (3 STRIKES):* ${kickStr}\n\nℹ️ *${infoStr}*\n\n🌐 *CODES:* ${sec.countries.length ?
    sec.countries.join(', ') : 'None'}\n👑 *VIP NUMBERS:* ${sec.vipNumbers.length ? sec.vipNumbers.join(', ') : 'None'}`;
    const kb = [
        [{text: `🛡️ SYSTEM POWER: TURN ${sec.enabled ? 'OFF' : 'ON'}`, callback_data: 'sec_toggle_shield'}],
        [{text: `🎯 TARGET SCOPE: ${sec.targetMode}`, callback_data: 'sec_menu_targets'}],
        [{text: `🔄 SWITCH TO ${sec.ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST'}`, callback_data: 'sec_set_rule'}],
        [{text: `⚡ AUTO-KICK: ${sec.autoKickEnabled ? '🟢 ON' : '🔴 OFF'}`, callback_data: 'sec_toggle_kick'}],
        [{text: '➕ ADD CODE (+91)', callback_data: 'sec_add_code'}, {text: '➖ REMOVE CODE', callback_data: 'sec_remove_code'}],
        [{text: '👑 ADD VIP NUMBER', callback_data: 'sec_add_vip'}, {text: '➖ REMOVE VIP', callback_data: 'sec_remove_vip'}],
        [{text: '📖 YE KAISE KAAM KARTA HAI?', callback_data: 'sec_help'}],
        [{text: '🔙 BACK TO MENU', callback_data: 'btn_main_menu'}]
    ];
    if (messageId) tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
    else safeSend(chatId, text, {reply_markup: {inline_keyboard: kb}});
}

function sendGroupSettingsMenu(chatId, userId, msgId) {
    const state = getState(userId);
    const kb = { inline_keyboard: [ [{ text: `🔒 Admin Only Msg: ${state.groupConfig.settings.msgsAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_msgsAdminOnly' }], [{ text: `✏️ Admin Only Edit: ${state.groupConfig.settings.infoAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_infoAdminOnly' }], [{ text: `🚀 LAUNCH DEPLOYMENT`, callback_data: 'grp_deploy_now' }], [{ text: `❌ Cancel`, callback_data: 'btn_main_menu' }] ] };
    if (msgId) tgBot.editMessageText(`⚙️ *Phase 6: Permissions*`, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{});
    else safeSend(chatId, `⚙️ *Phase 6: Permissions*`, { reply_markup: kb });
}

function sendAdminPanel(chatId, userId, messageId = null) {
    getState(userId).action = null;
    let text = `👑 *SYSTEM ADMIN PANEL*\n${DIVIDER}\n*👥 Total Users:* ${knownBotUsers.length}\n\n*⚙️ BOT MODES & SECURITY:*\n*Test Mode:* ${adminConfig.testModeEnabled ? '🟡 ACTIVE' : '🔴 DISABLED'}\n*Bot Access:* ${adminConfig.approvalRequired ? '🔒 PRIVATE' : '🌍 PUBLIC'}\n*Bot Alerts:* ${adminConfig.botAlerts ? '🟢 ON' : '🔴 OFF'}`;
    
    let kb = [ 
        [{text: '✅ Allow User', callback_data: 'admin_allow_user'}, {text: '❌ Revoke', callback_data: 'admin_revoke_user'}],
        [{text: `🛡️ Manage Admins (${adminConfig.admins.length})`, callback_data: 'admin_manage_admins'}],
        [{text: `🚫 Manage Bans (${adminConfig.bannedUsers.length})`, callback_data: 'admin_manage_bans'}],
        [{text: `📢 Manage Force Sub (${adminConfig.fsubChannels.length})`, callback_data: 'admin_manage_fsub'}],
        [{text: `🔒 BOT MODE: ${adminConfig.approvalRequired ? 'PRIVATE' : 'PUBLIC'}`, callback_data: 'admin_toggle_botmode'}],
        [{text: `🔔 NEW USER ALERTS: ${adminConfig.botAlerts ? '🟢 ON' : '🔴 OFF'}`, callback_data: 'admin_toggle_alerts'}],
        [{text: '📢 BOT BROADCAST', callback_data: 'admin_broadcast'}],
        [{text: '⚙️ FEATURE PERMISSIONS', callback_data: 'admin_feature_permissions'}]
    ];
    if (userId === OWNER_ID) kb.push([{text: `🛠️ TEST MODE: ${adminConfig.testModeEnabled ? 'TURN OFF' : 'TURN ON'}`, callback_data: 'admin_toggle_testmode'}]);
    kb.push([{text: '🔙 BACK TO MENU', callback_data: 'btn_main_menu'}]);
    
    if (messageId) tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
    else safeSend(chatId, text, {reply_markup: {inline_keyboard: kb}});
}

function sendManageAdminsMenu(chatId, messageId) {
    const adminList = adminConfig.admins.length ?
    adminConfig.admins.join('\n• ') : 'No additional admins.';
    const text = `🛡️ *MANAGE ADMINS*\n${DIVIDER}\n*Current Admins:*\n• ${OWNER_ID} (OWNER)\n• ${adminList}`;
    const kb = [[{text: '➕ Add Admin', callback_data: 'admin_add'}, {text: '➖ Remove Admin', callback_data: 'admin_remove'}], [{text: '🔙 Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function sendManageBansMenu(chatId, messageId) {
    const banList = adminConfig.bannedUsers.length ? adminConfig.bannedUsers.join('\n• ') : 'No banned users.';
    const text = `🚫 *MANAGE BANS*\n${DIVIDER}\n*Banned IDs:*\n• ${banList}`;
    const kb = [[{text: '🚫 Ban User', callback_data: 'admin_ban'}, {text: '✅ Unban User', callback_data: 'admin_unban'}], [{text: '🔙 Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function sendManageFSubMenu(chatId, messageId) {
    const fsubList = adminConfig.fsubChannels.length ? adminConfig.fsubChannels.map(c => typeof c === 'object' ? c.id : c).join('\n• ') : 'No channels set.';
    const text = `📢 *MANAGE FORCE SUB*\n${DIVIDER}\n*Status:* ${adminConfig.fsubEnabled ? '🟢 ON' : '🔴 OFF'}\n*Required Channels:*\n• ${fsubList}`;
    const kb = [[{text: `Turn FSub ${adminConfig.fsubEnabled ? 'OFF' : 'ON'}`, callback_data: 'admin_toggle_fsub'}], [{text: '➕ Add Channel', callback_data: 'admin_fsub_add'}, {text: '➖ Remove Channel', callback_data: 'admin_fsub_remove'}], [{text: '🔙 Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function updatePaginationMessage(chatId, messageId, userId) {
    const state = getState(userId);
    const selCount = state.selectedGroupsArray === 'ALL' ?
    state.adminGroups.length : state.selectedGroupsArray.length;
    const text = `🎯 *SELECT TARGET GROUPS:*\n${DIVIDER}\n✅ *Selected:* ${selCount} / *Total:* ${state.adminGroups.length}`;
    tgBot.editMessageText(text, { chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) }).catch(()=>{});
}

// ============================================================================
// 📡 TELEGRAM COMMAND LISTENERS
// ============================================================================
tgBot.onText(/\/start/, async (msg) => { 
    const userId = msg.from.id; updateActivity(userId); if (await checkAccess(userId, msg.chat.id, msg)) sendMainMenu(msg.chat.id, userId);
});

tgBot.onText(/\/admin/, async (msg) => { 
    const userId = msg.from.id; updateActivity(userId); 
    if (await checkAccess(userId, msg.chat.id, msg)) {
        if (userId === OWNER_ID || adminConfig.admins.includes(userId)) sendAdminPanel(msg.chat.id, userId);
    }
});

tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; const userId = query.from.id; const data = query.data; const state = getState(userId); const uClient = activeClients.get(userId)?.client; 
    tgBot.answerCallbackQuery(query.id).catch(()=>{}); updateActivity(userId);
    if (!(await checkAccess(userId, chatId, query))) return;

    if (data === 'btn_main_menu') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return sendMainMenu(chatId, userId); }
    if (data === 'menu_toggle_lang') { 
        if (state.language === 'Eɴɢʟɪsʜ') state.language = 'Hɪɴɢʟɪsʜ'; else if (state.language === 'Hɪɴɢʟɪsʜ') state.language = 'Iɴᴅᴏɴᴇsɪᴀɴ'; else state.language = 'Eɴɢʟɪsʜ';
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return sendMainMenu(chatId, userId);
    }

    // --- ADMIN PANEL UX ---
    if (data === 'btn_admin_panel') return sendAdminPanel(chatId, userId, query.message.message_id);
    if (data === 'admin_toggle_testmode' && userId === OWNER_ID) { adminConfig.testModeEnabled = !adminConfig.testModeEnabled;
        saveAdminConfig(); return sendAdminPanel(chatId, userId, query.message.message_id); }
    if (data === 'admin_toggle_botmode') { adminConfig.approvalRequired = !adminConfig.approvalRequired; saveAdminConfig();
        return sendAdminPanel(chatId, userId, query.message.message_id); }
    if (data === 'admin_toggle_alerts') { adminConfig.botAlerts = !adminConfig.botAlerts; saveAdminConfig();
        return sendAdminPanel(chatId, userId, query.message.message_id); }
    if (data === 'admin_broadcast') { state.action = 'WAIT_ADMIN_BROADCAST';
        return safeSend(chatId, `📢 *BOT BROADCAST*\n${DIVIDER}\nSend the message you want to broadcast to ALL Bot Users:`);
    }

    // --- ALLOW/REVOKE UI ---
    if (data === 'admin_allow_user') { state.action = 'WAITING_FOR_ALLOW_ID';
        return tgBot.editMessageText(`✅ *ALLOW USER*\nProvide User ID to allow access:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_admin_panel'}]] } });
    }
    if (data === 'admin_revoke_user') { state.action = 'WAITING_FOR_REVOKE_ID';
        return tgBot.editMessageText(`❌ *REVOKE USER*\nProvide User ID to revoke access:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_admin_panel'}]] } });
    }

    // --- FEATURE PERMISSIONS UI ---
    if (data === 'admin_feature_permissions') {
        const kb = { inline_keyboard: [
            [{ text: '🔐 Login Auth', callback_data: 'perm_feat_login' }], [{ text: '👥 Mass Add', callback_data: 'perm_feat_massadd' }, { text: '➕ Create Group', callback_data: 'perm_feat_creategroup' }],
            [{ text: '📥 Join Group', callback_data: 'perm_feat_joingroup' }, { text: '✏️ Rename Groups', callback_data: 'perm_feat_renamegroups' }],
            [{ text: '🔗 Extract Links', callback_data: 'perm_feat_extractlinks' }, { text: '👥 Auto Approve', callback_data: 'perm_feat_approve' }],
            [{ text: '📋 Pending List', callback_data: 'perm_feat_pendinglist' }, { text: '⚔️ Auto Kick', callback_data: 'perm_feat_autokick' }],
            [{ text: '📢 Broadcast', callback_data: 'perm_feat_broadcast' }, { text: '📊 Stats', callback_data: 'perm_feat_stats' }],
            [{ text: '🛡️ Shield (Security)', callback_data: 'perm_feat_security' }],
            [{ text: '🔙 Back to Admin Panel', callback_data: 'btn_admin_panel' }]
        ]};
        return tgBot.editMessageText(`⚙️ *FEATURE ACCESS CONTROL*\nSelect feature to configure permissions:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }

    if (data.startsWith('perm_feat_')) {
        if (userId !== OWNER_ID) return tgBot.answerCallbackQuery(query.id, { text: '⚠️ Owner Only!', show_alert: true });
        const featKey = data.split('perm_feat_')[1]; const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [ 
            [{ text: `👑 Owner: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }], 
            [{ text: `🛡️ Admin: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }], 
            [{ text: `👤 User: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }], 
            [{ text: '🔙 Back', callback_data: 'admin_feature_permissions' }] 
        ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }
    
    if (data.startsWith('perm_tgl_')) {
        if (userId !== OWNER_ID) return;
        const parts = data.split('_'); const featKey = parts[2], roleKey = parts[3];
        if (adminConfig.featurePerms[featKey].includes(roleKey)) adminConfig.featurePerms[featKey] = adminConfig.featurePerms[featKey].filter(r => r !== roleKey);
        else adminConfig.featurePerms[featKey].push(roleKey);
        saveAdminConfig(); const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [ 
            [{ text: `👑 Owner: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }], 
            [{ text: `🛡️ Admin: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }], 
            [{ text: `👤 User: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }], 
            [{ text: '🔙 Back', callback_data: 'admin_feature_permissions' }] 
        ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }
    
    // Manage Admins
    if (data === 'admin_manage_admins') return sendManageAdminsMenu(chatId, query.message.message_id);
    if (data === 'admin_add') { state.action = 'WAIT_ADMIN_ADD'; return safeSend(chatId, `👤 *ADD ADMIN*\n${DIVIDER}\nSend Telegram User ID:`);
    }
    if (data === 'admin_remove') { state.action = 'WAIT_ADMIN_REMOVE'; return safeSend(chatId, `👤 *REMOVE ADMIN*\n${DIVIDER}\nSend Telegram User ID:`);
    }
    
    // Manage Bans
    if (data === 'admin_manage_bans') return sendManageBansMenu(chatId, query.message.message_id);
    if (data === 'admin_ban') { state.action = 'WAIT_ADMIN_BAN'; return safeSend(chatId, `🚫 *BAN USER*\n${DIVIDER}\nSend Telegram User ID to permanently Ban:`);
    }
    if (data === 'admin_unban') { state.action = 'WAIT_ADMIN_UNBAN';
        return safeSend(chatId, `✅ *UNBAN USER*\n${DIVIDER}\nSend Telegram User ID to Unban:`);
    }

    // Manage Force Sub
    if (data === 'admin_manage_fsub') return sendManageFSubMenu(chatId, query.message.message_id);
    if (data === 'admin_toggle_fsub') { adminConfig.fsubEnabled = !adminConfig.fsubEnabled; saveAdminConfig(); return sendManageFSubMenu(chatId, query.message.message_id);
    }
    if (data === 'admin_fsub_add') { state.action = 'WAIT_ADMIN_FSUB_ADD';
        return safeSend(chatId, `📢 *ADD FSUB CHANNEL*\n${DIVIDER}\nFormat:\n\`@ChannelID https://link.com\``, { parse_mode: 'Markdown' });
    }
    if (data === 'admin_fsub_remove') { state.action = 'WAIT_ADMIN_FSUB_REMOVE';
        return safeSend(chatId, `📢 *REMOVE FSUB CHANNEL*\n${DIVIDER}\nSend Channel ID or Username to remove:`);
    }

    // --- SHIELD MENU UX ---
    if (data === 'menu_security') return sendShieldMenu(chatId, userId, query.message.message_id);
    
    if (data === 'sec_menu_targets') {
        const kb = { inline_keyboard: [[{ text: `🌐 APPLY TO ALL GROUPS`, callback_data: 'sec_tgt_all' }], [{ text: `🎯 SELECT FROM LIST`, callback_data: 'sec_tgt_select' }], [{ text: `🔗 APPLY VIA LINKS`, callback_data: 'sec_tgt_links' }], [{ text: `🔙 Back`, callback_data: 'menu_security' }]] };
        return tgBot.editMessageText(`🎯 *TARGET SELECTION*\nSelect how you want to apply Shield:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }
    
    if (data === 'sec_tgt_all') { getSecurityConfig(userId).targetMode = 'ALL'; getSecurityConfig(userId).targetGroups = []; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
    if (data === 'sec_tgt_links') { state.action = 'WAIT_SEC_LINKS';
        return tgBot.editMessageText(`🔗 *SETUP VIA LINKS*\nPlease send group invite links:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'menu_security'}]] } });
    }
    
    if (data === 'sec_tgt_select') {
        if (!uClient && !adminConfig.testModeEnabled) return safeSend(chatId, "⚠️ System offline. Please authenticate.");
        let statusMsg = await safeSend(chatId, "📡 *Scanning privileges...*");
        try {
            if (adminConfig.testModeEnabled && !uClient) {
                state.adminGroups = [ { id: '111@g.us', name: '🧪 Test Group Alpha' }, { id: '222@g.us', name: '🧪 Test Group Beta' } ];
            } else {
                const groups = await uClient.groupFetchAllParticipating();
                state.adminGroups = Object.values(groups).filter(g => g.participants.find(p => p.id === jidNormalizedUser(uClient.user.id))?.admin).map(g => ({ id: g.id, name: g.subject }));
            }
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            if (state.adminGroups.length === 0) return safeSend(chatId, "❌ Admin rights not found.");
            state.currentPage = 0; state.selectedGroupsArray = [...getSecurityConfig(userId).targetGroups]; state.flowContext = 'SECURITY'; state.action = 'WAIT_SEC_TARGETS';
            return tgBot.editMessageText('🎯 *SELECT TARGETS:*', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) {}
    }

    if (['sec_toggle_shield', 'sec_set_rule', 'sec_toggle_kick'].includes(data)) {
        const sec = getSecurityConfig(userId);
        if (data === 'sec_toggle_shield') sec.enabled = !sec.enabled;
        if (data === 'sec_set_rule') sec.ruleType = sec.ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST';
        if (data === 'sec_toggle_kick') sec.autoKickEnabled = !sec.autoKickEnabled;
        saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id);
    }
    if (data === 'sec_add_code') { state.action = 'WAIT_SEC_ADD_CODE';
        return safeSend(chatId, `🌍 *ADD COUNTRY CODE*\n${DIVIDER}\nSend Country Code (eg. 91):`);
    }
    if (data === 'sec_remove_code') { state.action = 'WAIT_SEC_REMOVE_CODE';
        return safeSend(chatId, `🌍 *REMOVE COUNTRY CODE*\n${DIVIDER}\nSend Country Code (eg. 91):`);
    }
    if (data === 'sec_add_vip') { state.action = 'WAIT_SEC_ADD_VIP';
        return safeSend(chatId, `👑 *ADD VIP NUMBER*\n${DIVIDER}\nSend VIP Number (eg. 919876543210):`);
    }
    if (data === 'sec_remove_vip') { state.action = 'WAIT_SEC_REMOVE_VIP';
        return safeSend(chatId, `👑 *REMOVE VIP NUMBER*\n${DIVIDER}\nSend VIP Number (eg. 919876543210):`);
    }
    if (data === 'sec_help') { const t = texts[state.language] || texts['Eɴɢʟɪsʜ']; return safeSend(chatId, t.helpMsg);
    }

    if (data === 'menu_stats') { const sec = getSecurityConfig(userId); const activeSess = activeClients.has(userId) ?
        'Yes 🟢' : 'No 🔴'; return safeSend(chatId, `📊 *VORTEX STATS*\n${DIVIDER}\n🛡️ Spam Msgs Deleted: ${sec.stats.deleted}\n⚔️ Users Auto-Kicked: ${sec.stats.kicked}\n🔌 Session Active: ${activeSess}`);
    }

    if (data === 'menu_login') return tgBot.editMessageText(`📱 *CONNECT WHATSAPP*\n${DIVIDER}\nChoose Authentication Method:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔑 Pᴀɪʀ Cᴏᴅᴇ', callback_data: 'login_pair_code' }, { text: '📷 Pᴀɪʀ QR', callback_data: 'login_pair_qr' }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_main_menu' }]] } });
    if (data === 'login_pair_code') { state.action = 'WAITING_FOR_LOGIN_NUMBER'; return safeSend(chatId, `🔑 *PAIR CODE CONNECTION*\n${DIVIDER}\nEnter Target Phone Number with Country Code (eg. 919999999999):`);
    }
    if (data === 'login_pair_qr') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startBaileysClient(userId, chatId, null);
    }
    if (data === 'menu_logout_confirm') return tgBot.editMessageText(`⚠️ *WIPE SESSION?*\n${DIVIDER}\nThis will permanently log you out.`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [ [{ text: '✔️ Yes, Wipe Data', callback_data: 'menu_logout_execute' }], [{ text: '❌ Cancel', callback_data: 'btn_main_menu' }] ] }});
    if (data === 'menu_logout_execute') { if (uClient) uClient.logout(); const p = path.join(SESSIONS_DIR, `session_${userId}`);
        if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); activeClients.delete(userId); return sendMainMenu(chatId, userId);
    }
    
    if (data === 'menu_mass_add') { state.action = 'WAIT_VCF_AND_LINK';
        return tgBot.editMessageText(`➕ *SWARM MASS ADD ENGINE*\n${DIVIDER}\nSend the Group Link in the caption and attach the VCF file.`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_main_menu'}]] } });
    }
    if (data.startsWith('start_mission_')) { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return executeLiveParallelEngine(chatId, userId, uClient, data.replace('start_mission_', ''));
    }

    const menus = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast', 'menu_pending_list'];
    if (menus.includes(data)) {
        if (!uClient && !adminConfig.testModeEnabled) return safeSend(chatId, `⚠️ *System Offline*\n${DIVIDER}\nPlease connect WhatsApp first.`);
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return safeSend(chatId, `➕ *CREATE GROUPS [Phase 1]*\n${DIVIDER}\nEnter Group Base Name:`);
        }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS';
            return safeSend(chatId, `📥 *AUTO-JOIN*\n${DIVIDER}\nEnter Group Links (Multiple allowed):`); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA';
            return safeSend(chatId, `✏️ *RENAMER*\n${DIVIDER}\nEnter Format:\nLink\nNew Name`); }
        if (data === 'menu_broadcast') { state.action = 'WAIT_BROADCAST_MSG';
            return safeSend(chatId, `📢 *BROADCAST ENGINE*\n${DIVIDER}\nSend the message (Text, Image, Video, or Document) you want to broadcast:`);
        }
        
        let statusMsg = await safeSend(chatId, "📡 *Scanning WhatsApp Server for Admin Groups...*");
        try {
            if (adminConfig.testModeEnabled && !uClient) {
                state.adminGroups = [ { id: '111@g.us', name: '🧪 Test Group Alpha' }, { id: '222@g.us', name: '🧪 Test Group Beta' }, { id: '333@g.us', name: '🧪 Test Group Gamma' }, { id: '444@g.us', name: '🧪 Test Group Delta' } ];
            } else {
                const groups = await uClient.groupFetchAllParticipating();
                state.adminGroups = Object.values(groups).filter(g => g.participants.find(p => p.id === jidNormalizedUser(uClient.user.id))?.admin).map(g => ({ id: g.id, name: g.subject }));
            }
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            if (state.adminGroups.length === 0) return safeSend(chatId, `⚠️ *No Admin Groups Found!*\n${DIVIDER}\nThe engine could not detect any groups where you hold Admin rights.`);
            state.currentPage = 0; state.selectedGroupsArray = []; state.flowContext = data.replace('menu_', '').toUpperCase();
            return tgBot.sendMessage(chatId, `🎯 *SELECT TARGET GROUPS:*\n${DIVIDER}\n✅ *Selected:* 0 / *Total:* ${state.adminGroups.length}`, { parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return safeSend(chatId, "❌ Critical failure fetching groups.");
        }
    }

    // --- GROUP CREATION CALLBACKS ---
    if (data === 'grp_skip_desc') { state.groupConfig.desc = '';
        state.action = 'WAIT_GROUP_PFP'; return tgBot.editMessageText("🖼️ *Phase 5:* Send Profile Picture (DP).", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '⏩ Skip DP', callback_data: 'grp_skip_pfp'}]] } });
    }
    if (data === 'grp_skip_pfp') { state.groupConfig.pfpPath = null; state.action = null; return sendGroupSettingsMenu(chatId, userId, query.message.message_id);
    }
    if (data.startsWith('grp_tgl_')) { const setKey = data.replace('grp_tgl_', ''); state.groupConfig.settings[setKey] = !state.groupConfig.settings[setKey]; return sendGroupSettingsMenu(chatId, userId, query.message.message_id);
    }
    if (data === 'grp_deploy_now') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startGroupCreationProcess(chatId, userId, uClient);
    }

    if (data === 'confirm_selection') {
        if (state.flowContext === 'AUTOKICK') { state.action = 'WAIT_KICK_TERM';
            return safeSend(chatId, `⚔️ *AUTO-KICK TARGET*\n${DIVIDER}\nEnter Target Numbers or Codes (e.g. +91, 92, 12345):`);
        }
        if (state.flowContext === 'EXTRACTLINKS') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return extractGroupLinksEngine(chatId, userId, uClient);
        }
        if (state.flowContext === 'PENDING_LIST') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return pendingListEngine(chatId, userId, uClient);
        }
        
        // --- AUTO APPROVE OPTIONS MENU UI ---
        if (state.flowContext === 'APPROVE') { 
            const kb = { inline_keyboard: [ [{ text: '🔓 Turn OFF Approval', callback_data: 'approve_opt_off' }], [{ text: '✔️ Execute Manual', callback_data: 'approve_opt_manual' }], [{ text: '❌ Cancel', callback_data: 'btn_main_menu' }] ]};
            return tgBot.editMessageText(`👥 *METHOD?*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
        }
        
        if (state.flowContext === 'SECURITY' && state.action === 'WAIT_SEC_TARGETS') {
            const sec = getSecurityConfig(userId);
            sec.targetGroups = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray;
            sec.targetMode = 'SELECTED';
            saveAdminConfig(); state.action = null; tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
            return sendShieldMenu(chatId, userId);
        }
    }

    if (data === 'approve_opt_off' || data === 'approve_opt_manual') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
        return autoApproveEngine(chatId, userId, uClient, data === 'approve_opt_off' ? 'OFF_SETTING' : 'MANUAL');
    }

    if (data === 'select_all') {
        if (state.selectedGroupsArray === 'ALL') state.selectedGroupsArray = [];
        else state.selectedGroupsArray = 'ALL';
        return updatePaginationMessage(chatId, query.message.message_id, userId);
    }

    if (data.startsWith('selgrp_')) { 
        const id = data.split('_')[1];
        if (state.selectedGroupsArray === 'ALL') state.selectedGroupsArray = state.adminGroups.map(g=>g.id).filter(g => g !== id);
        else if (state.selectedGroupsArray.includes(id)) state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); 
        else state.selectedGroupsArray.push(id); 
        return updatePaginationMessage(chatId, query.message.message_id, userId);
    }
    
    if (data.startsWith('page_')) { 
        state.currentPage = parseInt(data.split('_')[1]);
        return updatePaginationMessage(chatId, query.message.message_id, userId);
    }
});

function getPaginationKeyboard(userId) {
    const state = getState(userId);
    const start = state.currentPage * 5; const items = state.adminGroups.slice(start, start + 5);
    let kb = [[{ text: state.selectedGroupsArray === 'ALL' ? '☑️ DESELECT ALL' : '☑️ SELECT ALL', callback_data: 'select_all' }]];
    items.forEach(g => { const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); });
    let navRow = []; if (state.currentPage > 0) navRow.push({ text: '◀️ Pʀᴇᴠ', callback_data: `page_${state.currentPage - 1}` });
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) navRow.push({ text: 'Nᴇxᴛ ▶️', callback_data: `page_${state.currentPage + 1}` });
    if (navRow.length > 0) kb.push(navRow);
    kb.push([{ text: `⚡ E x ᴇ ᴄ ᴜ ᴛ ᴇ`, callback_data: 'confirm_selection' }]);
    kb.push([{ text: `❌ A ʙ ᴏ ʀ ᴛ`, callback_data: 'btn_main_menu' }]); return { inline_keyboard: kb };
}

// ============================================================================
// 💬 MESSAGE & PAYLOAD HANDLERS
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; const userId = msg.from.id; const text = msg.text || ''; 
    const state = getState(userId); const uClient = activeClients.get(userId)?.client;
    
    updateActivity(userId);
    if (text.startsWith('/')) return; 
    if (!(await checkAccess(userId, chatId, msg))) return; 

    // --- FULL ADMIN WAIT STATES (WITH LIST MANAGEMENT) ---
    if (state.action === 'WAIT_ADMIN_FSUB_ADD') { 
        const parts = text.split(/[\s|]+/).filter(p => p.trim() !== '');
        if (parts.length < 2 || !parts[1].startsWith('http')) {
            if (parts.length === 1 && parts[0].startsWith('@')) {
                adminConfig.fsubChannels.push({ id: parts[0], link: `https://t.me/${parts[0].replace('@', '')}` });
                saveAdminConfig();
                state.action = null; safeSend(chatId, `✅ Channel added to Force Sub.`); return sendAdminPanel(chatId, userId);
            }
            return safeSend(chatId, `⚠️ Syntax Error!\n@ChannelID https://link.com`);
        }
        adminConfig.fsubChannels.push({ id: parts[0], link: parts[1] }); saveAdminConfig();
        state.action = null; safeSend(chatId, `✅ Channel added to Force Sub.`); return sendAdminPanel(chatId, userId); 
    }
    if (state.action === 'WAIT_ADMIN_FSUB_REMOVE') { 
        const ch = text.trim();
        adminConfig.fsubChannels = adminConfig.fsubChannels.filter(c => {
            let currentId = typeof c === 'object' ? c.id : c;
            return currentId !== ch;
        }); 
        saveAdminConfig();
        state.action = null; safeSend(chatId, `✅ Channel removed from Force Sub.`);
        return sendAdminPanel(chatId, userId); 
    }
    if (state.action === 'WAIT_ADMIN_ADD') { const targetId = parseInt(text);
        if (!isNaN(targetId) && !adminConfig.admins.includes(targetId)) { adminConfig.admins.push(targetId); saveAdminConfig(); } return sendAdminPanel(chatId, userId);
    }
    if (state.action === 'WAIT_ADMIN_REMOVE') { const targetId = parseInt(text); adminConfig.admins = adminConfig.admins.filter(id => id !== targetId);
        saveAdminConfig(); return sendAdminPanel(chatId, userId); }
    if (state.action === 'WAIT_ADMIN_BAN') { const targetId = parseInt(text);
        if (!isNaN(targetId) && !adminConfig.bannedUsers.includes(targetId)) { adminConfig.bannedUsers.push(targetId); saveAdminConfig(); safeSend(targetId, `🚫 You have been permanently banned by the Admin.`);
        } return sendAdminPanel(chatId, userId); }
    if (state.action === 'WAIT_ADMIN_UNBAN') { const targetId = parseInt(text);
        adminConfig.bannedUsers = adminConfig.bannedUsers.filter(id => id !== targetId); saveAdminConfig(); safeSend(targetId, `✅ Your ban has been lifted by the Admin.`);
        return sendAdminPanel(chatId, userId); }
    
    // --- ALLOW / REVOKE WAIT STATES ---
    if (state.action === 'WAITING_FOR_ALLOW_ID') { 
        const targetId = parseInt(text);
        if (!adminConfig.allowedUsers.includes(targetId)) adminConfig.allowedUsers.push(targetId); 
        if (adminConfig.revokedUsers) adminConfig.revokedUsers = adminConfig.revokedUsers.filter(u => u !== targetId);
        if (adminConfig.bannedUsers) adminConfig.bannedUsers = adminConfig.bannedUsers.filter(u => u !== targetId);
        saveAdminConfig(); state.action = null; 
        return safeSend(chatId, `✅ Usᴇʀ sᴜᴄᴄᴇssғᴜʟʟʏ ᴀʟʟᴏᴡᴇᴅ.`);
    }
    if (state.action === 'WAITING_FOR_REVOKE_ID') { 
        const targetId = parseInt(text);
        adminConfig.allowedUsers = adminConfig.allowedUsers.filter(u => u !== targetId); 
        if (!adminConfig.revokedUsers) adminConfig.revokedUsers = [];
        if (!adminConfig.revokedUsers.includes(targetId)) adminConfig.revokedUsers.push(targetId);
        saveAdminConfig(); state.action = null;
        return safeSend(chatId, `❌ Aᴄᴄᴇss ʀᴇᴠᴏᴋᴇᴅ sᴜᴄᴄᴇssғᴜʟʟʏ.`); 
    }

    if (state.action === 'WAIT_ADMIN_BROADCAST') { 
        state.action = null;
        let count = 0; 
        let statusMsg = await safeSend(chatId, `⏳ *Transmitting Payload to ${knownBotUsers.length} users...*`);
        for (let i = 0; i < knownBotUsers.length; i++) { 
            try { 
                await tgBot.copyMessage(knownBotUsers[i], chatId, msg.message_id); 
                count++; 
                await new Promise(r => setTimeout(r, 60));
                if ((i + 1) % 15 === 0 && statusMsg) {
                    tgBot.editMessageText(`⏳ *Transmitting...*\n${createProgressBar(i+1, knownBotUsers.length)}`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
                }
            } catch(e) {} 
        }
        if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
        return safeSend(chatId, `✅ Broadcast sent to ${count} users.`);
    }

    // --- SHIELD WAIT STATES (WITH LINKS TARGETING) ---
    if (state.action === 'WAIT_SEC_LINKS') {
        if (!uClient) return safeSend(chatId, "⚠️ System requires authentication.");
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (codes.length === 0) return safeSend(chatId, "⚠️ No valid links detected.");
        let statusMsg = await safeSend(chatId, `⏳ *Securing Targets via Links...*`);
        getSecurityConfig(userId).targetMode = 'LINKS';
        if(getSecurityConfig(userId).targetMode !== 'LINKS') getSecurityConfig(userId).targetGroups = [];
        for (let code of codes) {
            try {
                let gid = await uClient.groupAcceptInvite(code);
                if (!getSecurityConfig(userId).targetGroups.includes(gid)) getSecurityConfig(userId).targetGroups.push(gid);
                await new Promise(r=>setTimeout(r, 3000 + Math.random() * 2500)); 
            } catch(e) {}
        }
        if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
        saveAdminConfig(); state.action = null; return sendShieldMenu(chatId, userId, null);
    }
    
    if (state.action === 'WAIT_SEC_ADD_CODE') { const sec = getSecurityConfig(userId);
        const code = text.replace(/[^0-9]/g, ''); if (code && !sec.countries.includes(code)) { sec.countries.push(code); saveAdminConfig(); } return sendShieldMenu(chatId, userId);
    }
    if (state.action === 'WAIT_SEC_REMOVE_CODE') { const sec = getSecurityConfig(userId); const code = text.replace(/[^0-9]/g, '');
        sec.countries = sec.countries.filter(c => c !== code); saveAdminConfig(); return sendShieldMenu(chatId, userId);
    }
    if (state.action === 'WAIT_SEC_ADD_VIP') { const sec = getSecurityConfig(userId); const num = text.replace(/[^0-9]/g, '');
        if (num && !sec.vipNumbers.includes(num)) { sec.vipNumbers.push(num); saveAdminConfig(); } return sendShieldMenu(chatId, userId);
    }
    if (state.action === 'WAIT_SEC_REMOVE_VIP') { const sec = getSecurityConfig(userId); const num = text.replace(/[^0-9]/g, '');
        sec.vipNumbers = sec.vipNumbers.filter(v => v !== num); saveAdminConfig(); return sendShieldMenu(chatId, userId);
    }

    // --- GENERAL WAIT STATES ---
    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { state.action = null;
        const cleanNum = text.replace(/[^0-9]/g, ''); return startBaileysClient(userId, chatId, cleanNum); }
    if (state.action === 'WAIT_VCF_AND_LINK') {
        const linkMatch = msg.caption?.match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if (!msg.document || !linkMatch) return safeSend(chatId, `❌ Invalid Format. Ensure you attach the VCF file and put the link in the caption.`);
        try {
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); fs.unlinkSync(filePath);
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1] + '@s.whatsapp.net');
            state.tempData.targets = numbers; state.action = null;
            const estTime = (Math.ceil(numbers.length / 5) * 12) + " seconds";
            return safeSend(chatId, `⚙️ *SWARM MISSION CONFIGURATION*\n${DIVIDER}\n🎯 *Target Group:* \`${linkMatch[1]}\`\n👥 *Total Contacts:* ${numbers.length}\n⏱️ *Est. Time:* ${estTime}\n\n_Ready to engage Swarm Protocol._`, { reply_markup: { inline_keyboard: [ [{text: '🚀 INITIATE MISSION', callback_data: `start_mission_${linkMatch[1]}`}] ] } });
        } catch(e) { return safeSend(chatId, `❌ VCF Parsing Failed.`); }
    }

    if (!uClient && !adminConfig.testModeEnabled) return;
    
    // --- ADVANCED GROUP CREATION PHASES ---
    if (state.action === 'WAIT_GROUP_NAME') { state.groupConfig.baseName = text.trim(); state.action = 'WAIT_GROUP_COUNT';
        return safeSend(chatId, `🔢 *Phase 2:* How many groups do you want to create?`);
    } 
    if (state.action === 'WAIT_GROUP_COUNT') { state.groupConfig.count = parseInt(text);
        if(isNaN(state.groupConfig.count)) return safeSend(chatId, `❌ Enter a valid number.`); state.action = 'WAIT_GROUP_MEMBER';
        return safeSend(chatId, `👤 *Phase 3:* Provide the WhatsApp Number to add as admin:`);
    } 
    if (state.action === 'WAIT_GROUP_MEMBER') { 
        state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        state.action = 'WAIT_GROUP_DESC';
        return safeSend(chatId, `📝 *Phase 4:* Enter Group Description?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_desc'}], [{text: '❌ Cancel', callback_data: 'btn_main_menu'}]] } });
    }
    if (state.action === 'WAIT_GROUP_DESC') { 
        state.groupConfig.desc = text; 
        state.action = 'WAIT_GROUP_PFP';
        return safeSend(chatId, `🖼️ *Phase 5:* Send Profile Picture (DP)?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_pfp'}], [{text: '❌ Cancel', callback_data: 'btn_main_menu'}]] } });
    }
    if (state.action === 'WAIT_GROUP_PFP') {
        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            try { 
                const filePath = await tgBot.downloadFile(fileId, __dirname); 
                state.groupConfig.pfpPath = filePath; 
                state.action = null; 
                sendGroupSettingsMenu(chatId, userId, null);
            } 
            catch (e) { 
                state.action = null;
                sendGroupSettingsMenu(chatId, userId, null); 
            }
        }
    }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if(codes.length === 0) return safeSend(chatId, `❌ No valid links found.`);
        if (!uClient) return safeSend(chatId, `✅ [TEST MODE] Mock Execution: Join Mission Complete.`);
        for (let code of codes) { try { await uClient.groupAcceptInvite(code); await new Promise(r => setTimeout(r, 3000));
        } catch (e) { } }
        return safeSend(chatId, `✅ Join Mission Complete.`);
    }

    // --- WA BROADCAST (NOW WITH MEDIA LIMIT FIX AND PROGRESS BAR) ---
    if (state.action === 'WAIT_BROADCAST_MSG') {
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; 
        state.action = null;
        if (!uClient) return safeSend(chatId, `✅ [TEST MODE] Simulated broadcast to ${targets.length} targets.`);

        let statusMsg = await safeSend(chatId, `⏳ *Tʀᴀɴsᴍɪᴛᴛɪɴɢ WA Bʀᴏᴀᴅᴄᴀsᴛ...*`);
        let mediaPath = null;
        let msgOptions = {};
        let captionText = msg.caption || msg.text || '';

        try {
            if (msg.photo || msg.video || msg.document) {
                let fileId = msg.photo ? msg.photo[msg.photo.length - 1].file_id : (msg.video ? msg.video.file_id : msg.document.file_id);
                try {
                    const fileInfo = await tgBot.getFile(fileId);
                    if (fileInfo.file_size > 20 * 1024 * 1024) {
                        if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
                        return safeSend(chatId, `❌ *ERROR:* Media exceeds 20MB limit. Bot API cannot download files larger than 20MB. Process aborted.`);
                    }
                } catch(e) {}
            }

            if (msg.photo) { 
                const fileId = msg.photo[msg.photo.length - 1].file_id;
                mediaPath = await tgBot.downloadFile(fileId, __dirname); 
                msgOptions = { image: { url: mediaPath }, caption: captionText };
            } else if (msg.video) { 
                const fileId = msg.video.file_id;
                mediaPath = await tgBot.downloadFile(fileId, __dirname); 
                msgOptions = { video: { url: mediaPath }, caption: captionText };
            } else if (msg.document) { 
                const fileId = msg.document.file_id;
                mediaPath = await tgBot.downloadFile(fileId, __dirname); 
                msgOptions = { document: { url: mediaPath }, mimetype: 'application/octet-stream', fileName: msg.document.file_name || 'Vortex_File', caption: captionText };
            } else {
                msgOptions = { text: captionText };
            }

            let success = 0;
            let failed = 0;

            for (let i = 0; i < targets.length; i++) {
                if (i > 0 && i % 20 === 0) {
                    await safeSend(chatId, `☕ *HUMANIZING ENGINE:* VORTEX ɪs ᴛᴀᴋɪɴɢ ᴀ ʙʀᴇᴀᴋ...`);
                    await new Promise(r => setTimeout(r, 120000));
                }
                if (statusMsg && i % 3 === 0) {
                    tgBot.editMessageText(`⏳ *Tʀᴀɴsᴍɪᴛᴛɪɴɢ...*\n${createProgressBar(i+1, targets.length)}`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
                }

                try { 
                    let typingDuration = captionText.length > 0 ? (captionText.length * 40) + Math.random() * 1000 : 2000;
                    if (typingDuration > 10000) typingDuration = 10000;
                    
                    await uClient.sendPresenceUpdate('composing', targets[i]);
                    await new Promise(r => setTimeout(r, typingDuration));
                    await uClient.sendPresenceUpdate('paused', targets[i]);

                    await uClient.sendMessage(targets[i], msgOptions);
                    success++;
                } 
                catch(e) { failed++; } 

                let waitDelay = 3500 + (captionText.length * 10) + Math.random() * 3000;
                await new Promise(r => setTimeout(r, waitDelay)); 
            }
            if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, `✅ *WA BROADCAST REPORT*\n${DIVIDER}\n🎯 Tᴀʀɢᴇᴛs: ${targets.length}\n✔️ Sᴜᴄᴄᴇss: ${success}\n❌ Fᴀɪʟᴇᴅ: ${failed}`);
        } catch(e) { 
            console.error("Media Download Error:", e);
        } 
        finally { 
            if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
        }
        return;
    }

    if (state.action === 'WAIT_RENAME_DATA') {
        const lines = text.split('\n');
        if(lines.length < 2) return safeSend(chatId, `❌ Format error. Use:\nLink\nNew Name`);
        const linkMatch = lines[0].match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if(!linkMatch) return safeSend(chatId, `❌ Invalid Link.`);
        if (!uClient) { state.action = null; return safeSend(chatId, `✅ [TEST MODE] Group renamed to: *${lines[1]}*`);
        }
        try { const targetGid = await uClient.groupAcceptInvite(linkMatch[1]); await uClient.groupUpdateSubject(targetGid, lines[1]);
            state.action = null; return safeSend(chatId, `✅ Group renamed to: *${lines[1]}*`); } catch(e) { return safeSend(chatId, `❌ Failed to rename.`);
        }
    }

    // --- MASS PURGE ENGINE ---
    if (state.action === 'WAIT_KICK_TERM') {
        return runPurgeEngine(chatId, userId, uClient, text);
    }
});

// ============================================================================
// 💥 ADVANCED PENDING LIST ENGINE
// ============================================================================
async function pendingListEngine(chatId, userId, uClient) {
    const state = getState(userId); 
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray;
    
    if (!uClient && adminConfig.testModeEnabled) return safeSend(chatId, `✅ [TEST MODE] Pending List scan complete.`);
    
    let statusMsg = await safeSend(chatId, `⏳ *SCANNING PENDING REQUESTS*...`);
    let report = `📋 *PENDING LIST REPORT*\n${DIVIDER}\n`;
    let totalPendingOverall = 0;
    let globalCountryStats = {};

    const ccodes = ['1','20','27','212','234','254','30','31','32','33','34','39','44','49','51','52','54','55','60','61','62','63','64','65','66','81','82','84','86','90','91','92','93','94','95','98','213','255','256','260','263','880','966','967','971','972'];

    for (let i = 0; i < targetGroupIds.length; i++) { 
        if (statusMsg) tgBot.editMessageText(`🔍 *Scanning Groups...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const metadata = await uClient.groupMetadata(targetGroupIds[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = metadata.participants.find(p => p.id === botId);
            if (!botParticipant || !botParticipant.admin) { 
                report += `🔹 *${metadata.subject}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n\n`; 
                continue; 
            }

            const reqs = await uClient.groupRequestParticipantsList(targetGroupIds[i]);
            if (reqs && reqs.length > 0) {
                totalPendingOverall += reqs.length;
                let groupCountryStats = {};
                
                reqs.forEach(r => {
                    let jid = r.jid || r;
                    let num = jid.split('@')[0];
                    let code = 'Other';
                    for (let c = 3; c > 0; c--) {
                        let prefix = num.substring(0, c);
                        if (ccodes.includes(prefix)) { code = '+' + prefix; break; }
                    }
                    groupCountryStats[code] = (groupCountryStats[code] || 0) + 1;
                    globalCountryStats[code] = (globalCountryStats[code] || 0) + 1;
                });

                report += `🔹 *${metadata.subject}*\n👥 *Total Pending:* ${reqs.length}\n`;
                for (const [code, count] of Object.entries(groupCountryStats)) {
                    report += `  ├ ${code}: ${count} numbers\n`;
                }
                report += `\n`;
            } else {
                report += `🔹 *${metadata.subject}:* 0 Pending\n\n`;
            }
        } catch (e) { } 
        await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    }
    
    let summary = `📊 *GLOBAL SUMMARY*\n*Total Requests:* ${totalPendingOverall}\n`;
    let sortedCountries = Object.entries(globalCountryStats).sort((a, b) => b[1] - a[1]);
    for (const [code, count] of sortedCountries) {
        summary += `🌍 *${code}:* ${count} users\n`;
    }
    
    report = summary + `\n${DIVIDER}\n\n` + report;

    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report + FOOTER, 'Pending_List_Report');
}

// ============================================================================
// 💥 CORE EXECUTION ENGINES
// ============================================================================

async function runPurgeEngine(chatId, userId, uClient, inputString) {
    const state = getState(userId);
    const inputList = inputString.replace(/,/g, ' ').split(/\s+/).filter(p => p.trim() !== '');
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; 
    state.action = null; 
    
    if (!uClient && adminConfig.testModeEnabled) return safeSend(chatId, `✅ [TEST MODE] Purge simulated.`);
    
    let statusMsg = await safeSend(chatId, `⏳ *Kɪᴄᴋɪɴɢ Usᴇʀs...*`);
    let report = `✅ *Aᴜᴛᴏ Kɪᴄᴋ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n`;

    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            if (statusMsg) tgBot.editMessageText(`🔍 *Sᴄᴀɴɴɪɴɢ...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
            
            const meta = await uClient.groupMetadata(targetGroupIds[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = meta.participants.find(p => p.id === botId);
            
            if (!botParticipant || !botParticipant.admin) { report += `🔹 *${meta.subject}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n`; continue; }

            let targetsToRemove = [];
            for (const participant of meta.participants) {
                if (participant.admin) continue; 
                let shouldKick = false;
                let partNum = participant.id.split('@')[0];
                for (const item of inputList) { 
                    let searchItem = item.startsWith('+') ? item.substring(1) : item;
                    if (partNum.startsWith(searchItem) || partNum === searchItem) { shouldKick = true; break; } 
                }
                if (shouldKick) targetsToRemove.push(participant.id);
            }
            if (targetsToRemove.length > 0) { 
                await uClient.groupParticipantsUpdate(targetGroupIds[i], targetsToRemove, 'remove');
                report += `🔹 *${meta.subject}:* Kɪᴄᴋᴇᴅ ${targetsToRemove.length}\n`; 
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
            }
        } catch (e) {}
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
    return sendLongReport(chatId, report + FOOTER, 'Purge_Report');
}

async function executeLiveParallelEngine(chatId, userId, uClient, inviteCode) {
    const state = getState(userId);
    let targets = state.tempData?.targets || [];
    safeSend(chatId, `🚀 *SWARM ADD INITIATED*\nBatch adding ${targets.length} members...`);
    if (!uClient && adminConfig.testModeEnabled) return safeSend(chatId, `✅ [TEST MODE] Swarm Mission Complete.`);
    try {
        const targetGid = await uClient.groupAcceptInvite(inviteCode);
        for (let j = 0; j < targets.length; j += 5) { await uClient.groupParticipantsUpdate(targetGid, targets.slice(j, j + 5), 'add');
            await new Promise(r => setTimeout(r, 10000 + Math.random() * 8000)); } 
        safeSend(chatId, `✅ Swarm Mission Complete.`);
    } catch(e) { safeSend(chatId, `❌ Mission Failed.`); }
}

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig;
    let successCount = 0;
    if (!uClient && adminConfig.testModeEnabled) return safeSend(chatId, `✅ [TEST MODE] Group Generation Complete.\nSuccess: ${config.count}/${config.count}`);
    
    let statusMsg = await safeSend(chatId, `🚀 *DEPLOYMENT ACTIVE*`);
    let resultMessage = `✅ *Dᴇᴘʟᴏʏᴍᴇɴᴛ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n\n`;

    for (let i = 1; i <= config.count; i++) { 
        if (statusMsg) tgBot.editMessageText(`⚙️ *Constructing...*\n${createProgressBar(i, config.count)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const groupName = `${config.baseName} ${i}`;
            const res = await uClient.groupCreate(groupName, [config.memberId]); 
            successCount++;
            
            await new Promise(r => setTimeout(r, 2000)); 
            
            if (config.desc) await uClient.groupUpdateDescription(res.id, config.desc).catch(()=>{});
            if (config.pfpPath && fs.existsSync(config.pfpPath)) {
                await uClient.updateProfilePicture(res.id, { url: config.pfpPath }).catch(()=>{});
            }
            if (config.settings.msgsAdminOnly) await uClient.groupSettingUpdate(res.id, 'announcement').catch(()=>{}); 
            if (config.settings.infoAdminOnly) await uClient.groupSettingUpdate(res.id, 'locked').catch(()=>{});
            
            const link = await uClient.groupInviteCode(res.id); 
            resultMessage += `🔹 *${groupName}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`;
            
            await new Promise(r => setTimeout(r, 5000)); 
        } catch (e) { 
            resultMessage += `🔹 *${config.baseName} ${i}*\n❌ Error: _${e.message}_\n\n`;
        } 
    }
    
    if (config.pfpPath && fs.existsSync(config.pfpPath)) fs.unlinkSync(config.pfpPath);
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    
    return sendLongReport(chatId, resultMessage + FOOTER, 'Created_Groups');
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const targets = getState(userId).selectedGroupsArray === 'ALL' ?
    getState(userId).adminGroups.map(g => g.id) : getState(userId).selectedGroupsArray;
    let report = `🔗 *EXTRACTED LINKS*\n${DIVIDER}\n\n`;
    if (!uClient && adminConfig.testModeEnabled) {
        for(let target of targets) report += `🔹 *TEST GROUP*\nhttps://chat.whatsapp.com/TESTMODE_LINK\n\n`;
        return sendLongReport(chatId, report, 'Extracted_Links');
    }
    let statusMsg = await safeSend(chatId, `⏳ *EXTRACTING*\nPulling links from ${targets.length} groups...`);
    for (let i = 0; i < targets.length; i++) { 
        if (statusMsg) tgBot.editMessageText(`🔍 *Extracting...*\n${createProgressBar(i+1, targets.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const metadata = await uClient.groupMetadata(targets[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = metadata.participants.find(p => p.id === botId);
            if (!botParticipant || !botParticipant.admin) { report += `🔹 *${metadata.subject}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n\n`; continue; }

            const code = await uClient.groupInviteCode(targets[i]); 
            report += `🔹 *${metadata.subject}*\nhttps://chat.whatsapp.com/${code}\n\n`; 
        } catch (e) { report += `🔹 ID: ${targets[i]} ❌\n\n`; } 
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient, mode) {
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ?
    state.adminGroups.map(g => g.id) : state.selectedGroupsArray;
    if (!uClient && adminConfig.testModeEnabled) return safeSend(chatId, `✅ [TEST MODE] Auto-Approve Cycle Complete.`);
    
    let statusMsg = await safeSend(chatId, `⏳ *APPROVE ENGINE RUNNING*...`);
    let report = `✅ *APPROVAL REPORT*\n${DIVIDER}\n`;

    for (let i = 0; i < targetGroupIds.length; i++) { 
        if (statusMsg) tgBot.editMessageText(`👥 *Authorizing...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const metadata = await uClient.groupMetadata(targetGroupIds[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = metadata.participants.find(p => p.id === botId);
            if (!botParticipant || !botParticipant.admin) { report += `🔹 *${metadata.subject}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n`; continue; }

            if (mode === 'OFF_SETTING') {
                try { 
                    await uClient.groupJoinApprovalMode(targetGroupIds[i], 'off'); 
                    report += `🔹 *${metadata.subject}:* Gate Opened.\n`; 
                } catch(e) {}
            } else if (mode === 'MANUAL') {
                const reqs = await uClient.groupRequestParticipantsList(targetGroupIds[i]);
                if (reqs && reqs.length > 0) { 
                    await uClient.groupRequestParticipantsUpdate(targetGroupIds[i], reqs.map(r => r.jid), 'approve');
                    report += `🔹 *${metadata.subject}:* Approved +${reqs.length}\n`;
                }
            }
        } catch (e) { } 
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report + FOOTER, 'Approval_Report');
}

// ============================================================================
// 🚨 GOD-TIER POLLING ERROR HANDLER (ANTI-CRASH)
// ============================================================================
tgBot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('\n[🚨 ANTI-CRASH ALERT] 409 CONFLICT: Token active on another server!');
    } else {
        console.log('\n[POLLING ERROR]', error.message);
    }
});

// ============================================================================
// 🛑 GRACEFUL EXIT HANDLER
// ============================================================================
process.on('SIGINT', async () => {
    for (let [userId, session] of activeClients) { 
        if (session && session.client) {
            try {
                session.client.ws.close(); 
            } catch(e) {}
        }
    }
    process.exit(0);
});
