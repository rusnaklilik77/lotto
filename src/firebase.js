import {initializeApp} from 'firebase/app';import {getAuth} from 'firebase/auth';import {getFirestore} from 'firebase/firestore';
const e=import.meta.env;
// Значения берутся из переменных окружения (Vercel → Environment Variables).
// Если их нет — используются запасные (веб-ключи Firebase не секретные, они и так видны в браузере).
const cfg={apiKey:e.VITE_FB_API_KEY||'AIzaSyCZrRl8qrkvwQbcvjPs9ewcU8vh3Y_Wyos',authDomain:e.VITE_FB_AUTH_DOMAIN||'lotto-90c23.firebaseapp.com',projectId:e.VITE_FB_PROJECT_ID||'lotto-90c23',storageBucket:e.VITE_FB_STORAGE_BUCKET||'lotto-90c23.firebasestorage.app',messagingSenderId:e.VITE_FB_SENDER_ID||'1024588455069',appId:e.VITE_FB_APP_ID||'1:1024588455069:web:3ae175efaf148d63f5c874'};
let auth=null,db=null,fbError='';
// Ошибка Firebase больше не роняет весь сайт (чёрный экран) — показываем понятное сообщение.
try{const app=initializeApp(cfg);auth=getAuth(app);db=getFirestore(app)}catch(x){fbError=String(x.code||x.message||x);console.error('Firebase init failed',x)}
export {auth,db,fbError};
