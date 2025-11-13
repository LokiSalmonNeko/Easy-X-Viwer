/**
 * twscrape 輔助模組
 * 用於在官方 embed 失敗時，使用 twscrape 抓取貼文
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

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
 * 檢查 twscrape 是否已安裝
 * @returns {Promise<boolean>}
 */
async function checkTwscrapeInstalled() {
  try {
    // twscrape 不支援 --version，使用 accounts 命令檢測
    // 如果執行成功（即使沒有帳號），表示已安裝
    const { stderr } = await execAsync('twscrape accounts', {
      timeout: 5000
    });
    
    // 檢查是否有 "command not found" 錯誤
    if (stderr && stderr.includes('not found')) {
      return false;
    }
    
    return true;
  } catch (error) {
    // 如果錯誤訊息包含 "not found"，表示未安裝
    if (error.message && error.message.includes('not found')) {
      return false;
    }
    // 其他錯誤（例如沒有帳號）也算作已安裝
    return true;
  }
}

/**
 * 使用 twscrape 獲取貼文詳情
 * @param {string} tweetId - 貼文 ID
 * @returns {Promise<Object>} 貼文資料
 */
async function getTweetDetails(tweetId) {
  try {
    const { stdout, stderr } = await execAsync(`twscrape tweet_details ${tweetId}`, {
      timeout: 30000, // 30 秒超時
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stderr.includes('WARNING')) {
      console.error('twscrape stderr:', stderr);
    }

    if (!stdout || stdout.trim() === '') {
      throw new Error('twscrape 沒有返回資料');
    }

    // twscrape 回傳 JSON 格式的貼文資料
    const tweet = JSON.parse(stdout.trim());
    return tweet;
  } catch (error) {
    console.error('twscrape 執行錯誤:', error.message);
    throw new Error(`無法使用 twscrape 獲取貼文: ${error.message}`);
  }
}

/**
 * 新增 Twitter 帳號到 twscrape
 * @param {string} username - Twitter 使用者名稱
 * @param {string} password - 密碼
 * @param {string} email - 電子郵件
 * @param {string} emailPassword - 電子郵件密碼（選填）
 * @returns {Promise<boolean>}
 */
async function addAccount(username, password, email, emailPassword = '') {
  try {
    // twscrape 要求必須包含 4 個欄位：username:password:email:email_password
    // 如果沒有提供 email_password，使用空字串或佔位符
    const accountLine = `${username}:${password}:${email}:${emailPassword || ''}`;
    
    // 使用 echo 和管道傳遞帳號資訊
    const format = 'username:password:email:email_password';
    const command = `echo "${accountLine}" | twscrape add_accounts /dev/stdin ${format}`;
    
    console.log('執行命令:', command.replace(password, '***').replace(emailPassword || '', '***'));
    
    const { stdout, stderr } = await execAsync(command, {
      timeout: 10000
    });

    console.log('twscrape add_accounts output:', stdout);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('twscrape add_accounts error:', stderr);
      // 檢查是否有實際錯誤
      if (stderr.includes('error') || stderr.includes('Error')) {
        throw new Error(stderr);
      }
    }

    return true;
  } catch (error) {
    console.error('新增帳號失敗:', error.message);
    throw new Error(`無法新增帳號: ${error.message}`);
  }
}

/**
 * 刪除 twscrape 帳號
 * @param {string} username - Twitter 使用者名稱
 * @returns {Promise<boolean>}
 */
async function deleteAccount(username) {
  try {
    const { stdout, stderr } = await execAsync(`twscrape del_accounts ${username}`, {
      timeout: 10000
    });

    console.log('twscrape del_accounts output:', stdout);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('twscrape del_accounts error:', stderr);
    }

    return true;
  } catch (error) {
    console.error('刪除帳號失敗:', error.message);
    throw new Error(`無法刪除帳號: ${error.message}`);
  }
}

/**
 * 登入 twscrape 帳號
 * @returns {Promise<Object>} 登入結果，包含成功和失敗的帳號資訊
 */
async function loginAccounts() {
  try {
    const { stdout, stderr } = await execAsync('twscrape login_accounts', {
      timeout: 120000 // 2 分鐘超時
    });

    console.log('twscrape login output:', stdout);
    
    if (stderr && !stderr.includes('WARNING')) {
      console.error('twscrape login error:', stderr);
    }

    // 解析登入結果
    const result = {
      success: true,
      output: stdout,
      message: '登入流程已執行'
    };

    return result;
  } catch (error) {
    console.error('登入帳號失敗:', error.message);
    throw new Error(`無法登入帳號: ${error.message}`);
  }
}

/**
 * 獲取 twscrape 帳號列表
 * @returns {Promise<Array>}
 */
async function listAccounts() {
  try {
    const { stdout } = await execAsync('twscrape accounts', {
      timeout: 10000
    });

    // 解析輸出格式
    const lines = stdout.trim().split('\n');
    if (lines.length <= 1) {
      return []; // 只有標題列或空白
    }

    const accounts = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 2) {
        accounts.push({
          username: parts[0],
          logged_in: parts[1] === 'True',
          active: parts[2] === 'True',
          last_used: parts[3] !== 'None' ? parts[3] : null,
          total_req: parseInt(parts[4]) || 0
        });
      }
    }

    return accounts;
  } catch (error) {
    console.error('獲取帳號列表失敗:', error.message);
    return [];
  }
}

module.exports = {
  extractTweetId,
  checkTwscrapeInstalled,
  getTweetDetails,
  addAccount,
  deleteAccount,
  loginAccounts,
  listAccounts
};
