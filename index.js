const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, jidNormalizedUser } = require('@whiskeysockets/baileys');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs'); 
const path = require('path');
const express = require('express');
const pino = require('pino');

process.setMaxListeners(50);
process.on('uncaughtException', (err) => console.log('\n[ANTI-CRASH] Caught Exception:', err.message));
process.on('unhandledRejection', (reason) => console.log('\n[ANTI-CRASH] Unhandled Rejection:', reason));

const app = express();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;">🚀 VORTEX V57 (Baileys Ultimate) Active</h1>'));
app.listen(port, () => console.log(`☁️ [SERVER] Web Interface Active on Port ${port}`));

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
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

if (fs.existsSync(BOT_USERS_FILE)) { try { knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE)); } catch(e) { } }

let adminConfig = {
    fsubEnabled: false, fsubChannels: [], approvalRequired: false, botAlerts: true, admins: [], allowedUsers: [], bannedUsers: [], revokedUsers: [], securityConfigs: {}, 
    featurePerms: { login: ['owner','admin','user'], massadd: ['owner','admin','user'], creategroup: ['owner','admin','user'], joingroup: ['owner','admin','user'], renamegroups: ['owner','admin','user'], extractlinks: ['owner','admin','user'], approve: ['owner','admin','user'], autokick: ['owner','admin','user'], broadcast: ['owner','admin','user'], stats: ['owner','admin','user'], security: ['owner','admin'] }
};

if (fs.existsSync(ADMIN_CONFIG_FILE)) { try { adminConfig = { ...adminConfig, ...JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE)) }; } catch(e) { } }
function saveAdminConfig() { try { fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(adminConfig, null, 4)); } catch (err) { } }

function getSecurityConfig(userId) {
    if (!adminConfig.securityConfigs[userId]) adminConfig.securityConfigs[userId] = { enabled: false, ruleType: 'WHITELIST', countries: ['91'], vipNumbers: [], autoKickEnabled: false, strikeCount: 3, violations: {}, targetMode: 'ALL', targetGroups: [], stats: { deleted: 0, kicked: 0 } };
    return adminConfig.securityConfigs[userId];
}

function getState(userId) {
    if (!userStates[userId]) userStates[userId] = { action: null, adminGroups: [], currentPage: 0, flowContext: '', selectedGroupsArray: [], tempData: {}, language: 'Eɴɢʟɪsʜ', groupConfig: { baseName: '', count: 0, memberId: '', desc: '', pfpPath: null, settings: { msgsAdminOnly: false, infoAdminOnly: false } } };
    return userStates[userId];
}

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `\n${DIVIDER}\n👑 _VORTEX V57 Bᴀɪʟᴇʏs_ | Oᴡɴᴇʀ: ${OWNER_USERNAME}`;

async function safeSend(chatId, text, options = {}) { try { return await tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options }); } catch (e) { return null; } }
function createProgressBar(current, total) { if (total === 0) return `[██████████] 100%`; const filled = Math.round((current / total) * 10); return `[${'█'.repeat(filled)}${'░'.repeat(Math.max(0, 10 - filled))}] ${Math.round((current / total) * 100)}%`; }
async function sendLongReport(chatId, text, filename, options = {}) { if (text.length > 3900) { const fp = path.join(__dirname, `${filename}_${chatId}.txt`); fs.writeFileSync(fp, text); await tgBot.sendDocument(chatId, fp, { caption: `📄 *REPORT*\n${FOOTER}`, parse_mode: 'Markdown', ...options }); fs.unlinkSync(fp); } else safeSend(chatId, text, options); }
function hasFeatureAccess(userId, featureKey) { let role = userId === OWNER_ID ? 'owner' : (adminConfig.admins.includes(userId) ? 'admin' : 'user'); return adminConfig.featurePerms[featureKey] && adminConfig.featurePerms[featureKey].includes(role); }

// ============================================================================
// 🚀 BAILEYS CORE ENGINE & SHIELD
// ============================================================================
async function startBaileysClient(userId, chatId, cleanNumber = null) {
    const sessionPath = path.join(SESSIONS_DIR, `session_${userId}`);
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    if(chatId) safeSend(chatId, `📡 *Phase 1: Booting Baileys WebSocket Engine...*`);

    const client = makeWASocket({ version, auth: state, printQRInTerminal: false, logger: pino({ level: 'silent' }), browser: ['Vortex System', 'Chrome', '1.0.0'] });
    activeClients.set(userId, { client: client, status: 'initializing', isReady: false });
    client.ev.on('creds.update', saveCreds);

    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr && chatId) {
            if (cleanNumber) {
                setTimeout(async () => {
                    try {
                        const code = await client.requestPairingCode(cleanNumber);
                        safeSend(chatId, `🔑 *PAIRING CODE:*\n\n\`${code?.match(/.{1,4}/g)?.join('-') || code}\`\n\n1️⃣ Open WhatsApp > Linked Devices > Link with number\n2️⃣ Enter code.`);
                    } catch(e) { safeSend(chatId, `❌ Pairing failed: ${e.message}`); }
                }, 3000);
            } else {
                tgBot.sendPhoto(chatId, `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`, { caption: `📷 *PAIR QR CODE*\nScan to connect.`, parse_mode: 'Markdown' });
            }
        }
        if (connection === 'open') {
            const cs = activeClients.get(userId); if (cs) { cs.isReady = true; cs.status = 'connected'; }
            if(chatId) safeSend(chatId, `✅ *AUTHENTICATION SUCCESSFUL*\nBaileys WebSocket Connected! Type /start.`);
        }
        if (connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) startBaileysClient(userId, null);
            else { activeClients.delete(userId); fs.rmSync(sessionPath, { recursive: true, force: true }); if(chatId) safeSend(chatId, `🚨 *WA DISCONNECTED*\nSession Wiped. Login again.`); }
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
            const groupMetadata = await client.groupMetadata(remoteJid);
            const botJid = jidNormalizedUser(client.user.id);
            if (!groupMetadata.participants.find(p => p.id === botJid)?.admin) return;
            if (groupMetadata.participants.find(p => p.id === participant)?.admin) return;

            await client.sendMessage(remoteJid, { delete: msg.key });
            sec.stats.deleted += 1; saveAdminConfig();
            sec.violations[participant] = (sec.violations[participant] || 0) + 1; saveAdminConfig();

            if (sec.violations[participant] >= sec.strikeCount && sec.autoKickEnabled) {
                await client.groupParticipantsUpdate(remoteJid, [participant], 'remove');
                sec.stats.kicked += 1; sec.violations[participant] = 0; saveAdminConfig();
                safeSend(OWNER_ID, `⚔️ *AUTO KICK EXECUTED*\n🎯 Group: ${groupMetadata.subject}\n💀 Target: +${authorNum}\n⚠️ 3 Strikes Reached.`);
            } else {
                safeSend(OWNER_ID, `🛡️ *MESSAGE INTERCEPTED*\n🎯 Group: ${groupMetadata.subject}\n👤 Sender: +${authorNum}\n⚠️ Strike: ${sec.violations[participant]}/${sec.strikeCount}\n💥 Action: Deleted`);
            }
        } catch(e) {}
    });
}
if (fs.existsSync(SESSIONS_DIR)) { fs.readdirSync(SESSIONS_DIR).forEach(dir => { if (dir.startsWith('session_')) startBaileysClient(dir.split('session_')[1], null); }); }

// ============================================================================
// 📱 MAIN MENU & UI
// ============================================================================
function sendMainMenu(chatId, userId) {
    const state = getState(userId); state.action = null; const isReady = activeClients.get(userId)?.isReady;
    let kb = [];
    if (!isReady && hasFeatureAccess(userId, 'login')) kb.push([{ text: "🔐 Lᴏɢɪɴ WA", callback_data: 'menu_login' }]);
    else if (isReady) kb.push([{ text: `🔓 Lᴏɢᴏᴜᴛ`, callback_data: 'menu_logout_confirm' }]);
    
    if (hasFeatureAccess(userId, 'massadd')) kb.push([{ text: "👥 Mᴀss Gʀᴏᴜᴘ Aᴅᴅ (Swarm)", callback_data: 'menu_mass_add' }]);
    
    let r1 = [], r2 = [], r3 = [], r4 = [];
    if (hasFeatureAccess(userId, 'creategroup')) r1.push({ text: "➕ Cʀᴇᴀᴛᴇ Gʀᴏᴜᴘs", callback_data: 'menu_creategroup' });
    if (hasFeatureAccess(userId, 'joingroup')) r1.push({ text: "📥 Aᴜᴛᴏ Jᴏɪɴ", callback_data: 'menu_joingroup' });
    if (r1.length) kb.push(r1);
    
    if (hasFeatureAccess(userId, 'renamegroups')) r2.push({ text: "✏️ Rᴇɴᴀᴍᴇ Gʀᴏᴜᴘs", callback_data: 'menu_rename_groups' });
    if (hasFeatureAccess(userId, 'extractlinks')) r2.push({ text: "🔗 Exᴛʀᴀᴄᴛ Lɪɴᴋs", callback_data: 'menu_extractlinks' });
    if (r2.length) kb.push(r2);
    
    if (hasFeatureAccess(userId, 'approve')) r3.push({ text: "👥 Aᴜᴛᴏ Aᴘᴘʀᴏᴠᴇ", callback_data: 'menu_approve' });
    if (hasFeatureAccess(userId, 'autokick')) r3.push({ text: "⚔️ Aᴜᴛᴏ Kɪᴄᴋ", callback_data: 'menu_autokick' });
    if (r3.length) kb.push(r3);
    
    if (hasFeatureAccess(userId, 'broadcast')) r4.push({ text: "📢 Bʀᴏᴀᴅᴄᴀsᴛ", callback_data: 'menu_broadcast' });
    if (hasFeatureAccess(userId, 'stats')) r4.push({ text: "📊 Bᴏᴛ Sᴛᴀᴛs", callback_data: 'menu_stats' });
    if (r4.length) kb.push(r4);
    
    if (hasFeatureAccess(userId, 'security')) kb.push([{ text: "🛡️ Aᴜᴛᴏ Dᴇʟᴇᴛᴇ GC Msɢ", callback_data: 'menu_security' }]);
    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) kb.push([{ text: `👑 ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    
    safeSend(chatId, `🤖 *VORTEX COMMAND CENTER*\n${DIVIDER}\n📡 Sᴛᴀᴛᴜs: ${isReady ? '🟢 Oɴʟɪɴᴇ' : '🔴 Oғғʟɪɴᴇ'}${FOOTER}`, { reply_markup: { inline_keyboard: kb } });
}

tgBot.onText(/\/start/, (msg) => sendMainMenu(msg.chat.id, msg.from.id));

// ============================================================================
// ⌨️ CALLBACK ROUTER
// ============================================================================
tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; const userId = query.from.id; const data = query.data; const state = getState(userId);
    const uClient = activeClients.get(userId)?.client; tgBot.answerCallbackQuery(query.id).catch(()=>{});

    if (data === 'btn_main_menu') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return sendMainMenu(chatId, userId); }
    if (data === 'menu_login') return tgBot.editMessageText(`📱 *Cᴏɴɴᴇᴄᴛ WʜᴀᴛsAᴘᴘ*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔑 Pᴀɪʀ Cᴏᴅᴇ', callback_data: 'login_pair_code' }, { text: '📷 Pᴀɪʀ QR', callback_data: 'login_pair_qr' }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_main_menu' }]] } });
    if (data === 'login_pair_code') { state.action = 'WAITING_FOR_LOGIN_NUMBER'; return safeSend(chatId, `🔑 *Pᴀɪʀ Cᴏᴅᴇ*\nEnter Phone (eg. 919999999999):`); }
    if (data === 'login_pair_qr') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startBaileysClient(userId, chatId, null); }
    if (data === 'menu_logout_confirm') return tgBot.editMessageText(`⚠️ *WIPE SESSION?*`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [ [{ text: '✔️ Yes, Wipe', callback_data: 'menu_logout_execute' }], [{ text: '❌ Cancel', callback_data: 'btn_main_menu' }] ] }});
    if (data === 'menu_logout_execute') { if (uClient) uClient.logout(); const p = path.join(SESSIONS_DIR, `session_${userId}`); if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); activeClients.delete(userId); return sendMainMenu(chatId, userId); }

    // --- SWARM MASS ADD SETUP ---
    if (data === 'menu_mass_add') {
        state.action = 'WAIT_VCF_AND_LINK';
        return tgBot.editMessageText(`➕ **MASS GROUP ADD: SETUP**\n${DIVIDER}\nSend **Group Link** in caption and attach **VCF File**.\n\n📎 File: \`contacts.vcf\`\n📝 Caption: \`https://chat.whatsapp.com/G87xxxx\``, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_main_menu'}]]} });
    }
    if (data.startsWith('start_mission_')) { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return executeLiveParallelEngine(chatId, userId, uClient, data.replace('start_mission_', '')); }

    // --- LEGACY FEATURES MENUS ---
    const menus = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast'];
    if (menus.includes(data)) {
        if (!uClient) return safeSend(chatId, "⚠️ System offline.");
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return safeSend(chatId, "➕ *Phase 1:* Base Name? (e.g., Vortex Army)"); }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS'; return safeSend(chatId, "📥 *AUTO-JOIN*\nSend links:"); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA'; return safeSend(chatId, "✏️ *MASS RENAMER*\nSend format:\nLink\\nNew Name"); }
        if (data === 'menu_broadcast') { state.action = 'WAIT_BROADCAST_MSG'; return safeSend(chatId, "📢 *BROADCAST*\nSend Message Payload (Text/Photo/Video):"); }
        
        let statusMsg = await safeSend(chatId, "📡 *Scanning groups...*");
        try {
            const groups = await uClient.groupFetchAllParticipating(); const botJid = jidNormalizedUser(uClient.user.id);
            state.adminGroups = Object.values(groups).filter(g => g.participants.find(p => p.id === botJid)?.admin).map(g => ({ id: g.id, name: g.subject }));
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            if (state.adminGroups.length === 0) return safeSend(chatId, "❌ No Admin rights found.");
            state.currentPage = 0; state.selectedGroupsArray = []; state.flowContext = data.replace('menu_', '').toUpperCase();
            return tgBot.sendMessage(chatId, '🎯 *SELECT TARGETS:*', { parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { }
    }

    if (data === 'confirm_selection') {
        if (state.flowContext === 'AUTOKICK') { state.action = 'WAIT_KICK_TERM'; return safeSend(chatId, "⚔️ *Type Target:* (Number/Code)"); }
        if (state.flowContext === 'EXTRACTLINKS') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return extractGroupLinksEngine(chatId, userId, uClient); }
        if (state.flowContext === 'APPROVE') return tgBot.editMessageText(`👥 *METHOD?*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [ [{ text: '✔️ Execute Manual', callback_data: 'approve_opt_manual' }], [{ text: '❌ Cancel', callback_data: 'btn_main_menu' }] ]} });
    }
    if (data === 'approve_opt_manual') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return autoApproveEngine(chatId, userId, uClient); }
    
    if (data.startsWith('selgrp_')) { const id = data.split('_')[1]; if (state.selectedGroupsArray.includes(id)) state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); else state.selectedGroupsArray.push(id); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    if (data === 'select_all') { state.selectedGroupsArray = 'ALL'; return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    if (data.startsWith('page_')) { state.currentPage = parseInt(data.split('_')[1]); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    
    // Group Creation Config Flow
    if (data === 'grp_skip_desc') { state.groupConfig.desc = ''; state.action = 'WAIT_GROUP_PFP'; return safeSend(chatId, "🖼️ *Phase 5:* Send DP.", { reply_markup: { inline_keyboard: [[{text: '⏩ Skip DP', callback_data: 'grp_skip_pfp'}]] } }); }
    if (data === 'grp_skip_pfp') { state.groupConfig.pfpPath = null; state.action = null; return sendGroupSettingsMenu(chatId, userId); }
    if (data.startsWith('grp_tgl_')) { const key = data.replace('grp_tgl_', ''); state.groupConfig.settings[key] = !state.groupConfig.settings[key]; return sendGroupSettingsMenu(chatId, userId, query.message.message_id); }
    if (data === 'grp_deploy_now') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startGroupCreationProcess(chatId, userId, uClient); }
});

function getPaginationKeyboard(userId) {
    const state = getState(userId); const start = state.currentPage * 5; const items = state.adminGroups.slice(start, start + 5);
    let kb = [[{ text: 'Sᴇʟᴇᴄᴛ ALL', callback_data: 'select_all' }]];
    items.forEach(g => { const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); });
    let navRow = []; if (state.currentPage > 0) navRow.push({ text: '◀️ Pʀᴇᴠ', callback_data: `page_${state.currentPage - 1}` });
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) navRow.push({ text: 'Nᴇxᴛ ▶️', callback_data: `page_${state.currentPage + 1}` });
    if (navRow.length > 0) kb.push(navRow);
    kb.push([{ text: `⚡ Cᴏɴғɪʀᴍ Sᴇʟᴇᴄᴛɪᴏɴ`, callback_data: 'confirm_selection' }]); kb.push([{ text: `❌ Cᴀɴᴄᴇʟ`, callback_data: 'btn_main_menu' }]); return { inline_keyboard: kb };
}
function sendGroupSettingsMenu(chatId, userId, msgId = null) {
    const s = getState(userId).groupConfig.settings;
    const kb = { inline_keyboard: [ [{ text: `🔒 Admin Only Msg: ${s.msgsAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_msgsAdminOnly' }], [{ text: `✏️ Admin Only Edit: ${s.infoAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_infoAdminOnly' }], [{ text: `🚀 LAUNCH DEPLOYMENT`, callback_data: 'grp_deploy_now' }], [{ text: `❌ Cancel`, callback_data: 'btn_main_menu' }] ] };
    if (msgId) tgBot.editMessageText(`⚙️ *Phase 6: Permissions*`, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{}); else safeSend(chatId, `⚙️ *Phase 6: Permissions*`, { reply_markup: kb });
}

// ============================================================================
// 📥 TEXT/MEDIA INPUT HANDLER
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; const userId = msg.from.id; const text = msg.text || ''; const state = getState(userId);
    const uClient = activeClients.get(userId)?.client;

    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { state.action = null; return startBaileysClient(userId, chatId, text.replace(/[^0-9]/g, '')); }

    // --- SWARM VCF PARSER ---
    if (state.action === 'WAIT_VCF_AND_LINK') {
        if (!msg.document || !msg.caption || !msg.caption.includes('chat.whatsapp.com')) return safeSend(chatId, `❌ **INVALID FORMAT!**\nSend VCF File with WhatsApp Link in Caption.`);
        const linkMatch = msg.caption.match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if(!linkMatch) return safeSend(chatId, "❌ Invalid Link.");

        let statusMsg = await safeSend(chatId, `⏳ *Scanning VCF...*`);
        try {
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); fs.unlinkSync(filePath);
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1] + '@s.whatsapp.net');
            if (numbers.length === 0) return safeSend(chatId, "❌ No numbers found.");

            state.tempData.targets = numbers; state.action = null;
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, `⚙️ **SLOT 1 CONFIG**\n${DIVIDER}\n🎯 **Target:** \`${linkMatch[1]}\`\n👥 **Contacts:** ${numbers.length}\n⌨️ **Batch:** 5 (Auto)\n⚖️ **Delay:** Humanized`, { reply_markup: { inline_keyboard: [ [{text: '🚀 START SWARM', callback_data: `start_mission_${linkMatch[1]}`}], [{text: '🔙 Menu', callback_data: 'btn_main_menu'}] ] } });
        } catch(e) { return safeSend(chatId, "❌ VCF Parsing Failed."); }
    }

    if (!uClient) return;

    // --- GROUP CREATION CONFIG FLOW ---
    if (state.action === 'WAIT_GROUP_NAME') { state.groupConfig.baseName = text.trim(); state.action = 'WAIT_GROUP_COUNT'; return safeSend(chatId, `🔢 *Phase 2:* Quantity?`); } 
    if (state.action === 'WAIT_GROUP_COUNT') { state.groupConfig.count = parseInt(text); state.action = 'WAIT_GROUP_MEMBER'; return safeSend(chatId, `👤 *Phase 3:* Member ID to add?`); } 
    if (state.action === 'WAIT_GROUP_MEMBER') { state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; state.action = 'WAIT_GROUP_DESC'; return safeSend(chatId, `📝 *Phase 4:* Desc?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_desc'}]] } }); } 
    if (state.action === 'WAIT_GROUP_DESC') { state.groupConfig.desc = text; state.action = 'WAIT_GROUP_PFP'; return safeSend(chatId, `🖼️ *Phase 5:* DP?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_pfp'}]] } }); }
    if (state.action === 'WAIT_GROUP_PFP' && msg.photo) {
        try { state.groupConfig.pfpPath = await tgBot.downloadFile(msg.photo[msg.photo.length - 1].file_id, __dirname); state.action = null; sendGroupSettingsMenu(chatId, userId); } catch (e) { }
    }

    // --- OTHER ENGINES ---
    if (state.action === 'WAIT_JOIN_LINKS') {
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (codes.length === 0) return; state.action = null; let report = `✅ *JOIN REPORT*\n`;
        for (let i = 0; i < codes.length; i++) { try { await uClient.groupAcceptInvite(codes[i]); report += `🔹 Joined: ${codes[i]} ✔️\n`; await new Promise(r => setTimeout(r, 4000)); } catch (e) { report += `🔹 Failed: ${codes[i]} ❌\n`; } }
        return sendLongReport(chatId, report, 'Join_Report');
    }

    if (state.action === 'WAIT_BROADCAST_MSG') {
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; state.action = null; 
        let statusMsg = await safeSend(chatId, `⏳ *Transmitting...*`);
        let captionText = msg.caption || msg.text || ''; let success = 0; let failed = 0; let mediaType = null; let filePath = null;
        try {
            if (msg.photo) { filePath = await tgBot.downloadFile(msg.photo[msg.photo.length - 1].file_id, __dirname); mediaType = 'image'; } 
            else if (msg.video) { filePath = await tgBot.downloadFile(msg.video.file_id, __dirname); mediaType = 'video'; } 
            else if (msg.document) { filePath = await tgBot.downloadFile(msg.document.file_id, __dirname); mediaType = 'document'; }
            for (let i = 0; i < targets.length; i++) { 
                try { 
                    await uClient.sendPresenceUpdate('composing', targets[i]); await new Promise(r => setTimeout(r, 1500));
                    if (mediaType === 'image') await uClient.sendMessage(targets[i], { image: { url: filePath }, caption: captionText });
                    else if (mediaType === 'video') await uClient.sendMessage(targets[i], { video: { url: filePath }, caption: captionText });
                    else if (mediaType === 'document') await uClient.sendMessage(targets[i], { document: { url: filePath }, caption: captionText, mimetype: msg.document.mime_type });
                    else await uClient.sendMessage(targets[i], { text: captionText });
                    success++;
                } catch(e) { failed++; } await new Promise(r => setTimeout(r, 2500)); 
            }
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
            if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            return safeSend(chatId, `✅ *BROADCAST REPORT*\nTargets: ${targets.length}\n✔️ Success: ${success}\n❌ Failed: ${failed}`);
        } catch (e) { return safeSend(chatId, "❌ Broadcast Error."); }
    }

    if (state.action === 'WAIT_KICK_TERM') return runPurgeEngine(chatId, userId, uClient, text);
    
    if (state.action === 'WAIT_RENAME_DATA') {
        const blocks = text.split(/(?:https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]{15,25}/i);
        const codes = [...text.matchAll(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        if (codes.length === 0) return; state.action = null; let report = `✅ *RENAME REPORT*\n`;
        for (let i = 0; i < codes.length; i++) {
            let lines = blocks[i].split('\n').map(l=>l.trim()).filter(l=>l!==''); 
            let targetName = (lines.length > 0 ? lines[lines.length - 1] : `Group`).replace(/^(GROUP\s*NAME|NAME)[\s:-]*/i, '').trim();
            try { 
                let gid = await uClient.groupAcceptInvite(codes[i]); await new Promise(r => setTimeout(r, 2000));
                await uClient.groupUpdateSubject(gid, targetName); report += `🔹 *${targetName}* ✔️\n`; await new Promise(r => setTimeout(r, 4000));
            } catch (e) { report += `🔹 *${targetName}* ❌\n`; }
        }
        return sendLongReport(chatId, report, 'Rename_Report');
    }
});

// ============================================================================
// ⚙️ THE HEAVYWEIGHT ENGINES (BAILEYS ULTIMATE)
// ============================================================================

async function executeLiveParallelEngine(chatId, userId, uClient, inviteCode) {
    const state = getState(userId); let targets = state.tempData?.targets || [];
    if(targets.length === 0) return safeSend(chatId, "❌ Target list empty.");
    let trackerMsg = await safeSend(chatId, `🚀 *INITIALIZING SWARM...*\nTarget: \`${inviteCode}\``);
    let addedCount = 0;
    try {
        const targetGid = await uClient.groupAcceptInvite(inviteCode);
        for (let j = 0; j < targets.length; j += 5) {
            const batch = targets.slice(j, j + 5);
            try {
                await uClient.groupParticipantsUpdate(targetGid, batch, 'add'); addedCount += batch.length;
                let delay = 10000 + Math.random() * 5000;
                if (trackerMsg) tgBot.editMessageText(`🚀 *VORTEX LIVE MONITOR*\n${DIVIDER}\n🎯 Target: \`${inviteCode}\`\n✅ Added: ${addedCount}/${targets.length}\n⚡ Status: Taking ${Math.round(delay/1000)}s delay...`, { chat_id: chatId, message_id: trackerMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
                await new Promise(r => setTimeout(r, delay));
            } catch (err) { }
        }
        safeSend(chatId, `✅ *SWARM COMPLETE!*\nTotal Added: ${addedCount}\n${FOOTER}`);
    } catch(e) { safeSend(chatId, `❌ *ERROR:* Failed to join group.`); }
}

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig; getState(userId).action = null; 
    let statusMsg = await safeSend(chatId, `🚀 *DEPLOYMENT ACTIVE*`); let resultMessage = `✅ *Dᴇᴘʟᴏʏᴍᴇɴᴛ Rᴇᴘᴏʀᴛ*\n${DIVIDER}\n\n`;
    try {
        for (let i = 1; i <= config.count; i++) {
            const groupName = `${config.baseName} ${i}`;
            try {
                if (statusMsg) tgBot.editMessageText(`⚙️ *Cᴏɴsᴛʀᴜᴄᴛɪɴɢ...*\n${createProgressBar(i, config.count)}`, { chat_id: chatId, message_id: statusMsg.message_id }).catch(()=>{});
                const res = await uClient.groupCreate(groupName, [config.memberId]); await new Promise(r => setTimeout(r, 2000)); 
                if (config.desc) await uClient.groupUpdateDescription(res.id, config.desc).catch(()=>{}); 
                if (config.pfpPath && fs.existsSync(config.pfpPath)) await uClient.updateProfilePicture(res.id, { url: config.pfpPath }).catch(()=>{});
                if (config.settings.msgsAdminOnly) await uClient.groupSettingUpdate(res.id, 'announcement'); 
                if (config.settings.infoAdminOnly) await uClient.groupSettingUpdate(res.id, 'locked');
                const link = await uClient.groupInviteCode(res.id); resultMessage += `🔹 *${groupName}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; await new Promise(r => setTimeout(r, 6000));
            } catch (e) { resultMessage += `🔹 *${groupName}*\n❌ Eʀʀᴏʀ\n\n`; }
        }
    } finally { if (config.pfpPath && fs.existsSync(config.pfpPath)) fs.unlinkSync(config.pfpPath); }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, resultMessage + FOOTER, 'Created_Groups');
}

async function runPurgeEngine(chatId, userId, uClient, inputString) {
    const state = getState(userId); const inputList = inputString.replace(/,/g, ' ').split(/\s+/).filter(p => p.trim() !== '');
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null; 
    let statusMsg = await safeSend(chatId, `⏳ *Kicking...*`); let report = `✅ *Auto Kick Report*\n${DIVIDER}\n`;
    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const groupMetadata = await uClient.groupMetadata(targetGroupIds[i]); let targetsToRemove = [];
            for (const participant of groupMetadata.participants) {
                if (participant.admin) continue; let shouldKick = false;
                for (const item of inputList) { let searchItem = item.startsWith('+') ? item.substring(1) : item; if (participant.id.split('@')[0].startsWith(searchItem)) { shouldKick = true; break; } }
                if (shouldKick) targetsToRemove.push(participant.id);
            }
            if (targetsToRemove.length > 0) { await uClient.groupParticipantsUpdate(targetGroupIds[i], targetsToRemove, 'remove'); report += `🔹 *${groupMetadata.subject}:* Kicked ${targetsToRemove.length}\n`; await new Promise(r => setTimeout(r, 3000)); }
        } catch (e) {}
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, report + FOOTER, 'Purge_Report');
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null;
    let statusMsg = await safeSend(chatId, `⏳ *Scraping Links...*`); let resultMessage = `🔗 *Link Database*\n${DIVIDER}\n\n`;
    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const groupMetadata = await uClient.groupMetadata(targetGroupIds[i]); const link = await uClient.groupInviteCode(targetGroupIds[i]);
            resultMessage += `🔹 *${groupMetadata.subject}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; await new Promise(r => setTimeout(r, 1500));
        } catch (e) { resultMessage += `🔹 ID: ${targetGroupIds[i]} ❌\n\n`; }
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, resultMessage + FOOTER, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient) {
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; state.action = null;
    let statusMsg = await safeSend(chatId, `⏳ *Approving...*`); let report = `✅ *Approval Report*\n${DIVIDER}\n`;
    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const groupMetadata = await uClient.groupMetadata(targetGroupIds[i]);
            const requests = await uClient.groupRequestParticipantsList(targetGroupIds[i]);
            if (requests && requests.length > 0) { 
                const rIds = requests.map(r => r.jid); await uClient.groupRequestParticipantsUpdate(targetGroupIds[i], rIds, 'approve');
                report += `🔹 *${groupMetadata.subject}:* Approved +${requests.length}\n`; 
            }
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {}
    }
    if (statusMsg) await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); return sendLongReport(chatId, report + FOOTER, 'Approval_Report');
}
