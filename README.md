# Утилита для TCP соединений


Утилита позволяет подключаться к TCP серверу как клиент, либо создать TCP сервер
для соединений с клиентами, отправлять сообщения, получать сообщения, отправлять файлы, получать файлы в
удобном интерфейсе.

Интерфейс программы написан на Angular

Бэкенд (TCP соединения) на Node.js

Десктоп реализован при помощи Electron
(В будущем планируется перейти на tauri для уменьшения размера приложения и уменьшения потребления оперативной памяти)

Самописанный макет: https://pixso.net/app/design/AbPaqkW3r1cnx7d2snJD-Q

## Установка и запуск

Самая актуальная ветка dev, желательно скачать её

Последовательность запуска на Windows

```bash
npm ci
```

```bash
cd frontend
```

```bash
npm ci
```

```bash
cd ..
```

```bash
npm run start
```

На Linux можно проще:

```bash
npm ci && cd frontend && npm ci && cd .. && npm run start
```

## Сборка .exe (Windows)

Один portable-файл без установщика:

```bash
npm ci && cd frontend && npm ci && cd ..
npm run dist
```

Готовый файл: `release/TCP-IP 1.0.0.exe`

Проверка production-сборки без упаковки:

```bash
npm run start:prod
```

