
// Mock Firebase для локальной разработки
console.log('🔥 Используется локальная версия Firebase');

window.firebase = {
    initializeApp: function(config) {
        console.log('Firebase инициализирован с конфигом:', config);
        return {
            name: 'KinoLok-Local',
            options: config
        };
    },
    
    auth: function() {
        console.log('Используется локальная аутентификация');
        return {
            currentUser: null,
            
            createUserWithEmailAndPassword: function(email, password) {
                console.log('Создание пользователя:', email);
                return Promise.resolve({
                    user: {
                        uid: 'local-user-' + Date.now(),
                        email: email,
                        updateProfile: function(data) {
                            console.log('Профиль обновлен:', data);
                            return Promise.resolve();
                        }
                    }
                });
            },
            
            signInWithEmailAndPassword: function(email, password) {
                console.log('Вход пользователя:', email);
                return Promise.resolve({
                    user: {
                        uid: 'local-user-123',
                        email: email,
                        displayName: 'Локальный игрок'
                    }
                });
            },
            
            signOut: function() {
                console.log('Выход из системы');
                return Promise.resolve();
            },
            
            onAuthStateChanged: function(callback) {
                console.log('Наблюдатель авторизации установлен');
                // Имитируем авторизованного пользователя
                setTimeout(() => {
                    callback({
                        uid: 'local-user-123',
                        email: 'test@kinolok.com',
                        displayName: 'Локальный игрок'
                    });
                }, 100);
                return () => console.log('Наблюдатель удален');
            }
        };
    },
    
    database: function() {
        console.log('Используется локальная база данных');
        const localData = {
            users: {
                'local-user-123': {
                    username: 'Локальный игрок',
                    email: 'test@kinolok.com',
                    score: 100,
                    totalClicks: 50,
                    highScore: 100,
                    lastLogin: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    upgrades: {
                        autoClicker: false,
                        doublePoints: false
                    }
                }
            }
        };
        
        return {
            ref: function(path) {
                console.log('Запрос к базе данных:', path);
                
                return {
                    set: function(data) {
                        console.log('Данные сохранены:', data);
                        return Promise.resolve();
                    },
                    
                    update: function(data) {
                        console.log('Данные обновлены:', data);
                        return Promise.resolve();
                    },
                    
                    once: function(event) {
                        console.log('Чтение данных по пути:', path);
                        
                        // Извлекаем данные из локального хранилища
                        const parts = path.split('/').filter(p => p);
                        let result = localData;
                        
                        for (const part of parts) {
                            if (result && result[part] !== undefined) {
                                result = result[part];
                            } else {
                                result = null;
                                break;
                            }
                        }
                        
                        return Promise.resolve({
                            val: function() {
                                return result;
                            },
                            exists: function() {
                                return result !== null;
                            }
                        });
                    },
                    
                    orderByChild: function(child) {
                        console.log('Сортировка по:', child);
                        return {
                            equalTo: function(value) {
                                console.log('Поиск где', child, '=', value);
                                
                                return {
                                    once: function(event) {
                                        // Простой поиск по значению
                                        const found = {};
                                        if (child === 'username' && value === 'Локальный игрок') {
                                            found['local-user-123'] = localData.users['local-user-123'];
                                        }
                                        
                                        return Promise.resolve({
                                            val: function() {
                                                return found;
                                            },
                                            exists: function() {
                                                return Object.keys(found).length > 0;
                                            }
                                        });
                                    }
                                };
                            }
                        };
                    }
                };
            }
        };
    }
};

console.log('✅ Локальный Firebase готов к работе!');
    