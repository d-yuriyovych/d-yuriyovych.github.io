(function() {
    'use strict';

    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

    var servers = [
        { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws' }
    ];

    var states_cache = {};
    var selected_target = '';

    // Універсальна перевірка доступності (авто-протокол)
    function checkOnline(url, callback) {
        var domain = url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
        
        // Робимо два запити паралельно або послідовно
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 2000);

        // Спершу пробуємо HTTPS
        fetch('https://' + domain + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller.signal })
            .then(function() {
                clearTimeout(timeoutId);
                states_cache[domain] = { online: true, protocol: 'https://' };
                callback(true, 'https://');
            })
            .catch(function() {
                // Якщо HTTPS впав, пробуємо HTTP
                fetch('http://' + domain + '/?t=' + Date.now(), { mode: 'no-cors' })
                    .then(function() {
                        states_cache[domain] = { online: true, protocol: 'http://' };
                        callback(true, 'http://');
                    })
                    .catch(function() {
                        states_cache[domain] = { online: false, protocol: 'http://' };
                        callback(false, 'http://');
                    });
            });
    }

    function init() {
        Lampa.SettingsApi.addComponent({ 
            component: 'location_redirect', 
            name: 'Зміна сервера', 
            icon: icon_server_redirect 
        });

        // 1. Статус поточного сервера
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'main_status', type: 'static' },
            field: { name: 'Поточний сервер' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css('pointer-events', 'none');
                var host = window.location.hostname;
                checkOnline(host, function(isOk, proto) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(
                        '<span style="opacity: 0.6;">Запущено на:</span> ' + host + 
                        ' <span style="color:' + color + '">(' + (isOk ? 'OK' : 'OFF') + ')</span>'
                    );
                });
            }
        });

        // 2. Список серверів
        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item');
                    
                    // Оновлюємо статус при кожному відображенні
                    checkOnline(srv.url, function(isOk, proto) {
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '; font-size: 0.8em;">— ' + proto.replace('://','') + '</span>');
                        if (!isOk) item.css('opacity', '0.5');
                    });

                    item.on('hover:enter click', function() {
                        selected_target = srv.url;
                        // Візуальна галочка
                        item.closest('.scroll__content').find('.settings-param__name').each(function() {
                            $(this).text($(this).text().replace('✓ ', ''));
                        });
                        item.find('.settings-param__name').prepend('✓ ');
                        Lampa.Noty.show('Вибрано: ' + srv.name);
                    });
                }
            });
        });

        // 3. Кнопка дії
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'apply_reload', type: 'static' },
            field: { name: 'Змінити сервер' },
            onRender: function(item) {
                item.addClass('selector selector-item').on('hover:enter click', function() {
                    if (!selected_target) {
                        Lampa.Noty.show('Спочатку виберіть сервер!');
                        return;
                    }

                    var domain = selected_target.replace(/https?:\/\//, "");
                    var protocol = (states_cache[domain] && states_cache[domain].protocol) ? states_cache[domain].protocol : 'http://';
                    
                    Lampa.Storage.set('server_url', domain);
                    localStorage.setItem('server_url', domain);
                    
                    Lampa.Noty.show('Перехід: ' + protocol + domain);

                    setTimeout(function(){
                        window.location.href = protocol + domain;
                    }, 500);
                });
                item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold', 'text-align': 'center'});
            }
        });
    }

    // Очищення кешу при відкритті меню (через Listener)
    Lampa.Listener.follow('settings', function(e) {
        if(e.type == 'open' && e.name == 'location_redirect') {
            states_cache = {}; // Очищуємо кеш, щоб onRender запустив нові fetch
        }
    });

    // Очікуємо повної готовності Lampa
    var timer = setInterval(function(){
        if(typeof Lampa !== 'undefined' && Lampa.SettingsApi) {
            clearInterval(timer);
            init();
        }
    }, 200);

})();
