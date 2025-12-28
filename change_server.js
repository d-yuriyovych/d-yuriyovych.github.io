(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

var check_cache = {}; // Кеш для статусів, щоб не перевіряти двічі

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
    if (check_cache[domain] !== undefined) return callback(check_cache[domain]);

    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;
    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 3000);

    fetch(testUrl, { mode: 'no-cors', signal: controller.signal })
        .then(function() {
            clearTimeout(timeoutId);
            check_cache[domain] = true;
            callback(true);
        })
        .catch(function() {
            clearTimeout(timeoutId);
            check_cache[domain] = false;
            callback(false);
        });
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
                    '<div><span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + current_friendly + '</span>' +
                    ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span></div>'
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
                
                checkOnline(srv.url, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    var isSelected = Lampa.Storage.get('location_server') === srv.url;
                    item.find('.settings-param__name').html((isSelected ? '✓ ' : '') + srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                });

                item.on('hover:enter click', function() {
                    Lampa.Storage.set('location_server', srv.url);
                    // Оновлюємо візуально без перемальовування через API
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
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    var clean_url = target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // ПРИМУСОВЕ НАЛАШТУВАННЯ ДЛЯ ANDROID
                    Lampa.Storage.set('server_url', clean_url);
                    Lampa.Storage.set('protocol_server', 'http');
                    Lampa.Storage.set('proxy_other', false); // Вимикаємо проксі, щоб не блокував прямий редирект
                    
                    Lampa.Storage.set('location_server', '-');
                    
                    // Використовуємо replace для очищення історії, щоб не було петлі при кнопці "Назад"
                    window.location.replace('http://' + clean_url + '?redirect=1');
                } else {
                    Lampa.Noty.show('Сервер не вибрано');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
