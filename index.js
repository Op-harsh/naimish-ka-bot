const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); 
const path = require('path');
const express = require('express');

// ============================================================================
// 🛡️ 1. GLOBAL ANTI-CRASH SHIELD
// ============================================================================
process.on('uncaughtException', (err) => { 
    console.log('\n[ANTI-CRASH] Caught Exception:', err.message); 
});
process.on('unhandledRejection', (reason) => { 
    console.log('\n[ANTI-CRASH] Unhandled Rejection:', reason); 
});

// ============================================================================
// ☁️ 2. CLOUD SERVER (ANTI-SLEEP FOR RAILWAY)
// ============================================================================
const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => { 
    res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;">🚀 VORTEX V48.3 (Premium Stealth) Active</h1>'); 
});
app.listen(port, () => {
    console.log(`☁️ [SERVER] Web Interface Active on Port ${port}`);
});

// ============================================================================
// ⚙️ 3. CORE CONFIGURATION
// ============================================================================
const TELEGRAM_TOKEN = '8709803495:AAHo78HVoqB2MPsnhp0wnK5LQAwozzNDHMM'; 
const OWNER_ID = 5524906942; 
const OWNER_USERNAME = '@Naimish555'; 

const tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// 🔥 ULTIMATE GHOST PROTOCOL (No Proxy, Raw Stealth Flags)
const puppeteerOptions = {
    headless: true,
    args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage', 
        '--single-process', 
        '--no-zygote', 
        '--disable-gpu', 
        '--no-first-run', 
        '--disable-accelerated-2d-canvas',
        '--disable-blink-features=AutomationControlled', 
        '--disable-features=IsolateOrigins,site-per-process', 
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
};

if (fs.existsSync('/data/data/com.termux/files/usr/bin/chromium-browser')) {
    puppeteerOptions.executablePath = '/data/data/com.termux/files/usr/bin/chromium-browser';
}

console.log(`\n🔥 VORTEX V48.3 INITIALIZING...\n`);

// ============================================================================
// 🧠 4. STATE MANAGEMENT, MEMORY MAPS & PERSISTENT DB
// ============================================================================
const activeClients = new Map();
let userStates = {}; 
let knownBotUsers = [];

const BOT_USERS_FILE = './bot_users.json';
const ADMIN_CONFIG_FILE = './admin_config.json';

if (fs.existsSync(BOT_USERS_FILE)) {
    try { knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE)); } 
    catch(e) { console.error("Failed to load bot users DB:", e.message); }
}

let adminConfig = {
    fsubEnabled: false, 
    fsubChannels: [], 
    approvalRequired: false, 
    welcomeEnabled: true, 
    botAlerts: true, 
    admins: [], 
    allowedUsers: [], 
    bannedUsers: [],
    revokedUsers: [], 
    securityConfigs: {}, 
    featurePerms: { 
        login: ['owner','admin','user'], 
        creategroup: ['owner','admin','user'], 
        joingroup: ['owner','admin','user'], 
        renamegroups: ['owner','admin','user'], 
        extractlinks: ['owner','admin','user'], 
        approve: ['owner','admin','user'], 
        autokick: ['owner','admin','user'], 
        broadcast: ['owner','admin','user'], 
        stats: ['owner','admin','user'], 
        security: ['owner','admin'] 
    }
};

if (fs.existsSync(ADMIN_CONFIG_FILE)) {
    try { 
        const savedConfig = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE));
        adminConfig = { ...adminConfig, ...savedConfig };
    } catch(e) { console.error("Failed to load admin config DB:", e.message); }
}

function saveAdminConfig() {
    try {
        const data = JSON.stringify(adminConfig, null, 4);
        fs.writeFileSync(ADMIN_CONFIG_FILE, data);
    } catch (err) { console.error("Error saving admin config:", err); }
}

function getSecurityConfig(userId) {
    if (!adminConfig.securityConfigs[userId]) {
        adminConfig.securityConfigs[userId] = { 
            enabled: false, ruleType: 'WHITELIST', countries: ['91'], vipNumbers: [], 
            autoKickEnabled: false, strikeCount: 3, violations: {}, targetMode: 'ALL', targetGroups: [],
            stats: { deleted: 0, kicked: 0 }
        };
    }
    return adminConfig.securityConfigs[userId];
}

function getState(userId) {
    if (!userStates[userId]) {
        userStates[userId] = { 
            action: null, adminGroups: [], currentPage: 0, flowContext: '', selectedGroupsArray: [], lastMsgId: null,
            language: 'Eɴɢʟɪsʜ', 
            groupConfig: { baseName: '', count: 0, memberId: '', desc: '', pfpPath: null, settings: { msgsAdminOnly: false, infoAdminOnly: false } }
        };
    }
    return userStates[userId];
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `\n${DIVIDER}\n👑 _VORTEX Sʏsᴛᴇᴍ V48.3_ | Oᴡɴᴇʀ: ${OWNER_USERNAME}`;

const texts = {
    'Eɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs",
        statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Rᴇǫᴜɪʀᴇᴅ)",
        login: "🔐 Lᴏɢɪɴ WA", autoGroup: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", extract: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", 
        kick: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", broadcast: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", stats: "📊 Bᴏᴛ Sᴛᴀᴛs", 
        shield: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", lang: "Lᴀɴɢᴜᴀɢᴇ"
    },
    'Hɪɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs",
        statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ Hᴀɪ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Kᴀʀᴏ)",
        login: "🔐 Lᴏɢɪɴ WA", autoGroup: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", extract: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", 
        kick: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", broadcast: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", stats: "📊 Bᴏᴛ Sᴛᴀᴛs", 
        shield: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", lang: "Bʜᴀsʜᴀ"
    },
    'Iɴᴅᴏɴᴇsɪᴀɴ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs",
        statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Rᴇǫᴜɪʀᴇᴅ)",
        login: "🔐 Lᴏɢɪɴ WA", autoGroup: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", extract: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", 
        kick: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", broadcast: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", stats: "📊 Bᴏᴛ Sᴛᴀᴛs", 
        shield: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", lang: "Bᴀʜᴀsᴀ"
    }
};

// ============================================================================
// 🛠️ 5. SYSTEM HELPERS (WITH SAFESEND WRAPPER)
// ============================================================================
async function safeSend(chatId, text, options = {}) {
    try { return await tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options }); } 
    catch (e) { console.error(`SafeSend Error [Chat: ${chatId}]:`, e.message); return null; }
}

function createProgressBar(current, total) {
    if (total === 0) return `[██████████] 100%`;
    const length = 10;
    const filled = Math.round((current / total) * length);
    const empty = Math.max(0, length - filled);
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${Math.round((current / total) * 100)}%`;
}

async function sendLongReport(chatId, text, filename, options = {}) {
    if (text.length > 3900) {
        const filePath = path.join(__dirname, `${filename}_${chatId}.txt`);
        try { 
            fs.writeFileSync(filePath, text);
            await tgBot.sendDocument(chatId, filePath, { caption: `📄 *REPORT GENERATED*\n${FOOTER}`, parse_mode: 'Markdown', ...options });
            fs.unlinkSync(filePath); 
        } catch (e) { console.error("Report generation failed:", e); }
    } else { safeSend(chatId, text, options); }
}

async function checkAccess(userId, chatId, msgObj = null) {
    if (!knownBotUsers.includes(userId)) { 
        knownBotUsers.push(userId);
        try { fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(knownBotUsers)); } catch(e) {}
        if (adminConfig.botAlerts && msgObj) {
            const userName = msgObj.from?.first_name || 'Unknown';
            safeSend(OWNER_ID, `🚨 *NEW USER DETECTED*\n${DIVIDER}\n👤 *Nᴀᴍᴇ:* ${userName}\n🆔 *ID:* \`${userId}\`\n${FOOTER}`);
        }
    }

    if (userId === OWNER_ID) return true;
    
    if (adminConfig.bannedUsers.includes(userId)) { 
        safeSend(chatId, `🚫 *ACCESS RESTRICTED*\nYᴏᴜʀ ᴀᴄᴄᴇss ʜᴀs ʙᴇᴇɴ sᴜsᴘᴇɴᴅᴇᴅ ʙʏ VORTEX Aᴅᴍɪɴ.`); 
        return false; 
    }

    if (adminConfig.revokedUsers && adminConfig.revokedUsers.includes(userId)) { 
        safeSend(chatId, `🔒 *ACCESS REVOKED*\nAᴀᴘᴋᴀ ᴀᴄᴄᴇss ᴍᴀɴᴜᴀʟʟʏ ʜᴀᴛᴀ ᴅɪʏᴀ ɢᴀʏᴀ ʜᴀɪ. Aᴅᴍɪɴ sᴇ ᴘʜɪʀsᴇ ᴘᴇʀᴍɪssɪᴏɴ ʟᴇɪɴ.`); 
        return false; 
    }

    if (adminConfig.admins.includes(userId)) return true;

    if (adminConfig.approvalRequired && !adminConfig.allowedUsers.includes(userId)) { 
        safeSend(chatId, `🔒 *AUTHORIZATION REQUIRED*\nAᴄᴄᴇss ᴅᴇɴɪᴇᴅ. Pʟᴇᴀsᴇ ᴄᴏɴᴛᴀᴄᴛ ᴛʜᴇ ᴀᴅᴍɪɴɪsᴛʀᴀᴛᴏʀ.`); 
        return false; 
    }

    if (adminConfig.fsubEnabled && adminConfig.fsubChannels.length > 0) {
        let isSubscribed = true;
        let joinButtons = [];
        for (let ch of adminConfig.fsubChannels) {
            try {
                const member = await tgBot.getChatMember(ch.id, userId);
                if (member.status === 'left' || member.status === 'kicked') {
                    isSubscribed = false; joinButtons.push([{ text: `📢 Jᴏɪɴ Cʜᴀɴɴᴇʟ`, url: ch.link }]);
                }
            } catch (e) { isSubscribed = false; joinButtons.push([{ text: `📢 Jᴏɪɴ Cʜᴀɴɴᴇʟ`, url: ch.link }]); }
        }
        if (!isSubscribed) { safeSend(chatId, `⚠️ *ACCESS DENIED*\n\nPʟᴇᴀsᴇ ᴊᴏɪɴ ᴏᴜʀ ᴏғғɪᴄɪᴀʟ ᴄʜᴀɴɴᴇʟs ᴛᴏ ᴜsᴇ VORTEX!`, { reply_markup: { inline_keyboard: joinButtons } }); return false; }
    }
    return true;
}

function hasFeatureAccess(userId, featureKey) {
    let role = 'user';
    if (userId === OWNER_ID) role = 'owner';
    else if (adminConfig.admins.includes(userId)) role = 'admin';
    return adminConfig.featurePerms[featureKey] && adminConfig.featurePerms[featureKey].includes(role);
}

// ============================================================================
// 🚀 6. WHATSAPP ENGINE (MEMORY OPTIMIZED MAPS & FIX)
// ============================================================================
function startWhatsAppClient(userId, chatId, cleanNumber) {
    const session = activeClients.get(userId);
    if (session && session.status === 'initializing') return safeSend(chatId, `⚠️ VORTEX ɪɴɪᴛɪᴀʟɪᴢᴀᴛɪᴏɴ ɪs ᴀʟʀᴇᴀᴅʏ ɪɴ ᴘʀᴏɢʀᴇss...`);

    safeSend(chatId, `📡 *Pʜᴀsᴇ 1: Lᴀᴜɴᴄʜɪɴɢ VORTEX Eɴɢɪɴᴇ...*`);
    // 🔥 V48.3 FIX: Removed the invalid option pairWithPhoneNumber. Now handled manually via API Hook.
    const clientOptions = { authStrategy: new LocalAuth({ clientId: `user_${userId}`, dataPath: './multi_sessions' }), puppeteer: puppeteerOptions };

    const client = new Client(clientOptions);
    activeClients.set(userId, { client: client, status: 'initializing', isReady: false });
    
    // 🔥 V48.3 THE FIX: Real Pairing Code Interception from QR Event
    let pairingCodeRequested = false;
    client.on('qr', async (qr) => { 
        if (cleanNumber && !pairingCodeRequested) {
            pairingCodeRequested = true;
            try {
                await new Promise(r => setTimeout(r, 2500)); // Crucial delay to let Meta API generate code
                const code = await client.requestPairingCode(cleanNumber);
                const formattedCode = code ? code.match(/.{1,4}/g).join('-') : 'UNKNOWN';
                safeSend(chatId, `✅ *AUTHENTICATION CODE:*\n\nNᴜᴍʙᴇʀ: +${cleanNumber}\nTᴏᴋᴇɴ: \`${formattedCode}\`\n\n_Eɴᴛᴇʀ ᴛʜɪs ᴄᴏᴅᴇ ɪɴ ʏᴏᴜʀ Lɪɴᴋᴇᴅ Dᴇᴠɪᴄᴇs sᴇᴄᴛɪᴏɴ ᴏɴ WʜᴀᴛsAᴘᴘ._`);
            } catch (err) {
                safeSend(chatId, `❌ Cᴏᴅᴇ Gᴇɴᴇʀᴀᴛɪᴏɴ Fᴀɪʟᴇᴅ: ${err.message}\n_Rᴇ-ᴄʜᴇᴄᴋ ᴛʜᴇ ɴᴜᴍʙᴇʀ ᴏʀ ᴛʀʏ ᴀɢᴀɪɴ ʟᴀᴛᴇʀ._`);
                pairingCodeRequested = false;
            }
        }
    });

    client.on('authenticated', () => { 
        const currentSession = activeClients.get(userId);
        if (currentSession) { currentSession.isReady = true; currentSession.status = 'connected'; safeSend(chatId, `✅ *AUTHENTICATION SUCCESSFUL*\nWʜᴀᴛsAᴘᴘ sᴇssɪᴏɴ ᴠᴇʀɪғɪᴇᴅ. Tʏᴘᴇ /start ᴛᴏ ᴀᴄᴄᴇss ᴅᴀsʜʙᴏᴀʀᴅ.`); } 
    });
    client.on('ready', () => { 
        const currentSession = activeClients.get(userId);
        if (currentSession) { currentSession.isReady = true; currentSession.status = 'connected'; } 
    });

    client.on('disconnected', async (reason) => { 
        safeSend(chatId, `🚨 *YOUR WA DISCONNECTED*\nRᴇᴀsᴏɴ: ${reason}\n\nSᴇssɪᴏɴ ᴇxᴘɪʀᴇᴅ. Pʜɪʀsᴇ ʟᴏɢɪɴ ᴋᴀʀᴏ!`); 
        activeClients.delete(userId); 
        await client.destroy().catch(()=>{}); 
        const sessionPath = path.join(__dirname, 'multi_sessions', `session-user_${userId}`);
        if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
    });
    
    client.on('message', async (msg) => {
        const sec = getSecurityConfig(userId); 
        if (!sec.enabled) return; 

        try {
            const chatGid = msg.from; 
            if (!chatGid.endsWith('@g.us')) return; 
            if (sec.targetMode !== 'ALL' && !sec.targetGroups.includes(chatGid)) return;

            const authorId = msg.author; 
            if (!authorId) return;

            const authorNum = authorId.split('@')[0];
            if (sec.vipNumbers.includes(authorNum)) return;
            
            let shouldDelete = false;
            let matchedCode = sec.countries.find(c => authorNum.startsWith(c));
            
            if (sec.ruleType === 'WHITELIST') { if (sec.countries.length > 0 && !matchedCode) shouldDelete = true; } 
            else if (sec.ruleType === 'BLACKLIST') { if (matchedCode) shouldDelete = true; }

            if (!shouldDelete) return;
            if (!client.info || !client.info.wid) return;

            const chat = await msg.getChat();
            const botId = client.info.wid._serialized;
            const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            
            if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) return;
            const authPart = chat.participants.find(p => p.id._serialized === authorId);
            if (authPart && (authPart.isAdmin || authPart.isSuperAdmin)) return; 

            await new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
            msg.delete(true).catch(()=>{});
            
            sec.stats.deleted += 1;
            saveAdminConfig();
            
            let msgContent = msg.hasMedia ? '[MEDIA / STICKER]' : msg.body;
            
            if (!sec.violations[authorId]) sec.violations[authorId] = 0;
            sec.violations[authorId] += 1;
            saveAdminConfig();
            
            const strikes = sec.violations[authorId];

            if (strikes >= sec.strikeCount && sec.autoKickEnabled) {
                await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
                chat.removeParticipants([authorId]).catch(()=>{});
                sec.stats.kicked += 1;
                safeSend(OWNER_ID, `⚔️ *AUTO KICK EXECUTED*\n${DIVIDER}\n🎯 Gʀᴏᴜᴘ: ${chat.name}\n💀 Tᴀʀɢᴇᴛ: +${authorNum}\n⚠️ Rᴇᴀsᴏɴ: ${strikes} Sᴛʀɪᴋᴇs Rᴇᴀᴄʜᴇᴅ.`);
                sec.violations[authorId] = 0; saveAdminConfig();
            } else {
                let sWarn = sec.autoKickEnabled ? `⚠️ Sᴛʀɪᴋᴇ: ${strikes}/${sec.strikeCount}` : `⚠️ Sᴛʀɪᴋᴇ: ${strikes} (Aᴜᴛᴏ-Kɪᴄᴋ OFF)`;
                safeSend(OWNER_ID, `🛡️ *VORTEX ALERT: MESSAGE INTERCEPTED*\n${DIVIDER}\n🎯 Gʀᴏᴜᴘ: ${chat.name}\n👤 Sᴇɴᴅᴇʀ: +${authorNum}\n📄 Msɢ: _"${msgContent}"_\n${sWarn}\n💥 Aᴄᴛɪᴏɴ: Iɴsᴛᴀɴᴛʟʏ Dᴇʟᴇᴛᴇᴅ`);
            }
        } catch (e) {}
    });
    
    client.initialize().catch(async (e) => { activeClients.delete(userId); await client.destroy().catch(()=>{}); });
}

if (fs.existsSync('./multi_sessions')) {
    fs.readdirSync('./multi_sessions').forEach(dir => {
        if (dir.startsWith('session-user_')) { 
            const uId = dir.split('session-user_')[1];
            startWhatsAppClient(uId, uId, null); 
        }
    });
}

// ============================================================================
// 🛡️ 7. PANELS & MENUS
// ============================================================================
function sendAdminPanel(chatId, userId) {
    getState(userId).action = null;
    let adminKeyboard = {
        inline_keyboard: [
            [{ text: `📢 Bʀᴏᴀᴅᴄᴀsᴛ ᴛᴏ Bᴏᴛ Usᴇʀs (${knownBotUsers.length})`, callback_data: 'admin_bot_broadcast' }],
            [{ text: `📢 Fᴏʀᴄᴇ Sᴜʙ: ${adminConfig.fsubEnabled ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_fsub' }, 
             { text: `🔒 Aᴘᴘʀᴏᴠᴀʟ: ${adminConfig.approvalRequired ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_approval' }],
            [{ text: `🔔 Aʟᴇʀᴛs: ${adminConfig.botAlerts ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_alerts' }],
            [{ text: '✅ Aʟʟᴏᴡ Usᴇʀ', callback_data: 'admin_allow_user' }, { text: '❌ Rᴇᴠᴏᴋᴇ', callback_data: 'admin_revoke_user' }],
            [{ text: '➕ Aᴅᴅ Aᴅᴍɪɴ 👑', callback_data: 'admin_add_admin' }, { text: '➖ Mᴀɴᴀɢᴇ Aᴅᴍɪɴs 👑', callback_data: 'admin_manage_admins' }],
            [{ text: '➕ Aᴅᴅ F-Sᴜʙ 📺', callback_data: 'admin_add_fsub' }, { text: '➖ Mᴀɴᴀɢᴇ F-Sᴜʙs 📺', callback_data: 'admin_manage_fsubs' }],
            [{ text: '🚫 Bᴀɴ Usᴇʀ', callback_data: 'admin_ban_user' }, { text: '♻️ Uɴʙᴀɴ', callback_data: 'admin_unban_user' }],
            [{ text: '⚙️ Fᴇᴀᴛᴜʀᴇ Pᴇʀᴍs', callback_data: 'admin_feature_permissions' }],
            [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_main_menu' }]
        ]
    };
    safeSend(chatId, `👑 *VORTEX ADMIN PANEL*\nTᴏᴛᴀʟ Sʏsᴛᴇᴍ Usᴇʀs: ${knownBotUsers.length}`, { reply_markup: adminKeyboard });
}

function sendShieldMenu(chatId, userId, msgId = null) {
    const sec = getSecurityConfig(userId);
    const isEng = getState(userId).language === 'Eɴɢʟɪsʜ';
    
    let targetText = '🌐 ALL GROUPS';
    if (sec.targetMode === 'SELECTED') targetText = `🎯 SELECTED (${sec.targetGroups.length})`;
    else if (sec.targetMode === 'LINKS') targetText = `🔗 VIA LINKS (${sec.targetGroups.length})`;
    
    let modeHelp = sec.ruleType === 'WHITELIST' 
        ? (isEng ? "ℹ️ *INFO:* Oɴʟʏ ᴄᴏᴜɴᴛʀɪᴇs ɪɴ ᴛʜɪs ʟɪsᴛ ᴄᴀɴ ᴍᴇssᴀɢᴇ. Oᴛʜᴇʀs ᴡɪʟʟ ʙᴇ ᴅᴇʟᴇᴛᴇᴅ!" : "ℹ️ *INFO:* Sɪʀғ ᴡᴀʜɪ ᴅᴇsʜ MSG ᴋᴀʀ ᴘᴀʏᴇɴɢᴇ ᴊᴏ ʟɪsᴛ ᴍᴇ ʜᴀɪɴ. Bᴀᴀᴋɪ sᴀʙ ᴅᴇʟᴇᴛᴇ ʜᴏɴɢᴇ!")
        : (isEng ? "ℹ️ *INFO:* Cᴏᴜɴᴛʀɪᴇs ɪɴ ᴛʜɪs ʟɪsᴛ ᴡɪʟʟ ʙᴇ ɪɴsᴛᴀɴᴛʟʏ ᴅᴇʟᴇᴛᴇᴅ!" : "ℹ️ *INFO:* Jᴏ ᴅᴇsʜ ʟɪsᴛ ᴍᴇ ʜᴀɪɴ, ᴜɴᴋᴇ MSG ᴛᴜʀᴀɴᴛ ᴅᴇʟᴇᴛᴇ ʜᴏɴɢᴇ!");
        
    let helpBtnText = isEng ? '📖 Hᴏᴡ ᴅᴏᴇs ᴛʜɪs ᴡᴏʀᴋ?' : '📖 Yᴇ Kᴀɪsᴇ Kᴀᴀᴍ Kᴀʀᴛᴀ ʜᴀɪ?';

    const txt = `🛡️ *AUTO DELETE GC MSG*\n${DIVIDER}\n` +
                `*Mᴀsᴛᴇʀ Pᴏᴡᴇʀ:* ${sec.enabled ? '🟢 ONLINE' : '🔴 OFFLINE'}\n` +
                `*Tᴀʀɢᴇᴛ Sᴄᴏᴘᴇ:* ${targetText}\n` +
                `*Rᴜʟᴇs Mᴏᴅᴇ:* ${sec.ruleType === 'WHITELIST' ? '🟢 ALLOW ONLY (Wʜɪᴛᴇʟɪsᴛ)' : '🔴 BAN COUNTRIES (Bʟᴀᴄᴋʟɪsᴛ)'}\n` +
                `*Aᴜᴛᴏ-Kɪᴄᴋ (3 Sᴛʀɪᴋᴇs):* ${sec.autoKickEnabled ? '⚡ ON' : '⏸️ OFF'}\n\n` +
                `${modeHelp}\n\n` +
                `🌐 *Cᴏᴅᴇs:* ${sec.countries.length > 0 ? sec.countries.join(', ') : 'Nᴏɴᴇ'}\n` +
                `👑 *VIP Nᴜᴍʙᴇʀs:* ${sec.vipNumbers.length > 0 ? sec.vipNumbers.join(', ') : 'Nᴏɴᴇ'}\n`;
    
    const kb = { 
        inline_keyboard: [
            [{ text: `🛡️ Sʏsᴛᴇᴍ Pᴏᴡᴇʀ: ${sec.enabled ? 'TURN OFF' : 'TURN ON'}`, callback_data: 'sec_toggle_power' }],
            [{ text: `🎯 Tᴀʀɢᴇᴛ Sᴄᴏᴘᴇ: ${sec.targetMode}`, callback_data: 'sec_menu_targets' }],
            [{ text: `🔄 Sᴡɪᴛᴄʜ ᴛᴏ ${sec.ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST'}`, callback_data: 'sec_toggle_mode' }],
            [{ text: `⚡ Aᴜᴛᴏ-Kɪᴄᴋ: ${sec.autoKickEnabled ? '🟢 ON' : '🔴 OFF'}`, callback_data: 'sec_toggle_autokick' }],
            [{ text: `➕ Aᴅᴅ Cᴏᴅᴇ (+91)`, callback_data: 'sec_add_country' }, { text: `➖ Rᴇᴍᴏᴠᴇ Cᴏᴅᴇ`, callback_data: 'sec_rem_country' }],
            [{ text: `👑 Aᴅᴅ VIP Nᴜᴍʙᴇʀ`, callback_data: 'sec_add_vip' }, { text: `➖ Rᴇᴍᴏᴠᴇ VIP`, callback_data: 'sec_rem_vip' }],
            [{ text: helpBtnText, callback_data: 'sec_help_guide' }],
            [{ text: '🔙 Bᴀᴄᴋ ᴛᴏ Mᴇɴᴜ', callback_data: 'btn_main_menu' }]
        ]
    };
    
    if (msgId) tgBot.editMessageText(txt, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{});
    else safeSend(chatId, txt, { reply_markup: kb });
}

function sendMainMenu(chatId, userId) {
    const state = getState(userId);
    state.action = null; 
    
    const session = activeClients.get(userId);
    const isReady = session && session.isReady;
    const t = texts[state.language] || texts['Eɴɢʟɪsʜ'];
    let inlineKeyboard = [];
    
    if (!isReady && hasFeatureAccess(userId, 'login')) inlineKeyboard.push([{ text: t.login, callback_data: 'menu_login' }]);
    else if (isReady) inlineKeyboard.push([{ text: `🔓 Lᴏɢᴏᴜᴛ (Wɪᴘᴇ Sᴇssɪᴏɴ)`, callback_data: 'menu_logout_confirm' }]);
    
    let row1 = [], row2 = [], row3 = [], row4 = [];
    if (hasFeatureAccess(userId, 'creategroup')) row1.push({ text: t.autoGroup, callback_data: 'menu_creategroup' });
    if (hasFeatureAccess(userId, 'joingroup')) row1.push({ text: t.join, callback_data: 'menu_joingroup' });
    if (row1.length > 0) inlineKeyboard.push(row1);
    
    if (hasFeatureAccess(userId, 'renamegroups')) row2.push({ text: t.rename, callback_data: 'menu_rename_groups' });
    if (hasFeatureAccess(userId, 'extractlinks')) row2.push({ text: t.extract, callback_data: 'menu_extractlinks' });
    if (row2.length > 0) inlineKeyboard.push(row2);
    
    if (hasFeatureAccess(userId, 'approve')) row3.push({ text: t.approve, callback_data: 'menu_approve' });
    if (hasFeatureAccess(userId, 'autokick')) row3.push({ text: t.kick, callback_data: 'menu_autokick' });
    if (row3.length > 0) inlineKeyboard.push(row3);
    
    if (hasFeatureAccess(userId, 'broadcast')) row4.push({ text: t.broadcast, callback_data: 'menu_broadcast' });
    if (hasFeatureAccess(userId, 'stats')) row4.push({ text: t.stats, callback_data: 'menu_stats' });
    if (row4.length > 0) inlineKeyboard.push(row4);
    
    if (hasFeatureAccess(userId, 'security')) inlineKeyboard.push([{ text: t.shield, callback_data: 'menu_security' }]);
    inlineKeyboard.push([{ text: `🌐 ${t.lang}: ${state.language}`, callback_data: 'menu_toggle_lang' }]);
    
    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) {
        inlineKeyboard.push([{ text: `👑 VORTEX ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    }
    
    const humanStatus = isReady ? t.statusOnline : t.statusOffline;
    const menuText = `${t.menuTitle} \n${DIVIDER}\n${t.statusLabel}: ${humanStatus}${FOOTER}`;
    safeSend(chatId, menuText, { reply_markup: { inline_keyboard: inlineKeyboard } });
}

tgBot.onText(/\/start/, async (msg) => { if (await checkAccess(msg.from.id, msg.chat.id, msg)) sendMainMenu(msg.chat.id, msg.from.id); });
tgBot.onText(/\/admin/, async (msg) => { 
    if (await checkAccess(msg.from.id, msg.chat.id, msg)) {
        if (msg.from.id === OWNER_ID || adminConfig.admins.includes(msg.from.id)) sendAdminPanel(msg.chat.id, msg.from.id);
    }
});

// ============================================================================
// ⌨️ 9. CALLBACK QUERIES
// ============================================================================
tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; const userId = query.from.id; const data = query.data; const state = getState(userId);
    const session = activeClients.get(userId); const uClient = session ? session.client : null;
    
    tgBot.answerCallbackQuery(query.id).catch(()=>{});
    if (!(await checkAccess(userId, chatId, query))) return;

    if (data === 'btn_main_menu') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return sendMainMenu(chatId, userId); }
    if (data === 'btn_admin_panel') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return sendAdminPanel(chatId, userId); }
    
    if (data === 'menu_stats') {
        const sec = getSecurityConfig(userId);
        return safeSend(chatId, `📊 *VORTEX STATS REPORT*\n${DIVIDER}\n🗑️ *Sᴘᴀᴍ Mᴇssᴀɢᴇs Dᴇʟᴇᴛᴇᴅ:* ${sec.stats.deleted}\n⚔️ *Sᴘᴀᴍᴍᴇʀs Kɪᴄᴋᴇᴅ:* ${sec.stats.kicked}\n\n_Sʏsᴛᴇᴍ ɪs ᴍᴏɴɪᴛᴏʀɪɴɢ 24/7!_`);
    }

    if (data === 'sec_help_guide') {
        const isEng = state.language === 'Eɴɢʟɪsʜ';
        const helpText = isEng 
            ? `📖 *HOW THIS WORKS*\n\n1. *Add Code (+91):* Iғ ʏᴏᴜ ᴏɴʟʏ ᴡᴀɴᴛ Iɴᴅɪᴀɴ ɴᴜᴍʙᴇʀs ᴛᴏ ᴍᴇssᴀɢᴇ, ᴀᴅᴅ 91.\n2. *VIP Number:* Tʜᴇ ʙᴏᴛ ᴡɪʟʟ NEVER ᴅᴇʟᴇᴛᴇ ᴍᴇssᴀɢᴇs ғʀᴏᴍ ɴᴜᴍʙᴇʀs ɪɴ ᴛʜɪs ʟɪsᴛ.\n3. *Auto-Kick:* Iғ sᴏᴍᴇᴏɴᴇ ʙʀᴇᴀᴋs ʀᴜʟᴇs 3 ᴛɪᴍᴇs, ᴛʜᴇʏ ᴡɪʟʟ ʙᴇ ᴋɪᴄᴋᴇᴅ.`
            : `📖 *HOW THIS WORKS*\n\n1. *Add Code (+91):* Aɢᴀʀ ᴀᴀᴘ ᴄʜᴀʜᴛᴇ ʜᴀɪɴ ᴋɪ sɪʀғ Iɴᴅɪᴀɴ ɴᴜᴍʙᴇʀs ᴍᴇssᴀɢᴇ ᴋᴀʀᴇɪɴ, ᴛᴏʜ 91 ᴀᴅᴅ ᴋᴀʀᴇɪɴ.\n2. *VIP Number:* Bᴏᴛ ɪɴ ɴᴜᴍʙᴇʀs ᴋᴏ ᴋᴀʙʜɪ ᴅᴇʟᴇᴛᴇ ɴᴀʜɪ ᴋᴀʀᴇɢᴀ.\n3. *Auto-Kick:* 3 ᴍᴇssᴀɢᴇs ᴅᴇʟᴇᴛᴇ ʜᴏɴᴇ ᴋᴇ ʙᴀᴀᴅ ʙᴏᴛ ᴜsᴋᴏ ɴɪᴋᴀʟ ᴅᴇɢᴀ.`;
        return safeSend(chatId, helpText); 
    }

    if (data === 'menu_logout_confirm') {
        return tgBot.editMessageText(`⚠️ *WARNING: WIPE SESSION*\n\nAʀᴇ ʏᴏᴜ sᴜʀᴇ ʏᴏᴜ ᴡᴀɴᴛ ᴛᴏ ʟᴏɢ ᴏᴜᴛ? Tʜɪs ᴡɪʟʟ ᴡɪᴘᴇ ʏᴏᴜʀ ᴄᴜʀʀᴇɴᴛ sᴇssɪᴏɴ ᴅᴀᴛᴀ ᴄᴏᴍᴘʟᴇᴛᴇʟʏ.`, {
            chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [ [{ text: '✔️ Yᴇs, Wɪᴘᴇ Eᴠᴇʀʏᴛʜɪɴɢ', callback_data: 'menu_logout_execute' }], [{ text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu' }] ] }
        });
    }

    if (data === 'menu_logout_execute') {
        if (session) {
            try {
                tgBot.editMessageText(`⏳ *Exᴇᴄᴜᴛɪɴɢ Dᴇᴇᴘ Wɪᴘᴇ Pʀᴏᴛᴏᴄᴏʟ...*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }).catch(()=>{});
                if (session.client) { await session.client.logout().catch(()=>{}); await session.client.destroy().catch(()=>{}); }
                const sessionPath = path.join(__dirname, 'multi_sessions', `session-user_${userId}`);
                if (fs.existsSync(sessionPath)) fs.rmSync(sessionPath, { recursive: true, force: true });
                activeClients.delete(userId);
                safeSend(chatId, `✅ *SUCCESSFUL DISCONNECT*\nYᴏᴜʀ ᴘʀᴇᴠɪᴏᴜs sᴇssɪᴏɴ ʜᴀs ʙᴇᴇɴ ᴡɪᴘᴇᴅ.`);
                return sendMainMenu(chatId, userId);
            } catch (e) { return safeSend(chatId, `❌ Aɴ ᴇʀʀᴏʀ ᴏᴄᴄᴜʀʀᴇᴅ ᴡʜɪʟᴇ ᴡɪᴘɪɴɢ ᴛʜᴇ sᴇssɪᴏɴ.`); }
        } else { return safeSend(chatId, `⚠️ Nᴏ ᴀᴄᴛɪᴠᴇ sᴇssɪᴏɴ ғᴏᴜɴᴅ.`); }
    }
    
    if (data === 'menu_toggle_lang') { 
        if (state.language === 'Eɴɢʟɪsʜ') state.language = 'Hɪɴɢʟɪsʜ';
        else if (state.language === 'Hɪɴɢʟɪsʜ') state.language = 'Iɴᴅᴏɴᴇsɪᴀɴ';
        else state.language = 'Eɴɢʟɪsʜ';
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
        return sendMainMenu(chatId, userId);
    }
    
    if (data === 'admin_bot_broadcast') {
        state.action = 'WAIT_BOT_BROADCAST_MSG';
        return tgBot.editMessageText(`📢 *UNIVERSAL BOT BROADCAST*\n\nSᴇɴᴅ ʏᴏᴜʀ ᴘᴀʏʟᴏᴀᴅ (Tᴇxᴛ, Iᴍᴀɢᴇ, Vɪᴅᴇᴏ, Fɪʟᴇ).\nTᴏᴛᴀʟ Tᴀʀɢᴇᴛs: ${knownBotUsers.length}`, { 
            chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } 
        });
    }

    if (data === 'sec_menu_targets') {
        const kb = { inline_keyboard: [[{ text: `🌐 Aᴘᴘʟʏ ᴛᴏ ALL GROUPS`, callback_data: 'sec_tgt_all' }], [{ text: `🎯 SELECT FROM LIST`, callback_data: 'sec_tgt_select' }], [{ text: `🔗 APPLY VIA LINKS`, callback_data: 'sec_tgt_links' }], [{ text: `🔙 Bᴀᴄᴋ`, callback_data: 'menu_security' }]] };
        return tgBot.editMessageText(`🎯 *TARGET SELECTION*\nKᴀᴜɴsᴇ ɢʀᴏᴜᴘs ᴘᴀʀ sʏsᴛᴇᴍ ʟᴀɢᴀɴᴀ ʜᴀɪ?`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }

    if (data === 'sec_tgt_all') { getSecurityConfig(userId).targetMode = 'ALL'; getSecurityConfig(userId).targetGroups = []; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
    if (data === 'sec_tgt_links') { state.action = 'WAIT_SEC_LINKS'; return tgBot.editMessageText(`🔗 *SETUP VIA LINKS*\nPʟᴇᴀsᴇ sᴇɴᴅ ɪɴᴠɪᴛᴇ ʟɪɴᴋs:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'menu_security'}]] } }); }

    if (data === 'sec_tgt_select') {
        if (!uClient || !uClient.info) return safeSend(chatId, "⚠️ Sʏsᴛᴇᴍ ɪs ᴏғғʟɪɴᴇ. Pʟᴇᴀsᴇ ᴀᴜᴛʜᴇɴᴛɪᴄᴀᴛᴇ.");
        let statusMsg = await safeSend(chatId, "📡 *Sᴄᴀɴɴɪɴɢ ᴘʀɪᴠɪʟᴇɢᴇs...*");
        try {
            const chats = await uClient.getChats();
            state.adminGroups = chats.filter(c => c.isGroup && c.participants.find(p => p.id.user === uClient.info.wid.user && (p.isAdmin || p.isSuperAdmin))).map(c => ({ id: c.id._serialized, name: c.name }));
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            if (state.adminGroups.length === 0) return safeSend(chatId, "❌ Aᴅᴍɪɴ ʀɪɢʜᴛs ɴᴏᴛ ғᴏᴜɴᴅ.");
            state.currentPage = 0; state.selectedGroupsArray = [...getSecurityConfig(userId).targetGroups]; state.flowContext = 'SHIELD_TARGETS';
            return tgBot.editMessageText('🎯 *SELECT TARGETS:*', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) {}
    }

    if (data === 'menu_security') return sendShieldMenu(chatId, userId, query.message.message_id);
    if (data === 'sec_toggle_power') { getSecurityConfig(userId).enabled = !getSecurityConfig(userId).enabled; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
    if (data === 'sec_toggle_mode') { getSecurityConfig(userId).ruleType = getSecurityConfig(userId).ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST'; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
    if (data === 'sec_toggle_autokick') { getSecurityConfig(userId).autoKickEnabled = !getSecurityConfig(userId).autoKickEnabled; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
    
    if (data === 'sec_add_country') { state.action = 'WAIT_SEC_ADD_COUNTRY'; return tgBot.editMessageText(`🌐 *ADD COUNTRY CODE*\nEɴᴛᴇʀ ᴄᴏᴅᴇ (e.g. 91):`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'menu_security'}]] } }); }
    if (data === 'sec_rem_country') { state.action = 'WAIT_SEC_REM_COUNTRY'; return tgBot.editMessageText(`🌐 *REMOVE COUNTRY CODE*\nEɴᴛᴇʀ ᴄᴏᴅᴇ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'menu_security'}]] } }); }
    if (data === 'sec_add_vip') { state.action = 'WAIT_SEC_ADD_VIP'; return tgBot.editMessageText(`👤 *ADD VIP NUMBER*\nEɴᴛᴇʀ ɴᴜᴍʙᴇʀ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'menu_security'}]] } }); }
    if (data === 'sec_rem_vip') { state.action = 'WAIT_SEC_REM_VIP'; return tgBot.editMessageText(`👤 *REMOVE VIP NUMBER*\nEɴᴛᴇʀ ɴᴜᴍʙᴇʀ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'menu_security'}]] } }); }

    if (data === 'menu_login') { 
        state.action = 'WAITING_FOR_LOGIN_NUMBER';
        const msgTxt = `🔐 *LOGIN WA*\n${DIVIDER}\nPʟᴇᴀsᴇ ᴇɴᴛᴇʀ ʏᴏᴜʀ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ Cᴏᴜɴᴛʀʏ Cᴏᴅᴇ (Nᴏ '+').\n\n✅ Exᴀᴍᴘʟᴇ: \`919876543210\``;
        return tgBot.editMessageText(msgTxt, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu' }]] } });
    }

    if (data.startsWith('admin_')) {
        if (data === 'admin_allow_user') { state.action = 'WAITING_FOR_ALLOW_ID'; return tgBot.editMessageText(`✅ Pʀᴏᴠɪᴅᴇ ID ᴛᴏ ᴀʟʟᴏᴡ:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_revoke_user') { state.action = 'WAITING_FOR_REVOKE_ID'; return tgBot.editMessageText(`❌ Pʀᴏᴠɪᴅᴇ ID ᴛᴏ ʀᴇᴠᴏᴋᴇ:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_ban_user') { state.action = 'WAITING_FOR_BAN_ID'; return tgBot.editMessageText(`🚫 Pʀᴏᴠɪᴅᴇ ID ᴛᴏ ʙᴀɴ:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_unban_user') { state.action = 'WAITING_FOR_UNBAN_ID'; return tgBot.editMessageText(`♻️ Pʀᴏᴠɪᴅᴇ ID ᴛᴏ ᴜɴʙᴀɴ:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_add_admin') { state.action = 'WAITING_FOR_ADMIN_ID'; return tgBot.editMessageText(`👑 *ADD SUB-ADMIN*\nPʀᴏᴠɪᴅᴇ ɴᴇᴡ Aᴅᴍɪɴ's ID:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_manage_admins') {
            let kb = adminConfig.admins.map(id => ([{ text: `❌ Rᴇᴍᴏᴠᴇ: ${id}`, callback_data: `rem_admin_${id}` }])); kb.push([{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_admin_panel' }]);
            return tgBot.editMessageText(`👥 *MANAGE ADMINS*\nCʟɪᴄᴋ ᴛᴏ ʀᴇᴠᴏᴋᴇ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
        }
        if (data === 'admin_add_fsub') { state.action = 'WAITING_FOR_FSUB_DATA'; return tgBot.editMessageText(`📢 *ADD FORCE SUB*\nFᴏʀᴍᴀᴛ:\n\`@CʜᴀɴɴᴇʟID ʜᴛᴛᴘs://ʟɪɴᴋ.ᴄᴏᴍ\``, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_admin_panel'}]] } }); }
        if (data === 'admin_manage_fsubs') {
            let kb = adminConfig.fsubChannels.map(ch => ([{ text: `❌ Rᴇᴍᴏᴠᴇ: ${ch.id}`, callback_data: `rem_fsub_${ch.id}` }])); kb.push([{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_admin_panel' }]);
            return tgBot.editMessageText(`📺 *MANAGE FORCE SUBS*\nCʟɪᴄᴋ ᴛᴏ ʀᴇᴍᴏᴠᴇ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
        }
        
        if (data === 'admin_toggle_fsub') { adminConfig.fsubEnabled = !adminConfig.fsubEnabled; saveAdminConfig(); return sendAdminPanel(chatId, userId); }
        if (data === 'admin_toggle_approval') { adminConfig.approvalRequired = !adminConfig.approvalRequired; saveAdminConfig(); return sendAdminPanel(chatId, userId); }
        if (data === 'admin_toggle_alerts') { adminConfig.botAlerts = !adminConfig.botAlerts; saveAdminConfig(); return sendAdminPanel(chatId, userId); }

        if (data === 'admin_feature_permissions') {
            const kb = { inline_keyboard: [
                [{ text: '🔐 Lᴏɢɪɴ Aᴜᴛʜ', callback_data: 'perm_feat_login' }], [{ text: '➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘ', callback_data: 'perm_feat_creategroup' }, { text: '📥 Jᴏɪɴ Gʀᴏᴜᴘ', callback_data: 'perm_feat_joingroup' }],
                [{ text: '✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs', callback_data: 'perm_feat_renamegroups' }, { text: '🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs', callback_data: 'perm_feat_extractlinks' }], [{ text: '👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ', callback_data: 'perm_feat_approve' }, { text: '⚔️ Aᴜᴛᴏ Kɪᴄᴋ', callback_data: 'perm_feat_autokick' }],
                [{ text: '📢 Bʀᴏᴀᴅᴄᴀsᴛ', callback_data: 'perm_feat_broadcast' }, { text: '📊 Sᴛᴀᴛs', callback_data: 'perm_feat_stats' }], [{ text: '🛡️ Mᴀɴᴀɢᴇ GC Msɢ', callback_data: 'perm_feat_security' }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_admin_panel' }]
            ]};
            return tgBot.editMessageText(`⚙️ *FEATURE ACCESS CONTROL*\nSᴇʟᴇᴄᴛ ᴛᴏ ᴄᴏɴғɪɢᴜʀᴇ:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
        }
    }

    if (data.startsWith('perm_feat_')) {
        if (userId !== OWNER_ID) return tgBot.answerCallbackQuery(query.id, { text: '⚠️ Oᴡɴᴇʀ Oɴʟʏ!', show_alert: true });
        const featKey = data.split('perm_feat_')[1]; const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [ [{ text: `👑 Oᴡɴᴇʀ: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }], [{ text: `🛡️ Aᴅᴍɪɴ: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }], [{ text: `👤 Usᴇʀ: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'admin_feature_permissions' }] ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }
    
    if (data.startsWith('perm_tgl_')) {
        if (userId !== OWNER_ID) return;
        const parts = data.split('_'); const featKey = parts[2], roleKey = parts[3];
        if (adminConfig.featurePerms[featKey].includes(roleKey)) adminConfig.featurePerms[featKey] = adminConfig.featurePerms[featKey].filter(r => r !== roleKey); else adminConfig.featurePerms[featKey].push(roleKey);
        saveAdminConfig(); const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [ [{ text: `👑 Oᴡɴᴇʀ: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }], [{ text: `🛡️ Aᴅᴍɪɴ: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }], [{ text: `👤 Usᴇʀ: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'admin_feature_permissions' }] ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }

    if (data.startsWith('rem_')) {
        if (userId !== OWNER_ID) return tgBot.answerCallbackQuery(query.id, { text: 'Oᴡɴᴇʀ Oɴʟʏ!', show_alert: true });
        if (data.startsWith('rem_admin_')) { const id = parseInt(data.split('rem_admin_')[1]); adminConfig.admins = adminConfig.admins.filter(a => a !== id); saveAdminConfig(); return sendAdminPanel(chatId, userId); }
        if (data.startsWith('rem_fsub_')) { const chId = data.split('rem_fsub_')[1]; adminConfig.fsubChannels = adminConfig.fsubChannels.filter(c => c.id !== chId); saveAdminConfig(); return sendAdminPanel(chatId, userId); }
    }
    
    const menuActions = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast'];
    if (menuActions.includes(data)) {
        if (!session || !session.isReady) return safeSend(chatId, "⚠️ Sʏsᴛᴇᴍ ᴏғғʟɪɴᴇ. Pʟᴇᴀsᴇ ᴀᴜᴛʜᴇɴᴛɪᴄᴀᴛᴇ.");
        
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return tgBot.editMessageText("➕ *Pʜᴀsᴇ 1:* Bᴀsᴇ Nᴀᴍᴇ?", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS'; return tgBot.editMessageText("📥 *AUTO-JOIN*\nSᴇɴᴅ ɪɴᴠɪᴛᴇ ʟɪɴᴋs:", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA'; return tgBot.editMessageText("✏️ *MASS RENAMER*\nSᴇɴᴅ ᴘᴀɪʀs:", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
        
        let statusMsg = await safeSend(chatId, "📡 *Sᴄᴀɴɴɪɴɢ ᴘʀɪᴠɪʟᴇɢᴇs...*");
        try {
            const chats = await uClient.getChats();
            state.adminGroups = chats.filter(c => c.isGroup && c.participants.find(p => p.id.user === uClient.info.wid.user && (p.isAdmin || p.isSuperAdmin))).map(c => ({ id: c.id._serialized, name: c.name }));
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            if (state.adminGroups.length === 0) return safeSend(chatId, "❌ Aᴅᴍɪɴ ʀɪɢʜᴛs ɴᴏᴛ ғᴏᴜɴᴅ.");
            
            state.currentPage = 0; state.selectedGroupsArray = []; state.flowContext = data.replace('menu_', '').toUpperCase();
            return tgBot.editMessageText('🎯 *SELECT TARGETS:*', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { }
    }
    
    if (data === 'grp_skip_desc') { state.groupConfig.desc = ''; state.action = 'WAIT_GROUP_PFP'; return tgBot.editMessageText("🖼️ *Pʜᴀsᴇ 5:* Sᴇɴᴅ DP.", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '⏩ Sᴋɪᴘ DP', callback_data: 'grp_skip_pfp'}]] } }); }
    if (data === 'grp_skip_pfp') { state.groupConfig.pfpPath = null; state.action = null; return sendGroupSettingsMenu(chatId, userId, query.message.message_id); }
    if (data.startsWith('grp_tgl_')) { const setKey = data.replace('grp_tgl_', ''); state.groupConfig.settings[setKey] = !state.groupConfig.settings[setKey]; return sendGroupSettingsMenu(chatId, userId, query.message.message_id); }
    if (data === 'grp_deploy_now') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startGroupCreationProcess(chatId, userId, uClient); }

    if (data === 'confirm_selection') {
        if (state.flowContext === 'SHIELD_TARGETS') { getSecurityConfig(userId).targetMode = 'SELECTED'; getSecurityConfig(userId).targetGroups = [...state.selectedGroupsArray]; saveAdminConfig(); return sendShieldMenu(chatId, userId, query.message.message_id); }
        if (state.flowContext === 'BROADCAST') { state.action = 'WAIT_BROADCAST_MSG'; return tgBot.editMessageText("📢 *Tʏᴘᴇ Bʀᴏᴀᴅᴄᴀsᴛ Pᴀʏʟᴏᴀᴅ:*", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
        if (state.flowContext === 'AUTOKICK') { state.action = 'WAIT_KICK_TERM'; return tgBot.editMessageText("⚔️ *Tʏᴘᴇ Tᴀʀɢᴇᴛ:*", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
        if (state.flowContext === 'EXTRACTLINKS') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return extractGroupLinksEngine(chatId, userId, uClient); }
        if (state.flowContext === 'APPROVE') { 
            const kb = { inline_keyboard: [ [{ text: '🔓 Tᴜʀɴ OFF Aᴘᴘʀᴏᴠᴀʟ', callback_data: 'approve_opt_off' }], [{ text: '✔️ Exᴇᴄᴜᴛᴇ Mᴀɴᴜᴀʟ', callback_data: 'approve_opt_manual' }], [{ text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu' }] ]};
            return tgBot.editMessageText(`👥 *METHOD?*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
        }
    }

    if (data === 'approve_opt_off' || data === 'approve_opt_manual') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return autoApproveEngine(chatId, userId, uClient, data === 'approve_opt_off' ? 'OFF_SETTING' : 'MANUAL'); }
    if (data.startsWith('selgrp_')) { const id = data.split('_')[1]; if (state.selectedGroupsArray.includes(id)) state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); else state.selectedGroupsArray.push(id); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    if (data === 'select_all') { state.selectedGroupsArray = 'ALL'; return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    if (data.startsWith('page_')) { state.currentPage = parseInt(data.split('_')[1]); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
});

function getPaginationKeyboard(userId) {
    const state = getState(userId); const start = state.currentPage * 5; const items = state.adminGroups.slice(start, start + 5);
    let kb = [[{ text: 'Sᴇʟᴇᴄᴛ ALL', callback_data: 'select_all' }]];
    items.forEach(g => { const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); });
    let navRow = [];
    if (state.currentPage > 0) navRow.push({ text: '◀️ Pʀᴇᴠ', callback_data: `page_${state.currentPage - 1}` });
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) navRow.push({ text: 'Nᴇxᴛ ▶️', callback_data: `page_${state.currentPage + 1}` });
    if (navRow.length > 0) kb.push(navRow);
    kb.push([{ text: `⚡ Cᴏɴғɪʀᴍ Sᴇʟᴇᴄᴛɪᴏɴ`, callback_data: 'confirm_selection' }]); kb.push([{ text: `❌ Cᴀɴᴄᴇʟ`, callback_data: 'btn_main_menu' }]);
    return { inline_keyboard: kb };
}

function sendGroupSettingsMenu(chatId, userId, msgId) {
    const state = getState(userId);
    const kb = { inline_keyboard: [ [{ text: `🔒 Aᴅᴍɪɴ Oɴʟʏ Msɢ: ${state.groupConfig.settings.msgsAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_msgsAdminOnly' }], [{ text: `✏️ Aᴅᴍɪɴ Oɴʟʏ Eᴅɪᴛ: ${state.groupConfig.settings.infoAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_infoAdminOnly' }], [{ text: `🚀 LAUNCH DEPLOYMENT`, callback_data: 'grp_deploy_now' }], [{ text: `❌ Cᴀɴᴄᴇʟ`, callback_data: 'btn_main_menu' }] ] };
    if (msgId) tgBot.editMessageText(`⚙️ *Pʜᴀsᴇ 6: Pᴇʀᴍɪssɪᴏɴs*`, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{}); else safeSend(chatId, `⚙️ *Pʜᴀsᴇ 6: Pᴇʀᴍɪssɪᴏɴs*`, { reply_markup: kb });
}

// ============================================================================
// 📥 10. TEXT / MEDIA INPUT HANDLER
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; const userId = msg.from.id; const text = msg.text || ''; const state = getState(userId);

    if (text.startsWith('/') || !(await checkAccess(userId, chatId, msg))) return;

    if (state.action === 'WAIT_BOT_BROADCAST_MSG') {
        state.action = null; let targets = [...knownBotUsers]; if (targets.length === 0) return safeSend(chatId, `⚠️ Nᴏ ᴜsᴇʀs ɪɴ ᴅᴀᴛᴀʙᴀsᴇ.`);
        let statusMsg = await safeSend(chatId, `⏳ *Tʀᴀɴsᴍɪᴛᴛɪɴɢ Pᴀʏʟᴏᴀᴅ ᴛᴏ ${targets.length} ᴜsᴇʀs...*`);
        let success = 0; let failed = 0;
        for (let i = 0; i < targets.length; i++) {
            try { await tgBot.copyMessage(targets[i], chatId, msg.message_id); success++; } catch (e) { failed++; }
            await new Promise(r => setTimeout(r, 60)); 
            if ((i + 1) % 15 === 0 && statusMsg) tgBot.editMessageText(`⏳ *Tʀᴀɴsᴍɪᴛᴛɪɴɢ...*\n${createProgressBar(i+1, targets.length)}`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
        }
        if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
        return safeSend(chatId, `📢 *BOT BROADCAST REPORT*\n${DIVIDER}\n🎯 *Tᴏᴛᴀʟ Tᴀʀɢᴇᴛs:* ${targets.length}\n✅ *Sᴜᴄᴄᴇssғᴜʟ:* ${success}\n❌ *Fᴀɪʟᴇᴅ/Bʟᴏᴄᴋᴇᴅ:* ${failed}\n${FOOTER}`, { reply_markup: { inline_keyboard: [[{text: '🔙 Bᴀᴄᴋ ᴛᴏ Aᴅᴍɪɴ', callback_data: 'btn_admin_panel'}]] } });
    }

    if (state.action && state.action.startsWith('WAIT_SEC_')) {
        if (state.action === 'WAIT_SEC_LINKS') {
            const session = activeClients.get(userId); const uClient = session ? session.client : null;
            if (!uClient) return safeSend(chatId, "⚠️ Sʏsᴛᴇᴍ ʀᴇǫᴜɪʀᴇs ᴀᴜᴛʜᴇɴᴛɪᴄᴀᴛɪᴏɴ.");
            const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
            if (codes.length === 0) return safeSend(chatId, "⚠️ Nᴏ ᴠᴀʟɪᴅ ʟɪɴᴋs ᴅᴇᴛᴇᴄᴛᴇᴅ.");
            
            let statusMsg = await safeSend(chatId, `⏳ *Sᴇᴄᴜʀɪɴɢ Tᴀʀɢᴇᴛs...*`);
            getSecurityConfig(userId).targetMode = 'LINKS';
            if(getSecurityConfig(userId).targetMode !== 'LINKS') getSecurityConfig(userId).targetGroups = [];
            
            for (let code of codes) {
                try {
                    let gid; try { gid = await uClient.acceptInvite(code); } catch(e) { const info = await uClient.getInviteInfo(code); gid = info.id._serialized; }
                    if (!getSecurityConfig(userId).targetGroups.includes(gid)) getSecurityConfig(userId).targetGroups.push(gid);
                    await new Promise(r=>setTimeout(r, 3000 + Math.random() * 2500)); 
                } catch(e) {}
            }
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            saveAdminConfig(); state.action = null; return sendShieldMenu(chatId, userId, null);
        }
        
        const inputList = text.replace(/\s/g, '').split(',').filter(i => i !== '');
        if (state.action === 'WAIT_SEC_ADD_COUNTRY') getSecurityConfig(userId).countries.push(...inputList);
        if (state.action === 'WAIT_SEC_REM_COUNTRY') getSecurityConfig(userId).countries = getSecurityConfig(userId).countries.filter(c => !inputList.includes(c));
        if (state.action === 'WAIT_SEC_ADD_VIP') getSecurityConfig(userId).vipNumbers.push(...inputList);
        if (state.action === 'WAIT_SEC_REM_VIP') getSecurityConfig(userId).vipNumbers = getSecurityConfig(userId).vipNumbers.filter(n => !inputList.includes(n));
        
        getSecurityConfig(userId).countries = [...new Set(getSecurityConfig(userId).countries)]; getSecurityConfig(userId).vipNumbers = [...new Set(getSecurityConfig(userId).vipNumbers)];
        saveAdminConfig(); state.action = null; return sendShieldMenu(chatId, userId, null);
    }

    if (state.action === 'WAITING_FOR_ADMIN_ID') {
        const newAdmin = parseInt(text.trim());
        if (!isNaN(newAdmin) && !adminConfig.admins.includes(newAdmin)) {
            adminConfig.admins.push(newAdmin); saveAdminConfig();
            safeSend(newAdmin, `👑 *ACCESS LEVEL UPGRADED*\n${DIVIDER}\nYᴏᴜ ᴀʀᴇ ɴᴏᴡ ᴀɴ Aᴅᴍɪɴ ᴏғ VORTEX.\n\nTᴀᴘ /start ᴛᴏ ɪɴɪᴛɪᴀʟɪᴢᴇ.`);
        }
        state.action = null; return safeSend(chatId, `👑 Aᴅᴍɪɴ ʀɪɢʜᴛs ɢʀᴀɴᴛᴇᴅ ᴛᴏ \`${newAdmin}\`.`);
    }
    
    if (state.action === 'WAITING_FOR_FSUB_DATA') {
        const parts = text.split(/[\s|]+/).filter(p => p.trim() !== '');
        if (parts.length < 2 || !parts[1].startsWith('http')) return safeSend(chatId, `⚠️ Sʏɴᴛᴀx Eʀʀᴏʀ!\n@CʜᴀɴɴᴇʟID ʜᴛᴛᴘs://...`);
        adminConfig.fsubChannels.push({ id: parts[0], link: parts[1] }); saveAdminConfig(); state.action = null; return safeSend(chatId, `📢 Fᴏʀᴄᴇ Sᴜʙ ᴀᴅᴅᴇᴅ.`);
    }

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
    
    if (state.action === 'WAITING_FOR_BAN_ID') { adminConfig.bannedUsers.push(parseInt(text)); saveAdminConfig(); state.action = null; return safeSend(chatId, `🚫 Usᴇʀ ʙᴀɴɴᴇᴅ.`); }
    if (state.action === 'WAITING_FOR_UNBAN_ID') { adminConfig.bannedUsers = adminConfig.bannedUsers.filter(u => u !== parseInt(text)); saveAdminConfig(); state.action = null; return safeSend(chatId, `♻️ Usᴇʀ ᴜɴʙᴀɴɴᴇᴅ.`); }
    
    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { 
        state.action = null; 
        const cleanNumber = text.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 10) return safeSend(chatId, `❌ Iɴᴠᴀʟɪᴅ Nᴜᴍʙᴇʀ. Pʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴠᴀʟɪᴅ ɴᴜᴍʙᴇʀ ᴡɪᴛʜ Cᴏᴜɴᴛʀʏ Cᴏᴅᴇ.`);
        return startWhatsAppClient(userId, chatId, cleanNumber); 
    }

    if (state.action === 'WAIT_GROUP_NAME') { state.groupConfig.baseName = text.trim(); state.action = 'WAIT_GROUP_COUNT'; return safeSend(chatId, `🔢 *Pʜᴀsᴇ 2:* Qᴜᴀɴᴛɪᴛʏ?`, { reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); } 
    if (state.action === 'WAIT_GROUP_COUNT') { state.groupConfig.count = parseInt(text); state.action = 'WAIT_GROUP_MEMBER'; return safeSend(chatId, `👤 *Pʜᴀsᴇ 3:* Mᴇᴍʙᴇʀ ID?`, { reply_markup: { inline_keyboard: [[{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); } 
    if (state.action === 'WAIT_GROUP_MEMBER') { state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@c.us'; state.action = 'WAIT_GROUP_DESC'; return safeSend(chatId, `📝 *Pʜᴀsᴇ 4:* Dᴇsᴄ?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Sᴋɪᴘ', callback_data: 'grp_skip_desc'}], [{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); } 
    if (state.action === 'WAIT_GROUP_DESC') { state.groupConfig.desc = text; state.action = 'WAIT_GROUP_PFP'; return safeSend(chatId, `🖼️ *Pʜᴀsᴇ 5:* DP?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Sᴋɪᴘ', callback_data: 'grp_skip_pfp'}], [{text: '❌ Cᴀɴᴄᴇʟ', callback_data: 'btn_main_menu'}]] } }); }
    
    if (state.action === 'WAIT_GROUP_PFP') {
        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            try { const filePath = await tgBot.downloadFile(fileId, __dirname); state.groupConfig.pfpPath = filePath; state.action = null; sendGroupSettingsMenu(chatId, userId, null); } 
            catch (e) { state.action = null; sendGroupSettingsMenu(chatId, userId, null); }
        }
    }

    if (state.action === 'WAIT_KICK_TERM') { const session = activeClients.get(userId); return runPurgeEngine(chatId, userId, session ? session.client : null, text); }
    
    if (state.action === 'WAIT_BROADCAST_MSG') {
        const session = activeClients.get(userId); const uClient = session ? session.client : null; if (!uClient) return;
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; state.action = null; 
        
        let statusMsg = await safeSend(chatId, `⏳ *Tʀᴀɴsᴍɪᴛᴛɪɴɢ WA Bʀᴏᴀᴅᴄᴀsᴛ...*`);
        let mediaObj = null; let captionText = msg.caption || msg.text || '';
        
        try {
            if (msg.photo) { const fileId = msg.photo[msg.photo.length - 1].file_id; const filePath = await tgBot.downloadFile(fileId, __dirname); mediaObj = MessageMedia.fromFilePath(filePath); } 
            else if (msg.video) { const fileId = msg.video.file_id; const filePath = await tgBot.downloadFile(fileId, __dirname); mediaObj = MessageMedia.fromFilePath(filePath); } 
            else if (msg.document) { const fileId = msg.document.file_id; const filePath = await tgBot.downloadFile(fileId, __dirname); mediaObj = MessageMedia.fromFilePath(filePath); }

            let success = 0; let failed = 0;
            
            for (let i = 0; i < targets.length; i++) { 
                if (i > 0 && i % 20 === 0) {
                    await safeSend(chatId, `☕ *HUMANIZING ENGINE:* VORTEX ɪs ᴛᴀᴋɪɴɢ ᴀ ʙʀᴇᴀᴋ...`);
                    await new Promise(r => setTimeout(r, 120000));
                }

                try { 
                    const chat = await uClient.getChatById(targets[i]); 
                    let typingDuration = captionText.length > 0 ? (captionText.length * 40) + Math.random() * 1000 : 2000;
                    if (typingDuration > 10000) typingDuration = 10000;
                    
                    await chat.sendStateTyping(); 
                    await new Promise(r => setTimeout(r, typingDuration)); 
                    
                    if (mediaObj) { await chat.sendMessage(mediaObj, { caption: captionText, linkPreview: false }); } 
                    else { await chat.sendMessage(captionText, { linkPreview: false }); } 
                    success++; 
                } 
                catch(e) { failed++; } 
                
                let waitDelay = 3500 + (captionText.length * 10) + Math.random() * 3000;
                await new Promise(r => setTimeout(r, waitDelay)); 
            }
            if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, `✅ *WA BROADCAST REPORT*\n${DIVIDER}\n🎯 Tᴀʀɢᴇᴛs: ${targets.length}\n✔️ Sᴜᴄᴄᴇss: ${success}\n❌ Fᴀɪʟᴇᴅ: ${failed}`);
        } catch(e) { console.error("Media Download Error:", e); } 
        finally { if (mediaObj && fs.existsSync(mediaObj.filePath)) fs.unlinkSync(mediaObj.filePath); }
    }

    if (state.action === 'WAIT_RENAME_DATA') {
        const session = activeClients.get(userId); const uClient = session ? session.client : null; if (!uClient) return;
        const blocks = text.split(/(?:https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]{15,25}/i);
        const codes = [...text.matchAll(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (codes.length === 0) return;
        state.action = null; let report = `✅ *RENAME REPORT*\n`;
        
        for (let i = 0; i < codes.length; i++) {
            if (i > 0 && i % 10 === 0) await new Promise(r => setTimeout(r, 60000));

            let lines = blocks[i].split('\n').map(l=>l.trim()).filter(l=>l!==''); let targetName = (lines.length > 0 ? lines[lines.length - 1] : `Group`).replace(/^(GROUP\s*NAME|NAME)[\s:-]*/i, '').trim();
            try { 
                let gid = await uClient.acceptInvite(codes[i]); 
                const chat = await uClient.getChatById(gid); 
                await uClient.sendPresenceAvailable();
                await new Promise(r => setTimeout(r, 2000));
                
                await chat.setSubject(targetName); 
                report += `🔹 *${targetName}* ✔️\n`; 
                await new Promise(r => setTimeout(r, 4000 + Math.random() * 2000)); 
            } 
            catch (e) { report += `🔹 *${targetName}* ❌\n`; }
        }
        return sendLongReport(chatId, report, 'Rename_Report');
    }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const session = activeClients.get(userId); const uClient = session ? session.client : null; if (!uClient) return;
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (codes.length === 0) return;
        state.action = null; let report = `✅ *JOIN REPORT*\n`;
        for (let i = 0; i < codes.length; i++) {
            if (i > 0 && i % 15 === 0) await new Promise(r => setTimeout(r, 90000));

            try { 
                await uClient.acceptInvite(codes[i]); 
                report += `🔹 Jᴏɪɴᴇᴅ: ${codes[i]} ✔️\n`; 
                await new Promise(r => setTimeout(r, 4000 + Math.random() * 3000)); 
            } 
            catch (e) { report += `🔹 Fᴀɪʟᴇᴅ: ${codes[i]} ❌\n`; }
        }
        return sendLongReport(chatId, report, 'Join_Report');
    }
});

// ============================================================================
// ⚙️ 11. THE HEAVYWEIGHT ISOLATED ENGINES
// ============================================================================

async function startGroupCreationProcess(chatId, userId, uClient) {
    if (!uClient) return;
    const config = getState(userId).groupConfig; getState(userId).action = null; 
    let statusMsg = await safeSend(chatId, `🚀 *DEPLOYMENT ACTIVE*`); let resultMessage = `✅ *Dᴇᴘʟᴏʏᴍᴇɴᴛ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n\n`;
    let pfpMedia = null; if (config.pfpPath && fs.existsSync(config.pfpPath)) pfpMedia = MessageMedia.fromFilePath(config.pfpPath);
    
    try {
        for (let i = 1; i <= config.count; i++) {
            if (i > 1 && i % 10 === 0) await new Promise(r => setTimeout(r, 60000)); 

            const groupName = `${config.baseName} ${i}`;
            try {
                if (statusMsg) tgBot.editMessageText(`⚙️ *Cᴏɴsᴛʀᴜᴄᴛɪɴɢ...*\n${createProgressBar(i, config.count)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
                
                await uClient.sendPresenceAvailable();
                const res = await uClient.createGroup(groupName, [config.memberId]); 
                await new Promise(r => setTimeout(r, 2500)); 
                const chat = await uClient.getChatById(res.gid._serialized);
                
                if (config.desc) await chat.setDescription(config.desc).catch(()=>{}); 
                if (pfpMedia) await chat.setPicture(pfpMedia).catch(()=>{});
                if (config.settings.msgsAdminOnly) await chat.setMessagesAdminsOnly(true).catch(()=>{}); 
                if (config.settings.infoAdminOnly) await chat.setInfoAdminsOnly(true).catch(()=>{});
                
                const link = await chat.getInviteCode(); resultMessage += `🔹 *${groupName}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; 
                await new Promise(r => setTimeout(r, 6000 + Math.random() * 4000)); 
            } catch (e) { resultMessage += `🔹 *${groupName}*\n❌ Eʀʀᴏʀ: _${e.message}_\n\n`; }
        }
    } finally { if (config.pfpPath && fs.existsSync(config.pfpPath)) fs.unlinkSync(config.pfpPath); }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, resultMessage + FOOTER, 'Created_Groups');
}

async function runPurgeEngine(chatId, userId, uClient, inputString) {
    if (!uClient) return;
    const state = getState(userId); const inputList = inputString.replace(/,/g, ' ').split(/\s+/).filter(p => p.trim() !== '');
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null; 
    let statusMsg = await safeSend(chatId, `⏳ *Kɪᴄᴋɪɴɢ Usᴇʀs...*`); let report = `✅ *Aᴜᴛᴏ Kɪᴄᴋ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n`;

    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]);
            if (statusMsg) tgBot.editMessageText(`🔍 *Sᴄᴀɴɴɪɴɢ...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
            
            const botId = uClient.info.wid._serialized; const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) { report += `🔹 *${chat.name}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n`; continue; }

            let targetsToRemove = [];
            for (const participant of chat.participants) {
                if (participant.isAdmin || participant.isSuperAdmin) continue; let shouldKick = false;
                for (const item of inputList) { let searchItem = item.startsWith('+') ? item.substring(1) : item; if (participant.id.user.startsWith(searchItem) || participant.id.user === searchItem) { shouldKick = true; break; } }
                if (shouldKick) targetsToRemove.push(participant.id._serialized);
            }
            if (targetsToRemove.length > 0) { 
                await chat.removeParticipants(targetsToRemove); 
                report += `🔹 *${chat.name}:* Kɪᴄᴋᴇᴅ ${targetsToRemove.length}\n`; 
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000)); 
            }
        } catch (e) {}
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
    return sendLongReport(chatId, report + FOOTER, 'Purge_Report');
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    if (!uClient) return;
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null;
    let statusMsg = await safeSend(chatId, `⏳ *Sᴄʀᴀᴘɪɴɢ Lɪɴᴋs...*`); let resultMessage = `🔗 *Lɪɴᴋ Dᴀᴛᴀʙᴀsᴇ*\n${DIVIDER}\n\n`;
    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]);
            if (statusMsg) tgBot.editMessageText(`🔍 *Exᴛʀᴀᴄᴛɪɴɢ...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
            const botId = uClient.info.wid._serialized; const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) { resultMessage += `🔹 *${chat.name}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n\n`; continue; }
            const link = await chat.getInviteCode(); resultMessage += `🔹 *${chat.name}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000)); 
        } catch (e) { resultMessage += `🔹 ID: ${targetGroupIds[i]} ❌\n\n`; }
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, resultMessage + FOOTER, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient, mode) {
    if (!uClient) return;
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null;
    let statusMsg = await safeSend(chatId, `⏳ *Aᴘᴘʀᴏᴠɪɴɢ...*`); let report = `✅ *Aᴘᴘʀᴏᴠᴀʟ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n`;
    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]);
            if (statusMsg) tgBot.editMessageText(`👥 *Aᴜᴛʜᴏʀɪᴢɪɴɢ...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
            const botId = uClient.info.wid._serialized; const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) { report += `🔹 *${chat.name}:* ❌ Dᴇᴍᴏᴛᴇᴅ\n`; continue; }
            if (mode === 'OFF_SETTING') { await chat.setGroupMembershipApprovalMode(false); report += `🔹 *${chat.name}:* Gᴀᴛᴇ Oᴘᴇɴᴇᴅ.\n`; } 
            else if (mode === 'MANUAL') { const requests = await chat.getGroupMembershipRequests(); if (requests && requests.length > 0) { const rIds = requests.map(r => r.id._serialized || r.id.remote || r.author); await chat.approveGroupMembershipRequests(rIds); report += `🔹 *${chat.name}:* Aᴘᴘʀᴏᴠᴇᴅ +${requests.length}\n`; } }
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500)); 
        } catch (e) {}
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, report + FOOTER, 'Approval_Report');
}

// ============================================================================
// 🚨 12. GOD-TIER POLLING ERROR HANDLER
// ============================================================================
tgBot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('\n[🚨 ANTI-CRASH ALERT] 409 CONFLICT: Tᴏᴋᴇɴ ᴀᴄᴛɪᴠᴇ ᴏɴ ᴀɴᴏᴛʜᴇʀ sᴇʀᴠᴇʀ!');
    } else {
        console.log('\n[POLLING ERROR]', error.message);
    }
});

// ============================================================================
// 🛑 13. GRACEFUL EXIT HANDLER
// ============================================================================
process.on('SIGINT', async () => {
    for (let [userId, session] of activeClients) { 
        if (session && session.client) {
            await session.client.destroy().catch(()=>{}); 
        }
    }
    process.exit(0);
});
