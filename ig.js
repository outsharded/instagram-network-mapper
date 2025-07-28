const { IgApiClient } = require('instagram-private-api');
const fs = require('fs-extra');
const path = require('path');

const SESSION_PATH = './session.json';
const CACHE_DIR = './cache';

const ig = new IgApiClient();
const userIdCache = new Map();
const mutualsCache = new Map();


// Ensure a minimum delay between all Instagram API calls


async function saveSession() {
  const state = await ig.state.serialize();
  await fs.writeJSON(SESSION_PATH, state);
}

async function loadSession() {
  if (!await fs.pathExists(SESSION_PATH)) return false;
  const savedState = await fs.readJSON(SESSION_PATH);
  await ig.state.deserialize(savedState);
  return true;
}

async function login(username, password, prompt) {
    ig.state.generateDevice(username);
  
    try {
      await ig.account.login(username, password);
      console.log('✅ Logged in without 2FA');
      await fs.writeJSON(SESSION_PATH, await ig.state.serialize());
    } catch (err) {
      if (err.name === 'IgLoginTwoFactorRequiredError') {
        console.log('🔐 2FA required');
        const { two_factor_identifier, totp_two_factor_on } = err.response.body.two_factor_info;
        const verificationMethod = totp_two_factor_on ? '0' : '1';
  
        const code = await prompt('Enter 2FA code: ');
  
        await ig.account.twoFactorLogin({
          username,
          verificationCode: code,
          twoFactorIdentifier: two_factor_identifier,
          verificationMethod,
          trustThisDevice: true
        });
  
        console.log('✅ Logged in with 2FA');
        await fs.writeJSON(SESSION_PATH, await ig.state.serialize());
      } else {
        throw err;
      }
    }
  }

async function loginFromSession() {
    if (!(await fs.pathExists(SESSION_PATH))) {
      throw new Error('No session found. Please log in first.');
    }
  
    const saved = await fs.readJSON(SESSION_PATH);
    await ig.state.deserialize(saved);
    return ig;
  }
  

async function getUserId(username) {
  if (userIdCache.has(username)) {
    return userIdCache.get(username);
  }

  const user = await ig.user.searchExact(username);
  userIdCache.set(username, user.pk);
  return user.pk;
}

async function getMutualFriends(userId) {
  const username = await getUsernameById(userId);
  const cachePath = path.join(CACHE_DIR, `mutuals-${username}.json`);

  if (mutualsCache.has(userId)) {
    return mutualsCache.get(userId);
  }

  if (await fs.pathExists(cachePath)) {
    const cached = await fs.readJSON(cachePath);
    mutualsCache.set(userId, cached);
    console.log(`📦 Loaded mutuals for ${username} from cache`);
    return cached;
  }

  const followersFeed = ig.feed.accountFollowers(userId);
  const followers = [];
  do {
    const items = await followersFeed.items();
    followers.push(...items);
  } while (followersFeed.isMoreAvailable());

  const followingFeed = ig.feed.accountFollowing(userId);
  const following = [];
  do {
    const items = await followingFeed.items();
    following.push(...items);
  } while (followingFeed.isMoreAvailable());

  const followingUsernames = new Set(following.map(u => u.username));
  const mutuals = followers.filter(u => followingUsernames.has(u.username));

  await fs.outputJSON(cachePath, mutuals);
  mutualsCache.set(userId, mutuals);

  console.log(`💾 Cached mutuals for ${username}`);
  return mutuals;
}

async function getUsernameById(userId) {
  // This lookup is not cached to disk but could be added
  const userInfo = await ig.user.info(userId);
  return userInfo.username;
}

module.exports = {
  ig,
  login,
  getUserId,
  getMutualFriends,
  saveSession,
  loadSession,
  loginFromSession,
};