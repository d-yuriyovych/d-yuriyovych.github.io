(function() {
    'use strict';
    Lampa.Platform.tv();

    // Іконки
    var icon_server = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>';
    var icon_reset  = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';

    var servers = [
        { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    var timer_redirect;

    // --- УТИЛІТИ ---

    function normalizeUrl(url) {
        if (!url) return '';
        // Видаляємо протоколи, www і слеші в кінці для чистого порівняння доменів
        return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0].toLowerCase();
    }

    // Універсальна функція перевірки доступності
    // Використовує fetch mode: 'no-cors'. Це дозволяє перевірити сам факт з'єднання з сервером,
    // ігноруючи CORS політики і наявність конкретних файлів (favicon, etc).
    function checkOnline(url, callback) {
        if (!url || url === '-') return callback(true);

        var clean_url = normalizeUrl(url);
        // Визначаємо протокол.
        // УВАГА: Якщо ми на HTTPS, пінгувати HTTP сервер браузер не дасть (Mixed Content).
        // Тому ми пробуємо підлаштуватися, але якщо протоколи різні - пінг може не пройти, хоча редірект спрацює.
        var targetProtocol = (url.indexOf('https') === 0) ? 'https://' : 'http://';
        
        // Якщо ми на HTTPS, а ціль HTTP - fetch впаде одразу. 
        // Але ми спробуємо, бо деякі WebOS дозволяють це.
        
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 4000); // 4 сек таймаут

        fetch(targetProtocol + clean_url + '/', { 
            method: 'HEAD', 
            mode: 'no-cors', // Головна фішка: не чекаємо тіла відповіді, тільки статус мережі
            signal: controller.signal 
        })
        .then(function() {
            clearTimeout(timeoutId);
            callback(true); // Успіх (сервер відповів хоч щось)
        })
        .catch(function(err) {
            clearTimeout(timeoutId);
            // Якщо помилка - це або таймаут, або сервер лежить, або блокування Mixed Content
            console.log('Ping failed for:', clean_url, err);
            callback(false); 
        });
    }

    // --- КНОПКА ПОРЯТУНКУ (ЛІВИЙ ВЕРХНІЙ КУТ) ---
    // Вона додається завжди і дозволяє скасувати редірект або змінити сервер
    function renderRescueButton() {
        if ($('.rescue-server-btn').length) return;

        // Створюємо кнопку максимально незалежно від верстки Лампи
        var btn = $('<div class="rescue-server-btn" style="position:absolute; top:15px; left:90px; z-index:9999; cursor:pointer; background:rgba(0,0,0,0.5); border-radius:50%; padding:8px; border: 1px solid rgba(255,255,255,0.2);">' + icon_server + '</div>');
        
        // Для мобілок і ТБ - адаптація позиції
        if(Lampa.Platform.is('android') || Lampa.Platform.screen('mobile')) {
            btn.css({top: '10px', left: '60px'});
        }

        btn.on('hover:enter click', function() {
            // При кліку показуємо діалог вибору
            Lampa.Select.show({
                title: 'Швидка зміна сервера',
                items: [
                    { title: 'Скасувати авто-перехід', action: 'reset' },
                    { title: 'Відкрити налаштування', action: 'settings' }
                ],
                onSelect: function(a) {
                    if(a.action === 'reset') {
                        Lampa.Storage.set('location_server', '-');
                        Lampa.Noty.show('Авто-перехід вимкнено. Перезавантажте сторінку.');
                        setTimeout(function(){ window.location.reload(); }, 1500);
                    } else {
                        Lampa.Settings.open();
                    }
                }
            });
        });

        // Додаємо прямо в body або в head__actions якщо існує
        if($('.head__actions').length) {
            btn.css('position', 'static'); // Якщо вбудовуємось в дизайн
            btn.addClass('head__action selector');
            $('.head__actions').prepend(btn);
        } else {
            $('body').append(btn); // Аварійний варіант
        }
    }

    function startMe() {
        var current_host = normalizeUrl(window.location.hostname);
        var saved_server = Lampa.Storage.get('location_server');
        var saved_norm   = normalizeUrl(saved_server);

        // --- ЛОГІКА РЕДІРЕКТУ ---
        // Перевіряємо, чи треба кудись йти
        if (saved_server && saved_server !== '-' && saved_norm !== current_host) {
            
            // Захист від зациклення через GET параметр
            if (window.location.search.indexOf('redirect=1') !== -1) {
                Lampa.Noty.show('Виявлено петлю редіректу. Авто-перехід скасовано.');
                Lampa.Storage.set('location_server', '-');
            } else {
                // Відображаємо таймер на 3 секунди
                var count = 3;
                var noty = Lampa.Noty.show('Перехід на ' + saved_server + ' через ' + count + 'с...', {time: 4000});
                
                // Створюємо інтерфейс для скасування прямо в повідомленні (якщо Lampa дозволяє)
                // Або просто чекаємо натискання кнопки порятунку (яку ми зараз намалюємо)
                
                timer_redirect = setInterval(function() {
                    count--;
                    // Оновлення тексту повідомлення не завжди працює в усіх версіях, тому просто чекаємо
                    if(count <= 0) {
                        clearInterval(timer_redirect);
                        // ФІНАЛЬНИЙ СТРИБОК
                        // Визначаємо протокол цільового сервера (краще зберігати його повним, але якщо ні - здогадуємось)
                        var protocol = (saved_server.indexOf('http') === 0) ? '' : 'http://'; 
                        // Якщо поточний сайт HTTPS, а ми йдемо на HTTP - браузер може видати ворнінг, але перехід дозволить
                        window.location.href = protocol + saved_server + (saved_server.indexOf('?') !== -1 ? '&' : '?') + 'redirect=1';
                    }
                }, 1000);

                // Додаємо кнопку скасування в інтерфейс
                Lampa.Select.show({
                    title: 'Автоматичний перехід',
                    items: [{ title: 'Скасувати перехід', subtitle: 'Залишитись на ' + current_host }],
                    onSelect: function() {
                        clearInterval(timer_redirect);
                        Lampa.Storage.set('location_server', '-');
                        Lampa.Noty.show('Скасовано');
                        Lampa.Controller.toggle('content'); // Повертаємо фокус
                    },
                    onBack: function() {
                        // Якщо натиснули назад - не скасовуємо, просто закриваємо меню
                    }
                });
            }
        }

        // --- НАЛАШТУВАННЯ ---
        Lampa.SettingsApi.addComponent({ component: 'location_redirect', name: 'Зміна сервера', icon: icon_server });

        // 1. Статус
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'info_status', type: 'static' },
            field: { name: 'Поточний: ' + current_host },
            onRender: function(item) {
                item.css({'pointer-events': 'none', 'background': 'rgba(255,255,255,0.05)'});
            }
        });

        // 2. Список серверів
        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + normalizeUrl(srv.url).replace(/\W/g,''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item').css('cursor', 'pointer');
                    
                    var isActive = normalizeUrl(srv.url) === current_host;
                    var isSelected = normalizeUrl(saved_server) === normalizeUrl(srv.url);

                    if(isActive) item.find('.settings-param__name').css('color', '#2ecc71'); // Зелений якщо ми тут
                    if(isSelected) item.css('border-left', '4px solid #f39c12'); // Помаранчевий маркер вибору

                    item.on('hover:enter click', function() {
                        if(isActive) return Lampa.Noty.show('Ви вже тут');

                        Lampa.Noty.show('Перевірка зв\'язку...');
                        checkOnline(srv.url, function(alive) {
                            if(alive) {
                                Lampa.Storage.set('location_server', srv.url);
                                Lampa.Noty.show('Збережено! Перезавантаження...');
                                setTimeout(function() { window.location.reload(); }, 1000);
                            } else {
                                Lampa.Select.show({
                                    title: 'Сервер недоступний',
                                    items: [
                                        { title: 'Все одно перейти', subtitle: 'На свій страх і ризик' },
                                        { title: 'Скасувати' }
                                    ],
                                    onSelect: function(a) {
                                        if(a.title === 'Все одно перейти') {
                                            Lampa.Storage.set('location_server', srv.url);
                                            window.location.reload();
                                        }
                                    }
                                });
                            }
                        });
                    });

                    // Асинхронний пінг для відображення статусу
                    // Затримка щоб не вішати інтерфейс
                    setTimeout(function() {
                        if(isActive) return;
                        checkOnline(srv.url, function(alive) {
                            var status = alive ? '<span style="color:#2ecc71">●</span>' : '<span style="color:#e74c3c">●</span>';
                            item.find('.settings-param__value').html(status); // Виводимо статус справа
                        });
                    }, 500 + Math.random() * 1000);
                }
            });
        });

        // 3. Скидання
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'reset', type: 'static' },
            field: { name: 'Вимкнути авто-перехід' },
            onRender: function(item) {
                item.addClass('selector selector-item').css({'color': '#e74c3c', 'margin-top':'20px'});
                item.on('hover:enter click', function() {
                    Lampa.Storage.set('location_server', '-');
                    Lampa.Noty.show('Скинуто');
                    Lampa.Settings.update();
                });
            }
        });

        renderRescueButton();
        Lampa.Listener.follow('app', function(e) { 
            if(e.type == 'resize' || e.type == 'ready') renderRescueButton(); 
        });
    }

    if(window.appready) startMe();
    else Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); });

})();
