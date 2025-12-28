(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
    var found = servers.find(function(s) { 
        var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        return host === sUrl || host.indexOf(sUrl) !== -1;
    });
    return found ? found.name : 'Lampa - (' + host + ')';
}

function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;

    fetch(testUrl, { mode: 'no-cors' })
        .then(function() { callback(true); })
        .catch(function() { callback(false); });
}

function startMe() { 
    var current_host = window.location.hostname;
    var current_friendly = getFriendlyName(current_host);

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
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                item.find('.settings-param__name').html(
                    '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                    '<div>' +
                    '<span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + current_friendly + '</span>' +
                    ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>' +
                    '</div>'
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
                item.addClass('selector selector-item').css('cursor', 'pointer');
                
                // Перевірка статусу тільки при початковій побудові списку
                checkOnline(srv.url, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                });

                item.on('hover:enter click', function() {
                    Lampa.Storage.set('location_server', srv.url);
                    // Візуальне підсвічування без перевантаження всього меню (уникаємо мерехтіння)
                    $('.settings-param__name', item.parent()).css('color', '');
                    item.find('.settings-param__name').css('color', 'yellow');
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
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    var clean_url = target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // Крок 1: Оновлюємо внутрішню адресу додатка, щоб він не робив відкат
                    Lampa.Storage.set('server_url', clean_url);
                    
                    // Крок 2: Очищуємо наш буфер
                    Lampa.Storage.set('location_server', '-');
                    
                    // Крок 3: Прямий перехід без зайвих перевірок
                    window.location.href = 'http://' + clean_url + '?redirect=1';
                } else {
                    Lampa.Noty.show('Спочатку виберіть сервер зі списку');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
