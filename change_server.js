(function() {
    'use strict';
    Lampa.Platform.tv();

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

    // ТУТ ЯВНО ПРОПИСАНІ ПРОТОКОЛИ (http або https)
    var servers = [
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (MX)', url: 'http://lampa.mx' }, 
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' }, 
        { name: 'Lampa (VIP)', url: 'https://lampa.vip' },
        { name: 'Prisma', url: 'http://prisma.ws' }
    ];

    var states_cache = {};
    var selected_target = '';

    // Функція тепер підставляє http за замовчуванням, якщо протокол не вказано,
    // але поважає https, якщо він є в адресі.
    function normalizeUrl(url) {
        if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) return url;
        return 'http://' + url;
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
        // Нормалізуємо URL (додаємо http якщо нема) і прибираємо слеш в кінці
        var check_url = normalizeUrl(url).replace(/\/$/, "");
        var domain = check_url.replace(/https?:\/\//, "").split('/')[0];

        if (states_cache[domain] !== undefined) return callback(states_cache[domain]);

        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 2000); 

        // fetch використовує повну адресу з правильним протоколом
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
        
        selected_target = ''; 

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'main_status', type: 'static' },
            field: { name: 'Поточний сервер:' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none'});
                
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
                        
                        if (states_cache[domain] === false) {
                            Lampa.Noty.show('Увага: Сервер може бути недоступний');
                        }

                        // Зберігаємо повний URL з протоколом як є в масиві
                        selected_target = srv.url;
                        
                        item.parent().find('.settings-param__name').each(function() {
                            $(this).html($(this).html().replace('✓ ', ''));
                        });
                        item.find('.settings-param__name').prepend('✓ ');
                        
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
                    if (!selected_target) {
                        Lampa.Noty.show('Спочатку виберіть сервер зі списку!');
                        return;
                    }

                    // Очищаємо URL для запису в пам'ять (без http/https), 
                    // бо внутрішні механізми Лампи іноді дописують протокол самі, 
                    // але для редиректу нам потрібен чистий протокол.
                    var clean = selected_target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // Зберігаємо "чистий" домен в налаштування, щоб Лампа його підхопила при старті
                    Lampa.Storage.set('server_url', clean);
                    localStorage.setItem('server_url', clean);
                    // location_server зберігаємо повний, на всяк випадок
                    Lampa.Storage.set('location_server', selected_target); 
                    
                    Lampa.Noty.show('Виконується перехід на ' + selected_target + '...');

                    setTimeout(function(){
                        // Тут важливо: window.location.href має отримати повний URL з протоколом
                        var final_url = normalizeUrl(selected_target);
                        
                        try {
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

    Lampa.Listener.follow('app', function(e) { 
        if(e.type == 'ready') {
            Lampa.SettingsApi.addComponent({ 
                component: 'location_redirect', 
                name: 'Зміна сервера', 
                icon: icon_server_redirect 
            }); 
        }
    });

    Lampa.Listener.follow('settings', function(e) {
        if(e.type == 'open' && e.name == 'location_redirect') {
            states_cache = {}; 
            addSettingsItems();
        }
    });

})();
