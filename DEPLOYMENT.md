# Deployment Instructions

## Крок 1: Реєстрація додатка

Для реєстрації додатка виконайте в терміналі:

```bash
cd "/Users/igorhutsalyuk/Desktop/AI Hub"
forge register
```

Коли система запитає назву додатка, введіть:
```
AI News Aggregator
```

Після реєстрації `app.id` в `manifest.yml` буде автоматично оновлено.

## Крок 2: Збірка додатка

```bash
forge build
```

Якщо є помилки лінтера, використайте:
```bash
forge build --no-verify
```

## Крок 3: Деплой в продакшн

```bash
forge deploy -e production
```

## Крок 4: Встановлення на Jira сайт

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

