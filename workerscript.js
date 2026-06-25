// --- БЛОК FIREBASE PUSH-УВЕДОМЛЕНИЙ ---
const firebaseConfig = {
  apiKey: "AIzaSyC_TrbQ8QBkosbQk6-MFcNhonON8_rD1jg",
  authDomain: "psunotification-b8b39.firebaseapp.com",
  projectId: "psunotification-b8b39",
  storageBucket: "psunotification-b8b39.firebasestorage.app",
  messagingSenderId: "418203930365",
  appId: "1:418203930365:web:4a7d49a6f675bdc28c7894",
  measurementId: "G-BNM08047HR"
};

// Инициализируем только если библиотеки Firebase успешно загружены в index.html
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // Автоматический запрос прав при первом клике/взаимодействии с приложением
    async function initPushNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Разрешение на push-уведомления получено.');
                
                // Получаем уникальный токен телефона повара, используя ваш VAPID-ключ
                const token = await messaging.getToken({ 
                    vapidKey: 'BK0FHGQnbGWsAwIDpLbKEv31XF414gXIi6L2wgZhVfvwQe3MTRj4MEiqHObPgXdvG0E2LfHCUQIz3Fwbyzlx8o8' 
                });
                
                if (token) {
                    console.log('--- ТОКЕН ТЕЛЕФОНА ПОВАРА ДЛЯ GOOGLE SCRIPTS ---');
                    console.log(token);
                    console.log('------------------------------------------------');
                    alert("Скопируйте этот токен:\n\n" + token);
                    // Выведет токен в консоль браузера (F12 на ПК или через удаленную отладку)
                } else {
                    console.warn('Не удалось сгенерировать токен устройства.');
                }
            } else {
                console.warn('Повар отклонил запрос на уведомления.');
            }
        } catch (error) {
            console.error('Ошибка настройки Push-уведомлений:', error);
        }
    }

    // Запускаем процесс при любом первом клике поваром по экрану (чтобы браузер разрешил)
    document.addEventListener('click', () => {
        initPushNotifications();
    }, { once: true }); // Сработает ровно один раз
}

// --- ОСНОВНАЯ ЛОГИКА ВАШЕЙ КУХНИ ---
const API_URL = "https://script.google.com/macros/s/AKfycbzZn5mYK3MO3IuyOy_4Z0sC6sm9ykS9Imu_Oj_WwlIRZJhanCG3gSq7dSTBTEllMoje/exec";

let orders = [];
let currentTab = "active";

const ordersListContainer = document.getElementById('orders-list');
const activeCountBadge = document.getElementById('active-count');
const tabActiveBtn = document.getElementById('tab-active');
const tabArchiveBtn = document.getElementById('tab-archive');
const soundEffect = document.getElementById('notification-sound');
const clearShiftBtn = document.getElementById('clear-shift-btn');

// Часы в шапке
setInterval(() => {
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
}, 1000);

// Переключение вкладок «В работе» / «Архив»
if (tabActiveBtn) tabActiveBtn.addEventListener('click', () => { currentTab = "active"; toggleTabs(); });
if (tabArchiveBtn) tabArchiveBtn.addEventListener('click', () => { currentTab = "archive"; toggleTabs(); });

function toggleTabs() {
    if (tabActiveBtn) tabActiveBtn.classList.toggle('active', currentTab === "active");
    if (tabArchiveBtn) tabArchiveBtn.classList.toggle('active', currentTab === "archive");
    renderOrders();
}

// Загрузка заказов из вашей Гугл Таблицы
async function loadOrdersFromSheet() {
    try {
        const response = await fetch(API_URL);
        const fetchedOrders = await response.json();
        
        // Проверяем, появились ли новые заказы со статусом 'Новый'
        const hasNewIncoming = fetchedOrders.some(newOrd => 
            newOrd.status === 'Новый' && 
            !orders.some(oldOrd => oldOrd.id === newOrd.id)
        );

        // БЕЗОПАСНЫЙ ЗАПУСК ЗВУКА
        if (hasNewIncoming && orders.length > 0 && soundEffect) {
            try {
                let playPromise = soundEffect.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Воспроизведение звука ожидает взаимодействия пользователя с экраном.");
                    });
                }
            } catch (soundError) {
                console.log("Звук временно недоступен:", soundError);
            }
        }

        orders = fetchedOrders;
        renderOrders();
    } catch (error) {
        console.error("Ошибка синхронизации с Таблицей:", error);
        if (ordersListContainer) {
            ordersListContainer.innerHTML = `<p style="text-align:center; color:#f75a68; margin-top:40px;">Ошибка связи: ${error.message}</p>`;
        }
    }
}

// Генерация карточек заказов на экране смартфона
function renderOrders() {
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = '';
    
    // Фильтруем: во вкладке активных скрываем статусы 'Выдан' и 'В архиве'
    const filteredOrders = orders.filter(order => {
        const isActiveStatus = order.status !== "Выдан" && order.status !== "В архиве";
        return currentTab === "active" ? isActiveStatus : order.status === "Выдан";
    });

    // Счетчик активных заказов для вкладки
    const activeCount = orders.filter(o => o.status !== "Выдан" && o.status !== "В архиве").length;
    if (activeCountBadge) activeCountBadge.textContent = activeCount;

    if (filteredOrders.length === 0) {
        ordersListContainer.innerHTML = `<p style="text-align:center; color:#7c7c8a; margin-top:40px;">Заказов нет</p>`;
        return;
    }

    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        
        let cssStatus = 'status-new';
        let buttonHTML = '';
        
        if (order.status === 'Новый') {
            cssStatus = 'status-new';
            buttonHTML = `<button class="action-btn start-btn" onclick="changeStatus('${order.id}', 'Готовится')">Начать готовить</button>`;
        } else if (order.status === 'Готовится') {
            cssStatus = 'status-cooking';
            buttonHTML = `<button class="action-btn cooking-btn" onclick="changeStatus('${order.id}', 'Готов')">Готово! На выдачу</button>`;
        } else if (order.status === 'Готов') {
            cssStatus = 'status-ready';
            buttonHTML = `<button class="action-btn complete-btn" onclick="changeStatus('${order.id}', 'Выдан')">Выдать заказ</button>`;
        } else {
            cssStatus = 'status-archived';
            buttonHTML = `<span style="color:#7c7c8a; font-size:13px; font-weight:bold;">Выдан и закрыт</span>`;
        }

        card.className = `order-card ${cssStatus}`;

        const itemsHTML = order.composition ? order.composition.toString().split('\n')
            .filter(item => item.trim() !== '')
            .map(item => `<li>${item}</li>`).join('') : '';

        card.innerHTML = `
            <div class="card-header">
                <span class="order-number">Строка №${order.id}</span>
                <span class="order-time">${order.time || ''}</span>
            </div>
            <div class="customer-info">
                <p>👤 ${order.name || 'Неизвестно'}</p>
                ${order.phone ? `<p>📞 ${order.phone}</p>` : ''}
            </div>
            <div class="order-composition">
                <h4>Состав:</h4>
                <ul>${itemsHTML}</ul>
            </div>
            <div class="card-footer">
                <div class="order-total">Итого: <strong>${order.total || 0}</strong></div>
                ${buttonHTML}
            </div>
        `;
        ordersListContainer.appendChild(card);
    });
}

// Отправка нового статуса обратно в Гугл Таблицу
async function changeStatus(rowId, newStatus) {
    const order = orders.find(o => o.id.toString() === rowId.toString());
    if (order) {
        order.status = newStatus;
        renderOrders();
    }
    
    try {
        await fetch(`${API_URL}?row=${rowId}&status=${encodeURIComponent(newStatus)}`);
    } catch (e) {
        console.error("Не удалось обновить ячейку в таблице:", e);
    }
}

// Функция для закрытия смены и очистки экрана
async function clearShift() {
    const confirmClear = confirm("Вы уверены, что хотите закрыть смену? Все текущие заказы уйдут в архив и пропадут с экрана.");
    if (!confirmClear) return;

    if (ordersListContainer) {
        ordersListContainer.innerHTML = `<p style="text-align:center; color:#ff9000; margin-top:40px;">Архивация заказов... Пожалуйста, подождите.</p>`;
    }

    try {
        const response = await fetch(`${API_URL}?action=clearShift`);
        const result = await response.json();
        
        if (result.result === 'success') {
            alert("Смена успешно закрыта! Экран очищен.");
            await loadOrdersFromSheet();
        } else {
            alert("Ошибка при закрытии смены: " + result.message);
            await loadOrdersFromSheet();
        }
    } catch (error) {
        console.error("Ошибка запроса очистки смены:", error);
        alert("Не удалось связаться с таблицей для очистки смены.");
        await loadOrdersFromSheet();
    }
}

// ЖЕСТКАЯ ПРИВЯЗКА КЛИКА К КНОПКЕ ЗАКРЫТИЯ СМЕНЫ
if (clearShiftBtn) {
    clearShiftBtn.addEventListener('click', clearShift);
}

// Автообновление каждые 10 секунд
setInterval(loadOrdersFromSheet, 10000);

// Стартовый запуск при открытии приложения
loadOrdersFromSheet();
