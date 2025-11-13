/**
 * Express 後端伺服器
 * 提供 RESTful API 與靜態檔案服務
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
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
 * 從 X oEmbed API 獲取貼文標題
 * @param {string} url - X 貼文網址
 * @returns {Promise<string>} 貼文標題
 */
async function fetchTweetTitle(url) {
  return new Promise((resolve, reject) => {
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://publish.twitter.com/oembed?url=${encodedUrl}`;
    
    https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let title = '';
          
          // 嘗試從 HTML 中提取文字內容作為標題
          if (json.html) {
            // 移除 HTML 標籤，只保留文字
            const textContent = json.html.replace(/<[^>]*>/g, '').trim();
            // 移除多餘的空白字元
            const cleanText = textContent.replace(/\s+/g, ' ').trim();
            // 取前 150 個字元作為標題
            if (cleanText.length > 0) {
              title = cleanText.substring(0, 150);
              // 如果被截斷，加上省略號
              if (cleanText.length > 150) {
                title += '...';
              }
            }
          }
          
          // 如果無法從 HTML 提取，使用 author_name 或預設標題
          if (!title) {
            if (json.author_name) {
              title = `${json.author_name} 的貼文`;
            } else {
              title = `X 貼文`;
            }
          }
          
          resolve(title);
        } catch (error) {
          console.error('解析 oEmbed 回應失敗:', error);
          resolve(`X 貼文`);
        }
      });
    }).on('error', (error) => {
      console.error('獲取貼文標題失敗:', error);
      // 如果獲取失敗，使用預設標題
      resolve(`X 貼文`);
    });
  });
}

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

    // 從 X oEmbed API 獲取貼文標題
    let title = '';
    try {
      title = await fetchTweetTitle(url.trim());
    } catch (error) {
      console.error('獲取標題失敗，使用預設標題:', error);
      title = `X 貼文`;
    }

    // 建立新紀錄
    const newRecord = {
      id: generateId(),
      url: url.trim(),
      title: title,
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
 * 支援查詢參數：?tag=xxx&search=xxx (搜尋標題或標籤)
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

    // 如果有 search 查詢參數，進行搜尋（標題或標籤）
    const searchQuery = req.query.search;
    if (searchQuery) {
      const searchTerm = String(searchQuery).toLowerCase().trim();
      records = records.filter(record => {
        // 搜尋標題
        const titleMatch = record.title && record.title.toLowerCase().includes(searchTerm);
        // 搜尋標籤
        const tagMatch = record.tags && record.tags.some(tag => 
          tag.toLowerCase().includes(searchTerm)
        );
        return titleMatch || tagMatch;
      });
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

    // 處理標題更新
    if (req.body.title !== undefined) {
      record.title = String(req.body.title).trim();
    }

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

