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
 * 檢查 Playwright 是否已安裝（用於瀏覽器模式）
 * @returns {Promise<boolean>}
 */
async function checkPlaywrightInstalled() {
  try {
    // 檢查 playwright 命令是否可用
    await execAsync('python3 -c "import playwright"', {
      timeout: 5000
    });
    
    // 檢查瀏覽器是否已安裝
    try {
      await execAsync('playwright --version', {
        timeout: 5000
      });
      return true;
    } catch {
      // playwright 已安裝但瀏覽器可能未下載
      return false;
    }
  } catch (error) {
    return false;
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
 * 登入 twscrape 帳號（使用瀏覽器模式以繞過 Cloudflare）
 * @returns {Promise<Object>} 登入結果，包含成功和失敗的帳號資訊
 */
async function loginAccounts() {
  try {
    // 設置環境變數以啟用瀏覽器模式
    // twscrape 會自動檢測 Playwright，如果已安裝則使用瀏覽器模式
    const env = {
      ...process.env,
      // 確保使用系統安裝的瀏覽器（如果 Playwright 已安裝）
      PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH || '0',
    };

    // 使用較長的超時時間，因為瀏覽器模式需要更長時間
    const { stdout, stderr } = await execAsync('twscrape login_accounts', {
      timeout: 180000, // 3 分鐘超時（瀏覽器模式需要更長時間）
      env: env,
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    console.log('twscrape login output:', stdout);
    
    // 檢查是否有 Cloudflare 錯誤
    const hasCloudflareError = stderr && (
      stderr.includes('403') || 
      stderr.includes('Cloudflare') || 
      stderr.includes('Attention Required') ||
      stderr.includes('<!DOCTYPE html>')
    );

    if (stderr && !stderr.includes('WARNING')) {
      console.error('twscrape login error:', stderr);
      
      // 如果遇到 Cloudflare 錯誤
      if (hasCloudflareError) {
        const playwrightInstalled = await checkPlaywrightInstalled();
        
        if (!playwrightInstalled) {
          throw new Error(
            'Cloudflare 阻擋登入。請安裝 Playwright 以使用瀏覽器模式：\n' +
            '1. 執行: pip install playwright\n' +
            '2. 執行: playwright install chromium\n' +
            '3. 重新嘗試登入\n\n' +
            '如果問題持續，請嘗試：\n' +
            '- 使用代理伺服器\n' +
            '- 更換網路環境/IP\n' +
            '- 等待一段時間後再試'
          );
        } else {
          throw new Error(
            'Cloudflare 阻擋登入。即使已安裝 Playwright，仍遇到 Cloudflare 驗證。\n' +
            '建議：\n' +
            '1. 確認 Playwright 瀏覽器已正確安裝: playwright install chromium\n' +
            '2. 使用代理伺服器（在環境變數中設置 HTTP_PROXY/HTTPS_PROXY）\n' +
            '3. 更換網路環境或 IP 地址\n' +
            '4. 等待 10-30 分鐘後再試（可能是暫時限制）'
          );
        }
      }
    }

    // 解析登入結果
    let successCount = 0;
    let failedCount = 0;
    let totalCount = 0;

    // 從 stdout 中提取登入統計（格式: {'total': 1, 'success': 0, 'failed': 1}）
    try {
      const resultMatch = stdout.match(/\{'total':\s*(\d+),\s*'success':\s*(\d+),\s*'failed':\s*(\d+)\}/);
      if (resultMatch) {
        totalCount = parseInt(resultMatch[1]) || 0;
        successCount = parseInt(resultMatch[2]) || 0;
        failedCount = parseInt(resultMatch[3]) || 0;
      }
    } catch (e) {
      // 如果解析失敗，嘗試其他格式
      console.warn('無法解析登入結果統計:', e.message);
    }

    // 如果從 stderr 也能看到失敗訊息，即使解析失敗也標記為有失敗
    if (hasCloudflareError || (stderr && stderr.includes('Failed to login'))) {
      failedCount = Math.max(failedCount, 1);
    }

    const result = {
      success: failedCount === 0,
      output: stdout,
      message: failedCount === 0 
        ? `✓ 所有帳號登入成功 (${successCount}/${totalCount || successCount})` 
        : `⚠ ${successCount} 個成功，${failedCount} 個失敗`,
      successCount,
      failedCount,
      totalCount: totalCount || (successCount + failedCount)
    };

    return result;
  } catch (error) {
    console.error('登入帳號失敗:', error.message);
    
    // 如果是 Cloudflare 相關錯誤，錯誤訊息已經很詳細了
    if (error.message && error.message.includes('Cloudflare')) {
      throw error;
    }
    
    // 檢查錯誤訊息中是否包含 Cloudflare 相關內容
    if (error.message && (
      error.message.includes('403') || 
      error.message.includes('Cloudflare') ||
      error.message.includes('Attention Required')
    )) {
      const playwrightInstalled = await checkPlaywrightInstalled();
      
      if (!playwrightInstalled) {
        throw new Error(
          'Cloudflare 阻擋登入。請安裝 Playwright 以使用瀏覽器模式：\n' +
          '1. pip install playwright\n' +
          '2. playwright install chromium\n' +
          '3. 重新嘗試登入'
        );
      } else {
        throw new Error(
          'Cloudflare 阻擋登入。即使已安裝 Playwright，仍遇到問題。\n' +
          '請嘗試：1) 使用代理伺服器 2) 更換網路 3) 等待後重試'
        );
      }
    }
    
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
  checkPlaywrightInstalled,
  getTweetDetails,
  addAccount,
  deleteAccount,
  loginAccounts,
  listAccounts
};
