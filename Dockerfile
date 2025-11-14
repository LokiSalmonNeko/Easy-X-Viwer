FROM node:18-alpine

# 安裝 Python 和 pip（用於 twscrape）
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# 複製 package.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm install

# 複製專案檔案
COPY . .

# 建置 Tailwind CSS
RUN npm run build:css

# 安裝 twscrape 和 Playwright（用於瀏覽器模式以繞過 Cloudflare）
RUN pip3 install --break-system-packages twscrape playwright && \
    echo "✓ twscrape 安裝成功" && \
    echo "✓ Playwright 安裝成功" && \
    (twscrape 2>&1 | head -1 || echo "已安裝 twscrape")

# 安裝 Playwright 瀏覽器（Chromium）
RUN playwright install chromium && \
    echo "✓ Chromium 瀏覽器安裝成功"

EXPOSE 3000

CMD ["npm", "start"]

