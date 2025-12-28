(function() {
    'use strict';
    Lampa.Platform.tv();

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

    var servers = [
        { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (MX)', url: 'lampa.mx' }, 
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    var states_cache = {};

    function checkOnline(url, callback) {
        var domain = url.replace(/https?:\/\//, "").split('/')[0];
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 2000); 

        fetch('http://' + domain + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller.signal })
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

    function startMe() {
        // 1. ПЕРЕВІРКА РЕДИРЕКТУ (Логіка з вашого прикладу)
        var saved_server = Lampa.Storage.get('location_server', '-');
        
        if (window.location.search != '?redirect=1') {
            if (saved_server != '-' && saved_server != '' && window.location.hostname != saved_server) {
                window.location.href = 'http://' + saved_server + '?redirect=1';
                return; // Зупиняємо виконання, щоб пішов редирект
            }
        } else {
            // Якщо ми вже прийшли за редиректом - скидаємо вибір, щоб зафіксуватися тут
            Lampa.Storage.set('location_server', '-');
        }

        // 2. СТВОРЕННЯ МЕНЮ
        Lampa.SettingsApi.addComponent({
            component: 'location_redirect',
            name: 'Зміна сервера',
            icon: icon_server_redirect
        });

        // Заголовок
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'title_header', type: 'static' },
            field: { name: 'Виберіть сервер Lampa:' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none', 'padding-top': '15px', 'opacity': '0.6'});
            }
        });

        // Список серверів (як параметри для миттєвого оновлення статусів)
        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item');
                    
                    // Перевірка статусу при відкритті меню
                    checkOnline(srv.url, function(isOk) {
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });

                    item.on('hover:enter click', function() {
                        Lampa.Storage.set('location_server', srv.url);
                        Lampa.Noty.show('Сервер вибрано. Перезавантажте Lampa.');
                        
                        // Миттєвий редирект як у вашому прикладі
                        setTimeout(function() {
                            window.location.href = 'http://' + srv.url + '?redirect=1';
                        }, 500);
                    });
                }
            });
        });
    }

    // Запуск
    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') startMe();
        });
    }
    
    // Додатковий слухач для оновлення статусів при кожному вході в меню
    Lampa.Listener.follow('settings', function(e) {
        if(e.type == 'open' && e.name == 'location_redirect') {
            states_cache = {}; // Скидаємо кеш для нових статусів
        }
    });
})();
