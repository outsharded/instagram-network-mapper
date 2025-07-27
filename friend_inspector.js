const { IgApiClient } = require('instagram-private-api');
const fs = require('fs-extra');
const readline = require('readline');

const SESSION_PATH = './session.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const prompt = q => new Promise(res => rl.question(q, res));

async function main() {
  const ig = new IgApiClient();

  // Load session
  if (!(await fs.pathExists(SESSION_PATH))) {
    console.error('❌ No session found. Run index.js to log in first.');
    process.exit(1);
  }
  await ig.state.deserialize(await fs.readJSON(SESSION_PATH));

  // Ask for username
  const targetUsername = await prompt("Enter a mutual friend's username: ");
  rl.close();

  try {
    const targetUser = await ig.user.searchExact(targetUsername);
    const targetUserId = targetUser.pk;

    console.log(`📍 Found user: ${targetUser.username}`);

    // Followers
    const followersFeed = ig.feed.accountFollowers(targetUserId);
    const followers = [];
    do {
      const items = await followersFeed.items();
      followers.push(...items.map(u => u.username));
    } while (followersFeed.isMoreAvailable());

    console.log(`📥 Fetched ${followers.length} followers`);

    // Following
    const followingFeed = ig.feed.accountFollowing(targetUserId);
    const following = [];
    do {
      const items = await followingFeed.items();
      following.push(...items.map(u => u.username));
    } while (followingFeed.isMoreAvailable());

    console.log(`📤 Fetched ${following.length} following`);

    // Mutuals
    const mutuals = followers.filter(u => following.includes(u));
    console.log(`🤝 ${targetUsername}'s mutual friends (${mutuals.length}):`);
    mutuals.forEach((u, i) => console.log(`${i + 1}. ${u}`));

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

main();
