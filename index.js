const readline = require('readline');
const fs = require('fs-extra');
const ig = require('./ig');
const { crawlNetwork } = require('./crawler');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const hasSession = await fs.pathExists('./session.json');
  
    const username = await prompt('Instagram username: ');

  if (!hasSession) {
    const password = await prompt('Instagram password: ');

    try {
      await ig.login(username, password, prompt);
    } catch (err) {
      console.error('❌ Login failed:', err.stack);
      rl.close();
      process.exit(1);
    }
  } else {
    console.log('🔐 Using saved session...');
  }

  const startUsername = await prompt('Enter the username to map from: ');
  rl.close();

  try {
    await crawlNetwork(startUsername.trim(), username);
  } catch (err) {
    console.error('❌ Crawler error:', err.stack);
  }
}

main();
