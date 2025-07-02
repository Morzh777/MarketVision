const fs = require('fs');
const path = require('path');

// Функция для просмотра последних логов
function viewLogs(lines = 100) {
  const logsDir = path.join(__dirname, 'logs');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `product-filter-${today}.log`);
  
  if (!fs.existsSync(logFile)) {
    console.log(`❌ Лог файл не найден: ${logFile}`);
    return;
  }
  
  const content = fs.readFileSync(logFile, 'utf8');
  const linesArray = content.split('\n');
  
  console.log(`📝 Последние ${lines} строк из лога:`);
  console.log(`📁 Файл: ${logFile}`);
  console.log('='.repeat(80));
  
  // Показываем последние строки
  const lastLines = linesArray.slice(-lines);
  lastLines.forEach(line => {
    if (line.trim()) {
      console.log(line);
    }
  });
}

// Функция для поиска в логах
function searchLogs(searchTerm) {
  const logsDir = path.join(__dirname, 'logs');
  const today = new Date().toISOString().split('T')[0];
  const logFile = path.join(logsDir, `product-filter-${today}.log`);
  
  if (!fs.existsSync(logFile)) {
    console.log(`❌ Лог файл не найден: ${logFile}`);
    return;
  }
  
  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  
  console.log(`🔍 Поиск "${searchTerm}" в логах:`);
  console.log(`📁 Файл: ${logFile}`);
  console.log('='.repeat(80));
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
      console.log(`[${index + 1}] ${line}`);
    }
  });
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);

if (args.length === 0) {
  // Показываем последние 50 строк
  viewLogs(50);
} else if (args[0] === '--search' && args[1]) {
  // Поиск в логах
  searchLogs(args[1]);
} else if (args[0] === '--lines' && args[1]) {
  // Показываем указанное количество строк
  viewLogs(parseInt(args[1]));
} else {
  console.log('📝 Использование:');
  console.log('  node view-logs.js                    - показать последние 50 строк');
  console.log('  node view-logs.js --lines 100        - показать последние 100 строк');
  console.log('  node view-logs.js --search "RTX 5090" - найти строки с "RTX 5090"');
} 