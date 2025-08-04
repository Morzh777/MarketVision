export const environmentConfig = {
  // Токен для аутентификации с Ozon API
  OZON_API_TOKEN: process.env.OZON_API_TOKEN,
  
  // Токен для аутентификации с WB API
  WB_API_TOKEN: process.env.WB_API_TOKEN,
  
  // Токен для аутентификации с DB API
  DB_API_TOKEN: process.env.DB_API_TOKEN,
  
  // Настройки сервера
  PORT: process.env.PORT,
  
  // Настройки логирования
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_FILE: process.env.LOG_FILE
};