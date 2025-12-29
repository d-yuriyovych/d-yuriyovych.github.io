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
    var selected_target = '';

    // Функція інтелектуальної перевірки протоколу
    function checkOnline(url, callback) {
        var domain = url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
        
        if (states_cache[domain] !== undefined) return callback(states_cache[domain].online, states_cache[domain].protocol);

        // Спершу пробуємо HTTPS як безпечніший
        var controller = new AbortController();
        var timeoutId = setTimeout(function() { controller.abort(); }, 1500);

        fetch('https://' + domain + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller.signal })
            .then(function() {
                clearTimeout(timeoutId);
                states_cache[domain] = { online: true, protocol: 'https://' };
                callback(true, 'https://');
            })
            .catch(function() {
                clearTimeout(timeoutId);
                // Якщо HTTPS не пройшов, пробуємо HTTP
                var controller2 = new AbortController();
                var timeoutId2 = setTimeout(function() { controller2.abort(); }, 1500);

                fetch('http://' + domain + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller2.signal })
                    .then(function() {
                        clearTimeout(timeoutId2);
                        states_cache[domain] = { online: true, protocol: 'http://' };
                        callback(true, 'http://');
                    })
                    .catch(function() {
                        clearTimeout(timeoutId2);
                        states_cache[domain] = { online: false, protocol: 'http://' };
                        callback(false, 'http://');
                    });
            });
    }

    function startMe() {
        // Очищуємо параметри перед додаванням, щоб уникнути дублів або "пустоти"
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'main_status', type: 'static' },
            field: { name: 'Поточний сервер:' },
            onRender: function(item) {
                item.removeClass('selector selector-item').css({'pointer-events': 'none'});
                var host = window.location.hostname;
                checkOnline(host, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(
                        '<span style="opacity: 0.6;">Поточний хост:</span><br>' + 
                        '<span style="color:yellow; font-weight: bold;">' + host + '</span>' +
                        ' <span style="color:' + color + '">- ' + (isOk ? 'працює' : 'помилка') + '</span>'
                    );
                });
            }
        });

        servers.forEach(function(srv) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item');
                    checkOnline(srv.url, function(isOk, proto) {
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">(' + proto.replace('://','') + ')</span>');
                        if (!isOk) item.css('opacity', '0.5');
                    });

                    item.on('hover:enter click', function() {
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
                        Lampa.Noty.show('Виберіть сервер!');
                        return;
                    }

                    var domain = selected_target.replace(/https?:\/\//, "");
                    var protocol = (states_cache[domain] && states_cache[domain].protocol) ? states_cache[domain].protocol : 'http://';
                    
                    Lampa.Storage.set('server_url', domain);
                    localStorage.setItem('server_url', domain);
                    
                    Lampa.Noty.show('Перехід на ' + protocol + domain);

                    setTimeout(function(){
                        window.location.href = protocol + domain;
                    }, 500);
                });
                item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
            }
        });
    }

    // Реєстрація компонента
    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    });

    // Слухаємо відкриття налаштувань для оновлення списку
    Lampa.Listener.follow('settings', function(e) {
        if(e.type == 'open' && e.name == 'location_redirect') {
            states_cache = {}; // Скидаємо кеш для свіжої перевірки
            startMe();
        }
    });
})();
