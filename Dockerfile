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

# 安裝 twscrape
RUN pip3 install --break-system-packages twscrape || pip3 install twscrape || echo "twscrape 安裝失敗（選用功能）"

# 驗證 twscrape 安裝
RUN twscrape --version || echo "twscrape 未正確安裝"

EXPOSE 3000

CMD ["npm", "start"]

