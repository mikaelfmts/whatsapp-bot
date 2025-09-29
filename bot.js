const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode-terminal');

const app = express();
app.use(express.json());

console.log('🚀 Iniciando Bot WhatsApp Fluxo Nutri...');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
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

// Gerar QR Code para conectar WhatsApp
client.on('qr', (qr) => {
    console.log('📱 QR Code gerado!');
    console.log('='.repeat(50));
    QRCode.generate(qr, { small: true });
    console.log('='.repeat(50));
    console.log('👆 Escaneie com seu WhatsApp Business');
    qrCodeData = qr;
});

// Quando conectar com sucesso
client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    isWhatsAppReady = true;
    qrCodeData = null;
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
    // Tentar reconectar após 10 segundos
    setTimeout(() => {
        console.log('🔄 Tentando reconectar...');
        client.initialize();
    }, 10000);
});

// Endpoint de status com QR Code
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Fluxo Nutri Online! 🚀',
        whatsapp: isWhatsAppReady ? 'Conectado ✅' : 'Aguardando QR Code 📱',
        qrcode: qrCodeData ? 'Disponível - Veja os logs' : 'Não disponível',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Endpoint para obter QR Code (para debug)
app.get('/qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else if (isWhatsAppReady) {
        res.json({ message: 'WhatsApp já está conectado!' });
    } else {
        res.json({ message: 'QR Code ainda não foi gerado. Aguarde...' });
    }
});

// API para enviar mensagens de pedidos
app.post('/send-order', async (req, res) => {
    try {
        if (!isWhatsAppReady) {
            return res.json({ 
                success: false, 
                error: 'WhatsApp não está conectado. Verifique o QR Code nos logs.',
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
            if (!clientPhone.startsWith('55')) {
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
