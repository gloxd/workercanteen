// Память приложения (Массив текущих заказов)
let orders = [
    {
        id: 142,
        time: "12:30",
        timestamp: Date.now() - 300000, // 5 минут назад
        client: "Иван Иванов (Студент)",
        phone: "+7 (999) 123-45-67",
        total: 214,
        status: "new", // new, cooking, ready, archived
        items: [
            { name: "Блины домашние", count: 2 },
            { name: "Суп-пюре сырный с гренками", count: 1 },
            { name: "Пюре картофельное", count: 1 }
        ]
    },
    {
        id: 141,
        time: "12:15",
        timestamp: Date.now() - 900000,
        client: "Смирнова О.Н. (Преподаватель)",
        phone: "+7 (900) 555-55-55",
        total: 137,
        status: "ready",
        items: [
            { name: "Салат «Фреш» с бужениной", count: 1 },
            { name: "Рис отварной", count: 1 }
        ]
    }
];

let currentTab = "active"; // active или archive

// DOM Элементы
const ordersListContainer = document.getElementById('orders-list');
const activeCountBadge = document.getElementById('active-count');
const tabActiveBtn = document.getElementById('tab-active');
const tabArchiveBtn = document.getElementById('tab-archive');
const soundEffect = document.getElementById('notification-sound');

// Часы в шапке панели
setInterval(() => {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString();
}, 1000);

// Переключение табов
tabActiveBtn.addEventListener('click', () => {
    currentTab = "active";
    tabActiveBtn.classList.add('active');
    tabArchiveBtn.classList.remove('active');
    renderOrders();
});

tabArchiveBtn.addEventListener('click', () => {
    currentTab = "archive";
    tabArchiveBtn.classList.add('active');
    tabActiveBtn.classList.remove('active');
    renderOrders();
});

// Функция отрисовки карточек на экране смартфона
function renderOrders() {
    ordersListContainer.innerHTML = '';
    
    // Фильтруем заказы под выбранный экран
    const filteredOrders = orders.filter(order => {
        if (currentTab === "active") {
            return order.status !== "archived";
        } else {
            return order.status === "archived";
        }
    });

    // Считаем количество активных для бейджа
    const activeCount = orders.filter(o => o.status !== "archived").length;
    activeCountBadge.textContent = activeCount;

    if (filteredOrders.length === 0) {
        ordersListContainer.innerHTML = `<p style="text-align:center; color:#7c7c8a; margin-top:40px;">Заказов в этой категории нет</p>`;
        return;
    }

    // Генерируем HTML для каждой карточки
    filteredOrders.forEach(order => {
        const card = document.createElement('div');
        card.className = `order-card status-${order.status}`;
        
        // Определяем кнопку в зависимости от текущего шага производства
        let buttonHTML = '';
        if (order.status === 'new') {
            buttonHTML = `<button class="action-btn start-btn" onclick="changeStatus(${order.id}, 'cooking')">Начать готовить</button>`;
        } else if (order.status === 'cooking') {
            buttonHTML = `<button class="action-btn cooking-btn" onclick="changeStatus(${order.id}, 'ready')">Готово! На выдачу</button>`;
        } else if (order.status === 'ready') {
            buttonHTML = `<button class="action-btn complete-btn" onclick="changeStatus(${order.id}, 'archived')">Выдать заказ</button>`;
        } else {
            buttonHTML = `<span style="color:#7c7c8a; font-size:13px; font-weight:bold;">Выдан и закрыт</span>`;
        }

        // Состав блюд
        const itemsHTML = order.items.map(item => `
            <li><span class="item-count">${item.count} x</span> ${item.name}</li>
        `).join('');

        card.innerHTML = `
            <div class="card-header">
                <span class="order-number">Заказ №${order.id}</span>
                <span class="order-time">${order.time}</span>
            </div>
            <div class="customer-info">
                <p>👤 ${order.client}</p>
                ${order.phone ? `<p>📞 ${order.phone}</p>` : ''}
            </div>
            <div class="order-composition">
                <h4>Состав:</h4>
                <ul>${itemsHTML}</ul>
            </div>
            <div class="card-footer">
                <div class="order-total">Итого: <strong>${order.total} ₽</strong></div>
                ${buttonHTML}
            </div>
        `;
        
        ordersListContainer.appendChild(card);
    });
}

// Изменение статуса заказа при клике работником на кнопку
function changeStatus(orderId, newStatus) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        renderOrders();
    }
}

// Имитация падения нового заказа с сайта студентов (для теста)
document.getElementById('mock-new-order-btn').addEventListener('click', () => {
    const nextId = Math.floor(Math.random() * 100) + 150;
    const now = new Date();
    
    const mockOrder = {
        id: nextId,
        time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        timestamp: Date.now(),
        client: "Петров П.П. (Студент)",
        phone: "+7 (911) 999-88-77",
        total: 105,
        status: "new",
        items: [
            { name: "Шницель Полесский", count: 1 },
            { name: "Рис отварной", count: 1 }
        ]
    };
    
    orders.unshift(mockOrder); // Добавляем наверх списка
    
    // Включаем громкий звук на кухне, чтобы повар отвлекся и посмотрел на экран
    soundEffect.play().catch(e => console.log("Звук заблокирован браузером до первого клика"));
    
    renderOrders();
});

// Первичный запуск экрана при загрузке на смартфоне
renderOrders();