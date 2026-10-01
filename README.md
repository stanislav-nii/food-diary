# Food Diary (Capacitor / Android)

Мобильное приложение-дневник питания на Next.js, собранное как **полностью статическое**
и упакованное через **Capacitor** для Android. Серверная часть (Next.js Route Handlers
`/api/*` и файловое хранилище `fs`) удалена — все данные хранятся на устройстве
через `@capacitor/preferences`.

## Архитектура

- `next.config.ts` → `output: "export"` — сборка в статику в папку `out/`.
- `src/lib/localstore.ts` — обёртка над `@capacitor/preferences` (SQLite-backed на Android,
  localStorage в браузере). При первом запуске данные засеиваются из `public/seed-*.json`.
- `src/lib/api.ts` — локальный «API» (CRUD для meals / goals / products) вместо HTTP-запросов к `/api/*`.
- `capacitor.config.ts` — `webDir: "out"`, `appId: com.fooddiary.app`.
- `android/` — нативный Android-проект (создаётся командой `npx cap add android`).

## Скрипты

```bash
npm run dev          # локальная разработка в браузере (next dev)
npm run export       # статическая сборка в out/
npm run cap:sync     # export + npx cap sync android (копирует out/ в нативный проект)
npm run android      # cap:sync + открыть проект в Android Studio
npm run build:apk    # cap:sync + ./gradlew assembleDebug (нужен Android SDK)
```

## Сборка APK

1. Установите [Android Studio](https://developer.android.com/studio) (SDK + JDK 17+).
2. `npm install`
3. Если папки `android/` нет: `npx cap add android`
4. `npm run build:apk` — готовый APK появится в
   `android/app/build/outputs/apk/debug/app-debug.apk`.

Либо `npm run android` и запуск/сборка из Android Studio.

## Примечания

- Данные пользователя персистентны между запусками (Preferences = SQLite в WebView-домене приложения).
- Шрифты Inter/Material Symbols грузятся с Google Fonts; для полностью офлайн-режима
  их можно локазовать в `public/`.
