# 🚀Гайд по установке с нуля

Этот гайд поможет установить все необходимые инструменты для разработки проекта MarketVision на новом Mac с нуля.

## 📋 Что мы устанавливаем

- **Homebrew** - пакетный менеджер для macOS
- **Node.js** - среда выполнения JavaScript
- **Docker** - контейнеризация приложений
- **Git** - система контроля версий
- **Python** - для кайфа
- **Глобальные пакеты Node.js** - NestJS CLI, create-next-app
- **iTerm2** - улучшенный терминал
- **Oh My Zsh** - фреймворк для zsh с плагинами

## 🛠️ Пошаговая установка

### 1. Установка Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

После установки добавьте Homebrew в PATH:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

Проверьте установку:
```bash
brew --version
```

### 2. Установка Node.js

```bash
brew install node
```

Проверьте установку:
```bash
node --version
npm --version
```

### 3. Установка Docker

```bash
brew install --cask docker
```

После установки запустите Docker Desktop из Applications.

Проверьте установку:
```bash
docker --version
```

### 4. Установка Docker Compose

```bash
brew install docker-compose
```

Проверьте установку:
```bash
docker-compose --version
```

### 5. Проверка Git

Git обычно уже установлен на macOS. Проверьте:
```bash
git --version
```

Если не установлен:
```bash
brew install git
```

### 6. Проверка Python

Python обычно уже установлен на macOS. Проверьте:
```bash
python3 --version
```

Если нужна более новая версия:
```bash
brew install python
```

### 7. Установка ChromeDriver (для парсеров)

```bash
brew install chromedriver
```

После установки разрешите запуск:
```bash
xattr -d com.apple.quarantine /opt/homebrew/bin/chromedriver
```

Проверьте установку:
```bash
chromedriver --version
```

### 8. Установка глобальных пакетов Node.js

```bash
npm install -g @nestjs/cli
npm install -g create-next-app
```

Проверьте установку:
```bash
nest --version
```

### 9. Установка iTerm2 (улучшенный терминал)

```bash
brew install --cask iterm2
```

После установки запустите iTerm2 из Applications.

### 10. Установка Oh My Zsh

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

При установке отвечайте "Y" на все вопросы.

### 11. Установка плагинов для zsh

```bash
# Автоподсказки
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions

# Подсветка синтаксиса
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

### 12. Настройка конфигурации zsh

Откройте файл `~/.zshrc` и измените:

```bash
# Тема (замените robbyrussell на agnoster)
ZSH_THEME="agnoster"

# Плагины (замените plugins=(git) на):
plugins=(git zsh-autosuggestions zsh-syntax-highlighting docker docker-compose node npm)
```

Добавьте в конец файла полезные алиасы:

```bash
# Полезные алиасы
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias mv='cd ~/app/MarketVision'
alias gs='git status'
alias ga='git add .'
alias gc='git commit -m'
alias gp='git push'
alias gl='git log --oneline'
alias dc='docker-compose'
alias dcu='docker-compose up -d'
alias dcd='docker-compose down'
alias dps='docker ps'
alias dlogs='docker-compose logs -f'

# Настройки для разработки
export NODE_ENV=development
export EDITOR='code'

# Автодополнение для npm
autoload -U +X bashcompinit && bashcompinit
```

Перезагрузите конфигурацию:
```bash
source ~/.zshrc
```

## 🎨 Дополнительные настройки (опционально)

### Установка шрифта для темы agnoster

```bash
brew install --cask font-meslo-lg-nerd-font
```

После установки в iTerm2:
1. Откройте Preferences (⌘ + ,)
2. Перейдите в Profiles → Text
3. Выберите шрифт "MesloLGS NF"

### Полезные команды для тестирования

```bash
# Проверка алиасов
mv          # переход в проект MarketVision
gs          # git status
ll          # ls -la
dps         # docker ps

# Автодополнение
# Начните печатать команду и нажмите Tab или стрелку вправо
```

## 📦 Установка зависимостей проекта

Клонируйте проект и установите зависимости:

```bash
# Перейдите в папку проекта
cd /path/to/MarketVision

# Установите зависимости для всех Node.js сервисов
cd monorepo-root/bot && npm install
cd ../product-filter-service && npm install
cd ../wb-api && npm install
cd ../db-api && npm install
cd ../marketvision-api && npm install

# Установите Python зависимости
cd ../ozon-api && pip3 install -r requirements.txt
```

## 🔧 Исправление проблем

### Проблема с types-requests в ozon-api

Если возникает ошибка с `types-requests==2.31.0.20231130`, исправьте версию в файле `monorepo-root/ozon-api/requirements.txt`:

```bash
# Замените строку
types-requests==2.31.0.20231130
# На
types-requests==2.32.4.20250611
```

### Проблема с Homebrew PATH

Если команда `brew` не найдена после установки:

```bash
# Добавьте в ~/.zprofile
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
source ~/.zprofile
```

### Проблема с Python PATH

Если Python пакеты не находятся:

```bash
# Добавьте в ~/.zprofile
echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

### Проблема с Oh My Zsh

Если Oh My Zsh уже установлен:

```bash
# Удалите старую установку
rm -rf ~/.oh-my-zsh

# Переустановите
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

### Проблема с плагинами zsh

Если плагины не работают:

```bash
# Проверьте, что плагины установлены
ls ~/.oh-my-zsh/custom/plugins/

# Перезагрузите конфигурацию
source ~/.zshrc
```

## ✅ Проверка установки

Выполните эту команду для проверки всех инструментов:

```bash
echo "=== Проверка установленных инструментов ===" && \
node --version && \
npm --version && \
docker --version && \
docker-compose --version && \
git --version && \
python3 --version && \
echo "=== Проверка глобальных пакетов ===" && \
nest --version
```

Ожидаемый вывод:
```
=== Проверка установленных инструментов ===
v24.4.1
11.4.2
Docker version 28.3.2, build 578ccf6
Docker Compose version 2.38.2
git version 2.39.5 (Apple Git-154)
Python 3.9.6
=== Проверка глобальных пакетов ===
11.0.7
```

## 🚀 Следующие шаги

После установки всех инструментов:

1. **Настройте базу данных**:
   ```bash
   cd monorepo-root/db-api
   npx prisma generate
   npx prisma migrate dev
   ```

2. **Создайте .env файлы** в каждом сервисе с необходимыми переменными

3. **Запустите проект**:
   ```bash
   docker-compose up -d
   ```

## 📚 Полезные команды

```bash
# Обновление Homebrew
brew update && brew upgrade

# Очистка кэша Homebrew
brew cleanup

# Обновление npm пакетов
npm update -g

# Просмотр установленных пакетов Homebrew
brew list

# Просмотр глобальных npm пакетов
npm list -g --depth=0
```

## 🔍 Диагностика проблем

### Проверка версий
```bash
# Все версии в одной команде
node --version && npm --version && docker --version && docker-compose --version && git --version && python3 --version
```

### Проверка путей
```bash
# Где установлены инструменты
which node
which npm
which docker
which git
which python3
```

### Проверка переменных окружения
```bash
# Просмотр PATH
echo $PATH

# Просмотр профиля
cat ~/.zprofile
```

---

**Версия гайда**: 2.0  
**Дата создания**: 2025-01-27  
**Обновлено**: 2025-01-27 (добавлены iTerm2, Oh My Zsh, плагины)  
**Тестировано на**: macOS 24.5.0, M1/M2 Mac

> 💡 **Совет**: Сохраните этот гайд в облаке или закладках браузера для быстрого доступа при переустановке системы. 