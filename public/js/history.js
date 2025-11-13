/**
 * 歷史紀錄頁面邏輯
 * 處理完整列表顯示、搜尋篩選、編輯與刪除功能
 */

// DOM 元素
const recordsListContainer = document.getElementById('recordsList');
const tagFilterInput = document.getElementById('tagFilter');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const recordCountSpan = document.getElementById('recordCount');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editIdInput = document.getElementById('editId');
const editTagsInput = document.getElementById('editTags');
const editNoteInput = document.getElementById('editNote');
const cancelEditBtn = document.getElementById('cancelEditBtn');

let currentTagFilter = '';

/**
 * 載入所有紀錄（可選標籤篩選）
 * @param {string} tagFilter - 標籤篩選條件
 */
async function loadAllRecords(tagFilter = '') {
  try {
    const url = tagFilter 
      ? `/api/records?tag=${encodeURIComponent(tagFilter)}`
      : '/api/records';
    
    const response = await fetch(url);
    const result = await response.json();

    if (result.success) {
      const records = result.data;
      recordCountSpan.textContent = `共 ${records.length} 筆紀錄`;
      
      if (records.length === 0) {
        recordsListContainer.innerHTML = '<p class="text-gray-500 text-center py-8">尚無紀錄</p>';
        return;
      }

      recordsListContainer.innerHTML = records.map(record => renderRecord(record)).join('');
      
      // 動態建立 Twitter embed
      records.forEach(record => {
        createTweetEmbed(record.url, record.id);
      });
    } else {
      recordsListContainer.innerHTML = '<p class="text-red-500 text-center py-8">載入失敗</p>';
    }
  } catch (error) {
    console.error('載入紀錄錯誤:', error);
    recordsListContainer.innerHTML = '<p class="text-red-500 text-center py-8">網路錯誤</p>';
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
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" data-record-id="${record.id}">
      <div class="mb-3" id="tweet-${record.id}"></div>
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
        editTagsInput.value = record.tags ? record.tags.join(', ') : '';
        editNoteInput.value = record.note || '';
        
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
      loadAllRecords(currentTagFilter);
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
  const tags = editTagsInput.value.trim();
  const note = editNoteInput.value.trim();

  try {
    const response = await fetch(`/api/records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tags,
        note
      })
    });

    const result = await response.json();

    if (result.success) {
      // 關閉模態框
      editModal.classList.add('hidden');
      
      // 重新載入列表
      loadAllRecords(currentTagFilter);
    } else {
      alert(result.error || '儲存失敗');
    }
  } catch (error) {
    console.error('儲存編輯錯誤:', error);
    alert('網路錯誤，請稍後再試');
  }
}

/**
 * 依標籤篩選
 */
function filterByTag() {
  const tag = tagFilterInput.value.trim();
  currentTagFilter = tag;
  loadAllRecords(tag);
}

/**
 * 清除篩選
 */
function clearFilter() {
  tagFilterInput.value = '';
  currentTagFilter = '';
  loadAllRecords();
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

// 事件監聽器
searchBtn.addEventListener('click', filterByTag);
clearBtn.addEventListener('click', clearFilter);

tagFilterInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    filterByTag();
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
  loadAllRecords();
  
  // 確保 Twitter widgets 已載入
  if (window.twttr && window.twttr.ready) {
    window.twttr.ready(() => {
      window.twttr.widgets.load();
    });
  }
});

