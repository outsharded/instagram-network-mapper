function isSoftBanError(error) {
    const msg = error.message || '';
    return (
      msg.includes('Please wait a few minutes') ||
      msg.includes('Too many requests') ||
      error.response?.statusCode === 401 ||
      error.response?.statusCode === 403
    );
  }
  
  let softBanCount = 0;

  async function handleSoftBan(error) {
    if (isSoftBanError(error)) {
      softBanCount++;
      const waitMs = Math.min(softBanCount * 5 * 60 * 1000, 30 * 60 * 1000); // max 30 min
      console.warn(`⚠️ Soft ban #${softBanCount}. Pausing for ${waitMs / 1000 / 60} minutes...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return true;
    }
    return false;
  }
  
  
  module.exports = { isSoftBanError, handleSoftBan };
  