const fs = require('fs');
const path = require('path');

// Импортируем TS-конфиги через require-from-ts (или напрямую, если поддерживается)
const categoriesConfig = require('./src/config/categories.config');
const queriesConfig = require('./src/config/queries.config');

const outDir = path.join(__dirname, '../../tests/api_responce/config-export');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, 'categories.json'),
  JSON.stringify(categoriesConfig.CATEGORIES, null, 2)
);
fs.writeFileSync(
  path.join(outDir, 'query-platforms.json'),
  JSON.stringify(categoriesConfig.QUERY_PLATFORMS, null, 2)
);
fs.writeFileSync(
  path.join(outDir, 'queries.json'),
  JSON.stringify(queriesConfig.CATEGORY_QUERIES, null, 2)
);

console.log('✅ Конфиги экспортированы в tests/api_responce/config-export/'); 