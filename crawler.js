const ig = require('./ig');
const db = require('./db');
const { exportToGEXF } = require('./export-gexf');
const { handleSoftBan } = require('./rate-limiter');


const WAIT_TIME_MS = 45 * 1000;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


async function crawlNetwork(startUsername, maxDepth = 2) {
  const igClient = await ig.loginFromSession();

  const queue = [{ username: startUsername, depth: 0 }];
  const visited = new Set();

  while (queue.length > 0) {
    const { username, depth } = queue.shift();

    if (visited.has(username) || db.isProcessed(username)) {
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
          is_private: userInfo.is_private
        });
      }

      for (const mutual of mutuals) {
        if (!db.hasUser(mutual.username)) {
          db.insertUser({
            username: mutual.username,
            full_name: mutual.full_name,
            is_private: mutual.is_private
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

      console.log(`✅ Processed ${username} - ${mutuals.length} mutuals (processed ${visited.size}/${queue.length + visited.size})`);

      console.log(`⏳ Waiting ${WAIT_TIME_MS / 1000}s before next user...`);
      await wait(WAIT_TIME_MS);

    } catch (e) {
      const paused = await handleSoftBan(e);
      if (paused) {
        console.log(`🔁 Re-adding ${username} to the queue after soft ban.`);
        queue.push({ username, depth });
        continue;
      } 
      else throw e; // rethrow if it wasn't a soft ban
    }
  }

  console.log('✅ Finished building the network.');
  exportToGEXF();
}

  
  

module.exports = { crawlNetwork };
