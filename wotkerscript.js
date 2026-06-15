const API_URL = "https://script.google.com/macros/s/AKfycbwK1AACPqzcgJZFu_OmoJQiMfVD1A1uqlQnwhc9ZjBcyiWu0JW2xv1a8Fcc0r4X5QvH/exec";
//https://script.google.com/macros/s/AKfycbyqN9h84xK-PtWILRicM8p4bgkTL_jkVozTSHVyGFOKZOwSxAePT1miRZVBSZJek5RX/exec

let orders = [];
let currentTab = "active";

const ordersListContainer = document.getElementById('orders-list');
const activeCountBadge = document.getElementById('active-count');
const tabActiveBtn = document.getElementById('tab-active');
const tabArchiveBtn = document.getElementById('tab-archive');
const soundEffect = document.getElementById('notification-sound');

// Часы в шапке
setInterval(() => {
    document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}, 1000);

// Переключение вкладок «В работе» / «Архив»
tabActiveBtn.addEventListener('click', () => { currentTab = "active"; toggleTabs(); });
tabArchiveBtn.addEventListener('click', () => { currentTab = "archive"; toggleTabs(); });

function toggleTabs() {
    tabActiveBtn.classList.toggle('active', currentTab === "active");
    tabArchiveBtn.classList.toggle('active', currentTab === "archive");
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

        // Если прилетел новый заказ — включаем звук уведомления на кухне
        if (hasNewIncoming && orders.length > 0) {
            soundEffect.play().catch(e => console.log("Звук заблокирован до клика"));
        }

        orders = fetchedOrders;
        renderOrders();
    } catch (error) {
        console.error("Ошибка синхронизации с Таблицей:", error);
    }
}

// Генерация карточек заказов на экране смартфона
function renderOrders() {
    ordersListContainer.innerHTML = '';
    
    // Фильтруем: во вкладке активных показываем всё, кроме статуса 'Выдан'
    const filteredOrders = orders.filter(order => {
        return currentTab === "active" ? order.status !== "Выдан" : order.status === "Выдан";
    });

    // Бейдж с количеством активных заказов на кнопке
    const activeCount = orders.filter(o => o.status !== "Выдан").length;
    activeCountBadge.textContent = activeCount;

    if (filteredOrders.length === 0) {
        ordersListContainer.innerHTML = `<p style="text-align:center; color:#7c7c8a; margin-top:40px;">Заказов нет</p>`;
        return;
    }

    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        
        // Связываем русские статусы таблицы с классами CSS стилей оформления
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

        // Форматируем состав заказа (разбиваем сохраненный текст по строкам)
        const itemsHTML = order.composition.toString().split('\n')
            .filter(item => item.trim() !== '')
            .map(item => `<li>${item}</li>`).join('');

        card.innerHTML = `
            <div class="card-header">
                <span class="order-number">Строка №${order.id}</span>
                <span class="order-time">${order.time}</span>
            </div>
            <div class="customer-info">
                <p>👤 ${order.name}</p>
                ${order.phone ? `<p>📞 ${order.phone}</p>` : ''}
            </div>
            <div class="order-composition">
                <h4>Состав:</h4>
                <ul>${itemsHTML}</ul>
            </div>
            <div class="card-footer">
                <div class="order-total">Итого: <strong>${order.total}</strong></div>
                ${buttonHTML}
            </div>
        `;
        ordersListContainer.appendChild(card);
    });
}

// Отправка нового статуса обратно в Гугл Таблицу
async function changeStatus(rowId, newStatus) {
    // Сначала мгновенно меняем статус на экране, чтобы повар видел реакцию на нажатие
    const order = orders.find(o => o.id.toString() === rowId.toString());
    if (order) {
        order.status = newStatus;
        renderOrders();
    }
    
    // Передаем параметры строки и статуса в doGet веб-приложения
    try {
        await fetch(`${API_URL}?row=${rowId}&status=${encodeURIComponent(newStatus)}`);
    } catch (e) {
        console.error("Не удалось обновить ячейку в таблице:", e);
    }
}

// Автообновление каждые 10 секунд
setInterval(loadOrdersFromSheet, 10000);

// Стартовый запуск при открытии приложения
loadOrdersFromSheet();
