const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode-terminal');
const qrcode = require('qrcode'); // Adicionar esta linha

const app = express();
app.use(express.json());

console.log('🚀 Iniciando Bot WhatsApp Fluxo Nutri...');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection'
        ],
        headless: true
    }
});

let isWhatsAppReady = false;
let qrCodeData = null;
let qrCodeImage = null;

// Gerar QR Code para conectar WhatsApp
client.on('qr', async (qr) => {
    console.log('📱 QR Code gerado!');
    console.log('🌐 Acesse: https://whatsapp-bot-production-aa9f.up.railway.app/qr');
    console.log('='.repeat(50));
    
    // QR Code no terminal (menor)
    QRCode.generate(qr, { small: true });
    
    console.log('='.repeat(50));
    console.log('👆 Ou acesse o link acima para ver o QR Code completo');
    
    qrCodeData = qr;
    
    // Gerar imagem do QR Code
    try {
        qrCodeImage = await qrcode.toDataURL(qr, { width: 300, margin: 2 });
        console.log('✅ QR Code disponível em: /qr');
    } catch (err) {
        console.error('❌ Erro ao gerar imagem do QR Code:', err);
    }
});

// Quando conectar com sucesso
client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    isWhatsAppReady = true;
    qrCodeData = null;
    qrCodeImage = null;
});

// Autenticação bem-sucedida
client.on('authenticated', () => {
    console.log('🔐 WhatsApp autenticado!');
});

// Falha na autenticação
client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

// Tratar desconexões
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    isWhatsAppReady = false;
    qrCodeData = null;
    qrCodeImage = null;
    
    // Tentar reconectar após 10 segundos
    setTimeout(() => {
        console.log('🔄 Tentando reconectar...');
        client.initialize();
    }, 10000);
});

// Endpoint de status
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Fluxo Nutri Online! 🚀',
        whatsapp: isWhatsAppReady ? 'Conectado ✅' : 'Aguardando QR Code 📱',
        qrcode: qrCodeData ? 'Disponível em /qr' : 'Não disponível',
        timestamp: new Date().toISOString(),
        version: '2.1.0'
    });
});

// Página HTML com QR Code
app.get('/qr', (req, res) => {
    if (qrCodeImage) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>QR Code - Fluxo Nutri WhatsApp</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #0a0f1c;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 0 20px rgba(0, 102, 255, 0.3);
        }
        .qr-code {
            background: white;
            padding: 20px;
            border-radius: 10px;
            display: inline-block;
            margin: 20px 0;
        }
        .refresh-btn {
            background: #0066ff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
        }
        .refresh-btn:hover {
            background: #0052cc;
        }
        .instructions {
            margin-top: 20px;
            font-size: 14px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Fluxo Nutri WhatsApp Bot</h1>
        <h2>📱 Escaneie o QR Code</h2>
        <div class="qr-code">
            <img src="${qrCodeImage}" alt="QR Code WhatsApp" />
        </div>
        <p><strong>1.</strong> Abra o WhatsApp Business</p>
        <p><strong>2.</strong> Toque em "Mais opções" → "Dispositivos conectados"</p>
        <p><strong>3.</strong> Toque em "Conectar um dispositivo"</p>
        <p><strong>4.</strong> Escaneie este QR Code</p>
        
        <button class="refresh-btn" onclick="window.location.reload()">🔄 Atualizar QR Code</button>
        
        <div class="instructions">
            <p>⏰ QR Code expira em 20 segundos</p>
            <p>🔄 Se expirar, clique em "Atualizar QR Code"</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh a cada 20 segundos
        setTimeout(() => {
            window.location.reload();
        }, 20000);
    </script>
</body>
</html>
        `);
    } else if (isWhatsAppReady) {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>WhatsApp Conectado - Fluxo Nutri</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #0a0f1c;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ WhatsApp Conectado!</h1>
        <p>🚀 Bot Fluxo Nutri está funcionando perfeitamente!</p>
        <p>📱 WhatsApp Business conectado com sucesso.</p>
    </div>
</body>
</html>
        `);
    } else {
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Gerando QR Code - Fluxo Nutri</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #0a0f1c;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⏳ Gerando QR Code...</h1>
        <p>Aguarde alguns segundos e recarregue a página.</p>
        <button onclick="window.location.reload()">🔄 Recarregar</button>
    </div>
    <script>
        setTimeout(() => window.location.reload(), 5000);
    </script>
</body>
</html>
        `);
    }
});

// API para enviar mensagens de pedidos
app.post('/send-order', async (req, res) => {
    try {
        if (!isWhatsAppReady) {
            return res.json({ 
                success: false, 
                error: 'WhatsApp não está conectado. Acesse /qr para conectar.',
                qrAvailable: !!qrCodeData
            });
        }

        const { phone, message, customerPhone, customerMessage } = req.body;
        let results = {};

        // Enviar para você (dono da loja)
        if (phone && message) {
            let ownerPhone = phone.replace(/\D/g, '');
            if (!ownerPhone.startsWith('55')) {
                ownerPhone = '55' + ownerPhone;
            }
            await client.sendMessage(ownerPhone + '@c.us', message);
            console.log('📤 Mensagem enviada para o dono:', ownerPhone);
            results.owner = 'Enviada com sucesso';
        }

        // Enviar para o cliente (opcional)
        if (customerPhone && customerMessage) {
            let clientPhone = customerPhone.replace(/\D/g, '');
            if (!clientPhone.startsWith('55') && clientPhone.length === 11) {
                clientPhone = '55' + clientPhone;
            }
            await client.sendMessage(clientPhone + '@c.us', customerMessage);
            console.log('📤 Mensagem enviada para o cliente:', clientPhone);
            results.customer = 'Enviada com sucesso';
        }

        res.json({ 
            success: true, 
            message: 'Mensagens enviadas!',
            results: results
        });

    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Inicializar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log('🌐 QR Code disponível em: https://whatsapp-bot-production-aa9f.up.railway.app/qr');
    console.log('📱 Inicializando cliente WhatsApp...');
    
    // Inicializar WhatsApp com delay
    setTimeout(() => {
        client.initialize();
    }, 2000);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Encerrando aplicação...');
    await client.destroy();
    process.exit(0);
});
