// Импортируем официальные фоновые библиотеки Firebase
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Наша конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC_TrbQ8QBkosbQk6-MFcNhonON8_rD1jg",
  authDomain: "psunotification-b8b39.firebaseapp.com",
  projectId: "psunotification-b8b39",
  storageBucket: "psunotification-b8b39.firebasestorage.app",
  messagingSenderId: "418203930365",
  appId: "1:418203930365:web:4a7d49a6f675bdc28c7894",
  measurementId: "G-BNM08047HR"
};

// Инициализируем Firebase внутри сервис-воркера
firebase.initializeApp(firebaseConfig);

// Создаем фоновый обработчик сообщений
const messaging = firebase.messaging();

// Логика обработки уведомлений, когда вкладка кухни закрыта или свернута
messaging.onBackgroundMessage((payload) => {
  console.log('Получено push-уведомление в фоне: ', payload);

  const notificationTitle = payload.notification.title || 'Новый заказ!';
  const notificationOptions = {
    body: payload.notification.body || 'Проверьте экран кухни.',
    icon: './icon.png' // опционально, если добавите иконку в корень
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
