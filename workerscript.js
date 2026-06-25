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

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    async function initPushNotifications() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const serviceWorkerRegistration = await navigator.serviceWorker.register('/workercanteen/firebase-messaging-sw.js');
                
                if (!serviceWorkerRegistration.active) {
                    await new Promise((resolve) => {
                        const interval = setInterval(() => {
                            if (serviceWorkerRegistration.active) {
                                clearInterval(interval);
                                resolve();
                            }
                        }, 100);
                    });
                }
                
                // Просто регистрируем токен в системе Firebase без вывода окон
                await messaging.getToken({ 
                    serviceWorkerRegistration: serviceWorkerRegistration,
                    vapidKey: 'BK0FHGQnbGWsAwIDpLbKEv31XF414gXIi6L2wgZhVfvwQe3MTRj4MEiqHObPgXdvG0E2LfHCUQIz3Fwbyzlx8o8' 
                });
            }
        } catch (error) {
            console.error('Ошибка настройки Push-уведомлений:', error);
        }
    }

    document.addEventListener('click', () => {
        initPushNotifications();
    }, { once: true });
}

// --- ОСНОВНАЯ ЛОГИКА ВАШЕЙ КУХНИ ---
const API_URL = "https://script.google.com/macros/s/AKfycbziVke5lF-FgR9u-W5HhbpcZr3Mpa7UB8I9dS2F6H9P4U_bLR_5mTGgdV9vyy48Fc-n/exec";

let orders = [];
let currentTab = "active";

const ordersListContainer = document.getElementById('orders-list');
const activeCountBadge = document.getElementById('active-count');
const tabActiveBtn = document.getElementById('tab-active');
const tabArchiveBtn = document.getElementById('tab-archive');
const soundEffect = document.getElementById('notification-sound');
const clearShiftBtn = document.getElementById('clear-shift-btn');

setInterval(() => {
    const clockEl = document.getElementById('clock');
    if (clockEl) clockEl.textContent = new Date().toLocaleTimeString();
}, 1000);

if (tabActiveBtn) tabActiveBtn.addEventListener('click', () => { currentTab = "active"; toggleTabs(); });
if (tabArchiveBtn) tabArchiveBtn.addEventListener('click', () => { currentTab = "archive"; toggleTabs(); });

function toggleTabs() {
    if (tabActiveBtn) tabActiveBtn.classList.toggle('active', currentTab === "active");
    if (tabArchiveBtn) tabArchiveBtn.classList.toggle('active', currentTab === "archive");
    renderOrders();
}

async function loadOrdersFromSheet() {
    try {
        const response = await fetch(API_URL);
        const fetchedOrders = await response.json();
        
        const hasNewIncoming = fetchedOrders.some(newOrd => 
            newOrd.status === 'Новый' && 
            !orders.some(oldOrd => oldOrd.id === newOrd.id)
        );

        if (hasNewIncoming && orders.length > 0 && soundEffect) {
            try {
                let playPromise = soundEffect.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("Ожидание взаимодействия со звуком.");
                    });
                }
            } catch (soundError) {
                console.log("Звук недоступен:", soundError);
            }
        }

        orders = fetchedOrders;
        renderOrders();
    } catch (error) {
        console.error("Ошибка синхронизации:", error);
    }
}

function renderOrders() {
    if (!ordersListContainer) return;
    ordersListContainer.innerHTML = '';
    
    const filteredOrders = orders.filter(order => {
        const isActiveStatus = order.status !== "Выдан" && order.status !== "В архиве";
        return currentTab === "active" ? isActiveStatus : order.status === "Выдан";
    });

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

async function changeStatus(rowId, newStatus) {
    const order = orders.find(o => o.id.toString() === rowId.toString());
    if (order) {
        order.status = newStatus;
        renderOrders();
    }
    try {
        await fetch(`${API_URL}?row=${rowId}&status=${encodeURIComponent(newStatus)}`);
    } catch (e) {
        console.error("Ошибка обновления статуса:", e);
    }
}

async function clearShift() {
    const confirmClear = confirm("Вы уверены, что хотите закрыть смену?");
    if (!confirmClear) return;

    try {
        const response = await fetch(`${API_URL}?action=clearShift`);
        const result = await response.json();
        if (result.result === 'success') {
            alert("Смена закрыта!");
            await loadOrdersFromSheet();
        }
    } catch (error) {
        console.error("Ошибка:", error);
    }
}

if (clearShiftBtn) clearShiftBtn.addEventListener('click', clearShift);
setInterval(loadOrdersFromSheet, 10000);
loadOrdersFromSheet();
