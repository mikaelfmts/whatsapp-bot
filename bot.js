const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const QRCode = require('qrcode-terminal');
const qrcode = require('qrcode');

const app = express();
app.use(express.json());

let sock = null;
let qrCodeData = null;
let isConnected = false;

console.log('🚀 Iniciando Bot Baileys - Fluxo Nutri...');

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('📱 QR Code gerado - Baileys!');
            QRCode.generate(qr, { small: true });
            qrCodeData = qr;
            isConnected = false;
        }
        
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexão fechada, reconectando...', shouldReconnect);
            isConnected = false;
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp conectado via Baileys!');
            isConnected = true;
            qrCodeData = null;
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// Endpoint de status
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Fluxo Nutri Online! 🚀 (Baileys)',
        whatsapp: isConnected ? 'Conectado ✅' : 'Aguardando QR Code 📱',
        qrcode: qrCodeData ? 'Disponível em /qr' : 'Não disponível',
        timestamp: new Date().toISOString(),
        version: '3.0.0 (Baileys)'
    });
});

// Página QR Code
app.get('/qr', async (req, res) => {
    if (qrCodeData) {
        try {
            const qrImage = await qrcode.toDataURL(qrCodeData, { width: 300, margin: 2 });
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>QR Code Baileys - Fluxo Nutri</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial; background: #0a0f1c; color: white; text-align: center; padding: 20px; }
        .container { background: #1a1a2e; padding: 30px; border-radius: 15px; display: inline-block; }
        .qr-code { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Fluxo Nutri WhatsApp Bot (Baileys)</h1>
        <h2>📱 Escaneie o QR Code</h2>
        <div class="qr-code">
            <img src="${qrImage}" alt="QR Code WhatsApp Baileys" />
        </div>
        <p><strong>1.</strong> Abra o WhatsApp</p>
        <p><strong>2.</strong> Toque em "Mais opções" → "Dispositivos conectados"</p>
        <p><strong>3.</strong> Toque em "Conectar um dispositivo"</p>
        <p><strong>4.</strong> Escaneie este QR Code</p>
        
        <button onclick="window.location.reload()">🔄 Atualizar QR Code</button>
        
        <p>⚡ Baileys - Mais estável que whatsapp-web.js</p>
    </div>
    
    <script>
        setTimeout(() => window.location.reload(), 20000);
    </script>
</body>
</html>
            `);
        } catch (err) {
            res.json({ error: 'Erro ao gerar QR Code', message: err.message });
        }
    } else if (isConnected) {
        res.send(`
<!DOCTYPE html>
<html>
<head><title>WhatsApp Conectado</title></head>
<body style="font-family: Arial; background: #0a0f1c; color: white; text-align: center; padding: 50px;">
    <h1>✅ WhatsApp Conectado!</h1>
    <p>🚀 Bot Baileys funcionando perfeitamente!</p>
</body>
</html>
        `);
    } else {
        res.send(`
<!DOCTYPE html>
<html>
<head><title>Gerando QR Code</title></head>
<body style="font-family: Arial; background: #0a0f1c; color: white; text-align: center; padding: 50px;">
    <h1>⏳ Gerando QR Code...</h1>
    <button onclick="window.location.reload()">🔄 Recarregar</button>
    <script>setTimeout(() => window.location.reload(), 5000);</script>
</body>
</html>
        `);
    }
});

// API para enviar mensagens
app.post('/send-order', async (req, res) => {
    try {
        if (!isConnected || !sock) {
            return res.json({ 
                success: false, 
                error: 'WhatsApp não conectado. Acesse /qr para conectar.' 
            });
        }

        const { phone, message, customerPhone, customerMessage } = req.body;
        let results = {};

        // Enviar para dono
        if (phone && message) {
            try {
                const formattedPhone = formatPhone(phone);
                await sock.sendMessage(formattedPhone, { text: message });
                console.log('📤 Mensagem enviada para o dono:', formattedPhone);
                results.owner = 'Enviada com sucesso';
            } catch (err) {
                console.error('❌ Erro ao enviar para dono:', err);
                results.owner = 'Erro: ' + err.message;
            }
        }

        // Enviar para cliente
        if (customerPhone && customerMessage) {
            try {
                const formattedCustomer = formatPhone(customerPhone);
                await sock.sendMessage(formattedCustomer, { text: customerMessage });
                console.log('📤 Mensagem enviada para o cliente:', formattedCustomer);
                results.customer = 'Enviada com sucesso';
            } catch (err) {
                console.error('❌ Erro ao enviar para cliente:', err);
                results.customer = 'Erro: ' + err.message;
            }
        }

        res.json({ 
            success: true, 
            message: 'Baileys - Mensagens processadas!',
            results: results
        });

    } catch (error) {
        console.error('❌ Erro geral:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

function formatPhone(phone) {
    let clean = phone.replace(/\D/g, '');
    
    // Se começa com 85 e tem 11 dígitos, adiciona 55
    if (clean.length === 11 && clean.startsWith('85')) {
        clean = '55' + clean;
    }
    
    // Se não termina com @c.us, adiciona
    if (!clean.includes('@')) {
        clean = clean + '@c.us';
    }
    
    return clean;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🌐 Servidor Baileys rodando na porta ${PORT}`);
    startBot();
});
