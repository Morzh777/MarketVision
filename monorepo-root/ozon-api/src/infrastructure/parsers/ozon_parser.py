import asyncio
import json
import os
import time
import urllib.parse
from typing import Any, Dict, List, Optional

import undetected_chromedriver as uc
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

from domain.entities.product import Product


class OzonParser:
    """Парсер Ozon с использованием undetected-chromedriver"""

    def __init__(self):
        self.driver = None
        self.base_url = "https://www.ozon.ru"
        self._driver_initialized = False

    async def _init_driver(self):
        """Инициализация драйвера с поддержкой локального ChromeDriver"""
        # Если драйвер уже инициализирован и работает, не пересоздаем
        if self._driver_initialized and self.driver is not None:
            try:
                # Проверяем, что драйвер еще работает
                self.driver.current_url
                print("✅ Драйвер уже инициализирован и работает")
                return
            except Exception as e:
                print(f"⚠️ Драйвер не работает, пересоздаем: {e}")
                self.driver = None
                self._driver_initialized = False
        
        if self.driver is None:
            print("🔧 Создаем драйвер Chrome...")
            options = uc.ChromeOptions()
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-blink-features=AutomationControlled")
            options.add_argument("--disable-extensions")
            options.add_argument("--disable-plugins")
            options.add_argument("--disable-images")
            options.add_argument("--disable-javascript")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-web-security")
            options.add_argument("--allow-running-insecure-content")
            options.add_argument("--ignore-ssl-errors")
            options.add_argument("--ignore-certificate-errors")
            options.add_argument("--no-first-run")
            options.add_argument("--no-default-browser-check")
            options.add_argument("--disable-background-timer-throttling")
            options.add_argument("--disable-backgrounding-occluded-windows")
            options.add_argument("--disable-renderer-backgrounding")
            options.add_argument("--disable-features=TranslateUI")
            options.add_argument("--disable-ipc-flooding-protection")
            # Убираем проблемные опции для совместимости с ARM64
            # options.add_experimental_option("excludeSwitches", ["enable-automation"])
            # options.add_experimental_option("useAutomationExtension", False)
            options.add_argument(
                "user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )

            try:
                # Сначала пробуем найти ChromeDriver в разных местах
                chromedriver_paths = [
                    "chromedriver.exe",  # В текущей папке
                    "chromedriver",  # В текущей папке (Linux)
                    os.path.join(os.path.dirname(__file__), "chromedriver.exe"),
                    os.path.join(os.path.dirname(__file__), "chromedriver"),
                    "C:\\chromedriver\\chromedriver.exe",  # Стандартная папка Windows
                    "/usr/local/bin/chromedriver",  # Стандартная папка Linux
                    "/usr/bin/chromedriver",  # Альтернативная папка Linux
                ]

                chromedriver_found = None
                for path in chromedriver_paths:
                    if os.path.exists(path):
                        chromedriver_found = path
                        print(f"✅ Найден ChromeDriver: {path}")
                        break

                if chromedriver_found:
                    # Используем найденный ChromeDriver
                    print(f"🔧 Используем локальный ChromeDriver: {chromedriver_found}")
                    self.driver = uc.Chrome(
                        driver_executable_path=chromedriver_found, options=options
                    )
                else:
                    # Если ChromeDriver не найден, пробуем обычный Selenium
                    print("⚠️ ChromeDriver не найден, пробуем обычный Selenium...")
                    try:
                        self.driver = webdriver.Chrome(options=options)
                    except Exception as e:
                        print(f"❌ Ошибка с обычным Selenium: {e}")
                        # Последняя попытка - без опций
                        print("🔧 Пробуем без опций...")
                        self.driver = webdriver.Chrome()

                print("✅ Драйвер Chrome создан")
                print(f"🔧 Chrome версия: {self.driver.capabilities.get('browserVersion', 'unknown')}")
                print(f"🔧 ChromeDriver версия: {self.driver.capabilities.get('chrome', {}).get('chromedriverVersion', 'unknown')}")

                # Скрываем признаки автоматизации
                self.driver.execute_script(
                    "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
                )
                self.driver.execute_script(
                    "Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]})"
                )
                self.driver.execute_script(
                    "Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']})"
                )
                
                # Отмечаем, что драйвер инициализирован
                self._driver_initialized = True

            except Exception as e:
                print(f"❌ Ошибка создания драйвера: {e}")
                print(f"🔧 Тип ошибки: {type(e).__name__}")
                print(f"🔧 Детали: {str(e)}")
                raise

    def _build_api_url(
        self,
        query: str,
        category_slug: str,
        platform_id: str = None,
        exactmodels: str = None,
    ) -> str:
        """Построение URL для API запроса"""
        # Кодируем запрос для URL
        encoded_query = query.replace(" ", "+")

        # Базовый URL для API Ozon
        base_url = "https://www.ozon.ru/api/entrypoint-api.bx/page/json/v2"

        # Используем переданный category_slug 
        print(f"🎯 Используем slug категории: {category_slug} для запроса '{query}'")
        print(f"🎮 Получен platform_id: {platform_id} (тип: {type(platform_id)})")
        print(f"🔎 Получен exactmodels: {exactmodels}")

        # Параметры запроса (приведены в соответствие с рабочей ссылкой)
        url_param = f"/category/{category_slug}/?__rr=1&category_was_predicted=true&deny_category_prediction=true&from_global=true&page=1&sorting=price&text={encoded_query}"

        # Добавляем платформу если указана
        if platform_id:
            url_param += f"&opened=platform&platform={platform_id}"
            print(f"🎮 Добавляем платформу: {platform_id}")
        else:
            print(f"⚠️ platform_id не указан или пустой")
        # Добавляем exactmodels если указан
        if exactmodels:
            url_param += f"&exactmodels={exactmodels}"
            print(f"🔎 Добавляем exactmodels: {exactmodels}")

        # Строим URL (кодируем только url параметр)
        full_url = f"{base_url}?url={urllib.parse.quote(url_param)}"
        print(f"[OZON-API] FINAL URL: {full_url}")
        return full_url

    async def get_products(
        self,
        query: str,
        category_slug: str,
        platform_id: str = None,
        exactmodels: str = None,
    ) -> List[Product]:
        """Получение продуктов по запросу"""
        start_time = time.time()
        print(f"🔍 Парсинг Ozon для запроса: {query} в категории {category_slug}")
        if platform_id:
            print(f"🎮 С платформой: {platform_id}")
        if exactmodels:
            print(f"🔎 С exactmodels: {exactmodels}")
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"🔄 Попытка {attempt + 1} из {max_retries}")

                # Инициализация драйвера
                await self._init_driver()

                # Дополнительная проверка состояния драйвера
                if self.driver is None:
                    raise Exception("Драйвер не был инициализирован")

                url = self._build_api_url(
                    query, category_slug, platform_id, exactmodels
                )
                print(f"🌐 Переходим на API endpoint для запроса: {query}")
                print(f"📡 URL: {url}")

                # Загрузка страницы
                print("⏳ Начинаем загрузку страницы...")
                try:
                    self.driver.get(url)
                except Exception as e:
                    print(f"❌ Ошибка загрузки страницы: {e}")
                    # Не закрываем драйвер, просто пробуем еще раз
                    if attempt < max_retries - 1:
                        print("🔄 Повторяем попытку загрузки...")
                        await asyncio.sleep(2)
                        continue
                    else:
                        raise Exception(f"Не удалось загрузить страницу после {max_retries} попыток")
                print("✅ Страница загружена")

                # Проверяем текущий URL
                current_url = self.driver.current_url
                print(f"📍 Текущий URL: {current_url}")

                # Ждем загрузки контента
                print("⏳ Ждем загрузки контента...")
                wait = WebDriverWait(self.driver, 10)

                try:
                    # Ждем появления JSON данных
                    wait.until(EC.presence_of_element_located((By.TAG_NAME, "pre")))
                    print("✅ JSON данные найдены")
                except TimeoutException:
                    print("⚠️ JSON данные не найдены, проверяем body...")
                    # Если pre не найден, проверяем body
                    body_text = self.driver.find_element(By.TAG_NAME, "body").text
                    if not body_text.strip():
                        print("❌ Body пустой, возможно страница не загрузилась")
                        if attempt < max_retries - 1:
                            print("🔄 Повторяем попытку...")
                            continue
                        else:
                            raise Exception(
                                "Страница не загрузилась после всех попыток"
                            )

                # Извлекаем JSON данные
                print("🔍 Извлекаем JSON данные...")
                json_data = self._extract_json_from_page()

                if json_data is None:
                    print("❌ Не удалось извлечь JSON данные")
                    if attempt < max_retries - 1:
                        print("🔄 Повторяем попытку...")
                        continue
                    else:
                        raise Exception(
                            "Не удалось извлечь JSON данные после всех попыток"
                        )

                # Парсим продукты
                print("🔍 Парсим продукты из JSON...")
                products = self._parse_products_from_json(
                    json_data, query, category_slug
                )

                processing_time = int((time.time() - start_time) * 1000)
                print(f"✅ Парсинг завершен за {processing_time}ms")
                print(f"📦 Найдено {len(products)} продуктов")

                return products

            except Exception as e:
                print(f"❌ Ошибка в попытке {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    print("🔄 Повторяем попытку...")
                    await asyncio.sleep(2)
                else:
                    print("❌ Все попытки исчерпаны")
                    raise

        return []

    def _extract_json_from_page(self) -> Optional[Dict[str, Any]]:
        """Извлечение JSON данных со страницы"""
        try:
            # Проверяем, что драйвер существует
            if self.driver is None:
                print("❌ Драйвер не инициализирован")
                return None
                
            # Ищем pre элемент с JSON
            pre_elements = self.driver.find_elements(By.TAG_NAME, "pre")

            for pre in pre_elements:
                try:
                    text = pre.text.strip()
                    if text and text.startswith("{"):
                        json_data = json.loads(text)
                        print("✅ JSON данные успешно извлечены из pre элемента")
                        return json_data
                except json.JSONDecodeError:
                    continue

            # Если pre не найден, проверяем body
            body_text = self.driver.find_element(By.TAG_NAME, "body").text.strip()
            if body_text and body_text.startswith("{"):
                try:
                    json_data = json.loads(body_text)
                    print("✅ JSON данные успешно извлечены из body")
                    return json_data
                except json.JSONDecodeError:
                    pass

            print("❌ Не удалось найти валидный JSON на странице")
            return None

        except Exception as e:
            print(f"❌ Ошибка извлечения JSON: {e}")
            return None

    def _parse_products_from_json(
        self, json_data: Dict[str, Any], query: str, category_slug: str
    ) -> List[Product]:
        """Парсинг продуктов из JSON данных"""
        products = []

        try:
            # Проверяем структуру JSON
            if "error" in json_data:
                print(f"❌ Ozon вернул ошибку: {json_data['error']}")
                return products

            # Ищем widgetStates
            if "widgetStates" not in json_data:
                print("❌ widgetStates не найден в JSON")
                return products

            # Ищем tileGridDesktop который содержит товары
            for widget_id, widget_data in json_data["widgetStates"].items():
                if "tileGridDesktop" in widget_id and isinstance(widget_data, str):
                    try:
                        widget_content = json.loads(widget_data)
                        if "items" in widget_content:
                            items = widget_content["items"]
                            print(f"✅ Найдено товаров: {len(items)}")

                            # Парсим каждый товар
                            for item in items:
                                product = self._parse_single_product(
                                    item, query, category_slug
                                )
                                if product:
                                    products.append(product)

                            break  # Нашли товары, выходим из цикла

                    except Exception as e:
                        print(f"⚠️ Ошибка анализа виджета {widget_id}: {e}")
                        continue

            print(f"📦 Извлечено {len(products)} продуктов из JSON")

        except Exception as e:
            print(f"❌ Ошибка парсинга JSON: {e}")

        return products

    def _parse_single_product(
        self, item: Dict[str, Any], query: str, category_slug: str
    ) -> Optional[Product]:
        """Парсинг одного товара"""
        try:
            # Обязательные поля
            product_id = str(item.get("sku", ""))
            if not product_id:
                return None

            name = ""
            price = 0
            image_url = ""
            product_url = ""

            # Ссылка на товар
            if "action" in item and isinstance(item["action"], dict):
                product_url = "https://www.ozon.ru" + item["action"].get("link", "")

            # Основная информация из mainState
            characteristics = {}

            if "mainState" in item:
                for state in item["mainState"]:
                    if state.get("type") == "textAtom" and state.get("id") == "name":
                        name = state.get("textAtom", {}).get("text", "")
                    elif state.get("type") == "priceV2":
                        price_data = state.get("priceV2", {})
                        prices = price_data.get("price", [])
                        for price_item in prices:
                            if price_item.get("textStyle") == "PRICE":
                                price_text = price_item.get("text", "0")
                                price = int("".join(filter(str.isdigit, price_text)))
                            elif price_item.get("textStyle") == "ORIGINAL_PRICE":
                                # Старая цена
                                old_price_text = price_item.get("text", "0")
                                old_price = int(
                                    "".join(filter(str.isdigit, old_price_text))
                                )
                                if old_price > 0:
                                    characteristics["old_price"] = str(old_price)

                        # Скидка
                        discount_text = price_data.get("discount", "")
                        if discount_text:
                            characteristics["discount"] = discount_text

                    elif state.get("type") == "labelList":
                        # Бренд и другие метки
                        labels = state.get("labelList", {}).get("items", [])
                        for label in labels:
                            title = label.get("title", "")
                            # Извлекаем бренд из жирного текста
                            if "<b>" in title and "</b>" in title:
                                brand = (
                                    title.replace("<b>", "").replace("</b>", "").strip()
                                )
                                if brand and not any(
                                    word in brand.lower()
                                    for word in ["оригинал", "рейтинг"]
                                ):
                                    characteristics["brand"] = brand

            # Изображения
            if "tileImage" in item:
                images = []
                for img_item in item.get("tileImage", {}).get("items", []):
                    if img_item.get("type") == "image":
                        img_url = img_item.get("image", {}).get("link", "")
                        if img_url:
                            images.append(img_url)
                if images:
                    image_url = images[0]

            # Проверяем обязательные поля
            if not name or price == 0:
                return None

            # Создаем продукт
            return Product(
                id=product_id,
                name=name,
                price=float(price),
                image_url=image_url,
                product_url=product_url,
                supplier="Ozon",
                characteristics=characteristics,
                category=category_slug,  # Используем оригинальный category_slug
            )

        except Exception as e:
            print(f"❌ Ошибка парсинга товара: {e}")
            return None

    async def extract_products(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Извлечение продуктов из сырых данных (для совместимости)"""
        products = []

        try:
            # Извлекаем данные о товарах
            widgets = raw_data.get("widgetStates", {})

            for widget_key, widget_data in widgets.items():
                if "items" in widget_data:
                    try:
                        widget_json = json.loads(widget_data)
                        items = widget_json.get("items", [])

                        for item in items:
                            product_data = self._extract_products_from_items([item])
                            products.extend(product_data)

                    except json.JSONDecodeError:
                        continue

        except Exception as e:
            print(f"❌ Ошибка извлечения продуктов: {e}")

        return products

    def _extract_products_from_items(
        self, items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Извлечение данных продуктов из списка items"""
        products = []

        for item in items:
            try:
                product_data = {
                    "id": str(item.get("id", "")),
                    "name": item.get("title", ""),
                    "price": (
                        item.get("price", {}).get("price", "0")
                        if isinstance(item.get("price"), dict)
                        else str(item.get("price", "0"))
                    ),
                    "description": item.get("description", ""),
                    "image_url": "",
                    "product_url": item.get("url", ""),
                    "images": item.get("images", []),
                    "characteristics": {},
                    "category": item.get("category", ""),
                    "availability": item.get("availability", ""),
                    "query": "",  # Будет заполнено при вызове
                }

                # Обработка изображений
                images = item.get("images", [])
                if images and len(images) > 0:
                    product_data["image_url"] = images[0].get("url", "")
                    if product_data["image_url"] and not product_data[
                        "image_url"
                    ].startswith("http"):
                        product_data["image_url"] = (
                            f"https://{product_data['image_url']}"
                        )

                # Обработка URL
                if product_data["product_url"] and not product_data[
                    "product_url"
                ].startswith("http"):
                    product_data["product_url"] = (
                        f"https://www.ozon.ru{product_data['product_url']}"
                    )

                # Обработка характеристик
                specs = item.get("specs", [])
                if specs:
                    for spec in specs:
                        if (
                            isinstance(spec, dict)
                            and "name" in spec
                            and "value" in spec
                        ):
                            product_data["characteristics"][spec["name"]] = spec[
                                "value"
                            ]

                products.append(product_data)

            except Exception as e:
                print(f"❌ Ошибка извлечения продукта: {e}")
                continue

        return products

    async def close(self, force: bool = False):
        """Закрытие драйвера (только при принудительном закрытии)"""
        if not force:
            print("ℹ️ Драйвер остается открытым для персистентной работы")
            return
            
        if self.driver:
            try:
                # Проверяем, что драйвер еще работает
                try:
                    self.driver.current_url
                except:
                    print("⚠️ Драйвер уже закрыт")
                    self.driver = None
                    self._driver_initialized = False
                    return
                
                self.driver.quit()
                print("🔌 Драйвер Chrome закрыт")
            except Exception as e:
                print(f"❌ Ошибка закрытия драйвера: {e}")
            finally:
                self.driver = None
                self._driver_initialized = False
