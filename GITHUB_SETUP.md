# GitHub Repository Setup

## Створення репозиторію на GitHub

1. Перейдіть на [GitHub](https://github.com) та увійдіть у свій акаунт

2. Натисніть кнопку **"New"** або **"+"** → **"New repository"**

3. Заповніть форму:
   - **Repository name**: `atlassian-ai-news-aggregator` (або ваша назва)
   - **Description**: `Forge app that aggregates AI news from multiple sources and publishes to Confluence`
   - **Visibility**: Public або Private (на ваш вибір)
   - **НЕ** створюйте README, .gitignore, або license (вони вже є в проекті)

4. Натисніть **"Create repository"**

## Підключення локального репозиторію до GitHub

Після створення репозиторію, виконайте ці команди (замініть `YOUR_USERNAME` на ваш GitHub username):

```bash
cd "/Users/igorhutsalyuk/Desktop/AI Hub"

# Додайте remote (замініть YOUR_USERNAME на ваш username)
git remote add origin https://github.com/YOUR_USERNAME/atlassian-ai-news-aggregator.git

# Перейменуйте гілку на main (якщо потрібно)
git branch -M main

# Відправте код на GitHub
git push -u origin main
```

## Автоматичні коміти

Після налаштування, ви можете використовувати скрипт для автоматичних комітів:

```bash
./scripts/auto-commit.sh "feat: add new feature"
```

Або використовуйте стандартні git команди:

```bash
git add .
git commit -m "your commit message"
git push
```

## Структура комітів

Проект використовує conventional commits:

- `feat:` - нова функціональність
- `fix:` - виправлення помилок
- `docs:` - зміни в документації
- `refactor:` - рефакторинг коду
- `test:` - зміни в тестах
- `chore:` - технічні зміни

## Приклади комітів

```bash
git commit -m "feat: implement feed parser service for RSS/Atom feeds"
git commit -m "fix: resolve Confluence API authentication issue"
git commit -m "docs: update README with global page instructions"
git commit -m "refactor: improve error handling in news processor"
git commit -m "test: add unit tests for keyword filtering"
```

