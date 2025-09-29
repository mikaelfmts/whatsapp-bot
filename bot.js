const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode-terminal');

const app = express();
app.use(express.json());

console.log('🚀 Iniciando Bot WhatsApp Fluxo Nutri...');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let isWhatsAppReady = false;

// Gerar QR Code para conectar WhatsApp
client.on('qr', (qr) => {
    console.log('📱 QR Code gerado! Copie este código:');
    console.log('');
    QRCode.generate(qr, { small: true });
    console.log('');
    console.log('👆 Escaneie com seu WhatsApp Business');
});

// Quando conectar com sucesso
client.on('ready', () => {
    console.log('✅ WhatsApp conectado com sucesso!');
    isWhatsAppReady = true;
});

// Tratar desconexões
client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp desconectado:', reason);
    isWhatsAppReady = false;
});

// Endpoint de status
app.get('/', (req, res) => {
    res.json({
        status: 'Bot Fluxo Nutri Online!',
        whatsapp: isWhatsAppReady ? 'Conectado ✅' : 'Aguardando QR Code 📱',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// API para enviar mensagens de pedidos
app.post('/send-order', async (req, res) => {
    try {
        if (!isWhatsAppReady) {
            return res.json({ 
                success: false, 
                error: 'WhatsApp não está conectado. Verifique o QR Code nos logs.' 
            });
        }

        const { phone, message, customerPhone, customerMessage } = req.body;

        // Enviar para você (dono da loja)
        if (phone && message) {
            let ownerPhone = phone.replace(/\D/g, '');
            if (!ownerPhone.startsWith('55')) {
                ownerPhone = '55' + ownerPhone;
            }
            await client.sendMessage(ownerPhone + '@c.us', message);
            console.log('📤 Mensagem enviada para o dono:', ownerPhone);
        }

        // Enviar para o cliente (opcional)
        if (customerPhone && customerMessage) {
            let clientPhone = customerPhone.replace(/\D/g, '');
            if (!clientPhone.startsWith('55')) {
                clientPhone = '55' + clientPhone;
            }
            await client.sendMessage(clientPhone + '@c.us', customerMessage);
            console.log('📤 Mensagem enviada para o cliente:', clientPhone);
        }

        res.json({ 
            success: true, 
            message: 'Mensagens enviadas com sucesso!' 
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
});

// Inicializar WhatsApp
client.initialize();
