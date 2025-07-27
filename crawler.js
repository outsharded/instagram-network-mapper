const ig = require('./ig');
const db = require('./db');
const { exportToGEXF } = require('./export-gexf');

const WAIT_TIME_MS = 30 * 1000;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function crawlNetwork(startUsername, maxDepth = 2) {
  const igClient = await ig.loginFromSession();

  const queue = [{ username: startUsername, depth: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const { username, depth } = queue.shift();

    if (visited.has(username) || (db.isProcessed(username) && !db.isUserPrivate(username))) {
      console.log(`Already processed ${username}, skipping.`);
      continue;
    }

    console.log(`🔍 Processing ${username} at depth ${depth}...`);

    try {
      const userId = await ig.getUserId(username);
      const mutuals = await ig.getMutualFriends(userId);

      if (!db.hasUser(username)) {
        const userInfo = await ig.ig.user.searchExact(username);
        db.insertUser({
          username: userInfo.username,
          full_name: userInfo.full_name,
          is_private: userInfo.is_private,
          is_verified: userInfo.is_verified
        });
      }

      for (const mutual of mutuals) {
        if (!db.hasUser(mutual.username)) {
          db.insertUser({
            username: mutual.username,
            full_name: mutual.full_name,
            is_private: mutual.is_private,
            is_verified: mutual.is_verified
          });
        }
        db.insertConnection(username, mutual.username);
        db.insertConnection(mutual.username, username);

        // Add to queue only if depth < maxDepth
        if (depth < maxDepth && !visited.has(mutual.username) && !db.isProcessed(mutual.username)) {
          queue.push({ username: mutual.username, depth: depth + 1 });
        }
      }

      db.markProcessed(username);
      visited.add(username);

      console.log(`✅ Processed ${username} - ${mutuals.length} mutuals (processed ${visited.size})`);

      console.log(`⏳ Waiting ${WAIT_TIME_MS / 1000}s before next user...`);
      await wait(WAIT_TIME_MS);

    } catch (e) {
      console.warn(`⚠️ Failed to process ${username}:`, e.message);
    }
  }

  console.log('✅ Finished building the network.');
  exportToGEXF();
}

  
  

module.exports = { crawlNetwork };
