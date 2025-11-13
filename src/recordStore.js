/**
 * JSON 檔案讀寫模組
 * 負責 records.json 的讀取、寫入與 ID 生成
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RECORDS_FILE = path.join(__dirname, '..', 'records.json');

/**
 * 讀取所有紀錄
 * @returns {Promise<Array>} 紀錄陣列
 */
async function readRecords() {
  try {
    // 檢查檔案是否存在
    if (!fs.existsSync(RECORDS_FILE)) {
      // 檔案不存在，回傳空陣列
      return [];
    }

    const data = fs.readFileSync(RECORDS_FILE, 'utf8');
    
    // 如果檔案為空，回傳空陣列
    if (!data.trim()) {
      return [];
    }

    const records = JSON.parse(data);
    
    // 確保回傳的是陣列
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error('讀取 records.json 失敗:', error);
    throw new Error('無法讀取資料檔案');
  }
}

/**
 * 寫入所有紀錄
 * @param {Array} records - 要寫入的紀錄陣列
 * @returns {Promise<void>}
 */
async function writeRecords(records) {
  try {
    // 確保資料是陣列
    if (!Array.isArray(records)) {
      throw new Error('資料格式錯誤：必須是陣列');
    }

    // 將資料轉換為格式化的 JSON
    const data = JSON.stringify(records, null, 2);
    
    // 寫入檔案（使用同步寫入確保原子性）
    fs.writeFileSync(RECORDS_FILE, data, 'utf8');
  } catch (error) {
    console.error('寫入 records.json 失敗:', error);
    throw new Error('無法寫入資料檔案');
  }
}

/**
 * 生成唯一 ID
 * @returns {string} UUID 格式的唯一識別碼
 */
function generateId() {
  return crypto.randomUUID();
}

/**
 * 初始化 records.json（如果不存在則建立空陣列）
 * @returns {Promise<void>}
 */
async function initializeRecordsFile() {
  try {
    if (!fs.existsSync(RECORDS_FILE)) {
      await writeRecords([]);
      console.log('已建立 records.json');
    }
  } catch (error) {
    console.error('初始化 records.json 失敗:', error);
    throw error;
  }
}

module.exports = {
  readRecords,
  writeRecords,
  generateId,
  initializeRecordsFile
};

