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
const port = process.env.PORT || 3000; 

app.get('/', (req, res) => { 
    res.send('<h1 style="color:#00ffcc;background:#121212;height:100vh;text-align:center;padding-top:20%;">🚀 Supreme Master V38.8 (Peak UX Edition) Active</h1>'); 
});

app.listen(port, () => {
    console.log(`☁️ [SERVER] Web Interface Active on Port ${port}`);
});

// ============================================================================
// ⚙️ 3. CORE CONFIGURATION
// ============================================================================
const TELEGRAM_TOKEN = '8709803495:AAHfunw8KiTsFooEwdXKAbvknr2kdRCFMOI'; // 👈 APNA TOKEN YAHAN DAALO
const OWNER_ID = 5524906942; // 👈 APNI ASLI TELEGRAM ID YAHAN DAALO
const OWNER_USERNAME = '@Naimish555'; 

const tgBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

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
        '--disable-accelerated-2d-canvas'
    ]
};

if (fs.existsSync('/data/data/com.termux/files/usr/bin/chromium-browser')) {
    puppeteerOptions.executablePath = '/data/data/com.termux/files/usr/bin/chromium-browser';
}

console.log(`\n🔥 SUPREME MASTER V38.8 INITIALIZING...\n`);

// ============================================================================
// 🧠 4. STATE MANAGEMENT & PERSISTENT DB
// ============================================================================
let userLanguage = 'Hinglish'; 
const activeClients = {}; 
let userStates = {}; 
let knownBotUsers = [];

// 🔥 SMART DATABASE LOAD (Railway Restart Proof)
const BOT_USERS_FILE = './bot_users.json';
if (fs.existsSync(BOT_USERS_FILE)) {
    try { 
        knownBotUsers = JSON.parse(fs.readFileSync(BOT_USERS_FILE)); 
    } catch(e) {
        console.error("Failed to load bot users DB:", e.message);
    }
}

function getState(userId) {
    if (!userStates[userId]) {
        userStates[userId] = { 
            action: null, 
            adminGroups: [], 
            currentPage: 0, 
            flowContext: '', 
            selectedGroupsArray: [], 
            lastMsgId: null,
            groupConfig: { 
                baseName: '', 
                count: 0, 
                memberId: '', 
                desc: '', 
                pfpPath: null, 
                settings: { 
                    msgsAdminOnly: false, 
                    infoAdminOnly: false 
                } 
            }
        };
    }
    return userStates[userId];
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
    securityConfig: { 
        enabled: false, 
        ruleType: 'WHITELIST', 
        countries: ['91'], 
        vipNumbers: [], 
        autoKickEnabled: false, 
        strikeCount: 3, 
        violations: {}, 
        targetMode: 'ALL', 
        targetGroups: [] 
    },
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

const DIVIDER = '━━━━━━━━━━━━━━━━━━━━';
const FOOTER = `\n${DIVIDER}\n👑 _Supreme System v38.8_ | Owner: ${OWNER_USERNAME}`;

// ============================================================================
// 🛠️ 5. SYSTEM HELPERS
// ============================================================================
function createProgressBar(current, total) {
    if (total === 0) {
        return `[██████████] 100%`;
    }
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
            await tgBot.sendDocument(chatId, filePath, { 
                caption: `📄 *REPORT GENERATED*\n${FOOTER}`, 
                parse_mode: 'Markdown', 
                ...options 
            }); 
            fs.unlinkSync(filePath); 
        } catch (e) {
            console.error("Report generation failed:", e);
        }
    } else { 
        tgBot.sendMessage(chatId, text, { parse_mode: 'Markdown', ...options }).catch(()=>{}); 
    }
}

async function checkAccess(userId, chatId, msgObj = null) {
    if (!knownBotUsers.includes(userId)) { 
        knownBotUsers.push(userId); 
        fs.writeFileSync(BOT_USERS_FILE, JSON.stringify(knownBotUsers));
        
        if (adminConfig.botAlerts && msgObj) {
            const userName = msgObj.from?.first_name || 'Unknown';
            tgBot.sendMessage(OWNER_ID, `🚨 *NEW USER DETECTED*\n${DIVIDER}\n👤 *Name:* ${userName}\n🆔 *ID:* \`${userId}\`\n${FOOTER}`, { parse_mode: 'Markdown' }).catch(()=>{});
        }
    }

    if (userId === OWNER_ID || adminConfig.admins.includes(userId)) {
        return true;
    }

    if (adminConfig.bannedUsers.includes(userId)) { 
        tgBot.sendMessage(chatId, `🚫 *BANNED*\nAap system use nahi kar sakte.`, { parse_mode: 'Markdown' }).catch(()=>{}); 
        return false; 
    }

    if (adminConfig.approvalRequired && !adminConfig.allowedUsers.includes(userId)) { 
        tgBot.sendMessage(chatId, `🔒 *ACCESS DENIED*\nAapke paas approval nahi hai.`, { parse_mode: 'Markdown' }).catch(()=>{}); 
        return false; 
    }

    return true;
}

function hasFeatureAccess(userId, featureKey) {
    let role = 'user';
    
    if (userId === OWNER_ID) {
        role = 'owner';
    } else if (adminConfig.admins.includes(userId)) {
        role = 'admin';
    }
    
    return adminConfig.featurePerms[featureKey] && adminConfig.featurePerms[featureKey].includes(role);
}

// ============================================================================
// 🚀 6. WHATSAPP ENGINE (INSTANT MANAGE GC MSG INC.)
// ============================================================================
function startWhatsAppClient(userId, chatId, cleanNumber) {
    if (activeClients[userId] && activeClients[userId].status === 'initializing') {
        return tgBot.sendMessage(chatId, `⚠️ Process pehle se chal raha hai bhai, thoda wait kar le.`);
    }

    tgBot.sendMessage(chatId, `📡 *PHASE 1: Launching Turbo Engine...*`, { parse_mode: 'Markdown' });
    
    const clientOptions = { 
        authStrategy: new LocalAuth({ clientId: `user_${userId}`, dataPath: './multi_sessions' }), 
        puppeteer: puppeteerOptions 
    };

    if (cleanNumber) {
        clientOptions.pairWithPhoneNumber = { phoneNumber: cleanNumber };
    }

    const client = new Client(clientOptions);
    activeClients[userId] = { client: client, status: 'initializing', isReady: false };

    client.on('code', (code) => { 
        tgBot.sendMessage(chatId, `✅ *PAIRING CODE:*\nNumber: +${cleanNumber}\nToken: \`${code}\``, { parse_mode: 'Markdown' }); 
    });

    client.on('authenticated', () => { 
        if (activeClients[userId]) { 
            activeClients[userId].isReady = true; 
            activeClients[userId].status = 'connected'; 
            tgBot.sendMessage(chatId, `✅ *INSTANT AUTH SUCCESS!*\nType /start to access dashboard.`, { parse_mode: 'Markdown' }); 
        } 
    });

    client.on('ready', () => { 
        if (activeClients[userId]) { 
            activeClients[userId].isReady = true; 
            activeClients[userId].status = 'connected'; 
        } 
    });

    client.on('disconnected', (reason) => { 
        tgBot.sendMessage(chatId, `⚠️ *WhatsApp Disconnected!*\nReason: ${reason}`); 
        delete activeClients[userId]; 
    });

    // INSTANT-KILL MANAGE GC MSG EXECUTION (< 1 SEC)
    client.on('message', async (msg) => {
        const sec = adminConfig.securityConfig;
        
        if (!sec.enabled) {
            return; 
        }

        try {
            const chatGid = msg.from; 
            
            if (!chatGid.endsWith('@g.us')) {
                return; // Only works in groups
            }
            
            // TARGET VERIFICATION
            if (sec.targetMode !== 'ALL' && !sec.targetGroups.includes(chatGid)) {
                return;
            }

            const authorId = msg.author; 
            
            if (!authorId) {
                return;
            }

            const authorNum = authorId.split('@')[0];
            
            // VIP IMMUNITY
            if (sec.vipNumbers.includes(authorNum)) {
                return;
            }
            
            // RULE MATCHING LOGIC
            let shouldDelete = false;
            let matchedCode = sec.countries.find(c => authorNum.startsWith(c));
            
            if (sec.ruleType === 'WHITELIST') { 
                if (sec.countries.length > 0 && !matchedCode) {
                    shouldDelete = true; 
                }
            } else if (sec.ruleType === 'BLACKLIST') { 
                if (matchedCode) {
                    shouldDelete = true; 
                }
            }

            if (!shouldDelete) {
                return; // Normal message, do nothing
            }

            // PERMISSION VERIFICATION
            const chat = await msg.getChat();
            const botId = client.info.wid._serialized;
            const botParticipant = chat.participants.find(p => p.id._serialized === botId);
            
            if (!botParticipant || (!botParticipant.isAdmin && !botParticipant.isSuperAdmin)) {
                return; // Bot doesn't have power to delete
            }

            const authPart = chat.participants.find(p => p.id._serialized === authorId);
            if (authPart && (authPart.isAdmin || authPart.isSuperAdmin)) {
                return; // Author is admin immunity
            }

            // 🔥 FIRE & FORGET PROTOCOL
            msg.delete(true).catch(()=>{}); 
            
            // GHOST LOGGING & AUTO-KICK SYSTEM
            let msgContent = msg.hasMedia ? '[MEDIA / STICKER]' : msg.body;
            
            if (!sec.violations[authorId]) {
                sec.violations[authorId] = 0;
            }
            sec.violations[authorId] += 1;
            
            const strikes = sec.violations[authorId];

            if (strikes >= sec.strikeCount && sec.autoKickEnabled) {
                chat.removeParticipants([authorId]).catch(()=>{}); 
                tgBot.sendMessage(OWNER_ID, `⚔️ *MANAGE GC PURGE EXECUTED*\n${DIVIDER}\n🎯 Group: ${chat.name}\n💀 Target: +${authorNum}\n⚠️ Reason: ${strikes} Strikes Reached. Permanently Kicked.`, { parse_mode: 'Markdown' }).catch(()=>{});
                sec.violations[authorId] = 0; 
            } else {
                let sWarn = sec.autoKickEnabled ? `⚠️ Strike: ${strikes}/${sec.strikeCount}` : `⚠️ Strike: ${strikes} (Auto-Kick OFF)`;
                tgBot.sendMessage(OWNER_ID, `🛡️ *MANAGE GC ALERT: NUKED IN < 1s*\n${DIVIDER}\n🎯 Group: ${chat.name}\n👤 Sender: +${authorNum}\n📄 Msg: _"${msgContent}"_\n${sWarn}\n💥 Action: Instantly Deleted`, { parse_mode: 'Markdown' }).catch(()=>{});
            }
        } catch (e) {
            // Fails silently to maintain high-speed execution
        }
    });

    client.initialize().catch(e => { 
        delete activeClients[userId]; 
    });
}

// AUTO-RESUME EXISTING SESSIONS
if (fs.existsSync('./multi_sessions')) {
    fs.readdirSync('./multi_sessions').forEach(dir => {
        if (dir.startsWith('session-user_')) { 
            const userId = dir.split('session-user_')[1];
            startWhatsAppClient(userId, OWNER_ID, null); 
        }
    });
}

// ============================================================================
// 🛡️ 7. PANELS & MENUS (BEAUTIFULLY FORMATTED)
// ============================================================================
function sendAdminPanel(chatId, userId) {
    getState(userId).action = null;
    
    let adminKeyboard = {
        inline_keyboard: [
            [{ text: `📢 BROADCAST TO BOT USERS (${knownBotUsers.length})`, callback_data: 'admin_bot_broadcast' }],
            
            [{ text: `📢 Force Sub: ${adminConfig.fsubEnabled ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_fsub' }, 
             { text: `🔒 Approval: ${adminConfig.approvalRequired ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_approval' }],
            
            [{ text: `🔔 Alerts: ${adminConfig.botAlerts ? 'ON' : 'OFF'}`, callback_data: 'admin_toggle_alerts' }],
            
            [{ text: '✅ Allow User', callback_data: 'admin_allow_user' }, 
             { text: '❌ Revoke', callback_data: 'admin_revoke_user' }],
             
            [{ text: '➕ Add Admin 👑', callback_data: 'admin_add_admin' }, 
             { text: '➖ Manage Admins 👑', callback_data: 'admin_manage_admins' }],
             
            [{ text: '➕ Add F-Sub 👑', callback_data: 'admin_add_fsub' }, 
             { text: '➖ Manage F-Subs 👑', callback_data: 'admin_manage_fsubs' }],
            
            [{ text: '🚫 Ban User', callback_data: 'admin_ban_user' }, 
             { text: '♻️ Unban', callback_data: 'admin_unban_user' }],
            
            [{ text: '⚙️ Feature Perms', callback_data: 'admin_feature_permissions' }],
            
            [{ text: '🔙 Back', callback_data: 'btn_main_menu' }]
        ]
    };
    
    tgBot.sendMessage(chatId, `🛡️ *ADMIN PANEL*\nTotal System Users: ${knownBotUsers.length}`, { 
        parse_mode: 'Markdown', 
        reply_markup: adminKeyboard 
    }).catch(()=>{});
}

function sendShieldMenu(chatId, userId, msgId = null) {
    const sec = adminConfig.securityConfig;
    
    let targetText = '🌐 ALL GROUPS';
    if (sec.targetMode === 'SELECTED') {
        targetText = `🎯 SELECTED (${sec.targetGroups.length})`;
    } else if (sec.targetMode === 'LINKS') {
        targetText = `🔗 VIA LINKS (${sec.targetGroups.length})`;
    }

    const txt = `🛡️ *MANAGE GC MSG CONTROL*\n${DIVIDER}\n` +
                `*Master Power:* ${sec.enabled ? '🟢 ONLINE' : '🔴 OFFLINE'}\n` +
                `*Target Scope:* ${targetText}\n` +
                `*Rules Mode:* ${sec.ruleType === 'WHITELIST' ? '🟢 WHO CAN MSG (Whitelist)' : '🔴 BAN COUNTRIES (Blacklist)'}\n` +
                `*Auto-Kick (3 Strikes):* ${sec.autoKickEnabled ? '⚡ ON' : '⏸️ OFF'}\n\n` +
                `🌐 *Countries:* ${sec.countries.length > 0 ? sec.countries.join(', ') : 'None'}\n` +
                `👤 *VIP Numbers:* ${sec.vipNumbers.length > 0 ? sec.vipNumbers.join(', ') : 'None'}\n`;
    
    const kb = { 
        inline_keyboard: [
            [{ text: `🛡️ System Power: ${sec.enabled ? 'TURN OFF' : 'TURN ON'}`, callback_data: 'sec_toggle_power' }],
            [{ text: `🎯 TARGET SCOPE: ${sec.targetMode}`, callback_data: 'sec_menu_targets' }],
            [{ text: `🔄 Change Mode to ${sec.ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST'}`, callback_data: 'sec_toggle_mode' }],
            [{ text: `⚡ Auto-Kick: ${sec.autoKickEnabled ? '🟢 ON' : '🔴 OFF'}`, callback_data: 'sec_toggle_autokick' }],
            [{ text: `➕ Add Country Code`, callback_data: 'sec_add_country' }, { text: `➖ Remove Country`, callback_data: 'sec_rem_country' }],
            [{ text: `➕ Add VIP Number`, callback_data: 'sec_add_vip' }, { text: `➖ Remove VIP`, callback_data: 'sec_rem_vip' }],
            [{ text: '🔙 Back to Menu', callback_data: 'btn_main_menu' }]
        ]
    };

    if (msgId) {
        tgBot.editMessageText(txt, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{});
    } else {
        tgBot.sendMessage(chatId, txt, { parse_mode: 'Markdown', reply_markup: kb });
    }
}

function sendMainMenu(chatId, userId) {
    getState(userId).action = null; 
    const isReady = activeClients[userId] && activeClients[userId].isReady;
    let inlineKeyboard = [];
    
    if (!isReady && hasFeatureAccess(userId, 'login')) {
        inlineKeyboard.push([{ text: `🔐 Auth Session`, callback_data: 'menu_login' }]);
    }
    
    let row1 = [];
    let row2 = [];
    let row3 = [];
    let row4 = [];
    
    if (hasFeatureAccess(userId, 'creategroup')) {
        row1.push({ text: `➕ Mass Group`, callback_data: 'menu_creategroup' });
    }
    if (hasFeatureAccess(userId, 'joingroup')) {
        row1.push({ text: `📥 Auto-Join`, callback_data: 'menu_joingroup' });
    }
    if (row1.length > 0) {
        inlineKeyboard.push(row1);
    }
    
    if (hasFeatureAccess(userId, 'renamegroups')) {
        row2.push({ text: `✏️ Rename Groups`, callback_data: 'menu_rename_groups' });
    }
    if (hasFeatureAccess(userId, 'extractlinks')) {
        row2.push({ text: `🔗 Extract Links`, callback_data: 'menu_extractlinks' });
    }
    if (row2.length > 0) {
        inlineKeyboard.push(row2);
    }
    
    if (hasFeatureAccess(userId, 'approve')) {
        row3.push({ text: `👥 Auto-Approve`, callback_data: 'menu_approve' });
    }
    if (hasFeatureAccess(userId, 'autokick')) {
        row3.push({ text: `⚔️ Tactical Purge`, callback_data: 'menu_autokick' });
    }
    if (row3.length > 0) {
        inlineKeyboard.push(row3);
    }
    
    if (hasFeatureAccess(userId, 'broadcast')) {
        row4.push({ text: `📢 WhatsApp Broadcast`, callback_data: 'menu_broadcast' });
    }
    if (hasFeatureAccess(userId, 'stats')) {
        row4.push({ text: `📊 Stats`, callback_data: 'menu_stats' });
    }
    if (row4.length > 0) {
        inlineKeyboard.push(row4);
    }
    
    if (hasFeatureAccess(userId, 'security')) {
        inlineKeyboard.push([{ text: `🛡️ Manage GC Msg`, callback_data: 'menu_security' }]);
    }
    
    if (userId === OWNER_ID) {
        inlineKeyboard.push([{ text: `👑 OVERLORD ADMIN PANEL`, callback_data: 'btn_admin_panel' }]);
    }
    
    const humanStatus = isReady ? '🟢 WA Connected & Ready! (Macha do)' : '🔴 WA Disconnected (Bhai, pehle login karlo)';
    const menuText = `🤖 *COMMAND CENTER* \n${DIVIDER}\n📡 Status: ${humanStatus}${FOOTER}`;
    tgBot.sendMessage(chatId, menuText, { parse_mode: 'Markdown', reply_markup: { inline_keyboard: inlineKeyboard } }).catch(()=>{});
}

tgBot.onText(/\/start/, async (msg) => { 
    if (await checkAccess(msg.from.id, msg.chat.id, msg)) {
        sendMainMenu(msg.chat.id, msg.from.id); 
    }
});

tgBot.onText(/\/admin/, async (msg) => { 
    if (await checkAccess(msg.from.id, msg.chat.id, msg)) {
        if (msg.from.id === OWNER_ID || adminConfig.admins.includes(msg.from.id)) {
            sendAdminPanel(msg.chat.id, msg.from.id);
        }
    }
});

// ============================================================================
// ⌨️ 9. CALLBACK QUERIES (100% RESTORED LOGIC)
// ============================================================================
tgBot.on('callback_query', async (query) => {
    const chatId = query.message.chat.id; 
    const userId = query.from.id; 
    const data = query.data; 
    const state = getState(userId);
    const uClient = activeClients[userId] ? activeClients[userId].client : null;
    
    if (!(await checkAccess(userId, chatId, query))) {
        return;
    }

    if (data === 'btn_main_menu') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return sendMainMenu(chatId, userId); 
    }
    
    if (data === 'btn_admin_panel') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return sendAdminPanel(chatId, userId); 
    }
    
    if (data === 'admin_bot_broadcast') {
        state.action = 'WAIT_BOT_BROADCAST_MSG';
        return tgBot.editMessageText(`📢 *UNIVERSAL BOT BROADCAST*\n\nSend your payload (Text, Image, Video, File) below.\nTotal Target Users: ${knownBotUsers.length}`, { 
            chat_id: chatId, 
            message_id: query.message.message_id, 
            parse_mode: 'Markdown', 
            reply_markup: { inline_keyboard: [[{text: '🔙 Abort', callback_data: 'btn_admin_panel'}]] } 
        });
    }

    // MANAGE GC MSG TARGETS MENU
    if (data === 'sec_menu_targets') {
        const kb = { 
            inline_keyboard: [
                [{ text: `🌐 Apply to ALL GROUPS`, callback_data: 'sec_tgt_all' }],
                [{ text: `🎯 SELECT FROM LIST`, callback_data: 'sec_tgt_select' }],
                [{ text: `🔗 APPLY VIA INVITE LINKS`, callback_data: 'sec_tgt_links' }],
                [{ text: `🔙 Back to Manage GC`, callback_data: 'menu_security' }]
            ]
        };
        return tgBot.editMessageText(`🎯 *TARGET SELECTION*\nKaunse groups par yeh system lagana hai?`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }

    if (data === 'sec_tgt_all') { 
        adminConfig.securityConfig.targetMode = 'ALL'; 
        adminConfig.securityConfig.targetGroups = []; 
        return sendShieldMenu(chatId, userId, query.message.message_id); 
    }

    if (data === 'sec_tgt_links') { 
        state.action = 'WAIT_SEC_LINKS'; 
        return tgBot.editMessageText(`🔗 *SETUP VIA LINKS*\nBhai, WhatsApp invite links bhej de yahan:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
    }

    if (data === 'sec_tgt_select') {
        if (!uClient || !uClient.info) {
            return tgBot.answerCallbackQuery(query.id, { text: "⚠️ Bhai, pehle apna WhatsApp connect (Login) kar lo, system abhi offline hai!", show_alert: true });
        }
        
        let status = await tgBot.sendMessage(chatId, "📡 *Scanning privileges...*", { parse_mode: 'Markdown' });
        
        try {
            const chats = await uClient.getChats();
            state.adminGroups = chats.filter(c => c.isGroup && c.participants.find(p => p.id.user === uClient.info.wid.user && (p.isAdmin || p.isSuperAdmin))).map(c => ({ id: c.id._serialized, name: c.name }));
            
            tgBot.deleteMessage(chatId, status.message_id).catch(()=>{});
            
            if (state.adminGroups.length === 0) {
                return tgBot.sendMessage(chatId, "❌ Admin rights not found in any group.");
            }
            
            state.currentPage = 0; 
            state.selectedGroupsArray = [...adminConfig.securityConfig.targetGroups]; 
            state.flowContext = 'SHIELD_TARGETS';
            
            return tgBot.editMessageText('🎯 *SELECT TARGETS:*', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) {
            console.error(e);
        }
    }

    // MANAGE GC MSG CONTROLS
    if (data === 'menu_security') {
        return sendShieldMenu(chatId, userId, query.message.message_id); 
    }
    
    if (data === 'sec_toggle_power') { 
        adminConfig.securityConfig.enabled = !adminConfig.securityConfig.enabled; 
        return sendShieldMenu(chatId, userId, query.message.message_id); 
    }
    
    if (data === 'sec_toggle_mode') { 
        adminConfig.securityConfig.ruleType = adminConfig.securityConfig.ruleType === 'WHITELIST' ? 'BLACKLIST' : 'WHITELIST'; 
        return sendShieldMenu(chatId, userId, query.message.message_id); 
    }
    
    if (data === 'sec_toggle_autokick') { 
        adminConfig.securityConfig.autoKickEnabled = !adminConfig.securityConfig.autoKickEnabled; 
        return sendShieldMenu(chatId, userId, query.message.message_id); 
    }
    
    if (data === 'sec_add_country') { 
        state.action = 'WAIT_SEC_ADD_COUNTRY'; 
        return tgBot.editMessageText(`🌐 *ADD COUNTRY CODE*\nEnter codes (e.g. 91, 1):`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
    }
    
    if (data === 'sec_rem_country') { 
        state.action = 'WAIT_SEC_REM_COUNTRY'; 
        return tgBot.editMessageText(`🌐 *REMOVE COUNTRY CODE*\nEnter code:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
    }
    
    if (data === 'sec_add_vip') { 
        state.action = 'WAIT_SEC_ADD_VIP'; 
        return tgBot.editMessageText(`👤 *ADD VIP NUMBER*\nEnter number:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
    }
    
    if (data === 'sec_rem_vip') { 
        state.action = 'WAIT_SEC_REM_VIP'; 
        return tgBot.editMessageText(`👤 *REMOVE VIP NUMBER*\nEnter number:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
    }

    if (data === 'menu_login') { 
        state.action = 'WAITING_FOR_LOGIN_NUMBER'; 
        return tgBot.editMessageText(`🔐 Enter your WhatsApp Number:`, { chat_id: chatId, message_id: query.message.message_id }); 
    }

    // ADMIN PANEL COMMANDS
    if (data.startsWith('admin_')) {
        if (data === 'admin_allow_user') { 
            state.action = 'WAITING_FOR_ALLOW_ID'; 
            return tgBot.editMessageText(`✅ Provide ID to allow:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } }); 
        }
        if (data === 'admin_revoke_user') { 
            state.action = 'WAITING_FOR_REVOKE_ID'; 
            return tgBot.editMessageText(`❌ Provide ID to revoke:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } }); 
        }
        if (data === 'admin_ban_user') { 
            state.action = 'WAITING_FOR_BAN_ID'; 
            return tgBot.editMessageText(`🚫 Provide ID to ban:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } }); 
        }
        if (data === 'admin_unban_user') { 
            state.action = 'WAITING_FOR_UNBAN_ID'; 
            return tgBot.editMessageText(`♻️ Provide ID to unban:`, { chat_id: chatId, message_id: query.message.message_id, reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } }); 
        }
        
        if (data === 'admin_add_admin') {
            state.action = 'WAITING_FOR_ADMIN_ID';
            return tgBot.editMessageText(`👑 *ADD SUB-ADMIN*\nProvide new Admin's Telegram ID:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } });
        }
        if (data === 'admin_manage_admins') {
            let kb = adminConfig.admins.map(id => ([{ text: `❌ Remove Admin: ${id}`, callback_data: `rem_admin_${id}` }]));
            kb.push([{ text: '🔙 Back', callback_data: 'btn_admin_panel' }]);
            return tgBot.editMessageText(`👥 *MANAGE ADMINS*\nClick to revoke rights:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
        }
        if (data === 'admin_add_fsub') {
            state.action = 'WAITING_FOR_FSUB_DATA';
            return tgBot.editMessageText(`📢 *ADD FORCE SUB CHANNEL*\nFormat:\n\`@ChannelID | https://link.com\``, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '🔙 Back', callback_data: 'btn_admin_panel'}]] } });
        }
        if (data === 'admin_manage_fsubs') {
            let kb = adminConfig.fsubChannels.map(ch => ([{ text: `❌ Remove: ${ch.id}`, callback_data: `rem_fsub_${ch.id}` }]));
            kb.push([{ text: '🔙 Back', callback_data: 'btn_admin_panel' }]);
            return tgBot.editMessageText(`📺 *MANAGE FORCE SUBS*\nClick to remove channel:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: kb } });
        }
        if (data === 'admin_feature_permissions') {
            const kb = { inline_keyboard: [
                [{ text: '🔐 Login Auth', callback_data: 'perm_feat_login' }],
                [{ text: '➕ Auto Group', callback_data: 'perm_feat_creategroup' }, { text: '📥 Join Group', callback_data: 'perm_feat_joingroup' }],
                [{ text: '✏️ Rename Groups', callback_data: 'perm_feat_renamegroups' }, { text: '🔗 Extract Links', callback_data: 'perm_feat_extractlinks' }],
                [{ text: '👥 Auto Approve', callback_data: 'perm_feat_approve' }, { text: '⚔️ Tactical Kick', callback_data: 'perm_feat_autokick' }],
                [{ text: '📢 Broadcast', callback_data: 'perm_feat_broadcast' }, { text: '📊 Stats', callback_data: 'perm_feat_stats' }],
                [{ text: '🛡️ Manage GC Msg', callback_data: 'perm_feat_security' }],
                [{ text: '🔙 Back to Admin Panel', callback_data: 'btn_admin_panel' }]
            ]};
            return tgBot.editMessageText(`⚙️ *FEATURE ACCESS CONTROL*\nSelect feature to configure roles:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
        }
    }

    if (data.startsWith('perm_feat_')) {
        if (userId !== OWNER_ID) return tgBot.answerCallbackQuery(query.id, { text: '⚠️ Owner Only!', show_alert: true });
        const featKey = data.split('perm_feat_')[1];
        const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [
            [{ text: `👑 Owner: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }],
            [{ text: `🛡️ Admin: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }],
            [{ text: `👤 User: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }],
            [{ text: '🔙 Back', callback_data: 'admin_feature_permissions' }]
        ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*\nToggle allowed roles:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }
    
    if (data.startsWith('perm_tgl_')) {
        if (userId !== OWNER_ID) return;
        const parts = data.split('_');
        const featKey = parts[2], roleKey = parts[3];
        if (adminConfig.featurePerms[featKey].includes(roleKey)) {
            adminConfig.featurePerms[featKey] = adminConfig.featurePerms[featKey].filter(r => r !== roleKey);
        } else {
            adminConfig.featurePerms[featKey].push(roleKey);
        }
        const roles = adminConfig.featurePerms[featKey] || [];
        const kb = { inline_keyboard: [
            [{ text: `👑 Owner: ${roles.includes('owner') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_owner` }],
            [{ text: `🛡️ Admin: ${roles.includes('admin') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_admin` }],
            [{ text: `👤 User: ${roles.includes('user') ? '✅' : '❌'}`, callback_data: `perm_tgl_${featKey}_user` }],
            [{ text: '🔙 Back', callback_data: 'admin_feature_permissions' }]
        ]};
        return tgBot.editMessageText(`⚙️ *PERMISSIONS FOR: ${featKey.toUpperCase()}*\nToggle allowed roles:`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb });
    }

    if (data.startsWith('rem_')) {
        if (userId !== OWNER_ID) return tgBot.answerCallbackQuery(query.id, { text: 'Owner Only!', show_alert: true });
        if (data.startsWith('rem_admin_')) {
            const id = parseInt(data.split('rem_admin_')[1]);
            adminConfig.admins = adminConfig.admins.filter(a => a !== id);
            return sendAdminPanel(chatId, userId);
        }
        if (data.startsWith('rem_fsub_')) {
            const chId = data.split('rem_fsub_')[1];
            adminConfig.fsubChannels = adminConfig.fsubChannels.filter(c => c.id !== chId);
            return sendAdminPanel(chatId, userId);
        }
    }
    
    // MAIN FEATURE ROUTING
    const menuActions = ['menu_creategroup', 'menu_joingroup', 'menu_rename_groups', 'menu_extractlinks', 'menu_approve', 'menu_autokick', 'menu_broadcast', 'menu_stats'];
    
    if (menuActions.includes(data)) {
        if (!activeClients[userId] || !activeClients[userId].isReady) {
            return tgBot.answerCallbackQuery(query.id, { text: "⚠️ Bhai, pehle apna WhatsApp connect (Login) kar lo, system abhi offline hai!", show_alert: true });
        }

        if (data === 'menu_stats') {
            return tgBot.answerCallbackQuery(query.id, { text: "Stats Ready", show_alert: false }); 
        }

        if (data === 'menu_creategroup') { 
            state.action = 'WAIT_GROUP_NAME'; 
            return tgBot.editMessageText("➕ *Phase 1:* Base Name?", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
        }

        if (data === 'menu_joingroup') { 
            state.action = 'WAIT_JOIN_LINKS'; 
            return tgBot.editMessageText("📥 *AUTO-JOIN*\nSend invite links:", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
        }

        if (data === 'menu_rename_groups') { 
            state.action = 'WAIT_RENAME_DATA'; 
            return tgBot.editMessageText("✏️ *MASS RENAMER*\nSend Name & Link pairs:", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
        }
        
        let status = await tgBot.sendMessage(chatId, "📡 *Scanning privileges...*", { parse_mode: 'Markdown' });
        
        try {
            const chats = await uClient.getChats();
            state.adminGroups = chats.filter(c => c.isGroup && c.participants.find(p => p.id.user === uClient.info.wid.user && (p.isAdmin || p.isSuperAdmin))).map(c => ({ id: c.id._serialized, name: c.name }));
            
            tgBot.deleteMessage(chatId, status.message_id).catch(()=>{});
            
            if (state.adminGroups.length === 0) {
                return tgBot.sendMessage(chatId, "❌ Admin rights not found.");
            }
            
            state.currentPage = 0; 
            state.selectedGroupsArray = []; 
            state.flowContext = data.replace('menu_', '').toUpperCase();
            
            return tgBot.editMessageText('🎯 *SELECT TARGETS:*', { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: getPaginationKeyboard(userId) });
        } catch(e) {
            console.error(e);
        }
    }
    
    // GROUP BUILDER INLINE
    if (data === 'grp_skip_desc') { 
        state.groupConfig.desc = ''; 
        state.action = 'WAIT_GROUP_PFP'; 
        return tgBot.editMessageText("🖼️ *Phase 5:* Send DP or Skip.", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: { inline_keyboard: [[{text: '⏩ Skip DP', callback_data: 'grp_skip_pfp'}]] } }); 
    }
    if (data === 'grp_skip_pfp') { 
        state.groupConfig.pfpPath = null; 
        state.action = null; 
        return sendGroupSettingsMenu(chatId, userId, query.message.message_id); 
    }
    if (data.startsWith('grp_tgl_')) { 
        const setKey = data.replace('grp_tgl_', ''); 
        state.groupConfig.settings[setKey] = !state.groupConfig.settings[setKey]; 
        return sendGroupSettingsMenu(chatId, userId, query.message.message_id); 
    }
    if (data === 'grp_deploy_now') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return startGroupCreationProcess(chatId, userId, uClient); 
    }

    // EXECUTION LOGIC (CONFIRM SELECTION)
    if (data === 'confirm_selection') {
        if (state.flowContext === 'SHIELD_TARGETS') { 
            adminConfig.securityConfig.targetMode = 'SELECTED'; 
            adminConfig.securityConfig.targetGroups = [...state.selectedGroupsArray]; 
            return sendShieldMenu(chatId, userId, query.message.message_id); 
        }
        if (state.flowContext === 'BROADCAST') { 
            state.action = 'WAIT_BROADCAST_MSG'; 
            return tgBot.editMessageText("📢 *Type Broadcast Payload:*", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
        }
        if (state.flowContext === 'AUTOKICK') { 
            state.action = 'WAIT_KICK_TERM'; 
            return tgBot.editMessageText("⚔️ *Type Target Number/Code:*", { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }); 
        }
        if (state.flowContext === 'EXTRACTLINKS') { 
            tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
            return extractGroupLinksEngine(chatId, userId, uClient); 
        }
        if (state.flowContext === 'APPROVE') { 
            const kb = { 
                inline_keyboard: [ 
                    [{ text: '🔓 Turn OFF Approval', callback_data: 'approve_opt_off' }], 
                    [{ text: '✔️ Execute Manual', callback_data: 'approve_opt_manual' }] 
                ]
            };
            return tgBot.editMessageText(`👥 *METHOD?*`, { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown', reply_markup: kb }); 
        }
    }

    if (data === 'approve_opt_off' || data === 'approve_opt_manual') { 
        tgBot.deleteMessage(chatId, query.message.message_id).catch(()=>{}); 
        return autoApproveEngine(chatId, userId, uClient, data === 'approve_opt_off' ? 'OFF_SETTING' : 'MANUAL'); 
    }
    
    // PAGINATION CONTROLS
    if (data.startsWith('selgrp_')) { 
        const id = data.split('_')[1]; 
        if (state.selectedGroupsArray.includes(id)) {
            state.selectedGroupsArray = state.selectedGroupsArray.filter(g => g !== id);
        } else {
            state.selectedGroupsArray.push(id);
        }
        return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); 
    }

    if (data === 'select_all') { 
        state.selectedGroupsArray = 'ALL'; 
        return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); 
    }

    if (data.startsWith('page_')) { 
        state.currentPage = parseInt(data.split('_')[1]); 
        return tgBot.editMessageReplyMarkup(getPaginationKeyboard(userId), { chat_id: chatId, message_id: query.message.message_id }).catch(()=>{}); 
    }
});

function getPaginationKeyboard(userId) {
    const state = getState(userId); 
    const start = state.currentPage * 5; 
    const items = state.adminGroups.slice(start, start + 5);
    
    let kb = [[{ text: 'Select ALL', callback_data: 'select_all' }]];
    
    items.forEach(g => { 
        const isSelected = state.selectedGroupsArray === 'ALL' || state.selectedGroupsArray.includes(g.id); 
        kb.push([{ text: `${isSelected ? '✅' : '👑'} ${g.name}`, callback_data: `selgrp_${g.id}` }]); 
    });
    
    let navRow = [];
    if (state.currentPage > 0) {
        navRow.push({ text: '◀️ Prev', callback_data: `page_${state.currentPage - 1}` });
    }
    if (state.currentPage < Math.ceil(state.adminGroups.length / 5) - 1) {
        navRow.push({ text: 'Next ▶️', callback_data: `page_${state.currentPage + 1}` });
    }
    
    if (navRow.length > 0) {
        kb.push(navRow);
    }
    
    kb.push([{ text: `⚡ Confirm Selection`, callback_data: 'confirm_selection' }]); 
    return { inline_keyboard: kb };
}

function sendGroupSettingsMenu(chatId, userId, msgId) {
    const state = getState(userId);
    const kb = { 
        inline_keyboard: [ 
            [{ text: `🔒 Admin Only Messages: ${state.groupConfig.settings.msgsAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_msgsAdminOnly' }], 
            [{ text: `✏️ Admin Only Edit Info: ${state.groupConfig.settings.infoAdminOnly ? 'ON' : 'OFF'}`, callback_data: 'grp_tgl_infoAdminOnly' }], 
            [{ text: `🚀 LAUNCH DEPLOYMENT`, callback_data: 'grp_deploy_now' }] 
        ]
    };
    
    if (msgId) {
        tgBot.editMessageText(`⚙️ *Phase 6: Permissions*`, { chat_id: chatId, message_id: msgId, parse_mode: 'Markdown', reply_markup: kb }).catch(()=>{});
    } else {
        tgBot.sendMessage(chatId, `⚙️ *Phase 6: Permissions*`, { parse_mode: 'Markdown', reply_markup: kb });
    }
}

// ============================================================================
// 📥 10. TEXT / MEDIA INPUT HANDLER
// ============================================================================
tgBot.on('message', async (msg) => {
    const chatId = msg.chat.id; 
    const userId = msg.from.id; 
    const text = msg.text || ''; 
    const state = getState(userId);

    if (text.startsWith('/') || !(await checkAccess(userId, chatId, msg))) {
        return;
    }

    if (state.action === 'WAIT_BOT_BROADCAST_MSG') {
        state.action = null;
        let targets = [...knownBotUsers]; 
        
        if (targets.length === 0) {
            return tgBot.sendMessage(chatId, `⚠️ No bot users in database.`);
        }
        
        let statusMsg = await tgBot.sendMessage(chatId, `⏳ *Transmitting Payload to ${targets.length} users...*`, { parse_mode: 'Markdown' });
        let success = 0; 
        let failed = 0;

        for (let i = 0; i < targets.length; i++) {
            try {
                await tgBot.copyMessage(targets[i], chatId, msg.message_id);
                success++;
            } catch (e) {
                failed++;
            }
            
            await new Promise(r => setTimeout(r, 50)); 
            
            if ((i + 1) % 15 === 0) {
                tgBot.editMessageText(`⏳ *Transmitting...*\n${createProgressBar(i+1, targets.length)}`, { chat_id: chatId, message_id: statusMsg.message_id, parse_mode: 'Markdown' }).catch(()=>{});
            }
        }
        
        await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
        
        const finalReport = `📢 *BOT BROADCAST REPORT*\n${DIVIDER}\n🎯 *Total Targets:* ${targets.length}\n✅ *Successful:* ${success}\n❌ *Failed/Blocked:* ${failed}\n${FOOTER}`;
        
        return tgBot.sendMessage(chatId, finalReport, { 
            parse_mode: 'Markdown', 
            reply_markup: { inline_keyboard: [[{text: '🔙 Back to Admin', callback_data: 'btn_admin_panel'}]] } 
        });
    }

    // MANAGE GC MSG DATA COLLECTION
    if (state.action && state.action.startsWith('WAIT_SEC_')) {
        if (state.action === 'WAIT_SEC_LINKS') {
            const uClient = activeClients[userId]?.client;
            
            if (!uClient) {
                return tgBot.sendMessage(chatId, "⚠️ Bhai, pehle WhatsApp connect (Login) kar lo!");
            }
            
            const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
            
            if (codes.length === 0) {
                return tgBot.sendMessage(chatId, "⚠️ Bhai, koi valid link nahi mili.");
            }
            
            let statusMsg = await tgBot.sendMessage(chatId, `⏳ *Securing Links...*`);
            adminConfig.securityConfig.targetMode = 'LINKS';
            
            if(adminConfig.securityConfig.targetMode !== 'LINKS') {
                adminConfig.securityConfig.targetGroups = []; 
            }

            for (let code of codes) {
                try {
                    let gid; 
                    try { 
                        gid = await uClient.acceptInvite(code); 
                    } catch(e) { 
                        const info = await uClient.getInviteInfo(code); 
                        gid = info.id._serialized; 
                    }
                    
                    if (!adminConfig.securityConfig.targetGroups.includes(gid)) {
                        adminConfig.securityConfig.targetGroups.push(gid);
                    }
                    
                    await new Promise(r=>setTimeout(r,1500));
                } catch(e) {
                    console.error("Failed to secure link:", code);
                }
            }
            
            tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{});
            state.action = null; 
            return sendShieldMenu(chatId, userId, null);
        }
        
        const inputList = text.replace(/\s/g, '').split(',').filter(i => i !== '');
        
        if (state.action === 'WAIT_SEC_ADD_COUNTRY') {
            adminConfig.securityConfig.countries.push(...inputList);
        }
        if (state.action === 'WAIT_SEC_REM_COUNTRY') {
            adminConfig.securityConfig.countries = adminConfig.securityConfig.countries.filter(c => !inputList.includes(c));
        }
        if (state.action === 'WAIT_SEC_ADD_VIP') {
            adminConfig.securityConfig.vipNumbers.push(...inputList);
        }
        if (state.action === 'WAIT_SEC_REM_VIP') {
            adminConfig.securityConfig.vipNumbers = adminConfig.securityConfig.vipNumbers.filter(n => !inputList.includes(n));
        }
        
        adminConfig.securityConfig.countries = [...new Set(adminConfig.securityConfig.countries)]; 
        adminConfig.securityConfig.vipNumbers = [...new Set(adminConfig.securityConfig.vipNumbers)];
        
        state.action = null; 
        return sendShieldMenu(chatId, userId, null);
    }

    // ADMIN USER COLLECTION
    if (state.action === 'WAITING_FOR_ALLOW_ID') { 
        adminConfig.allowedUsers.push(parseInt(text)); 
        state.action = null; 
        return tgBot.sendMessage(chatId, `✅ Allowed.`); 
    }
    if (state.action === 'WAITING_FOR_REVOKE_ID') { 
        adminConfig.allowedUsers = adminConfig.allowedUsers.filter(u => u !== parseInt(text)); 
        state.action = null; 
        return tgBot.sendMessage(chatId, `❌ Revoked.`); 
    }
    if (state.action === 'WAITING_FOR_BAN_ID') { 
        adminConfig.bannedUsers.push(parseInt(text)); 
        state.action = null; 
        return tgBot.sendMessage(chatId, `🚫 Banned.`); 
    }
    if (state.action === 'WAITING_FOR_UNBAN_ID') { 
        adminConfig.bannedUsers = adminConfig.bannedUsers.filter(u => u !== parseInt(text)); 
        state.action = null; 
        return tgBot.sendMessage(chatId, `♻️ Unbanned.`); 
    }

    // CORE FEATURE COLLECTION
    if (state.action === 'WAITING_FOR_LOGIN_NUMBER') { 
        state.action = null; 
        return startWhatsAppClient(userId, chatId, text.replace(/[^0-9]/g, '')); 
    }
    
    if (state.action === 'WAIT_GROUP_NAME') { 
        state.groupConfig.baseName = text.trim(); 
        state.action = 'WAIT_GROUP_COUNT'; 
        return tgBot.sendMessage(chatId, `🔢 *Phase 2:* Quantity?`); 
    } 
    
    if (state.action === 'WAIT_GROUP_COUNT') { 
        state.groupConfig.count = parseInt(text); 
        state.action = 'WAIT_GROUP_MEMBER'; 
        return tgBot.sendMessage(chatId, `👤 *Phase 3:* Member ID?`); 
    } 
    
    if (state.action === 'WAIT_GROUP_MEMBER') { 
        state.groupConfig.memberId = text.replace(/[^0-9]/g, '') + '@c.us'; 
        state.action = 'WAIT_GROUP_DESC'; 
        return tgBot.sendMessage(chatId, `📝 *Phase 4:* Desc?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_desc'}]] } }); 
    } 
    
    if (state.action === 'WAIT_GROUP_DESC') { 
        state.groupConfig.desc = text; 
        state.action = 'WAIT_GROUP_PFP'; 
        return tgBot.sendMessage(chatId, `🖼️ *Phase 5:* DP?`, { reply_markup: { inline_keyboard: [[{text: '⏩ Skip', callback_data: 'grp_skip_pfp'}]] } }); 
    }
    
    if (state.action === 'WAIT_GROUP_PFP') {
        if (msg.photo) {
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            try { 
                const filePath = await tgBot.downloadFile(fileId, __dirname); 
                state.groupConfig.pfpPath = filePath; 
                state.action = null; 
                sendGroupSettingsMenu(chatId, userId, null); 
            } catch (e) { 
                state.action = null; 
                sendGroupSettingsMenu(chatId, userId, null); 
            }
        }
    }

    if (state.action === 'WAIT_KICK_TERM') { 
        const uClient = activeClients[userId].client; 
        return runPurgeEngine(chatId, userId, uClient, text); 
    }
    
    if (state.action === 'WAIT_BROADCAST_MSG') {
        const uClient = activeClients[userId].client; 
        const targets = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g=>g.id) : state.selectedGroupsArray;
        
        state.action = null; 
        tgBot.sendMessage(chatId, `⏳ *Transmitting WhatsApp Broadcast...*`);
        
        for (let t of targets) { 
            try { 
                const chat = await uClient.getChatById(t); 
                await chat.sendMessage(text); 
            } catch(e) {} 
        }
        
        return tgBot.sendMessage(chatId, `✅ Delivered.`);
    }

    if (state.action === 'WAIT_RENAME_DATA') {
        const uClient = activeClients[userId].client; 
        const blocks = text.split(/(?:https?:\/\/)?chat\.whatsapp\.com\/[a-zA-Z0-9]{15,25}/i);
        const codes = [...text.matchAll(/(?:https?:\/\/)?chat\.whatsapp\.com\/([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        
        if (codes.length === 0) {
            return;
        }
        
        state.action = null; 
        let report = `✅ *RENAME REPORT*\n`;
        
        for (let i = 0; i < codes.length; i++) {
            let lines = blocks[i].split('\n').map(l=>l.trim()).filter(l=>l!==''); 
            let targetName = (lines.length > 0 ? lines[lines.length - 1] : `Group`).replace(/^(GROUP\s*NAME|NAME)[\s:-]*/i, '').trim();
            
            try { 
                let gid = await uClient.acceptInvite(codes[i]); 
                const chat = await uClient.getChatById(gid); 
                await chat.setSubject(targetName); 
                report += `🔹 *${targetName}* ✔️\n`; 
            } catch (e) { 
                report += `🔹 *${targetName}* ❌\n`; 
            }
        }
        
        return sendLongReport(chatId, report, 'Rename_Report');
    }

    if (state.action === 'WAIT_JOIN_LINKS') {
        const uClient = activeClients[userId].client; 
        const codes = [...text.matchAll(/(?:chat\.whatsapp\.com\/)([a-zA-Z0-9]{15,25})/gi)].map(m => m[1]);
        
        if (codes.length === 0) {
            return;
        }
        
        state.action = null; 
        let report = `✅ *JOIN REPORT*\n`;
        
        for (let i = 0; i < codes.length; i++) {
            try { 
                await uClient.acceptInvite(codes[i]); 
                report += `🔹 Joined: ${codes[i]} ✔️\n`; 
                await new Promise(r => setTimeout(r, 2000)); 
            } catch (e) { 
                report += `🔹 Failed: ${codes[i]} ❌\n`; 
            }
        }
        
        return sendLongReport(chatId, report, 'Join_Report');
    }
});

// ============================================================================
// ⚙️ 11. THE HEAVYWEIGHT ISOLATED ENGINES (FULLY UNCOMPRESSED)
// ============================================================================

async function startGroupCreationProcess(chatId, userId, uClient) {
    const config = getState(userId).groupConfig; 
    getState(userId).action = null; 
    
    let statusMsg = await tgBot.sendMessage(chatId, `🚀 *DEPLOYMENT ACTIVE*`, { parse_mode: 'Markdown' }); 
    let resultMessage = `✅ *DEPLOYMENT REPORT*\n${DIVIDER}\n\n`;
    
    let pfpMedia = null;
    if (config.pfpPath && fs.existsSync(config.pfpPath)) {
        pfpMedia = MessageMedia.fromFilePath(config.pfpPath);
    }

    for (let i = 1; i <= config.count; i++) {
        const groupName = `${config.baseName} ${i}`;
        
        try {
            await tgBot.editMessageText(`⚙️ *Constructing...*\n${createProgressBar(i, config.count)}`, { chat_id: chatId, message_id: statusMsg.message_id });
            
            const res = await uClient.createGroup(groupName, [config.memberId]); 
            await new Promise(r => setTimeout(r, 2000)); 
            
            const chat = await uClient.getChatById(res.gid._serialized);
            
            if (config.desc) {
                await chat.setDescription(config.desc).catch(()=>{}); 
            }
            if (pfpMedia) {
                await chat.setPicture(pfpMedia).catch(()=>{});
            }
            if (config.settings.msgsAdminOnly) {
                await chat.setMessagesAdminsOnly(true).catch(()=>{}); 
            }
            if (config.settings.infoAdminOnly) {
                await chat.setInfoAdminsOnly(true).catch(()=>{});
            }
            
            const link = await chat.getInviteCode(); 
            resultMessage += `🔹 *${groupName}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; 
            
            await new Promise(r => setTimeout(r, 3000)); 
        } catch (e) { 
            resultMessage += `🔹 *${groupName}*\n❌ Error: _${e.message}_\n\n`; 
        }
    }
    
    if (config.pfpPath && fs.existsSync(config.pfpPath)) {
        fs.unlinkSync(config.pfpPath);
    }
    
    await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, resultMessage + FOOTER, 'Created_Groups');
}

async function runPurgeEngine(chatId, userId, uClient, inputString) {
    const state = getState(userId); 
    const inputList = inputString.replace(/,/g, ' ').split(/\s+/).filter(p => p.trim() !== '');
    
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; 
    state.action = null; 
    
    let statusMsg = await tgBot.sendMessage(chatId, `⏳ *PURGING...*`, { parse_mode: 'Markdown' }); 
    let report = `✅ *PURGE REPORT*\n${DIVIDER}\n`;

    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]); 
            await tgBot.editMessageText(`🔍 *Purging...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id });
            
            let targetsToRemove = [];
            
            for (const participant of chat.participants) {
                if (participant.isAdmin || participant.isSuperAdmin) {
                    continue; 
                }
                
                let shouldKick = false;
                
                for (const item of inputList) { 
                    let searchItem = item.startsWith('+') ? item.substring(1) : item; 
                    
                    if (participant.id.user.startsWith(searchItem) || participant.id.user === searchItem) { 
                        shouldKick = true; 
                        break; 
                    } 
                }
                
                if (shouldKick) {
                    targetsToRemove.push(participant.id._serialized);
                }
            }
            
            if (targetsToRemove.length > 0) { 
                await chat.removeParticipants(targetsToRemove); 
                report += `🔹 *${chat.name}:* Kicked ${targetsToRemove.length}\n`; 
                await new Promise(r => setTimeout(r, 2000)); 
            }
        } catch (e) {
            console.error(e);
        }
    }
    
    await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report + FOOTER, 'Purge_Report');
}

async function extractGroupLinksEngine(chatId, userId, uClient) {
    const state = getState(userId); 
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; 
    
    state.action = null; 
    let statusMsg = await tgBot.sendMessage(chatId, `⏳ *SCRAPING LINKS...*`, { parse_mode: 'Markdown' }); 
    let resultMessage = `🔗 *LINK DATABASE*\n${DIVIDER}\n\n`;

    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]); 
            await tgBot.editMessageText(`🔍 *Extracting...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id });
            
            const link = await chat.getInviteCode(); 
            resultMessage += `🔹 *${chat.name}*\n🔗 \`https://chat.whatsapp.com/${link}\`\n\n`; 
            
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) { 
            resultMessage += `🔹 ID: ${targetGroupIds[i]} ❌\n\n`; 
        }
    }
    
    await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, resultMessage + FOOTER, 'Extracted_Links');
}

async function autoApproveEngine(chatId, userId, uClient, mode) {
    const state = getState(userId); 
    const targetGroupIds = state.selectedGroupsArray === 'ALL' ? state.adminGroups.map(g => g.id) : state.selectedGroupsArray; 
    
    state.action = null; 
    let statusMsg = await tgBot.sendMessage(chatId, `⏳ *APPROVING...*`, { parse_mode: 'Markdown' }); 
    let report = `✅ *APPROVAL REPORT*\n${DIVIDER}\n`;

    for (let i = 0; i < targetGroupIds.length; i++) {
        try {
            const chat = await uClient.getChatById(targetGroupIds[i]); 
            await tgBot.editMessageText(`👥 *Authorizing...*\n${createProgressBar(i+1, targetGroupIds.length)}`, { chat_id: chatId, message_id: statusMsg.message_id });
            
            if (mode === 'OFF_SETTING') { 
                await chat.setGroupMembershipApprovalMode(false); 
                report += `🔹 *${chat.name}:* Gate Opened.\n`; 
            } else if (mode === 'MANUAL') {
                const requests = await chat.getGroupMembershipRequests();
                
                if (requests && requests.length > 0) { 
                    const rIds = requests.map(r => r.id._serialized || r.id.remote || r.author); 
                    await chat.approveGroupMembershipRequests(rIds); 
                    report += `🔹 *${chat.name}:* Approved +${requests.length}\n`; 
                }
            }
            
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
            console.error(e);
        }
    }
    
    await tgBot.deleteMessage(chatId, statusMsg.message_id).catch(()=>{}); 
    return sendLongReport(chatId, report + FOOTER, 'Approval_Report');
}

// ============================================================================
// 🛑 12. GRACEFUL EXIT HANDLER
// ============================================================================
process.on('SIGINT', async () => {
    for (let userId in activeClients) { 
        if (activeClients[userId] && activeClients[userId].client) {
            await activeClients[userId].client.destroy().catch(()=>{}); 
        }
    }
    process.exit(0);
});
