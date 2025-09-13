'use client'

import { useState } from 'react'
import type { Category } from '@/shared/types/categories.interface'
import CustomSelect from '@/components/ui/CustomSelect'
import { PlayIcon, RefreshIcon } from '@/components/ui/Icons'
import '@/app/styles/components/Parsing.scss'

interface ParsingClientProps {
  categories: Category[]
}

interface ParsingStatus {
  isRunning: boolean
  category: string
  progress: number
  message: string
  results?: {
    queries_processed: number
    total_products_found: number
    processing_time_ms: number
  }
}

export default function ParsingClient({ categories }: ParsingClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [parsingStatus, setParsingStatus] = useState<ParsingStatus>({
    isRunning: false,
    category: '',
    progress: 0,
    message: 'Выберите категорию для запуска парсинга'
  })

  // Отладочная информация
  console.log('ParsingClient categories:', categories)
  console.log('Categories length:', categories?.length || 0)

  const handleStartParsing = async () => {
    if (!selectedCategory) {
      alert('Выберите категорию для парсинга')
      return
    }

    setParsingStatus({
      isRunning: true,
      category: selectedCategory,
      progress: 0,
      message: 'Запуск парсинга...'
    })

    try {
      // Отправляем запрос на запуск парсинга
      const response = await fetch('/api/parsing/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryKey: selectedCategory }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setParsingStatus({
          isRunning: false,
          category: selectedCategory,
          progress: 100,
          message: 'Парсинг завершен успешно!',
          results: result.data
        })
      } else {
        setParsingStatus({
          isRunning: false,
          category: selectedCategory,
          progress: 0,
          message: `Ошибка: ${result.message || 'Неизвестная ошибка'}`
        })
      }
    } catch (error) {
      setParsingStatus({
        isRunning: false,
        category: selectedCategory,
        progress: 0,
        message: `Ошибка подключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      })
    }
  }

  const handleClearCache = async () => {
    try {
      const response = await fetch('/api/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        alert('Кэш успешно очищен!')
      } else {
        alert(`Ошибка очистки кэша: ${result.message || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      alert(`Ошибка подключения: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  return (
    <div className="parsing">
      <div className="parsing__header">
        <h2>Управление парсингом</h2>
        <p className="parsing__description">
          Запустите парсинг данных для выбранной категории
        </p>
      </div>

      <div className="parsing__controls">
        <div className="parsing__category-select">
          <CustomSelect
            options={categories.map(category => ({
              value: category.key,
              label: category.display
            }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="Выберите категорию"
            className="parsing__select"
          />
        </div>

        <div className="parsing__actions">
          <button
            onClick={handleStartParsing}
            disabled={!selectedCategory || parsingStatus.isRunning}
            className="parsing__start-btn"
          >
            <PlayIcon size={16} />
            {parsingStatus.isRunning ? 'Парсинг...' : 'Запустить парсинг'}
          </button>

          <button
            onClick={handleClearCache}
            className="parsing__clear-btn"
            title="Очистить кэш"
          >
            <RefreshIcon size={16} />
            Очистить кэш
          </button>
        </div>
      </div>

      <div className="parsing__status">
        <div className="parsing__status-header">
          <h3>Статус парсинга</h3>
          {parsingStatus.isRunning && (
            <div className="parsing__spinner"></div>
          )}
        </div>

        <div className="parsing__status-content">
          <div className="parsing__message">
            {parsingStatus.message}
          </div>

          {parsingStatus.isRunning && (
            <div className="parsing__progress">
              <div className="parsing__progress-bar">
                <div 
                  className="parsing__progress-fill"
                  style={{ width: `${parsingStatus.progress}%` }}
                ></div>
              </div>
              <span className="parsing__progress-text">
                {parsingStatus.progress}%
              </span>
            </div>
          )}

          {parsingStatus.results && (
            <div className="parsing__results">
              <h4>Результаты парсинга:</h4>
              <div className="parsing__results-grid">
                <div className="parsing__result-item">
                  <span className="parsing__result-label">Обработано запросов:</span>
                  <span className="parsing__result-value">
                    {parsingStatus.results.queries_processed}
                  </span>
                </div>
                <div className="parsing__result-item">
                  <span className="parsing__result-label">Найдено товаров:</span>
                  <span className="parsing__result-value">
                    {parsingStatus.results.total_products_found}
                  </span>
                </div>
                <div className="parsing__result-item">
                  <span className="parsing__result-label">Время выполнения:</span>
                  <span className="parsing__result-value">
                    {parsingStatus.results.processing_time_ms}мс
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="parsing__info">
        <h3>Информация о парсинге</h3>
        <div className="parsing__info-content">
          <p>
            <strong>Как работает парсинг:</strong>
          </p>
          <ul>
            <li>Система получает все запросы для выбранной категории</li>
            <li>Запускает парсинг на обеих платформах (Ozon и Wildberries)</li>
            <li>Валидирует и группирует найденные товары</li>
            <li>Сохраняет данные в базу и обновляет кэш</li>
          </ul>
          
          <p>
            <strong>Очистка кэша:</strong> Удаляет кэшированные данные для обновления информации на сайте
          </p>
        </div>
      </div>
    </div>
  )
}
