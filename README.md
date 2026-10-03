# LOTTO
1. Firebase Console: создайте проект → Authentication (Email/Password) → Firestore Database.
2. Скопируйте `.env.example` в `.env` и вставьте ключи веб-приложения.
3. Firestore → Rules: вставьте содержимое `firestore.rules`.
5. `npm install && npm run dev`
Админ: зарегистрируйтесь с именем Rusnac и фамилией Lilian.
Автоудаление отключено: удаление участников делает админ кнопками 🗑 и «Удалить всех».

## Фон сайта и падающие элементы (админ)
Меню → «🖼 Фон» (видно только админу). Настройки хранятся в Firestore (`config/theme`) и применяются у всех пользователей.
- Фото: ссылка из интернета (прямая ссылка на .jpg/.png/.webp) или с Google Диска (доступ «Все, у кого есть ссылка»).
- Одно фото для ПК/широких экранов и (необязательно) другое для вертикальных экранов/телефонов; затемнение, размытие, привязка (верх/центр/низ).
- Падающие элементы: в каждой строке эмодзи/символы либо ссылка на фото; галочка «Использовать мои элементы для всех».
- ВАЖНО: заново вставьте `firestore.rules` в Firebase Console → Firestore → Rules и нажмите Publish.

## Публикация на Vercel
1. НЕ загружайте папку `node_modules` (она вызывает ошибку `vite: Permission denied`, код 126). В архиве её нет — не запускайте `npm install` перед загрузкой, либо удалите папку `node_modules` и `dist`.
2. Самый надёжный способ: залить проект в GitHub (файл `.gitignore` уже исключает node_modules) → Vercel → Add New → Project → выбрать репозиторий. Либо перетащить папку `lotto` (без node_modules) в Vercel.
3. Vercel → Project → Settings → Environment Variables: добавьте 6 переменных из `.env` (VITE_FB_API_KEY, VITE_FB_AUTH_DOMAIN, VITE_FB_PROJECT_ID, VITE_FB_STORAGE_BUCKET, VITE_FB_SENDER_ID, VITE_FB_APP_ID) и сделайте Redeploy.
4. Firebase Console → Authentication → Settings → Authorized domains: добавьте домен вида `ваш-проект.vercel.app`, иначе вход не заработает.
5. Firebase → Firestore → Rules: вставьте `firestore.rules` и нажмите Publish (нужно для сохранения фона).
