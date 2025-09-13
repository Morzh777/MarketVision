interface HelpButtonProps {
  type: 'categories' | 'queries' | 'products' | 'settings'
}

const helpContent = {
  categories: [
    'Ключ категории должен быть уникальным идентификатором (например: videocards, processors).',
    'Название категории - это отображаемое имя для пользователей.',
    'OZ ID и WB ID - это идентификаторы категорий на соответствующих платформах.'
  ],
  queries: [
    'Введите поисковый запрос и настройте параметры парсинга.',
    'Platform ID и Exact Models настраиваются вручную для каждого запроса.',
    'По умолчанию создаются записи для обеих платформ (Ozon и WB).'
  ],
  products: [
    'Здесь отображаются найденные продукты по выбранному запросу.',
    'Можно фильтровать по цене, рейтингу и другим параметрам.',
    'Кликните на продукт для просмотра детальной информации.'
  ],
  settings: [
    'Настройте параметры парсинга и фильтрации продуктов.',
    'Platform ID - идентификатор категории на платформе.',
    'Exact Models - точные модели для поиска (через запятую).'
  ]
}

export default function HelpButton({ type }: HelpButtonProps) {
  const content = helpContent[type] || helpContent.categories

  return (
    <div className="categories__help">
      <button 
        className="categories__help-btn"
        tabIndex={0}
      >
        ?
      </button>
      <div className="categories__help-tooltip">
        {content.join(' ')}
      </div>
    </div>
  )
}
