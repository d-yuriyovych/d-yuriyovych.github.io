(function() {
    'use strict';
    
    // Переконаємось, що це TV інтерфейс
    if (Lampa.Platform.tv) Lampa.Platform.tv();

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';
    var icon_globe = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';

    var servers = [
        { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws/' }
    ];

    var server_states = {};

    function getFriendlyName(url) {
        if (!url) return 'Lampa';
        var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        var found = servers.find(function(s) {
            var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
            return host === sUrl || host.indexOf(sUrl) !== -1 || sUrl.indexOf(host) !== -1;
        });
        return found ? found.name : 'Lampa - (' + host + ')';
    }

    // --- НАЙНАДІЙНІША ПЕРЕВІРКА (FETCH NO-CORS) ---
    function checkOnline(url, callback) {
        if (!url || url === '-') return callback(true);
        
        var domain = url.split('?')[0].replace(/\/$/, "");
        var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;

        // Використовуємо fetch, бо він показує реальний стан мережі
        if (window.fetch) {
            var controller = null;
            var signal = null;
            
            // AbortController для нових браузерів/TV (таймаут)
            if (window.AbortController) {
                controller = new AbortController();
                signal = controller.signal;
            }

            var timer = setTimeout(function() {
                if(controller) controller.abort();
                // Якщо fetch завис, вважаємо що офлайн
                callback(false);
            }, 5000); // 5 секунд на відповідь

            fetch(testUrl, { method: 'HEAD', mode: 'no-cors', signal: signal })
                .then(function() {
                    clearTimeout(timer);
                    callback(true); // Успіх (навіть якщо 404, сервер відповів)
                })
                .catch(function(e) {
                    clearTimeout(timer);
                    console.log('Server check failed:', testUrl, e);
                    callback(false); // Помилка мережі (сервер лежить або блокує з'єднання)
                });
        } else {
            // Фолбек для дуже старих TV без підтримки fetch (рідкісний випадок)
            var img = new Image();
            img.onload = function() { callback(true); };
            img.onerror = function() { callback(false); }; // Тут може бути брехня, але на старій техніці вибору немає
            img.src = testUrl + '/favicon.ico?t=' + Date.now();
        }
    }

    // --- ДОДАВАННЯ КНОПКИ В ШАПКУ ---
    function addHeaderButton() {
        // Чекаємо поки шапка з'явиться
        var checkHead = setInterval(function(){
            if($('.head .head__actions').length > 0){
                clearInterval(checkHead);
                
                if ($('.head .open--redirect-plugin').length) return;

                var btn = $('<div class="head__action selector open--redirect-plugin" style="cursor: pointer;">' + icon_globe + '</div>');
                
                btn.on('click', function() {
                    try {
                        Lampa.Settings.open('location_redirect');
                    } catch(e) {
                        Lampa.Noty.show('Помилка відкриття меню: ' + e.message);
                    }
                });

                // Вставляємо на початок блоку дій
                $('.head .head__actions').prepend(btn);
            }
        }, 500);
    }

    function startMe() {
        var current_host = window.location.hostname;
        var current_friendly = getFriendlyName(current_host);

        // Запускаємо кнопку незалежно від решти
        addHeaderButton();

        // --- ЛОГІКА РЕДИРЕКТУ ---
        if (window.location.search.indexOf('redirect=1') === -1) {
            var savedServer = Lampa.Storage.get('location_server');
            
            if (savedServer && savedServer !== '-' && current_host !== savedServer) {
                // Спочатку перевіряємо, чи живий сервер
                checkOnline(savedServer, function(isOk) {
                    if (isOk) {
                        window.location.href = 'http://' + savedServer + '?redirect=1';
                    } else {
                        // Сервер мертвий - залишаємось тут, показуємо повідомлення
                        Lampa.Noty.show('Сервер ' + savedServer + ' недоступний. Автоперехід скасовано.');
                    }
                });
            }
        }

        // --- КОМПОНЕНТ НАЛАШТУВАНЬ ---
        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: 'Зміна сервера',
            icon: icon_server_redirect
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'info_status', type: 'static' },
            field: { name: 'Статус' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none', 'background': 'transparent'});
                
                var statusHtml = '<div style="text-align: center; margin-bottom: 10px;">';
                statusHtml += '<div style="font-size: 1.5em; font-weight: bold; color: white;">' + current_friendly + '</div>';
                statusHtml += '<div class="server-status-text" style="color: #7a7a7a; font-size: 0.9em;">Перевірка...</div>';
                statusHtml += '</div>';
                
                item.html(statusHtml);

                checkOnline(current_host, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    var text = isOk ? 'Онлайн (Ви тут)' : 'Недоступний (Як ви це бачите?)';
                    item.find('.server-status-text').html('<span style="color:'+color+'">' + text + '</span>');
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'list_title', type: 'static' },
            field: { name: 'Доступні сервери' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none', 'opacity': '0.5', 'margin-top': '20px'});
            }
        });

        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item').css({'cursor': 'pointer', 'display': 'flex', 'justify-content': 'space-between'});
                    
                    // За замовчуванням
                    var statusSpan = $('<span class="srv-status" style="font-size: 0.8em; opacity: 0.7;">...</span>');
                    item.find('.settings-param__name').css('width', '100%').append(statusSpan);

                    // Клік
                    item.on('click', function() {
                        var isOnline = server_states[srv.url];
                        
                        if (isOnline === false) {
                            Lampa.Noty.show('УВАГА: Цей сервер не відповідає!');
                            // Ми дозволяємо клік, але попереджаємо. Якщо користувач хоче ризикнути - ок.
                            // Або можна зробити return, якщо хочете жорстко заборонити.
                        }
                        
                        Lampa.Storage.set('location_server', srv.url);
                        Lampa.Settings.update(); // Оновлюємо галочку
                        
                        if(isOnline) {
                            Lampa.Noty.show('Перехід на ' + srv.name + '...');
                            setTimeout(function(){
                                window.location.href = 'http://' + srv.url + '?redirect=1';
                            }, 1000);
                        } else {
                            Lampa.Noty.show('Сервер вибрано, але він недоступний. Перезавантажте вручну.');
                        }
                    });

                    // Перевірка
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        var text = isOk ? 'Доступний' : 'Недоступний';
                        var currentMark = (Lampa.Storage.get('location_server') === srv.url) ? '✓ ' : '';
                        
                        // Оновлюємо вигляд
                        item.find('.settings-param__name').html(
                            '<span>' + currentMark + srv.name + '</span>' + 
                            '<span style="float: right; color:' + color + '; font-size: 0.85em;">' + text + '</span>'
                        );
                        
                        if(!isOk) item.css('opacity', '0.6');
                    });
                }
            });
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'reset_srv', type: 'static' },
            field: { name: 'Скинути вибір (Вимкнути редирект)' },
            onRender: function(item) {
                item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '20px', 'color': '#f39c12'});
                item.on('click', function() {
                    Lampa.Storage.set('location_server', '-');
                    Lampa.Settings.update();
                    Lampa.Noty.show('Автоматичний редирект вимкнено');
                });
            }
        });
    }

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') startMe();
        });
    }

})();
