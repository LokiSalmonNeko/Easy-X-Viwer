/**
 * twscrape 設定頁面邏輯
 */

const addAccountForm = document.getElementById('addAccountForm');
const messageDiv = document.getElementById('message');
const accountsListDiv = document.getElementById('accountsList');
const loginBtn = document.getElementById('loginBtn');
const refreshBtn = document.getElementById('refreshBtn');
const loginStatusDiv = document.getElementById('loginStatus');

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
 * 檢查安裝狀態（在帳號列表顯示）
 */
async function checkInstallStatus() {
  try {
    const response = await fetch('/api/twscrape/accounts');
    const result = await response.json();

    if (!result.installed) {
      // 在帳號列表區域顯示簡潔訊息
      accountsListDiv.innerHTML = `<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p class="text-gray-600 text-sm">twscrape 服務未啟用</p>
        <p class="text-gray-500 text-xs mt-2">備用載入功能無法使用</p>
      </div>`;
    }
  } catch (error) {
    console.error('檢查安裝狀態失敗:', error);
  }
}

/**
 * 新增帳號
 */
async function addAccount(e) {
  e.preventDefault();

  const formData = new FormData(addAccountForm);
  const username = formData.get('username').trim();
  const password = formData.get('password').trim();
  const email = formData.get('email').trim();
  const emailPassword = formData.get('emailPassword').trim();

  try {
    const response = await fetch('/api/twscrape/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        email,
        emailPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      showMessage('帳號新增成功！請執行登入操作', 'success');
      addAccountForm.reset();
      loadAccounts();
    } else {
      showMessage(result.error || '新增失敗', 'error');
    }
  } catch (error) {
    console.error('新增帳號錯誤:', error);
    showMessage('網路錯誤，請稍後再試', 'error');
  }
}

/**
 * 登入帳號
 */
async function loginAccounts() {
  loginBtn.disabled = true;
  loginBtn.textContent = '登入中...';
  loginStatusDiv.innerHTML = '<p class="text-blue-600 text-sm">正在執行登入，請稍候...</p>';

  try {
    const response = await fetch('/api/twscrape/login', {
      method: 'POST'
    });

    const result = await response.json();

    if (result.success) {
      loginStatusDiv.innerHTML = '<p class="text-green-600 text-sm">✓ 登入成功</p>';
      loadAccounts();
    } else {
      loginStatusDiv.innerHTML = `<p class="text-red-600 text-sm">✗ 登入失敗：${result.error}</p>`;
    }
  } catch (error) {
    console.error('登入錯誤:', error);
    loginStatusDiv.innerHTML = '<p class="text-red-600 text-sm">✗ 網路錯誤</p>';
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = '執行登入';
  }
}

/**
 * 載入帳號列表
 */
async function loadAccounts() {
  try {
    const response = await fetch('/api/twscrape/accounts');
    const result = await response.json();

    if (!result.installed) {
      accountsListDiv.innerHTML = '<p class="text-red-600 text-center py-8">twscrape 未安裝</p>';
      return;
    }

    if (result.success && result.data && result.data.length > 0) {
      accountsListDiv.innerHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">使用者名稱</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">已登入</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">啟用</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最後使用</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">請求數</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${result.data.map(acc => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${acc.username}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${acc.logged_in ? 
                    '<span class="text-green-600">✓</span>' : 
                    '<span class="text-red-600">✗</span>'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">${acc.active ? 
                    '<span class="text-green-600">✓</span>' : 
                    '<span class="text-gray-400">-</span>'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${acc.last_used || '-'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${acc.total_req || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      accountsListDiv.innerHTML = '<p class="text-gray-500 text-center py-8">尚未新增任何帳號</p>';
    }
  } catch (error) {
    console.error('載入帳號列表錯誤:', error);
    accountsListDiv.innerHTML = '<p class="text-red-600 text-center py-8">載入失敗</p>';
  }
}

// 事件監聽
addAccountForm.addEventListener('submit', addAccount);
loginBtn.addEventListener('click', loginAccounts);
refreshBtn.addEventListener('click', loadAccounts);

// 頁面載入時執行
document.addEventListener('DOMContentLoaded', () => {
  loadAccounts();
  checkInstallStatus();
});

