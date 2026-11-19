const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' })
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✨ KYZER SUPER Bot Connected Successfully! ✨');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // Messages handling
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message || m.key.fromMe) return;

        const messageType = Object.keys(m.message)[0];
        let textMessage = '';

        if (messageType === 'conversation') {
            textMessage = m.message.conversation;
        } else if (messageType === 'extendedTextMessage') {
            textMessage = m.message.extendedTextMessage.text;
        }

        const senderID = m.key.remoteJid;
        const msgLower = textMessage.toLowerCase().trim();

        // Menu Display Command
        if (msgLower === 'hi' || msgLower === 'menu' || msgLower === '.menu') {
            const menuText = `
💜 **KYZER SUPER** 💜

👤 **OWNER** : IT'Z ME KYZER
📅 **DATE** : 15/11/2026
⏰ **TIME** : 8:27:42 PM

👑 **MENU LIST** 👑

01 - Menu Eka
02 - Song Download 🎧
03 - Video Download 🎬
04 - FB / Insta / TikTok Download 📥
05 - AI Chat 🤖
06 - Image Gen 🎨
07 - Short Notes 📖
08 - Past Papers 📝

📌 **NOTE** : Ona command eke number eka + name eka gahanna!
📌 **Ex:** 07 science notes
`;
            await sock.sendMessage(senderID, { text: menuText });
        } 
        
        // 07 - Short Notes Command
        else if (msgLower.startsWith('07 ') || msgLower.includes('notes')) {
            const subject = textMessage.replace('07', '').replace('notes', '').trim();
            await sock.sendMessage(senderID, { 
                text: `📖 මෙන්න ඔබ ඉල්ලූ "${subject || 'Educational'}" සඳහා අදාළ Short Notes සටහන:\n\n* සටහන 01: මූලික කරුණු මෙහි ඇත.\n* PDF ලින්ක් එක: [PDF Download Link]\n\n(ඔබට මෙහි සැබෑ PDF ෆයිල් හෝ ලින්ක් එක සම්බන්ධ කළ හැක.)` 
            });
        }

        // 08 - Past Papers Command
        else if (msgLower.startsWith('08 ') || msgLower.includes('pastpaper')) {
            const examName = textMessage.replace('08', '').replace('pastpapers', '').trim();
            await sock.sendMessage(senderID, { 
                text: `📝 මෙන්න "${examName || 'Exam'}" Past Papers සහ Marking Schemes:\n\n🔗 ලින්ක් එක: [Past Paper Download Link]` 
            });
        }

        // Other options (Song / Video etc.)
        else if (msgLower.startsWith('02 ')) {
            const songName = textMessage.slice(3);
            await sock.sendMessage(senderID, { text: `🎧 Downloading song: "${songName}"...` });
        }
        else if (msgLower.startsWith('03 ')) {
            const videoName = textMessage.slice(3);
            await sock.sendMessage(senderID, { text: `🎬 Downloading video: "${videoName}"...` });
        }
    });
}

connectToWhatsApp();
