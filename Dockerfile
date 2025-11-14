# 使用 Debian 基礎映像（node:18-slim），因為 Alpine 不支援 Playwright
FROM node:18-slim

# 安裝 Python 和基本工具（用於 twscrape 和 Playwright）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

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
# 注意：Debian 12+ 需要 --break-system-packages（PEP 668），在 Docker 容器中是安全的
RUN pip3 install --upgrade pip && \
    pip3 install --break-system-packages twscrape playwright && \
    echo "✓ twscrape 安裝成功" && \
    echo "✓ Playwright 安裝成功" && \
    (twscrape 2>&1 | head -1 || echo "已安裝 twscrape")

# 安裝 Playwright 瀏覽器（Chromium）
RUN playwright install chromium && \
    playwright install-deps chromium && \
    echo "✓ Chromium 瀏覽器安裝成功"

EXPOSE 3000

CMD ["npm", "start"]

