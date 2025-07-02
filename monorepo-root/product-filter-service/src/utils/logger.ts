import * as fs from 'fs';
import * as path from 'path';

class FileLogger {
  private logStream: fs.WriteStream;
  private logFile: string;

  constructor() {
    // Создаем папку для логов если её нет
    // Используем process.cwd() для получения корневой папки проекта
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Создаем файл лога
    this.logFile = path.join(logsDir, `product-filter-${new Date().toISOString().split('T')[0]}.log`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
    
    console.log(`📝 Логи будут сохраняться в: ${this.logFile}`);
  }

  log(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] LOG [${context || 'ProductFilterService'}] ${message}\n`;
    
    // Записываем в файл
    this.logStream.write(logMessage);
    
    // Выводим в консоль
    console.log(`[${context || 'ProductFilterService'}] ${message}`);
  }

  error(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR [${context || 'ProductFilterService'}] ${message}\n`;
    
    // Записываем в файл
    this.logStream.write(logMessage);
    
    // Выводим в консоль
    console.error(`[${context || 'ProductFilterService'}] ${message}`);
  }

  warn(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] WARN [${context || 'ProductFilterService'}] ${message}\n`;
    
    // Записываем в файл
    this.logStream.write(logMessage);
    
    // Выводим в консоль
    console.warn(`[${context || 'ProductFilterService'}] ${message}`);
  }

  debug(message: string, context?: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] DEBUG [${context || 'ProductFilterService'}] ${message}\n`;
    
    // Записываем в файл
    this.logStream.write(logMessage);
    
    // Выводим в консоль
    console.debug(`[${context || 'ProductFilterService'}] ${message}`);
  }

  getLogFilePath(): string {
    return this.logFile;
  }
}

// Создаем единственный экземпляр логгера
export const fileLogger = new FileLogger(); 