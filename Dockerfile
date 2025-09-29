# Usar imagem Node.js com bibliotecas necessárias
FROM node:18-bullseye

# Instalar dependências do sistema para Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Definir diretório de trabalho
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependências (usar install em vez de ci)
RUN npm install --production

# Copiar código da aplicação
COPY . .

# Definir variável para usar Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Expor porta
EXPOSE 8080

# Comando para iniciar
CMD ["npm", "start"]
