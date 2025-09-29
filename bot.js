const express = require('express');
const app = express();

// Middleware para parsing JSON
app.use(express.json());

// Endpoint de teste básico
app.get('/', (req, res) => {
    res.json({ 
        status: 'Bot Fluxo Nutri funcionando!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Endpoint para receber pedidos
app.post('/send-message', (req, res) => {
    console.log('Pedido recebido:', req.body);
    res.json({ 
        success: true, 
        message: 'Endpoint funcionando! WhatsApp será configurado em breve.' 
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Fluxo Nutri rodando na porta ${PORT}`);
});
