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
process.setMaxListeners(50);

process.on('uncaughtException', (err) => {
    console.error('\n🚨 [VORTEX FATAL ERROR] Caught Exception:', err.message);
    console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
    console.error('\n🚨 [VORTEX CRITICAL] Unhandled Rejection:', reason);
});

// ============================================================================
// 🌐 EXPRESS SERVER (FOR RAILWAY/HOSTING 24/7 UPTIME)
// ============================================================================
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;font-family:sans-serif;">🚀 VORTEX V57 ULTIMATE ENGINE ACTIVE</h1>');
});

app.listen(port, () => {
    console.log(`\n☁️ [VORTEX SERVER] Active and listening on Port ${port}`);
});

// ============================================================================
// 🤖 TELEGRAM BOT SETUP & CONSTANTS
// ============================================================================
const TELEGRAM_TOKEN = '8709803495:AAFK5nKZEnsf7K1rC6dwCctlewwRc_fT0Dk'; 
const OWNER_ID = 5524906942; 
const OWNER_USERNAME = '@Naimish555';
const tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const activeClients = new Map();
let userStates = {};
let knownBotUsers = [];

const BOT_USERS_FILE = './bot_users.json';
const ADMIN_CONFIG_FILE = './admin_config.json';
const SESSIONS_DIR = path.join(__dirname, 'multi_sessions');

if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    console.log(`📁 [SYSTEM] Created new sessions directory.`);
}

if (fs.existsSync(BOT_USERS_FILE)) { 
    try { 
        knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE)); 
        console.log(`👥 [SYSTEM] Loaded ${knownBotUsers.length} known users.`);
    } catch(e) { 
        console.error(`❌ [ERROR] Failed to load bot_users.json:`, e.message);
    } 
}

// ============================================================================
// ⚙️ ADVANCED ADMIN & SECURITY CONFIGURATION
// ============================================================================
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
        massadd: ['owner','admin','user'], 
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
        adminConfig = { ...adminConfig, ...JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE)) }; 
    } catch(e) { 
        console.error(`❌ [ERROR] Failed to load admin config:`, e.message);
    } 
}

function saveAdminConfig() { 
    try { 
        fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(adminConfig, null, 4)); 
    } catch (err) { 
        console.error(`❌ [ERROR] Failed to save admin config:`, err.message);
    } 
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
            tempData: {}, 
            language: 'Eɴɢʟɪsʜ', 
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

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `\n${DIVIDER}\n👑 _VORTEX V57 PEAK ENGINE_ | Oᴡɴᴇʀ: ${OWNER_USERNAME}`;

// ============================================================================
// 🌍 MULTI-LANGUAGE PACK (100% TRANSLATED & FIXED)
// ============================================================================
const texts = {
    'Eɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Rᴇǫᴜɪʀᴇᴅ)", 
        login: "🔐 Lᴏɢɪɴ WA", massadd: "👥 Mᴀss Aᴅᴅ (Sᴡᴀʀᴍ)", autoGroup: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", extract: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", kick: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", 
        broadcast: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", stats: "📊 Bᴏᴛ Sᴛᴀᴛs", shield: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", lang: "Lᴀɴɢᴜᴀɢᴇ" 
    },
    'Hɪɴɢʟɪsʜ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Cᴏɴɴᴇᴄᴛᴇᴅ & Rᴇᴀᴅʏ Hᴀɪ", statusOffline: "🔴 WA Nᴏᴛ Cᴏɴɴᴇᴄᴛᴇᴅ (Lᴏɢɪɴ Kᴀʀᴏ)", 
        login: "🔐 WA Lᴏɢɪɴ Kᴀʀᴏ", massadd: "👥 Eᴋ Sᴀᴀᴛʜ Aᴅᴅ", autoGroup: "➕ Gʀᴏᴜᴘs Bᴀɴᴀᴏ", join: "📥 Aᴜᴛᴏ Jᴏɪɴ", 
        rename: "✏️ Nᴀᴀᴍ Bᴀᴅʟᴏ", extract: "🔗 Lɪɴᴋs Nɪᴋᴀʟᴏ", approve: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", kick: "⚔️ Aᴜᴛᴏ Nɪᴋᴀʟᴏ", 
        broadcast: "📢 Sᴀʙᴋᴏ Msɢ Bʜᴇᴊᴏ", stats: "📊 Bᴏᴛ Kɪ Sᴛᴀᴛs", shield: "🛡️ Aᴜᴛᴏ Msɢ Dᴇʟᴇᴛᴇ", lang: "Bʜᴀsʜᴀ" 
    },
    'Iɴᴅᴏɴᴇsɪᴀɴ': { 
        menuTitle: "🤖 *VORTEX DASHBOARD*", statusLabel: "📡 Sᴛᴀᴛᴜs", statusOnline: "🟢 WA Tᴇʀʜᴜʙᴜɴɢ & Sɪᴀᴘ", statusOffline: "🔴 WA Tɪᴅᴀᴋ Tᴇʀʜᴜʙᴜɴɢ (Wᴀᴊɪʙ Lᴏɢɪɴ)", 
        login: "🔐 Mᴀsᴜᴋ WA", massadd: "👥 Tᴀᴍʙᴀʜ Mᴀssᴀʟ", autoGroup: "➕ Bᴜᴀᴛ Gʀᴜᴘ", join: "📥 Gᴀʙᴜɴɢ Oᴛᴏᴍᴀᴛɪs", 
        rename: "✏️ Uʙᴀʜ Nᴀᴍᴀ Gʀᴜᴘ", extract: "🔗 Aᴍʙɪʟ Tᴀᴜᴛᴀɴ", approve: "👥 Sᴇᴛᴜᴊᴜɪ Oᴛᴏᴍᴀᴛɪs", kick: "⚔️ Tᴇɴᴅᴀɴɢ Oᴛᴏᴍᴀᴛɪs", 
        broadcast: "📢 Sɪᴀʀᴀɴ", stats: "📊 Sᴛᴀᴛɪsᴛɪᴋ Bᴏᴛ", shield: "🛡️ Hᴀᴘᴜs Pᴇsᴀɴ Oᴛᴏ", lang: "Bᴀʜᴀsᴀ" 
    }
};

// ============================================================================
// 🛠️ UTILITY FUNCTIONS
// ============================================================================
async function safeSend(chatId, text, options = {}) { 
    try { 
        return await tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options }); 
    } catch (e) { 
        console.error(`❌ [TG ERROR] Failed to send message to ${chatId}:`, e.message);
        return null; 
    } 
}

async function sendLongReport(chatId, text, filename, options = {}) { 
    if (text.length > 3900) { 
        const fp = path.join(__dirname, `${filename}_${chatId}.txt`); 
        fs.writeFileSync(fp, text); 
        await tgBot.sendDocument(chatId, fp, { caption: `📄 *REPORT*\n${FOOTER}`, parse_mode: 'Markdown', ...options }); 
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
    if (!knownBotUsers.includes(userId)) { 
        knownBotUsers.push(userId); 
        try { 
            fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(knownBotUsers)); 
            console.log(`👤 [NEW USER] ID: ${userId} registered.`);
        } catch(e) {
            console.error(`❌ [ERROR] Could not save new user.`);
        }
    }
    return true; 
}

// ============================================================================
// 🚀 BAILEYS CORE ENGINE (HEAVY & FULL-POWERED)
// ============================================================================
async function startBaileysClient(userId, chatId, cleanNumber = null) {
    const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
    
    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath, { recursive: true });
    }

    console.log(`\n🔄 [VORTEX ENGINE] Booting Baileys WebSocket for User: ${userId}...`);
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    
    if(chatId) safeSend(chatId, `📡 *Phase 1: Booting Vortex Engine [Peak Power]...*`);
    
    // 🔥 PEAK CONFIGURATION: Ubuntu Spoof + Disabled Full Sync
    const client = makeWASocket({ 
        version, 
        auth: state, 
        printQRInTerminal: false, 
        logger: pino({ level: 'silent' }), 
        browser: ['Ubuntu', 'Chrome', '120.0.0.0'],
        syncFullHistory: false,
        generateHighQualityLinkPreview: false
    });
    
    activeClients.set(userId, { client: client, status: 'initializing', isReady: false });
    
    client.ev.on('creds.update', saveCreds);

    let pairingCodeRequested = false;

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr && chatId) {
            if (cleanNumber) {
                if (!pairingCodeRequested) {
                    pairingCodeRequested = true; 
                    console.log(`🔑 [PAIRING] Requesting code for: ${cleanNumber}`);
                    setTimeout(async () => {
                        try { 
                            const code = await client.requestPairingCode(cleanNumber); 
                            const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
                            console.log(`✅ [PAIRING] Code generated: ${formattedCode}`);
                            safeSend(userId, `🔑 *PAIRING CODE:*\n\n\`${formattedCode}\`\n\n1️⃣ Open WhatsApp > Linked Devices > Link with number\n2️⃣ Enter code.`); 
                        } catch(e) { 
                            console.error(`❌ [PAIRING ERROR]:`, e.message);
                            safeSend(userId, `❌ Pairing failed: ${e.message}`); 
                            pairingCodeRequested = false; 
                        }
                    }, 3000);
                }
            } else {
                if (!pairingCodeRequested) {
                    pairingCodeRequested = true;
                    console.log(`📷 [QR] Sending QR Code to Telegram...`);
                    tgBot.sendPhoto(userId, `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`, { caption: `📷 *PAIR QR CODE*\nScan to connect.` }); 
                }
            }
        }
        
        if (connection === 'open') {
            console.log(`🟢 [VORTEX CONNECTED] WhatsApp successfully linked for User: ${userId}`);
            const cs = activeClients.get(userId); 
            if (cs) { 
                cs.isReady = true; 
                cs.status = 'connected'; 
            }
            // 🔥 UX FIX: Hardwired to userId so it never fails to notify + Auto opens Dashboard
            await safeSend(userId, `✅ *AUTHENTICATION SUCCESSFUL*\nVortex Engine is Live & Connected!`);
            sendMainMenu(userId, userId); 
        }
        
        if (connection === 'close') {
            const cs = activeClients.get(userId);
            const statusCode = (lastDisconnect.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            
            console.log(`🔴 [CONNECTION CLOSED] Status Code: ${statusCode}. Reconnecting: ${shouldReconnect}`);
            
            if (shouldReconnect) {
                if (statusCode === DisconnectReason.restartRequired) {
                    console.log(`🔄 [RESTART] WhatsApp server requested a restart. Re-hooking...`);
                    startBaileysClient(userId, null);
                } else if (cs && cs.isReady) {
                    console.log(`🔄 [AUTO-RECONNECT] Session dropped. Reconnecting silently...`);
                    startBaileysClient(userId, null);
                } else {
                    activeClients.delete(userId);
                    safeSend(userId, `⚠️ *Timeout/Blocked:* WhatsApp rejected the connection. Please click 'Login WA' to try again.`);
                }
            } else { 
                console.log(`🚨 [LOGGED OUT] User explicitly logged out or session wiped.`);
                activeClients.delete(userId); 
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true }); 
                }
                safeSend(userId, `🚨 *WA DISCONNECTED*\nSession Wiped completely from server.`); 
            }
        }
    });

    // 🔥 ANTI-SPAM & SHIELD LISTENER
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
        } else if (sec.ruleType === 'BLACKLIST') { 
            if (matchedCode) shouldDelete = true; 
        }
        
        if (!shouldDelete) return;

        try {
            const groupMetadata = await client.groupMetadata(remoteJid);
            const botJid = jidNormalizedUser(client.user.id);
            
            const botIsAdmin = groupMetadata.participants.find(p => p.id === botJid)?.admin;
            if (!botIsAdmin) return;
            
            const authorIsAdmin = groupMetadata.participants.find(p => p.id === participant)?.admin;
            if (authorIsAdmin) return;

            console.log(`🛡️ [SHIELD ACTIVE] Deleting unauthorized message from ${authorNum}`);
            await client.sendMessage(remoteJid, { delete: msg.key });
            
            sec.stats.deleted += 1; 
            sec.violations[participant] = (sec.violations[participant] || 0) + 1; 
            saveAdminConfig();

            if (sec.violations[participant] >= sec.strikeCount && sec.autoKickEnabled) {
                console.log(`⚔️ [AUTO-KICK] Target ${authorNum} reached maximum strikes. Executing removal.`);
                await client.groupParticipantsUpdate(remoteJid, [participant], 'remove');
                
                sec.stats.kicked += 1; 
                sec.violations[participant] = 0; 
                saveAdminConfig();
                
                safeSend(OWNER_ID, `⚔️ *AUTO KICK EXECUTED*\n🎯 Group: ${groupMetadata.subject}\n💀 Target: +${authorNum}\n⚠️ 3 Strikes Reached.`);
            }
        } catch(e) {
            console.error(`❌ [SHIELD ERROR] Failed to process violation:`, e.message);
        }
    });
}

if (fs.existsSync(SESSIONS_DIR)) { 
    fs.readdirSync(SESSIONS_DIR).forEach(dir => { 
        if (dir.startsWith('session_')) {
            const uid = dir.split('session_')[1];
            console.log(`🔄 [AUTO-BOOT] Resuming session for User: ${uid}`);
            startBaileysClient(uid, null); 
        }
    }); 
}

// ============================================================================
// 📱 DYNAMIC MAIN MENU & UI
// ============================================================================
function sendMainMenu(chatId, userId) {
    const state = getState(userId); 
    state.action = null; 
    
    const isReady = activeClients.get(userId)?.isReady;
    const t = texts[state.language] || texts['Eɴɢʟɪsʜ']; 
    
    let kb = [];
    
    if (!isReady && hasFeatureAccess(userId, 'login')) {
        kb.push([{ text: t.login, callback_data: 'menu_login' }]);
    } else if (isReady) {
        kb.push([{ text: `🔓 Lᴏɢᴏᴜᴛ`, callback_data: 'menu_logout_confirm' }]);
    }
    
    if (hasFeatureAccess(userId, 'massadd')) {
        kb.push([{ text: t.massadd, callback_data: 'menu_mass_add' }]);
    }
    
    let r1 = [];
    if (hasFeatureAccess(userId, 'creategroup')) r1.push({ text: t.autoGroup, callback_data: 'menu_creategroup' });
    if (hasFeatureAccess(userId, 'joingroup')) r1.push({ text: t.join, callback_data: 'menu_joingroup' });
    if (r1.length > 0) kb.push(r1);
    
    let r2 = [];
    if (hasFeatureAccess(userId, 'renamegroups')) r2.push({ text: t.rename, callback_data: 'menu_rename_groups' });
    if (hasFeatureAccess(userId, 'extractlinks')) r2.push({ text: t.extract, callback_data: 'menu_extractlinks' });
    if (r2.length > 0) kb.push(r2);
    
    let r3 = [];
    if (hasFeatureAccess(userId, 'approve')) r3.push({ text: t.approve, callback_data: 'menu_approve' });
    if (hasFeatureAccess(userId, 'autokick')) r3.push({ text: t.kick, callback_data: 'menu_autokick' });
    if (r3.length > 0) kb.push(r3);
    
    let r4 = [];
    if (hasFeatureAccess(userId, 'broadcast')) r4.push({ text: t.broadcast, callback_data: 'menu_broadcast' });
    if (hasFeatureAccess(userId, 'stats')) r4.push({ text: t.stats, callback_data: 'menu_stats' });
    if (r4.length > 0) kb.push(r4);
    
    if (hasFeatureAccess(userId, 'security')) {
        kb.push([{ text: t.shield, callback_data: 'menu_security' }]);
    }
    
    kb.push([{ text: `🌐 ${t.lang}: ${state.language}`, callback_data: 'menu_toggle_lang' }]); 
    
    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) {
        kb.push([{ text: `👑 SYSTEM ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    }
    
    const humanStatus = isReady ? t.statusOnline : t.statusOffline;
    const menuText = `${t.menuTitle} \n${DIVIDER}\n${t.statusLabel}: ${humanStatus}\n\n_System running at Peak Capacity_${FOOTER}`;
    
    safeSend(chatId, menuText, { reply_markup: { inline_keyboard: kb } });
}

// ============================================================================
// 📡 TELEGRAM COMMAND LISTENERS
// ============================================================================
tgBot.onText(/\/start/, async (msg) => { 
    if (await checkAccess(msg.from.id, msg.chat.id, msg)) {
        console.log(`📱 [UI] User ${msg.from.id} requested Main Menu.`);
        sendMainMenu(msg.chat.id, msg.from.id);
    }
});

tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; 
    const userId = query.from.id; 
    const data = query.data; 
    const state = getState(userId);
    const uClient = activeClients.get(userId)?.client; 
    
    tgBot.answerCallbackQuery(query.id).catch(()=>{});

    if (!(await checkAccess(userId, chatId, query))) return;

    if (data === 'menu_toggle_lang') { 
        if (state.language === 'Eɴɢʟɪsʜ') state.language = 'Hɪɴɢʟɪsʜ';
        else if (state.language === 'Hɪɴɢʟɪsʜ') state.language = 'Iɴᴅᴏɴᴇsɪᴀɴ';
        else state.language = 'Eɴɢʟɪsʜ';
        
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{});
        return sendMainMenu(chatId, userId);
    }

    if (data === 'btn_main_menu') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return sendMainMenu(chatId, userId); 
    }

    if (data === 'menu_login') {
        return tgBot.editMessageText(`📱 *Cᴏɴɴᴇᴄᴛ WʜᴀᴛsAᴘᴘ*\nChoose Authentication Method:`, { 
            chat_id: chatId, 
            message_id: query.message.message_id, 
            parse_mode: 'Markdown', 
            reply_markup: { 
                inline_keyboard: [
                    [{ text: '🔑 Pᴀɪʀ Cᴏᴅᴇ', callback_data: 'login_pair_code' }, { text: '📷 Pᴀɪʀ QR', callback_data: 'login_pair_qr' }], 
                    [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_main_menu' }]
                ] 
            } 
        });
    }

    if (data === 'login_pair_code') { 
        state.action = 'WAITING_FOR_LOGIN_NUMBER'; 
        return safeSend(chatId, `🔑 *Pᴀɪʀ Cᴏᴅᴇ Cᴏɴɴᴇᴄᴛɪᴏɴ*\nEnter Target Phone Number with Country Code (eg. 919999999999):`); 
    }

    if (data === 'login_pair_qr') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return startBaileysClient(userId, chatId, null); 
    }

    if (data === 'menu_logout_confirm') {
        return tgBot.editMessageText(`⚠️ *WIPE SESSION?*\nThis will permanently delete your active connection.`, { 
            chat_id: chatId, 
            message_id: query.message.message_id, 
            reply_markup: { 
                inline_keyboard: [ 
                    [{ text: '✔️ Yes, Wipe Data', callback_data: 'menu_logout_execute' }], 
                    [{ text: '❌ Cancel', callback_data: 'btn_main_menu' }] 
                ] 
            }
        });
    }

    if (data === 'menu_logout_execute') { 
        if (uClient) {
            console.log(`🚨 [LOGOUT] Force killing session for User ${userId}`);
            uClient.logout(); 
        }
        const p = path.join(SESSIONS_DIR, `session_${userId}`); 
        if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); 
        activeClients.delete(userId); 
        return sendMainMenu(chatId, userId); 
    }

    if (data === 'menu_mass_add') { 
        state.action = 'WAIT_VCF_AND_LINK'; 
        return tgBot.editMessageText(`➕ **SWARM MASS ADD ENGINE**\nSend the Group Link in the caption and attach the VCF file.`, { 
            chat_id: chatId, 
            message_id: query.message.message_id, 
            parse_mode: 'Markdown', 
            reply_markup: { 
                inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_main_menu'}]]
            } 
        }); 
    }

    if (data.startsWith('start_mission_')) { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return executeLiveParallelEngine(chatId, userId, uClient, data.replace('start_mission_', '')); 
    }

    const menus = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast'];
    
    if (menus.includes(data)) {
        if (!uClient) return safeSend(chatId, "⚠️ System offline. Please connect WhatsApp first.");
        
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return safeSend(chatId, "➕ *Phase 1:* Enter Group Base Name:"); }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS'; return safeSend(chatId, "📥 *AUTO-JOIN*\nEnter Group Links (Multiple allowed):"); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA'; return safeSend(chatId, "✏️ *RENAMER*\nEnter Format:\nLink\\nNew Name"); }
        if (data === 'menu_broadcast') { state.action = 'WAIT_BROADCAST_MSG'; return safeSend(chatId, "📢 *BROADCAST ENGINE*\nSend the message you want to broadcast:"); }
        
        let statusMsg = await safeSend(chatId, "📡 *Scanning WhatsApp Server for Admin Groups...*");
        
        try {
            console.log(`🔍 [FETCH] Requesting group metadata from server for User ${userId}`);
            const groups = await uClient.groupFetchAllParticipating();
            
            state.adminGroups = Object.values(groups)
                .filter(g => g.participants.find(p => p.id === jidNormalizedUser(uClient.user.id))?.admin)
                .map(g => ({ id: g.id, name: g.subject }));
            
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            
            if (state.adminGroups.length === 0) {
                return safeSend(chatId, "⚠️ *No Admin Groups Found!*\n\nThe engine could not detect any groups where you hold Admin rights.\n_(Wait 1-2 minutes if you recently logged in, server sync may be pending)_");
            }

            state.currentPage = 0; 
            state.selectedGroupsArray = []; 
            state.flowContext = data.replace('menu_', '').toUpperCase();
            
            return tgBot.sendMessage(chatId, '🎯 *SELECT TARGET GROUPS:*', { parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { 
            console.error(`❌ [FETCH ERROR]:`, e.message);
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, "❌ Critical failure fetching groups from WA server. Try again.");
        }
    }

    if (data === 'confirm_selection') {
        if (state.flowContext === 'AUTOKICK') { 
            state.action = 'WAIT_KICK_TERM'; 
            return safeSend(chatId, "⚔️ *Enter Target Number to Kick:*"); 
        }
        if (state.flowContext === 'EXTRACTLINKS') { 
            tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
            return extractGroupLinksEngine(chatId, userId, uClient); 
        }
        if (state.flowContext === 'APPROVE') {
            return autoApproveEngine(chatId, userId, uClient);
        }
    }

    if (data.startsWith('selgrp_')) { 
        const id = data.split('_')[1]; 
        if (state.selectedGroupsArray.includes(id)) {
            state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); 
        } else {
            state.selectedGroupsArray.push(id); 
        }
        return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); 
    }

    if (data.startsWith('page_')) { 
        state.currentPage = parseInt(data.split('_')[1]); 
        return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); 
    }
});

// ============================================================================
// 🗂️ PAGINATION LOGIC
// ============================================================================
function getPaginationKeyboard(userId) {
    const state = getState(userId); 
    const start = state.currentPage * 5; 
    const items = state.adminGroups.slice(start, start + 5);
    
    let kb = [[{ text: 'Sᴇʟᴇᴄᴛ ALL', callback_data: 'select_all' }]];
    
    items.forEach(g => { 
        const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); 
        kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); 
    });
    
    let navRow = []; 
    if (state.currentPage > 0) {
        navRow.push({ text: '◀️ Pʀᴇᴠ', callback_data: `page_${state.currentPage - 1}` });
    }
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) {
        navRow.push({ text: 'Nᴇxᴛ ▶️', callback_data: `page_${state.currentPage + 1}` });
    }
    
    if (navRow.length > 0) kb.push(navRow);
    
    kb.push([{ text: `⚡ E x ᴇ ᴄ ᴜ ᴛ ᴇ`, callback_data: 'confirm_selection' }]); 
    kb.push([{ text: `❌ A ʙ ᴏ ʀ ᴛ`, callback_data: 'btn_main_menu' }]); 
    
    return { inline_keyboard: kb };
}

// ============================================================================
// 💬 MESSAGE & PAYLOAD HANDLERS
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; 
    const userId = msg.from.id; 
    const text = msg.text || ''; 
    const state = getState(userId);
    const uClient = activeClients.get(userId)?.client;
    
    if (text.startsWith('/')) return; 
    if (!(await checkAccess(userId, chatId, msg))) return; 

    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { 
        state.action = null; 
        const cleanNum = text.replace(/[^0-9]/g, '');
        console.log(`[LOGIN] Processing Pair Code for number: ${cleanNum}`);
        return startBaileysClient(userId, chatId, cleanNum); 
    }

    if (state.action === 'WAIT_VCF_AND_LINK') {
        const linkMatch = msg.caption?.match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if (!msg.document || !linkMatch) {
            return safeSend(chatId, "❌ Invalid Format. Ensure you attach the VCF file and put the link in the caption.");
        }
        
        try {
            console.log(`[SWARM] Extracting VCF data...`);
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); 
            fs.unlinkSync(filePath);
            
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1] + '@s.whatsapp.net');
            state.tempData.targets = numbers; 
            state.action = null;
            
            return safeSend(chatId, `⚙️ *MISSION CONFIGURATION READY*\nTarget Group ID: \`${linkMatch[1]}\`\nTotal Contacts Extracted: ${numbers.length}\n\nReady to engage Swarm Protocol.`, { 
                reply_markup: { 
                    inline_keyboard: [ [{text: '🚀 INITIATE MISSION', callback_data: `start_mission_${linkMatch[1]}`}] ] 
                } 
            });
        } catch(e) { 
            console.error(`[SWARM ERROR]:`, e);
            return safeSend(chatId, "❌ VCF Parsing Failed. File may be corrupted."); 
        }
    }

    if (!uClient) return;

    if (state.action === 'WAIT_GROUP_NAME') { 
        state.groupConfig.baseName = text.trim(); 
        state.action = 'WAIT_GROUP_COUNT'; 
        return safeSend(chatId, `🔢 How many groups do you want to create?`); 
    } 
    
    if (state.action === 'WAIT_GROUP_COUNT') { 
        state.groupConfig.count = parseInt(text); 
        if(isNaN(state.groupConfig.count)) return safeSend(chatId, `❌ Enter a valid number.`);
        state.action = 'WAIT_GROUP_MEMBER'; 
        return safeSend(chatId, `👤 Provide the WhatsApp Number to add as member (with country code):`); 
    } 
    
    if (state.action === 'WAIT_GROUP_MEMBER') { 
        state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; 
        console.log(`[CREATE GROUPS] Starting execution for ${state.groupConfig.count} groups.`);
        return startGroupCreationProcess(chatId, userId, uClient); 
    }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if(codes.length === 0) return safeSend(chatId, `❌ No valid links found.`);
        
        console.log(`[AUTO-JOIN] Attempting to join ${codes.length} groups.`);
        for (let code of codes) { 
            try { 
                await uClient.groupAcceptInvite(code); 
                await new Promise(r => setTimeout(r, 3000)); 
            } catch (e) { 
                console.error(`[JOIN FAILED] Code ${code}:`, e.message);
            } 
        }
        return safeSend(chatId, "✅ Join Mission Complete.");
    }

    if (state.action === 'WAIT_BROADCAST_MSG') {
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; 
        state.action = null;
        
        console.log(`[BROADCAST] Broadcasting to ${targets.length} targets.`);
        for (let target of targets) { 
            try { 
                await uClient.sendMessage(target, { text: text }); 
                await new Promise(r => setTimeout(r, 2000)); 
            } catch(e) {
                console.error(`[BROADCAST FAILED] Target ${target}:`, e.message);
            } 
        }
        return safeSend(chatId, "✅ Broadcast Execution Complete.");
    }
});

// ============================================================================
// 💥 CORE EXECUTION ENGINES
// ============================================================================
async function executeLiveParallelEngine(chatId, userId, uClient, inviteCode) {
    const state = getState(userId); 
    let targets = state.tempData?.targets || [];
    
    safeSend(chatId, `🚀 *SWARM ADD INITIATED*\nBatch adding ${targets.length} members. Please wait...`);
    
    try {
        const targetGid = await uClient.groupAcceptInvite(inviteCode);
        console.log(`[SWARM] Joined Target Group: ${targetGid}. Starting Mass Add...`);
        
        for (let j = 0; j < targets.length; j += 5) {
            console.log(`[SWARM] Injecting batch ${j} to ${j+5}`);
            await uClient.groupParticipantsUpdate(targetGid, targets.slice(j, j + 5), 'add');
            await new Promise(r => setTimeout(r, 12000)); 
        }
        safeSend(chatId, "✅ Swarm Mission Complete. All batches processed.");
    } catch(e) { 
        console.error(`[SWARM FATAL ERROR]:`, e);
        safeSend(chatId, "❌ Mission Failed or Aborted. Check console."); 
    }
}

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig;
    let successCount = 0;
    
    safeSend(chatId, `⏳ *CREATING GROUPS*\nProcessing ${config.count} requests...`);
    
    for (let i = 1; i <= config.count; i++) {
        try {
            console.log(`[CREATE] Generating group: ${config.baseName} ${i}`);
            await uClient.groupCreate(`${config.baseName} ${i}`, [config.memberId]);
            successCount++;
            await new Promise(r => setTimeout(r, 5000)); 
        } catch (e) { 
            console.error(`[CREATE FAILED]:`, e.message);
        }
    }
    return safeSend(chatId, `✅ Group Generation Complete.\nSuccess: ${successCount}/${config.count}`);
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const targets = getState(userId).selectedGroupsArray === 'ALL' ? getState(userId).adminGroups.map(g => g.id) : getState(userId).selectedGroupsArray;
    let report = "🔗 *EXTRACTED LINKS:*\n\n";
    
    safeSend(chatId, `⏳ *EXTRACTING*\nPulling links from ${targets.length} groups...`);
    
    for (let target of targets) { 
        try { 
            const code = await uClient.groupInviteCode(target); 
            const metadata = await uClient.groupMetadata(target);
            report += `🔹 *${metadata.subject}*\nhttps://chat.whatsapp.com/${code}\n\n`; 
            console.log(`[EXTRACTED] Link found for target: ${target}`);
        } catch (e) { 
            console.error(`[EXTRACT FAILED] Target ${target}:`, e.message);
        } 
    }
    return sendLongReport(chatId, report, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient) {
    const state = getState(userId); 
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray;
    
    safeSend(chatId, `⏳ *APPROVE ENGINE RUNNING*\nScanning for pending join requests...`);
    
    for (let target of targetGroupIds) { 
        try { 
            const reqs = await uClient.groupRequestParticipantsList(target); 
            if (reqs.length > 0) {
                console.log(`[APPROVE] Found ${reqs.length} requests in ${target}. Approving...`);
                await uClient.groupRequestParticipantsUpdate(target, reqs.map(r => r.jid), 'approve'); 
            }
        } catch (e) { 
            console.error(`[APPROVE FAILED] Target ${target}:`, e.message);
        } 
    }
    return safeSend(chatId, "✅ Auto-Approve Cycle Complete.");
}
