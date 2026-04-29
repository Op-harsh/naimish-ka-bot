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

// ============================================================================
// ⚙️ NAIMISH'S FRESH CREDENTIALS
// ============================================================================
const TELEGRAM_TOKEN = '8709803495:AAFK5nKZEnsf7K1rC6dwCctlewwRc_fT0Dk'; // 👈 NEW TOKEN UPDATED
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
            if(chatId) safeSend(chatId, `✅ *AUTHENTICATION SUCCESSFUL*\nBaileys Connected! Type /start.`);
        }
        if (connection === 'close') {
            if ((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) startBaileysClient(userId, null);
            else { activeClients.delete(userId); fs.rmSync(sessionPath, { recursive: true, force: true }); if(chatId) safeSend(chatId, `🚨 *WA DISCONNECTED*\nSession Wiped.`); }
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
// ⌨️ CALLBACK & INPUT HANDLERS
// ============================================================================
tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; const userId = query.from.id; const data = query.data; const state = getState(userId);
    const uClient = activeClients.get(userId)?.client; tgBot.answerCallbackQuery(query.id).catch(()=>{});

    if (data === 'btn_main_menu') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return sendMainMenu(chatId, userId); }
    if (data === 'menu_login') return tgBot.editMessageText(`📱 *Cᴏɴɴᴇᴄᴛ WʜᴀᴛsAᴘᴘ*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{ text: '🔑 Pᴀɪʀ Cᴏᴅᴇ', callback_data: 'login_pair_code' }, { text: '📷 Pᴀɪʀ QR', callback_data: 'login_pair_qr' }], [{ text: '🔙 Bᴀᴄᴋ', callback_data: 'btn_main_menu' }]] } });
    if (data === 'login_pair_code') { state.action = 'WAITING_FOR_LOGIN_NUMBER'; return safeSend(chatId, `🔑 *Pᴀɪʀ Cᴏᴅᴇ*\nEnter Phone (eg. 919999999999):`); }
    if (data === 'login_pair_qr') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return startBaileysClient(userId, chatId, null); }
    if (data === 'menu_logout_execute') { if (uClient) uClient.logout(); const p = path.join(SESSIONS_DIR, `session_${userId}`); if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); activeClients.delete(userId); return sendMainMenu(chatId, userId); }

    if (data === 'menu_mass_add') {
        state.action = 'WAIT_VCF_AND_LINK';
        return tgBot.editMessageText(`➕ **MASS GROUP ADD**\nSend Link in caption and attach VCF.`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '❌ Cancel', callback_data: 'btn_main_menu'}]]} });
    }
    if (data.startsWith('start_mission_')) { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return executeLiveParallelEngine(chatId, userId, uClient, data.replace('start_mission_', '')); }

    const menus = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast'];
    if (menus.includes(data)) {
        if (!uClient) return safeSend(chatId, "⚠️ System offline.");
        if (data === 'menu_creategroup') { state.action = 'WAIT_GROUP_NAME'; return safeSend(chatId, "➕ *Phase 1:* Base Name?"); }
        if (data === 'menu_joingroup') { state.action = 'WAIT_JOIN_LINKS'; return safeSend(chatId, "📥 *AUTO-JOIN*\nLinks:"); }
        if (data === 'menu_rename_groups') { state.action = 'WAIT_RENAME_DATA'; return safeSend(chatId, "✏️ *RENAMER*\nLink\\nName format:"); }
        if (data === 'menu_broadcast') { state.action = 'WAIT_BROADCAST_MSG'; return safeSend(chatId, "📢 *BROADCAST*\nSend Message:"); }
        
        let statusMsg = await safeSend(chatId, "📡 *Scanning...*");
        try {
            const groups = await uClient.groupFetchAllParticipating();
            state.adminGroups = Object.values(groups).filter(g => g.participants.find(p => p.id === jidNormalizedUser(uClient.user.id))?.admin).map(g => ({ id: g.id, name: g.subject }));
            if (statusMsg) tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            state.currentPage = 0; state.selectedGroupsArray = []; state.flowContext = data.replace('menu_', '').toUpperCase();
            return tgBot.sendMessage(chatId, '🎯 *SELECT TARGETS:*', { parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) { }
    }
    if (data === 'confirm_selection') {
        if (state.flowContext === 'AUTOKICK') { state.action = 'WAIT_KICK_TERM'; return safeSend(chatId, "⚔️ *Target Number:*"); }
        if (state.flowContext === 'EXTRACTLINKS') { tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); return extractGroupLinksEngine(chatId, userId, uClient); }
        if (state.flowContext === 'APPROVE') return autoApproveEngine(chatId, userId, uClient);
    }
    if (data.startsWith('selgrp_')) { const id = data.split('_')[1]; if (state.selectedGroupsArray.includes(id)) state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id); else state.selectedGroupsArray.push(id); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
    if (data.startsWith('page_')) { state.currentPage = parseInt(data.split('_')[1]); return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); }
});

function getPaginationKeyboard(userId) {
    const state = getState(userId); const start = state.currentPage * 5; const items = state.adminGroups.slice(start, start + 5);
    let kb = [[{ text: 'Sᴇʟᴇᴄᴛ ALL', callback_data: 'select_all' }]];
    items.forEach(g => { const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); });
    let navRow = []; if (state.currentPage > 0) navRow.push({ text: '◀️ Pʀᴇᴠ', callback_data: `page_${state.currentPage - 1}` });
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) navRow.push({ text: 'Nᴇxᴛ ▶️', callback_data: `page_${state.currentPage + 1}` });
    if (navRow.length > 0) kb.push(navRow);
    kb.push([{ text: `⚡ Cᴏɴғɪʀᴍ`, callback_data: 'confirm_selection' }]); kb.push([{ text: `❌ Cᴀɴᴄᴇʟ`, callback_data: 'btn_main_menu' }]); return { inline_keyboard: kb };
}

tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; const userId = msg.from.id; const text = msg.text || ''; const state = getState(userId);
    const uClient = activeClients.get(userId)?.client;

    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { state.action = null; return startBaileysClient(userId, chatId, text.replace(/[^0-9]/g, '')); }

    if (state.action === 'WAIT_VCF_AND_LINK') {
        const linkMatch = msg.caption?.match(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/i);
        if (!msg.document || !linkMatch) return safeSend(chatId, "❌ Invalid Format.");
        try {
            const filePath = await tgBot.downloadFile(msg.document.file_id, __dirname);
            const vcfData = fs.readFileSync(filePath, 'utf8'); fs.unlinkSync(filePath);
            const numbers = [...vcfData.matchAll(/TEL(?:;[^:]+)?:[+]?([0-9]+)/gi)].map(m => m[1] + '@s.whatsapp.net');
            state.tempData.targets = numbers; state.action = null;
            return safeSend(chatId, `⚙️ *CONFIG READY*\nTarget: \`${linkMatch[1]}\`\nContacts: ${numbers.length}`, { reply_markup: { inline_keyboard: [ [{text: '🚀 START', callback_data: `start_mission_${linkMatch[1]}`}] ] } });
        } catch(e) { return safeSend(chatId, "❌ Parsing Failed."); }
    }

    if (!uClient) return;

    if (state.action === 'WAIT_GROUP_NAME') { state.groupConfig.baseName = text.trim(); state.action = 'WAIT_GROUP_COUNT'; return safeSend(chatId, `🔢 Quantity?`); } 
    if (state.action === 'WAIT_GROUP_COUNT') { state.groupConfig.count = parseInt(text); state.action = 'WAIT_GROUP_MEMBER'; return safeSend(chatId, `👤 Member ID?`); } 
    if (state.action === 'WAIT_GROUP_MEMBER') { state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; return startGroupCreationProcess(chatId, userId, uClient); }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        for (let code of codes) { try { await uClient.groupAcceptInvite(code); await new Promise(r => setTimeout(r, 3000)); } catch (e) { } }
        return safeSend(chatId, "✅ Join Mission Complete.");
    }

    if (state.action === 'WAIT_BROADCAST_MSG') {
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray; state.action = null;
        for (let target of targets) { try { await uClient.sendMessage(target, { text: text }); await new Promise(r => setTimeout(r, 2000)); } catch(e) {} }
        return safeSend(chatId, "✅ Broadcast Complete.");
    }
});

// ============================================================================
// ⚙️ ENGINES
// ============================================================================
async function executeLiveParallelEngine(chatId, userId, uClient, inviteCode) {
    const state = getState(userId); let targets = state.tempData?.targets || [];
    try {
        const targetGid = await uClient.groupAcceptInvite(inviteCode);
        for (let j = 0; j < targets.length; j += 5) {
            await uClient.groupParticipantsUpdate(targetGid, targets.slice(j, j + 5), 'add');
            await new Promise(r => setTimeout(r, 12000));
        }
        safeSend(chatId, "✅ Mission Complete.");
    } catch(e) { safeSend(chatId, "❌ Failed."); }
}

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig;
    for (let i = 1; i <= config.count; i++) {
        try {
            await uClient.groupCreate(`${config.baseName} ${i}`, [config.memberId]);
            await new Promise(r => setTimeout(r, 5000));
        } catch (e) { }
    }
    return safeSend(chatId, "✅ Groups Created.");
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const targets = getState(userId).selectedGroupsArray === 'ALL' ? getState(userId).adminGroups.map(g => g.id) : getState(userId).selectedGroupsArray;
    let report = "🔗 *LINKS:*\n";
    for (let target of targets) { try { const code = await uClient.groupInviteCode(target); report += `🔹 https://chat.whatsapp.com/${code}\n`; } catch (e) { } }
    return sendLongReport(chatId, report, 'Links');
}

async function autoApproveEngine(chatId, userId, uClient) {
    const state = getState(userId); const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray;
    for (let target of targetGroupIds) { try { const reqs = await uClient.groupRequestParticipantsList(target); if (reqs.length) await uClient.groupRequestParticipantsUpdate(target, reqs.map(r => r.jid), 'approve'); } catch (e) { } }
    return safeSend(chatId, "✅ Approved.");
}
