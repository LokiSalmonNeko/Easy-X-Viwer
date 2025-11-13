/**
 * URL 驗證工具
 * 驗證是否為有效的 X (Twitter) 貼文網址
 */

/**
 * 驗證 URL 是否為有效的 X/Twitter 貼文網址
 * @param {string} url - 要驗證的 URL
 * @returns {boolean} - 是否為有效網址
 */
function isValidXUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // 支援 x.com 和 twitter.com 格式
  // 格式：https://x.com/username/status/1234567890
  // 或：https://twitter.com/username/status/1234567890
  const xUrlPattern = /^https?:\/\/(x\.com|twitter\.com)\/\w+\/status\/\d+/i;
  
  return xUrlPattern.test(url.trim());
}

module.exports = {
  isValidXUrl
};

