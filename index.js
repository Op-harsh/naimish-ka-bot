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
// ðŸ›¡ï¸ SYSTEM CONFIGURATION & ANTI-CRASH
// ============================================================================
process.setMaxListeners(100);

process.on('uncaughtException', (err) => {
    console.error('\nðŸš¨ [VORTEX FATAL ERROR] Caught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('\nðŸš¨ [VORTEX CRITICAL] Unhandled Rejection:', reason);
});

// ============================================================================
// ðŸŒ EXPRESS SERVER (FOR RAILWAY 24/7 UPTIME)
// ============================================================================
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;font-family:sans-serif;">ðŸš€ VORTEX V57 PEAK ENGINE ACTIVE</h1>');
});

app.listen(port, () => {
    console.log(`\nâ˜ï¸ [VORTEX SERVER] Active and listening on Port ${port}`);
});

// ============================================================================
// ðŸ¤– TELEGRAM BOT SETUP & CONSTANTS
// ============================================================================
const TELEGRAM_TOKEN = '8757340553:AAFK1bhMrNzCItmd5ci2P437WY_iimpi1MQ'; 
const OWNER_ID = 5524906942; 
const OWNER_USERNAME = '@Naimish555';

const tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const activeClients = new Map(); // Store 5 Slots here
let userStates = {};

let knownBotUsers = [];
const groupMetaCache = new Map();
const AUDIT_LOGS_FILE = './audit_logs.json';

const BOT_USERS_FILE = './bot_users.json';
const ADMIN_CONFIG_FILE = './admin_config.json';
const SESSIONS_DIR = path.join(__dirname, 'multi_sessions');

if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

if (fs.existsSync(BOT_USERS_FILE)) { 
    try { 
        knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE));
    } catch(e) {} 
}

let adminConfig = {
    testModeEnabled: false, 
    fsubEnabled: false, 
    fsubChannels: [], 
    approvalRequired: false, 
    botAlerts: true, 
    admins: [], 
    allowedUsers: [], 
    bannedUsers: [], 
    revokedUsers: [], 
    securityConfigs: {}, 
    featurePerms: { 
        login: ['owner','admin','user'], 
        massadd: ['owner','admin','user'], 
        creategroup: ['owner','admin','user'], 
        joingroup: ['owner','admin','user'], 
        renamegroups: ['owner','admin','user'], 
        extractlinks: ['owner','admin','user'], 
        approve: ['owner','admin','user'], 
        pendinglist: ['owner','admin','user'], 
        staffaudit: ['owner','admin','user'], 
        ctcchecker: ['owner','admin','user'], 
        autokick: ['owner','admin','user'], 
        broadcast: ['owner','admin','user'], 
        stats: ['owner','admin','user'], 
        security: ['owner','admin'] 
    }
};

if (fs.existsSync(ADMIN_CONFIG_FILE)) { 
    try { 
        adminConfig = { ...adminConfig, ...JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE)) };
    } catch(e) { } 
}

function saveAdminConfig() { 
    try { 
        fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(adminConfig, null, 4));
    } catch (err) { } 
}

function getSecurityConfig(userId) {
    if (!adminConfig.securityConfigs[userId]) { 
        adminConfig.securityConfigs[userId] = { 
            enabled: false, 
            ruleType: 'WHITELIST', 
            countries: ['91'], 
            vipNumbers: [], 
            autoKickEnabled: false, 
            strikeCount: 3, 
            violations: {}, 
            targetMode: 'ALL', 
            targetGroups: [], 
            stats: { deleted: 0, kicked: 0 } 
        };
    }
    return adminConfig.securityConfigs[userId];
}

function getState(userId) {
    if (!userStates[userId]) { 
        userStates[userId] = { 
            action: null, 
            adminGroups: [], 
            currentPage: 0, 
            flowContext: '', 
            selectedGroupsArray: [], 
            missionCart: [], 
            tempData: { targets: [], vcfs: [], link: null, timer: null, activeSlot: null }, 
            language: 'EÉ´É¢ÊŸÉªsÊœ', 
            groupConfig: { 
                baseName: '', 
                count: 0, 
                memberId: '', 
                desc: '', 
                pfpPath: null, 
                settings: { msgsAdminOnly: false, infoAdminOnly: false } 
            } 
        };
    }
    return userStates[userId];
}

const DIVIDER = 'â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”';
const FOOTER = `\n${DIVIDER}\nðŸ‘‘ _VORTEX V57 PEAK_ | Oá´¡É´á´‡Ê€: ${OWNER_USERNAME}`;

// ============================================================================
// ðŸ—‘ï¸ AUTO-CLEANUP & EXPORT JOB (24 HOURS)
// ============================================================================
setInterval(async () => {
    if (!fs.existsSync(AUDIT_LOGS_FILE)) return;
    let logs = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE));
    const now = Date.now();
    const expiry = 24 * 60 * 60 * 1000;
    let expiredData = "";
    let dataDeleted = false;

    for (let gid in logs) {
        let initialCount = logs[gid].length;
        logs[gid] = logs[gid].filter(entry => {
            if (now - entry.timestamp > expiry) {
                expiredData += `ðŸ“ Group: ${gid}\nðŸ‘¤ Added By: +${entry.addedBy.split('@')[0]}\nðŸ‘¥ Members: ${entry.members.map(m=>'+'+m.split('@')[0]).join(', ')}\nâ° Time: ${new Date(entry.timestamp).toLocaleString()}\n${DIVIDER}\n`;
                return false;
            }
            return true;
        });
        if (logs[gid].length < initialCount) dataDeleted = true;
    }

    if (dataDeleted && expiredData) {
        const reportPath = path.join(__dirname, `Cleanup_Backup_${Date.now()}.txt`);
        fs.writeFileSync(reportPath, `VORTEX EXPIRED LOGS BACKUP\nGenerated on: ${new Date().toLocaleString()}\n\n${expiredData}`);
        await tgBot.sendDocument(OWNER_ID, reportPath, { caption: "ðŸ—‘ï¸ *AUTO CLEANUP COMPLETED*\n\n24 Hours old tracked data deleted safely. Backup file attached." });
        fs.unlinkSync(reportPath);
        fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 4));
    }
}, 30 * 60 * 1000); 

// ============================================================================
// ðŸŒ DEEP MULTI-LANGUAGE PACK
// ============================================================================
const texts = {
    'EÉ´É¢ÊŸÉªsÊœ': { 
        menuTitle: "ðŸ¤– *VORTEX DASHBOARD*", statusLabel: "ðŸ“¡ Sá´›á´€á´›á´œs", statusOnline: "ðŸŸ¢ WA Cá´É´É´á´‡á´„á´›á´‡á´… & Rá´‡á´€á´…Ê", statusOffline: "ðŸ”´ WA Ná´á´› Cá´É´É´á´‡á´„á´›á´‡á´… (Lá´É¢ÉªÉ´ Rá´‡Ç«á´œÉªÊ€á´‡á´…)", 
        login: "ðŸ” Lá´É¢ÉªÉ´ WA", massadd: "ðŸ‘¥ Má´€ss Aá´…á´… (Sá´¡á´€Ê€á´)", autoGroup: "âž• CÊ€á´‡á´€á´›á´‡ GÊ€á´á´œá´˜s", join: "ðŸ“¥ Aá´œá´›á´ Já´ÉªÉ´", 
        rename: "âœï¸ Rá´‡É´á´€á´á´‡ GÊ€á´á´œá´˜s", extract: "ðŸ”— Exá´›Ê€á´€á´„á´› LÉªÉ´á´‹s", approve: "ðŸ‘¥ Aá´œá´›á´ Aá´˜á´˜Ê€á´á´ á´‡", pendingList: "ðŸ“‹ Pá´‡É´á´…ÉªÉ´É¢ LÉªsá´›", staffAudit: "ðŸ•µï¸â€â™‚ï¸ Sá´›á´€Ò“Ò“ Aá´œá´…Éªá´›", ctcChecker: "ðŸ”Ž Ná´œá´Ê™á´‡Ê€ CÊœá´‡á´„á´‹á´‡Ê€", kick: "âš”ï¸ Aá´œá´›á´ KÉªá´„á´‹", 
        broadcast: "ðŸ“¢ BÊ€á´á´€á´…á´„á´€sá´›", stats: "ðŸ“Š Bá´á´› Sá´›á´€á´›s", shield: "ðŸ›¡ï¸ Aá´œá´›á´ Dá´‡ÊŸá´‡á´›á´‡ GC MsÉ¢", lang: "Lá´€É´É¢á´œá´€É¢á´‡",
        helpMsg: "ðŸ“– *AUTO DELETE HELP*\n\n1. *WHITELIST:* Only numbers starting with the allowed Country Codes (e.g. 91) can send messages.\n2. *BLACKLIST:* Messages from specified Country Codes will be deleted. Others allowed.\n3. *VIP NUMBERS:* Messages from these exact numbers will NEVER be deleted, bypassing all rules.",
        infoWh: "Only allowed codes can message.", infoBl: "Blocked codes cannot message."
    },
    'HÉªÉ´É¢ÊŸÉªsÊœ': { 
        menuTitle: "ðŸ¤– *VORTEX DASHBOARD*", statusLabel: "ðŸ“¡ Sá´›á´€á´›á´œs", statusOnline: "ðŸŸ¢ WA Cá´É´É´á´‡á´„á´›á´‡á´… & Rá´‡á´€á´…Ê Há´€Éª", statusOffline: "ðŸ”´ WA Ná´á´› Cá´É´É´á´‡á´„á´›á´‡á´… (Lá´É¢ÉªÉ´ Ká´€Ê€á´)", 
        login: "ðŸ” WA Lá´É¢ÉªÉ´ Ká´€Ê€á´", massadd: "ðŸ‘¥ Eá´‹ Sá´€á´€á´›Êœ Aá´…á´…", autoGroup: "âž• GÊ€á´á´œá´˜s Bá´€É´á´€á´", join: "ðŸ“¥ Aá´œá´›á´ Já´ÉªÉ´", 
        rename: "âœï¸ Ná´€á´€á´ Bá´€á´…ÊŸá´", extract: "ðŸ”— LÉªÉ´á´‹s NÉªá´‹á´€ÊŸá´", approve: "ðŸ‘¥ Aá´œá´›á´ Aá´˜á´˜Ê€á´á´ á´‡", pendingList: "ðŸ“‹ Pá´‡É´á´…ÉªÉ´É¢ LÉªsá´›", staffAudit: "ðŸ•µï¸â€â™‚ï¸ Sá´›á´€Ò“Ò“ Aá´œá´…Éªá´›", ctcChecker: "ðŸ”Ž Ná´œá´Ê™á´‡Ê€ CÊœá´‡á´„á´‹á´‡Ê€", kick: "âš”ï¸ Aá´œá´›á´ NÉªá´‹á´€ÊŸá´", 
        broadcast: "ðŸ“¢ Sá´€Ê™á´‹á´ MsÉ¢ BÊœá´‡á´Šá´", stats: "ðŸ“Š Bá´á´› KÉª Sá´›á´€á´›s", shield: "ðŸ›¡ï¸ Aá´œá´›á´ MsÉ¢ Dá´‡ÊŸá´‡á´›á´‡", lang: "BÊœá´€sÊœá´€",
        helpMsg: "ðŸ“– *AUTO DELETE HELP*\n\n1. *WHITELIST:* Sirf set kiye gaye code (jaise 91) wale log msg kar payenge.\n2. *BLACKLIST:* Set kiye gaye code wale logo ka msg delete hoga, baaki sabka aayega.\n3. *VIP NUMBERS:* In numbers ka msg kabhi delete nahi hoga chahe jo bhi rule ho.",
        infoWh: "Sirf allowed codes msg kar sakte hain.", infoBl: "Blocked codes msg nahi kar sakte."
    },
    'IÉ´á´…á´É´á´‡sÉªá´€É´': { 
        menuTitle: "ðŸ¤– *VORTEX DASHBOARD*", statusLabel: "ðŸ“¡ Sá´›á´€á´›á´œs", statusOnline: "ðŸŸ¢ WA Tá´‡Ê€Êœá´œÊ™á´œÉ´É¢ & SÉªá´€á´˜", statusOffline: "ðŸ”´ WA TÉªá´…á´€á´‹ Tá´‡Ê€Êœá´œÊ™á´œÉ´É¢ (Wá´€á´ŠÉªÊ™ Lá´É¢ÉªÉ´)", 
        login: "ðŸ” Má´€sá´œá´‹ WA", massadd: "ðŸ‘¥ Tá´€á´Ê™á´€Êœ Má´€ssá´€ÊŸ", autoGroup: "âž• Bá´œá´€á´› GÊ€á´œá´˜", join: "ðŸ“¥ Gá´€Ê™á´œÉ´É¢ Oá´›á´á´á´€á´›Éªs", 
        rename: "âœï¸ UÊ™á´€Êœ Ná´€á´á´€ GÊ€á´œá´˜", extract: "ðŸ”— Aá´Ê™ÉªÊŸ Tá´€á´œá´›á´€É´", approve: "ðŸ‘¥ Sá´‡á´›á´œá´Šá´œÉª Oá´›á´á´á´€á´›Éªs", pendingList: "ðŸ“‹ Pá´‡É´á´…ÉªÉ´É¢ LÉªsá´›", staffAudit: "ðŸ•µï¸â€â™‚ï¸ Aá´œá´…Éªá´› Sá´›á´€Ò“", ctcChecker: "ðŸ”Ž Cá´‡á´‹ Ná´á´á´Ê€", kick: "âš”ï¸ Tá´‡É´á´…á´€É´É¢ Oá´›á´á´á´€á´›Éªs", 
        broadcast: "ðŸ“¢ SÉªá´€Ê€á´€É´", stats: "ðŸ“Š Sá´›á´€á´›Éªsá´›Éªá´‹ Bá´á´›", shield: "ðŸ›¡ï¸ Há´€á´˜á´œs Pá´‡sá´€É´ Oá´›á´", lang: "Bá´€Êœá´€sá´€",
        helpMsg: "ðŸ“– *BANTUAN HAPUS OTOMATIS*\n\n1. *WHITELIST:* Hanya nomor dari Kode Negara yang diizinkan (misal 62) yang dapat mengirim pesan.\n2. *BLACKLIST:* Pesan dari Kode Negara yang ditentukan akan dihapus.\n3. *NOMOR VIP:* Pesan dari nomor-nomor ini TIDAK AKAN PERNAH dihapus, melewati semua aturan.",
        infoWh: "Hanya kode diizinkan yang bisa pesan.", infoBl: "Kode diblokir tidak bisa pesan."
    }
};

// ============================================================================
// ðŸ’€ IDLE SESSION REAPER
// ============================================================================
const IDLE_THRESHOLD = 20 * 60 * 1000; 
setInterval(() => {
    const now = Date.now();
    activeClients.forEach((session, sessionKey) => {
        if (session.isReady && (now - session.lastSeen > IDLE_THRESHOLD)) {
            if (session.client) { 
                try { session.client.ws.close(); session.client.ev.removeAllListeners(); } catch(e){}
            }
            activeClients.delete(sessionKey);
            const userId = sessionKey.split('_')[0];
            safeSend(userId, `âš ï¸ *System Alert:*\nYour WhatsApp session (Slot ${sessionKey.split('_')[1]}) was hibernated to save Server RAM due to 20 mins of inactivity.`);
        }
    });
}, 5 * 60 * 1000); 

function updateActivity(userId) {
    const state = getState(userId);
    for (let i = 1; i <= 5; i++) {
        const session = activeClients.get(`${userId}_${i}`);
        if (session) { 
            session.lastSeen = Date.now();
        } else {
            const sessionPath = path.join(SESSIONS_DIR, `session_${userId}_slot_${i}`);
            if (fs.existsSync(sessionPath)) { 
                startBaileysClient(userId, i.toString());
            }
        }
    }
}

// ============================================================================
// ðŸ› ï¸ UTILITY FUNCTIONS
// ============================================================================
async function safeSend(chatId, text, options = {}) { 
    try { 
        return await tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options });
    } catch (e) { 
        return null; 
    } 
}

function createProgressBar(current, total) {
    if (total === 0) return `[â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆ] 100%`;
    const length = 10;
    const filled = Math.round((current / total) * length);
    const empty = Math.max(0, length - filled);
    return `[${'â–ˆ'.repeat(filled)}${'â–‘'.repeat(empty)}] ${Math.round((current / total) * 100)}%`;
}

async function sendLongReport(chatId, text, filename, options = {}) { 
    if (text.length > 3900) { 
        const fp = path.join(__dirname, `${filename}_${chatId}.txt`);
        fs.writeFileSync(fp, text); 
        await tgBot.sendDocument(chatId, fp, { caption: `ðŸ“„ *REPORT*\n${FOOTER}`, parse_mode: 'Markdown', ...options }); 
        fs.unlinkSync(fp); 
    } else { 
        safeSend(chatId, text, options);
    } 
}

function hasFeatureAccess(userId, featureKey) { 
    let role = userId === OWNER_ID ? 'owner' : (adminConfig.admins.includes(userId) ? 'admin' : 'user');
    return adminConfig.featurePerms[featureKey] && adminConfig.featurePerms[featureKey].includes(role); 
}

async function checkAccess(userId, chatId, msgObj = null) { 
    if (adminConfig.bannedUsers.includes(userId)) {
        safeSend(chatId, "ðŸš« *ACCESS DENIED*\nYou have been permanently banned.");
        return false;
    }
    if (adminConfig.revokedUsers && adminConfig.revokedUsers.includes(userId)) { 
        safeSend(chatId, `ðŸ”’ *ACCESS REVOKED*\nAapka access manually hata diya gaya hai. Admin se phirse permission lein.`);
        return false; 
    }
    if (adminConfig.approvalRequired && userId !== OWNER_ID && !adminConfig.admins.includes(userId) && !adminConfig.allowedUsers.includes(userId)) {
        safeSend(chatId, "ðŸ”’ *PRIVATE BOT*\nApproval required from the Owner to use this bot.");
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
                    isSubscribed = false; joinButtons.push([{ text: `ðŸ“¢ Já´ÉªÉ´ CÊœá´€É´É´á´‡ÊŸ`, url: chLink }]);
                }
            } catch (e) {
                isSubscribed = false;
                let chLink = typeof ch === 'object' ? ch.link : `https://t.me/${(typeof ch === 'object' ? ch.id : ch).replace('@', '')}`;
                joinButtons.push([{ text: `ðŸ“¢ Já´ÉªÉ´ CÊœá´€É´É´á´‡ÊŸ`, url: chLink }]);
            } 
        }
        if (!isSubscribed) { 
            safeSend(chatId, `âš ï¸ *ACCESS DENIED*\n\nPÊŸá´‡á´€sá´‡ á´Šá´ÉªÉ´ á´á´œÊ€ á´Ò“Ò“Éªá´„Éªá´€ÊŸ á´„Êœá´€É´É´á´‡ÊŸs á´›á´ á´œsá´‡ VORTEX!`, { reply_markup: { inline_keyboard: joinButtons } });
            return false; 
        }
    }
    if (!knownBotUsers.includes(userId)) { 
        knownBotUsers.push(userId);
        fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(knownBotUsers));
        if (adminConfig.botAlerts && msgObj) {
            const userName = msgObj.from?.first_name || 'Unknown';
            safeSend(OWNER_ID, `ðŸš¨ *NEW USER DETECTED*\n${DIVIDER}\nðŸ‘¤ *Ná´€á´á´‡:* ${userName}\nðŸ†” *ID:* \`${userId}\`\n${FOOTER}`);
        }
    } 
    return true; 
}

// ============================================================================
// ðŸš€ BAILEYS CORE ENGINE (MULTI-SLOT SUPPORT + CCTV)
// ============================================================================
async function startBaileysClient(userId, slotId = "1", cleanNumber = null) {
    const sessionName = `session_${userId}_slot_${slotId}`;
    const sessionPath = path.join(SESSIONS_DIR, sessionName);
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    const client = makeWASocket({ 
        version, 
        auth: state, 
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }), 
        browser: ['Ubuntu', 'Chrome', '120.0.0.0']
    });
    
    activeClients.set(`${userId}_${slotId}`, { client: client, isReady: false, lastSeen: Date.now() });
    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            if (cleanNumber) {
                setTimeout(async () => {
                    try { 
                        const code = await client.requestPairingCode(cleanNumber); 
                        safeSend(userId, `ðŸ”‘ *SLOT ${slotId} CODE:* \`${code?.match(/.{1,4}/g)?.join('-')}\``); 
                    } catch(e) {
                        safeSend(userId, `âŒ Slot ${slotId} Pairing failed: ${e.message}`);
                    }
                }, 3000);
            } else {
                tgBot.sendPhoto(userId, `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`, { caption: `ðŸ“· *SCAN FOR SLOT ${slotId}*` });
            }
        }
        
        if (connection === 'open') {
            activeClients.get(`${userId}_${slotId}`).isReady = true;
            await safeSend(userId, `âœ… *SLOT ${slotId} CONNECTED SUCCESSFULLY*`);
        }
        
        if (connection === 'close') {
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            if (statusCode !== DisconnectReason.loggedOut) {
                startBaileysClient(userId, slotId, null);
            } else {
                activeClients.delete(`${userId}_${slotId}`);
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                }
                safeSend(userId, `ðŸš¨ *SLOT ${slotId} DISCONNECTED*\nSession Wiped.`);
            }
        }
    });

    // ðŸ”¥ CCTV TRACKER FOR DIRECT ADDS
    client.ev.on('group-participants.update', async (update) => {
        const { id, participants, action, author } = update;
        if (action === 'add') {
            let logs = fs.existsSync(AUDIT_LOGS_FILE) ? JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE)) : {};
            if (!logs[id]) logs[id] = [];
            logs[id].push({ 
                timestamp: Date.now(), 
                addedBy: author || 'Unknown', 
                members: participants 
            });
            fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 4));
        }
    });

    // ðŸ›¡ï¸ SHIELD AUTO-DELETE/KICK ENGINE
    client.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]; 
        if (!msg.message || msg.key.fromMe) return;
        
        const sec = getSecurityConfig(userId); 
        if (!sec.enabled) return;
        
        const remoteJid = msg.key.remoteJid; 
        if (!remoteJid.endsWith('@g.us')) return; 
        if (sec.targetMode !== 'ALL' && !sec.targetGroups.includes(remoteJid)) return;
        
        const participant = msg.key.participant || remoteJid; 
        const authorNum = participant.split('@')[0];
        
        if (sec.vipNumbers.includes(authorNum)) return; 

        let shouldDelete = false; 
        let matchedCode = sec.countries.find(c => authorNum.startsWith(c));
        
        if (sec.ruleType === 'WHITELIST') { 
            if (sec.countries.length > 0 && !matchedCode) shouldDelete = true; 
        } else { 
            if (matchedCode) shouldDelete = true; 
        }
        
        if (!shouldDelete) return;

        try {
            let groupMetadata = groupMetaCache.get(remoteJid);
            if (!groupMetadata) {
                groupMetadata = await client.groupMetadata(remoteJid);
                groupMetaCache.set(remoteJid, groupMetadata);
                setTimeout(() => groupMetaCache.delete(remoteJid), 5 * 60 * 1000); 
            }
            
            const botJid = jidNormalizedUser(client.user.id);
            if (!groupMetadata.participants.find(p => p.id === botJid)?.admin) return;
            if (groupMetadata.participants.find(p => p.id === participant)?.admin) return;

            await client.sendMessage(remoteJid, { delete: msg.key });
            sec.stats.deleted += 1; 
            sec.violations[participant] = (sec.violations[participant] || 0) + 1; 
            saveAdminConfig();
            
            if (sec.violations[participant] >= sec.strikeCount && sec.autoKickEnabled) {
                await client.groupParticipantsUpdate(remoteJid, [participant], 'remove');
                safeSend(OWNER_ID, `âš”ï¸ *KICKED:* +${authorNum} from ${groupMetadata.subject}`);
            }
        } catch(e) {}
    });
}

// Boot existing sessions on startup
if (fs.existsSync(SESSIONS_DIR)) { 
    fs.readdirSync(SESSIONS_DIR).forEach(dir => { 
        if (dir.startsWith('session_')) { 
            const parts = dir.split('_');
            const uid = parts[1];
            const slotId = parts[3] || "1";
            startBaileysClient(uid, slotId); 
        } 
    });
}

// ============================================================================
// ðŸ“± PREMIUM UI RENDERING
// ============================================================================
function sendMainMenu(chatId, userId) {
    const state = getState(userId);
    const t = texts[state.language] || texts['EÉ´É¢ÊŸÉªsÊœ']; 
    let kb = [
        [{ text: t.login, callback_data: 'menu_slots_panel' }],
        [{ text: t.massadd, callback_data: 'menu_mass_add' }],
        [{ text: t.autoGroup, callback_data: 'menu_creategroup' }, { text: t.join, callback_data: 'menu_joingroup' }],
        [{ text: t.rename, callback_data: 'menu_rename_groups' }, { text: t.extract, callback_data: 'menu_extractlinks' }],
        [{ text: t.approve, callback_data: 'menu_approve' }, { text: t.kick, callback_data: 'menu_autokick' }],
        [{ text: t.broadcast, callback_data: 'menu_broadcast' }, { text: t.stats, callback_data: 'menu_stats' }],
        [{ text: t.pendingList, callback_data: 'menu_pending_list' }, { text: t.staffAudit, callback_data: 'menu_staff_audit' }],
        [{ text: t.ctcChecker, callback_data: 'menu_ctcchecker' }, { text: t.shield, callback_data: 'menu_security' }],
        [{ text: `ðŸŒ ${t.lang}: ${state.language}`, callback_data: 'menu_toggle_lang' }]
    ];
    
    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) {
        kb.push([{ text: `ðŸ‘‘ SYSTEM ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    }
    
    safeSend(chatId, `${t.menuTitle}\n${DIVIDER}${FOOTER}`, { reply_markup: { inline_keyboard: kb } });
}

function sendSlotsPanel(chatId, userId) {
    let kb = [];
    for (let i = 1; i <= 5; i++) {
        const session = activeClients.get(`${userId}_${i}`);
        const status = session?.isReady ? "ðŸŸ¢ Active" : "ðŸ”´ Offline";
        kb.push([{ text: `Slot ${i} [${i===1?'Primary':'Swarm'}]: ${status}`, callback_data: `login_slot_${i}` }]);
    }
    kb.push([{ text: "ðŸ”™ Back", callback_data: "btn_main_menu" }]);
    safeSend(chatId, "âš™ï¸ *MULTI-SLOT MANAGER*\nChoose a slot to Login/Logout:", { reply_markup: { inline_keyboard: kb } });
}

function sendShieldMenu(chatId, userId, messageId = null) {
    const sec = getSecurityConfig(userId);
    const state = getState(userId);
    const t = texts[state.language] || texts['EÉ´É¢ÊŸÉªsÊœ'];
    const infoStr = sec.ruleType === 'WHITELIST' ? t.infoWh : t.infoBl;
    
    const kb = [
        [{text: `ðŸ›¡ï¸ POWER: ${sec.enabled ? 'OFF' : 'ON'}`, callback_data: 'sec_toggle_shield'}],
        [{text: `ðŸŽ¯ SCOPE: ${sec.targetMode}`, callback_data: 'sec_menu_targets'}],
        [{text: `ðŸ”„ MODE: ${sec.ruleType}`, callback_data: 'sec_set_rule'}],
        [{text: `âš¡ AUTO-KICK: ${sec.autoKickEnabled ? 'ðŸŸ¢ ON' : 'ðŸ”´ OFF'}`, callback_data: 'sec_toggle_kick'}],
        [{text: 'âž• ADD CODE', callback_data: 'sec_add_code'}, {text: 'âž– REMOVE CODE', callback_data: 'sec_remove_code'}],
        [{text: 'ðŸ‘‘ ADD VIP NUMBER', callback_data: 'sec_add_vip'}, {text: 'âž– REMOVE VIP', callback_data: 'sec_remove_vip'}],
        [{text: 'ðŸ“– YE KAISE KAAM KARTA HAI?', callback_data: 'sec_help'}],
        [{text: 'ðŸ”™ BACK', callback_data: 'btn_main_menu'}]
    ];
    const text = `ðŸ›¡ï¸ *SHIELD CONFIG*\nStatus: ${sec.enabled ? 'ðŸŸ¢ ON' : 'ðŸ”´ OFF'}\nTarget: ${sec.targetMode}\n\nâ„¹ï¸ ${infoStr}\n\nðŸŒ Codes: ${sec.countries.join(', ')}\nðŸ‘‘ VIPs: ${sec.vipNumbers.join(', ')}`;
    
    if (messageId) {
        tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
    } else {
        safeSend(chatId, text, { reply_markup: { inline_keyboard: kb } });
    }
}

function sendAdminPanel(chatId, userId, messageId = null) {
    getState(userId).action = null;
    let text = `ðŸ‘‘ *SYSTEM ADMIN PANEL*\n${DIVIDER}\n*ðŸ‘¥ Total Users:* ${knownBotUsers.length}\n*Test Mode:* ${adminConfig.testModeEnabled ? 'ðŸŸ¡ ACTIVE' : 'ðŸ”´ DISABLED'}`;
    let kb = [ 
        [{text: 'âœ… Allow User', callback_data: 'admin_allow_user'}, {text: 'âŒ Revoke', callback_data: 'admin_revoke_user'}],
        [{text: `ðŸ›¡ï¸ Manage Admins (${adminConfig.admins.length})`, callback_data: 'admin_manage_admins'}],
        [{text: `ðŸš« Manage Bans (${adminConfig.bannedUsers.length})`, callback_data: 'admin_manage_bans'}],
        [{text: `ðŸ“¢ Manage Force Sub (${adminConfig.fsubChannels.length})`, callback_data: 'admin_manage_fsub'}],
        [{text: `ðŸ”’ BOT MODE: ${adminConfig.approvalRequired ? 'PRIVATE' : 'PUBLIC'}`, callback_data: 'admin_toggle_botmode'}],
        [{text: `ðŸ”” NEW USER ALERTS: ${adminConfig.botAlerts ? 'ðŸŸ¢ ON' : 'ðŸ”´ OFF'}`, callback_data: 'admin_toggle_alerts'}],
        [{text: 'ðŸ“¢ BOT BROADCAST', callback_data: 'admin_broadcast'}],
        [{text: 'âš™ï¸ FEATURE PERMISSIONS', callback_data: 'admin_feature_permissions'}]
    ];
    if (userId === OWNER_ID) kb.push([{text: `ðŸ› ï¸ TEST MODE: ${adminConfig.testModeEnabled ? 'TURN OFF' : 'TURN ON'}`, callback_data: 'admin_toggle_testmode'}]);
    kb.push([{text: 'ðŸ”™ BACK TO MENU', callback_data: 'btn_main_menu'}]);
    
    if (messageId) {
        tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
    } else {
        safeSend(chatId, text, {reply_markup: {inline_keyboard: kb}});
    }
}

function sendManageAdminsMenu(chatId, messageId) {
    const adminList = adminConfig.admins.length ? adminConfig.admins.join('\nâ€¢ ') : 'No additional admins.';
    const text = `ðŸ›¡ï¸ *MANAGE ADMINS*\n${DIVIDER}\n*Current Admins:*\nâ€¢ ${OWNER_ID} (OWNER)\nâ€¢ ${adminList}`;
    const kb = [[{text: 'âž• Add Admin', callback_data: 'admin_add'}, {text: 'âž– Remove Admin', callback_data: 'admin_remove'}], [{text: 'ðŸ”™ Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function sendManageBansMenu(chatId, messageId) {
    const banList = adminConfig.bannedUsers.length ? adminConfig.bannedUsers.join('\nâ€¢ ') : 'No banned users.';
    const text = `ðŸš« *MANAGE BANS*\n${DIVIDER}\n*Banned IDs:*\nâ€¢ ${banList}`;
    const kb = [[{text: 'ðŸš« Ban User', callback_data: 'admin_ban'}, {text: 'âœ… Unban User', callback_data: 'admin_unban'}], [{text: 'ðŸ”™ Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function sendManageFSubMenu(chatId, messageId) {
    const fsubList = adminConfig.fsubChannels.length ? adminConfig.fsubChannels.map(c => typeof c === 'object' ? c.id : c).join('\nâ€¢ ') : 'No channels set.';
    const text = `ðŸ“¢ *MANAGE FORCE SUB*\n${DIVIDER}\n*Status:* ${adminConfig.fsubEnabled ? 'ðŸŸ¢ ON' : 'ðŸ”´ OFF'}\n*Required Channels:*\nâ€¢ ${fsubList}`;
    const kb = [[{text: `Turn FSub ${adminConfig.fsubEnabled ? 'OFF' : 'ON'}`, callback_data: 'admin_toggle_fsub'}], [{text: 'âž• Add Channel', callback_data: 'admin_fsub_add'}, {text: 'âž– Remove Channel', callback_data: 'admin_fsub_remove'}], [{text: 'ðŸ”™ Back to Admin Panel', callback_data: 'btn_admin_panel'}]];
    tgBot.editMessageText(text, {chat_id: chatId, message_id: messageId, parse_mode: 'Markdown', reply_markup: {inline_keyboard: kb}}).catch(()=>{});
}

function updatePaginationMessage(chatId, messageId, userId) {
    const state = getState(userId);
    tgBot.editMessageText(`ðŸŽ¯ SELECT TARGET GROUPS: (${state.selectedGroupsArray.length} Selected)`, { chat_id: chatId, message_id: messageId, reply_markup: getPaginationKeyboard(userId) }).catch(()=>{});
}

function getPaginationKeyboard(userId) {
    const state = getState(userId);
    const start = state.currentPage * 5; 
    const items = state.adminGroups.slice(start, start + 5);
    let kb = [];
    
    items.forEach(g => { 
        const isSelected = state.selectedGroupsArray.includes(g.id); 
        kb.push([{ text: `${isSelected ? 'âœ…' : 'ðŸ‘‘'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); 
    });
    kb.push([{ text: `âš¡ EXECUTE`, callback_data: 'confirm_selection' }]);
    
    return { inline_keyboard: kb };
}

function sendGroupSettingsMenu(chatId, userId, msgId) {
    const state = getState(userId);
    const kb = { inline_keyboard: [ 
        [{ text: `ðŸ”’ Admin Only Msg: ${state.groupConfig.settings.msgsAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_msgsAdminOnly' }], 
        [{ text: `âœï¸ Admin Only Edit: ${state.groupConfig.settings.infoAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_infoAdminOnly' }], 
        [{ text: `ðŸš€ LAUNCH DEPLOYMENT`, callback_data: 'grp_deploy_now' }], 
        [{ text: `âŒ Cancel`, callback_data: 'btn_main_menu' }] 
    ] };
    if (msgId) tgBot.editMessageText(`âš™ï¸ *Phase 6: Permissions*`, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{});
    else safeSend(chatId, `âš™ï¸ *Phase 6: Permissions*`, { reply_markup: kb });
}
// ============================================================================
// ðŸ“¡ CALLBACK HANDLERS
// ============================================================================
tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;
    const state = getState(userId);
    
    const uClient = activeClients.get(`${userId}_1`)?.client; 
    
    tgBot.answerCallbackQuery(query.id).catch(()=>{});
    updateActivity(userId);
    
    if (!(await checkAccess(userId, chatId, query))) return;

    if (data === 'btn_main_menu') return sendMainMenu(chatId, userId);
    
    if (data === 'menu_toggle_lang') { 
        if (state.language === 'EÉ´É¢ÊŸÉªsÊœ') state.language = 'HÉªÉ´É¢ÊŸÉªsÊœ'; 
        else if (state.language === 'HÉªÉ´É¢ÊŸÉªsÊœ') state.language = 'IÉ´á´…á´É´á´‡sÉªá´€É´'; 
        else state.language = 'EÉ´É¢ÊŸÉªsÊœ';
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return sendMainMenu(chatId, userId);
    }

    if (data === 'menu_slots_panel') return sendSlotsPanel(chatId, userId);
    
    if (data.startsWith('login_slot_')) {
        const slotId = data.split('_')[2];
        const session = activeClients.get(`${userId}_${slotId}`);
        if (session && session.isReady) {
            return safeSend(chatId, `âš ï¸ Slot ${slotId} is already connected. Do you want to wipe it?`, { reply_markup: { inline_keyboard: [[{text: 'âœ”ï¸ Wipe Data', callback_data: `wipe_slot_${slotId}`}], [{text: 'âŒ Cancel', callback_data: 'menu_slots_panel'}]] } });
        }
        state.tempData.activeSlot = slotId;
        state.action = null;
        return safeSend(chatId, `Enter Phone Number for Slot ${slotId} (with code, e.g. 919999...):`, { reply_markup: { inline_keyboard: [[{text: 'ðŸ“· QR Code', callback_data: `qr_slot_${slotId}`}]] } });
    }

    if (data.startsWith('qr_slot_')) {
        startBaileysClient(userId, data.split('_')[2], null);
        return;
    }

    if (data.startsWith('wipe_slot_')) {
        const slotId = data.split('_')[2];
        const session = activeClients.get(`${userId}_${slotId}`);
        if (session && session.client) session.client.logout();
        const p = path.join(SESSIONS_DIR, `session_${userId}_slot_${slotId}`);
        if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
        activeClients.delete(`${userId}_${slotId}`);
        return sendSlotsPanel(chatId, userId);
    }

    if (data === 'btn_admin_panel') return sendAdminPanel(chatId, userId, query.message.message_id);

    // --- MISSION CART UI FLOW ---
    if (data === 'menu_mass_add') {
        state.action = 'CART_DRAFT';
        state.missionCart = [];
        return safeSend(chatId, "ðŸ“ *MISSION CART START*\nSend first VCF and put Group Link in caption:");
    }

    if (data === 'cart_add_more') {
        state.action = 'CART_DRAFT';
        return safeSend(chatId, "Attach next VCF + Link in caption:");
    }

    if (data === 'cart_done') {
        state.action = null;
        let kb = [
            [{ text: "ðŸ‘‘ Use Primary (Slot 1) for All", callback_data: "config_primary" }],
            [{ text: "âš”ï¸ Distributed Swarm (Slots 2-5)", callback_data: "exec_mode_swarm" }],
            [{ text: "âŒ Abort Mission", callback_data: "btn_main_menu" }]
        ];
        let summary = "ðŸ“¦ *CURRENT MISSION CART:*\n";
        state.missionCart.forEach((m, i) => summary += `${i+1}. ${m.vcfName} âž¡ï¸ ${m.groupLink}\n`);
        return safeSend(chatId, summary + "\nHow to assign numbers?", { reply_markup: { inline_keyboard: kb } });
    }

    // --- PARALLEL VS SEQUENTIAL LOGIC FOR PRIMARY ---
    if (data === 'config_primary') {
        let kb = [
            [{ text: "ðŸŒªï¸ Parallel (Sab Group Ek Sath)", callback_data: "exec_prim_parallel" }],
            [{ text: "â³ Sequential (Ek ke baad Ek)", callback_data: "config_prim_seq" }],
            [{ text: "ðŸ”™ Back", callback_data: "cart_done" }]
        ];
        tgBot.editMessageText("âš™ï¸ *PRIMARY MODE EXECUTION*\nAdding ek sath karni hai ya line-se?", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } }).catch(()=>{});
        return;
    }

    if (data === 'config_prim_seq') {
        let kb = [
            [{ text: "â¬‡ï¸ Line-by-Line (Order wise)", callback_data: "exec_prim_seq_line" }],
            [{ text: "ðŸŽ² Random Group by Group", callback_data: "exec_prim_seq_rand" }],
            [{ text: "ðŸ”™ Back", callback_data: "config_primary" }]
        ];
        tgBot.editMessageText("âš™ï¸ *SEQUENTIAL EXECUTION*\nGroups ka order kaisa rakhna hai?", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } }).catch(()=>{});
        return;
    }

    // Final Launch Triggers
    if (data === 'exec_prim_parallel') return executeCartMissions(chatId, userId, 'primary', 'parallel');
    if (data === 'exec_prim_seq_line') return executeCartMissions(chatId, userId, 'primary', 'seq_line');
    if (data === 'exec_prim_seq_rand') return executeCartMissions(chatId, userId, 'primary', 'seq_rand');
    if (data === 'exec_mode_swarm') return executeCartMissions(chatId, userId, 'swarm', null);

    // --- MENU REDIRECTS ---
    if (data === 'menu_ctcchecker') { state.action = 'WAIT_CTC_VCF'; state.tempData.targets = []; return safeSend(chatId, "ðŸ”Ž Upload VCF(s) to check active WA:"); }
    if (data === 'menu_staff_audit') { state.action = 'WAIT_AUDIT_VCF_LINK'; state.tempData.vcfs = []; return safeSend(chatId, "ðŸ•µï¸â€â™‚ï¸ Audit: Upload VCF(s) and put Link in caption:"); }
    if (data === 'menu_security') return sendShieldMenu(chatId, userId, query.message.message_id);
    
    // Extracted Menus List
    const menus = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast', 'menu_pending_list'];
    
    if (menus.includes(data)) {
        if (!uClient && !adminConfig.testModeEnabled) return safeSend(chatId, `âš ï¸ Authenticate Slot 1 first.`);
        
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return safeSend(chatId, `âž• Enter Group Base Name:`); }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS'; return safeSend(chatId, `ðŸ“¥ Enter Group Links:`); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA'; return safeSend(chatId, `âœï¸ Format:\nLink\nNew Name`); }
        if (data === 'menu_broadcast') { state.action = 'WAIT_BROADCAST_MSG'; return safeSend(chatId, `ðŸ“¢ Send Broadcast Message:`); }
        
        let statusMsg = await safeSend(chatId, "ðŸ“¡ Scanning Groups...");
        try {
            const groups = await uClient.groupFetchAllParticipating();
            state.adminGroups = Object.values(groups).filter(g => g.participants.find(p => p.id === jidNormalizedUser(uClient.user.id))?.admin).map(g => ({ id: g.id, name: g.subject }));
            
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            
            state.currentPage = 0; 
            state.selectedGroupsArray = []; 
            state.flowContext = data.replace('menu_', '').toUpperCase();
            
            return tgBot.sendMessage(chatId, `ðŸŽ¯ *SELECT TARGET GROUPS:*`, { reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { 
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
            return safeSend(chatId, "âŒ Fetch Failed."); 
        }
    }

    if (data === 'confirm_selection') {
        if (state.flowContext === 'AUTOKICK') { state.action = 'WAIT_KICK_TERM'; return safeSend(chatId, `âš”ï¸ Enter Kick Targets (Numbers/Codes):`); }
        if (state.flowContext === 'EXTRACTLINKS') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return extractGroupLinksEngine(chatId, userId, uClient); }
        if (state.flowContext === 'PENDING_LIST') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return pendingListEngine(chatId, userId, uClient); }
        if (state.flowContext === 'APPROVE') { return tgBot.editMessageText(`ðŸ‘¥ METHOD?`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text:'Turn OFF Approval', callback_data:'app_off'}, {text:'Manual', callback_data:'app_man'}]] }}); }
    }

    if (data === 'app_off' || data === 'app_man') {
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
        return autoApproveEngine(chatId, userId, uClient, data === 'app_off' ? 'OFF_SETTING' : 'MANUAL');
    }

    if (data.startsWith('selgrp_')) { 
        const id = data.split('_')[1];
        if (state.selectedGroupsArray.includes(id)) {
            state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); 
        } else {
            state.selectedGroupsArray.push(id); 
        }
        return updatePaginationMessage(chatId, query.message.message_id, userId);
    }
});

// ============================================================================
// ðŸ’¬ MESSAGE HANDLER (CART LOGIC, BROADCAST & WAITS)
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const state = getState(userId);
    const uClient = activeClients.get(`${userId}_1`)?.client;
    
    if (msg.text?.startsWith('/') || !(await checkAccess(userId, chatId, msg))) return;

    if (state.action === 'CART_DRAFT') {
        if (msg.document) {
            const linkMatch = (msg.caption || msg.text || '').match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
            if (!linkMatch) return safeSend(chatId, "âŒ Link missing in caption! Package not saved.");
            
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); 
            fs.unlinkSync(filePath);
            
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net');

            state.missionCart.push({
                vcfName: msg.document.file_name || 'Contacts.vcf',
                targets: [...new Set(numbers)],
                groupLink: linkMatch[1]
            });

            let kb = [[{ text: "âž• Add Next Package", callback_data: "cart_add_more" }], [{ text: "âœ… Done & Launch", callback_data: "cart_done" }]];
            return safeSend(chatId, `âœ… Package ${state.missionCart.length} Locked!\nTotal Cart: ${state.missionCart.length} groups.`, { reply_markup: { inline_keyboard: kb } });
        }
    }

    if (state.action === 'WAIT_CTC_VCF') {
        if (msg.document) {
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); 
            fs.unlinkSync(filePath);
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1].replace(/[^0-9]/g, ''));
            state.tempData.targets.push(...numbers);
        }
        clearTimeout(state.tempData.timer);
        state.tempData.timer = setTimeout(() => {
            state.action = null; 
            runCTCEngine(chatId, userId, uClient, [...new Set(state.tempData.targets)]);
        }, 2000);
        return;
    }

    if (state.action === 'WAIT_AUDIT_VCF_LINK') {
        const linkMatch = (msg.caption || msg.text || '').match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if (linkMatch) state.tempData.link = linkMatch[1];
        
        if (msg.document) {
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); 
            fs.unlinkSync(filePath);
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1].replace(/[^0-9]/g, ''));
            if (!state.tempData.vcfs) state.tempData.vcfs = [];
            state.tempData.vcfs.push({ targets: numbers });
        }
        
        clearTimeout(state.tempData.timer);
        state.tempData.timer = setTimeout(() => {
            state.action = null; 
            runCCTVAudit(chatId, userId, uClient);
        }, 2000);
        return;
    }

    // ðŸš¨ BROADCAST MEDIA HANDLER
    if (state.action === 'WAIT_BROADCAST_MSG') {
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; 
        state.action = null;
        
        if (!uClient) return safeSend(chatId, `âœ… [TEST MODE] Simulated broadcast to ${targets.length} targets.`);

        let statusMsg = await safeSend(chatId, `â³ *TÊ€á´€É´sá´Éªá´›á´›ÉªÉ´É¢ WA BÊ€á´á´€á´…á´„á´€sá´›...*`);
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
                        return safeSend(chatId, `âŒ *ERROR:* Media exceeds 20MB limit. Bot API cannot download files larger than 20MB. Process aborted.`);
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
                    await safeSend(chatId, `â˜• *HUMANIZING ENGINE:* VORTEX Éªs á´›á´€á´‹ÉªÉ´É¢ á´€ Ê™Ê€á´‡á´€á´‹...`);
                    await new Promise(r => setTimeout(r, 120000));
                }
                
                if (statusMsg && i % 3 === 0) {
                    tgBot.editMessageText(`â³ *TÊ€á´€É´sá´Éªá´›á´›ÉªÉ´É¢...*\n${createProgressBar(i+1, targets.length)}`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
                }

                try { 
                    let typingDuration = captionText.length > 0 ? (captionText.length * 40) + Math.random() * 1000 : 2000;
                    if (typingDuration > 10000) typingDuration = 10000;
                    
                    await uClient.sendPresenceUpdate('composing', targets[i]);
                    await new Promise(r => setTimeout(r, typingDuration));
                    await uClient.sendPresenceUpdate('paused', targets[i]);

                    await uClient.sendMessage(targets[i], msgOptions);
                    success++;
                } catch(e) { 
                    failed++; 
                } 

                let waitDelay = 3500 + (captionText.length * 10) + Math.random() * 3000;
                await new Promise(r => setTimeout(r, waitDelay)); 
            }
            
            if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, `âœ… *WA BROADCAST REPORT*\n${DIVIDER}\nðŸŽ¯ Tá´€Ê€É¢á´‡á´›s: ${targets.length}\nâœ”ï¸ Sá´œá´„á´„á´‡ss: ${success}\nâŒ Fá´€ÉªÊŸá´‡á´…: ${failed}`);
        } catch(e) { 
            console.error("Media Download Error:", e);
        } finally { 
            if (mediaPath && fs.existsSync(mediaPath)) fs.unlinkSync(mediaPath);
        }
        return;
    }

    if (state.tempData.activeSlot && state.action === null) {
        const slot = state.tempData.activeSlot;
        state.tempData.activeSlot = null;
        startBaileysClient(userId, slot, msg.text.replace(/[^0-9]/g, ''));
    }

    // Single Wait States
    if (state.action === 'WAIT_GROUP_NAME') { 
        state.groupConfig.baseName = msg.text.trim(); 
        state.action = 'WAIT_GROUP_COUNT'; 
        return safeSend(chatId, `ðŸ”¢ Phase 2: How many groups?`); 
    }
    
    if (state.action === 'WAIT_GROUP_COUNT') { 
        state.groupConfig.count = parseInt(msg.text); 
        state.action = 'WAIT_GROUP_MEMBER'; 
        return safeSend(chatId, `ðŸ‘¤ Phase 3: WA Admin Number (with code):`); 
    }
    
    if (state.action === 'WAIT_GROUP_MEMBER') { 
        state.groupConfig.memberId = msg.text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; 
        state.action = null; 
        return startGroupCreationProcess(chatId, userId, uClient); 
    }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const codes = [...msg.text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (!uClient) return safeSend(chatId, `Offline.`);
        for (let c of codes) { 
            try { 
                await uClient.groupAcceptInvite(c); 
                await new Promise(r=>setTimeout(r, 2000)); 
            } catch(e){} 
        }
        return safeSend(chatId, `âœ… Join Complete.`);
    }

    if (state.action === 'WAIT_RENAME_DATA') {
        const lines = msg.text.split('\n');
        const linkMatch = lines[0].match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        try { 
            const gid = await uClient.groupAcceptInvite(linkMatch[1]); 
            await uClient.groupUpdateSubject(gid, lines[1]); 
            state.action = null; 
            safeSend(chatId, `âœ… Renamed to: ${lines[1]}`); 
        } catch(e){}
    }

    if (state.action === 'WAIT_KICK_TERM') { 
        return runPurgeEngine(chatId, userId, uClient, msg.text); 
    }
});

// ============================================================================
// ðŸ’¥ CART EXECUTION ENGINE (WITH 30-60S DELAY & PARALLEL/RANDOM LOGIC)
// ============================================================================
async function executeCartMissions(chatId, userId, mode, subMode) {
    const state = getState(userId);
    let missions = [...state.missionCart];
    state.missionCart = []; // Clear cart immediately

    // Pre-flight setup
    if (mode === 'primary' && subMode === 'seq_rand') {
        missions = missions.sort(() => Math.random() - 0.5); // Shuffle for Random order
    }

    if (mode === 'primary') {
        if (subMode === 'parallel') {
            safeSend(chatId, `ðŸš€ *PRIMARY PARALLEL LAUNCH*\nAdding to ${missions.length} groups SIMULTANEOUSLY!`);
            missions.forEach(mission => processSingleMission(userId, "1", mission, chatId));
        } else {
            safeSend(chatId, `ðŸš€ *PRIMARY SEQUENTIAL LAUNCH*\nOrder: ${subMode === 'seq_rand' ? 'Randomized ðŸŽ²' : 'Line-by-Line â¬‡ï¸'}`);
            // IIFE to run sequentially without blocking the bot
            (async () => {
                for (let mission of missions) {
                    await processSingleMission(userId, "1", mission, chatId);
                    await new Promise(r => setTimeout(r, 60000)); // 1 Minute cooldown between groups to avoid ban
                }
                safeSend(chatId, "ðŸ *ALL SEQUENTIAL MISSIONS COMPLETED*");
            })();
        }
    } else if (mode === 'swarm') {
        safeSend(chatId, `ðŸš€ *DISTRIBUTED SWARM LAUNCH*\nAssigning groups to Slots 2-5...`);
        let swarmIndex = 2; // Swarm starts from Slot 2
        missions.forEach(mission => {
            let currentSlot = swarmIndex.toString();
            swarmIndex = swarmIndex >= 5 ? 2 : swarmIndex + 1; // Rotate 2-3-4-5
            processSingleMission(userId, currentSlot, mission, chatId);
        });
    }
}

async function processSingleMission(userId, slotId, mission, chatId) {
    const session = activeClients.get(`${userId}_${slotId}`);
    if (!session?.isReady) {
        return safeSend(chatId, `âš ï¸ Mission for ${mission.vcfName} aborted: Slot ${slotId} is offline.`);
    }

    const client = session.client;
    try {
        await safeSend(chatId, `âš™ï¸ *Processing:* ${mission.vcfName}\nðŸŽ¯ *Group:* ${mission.groupLink}\nðŸ”Œ *Assigned Slot:* ${slotId}`);
        const gid = await client.groupAcceptInvite(mission.groupLink);
        
        for (let i = 0; i < mission.targets.length; i += 5) {
            await client.groupParticipantsUpdate(gid, mission.targets.slice(i, i + 5), 'add');
            
            // ðŸ”¥ STRICT REQUIREMENT: 30 TO 60 SECONDS RANDOM DELAY
            const randomDelay = 30000 + Math.floor(Math.random() * 30000); 
            await new Promise(r => setTimeout(r, randomDelay));
        }
        safeSend(chatId, `âœ… *Completed:* ${mission.vcfName} (Slot ${slotId})`);
    } catch (e) {
        safeSend(chatId, `âŒ Error in ${mission.vcfName}: ${e.message}`);
    }
}

// ============================================================================
// ðŸ’¥ CORE ENGINES (FULL DETAIL - UNCOMPRESSED)
// ============================================================================

async function pendingListEngine(chatId, userId, uClient) {
    const targets = getState(userId).selectedGroupsArray;
    let report = `ðŸ“‹ *PENDING STATS*\n`;
    let globalStats = {};
    const ccodes = ['91','92','1','62','234']; 

    const groupsToProcess = targets.length ? targets : getState(userId).adminGroups.map(g => g.id);

    for (let gid of groupsToProcess) {
        try {
            const meta = await uClient.groupMetadata(gid);
            const reqs = await uClient.groupRequestParticipantsList(gid);
            
            if (reqs && reqs.length > 0) {
                report += `ðŸ”¹ *${meta.subject}:* ${reqs.length} Pending\n`;
                reqs.forEach(r => {
                    let num = (r.jid || r).split('@')[0];
                    let code = 'Other';
                    for (let c of ccodes) {
                        if(num.startsWith(c)) { code = '+' + c; break; }
                    }
                    globalStats[code] = (globalStats[code] || 0) + 1;
                });
            }
        } catch(e) {}
    }
    
    let summary = `ðŸ“Š *GLOBAL:* `;
    for (let [c, count] of Object.entries(globalStats)) {
        summary += `${c}: ${count} | `;
    }
    
    sendLongReport(chatId, summary + `\n\n` + report, 'Pending_Report');
}

async function runCCTVAudit(chatId, userId, uClient) {
    const state = getState(userId);
    let vcfNumbers = []; 
    state.tempData.vcfs.forEach(v => vcfNumbers.push(...v.targets));
    vcfNumbers = [...new Set(vcfNumbers)];
    
    try {
        const targetGid = await uClient.groupAcceptInvite(state.tempData.link);
        let logs = fs.existsSync(AUDIT_LOGS_FILE) ? JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE)) : {};
        const groupLogs = logs[targetGid] || [];
        
        let auditTxt = `ðŸ•µï¸â€â™‚ï¸ *CCTV AUDIT REPORT*\n${DIVIDER}\n`;
        let totalGhapla = 0;

        if (groupLogs.length === 0) {
            auditTxt += "No direct adds tracked for this group in last 24h.";
        } else {
            groupLogs.forEach(entry => {
                let correct = 0;
                let wrong = [];
                entry.members.forEach(m => {
                    let num = m.split('@')[0];
                    if (vcfNumbers.includes(num)) correct++;
                    else { wrong.push(num); totalGhapla++; }
                });
                auditTxt += `ðŸ‘¤ Staff: +${entry.addedBy.split('@')[0]}\nðŸŸ¢ Correct: ${correct} | ðŸ”´ Ghapla: ${wrong.length}\n${wrong.length ? '   â”” ' + wrong.join(', ') : ''}\n\n`;
            });
        }
        
        safeSend(chatId, auditTxt + `\nâš ï¸ Total Ghapla Detected: ${totalGhapla}`);
    } catch(e){ 
        safeSend(chatId, "âŒ Audit Error: " + e.message); 
    }
}

async function runCTCEngine(chatId, userId, uClient, rawNumbers) {
    if (!uClient) return safeSend(chatId, `âš ï¸ Connect Slot 1 to use CTC Checker.`);
    let validWA = [];
    let statusMsg = await safeSend(chatId, `â³ *RUNNING CTC VERIFICATION...*\nChecking ${rawNumbers.length} numbers with Meta API...`);
    
    for (let i = 0; i < rawNumbers.length; i++) {
        try {
            const [res] = await uClient.onWhatsApp(rawNumbers[i]);
            if (res && res.exists) validWA.push(rawNumbers[i]);
        } catch(e) {}
        
        if (i > 0 && i % 25 === 0 && statusMsg) {
            tgBot.editMessageText(`ðŸ” *Verifying...*\n${createProgressBar(i, rawNumbers.length)}\nðŸŸ¢ Valid: ${validWA.length}`, {chat_id: chatId, message_id: statusMsg.message_id}).catch(()=>{});
        }
    }
    
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
    await safeSend(chatId, `ðŸ”Ž *CTC REPORT*\nTotal: ${rawNumbers.length} | Valid WA: ${validWA.length}`);
    
    if (validWA.length > 0) {
        let vcfTxt = "";
        validWA.forEach((n, idx) => vcfTxt += `BEGIN:VCARD\nVERSION:3.0\nFN:CTC_Verified_${idx+1}\nTEL;type=CELL;type=VOICE;waid=${n}:+${n}\nEND:VCARD\n`);
        const wp = path.join(__dirname, `Verified_${chatId}.vcf`);
        fs.writeFileSync(wp, vcfTxt);
        await tgBot.sendDocument(chatId, wp, { caption: "âœ… 100% Verified Active WhatsApp Contacts" });
        fs.unlinkSync(wp);
    }
}

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig;
    let report = `âœ… *GROUPS CREATION REPORT*\n${DIVIDER}\n`;
    
    for (let i = 1; i <= config.count; i++) {
        try {
            const res = await uClient.groupCreate(`${config.baseName} ${i}`, [config.memberId]);
            const link = await uClient.groupInviteCode(res.id);
            report += `ðŸ”¹ Group ${i}: https://chat.whatsapp.com/${link}\n`;
            
            if (config.settings.msgsAdminOnly) await uClient.groupSettingUpdate(res.id, 'announcement').catch(()=>{}); 
            if (config.settings.infoAdminOnly) await uClient.groupSettingUpdate(res.id, 'locked').catch(()=>{});
            
            await new Promise(r => setTimeout(r, 5000)); // Rate limit safety
        } catch(e) {
            report += `ðŸ”¹ Group ${i} Failed: ${e.message}\n`;
        }
    }
    
    sendLongReport(chatId, report, 'Created_Groups');
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const targets = getState(userId).selectedGroupsArray;
    const groupsToProcess = targets.length ? targets : getState(userId).adminGroups.map(g => g.id);
    let report = `ðŸ”— *EXTRACTED LINKS*\n${DIVIDER}\n\n`;
    
    let statusMsg = await safeSend(chatId, `â³ *EXTRACTING*\nPulling links from groups...`);
    
    for (let i = 0; i < groupsToProcess.length; i++) { 
        if (statusMsg) tgBot.editMessageText(`ðŸ” *Extracting...*\n${createProgressBar(i+1, groupsToProcess.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const metadata = await uClient.groupMetadata(groupsToProcess[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = metadata.participants.find(p => p.id === botId);
            
            if (!botParticipant || !botParticipant.admin) { 
                report += `ðŸ”¹ *${metadata.subject}:* âŒ Not an Admin\n\n`; 
                continue; 
            }

            const code = await uClient.groupInviteCode(groupsToProcess[i]); 
            report += `ðŸ”¹ *${metadata.subject}*\nhttps://chat.whatsapp.com/${code}\n\n`; 
        } catch (e) { 
            report += `ðŸ”¹ ID: ${groupsToProcess[i]} âŒ Error\n\n`; 
        } 
    }
    
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient, mode) {
    const targets = getState(userId).selectedGroupsArray;
    const groupsToProcess = targets.length ? targets : getState(userId).adminGroups.map(g => g.id);
    
    let statusMsg = await safeSend(chatId, `â³ *APPROVE ENGINE RUNNING*...`);
    let report = `âœ… *APPROVAL REPORT*\n${DIVIDER}\n`;

    for (let i = 0; i < groupsToProcess.length; i++) { 
        if (statusMsg) tgBot.editMessageText(`ðŸ‘¥ *Authorizing...*\n${createProgressBar(i+1, groupsToProcess.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
        try { 
            const metadata = await uClient.groupMetadata(groupsToProcess[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = metadata.participants.find(p => p.id === botId);
            
            if (!botParticipant || !botParticipant.admin) { 
                report += `ðŸ”¹ *${metadata.subject}:* âŒ Not an Admin\n`; 
                continue; 
            }

            if (mode === 'OFF_SETTING') {
                await uClient.groupJoinApprovalMode(groupsToProcess[i], 'off'); 
                report += `ðŸ”¹ *${metadata.subject}:* Approval Turned OFF.\n`; 
            } else if (mode === 'MANUAL') {
                const reqs = await uClient.groupRequestParticipantsList(groupsToProcess[i]);
                if (reqs && reqs.length > 0) { 
                    await uClient.groupRequestParticipantsUpdate(groupsToProcess[i], reqs.map(r => r.jid), 'approve');
                    report += `ðŸ”¹ *${metadata.subject}:* Approved ${reqs.length} members\n`;
                }
            }
        } catch (e) { } 
        await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
    }
    
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report + FOOTER, 'Approval_Report');
}

async function runPurgeEngine(chatId, userId, uClient, inputString) {
    const inputList = inputString.replace(/,/g, ' ').split(/\s+/).filter(p => p.trim() !== '');
    const targets = getState(userId).selectedGroupsArray;
    const groupsToProcess = targets.length ? targets : getState(userId).adminGroups.map(g => g.id);
    
    let statusMsg = await safeSend(chatId, `â³ *KICKING USERS...*`);
    let report = `âœ… *AUTO KICK REPORT*\n${DIVIDER}\n`;

    for (let i = 0; i < groupsToProcess.length; i++) {
        try {
            if (statusMsg) tgBot.editMessageText(`ðŸ” *Scanning...*\n${createProgressBar(i+1, groupsToProcess.length)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
            
            const meta = await uClient.groupMetadata(groupsToProcess[i]);
            const botId = jidNormalizedUser(uClient.user.id);
            const botParticipant = meta.participants.find(p => p.id === botId);
            
            if (!botParticipant || !botParticipant.admin) { 
                report += `ðŸ”¹ *${meta.subject}:* âŒ Not an Admin\n`; 
                continue; 
            }

            let targetsToRemove = [];
            for (const participant of meta.participants) {
                if (participant.admin) continue; 
                let shouldKick = false;
                let partNum = participant.id.split('@')[0];
                for (const item of inputList) { 
                    let searchItem = item.startsWith('+') ? item.substring(1) : item;
                    if (partNum.startsWith(searchItem) || partNum === searchItem) { 
                        shouldKick = true; break; 
                    } 
                }
                if (shouldKick) targetsToRemove.push(participant.id);
            }
            
            if (targetsToRemove.length > 0) { 
                await uClient.groupParticipantsUpdate(groupsToProcess[i], targetsToRemove, 'remove');
                report += `ðŸ”¹ *${meta.subject}:* Kicked ${targetsToRemove.length} members\n`; 
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
            }
        } catch (e) {}
    }
    
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
    return sendLongReport(chatId, report + FOOTER, 'Purge_Report');
}

tgBot.on('polling_error', (error) => {
    if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.log('\n[ðŸš¨ ANTI-CRASH ALERT] 409 CONFLICT: Token active on another server!');
    } else {
        console.log('\n[POLLING ERROR]', error.message);
    }
});

process.on('SIGINT', async () => {
    for (let [sessionKey, session] of activeClients) { 
        if (session && session.client) {
            try { session.client.ws.close(); } catch(e) {}
        }
    }
    process.exit(0);
});