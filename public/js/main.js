/**
 * 首頁邏輯
 * 處理新增紀錄表單與顯示最近新增的紀錄
 */

// DOM 元素
const addRecordForm = document.getElementById('addRecordForm');
const recentRecordsContainer = document.getElementById('recentRecords');
const messageDiv = document.getElementById('message');

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

  try {
    const response = await fetch('/api/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        tags,
        note
      })
    });

    const result = await response.json();

    if (result.success) {
      // 成功：清空表單並顯示訊息
      addRecordForm.reset();
      showMessage('紀錄新增成功！', 'success');
      
      // 重新載入最近紀錄
      loadRecentRecords();
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
 * 載入最近新增的紀錄（顯示最新 10 筆）
 */
async function loadRecentRecords() {
  try {
    const response = await fetch('/api/records');
    const result = await response.json();

    if (result.success) {
      const records = result.data.slice(0, 10); // 只顯示最新 10 筆
      
      if (records.length === 0) {
        recentRecordsContainer.innerHTML = '<p class="text-gray-500 text-center py-8">尚無紀錄</p>';
        return;
      }

      recentRecordsContainer.innerHTML = records.map(record => renderRecord(record)).join('');
      
      // 動態建立 Twitter embed
      records.forEach(record => {
        createTweetEmbed(record.url, record.id);
      });
    } else {
      recentRecordsContainer.innerHTML = '<p class="text-red-500 text-center py-8">載入失敗</p>';
    }
  } catch (error) {
    console.error('載入紀錄錯誤:', error);
    recentRecordsContainer.innerHTML = '<p class="text-red-500 text-center py-8">網路錯誤</p>';
  }
}

/**
 * 渲染單筆紀錄
 * @param {Object} record - 紀錄物件
 * @returns {string} HTML 字串
 */
function renderRecord(record) {
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
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="mb-3" id="tweet-${record.id}"></div>
      <div class="mt-3">
        <div class="flex flex-wrap gap-2 mb-2">
          ${tagsHtml}
        </div>
        ${noteHtml}
        <p class="text-xs text-gray-500 mt-2">建立時間：${date}</p>
      </div>
    </div>
  `;
}

/**
 * 建立 Twitter embed
 * @param {string} url - 貼文網址
 * @param {string} id - 容器 ID
 */
function createTweetEmbed(url, id) {
  const container = document.getElementById(`tweet-${id}`);
  if (!container) return;

  const blockquote = document.createElement('blockquote');
  blockquote.className = 'twitter-tweet';
  const link = document.createElement('a');
  link.href = url;
  blockquote.appendChild(link);
  container.appendChild(blockquote);

  // 載入 Twitter widget
  if (window.twttr && window.twttr.widgets) {
    window.twttr.widgets.load(container);
  }
}

/**
 * HTML 轉義函數
 * @param {string} text - 要轉義的文字
 * @returns {string} 轉義後的文字
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 表單提交事件
addRecordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addRecord();
});

// 頁面載入時載入最近紀錄
document.addEventListener('DOMContentLoaded', () => {
  loadRecentRecords();
  
  // 確保 Twitter widgets 已載入
  if (window.twttr && window.twttr.ready) {
    window.twttr.ready(() => {
      window.twttr.widgets.load();
    });
  }
});

