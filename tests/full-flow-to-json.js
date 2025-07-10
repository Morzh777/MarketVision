const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function main() {
  const BASE_URL = 'http://localhost:3001';
  const OUTPUT_PATH = path.join(__dirname, 'full-flow-output.json');
  const body = {
    queries: ['rtx 5080'],
    category: 'videocards'
  };
  const response = await fetch(`${BASE_URL}/products/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Response written to ${OUTPUT_PATH}`);
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
}); 