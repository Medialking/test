// Глобальные переменные
let currentUser = null;
let userData = null;
let score = 0;
let totalClicks = 0;
let highScore = 0;
let clicksPerSecond = 0;
let clickMultiplier = 1;
let autoClickerActive = false;
let autoClickerInterval = null;
let lastClickTime = Date.now();
let clicksInLastSecond = 0;
let cpsInterval = null;

// Элементы DOM
const usernameDisplay = document.getElementById('usernameDisplay');
const currentScoreElement = document.getElementById('currentScore');
const totalClicksElement = document.getElementById('totalClicks');
const highScoreElement = document.getElementById('highScore');
const clicksPerSecondElement = document.getElementById('clicksPerSecond');
const clickCharacter = document.getElementById('clickCharacter');
const clickEffect = document.getElementById('clickEffect');
const logoutBtn = document.getElementById('logoutBtn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const upgradeButtons = document.querySelectorAll('.upgrade-btn');

// Инициализация
document.addEventListener('DOMContentLoaded', initGame);

async function initGame() {
    // Проверяем авторизацию
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUser = user;
            await loadUserData();
            setupEventListeners();
            startGame();
            startCPSCalculation();
        } else {
            // Если пользователь не авторизован, перенаправляем на страницу авторизации
            window.location.href = 'auth.html';
        }
    });
}

async function loadUserData() {
    try {
        // Загружаем данные пользователя из базы данных
        const snapshot = await database.ref('users/' + currentUser.uid).once('value');
        userData = snapshot.val();
        
        if (userData) {
            // Обновляем отображение
            usernameDisplay.textContent = userData.username || currentUser.displayName || 'Игрок';
            score = userData.score || 0;
            totalClicks = userData.totalClicks || 0;
            highScore = userData.highScore || 0;
            clickMultiplier = userData.upgrades?.doublePoints ? 2 : 1;
            autoClickerActive = userData.upgrades?.autoClicker || false;
            
            updateUI();
            
            // Активируем автокликер если куплен
            if (autoClickerActive) {
                activateAutoClicker();
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showNotification('Ошибка загрузки данных', 'error');
    }
}

function setupEventListeners() {
    // Клик по персонажу
    clickCharacter.addEventListener('click', handleClick);
    
    // Выход из аккаунта
    logoutBtn.addEventListener('click', handleLogout);
    
    // Покупка улучшений
    upgradeButtons.forEach(button => {
        button.addEventListener('click', handleUpgradePurchase);
    });
}

function handleClick(event) {
    // Вычисляем позицию клика для эффекта
    const rect = clickCharacter.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Создаем эффект клика
    createClickEffect(x, y);
    
    // Обновляем счет
    const pointsEarned = 1 * clickMultiplier;
    score += pointsEarned;
    totalClicks++;
    
    // Обновляем рекорд
    if (score > highScore) {
        highScore = score;
    }
    
    // Обновляем статистику кликов в секунду
    clicksInLastSecond++;
    
    // Обновляем UI
    updateUI();
    
    // Сохраняем в базу данных
    saveGameData();
}

function createClickEffect(x, y) {
    const effect = clickEffect.cloneNode(true);
    effect.textContent = `+${clickMultiplier}`;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    effect.style.display = 'block';
    
    clickCharacter.appendChild(effect);
    
    // Удаляем эффект после анимации
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

function updateUI() {
    currentScoreElement.textContent = score.toLocaleString();
    totalClicksElement.textContent = totalClicks.toLocaleString();
    highScoreElement.textContent = highScore.toLocaleString();
    clicksPerSecondElement.textContent = clicksPerSecond.toFixed(1);
    
    // Обновляем состояние кнопок улучшений
    updateUpgradeButtons();
}

function updateUpgradeButtons() {
    upgradeButtons.forEach(button => {
        const cost = parseInt(button.getAttribute('data-cost'));
        const upgradeId = button.closest('.upgrade-item').id;
        
        // Проверяем, куплено ли уже улучшение
        let isPurchased = false;
        if (upgradeId === 'autoClickerUpgrade' && autoClickerActive) {
            isPurchased = true;
            button.textContent = 'Куплено';
            button.disabled = true;
        } else if (upgradeId === 'doublePointsUpgrade' && clickMultiplier > 1) {
            isPurchased = true;
            button.textContent = 'Куплено';
            button.disabled = true;
        } else {
            button.textContent = `Купить (${cost})`;
            button.disabled = score < cost;
        }
    });
}

async function handleUpgradePurchase(event) {
    const button = event.currentTarget;
    const cost = parseInt(button.getAttribute('data-cost'));
    const upgradeItem = button.closest('.upgrade-item');
    const upgradeId = upgradeItem.id;
    
    if (score < cost) {
        showNotification('Недостаточно очков!', 'error');
        return;
    }
    
    // Списываем стоимость
    score -= cost;
    
    // Активируем улучшение
    switch (upgradeId) {
        case 'autoClickerUpgrade':
            autoClickerActive = true;
            activateAutoClicker();
            showNotification('Автокликер активирован! +1 очко в секунду', 'success');
            break;
            
        case 'doublePointsUpgrade':
            clickMultiplier = 2;
            showNotification('Двойные очки активированы!', 'success');
            break;
    }
    
    // Обновляем UI
    updateUI();
    
    // Сохраняем в базу данных
    await saveGameData();
    
    // Обновляем информацию об улучшениях в базе данных
    const upgrades = {
        autoClicker: autoClickerActive,
        doublePoints: clickMultiplier > 1
    };
    
    await database.ref('users/' + currentUser.uid + '/upgrades').set(upgrades);
}

function activateAutoClicker() {
    if (autoClickerInterval) {
        clearInterval(autoClickerInterval);
    }
    
    autoClickerInterval = setInterval(() => {
        if (autoClickerActive) {
            // Автоматический клик
            score += 1 * clickMultiplier;
            totalClicks++;
            
            if (score > highScore) {
                highScore = score;
            }
            
            updateUI();
            saveGameData();
            
            // Создаем визуальный эффект
            createAutoClickEffect();
        }
    }, 1000);
}

function createAutoClickEffect() {
    const x = 100 + Math.random() * 50;
    const y = 100 + Math.random() * 50;
    
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${clickMultiplier}`;
    effect.style.left = x + 'px';
    effect.style.top = y + 'px';
    effect.style.color = '#2575fc';
    
    clickCharacter.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

function startCPSCalculation() {
    cpsInterval = setInterval(() => {
        clicksPerSecond = clicksInLastSecond;
        clicksInLastSecond = 0;
        updateUI();
    }, 1000);
}

async function saveGameData() {
    if (!currentUser) return;
    
    try {
        const gameData = {
            score: score,
            totalClicks: totalClicks,
            highScore: highScore,
            lastUpdated: new Date().toISOString()
        };
        
        await database.ref('users/' + currentUser.uid).update(gameData);
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
    }
}

async function handleLogout() {
    try {
        // Сохраняем данные перед выходом
        await saveGameData();
        
        // Выход из аккаунта
        await auth.signOut();
        
        // Перенаправляем на страницу авторизации
        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Ошибка выхода:', error);
        showNotification('Ошибка при выходе', 'error');
    }
}

function showNotification(message, type = 'info') {
    notificationText.textContent = message;
    
    // Устанавливаем цвет в зависимости от типа
    if (type === 'error') {
        notification.style.background = 'linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%)';
    } else if (type === 'success') {
        notification.style.background = 'linear-gradient(90deg, #4cd964 0%, #5ac8fa 100%)';
    } else {
        notification.style.background = 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)';
    }
    
    notification.classList.add('show');
    
    // Автоматически скрываем уведомление через 3 секунды
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Сохраняем данные при закрытии страницы
window.addEventListener('beforeunload', (event) => {
    saveGameData();
});

// Регулярное автосохранение каждые 30 секунд
setInterval(() => {
    saveGameData();
}, 30000);

// Анимация глаз персонажа
setInterval(() => {
    const eyes = document.querySelectorAll('.eye');
    eyes.forEach(eye => {
        const pupil = eye.querySelector('.pupil') || (() => {
            const pupil = document.createElement('div');
            pupil.className = 'pupil';
            pupil.style.cssText = `
                position: absolute;
                width: 15px;
                height: 15px;
                background: white;
                border-radius: 50%;
                top: 8px;
                left: 10px;
            `;
            eye.appendChild(pupil);
            return pupil;
        })();
        
        // Случайное движение зрачков
        const x = 5 + Math.random() * 10;
        const y = 5 + Math.random() * 10;
        pupil.style.left = x + 'px';
        pupil.style.top = y + 'px';
    });
}, 2000);