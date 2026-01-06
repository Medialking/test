const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const goToRegister = document.getElementById('goToRegister');
const goToLogin = document.getElementById('goToLogin');


loginTab.addEventListener('click', () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

registerTab.addEventListener('click', () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    registerTab.click();
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.click();
});


const passwordInput = document.getElementById('regPassword');
const passwordRequirements = {
    length: document.getElementById('reqLength'),
    uppercase: document.getElementById('reqUppercase'),
    lowercase: document.getElementById('reqLowercase'),
    number: document.getElementById('reqNumber'),
    special: document.getElementById('reqSpecial')
};

passwordInput.addEventListener('input', validatePassword);

function validatePassword() {
    const password = passwordInput.value;
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
    };
    

    for (const [key, element] of Object.entries(passwordRequirements)) {
        if (requirements[key]) {
            element.classList.add('valid');
            element.querySelector('i').className = 'fas fa-check-circle';
        } else {
            element.classList.remove('valid');
            element.querySelector('i').className = 'fas fa-circle';
        }
    }
    
    return Object.values(requirements).every(req => req === true);
}


const confirmPasswordInput = document.getElementById('regConfirmPassword');
const confirmPasswordError = document.getElementById('regConfirmPasswordError');

confirmPasswordInput.addEventListener('input', validateConfirmPassword);

function validateConfirmPassword() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword && password !== confirmPassword) {
        confirmPasswordError.textContent = 'Пароли не совпадают';
        return false;
    } else {
        confirmPasswordError.textContent = '';
        return true;
    }
}


registerBtn.addEventListener('click', async () => {
    const username = document.getElementById('regUsername').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    

    if (!username) {
        showError('regUsernameError', 'Введите имя пользователя');
        return;
    }
    
    if (!email) {
        showError('regEmailError', 'Введите email');
        return;
    }
    
    if (!validatePassword()) {
        showError('regPasswordError', 'Пароль не соответствует требованиям');
        return;
    }
    
    if (!validateConfirmPassword()) {
        return;
    }
    
    try {

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Обновляем displayName
        await user.updateProfile({
            displayName: username
        });
        

        const userData = {
            username: username,
            email: email,
            score: 0,
            totalClicks: 0,
            highScore: 0,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            upgrades: {
                autoClicker: false,
                doublePoints: false
            }
        };
        
        await database.ref('users/' + user.uid).set(userData);
        

        showNotification('Регистрация успешна! Перенаправление...');
        

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        showError('regEmailError', getErrorMessage(error.code));
    }
});


loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showError('loginUsernameError', 'Заполните все поля');
        return;
    }
    
    try {
        const email = username + '@kinolok.com'; 
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
   
        await database.ref('users/' + user.uid + '/lastLogin').set(new Date().toISOString());
        

        showNotification('Вход выполнен! Перенаправление...');
        

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Ошибка входа:', error);
        
        try {

            const snapshot = await database.ref('users').orderByChild('username').equalTo(username).once('value');
            
            if (snapshot.exists()) {
                const users = snapshot.val();
                const userId = Object.keys(users)[0];
                const userEmail = users[userId].email;
                

                const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
                const user = userCredential.user;
                

                await database.ref('users/' + user.uid + '/lastLogin').set(new Date().toISOString());
                
                showNotification('Вход выполнен! Перенаправление...');
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                showError('loginUsernameError', 'Неверное имя пользователя или пароль');
            }
        } catch (secondError) {
            showError('loginUsernameError', 'Неверное имя пользователя или пароль');
        }
    }
});


auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.endsWith('auth.html')) {

        window.location.href = 'index.html';
    }
});


function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.color = '#ff6b6b';
}

function showNotification(message) {

    const notification = document.createElement('div');
    notification.className = 'notification show';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.5s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'Этот email уже зарегистрирован',
        'auth/invalid-email': 'Неверный формат email',
        'auth/operation-not-allowed': 'Регистрация отключена',
        'auth/weak-password': 'Пароль слишком слабый',
        'auth/user-not-found': 'Пользователь не найден',
        'auth/wrong-password': 'Неверный пароль',
        'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже'
    };
    
    return errorMessages[errorCode] || 'Произошла ошибка. Попробуйте еще раз.';
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);