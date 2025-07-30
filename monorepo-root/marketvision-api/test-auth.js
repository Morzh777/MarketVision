// Тестовый скрипт для проверки аутентификации
const testAuth = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Тестирование системы аутентификации...\n');

  // Тест 1: Попытка входа с правильными данными
  console.log('1. Тест входа с правильными данными:');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pavlishev',
        password: '171989Bkmz'
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Статус:', loginResponse.status);
    console.log('Ответ:', loginData);
    
    if (loginData.success) {
      console.log('✅ Вход успешен!');
      
      // Тест 2: Проверка текущего пользователя
      console.log('\n2. Тест получения информации о пользователе:');
      const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          'Cookie': loginResponse.headers.get('set-cookie') || ''
        }
      });
      
      const meData = await meResponse.json();
      console.log('Статус:', meResponse.status);
      console.log('Ответ:', meData);
      
      if (meData.success) {
        console.log('✅ Информация о пользователе получена!');
      } else {
        console.log('❌ Ошибка получения информации о пользователе');
      }
      
    } else {
      console.log('❌ Ошибка входа:', loginData.message);
    }
    
  } catch (error) {
    console.log('❌ Ошибка сети:', error.message);
  }

  // Тест 3: Попытка входа с неправильными данными
  console.log('\n3. Тест входа с неправильными данными:');
  try {
    const wrongLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pavlishev',
        password: 'wrongpassword'
      }),
    });

    const wrongLoginData = await wrongLoginResponse.json();
    console.log('Статус:', wrongLoginResponse.status);
    console.log('Ответ:', wrongLoginData);
    
    if (!wrongLoginData.success) {
      console.log('✅ Правильно отклонен неправильный пароль!');
    } else {
      console.log('❌ Неправильный пароль был принят!');
    }
    
  } catch (error) {
    console.log('❌ Ошибка сети:', error.message);
  }

  // Тест 4: Попытка доступа к защищенному API без токена
  console.log('\n4. Тест доступа к защищенному API без токена:');
  try {
    const protectedResponse = await fetch(`${baseUrl}/api/scheduler/status`);
    const protectedData = await protectedResponse.json();
    console.log('Статус:', protectedResponse.status);
    console.log('Ответ:', protectedData);
    
    if (protectedResponse.status === 401) {
      console.log('✅ Правильно заблокирован доступ без токена!');
    } else {
      console.log('❌ Доступ к защищенному API не заблокирован!');
    }
    
  } catch (error) {
    console.log('❌ Ошибка сети:', error.message);
  }

  console.log('\n🏁 Тестирование завершено!');
};

// Запускаем тест
testAuth(); 