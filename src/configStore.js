/**
 * 配置存儲模組
 * 負責保存和讀取 TwitterAPI.io API 金鑰
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

/**
 * 讀取配置
 * @returns {Promise<Object>} 配置物件
 */
async function readConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        twitterApiKey: ''
      };
    }

    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    
    if (!data.trim()) {
      return {
        twitterApiKey: ''
      };
    }

    const config = JSON.parse(data);
    return {
      twitterApiKey: config.twitterApiKey || ''
    };
  } catch (error) {
    console.error('讀取 config.json 失敗:', error);
    return {
      twitterApiKey: ''
    };
  }
}

/**
 * 寫入配置
 * @param {Object} config - 配置物件
 * @returns {Promise<void>}
 */
async function writeConfig(config) {
  try {
    const data = JSON.stringify(config, null, 2);
    fs.writeFileSync(CONFIG_FILE, data, 'utf8');
  } catch (error) {
    console.error('寫入 config.json 失敗:', error);
    throw new Error('無法寫入配置檔案');
  }
}

/**
 * 更新 TwitterAPI.io 金鑰
 * @param {string} apiKey - API 金鑰
 * @returns {Promise<void>}
 */
async function updateTwitterApiKey(apiKey) {
  const config = await readConfig();
  config.twitterApiKey = apiKey || '';
  await writeConfig(config);
}

/**
 * 獲取 TwitterAPI.io 金鑰
 * @returns {Promise<string>} API 金鑰
 */
async function getTwitterApiKey() {
  const config = await readConfig();
  return config.twitterApiKey || '';
}

module.exports = {
  readConfig,
  writeConfig,
  updateTwitterApiKey,
  getTwitterApiKey
};

