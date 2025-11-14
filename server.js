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
const { getTwitterApiKey, updateTwitterApiKey } = require('./src/configStore');

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
 * 標準化貼文 URL（將 x.com 轉換為 twitter.com）
 * @param {string} url - X 貼文網址
 * @returns {string} 標準化後的 URL
 */
function normalizeTweetUrl(url) {
  return url.replace(/^https?:\/\/x\.com\//, 'https://twitter.com/');
}

/**
 * 從 X oEmbed API 獲取貼文標題
 * @param {string} url - X 貼文網址
 * @returns {Promise<string>} 貼文標題
 */
async function fetchTweetTitle(url) {
  return new Promise((resolve, reject) => {
    // 標準化 URL（oEmbed 對 twitter.com 支援更穩定）
    const normalizedUrl = normalizeTweetUrl(url);
    const encodedUrl = encodeURIComponent(normalizedUrl);
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
    const { url, tags, note, apiType } = req.body;

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
      apiType: apiType || 'embed', // embed, twitterapi, auto
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

    // 處理 apiType 更新
    if (req.body.apiType !== undefined) {
      record.apiType = req.body.apiType || 'embed';
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

/**
 * 從 URL 提取 Tweet ID
 * @param {string} url - 貼文網址
 * @returns {string|null} Tweet ID
 */
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * 轉換 TwitterAPI.io 回應格式為統一格式
 * @param {Object} apiData - TwitterAPI.io API 回應
 * @returns {Object} 轉換後的貼文資料
 */
function transformTwitterAPIData(apiData) {
  const tweet = apiData.data || apiData;
  
  return {
    id: tweet.id || tweet.id_str,
    text: tweet.text || tweet.full_text || '',
    rawContent: tweet.text || tweet.full_text || '',
    user: {
      id: tweet.user?.id || tweet.user?.id_str,
      name: tweet.user?.name || '',
      username: tweet.user?.screen_name || tweet.user?.username || '',
      profile_image_url: tweet.user?.profile_image_url_https || tweet.user?.profile_image_url || ''
    },
    media: {
      videos: tweet.extended_entities?.media
        ?.filter(m => m.type === 'video' && m.video_info?.variants)
        .map(m => ({
          url: m.video_info.variants
            .filter(v => v.content_type === 'video/mp4')
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0]?.url || '',
          thumbnail: m.media_url_https || m.media_url || ''
        })) || [],
      photos: tweet.extended_entities?.media
        ?.filter(m => m.type === 'photo')
        .map(m => ({
          url: m.media_url_https || m.media_url || ''
        })) || []
    },
    created_at: tweet.created_at,
    url: `https://twitter.com/${tweet.user?.screen_name || tweet.user?.username}/status/${tweet.id || tweet.id_str}`
  };
}

/**
 * POST /api/twitterapi/tweet - 使用 TwitterAPI.io 獲取貼文
 */
app.post('/api/twitterapi/tweet', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL 為必填欄位'
      });
    }

    // 獲取 API 金鑰
    const apiKey = await getTwitterApiKey();
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: '未設定 TwitterAPI.io 金鑰。請至設定頁面設定 API 金鑰。'
      });
    }

    // 提取 Tweet ID
    const tweetId = extractTweetId(url);
    if (!tweetId) {
      return res.status(400).json({
        success: false,
        error: '無效的貼文 URL'
      });
    }

    // 調用 TwitterAPI.io
    const fetch = (() => {
      try {
        return require('node-fetch');
      } catch {
        // Node.js 18+ 內建 fetch
        return globalThis.fetch;
      }
    })();
    const apiUrl = `https://api.twitterapi.io/api/v1/get_tweet_by_id?id=${tweetId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API 請求失敗: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    
    // 轉換格式
    const tweet = transformTwitterAPIData(apiData);

    res.json({
      success: true,
      data: tweet
    });
  } catch (error) {
    console.error('TwitterAPI.io 獲取貼文失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message || '無法獲取貼文資料'
    });
  }
});

/**
 * GET /api/config - 獲取配置（僅返回是否已設定 API 金鑰）
 */
app.get('/api/config', async (req, res) => {
  try {
    const apiKey = await getTwitterApiKey();
    res.json({
      success: true,
      data: {
        hasApiKey: !!apiKey
      }
    });
  } catch (error) {
    console.error('獲取配置失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message || '無法獲取配置'
    });
  }
});

/**
 * POST /api/config/twitterapi - 設定 TwitterAPI.io 金鑰
 */
app.post('/api/config/twitterapi', async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'API 金鑰為必填欄位'
      });
    }

    await updateTwitterApiKey(apiKey.trim());

    res.json({
      success: true,
      message: 'API 金鑰已更新'
    });
  } catch (error) {
    console.error('更新 API 金鑰失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message || '無法更新 API 金鑰'
    });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`伺服器運行於 http://localhost:${PORT}`);
});

