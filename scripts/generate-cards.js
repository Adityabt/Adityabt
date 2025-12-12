// scripts/generate-cards.js
// Simple Node script to fetch basic GitHub data and write SVGs.
// Run inside GitHub Actions with GITHUB_TOKEN available.

const fs = require('fs');
const https = require('https');

const OWNER = 'Adityabt';
const REPO = 'Adityabt';
const API = 'api.github.com';
const headers = { 'User-Agent': 'github-readme-cards', Authorization: `token ${process.env.GITHUB_TOKEN}` };

function fetch(path) {
  return new Promise((res, rej) => {
    const opts = { host: API, path, headers };
    https.get(opts, r => {
      let data = '';
      r.on('data', c => (data += c));
      r.on('end', () => res(JSON.parse(data)));
    }).on('error', rej);
  });
}

async function main(){
  try {
    const user = await fetch(`/users/${OWNER}`);
    const repos = await fetch(`/users/${OWNER}/repos?per_page=100&type=owner&sort=pushed`);
    // Simple aggregate values
    const followers = user.followers || 0;
    const stars = repos.reduce((s,r)=> s + (r.stargazers_count||0), 0);
    const repoCount = repos.length;

    // commit count: use events or /repos/:owner/:repo/stats/contributors (may be delayed). We'll fallback to a placeholder.
    let commitCount = '—';
    // languages: aggregate top languages by repo languages endpoint (simple)
    const langTotals = {};
    for (const r of repos.slice(0,10)) {
      try {
        const langs = await fetch(`/repos/${OWNER}/${r.name}/languages`);
        Object.keys(langs).forEach(l => (langTotals[l] = (langTotals[l]||0) + langs[l]));
      } catch(e){}
    }
    const topLangs = Object.entries(langTotals).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);

    // create basic stats-card.svg
    const statsSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5D3FD3"/>
      <stop offset="100%" stop-color="#21D4FD"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="700" height="260" rx="22" fill="url(#grad)"/>
  <text x="40" y="60" fill="white" font-size="34" font-family="Arial" font-weight="700">GitHub Stats</text>
  <g transform="translate(40,110)">
    <rect width="620" height="120" rx="18" fill="#ffffff22"/>
    <text x="20" y="45" fill="white" font-size="22" font-family="Arial">Username:</text>
    <text x="160" y="45" fill="white" font-size="22" font-weight="700" font-family="Arial">@${OWNER}</text>
    <text x="20" y="80" fill="white" font-size="22" font-family="Arial">Followers:</text>
    <text x="200" y="80" fill="white" font-size="22" font-weight="700" font-family="Arial">${followers}</text>
    <text x="350" y="80" fill="white" font-size="22" font-family="Arial">Stars:</text>
    <text x="430" y="80" fill="white" font-size="22" font-weight="700" font-family="Arial">${stars}</text>
  </g>
</svg>`;
    fs.writeFileSync('stats-card.svg', statsSvg, 'utf8');

    // streak-card.svg — we'll keep simple placeholders (streak calculation is complex)
    const streakSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="220" viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="220" rx="20" fill="#FF416C"/>
  <text x="40" y="60" fill="white" font-size="32" font-family="Arial" font-weight="700">Contribution Streak 🔥</text>
  <g transform="translate(40,100)"><rect width="620" height="90" rx="14" fill="#ffffff22"/><text x="20" y="45" fill="white" font-size="22">Current Streak:</text><text x="240" y="45" fill="white" font-size="22" font-weight="700">— Days</text></g>
</svg>`;
    fs.writeFileSync('streak-card.svg', streakSvg, 'utf8');

    // langs-card.svg
    const langsSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="260" viewBox="0 0 700 260" xmlns="http://www.w3.org/2000/svg">
  <rect width="700" height="260" rx="22" fill="#0F172A"/>
  <text x="40" y="60" fill="white" font-size="32" font-family="Arial" font-weight="700">Top Languages</text>
  <g transform="translate(40,100)">
    ${topLangs.map((l,i)=>`<text x="0" y="${i*50}" fill="white" font-size="20" font-family="Arial">${l}</text><rect x="0" y="${10+i*50}" width="${400 - i*80}" height="14" rx="7" fill="#00C9FF"/>`).join('')}
  </g>
</svg>`;
    fs.writeFileSync('langs-card.svg', langsSvg, 'utf8');

    // cyber-card.svg — static version
    const cyberSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="700" height="260" xmlns="http://www.w3.org/2000/svg"><rect width="700" height="260" rx="22" fill="#8A2BE2"/><rect x="20" y="20" width="660" height="220" rx="18" fill="#ffffff22"/><text x="40" y="70" fill="white" font-size="32" font-family="Arial" font-weight="700">GitHub Trophy Case 🏆</text></svg>`;
    fs.writeFileSync('cyber-card.svg', cyberSvg, 'utf8');

    console.log('SVGs generated');
  } catch (e) {
    console.error('Error', e);
    process.exit(1);
  }
}
main();
