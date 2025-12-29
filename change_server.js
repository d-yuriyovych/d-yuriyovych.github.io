(function() {
    'use strict';
    Lampa.Platform.tv();

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

    var servers = [
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    var states_cache = {};
    var selected_target = '';

    // Допоміжна функція для правильного формування URL (додає https, якщо немає)
    function normalizeUrl(url) {
        if (url.indexOf('http') === 0) return url;
        return 'https://' + url;
    }

    function getFriendlyName(url) {
        if (!url) return 'Lampa';
        var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        var found = servers.find(function(s) {
            var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
            return host === sUrl || host.indexOf(sUrl) !== -1;
        });
        return found ? found.name : host;
    }

    function checkOnline(url, callback) {
        var check_url = normalizeUrl(url).replace(/\/$/, "");
        var domain = check_url.replace(/https?:\/\//, "").split('/')[0];

        if (states_cache[domain] !== undefined) return callback(states_cache[domain]);

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 2000); // Таймаут 2 сек

        // Використовуємо fetch, як ти просив. mode: 'no-cors' важливий для перевірки чужих доменів
        fetch(check_url + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller.signal })
            .then(function() {
                clearTimeout(timeoutId);
                states_cache[domain] = true;
                callback(true);
            })
            .catch(function() {
                clearTimeout(timeoutId);
                states_cache[domain] = false;
                callback(false);
            });
    }

    function addSettingsItems() {
        var current_host = window.location.hostname;
        var current_friendly = getFriendlyName(current_host);
        
        // Скидаємо вибір при вході в меню
        selected_target = ''; 

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'main_status', type: 'static' },
            field: { name: 'Поточний сервер:' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none'});
                
                // Перевірка поточного хоста
                checkOnline(current_host, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(
                        '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                        '<div><span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + current_friendly + '</span>' +
                        ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span></div>'
                    );
                });
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'title_header', type: 'static' },
            field: { name: 'Виберіть сервер Lampa:' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none', 'padding-top': '15px', 'opacity': '0.6'});
            }
        });

        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item');
                    
                    checkOnline(srv.url, function(isOk) {
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                        if (!isOk) item.css('opacity', '0.4');
                    });

                    item.on('hover:enter click', function() {
                        var domain = srv.url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
                        
                        // Якщо ми вже перевірили і він недоступний - попереджаємо, але даємо вибрати (раптом провайдер блокує пінг, а сайт працює)
                        if (states_cache[domain] === false) {
                            Lampa.Noty.show('Увага: Сервер може бути недоступний');
                        }

                        selected_target = srv.url;
                        
                        // Візуальне виділення
                        item.parent().find('.settings-param__name').each(function() {
                            $(this).html($(this).html().replace('✓ ', ''));
                        });
                        item.find('.settings-param__name').prepend('✓ ');
                        
                        // Зберігаємо вибір, але перехід тільки по кнопці
                        Lampa.Noty.show('Вибрано: ' + srv.name);
                    });
                }
            });
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'apply_reload', type: 'static' },
            field: { name: 'Змінити сервер' },
            onRender: function(item) {
                item.addClass('selector selector-item').on('hover:enter click', function() {
                    // Перевірка: чи вибрано сервер
                    if (!selected_target) {
                        Lampa.Noty.show('Спочатку виберіть сервер зі списку!');
                        return;
                    }

                    var clean = selected_target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // КРОК 1: Записуємо адресу в усі можливі сховища
                    Lampa.Storage.set('server_url', clean);
                    localStorage.setItem('server_url', clean);
                    // Додатково для деяких версій Android клієнта
                    Lampa.Storage.set('location_server', selected_target); 
                    
                    Lampa.Noty.show('Виконується перехід на ' + selected_target + '...');

                    setTimeout(function(){
                        // КРОК 2: Правильний редирект
                        // Використовуємо HTTPS за замовчуванням, якщо не вказано інше
                        var final_url = normalizeUrl(selected_target);
                        
                        try {
                            // Для Android Lampa
                            window.location.href = final_url;
                        } catch(e) {
                            window.location.reload();
                        }
                    }, 500);
                });
                item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold', 'text-align': 'center'});
            }
        });
    }

    // Запуск плагіна
    Lampa.Listener.follow('app', function(e) { 
        if(e.type == 'ready') {
            Lampa.SettingsApi.addComponent({ 
                component: 'location_redirect', 
                name: 'Зміна сервера', 
                icon: icon_server_redirect 
            }); 
        }
    });

    // Слухаємо відкриття налаштувань
    Lampa.Listener.follow('settings', function(e) {
        if(e.type == 'open' && e.name == 'location_redirect') {
            // Очищаємо кеш статусів, щоб перевірка йшла КОЖНОГО разу при вході
            states_cache = {}; 
            // Додаємо пункти меню (це запустить onRender і fetch)
            addSettingsItems();
        }
    });

})();
