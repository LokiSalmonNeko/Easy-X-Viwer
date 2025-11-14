/**
 * 主頁面邏輯
 * 處理新增紀錄表單、顯示所有紀錄、搜尋、編輯與刪除功能
 */

// DOM 元素
const addRecordForm = document.getElementById('addRecordForm');
const allRecordsContainer = document.getElementById('allRecords');
const messageDiv = document.getElementById('message');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const recordCountSpan = document.getElementById('recordCount');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editIdInput = document.getElementById('editId');
const editTitleInput = document.getElementById('editTitle');
const editTagsInput = document.getElementById('editTags');
const editNoteInput = document.getElementById('editNote');
const editApiTypeInput = document.getElementById('editApiType');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let currentSearchQuery = '';

/**
 * 顯示訊息提示
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型：'success' 或 'error'
 */
function showMessage(message, type = 'success') {
  messageDiv.textContent = message;
  messageDiv.className = `mt-4 p-4 rounded-md ${
    type === 'success' 
      ? 'bg-green-100 text-green-800 border border-green-300' 
      : 'bg-red-100 text-red-800 border border-red-300'
  }`;
  messageDiv.classList.remove('hidden');

  // 3 秒後自動隱藏
  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 3000);
}

/**
 * 新增紀錄
 */
async function addRecord() {
  const formData = new FormData(addRecordForm);
  const url = formData.get('url').trim();
  const tags = formData.get('tags').trim();
  const note = formData.get('note').trim();
  const apiType = formData.get('apiType') || 'embed';

  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        tags,
        note,
        apiType
      })
    });

    const result = await response.json();

    if (result.success) {
      // 成功：清空表單並顯示訊息
      addRecordForm.reset();
      showMessage('紀錄新增成功！', 'success');
      
      // 重新載入所有紀錄
      loadAllRecords(currentSearchQuery);
    } else {
      // 失敗：顯示錯誤訊息
      showMessage(result.error || '新增失敗', 'error');
    }
  } catch (error) {
    console.error('新增紀錄錯誤:', error);
    showMessage('網路錯誤，請稍後再試', 'error');
  }
}

/**
 * 載入所有紀錄（可選搜尋）
 * @param {string} searchQuery - 搜尋關鍵字
 */
async function loadAllRecords(searchQuery = '') {
  try {
    const url = searchQuery 
      ? `/api/records?search=${encodeURIComponent(searchQuery)}`
      : '/api/records';
    
    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      const records = result.data;
      recordCountSpan.textContent = `共 ${records.length} 筆紀錄`;
      
      if (records.length === 0) {
        allRecordsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">尚無紀錄</p>';
        return;
      }

      allRecordsContainer.innerHTML = records.map(record => renderRecord(record)).join('');
      
      // 根據 apiType 載入貼文
      requestAnimationFrame(() => {
        setTimeout(() => {
          records.forEach(record => {
            loadTweetByType(record);
          });
        }, 300);
      });
    } else {
      allRecordsContainer.innerHTML = '<p class="text-red-500 text-center py-8">載入失敗</p>';
    }
  } catch (error) {
    console.error('載入紀錄錯誤:', error);
    allRecordsContainer.innerHTML = '<p class="text-red-500 text-center py-8">網路錯誤</p>';
  }
}

/**
 * 渲染單筆紀錄
 * @param {Object} record - 紀錄物件
 * @returns {string} HTML 字串
 */
function renderRecord(record) {
  const titleHtml = record.title
    ? `<h3 class="text-lg font-semibold text-gray-800 mb-2">${escapeHtml(record.title)}</h3>`
    : '';

  const apiTypeBadge = record.apiType === 'twitterapi' 
    ? '<span class="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">TwitterAPI.io</span>'
    : record.apiType === 'auto'
    ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">自動</span>'
    : '<span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">官方 Embed</span>';

  const tagsHtml = record.tags && record.tags.length > 0
    ? record.tags.map(tag => 
        `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1">${escapeHtml(tag)}</span>`
      ).join('')
    : '<span class="text-gray-400 text-sm">無標籤</span>';

  const noteHtml = record.note
    ? `<p class="text-gray-700 mt-2">${escapeHtml(record.note)}</p>`
    : '';

  const date = new Date(record.createdAt).toLocaleString('zh-TW');

  return `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-record-id="${record.id}">
      <div class="flex justify-between items-start mb-2">
        ${titleHtml}
        ${apiTypeBadge}
      </div>
      <div class="mb-3" id="tweet-${record.id}" data-api-type="${record.apiType || 'embed'}"></div>
      <div class="mt-3">
        <div class="flex flex-wrap gap-2 mb-2">
          ${tagsHtml}
        </div>
        ${noteHtml}
        <div class="flex justify-between items-center mt-3">
          <p class="text-xs text-gray-500">建立時間：${date}</p>
          <div class="flex gap-2">
            <button
              onclick="editRecord('${record.id}')"
              class="bg-yellow-500 text-white text-sm px-3 py-1 rounded hover:bg-yellow-600 transition-colors"
            >
              編輯
            </button>
            <button
              onclick="deleteRecord('${record.id}')"
              class="bg-red-500 text-white text-sm px-3 py-1 rounded hover:bg-red-600 transition-colors"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 從 URL 中提取 Tweet ID
 * @param {string} url - 貼文網址
 * @returns {string|null} Tweet ID 或 null
 */
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * 根據 apiType 載入貼文
 * @param {Object} record - 紀錄物件
 */
function loadTweetByType(record) {
  const apiType = record.apiType || 'embed';
  
  switch (apiType) {
    case 'twitterapi':
      // 直接使用 TwitterAPI.io 載入
      tryTwitterAPILoad(record.url, record.id);
      break;
    case 'auto':
      // 嘗試 embed，失敗時自動切換到 TwitterAPI.io
      createTweetEmbedWithFallback(record.url, record.id);
      break;
    case 'embed':
    default:
      // 使用官方 embed
      createTweetEmbed(record.url, record.id);
      break;
  }
}

/**
 * 建立 Tweet embed，失敗時自動使用 TwitterAPI.io
 * @param {string} url - 貼文網址
 * @param {string} id - 容器 ID
 */
function createTweetEmbedWithFallback(url, id) {
  const container = document.getElementById(`tweet-${id}`);
  if (!container) return;

  const tweetId = extractTweetId(url);
  if (!tweetId) {
    tryTwitterAPILoad(url, id);
    return;
  }

  container.innerHTML = '<p class="text-gray-500 text-sm">載入貼文中...</p>';

  let attempts = 0;
  const maxAttempts = 50;
  
  function waitAndCreate() {
    attempts++;
    
    if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.createTweet === 'function') {
      container.innerHTML = '';
      
      window.twttr.widgets.createTweet(
        tweetId,
        container,
        {
          align: 'center',
          theme: 'light',
          conversation: 'none',
          cards: 'visible'
        }
      ).then(element => {
        if (element) {
          console.log(`✓ Tweet 載入成功 (embed): ${tweetId}`);
        } else {
          // embed 失敗，自動切換到 TwitterAPI.io
          console.warn(`⚠ Embed 失敗，切換到 TwitterAPI.io: ${tweetId}`);
          tryTwitterAPILoad(url, id);
        }
      }).catch(err => {
        console.error(`✗ Embed 載入失敗，切換到 TwitterAPI.io: ${tweetId}`, err);
        tryTwitterAPILoad(url, id);
      });
    } else if (attempts < maxAttempts) {
      setTimeout(waitAndCreate, 200);
    } else {
      // 超時，切換到 TwitterAPI.io
      console.warn(`Embed 載入超時，切換到 TwitterAPI.io`);
      tryTwitterAPILoad(url, id);
    }
  }

  waitAndCreate();
}

/**
 * 建立 Twitter embed
 * @param {string} url - 貼文網址
 * @param {string} id - 容器 ID
 */
function createTweetEmbed(url, id) {
  const container = document.getElementById(`tweet-${id}`);
  if (!container) {
    console.warn(`找不到容器: tweet-${id}`);
    return;
  }

  // 清空容器
  container.innerHTML = '';

  // 提取 Tweet ID
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    console.error(`無法從 URL 提取 Tweet ID: ${url}`);
    container.innerHTML = `<div class="p-4 border border-gray-300 rounded bg-yellow-50">
      <p class="text-sm text-gray-600 mb-2">無效的貼文 URL</p>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">${url}</a>
    </div>`;
    return;
  }

  // 顯示載入中訊息
  container.innerHTML = '<p class="text-gray-500 text-sm">載入貼文中...</p>';

  // 等待 widgets.js 載入
  let attempts = 0;
  const maxAttempts = 50; // 最多等待 10 秒
  
  function waitAndCreate() {
    attempts++;
    
    if (window.twttr && window.twttr.widgets && typeof window.twttr.widgets.createTweet === 'function') {
      // widgets.js 已載入，使用 createTweet 建立 embed
      container.innerHTML = ''; // 清除載入訊息
      
      try {
        console.log(`開始載入 Tweet: ${tweetId}`);
        
        window.twttr.widgets.createTweet(
          tweetId,
          container,
          {
            align: 'center',
            theme: 'light',
            conversation: 'none', // 不顯示回覆
            cards: 'visible'      // 顯示卡片（包含影片）
          }
        ).then(element => {
          if (element) {
            console.log(`✓ Tweet 載入成功: ${tweetId}`);
          } else {
            // createTweet 回傳 undefined = 貼文無法嵌入
            console.warn(`⚠ Tweet 無法嵌入: ${tweetId}（可能被刪除、鎖帳或限制）`);
            container.innerHTML = `<div class="p-4 border border-gray-300 rounded bg-gray-50">
              <p class="text-sm text-gray-600 mb-3">此貼文無法嵌入（可能被刪除、設為私密、年齡限制或受地區限制）</p>
              <div class="flex gap-2">
                <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">在 X 上查看</a>
                <button onclick="tryTwitterAPILoad('${url}', '${id}')" class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                  嘗試備用載入
                </button>
              </div>
            </div>`;
          }
        }).catch(err => {
          console.error(`✗ Tweet 載入失敗: ${tweetId}`, err);
          container.innerHTML = `<div class="p-4 border border-gray-300 rounded bg-red-50">
            <p class="text-sm text-gray-600 mb-2">載入失敗</p>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">在 X 上查看</a>
          </div>`;
        });
      } catch (err) {
        console.error(`渲染 Tweet 時發生錯誤: ${tweetId}`, err);
        container.innerHTML = `<div class="p-4 border border-gray-300 rounded bg-red-50">
          <p class="text-sm text-gray-600 mb-2">渲染錯誤</p>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">在 X 上查看</a>
        </div>`;
      }
    } else if (attempts < maxAttempts) {
      // widgets.js 還沒載入，繼續等待
      setTimeout(waitAndCreate, 200);
    } else {
      // 超時
      console.warn(`Twitter widgets.js 載入超時`);
      container.innerHTML = `<div class="p-4 border border-gray-300 rounded bg-yellow-50">
        <p class="text-sm text-gray-600 mb-2">載入超時</p>
        <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">在 X 上查看</a>
      </div>`;
    }
  }

  // 開始等待並建立
  waitAndCreate();
}

/**
 * 編輯紀錄
 * @param {string} id - 紀錄 ID
 */
async function editRecord(id) {
  try {
    // 先取得所有紀錄以找到要編輯的紀錄
    const response = await fetch('/api/records');
    const result = await response.json();

    if (result.success) {
      const record = result.data.find(r => r.id === id);
      if (record) {
        // 填入表單
        editIdInput.value = record.id;
        editTitleInput.value = record.title || '';
        editTagsInput.value = record.tags ? record.tags.join(', ') : '';
        editNoteInput.value = record.note || '';
        editApiTypeInput.value = record.apiType || 'embed';
        
        // 顯示模態框
        editModal.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('載入紀錄錯誤:', error);
    alert('無法載入紀錄');
  }
}

// 將 editRecord 和 deleteRecord 設為全域函數，以便在 HTML 中使用
window.editRecord = editRecord;

/**
 * 刪除紀錄
 * @param {string} id - 紀錄 ID
 */
async function deleteRecord(id) {
  if (!confirm('確定要刪除這筆紀錄嗎？')) {
    return;
  }

  try {
    const response = await fetch(`/api/records/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (result.success) {
      // 重新載入列表
      loadAllRecords(currentSearchQuery);
    } else {
      alert(result.error || '刪除失敗');
    }
  } catch (error) {
    console.error('刪除紀錄錯誤:', error);
    alert('網路錯誤，請稍後再試');
  }
}

window.deleteRecord = deleteRecord;

/**
 * 儲存編輯
 */
async function saveEdit() {
  const id = editIdInput.value;
  const title = editTitleInput.value.trim();
  const tags = editTagsInput.value.trim();
  const note = editNoteInput.value.trim();
  const apiType = editApiTypeInput.value;

  try {
    const response = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        tags,
        note,
        apiType
      })
    });

    const result = await response.json();

    if (result.success) {
      // 關閉模態框
      editModal.classList.add('hidden');
      
      // 重新載入列表
      loadAllRecords(currentSearchQuery);
    } else {
      alert(result.error || '儲存失敗');
    }
  } catch (error) {
    console.error('儲存編輯錯誤:', error);
    alert('網路錯誤，請稍後再試');
  }
}

/**
 * 搜尋功能
 */
function performSearch() {
  const query = searchInput.value.trim();
  currentSearchQuery = query;
  loadAllRecords(query);
}

/**
 * 清除搜尋
 */
function clearSearch() {
  searchInput.value = '';
  currentSearchQuery = '';
  loadAllRecords();
}

/**
 * 使用 TwitterAPI.io 嘗試載入貼文（備用方案）
 * @param {string} url - 貼文網址
 * @param {string} containerId - 容器 ID
 */
async function tryTwitterAPILoad(url, containerId) {
  const container = document.getElementById(`tweet-${containerId}`);
  if (!container) return;

  container.innerHTML = '<p class="text-gray-500 text-sm p-4">正在使用 TwitterAPI.io 載入...</p>';

  try {
    const response = await fetch('/api/twitterapi/tweet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    const result = await response.json();

    if (result.success && result.data) {
      const tweet = result.data;
      // 顯示 TwitterAPI.io 載入的貼文內容
      container.innerHTML = `<div class="border border-purple-200 rounded-lg p-4 bg-purple-50">
        <div class="flex items-start gap-3 mb-3">
          ${tweet.user && tweet.user.profile_image_url ? 
            `<img src="${escapeHtml(tweet.user.profile_image_url)}" alt="avatar" class="w-12 h-12 rounded-full" />` : 
            '<div class="w-12 h-12 rounded-full bg-gray-300"></div>'
          }
          <div class="flex-1">
            <div class="font-bold">${escapeHtml(tweet.user?.name || '未知使用者')}</div>
            <div class="text-gray-600 text-sm">@${escapeHtml(tweet.user?.username || 'unknown')}</div>
          </div>
        </div>
        <div class="text-gray-800 mb-3 whitespace-pre-wrap">${escapeHtml(tweet.rawContent || tweet.text || '')}</div>
        ${tweet.media && tweet.media.videos && tweet.media.videos.length > 0 ? 
          `<div class="mb-3">
            <video controls class="w-full rounded-lg max-h-96">
              <source src="${escapeHtml(tweet.media.videos[0].url)}" type="video/mp4">
              您的瀏覽器不支援影片播放
            </video>
          </div>` : ''
        }
        ${tweet.media && tweet.media.photos && tweet.media.photos.length > 0 ? 
          tweet.media.photos.map(photo => 
            `<img src="${escapeHtml(photo.url)}" alt="media" class="w-full rounded-lg mb-2" />`
          ).join('') : ''
        }
        <div class="text-xs text-gray-500 border-t border-purple-200 pt-2 mt-2">
          <span class="bg-purple-100 px-2 py-1 rounded">TwitterAPI.io</span>
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="ml-2 text-blue-600 hover:underline">在 X 上查看</a>
        </div>
      </div>`;
    } else {
      throw new Error(result.error || '載入失敗');
    }
  } catch (error) {
    console.error('TwitterAPI.io 載入失敗:', error);
    container.innerHTML = `<div class="p-4 border border-red-300 rounded bg-red-50">
      <p class="text-sm text-red-600 mb-2">載入失敗：${escapeHtml(error.message || '未知錯誤')}</p>
      <p class="text-xs text-gray-600 mb-3">請確認已在設定頁面設定 TwitterAPI.io API 金鑰。</p>
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline break-all">在 X 上查看</a>
    </div>`;
  }
}

// 將函數設為全域
window.tryTwitterAPILoad = tryTwitterAPILoad;

/**
 * HTML 轉義函數
 * @param {string} text - 要轉義的文字
 * @returns {string} 轉義後的文字
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 事件監聽器
addRecordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addRecord();
});

searchBtn.addEventListener('click', performSearch);
clearBtn.addEventListener('click', clearSearch);

searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveEdit();
});

cancelEditBtn.addEventListener('click', () => {
  editModal.classList.add('hidden');
});

// 點擊模態框背景關閉
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    editModal.classList.add('hidden');
  }
});

// 頁面載入時載入所有紀錄
document.addEventListener('DOMContentLoaded', () => {
  console.log('頁面載入完成，開始初始化...');
  
  // 檢查 widgets.js 是否已載入
  function checkWidgets() {
    if (window.twttr) {
      console.log('Twitter widgets.js 已載入');
      if (window.twttr.ready) {
        window.twttr.ready(() => {
          console.log('Twitter widgets.js 已準備就緒');
        });
      }
    } else {
      console.log('等待 Twitter widgets.js 載入...');
      setTimeout(checkWidgets, 500);
    }
  }
  
  // 開始檢查
  checkWidgets();
  
  // 直接載入紀錄，createTweetEmbed 會處理 widgets.js 的載入
  loadAllRecords();
});
