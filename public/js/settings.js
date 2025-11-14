/**
 * 設定頁面邏輯
 */

const apiKeyForm = document.getElementById('apiKeyForm');
const messageDiv = document.getElementById('message');
const statusDiv = document.getElementById('status');
const checkBtn = document.getElementById('checkBtn');

/**
 * 顯示訊息
 */
function showMessage(message, type = 'success') {
  messageDiv.textContent = message;
  messageDiv.className = `mt-4 p-4 rounded-md ${
    type === 'success' 
      ? 'bg-green-100 text-green-800 border border-green-300' 
      : 'bg-red-100 text-red-800 border border-red-300'
  }`;
  messageDiv.classList.remove('hidden');

  setTimeout(() => {
    messageDiv.classList.add('hidden');
  }, 5000);
}

/**
 * 檢查 API 金鑰狀態
 */
async function checkStatus() {
  try {
    const response = await fetch('/api/config');
    const result = await response.json();

    if (result.success) {
      if (result.data.hasApiKey) {
        statusDiv.innerHTML = `
          <div class="bg-green-50 border-l-4 border-green-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-green-800">✓ API 金鑰已設定</p>
                <p class="text-xs text-green-700 mt-1">您可以在主頁面使用 TwitterAPI.io 來載入貼文</p>
              </div>
            </div>
          </div>
        `;
      } else {
        statusDiv.innerHTML = `
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-yellow-800">⚠️ 尚未設定 API 金鑰</p>
                <p class="text-xs text-yellow-700 mt-1">請輸入並儲存您的 TwitterAPI.io API 金鑰</p>
              </div>
            </div>
          </div>
        `;
      }
      statusDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('檢查狀態失敗:', error);
    showMessage('無法檢查狀態', 'error');
  }
}

/**
 * 儲存 API 金鑰
 */
async function saveApiKey(e) {
  e.preventDefault();

  const formData = new FormData(apiKeyForm);
  const apiKey = formData.get('apiKey').trim();

  if (!apiKey) {
    showMessage('請輸入 API 金鑰', 'error');
    return;
  }

  try {
    const response = await fetch('/api/config/twitterapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apiKey
      })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('API 金鑰已成功儲存！', 'success');
      apiKeyForm.reset();
      setTimeout(() => {
        checkStatus();
      }, 500);
    } else {
      showMessage(result.error || '儲存失敗', 'error');
    }
  } catch (error) {
    console.error('儲存 API 金鑰錯誤:', error);
    showMessage('網路錯誤，請稍後再試', 'error');
  }
}

// 事件監聽
apiKeyForm.addEventListener('submit', saveApiKey);
checkBtn.addEventListener('click', checkStatus);

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
  checkStatus();
});
