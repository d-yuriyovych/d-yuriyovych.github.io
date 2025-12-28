(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

var server_states = {};

function checkOnline(url, callback) {
    var domain = url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
    if (server_states[domain] !== undefined) return callback(server_states[domain]);
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;

    fetch(testUrl, { mode: 'no-cors' }).then(function() {
        server_states[domain] = true; callback(true);
    }).catch(function() {
        server_states[domain] = false; callback(false);
    });
}

function startMe() {
    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'main_status', type: 'static' },
        field: { name: 'Поточний сервер:' },
        onRender: function(item) {
            item.removeClass('selector selector-item').css({'pointer-events': 'none'});
            var host = window.location.hostname;
            checkOnline(host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                item.find('.settings-param__name').html('Поточний: <span style="color:yellow">' + host + '</span> <span style="color:' + color + '">(' + (isOk ? 'ОК' : 'OFF') + ')</span>');
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
                    item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">(' + (isOk ? 'доступний' : 'немає зв\'язку') + ')</span>');
                });

                item.on('hover:enter click', function() {
                    Lampa.Storage.set('location_server', srv.url);
                    item.parent().find('.settings-param__name').each(function() { $(this).html($(this).html().replace('✓ ', '')); });
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
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    var clean = target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // Оновлення внутрішніх налаштувань
                    Lampa.Storage.set('server_url', clean);
                    Lampa.Storage.set('location_server', '-');
                    
                    // ВИКЛИК API ДОДАТКА
                    if (Lampa.Platform.is('android')) {
                        // Якщо це Android додаток, використовуємо його системний запуск
                        Lampa.Platform.run('http://' + clean);
                    } else {
                        // Для ТВ та браузера
                        window.location.href = 'http://' + clean + '?redirect=1';
                    }
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
}

if(window.appready) startMe(); 
else Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); });
})();
