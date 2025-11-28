# Deployment Instructions

## ✅ Статус

- ✅ Додаток зареєстровано: **AI News Aggregator**
- ✅ App ID: `ari:cloud:ecosystem::app/2db096a8-4660-4886-800c-eb89dc97d5bf`
- ✅ Задеплоєно в production

## Крок 1: Реєстрація додатка (ВЖЕ ВИКОНАНО)

Додаток вже зареєстровано автоматично через скрипт.

## Крок 2: Збірка додатка (ВЖЕ ВИКОНАНО)

Додаток вже зібрано та задеплоєно.

## Крок 3: Деплой в продакшн (ВЖЕ ВИКОНАНО)

Додаток вже задеплоєно в production середовище.

## Крок 4: Встановлення на Jira сайт

### Автоматичне встановлення (через скрипт):

```bash
./scripts/install-forge-app.expect yourcompany.atlassian.net
```

Замініть `yourcompany.atlassian.net` на URL вашого Jira сайту.

### Або вручну:

```bash
forge install -e production
```

Вам буде запропоновано:
1. Вибрати продукт (виберіть **Jira**)
2. Ввести URL вашого Jira сайту (наприклад: `yourcompany.atlassian.net`)
3. Підтвердити встановлення (введіть `y`)

## Крок 5: Доступ до додатка

Після встановлення:
1. Відкрийте ваш Jira сайт
2. Знайдіть "AI News Aggregator" в навігації
3. Відкрийте сторінку для налаштування

## Troubleshooting

### Помилка "invalid app ARI"
- Переконайтеся, що ви виконали `forge register`
- Перевірте, що `app.id` в `manifest.yml` оновлено

### Помилки збірки
- Перевірте, що всі залежності встановлені: `npm install`
- Перевірте помилки TypeScript: `npm run build`

### Помилки деплою
- Перевірте авторизацію: `forge whoami`
- Перевірте дозволи в `manifest.yml`

