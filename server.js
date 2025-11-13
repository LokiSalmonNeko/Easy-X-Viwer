/**
 * Express 後端伺服器
 * 提供 RESTful API 與靜態檔案服務
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { readRecords, writeRecords, generateId, initializeRecordsFile } = require('./src/recordStore');
const { isValidXUrl } = require('./src/validators');

const app = express();
const PORT = process.env.PORT || 3000;

// 啟用 CORS（允許跨域請求）
app.use(cors());

// 解析 JSON 請求體
app.use(express.json());

// 提供靜態檔案服務
app.use(express.static(path.join(__dirname, 'public')));

// 啟動時初始化 records.json
initializeRecordsFile().catch(err => {
  console.error('初始化失敗:', err);
  process.exit(1);
});

/**
 * POST /api/records - 新增紀錄
 */
app.post('/api/records', async (req, res) => {
  try {
    const { url, tags, note } = req.body;

    // 驗證必填欄位
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL 為必填欄位'
      });
    }

    // 驗證 URL 格式
    if (!isValidXUrl(url)) {
      return res.status(400).json({
        success: false,
        error: '無效的 X (Twitter) 貼文網址'
      });
    }

    // 讀取現有紀錄
    const records = await readRecords();

    // 處理標籤（將逗號分隔的字串轉為陣列）
    let tagsArray = [];
    if (tags && typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    } else if (Array.isArray(tags)) {
      tagsArray = tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
    }

    // 建立新紀錄
    const newRecord = {
      id: generateId(),
      url: url.trim(),
      tags: tagsArray,
      note: note ? String(note).trim() : '',
      createdAt: new Date().toISOString()
    };

    // 加入陣列
    records.push(newRecord);

    // 寫回檔案
    await writeRecords(records);

    res.json({
      success: true,
      data: newRecord
    });
  } catch (error) {
    console.error('新增紀錄失敗:', error);
    res.status(500).json({
      success: false,
      error: '伺服器錯誤：無法新增紀錄'
    });
  }
});

/**
 * GET /api/records - 取得所有紀錄
 * 支援查詢參數：?tag=xxx
 */
app.get('/api/records', async (req, res) => {
  try {
    let records = await readRecords();

    // 如果有 tag 查詢參數，進行篩選
    const tagFilter = req.query.tag;
    if (tagFilter) {
      const filterTag = String(tagFilter).toLowerCase().trim();
      records = records.filter(record => 
        record.tags && 
        record.tags.some(tag => tag.toLowerCase() === filterTag)
      );
    }

    // 依建立時間排序（最新的在前）
    records.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('取得紀錄失敗:', error);
    res.status(500).json({
      success: false,
      error: '伺服器錯誤：無法取得紀錄'
    });
  }
});

/**
 * PUT /api/records/:id - 修改紀錄
 */
app.put('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, note } = req.body;

    // 讀取現有紀錄
    const records = await readRecords();

    // 尋找要修改的紀錄
    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '找不到指定的紀錄'
      });
    }

    // 更新紀錄
    const record = records[recordIndex];

    // 處理標籤更新
    if (tags !== undefined) {
      if (typeof tags === 'string') {
        record.tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      } else if (Array.isArray(tags)) {
        record.tags = tags.map(tag => String(tag).trim()).filter(tag => tag.length > 0);
      } else {
        record.tags = [];
      }
    }

    // 處理備註更新
    if (note !== undefined) {
      record.note = String(note).trim();
    }

    // 寫回檔案
    await writeRecords(records);

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('修改紀錄失敗:', error);
    res.status(500).json({
      success: false,
      error: '伺服器錯誤：無法修改紀錄'
    });
  }
});

/**
 * DELETE /api/records/:id - 刪除紀錄
 */
app.delete('/api/records/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 讀取現有紀錄
    const records = await readRecords();

    // 尋找要刪除的紀錄
    const recordIndex = records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '找不到指定的紀錄'
      });
    }

    // 刪除紀錄
    records.splice(recordIndex, 1);

    // 寫回檔案
    await writeRecords(records);

    res.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    console.error('刪除紀錄失敗:', error);
    res.status(500).json({
      success: false,
      error: '伺服器錯誤：無法刪除紀錄'
    });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行於 http://localhost:${PORT}`);
});

