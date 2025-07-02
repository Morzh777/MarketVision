import fetch from 'node-fetch';

export class WbApiClient {
  constructor(private apiUrl: string) {
    console.log(`🔗 WB API Client подключен к Product-Filter-Service: ${this.apiUrl}`);
  }

  private async fetchCategory(category: string, categoryName: string): Promise<any[]> {
    const url = `${this.apiUrl}/${category}`;
    console.log(`🔍 Запрос ${categoryName}: GET ${url}`);
    
    try {
      const res = await fetch(url);
      console.log(`📡 Ответ: ${res.status} ${res.statusText}`);
      
      if (!res.ok) {
        console.error(`❌ Ошибка ${categoryName}: ${res.status} ${res.statusText}`);
        return [];
      }
      
      const data = await res.json();
      
      if (Array.isArray(data)) {
        console.log(`✅ ${categoryName} получено: ${data.length}`);
        return data;
      } else {
        console.log(`❌ Неожиданная структура данных для ${categoryName}:`, data);
        return [];
      }
      
    } catch (error) {
      console.error(`❌ Ошибка запроса ${categoryName}:`, error);
      return [];
    }
  }

  async getVideocards(): Promise<any[]> {
    return this.fetchCategory('videocards', 'видеокарт');
  }

  async getProcessors(): Promise<any[]> {
    return this.fetchCategory('processors', 'процессоров');
  }

  async getMotherboards(): Promise<any[]> {
    return this.fetchCategory('motherboards', 'материнских плат');
  }
} 