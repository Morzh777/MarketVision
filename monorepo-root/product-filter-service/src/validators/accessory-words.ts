export const MOTHERBOARD_ACCESSORY_WORDS = [
  // Только настоящие аксессуары для материнских плат
  'кабель', 'cable', 'наклейка', 'sticker', 'держатель', 'bracket', 'заглушка', 'backplate', 'сумка', 'bag', 'fan', 'вентилятор', 'переходник', 'adapter', 'expansion card', 'плата расширения', 'радиатор', 'охлаждение', 'stand', 'mount', 'holder', 'cover', 'panel', 'shell', 'skin', 'grip', 'pad', 'button', 'repair', 'replacement', 'kit', 'set', 'accessory', 'accessories', 'аксессуар', 'аксессуары', 'комплект', 'набор', 'модуль', 'module', 'пленка', 'чехол', 'чехлы', 'case', 'usb-c', 'displayport', 'hdmi'
];

export const GPU_ACCESSORY_WORDS = [
  // Аксессуары для видеокарт
  'кабель', 'cable', 'наклейка', 'sticker', 'держатель', 'bracket', 'backplate', 'сумка', 'bag', 'fan', 'вентилятор', 'переходник', 'adapter', 'радиатор', 'охлаждение', 'stand', 'mount', 'holder', 'cover', 'shell', 'skin', 'grip', 'pad', 'repair', 'replacement', 'kit', 'set', 'accessory', 'accessories', 'аксессуар', 'аксессуары', 'комплект', 'набор', 'модуль', 'module', 'пленка', 'чехол', 'чехлы', 'case', 'usb-c', 'displayport', 'hdmi'
];

export const CPU_ACCESSORY_WORDS = [
  // Аксессуары для процессоров
  'охлаждение', 'cooler', 'fan', 'вентилятор', 'радиатор', 'thermal', 'thermal paste', 'паста', 'переходник', 'adapter', 'держатель', 'bracket', 'backplate', 'комплект', 'набор', 'kit', 'set', 'аксессуар', 'аксессуары', 'accessory', 'accessories', 'чехол', 'чехлы', 'case'
];

// Старый общий список (оставлен для обратной совместимости, но не использовать в новых валидаторах)
export const ACCESSORY_WORDS = [
  ...MOTHERBOARD_ACCESSORY_WORDS,
  ...GPU_ACCESSORY_WORDS,
  ...CPU_ACCESSORY_WORDS
]; 