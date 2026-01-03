// Конфигурация (замените на свои данные)
const CONFIG = {
    TELEGRAM_BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN', // Ваш токен бота
    TELEGRAM_CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID', // ID чата/канала
    GOOGLE_SCRIPT_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL' // URL Google Apps Script
};

// DOM элементы
const form = document.getElementById('applicationForm');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const successModal = document.getElementById('successModal');
const closeModalBtn = previewModal.querySelector('.close');
const confirmSubmitBtn = document.getElementById('confirmSubmit');
const closeSuccessBtn = document.getElementById('closeSuccess');
const experienceTextarea = document.getElementById('experience');
const expCountSpan = document.getElementById('expCount');

// Подсчет слов
experienceTextarea.addEventListener('input', function() {
    const words = this.value.trim().split(/\s+/).filter(word => word.length > 0);
    expCountSpan.textContent = words.length;
    expCountSpan.className = words.length >= 20 ? 'valid' : 'invalid';
});

// Предварительный просмотр
previewBtn.addEventListener('click', function() {
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const previewHTML = generatePreviewHTML(formData);
    document.getElementById('previewContent').innerHTML = previewHTML;
    previewModal.style.display = 'flex';
});

// Закрытие модальных окон
closeModalBtn.addEventListener('click', () => {
    previewModal.style.display = 'none';
});

closeSuccessBtn.addEventListener('click', () => {
    successModal.style.display = 'none';
    form.reset();
    expCountSpan.textContent = '0';
});

// Клик вне модального окна
window.addEventListener('click', (e) => {
    if (e.target === previewModal) {
        previewModal.style.display = 'none';
    }
    if (e.target === successModal) {
        successModal.style.display = 'none';
        form.reset();
        expCountSpan.textContent = '0';
    }
});

// Подтверждение отправки
confirmSubmitBtn.addEventListener('click', () => {
    previewModal.style.display = 'none';
    submitApplication();
});

// Отправка формы
form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitApplication();
});

// Генерация HTML для предпросмотра
function generatePreviewHTML(formData) {
    const data = Object.fromEntries(formData.entries());
    
    return `
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-gamepad"></i> Никнейм:</div>
            <div class="preview-value">${escapeHTML(data.nickname)}</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-birthday-cake"></i> Возраст:</div>
            <div class="preview-value">${escapeHTML(data.age)} лет</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-hourglass-half"></i> Опыт на сервере:</div>
            <div class="preview-value">${escapeHTML(data.playtime)}</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-calendar-alt"></i> Доступное время:</div>
            <div class="preview-value">${escapeHTML(data.worktime)}</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-history"></i> Опыт хелперства:</div>
            <div class="preview-value">${escapeHTML(data.experience)}</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-user-edit"></i> О себе:</div>
            <div class="preview-value">${escapeHTML(data.description)}</div>
        </div>
        <div class="preview-item">
            <div class="preview-label"><i class="fas fa-star"></i> Почему вы:</div>
            <div class="preview-value">${escapeHTML(data.whyyou)}</div>
        </div>
    `;
}

// Отправка заявки
async function submitApplication() {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Проверка минимального количества слов
    const experienceWords = data.experience.trim().split(/\s+/).filter(word => word.length > 0);
    if (experienceWords.length < 20) {
        alert('Пожалуйста, опишите опыт хелперства более подробно (минимум 20 слов)');
        experienceTextarea.focus();
        return;
    }
    
    // Добавляем дату отправки
    data.timestamp = new Date().toLocaleString('ru-RU');
    data.status = 'Новая';
    
    try {
        showLoading();
        
        // Отправляем в Telegram
        await sendToTelegram(data);
        
        // Отправляем в Google Sheets
        await sendToGoogleSheets(data);
        
        // Показываем сообщение об успехе
        previewModal.style.display = 'none';
        successModal.style.display = 'flex';
        
    } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте позже.');
    } finally {
        hideLoading();
    }
}

// Отправка в Telegram
async function sendToTelegram(data) {
    const message = formatTelegramMessage(data);
    const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await axios.post(url, {
        chat_id: CONFIG.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
    });
    
    return response.data;
}

// Отправка в Google Sheets через Google Apps Script
async function sendToGoogleSheets(data) {
    if (!CONFIG.GOOGLE_SCRIPT_URL || CONFIG.GOOGLE_SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL') {
        console.log('Google Sheets интеграция не настроена');
        return;
    }
    
    const response = await axios.post(CONFIG.GOOGLE_SCRIPT_URL, data);
    return response.data;
}

// Форматирование сообщения для Telegram
function formatTelegramMessage(data) {
    return `
<b>🎮 НОВАЯ ЗАЯВКА НА ХЕЛПЕРА</b>

<b>👤 Никнейм:</b> ${escapeHTML(data.nickname)}
<b>🎂 Возраст:</b> ${escapeHTML(data.age)} лет
<b>⏱️ Опыт на сервере:</b> ${escapeHTML(data.playtime)}
<b>📅 Доступное время:</b> ${escapeHTML(data.worktime)}
<b>📝 Статус:</b> Новая заявка
<b>📅 Дата:</b> ${data.timestamp}

<b>💼 Опыт хелперства:</b>
${escapeHTML(data.experience)}

<b>👤 О себе:</b>
${escapeHTML(data.description)}

<b>⭐ Почему кандидат:</b>
${escapeHTML(data.whyyou)}

<b>📋 ID заявки:</b> ${generateApplicationId(data.nickname)}
    `;
}

// Вспомогательные функции
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateApplicationId(nickname) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    const nickPart = nickname.substr(0, 3).toUpperCase();
    return `HELPER-${nickPart}-${timestamp}-${random}`;
}

function showLoading() {
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = originalText;
}

function hideLoading() {
    const submitBtn = document.querySelector('.submit-btn');
    if (submitBtn.dataset.originalText) {
        submitBtn.innerHTML = submitBtn.dataset.originalText;
        submitBtn.disabled = false;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    console.log('Система подачи заявок на хелпера Jojoland инициализирована');
});
