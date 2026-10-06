const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const targets = [
  {
    name: '07-youtube-search.png',
    url: 'http://localhost:3000/search?q=coldplay',
    size: '390,844'
  },
  {
    name: '08-youtube-tab-filter.png',
    url: 'http://localhost:3000/search',
    size: '390,844'
  }
];

const docsDir = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

for (const t of targets) {
  const dest = path.join(docsDir, t.name);
  console.log('Capturing:', t.name, 'from', t.url);
  const res = spawnSync(chromePath, [
    '--headless',
    '--disable-gpu',
    '--virtual-time-budget=6000',
    `--window-size=${t.size}`,
    `--screenshot=${dest}`,
    t.url
  ]);

  if (fs.existsSync(dest)) {
    console.log('Successfully captured:', t.name, 'Size:', fs.statSync(dest).size, 'bytes');
  } else {
    console.warn('Failed to capture:', t.name, res.stderr?.toString());
  }
}

