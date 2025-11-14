# 使用 Node.js 基礎映像
FROM node:18-slim

WORKDIR /app

# 複製 package.json
COPY package*.json ./

# 安裝 Node.js 依賴
RUN npm install

# 複製專案檔案
COPY . .

# 建置 Tailwind CSS
RUN npm run build:css

EXPOSE 3000

CMD ["npm", "start"]
