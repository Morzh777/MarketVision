import React from 'react';

// HTML entity для символа рубля
const RUBLE_HTML = '&#8381;';

// Компонент для отображения символа рубля с HTML entity
export const RubleSymbol: React.FC = () => (
  <span dangerouslySetInnerHTML={{ __html: RUBLE_HTML }} />
);

export default RubleSymbol; 