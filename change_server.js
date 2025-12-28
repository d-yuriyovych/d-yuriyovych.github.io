(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa - (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa - (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa - (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
    var found = servers.find(function(s) { 
        var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        return host === sUrl || host.indexOf(sUrl) !== -1 || sUrl.indexOf(host) !== -1;
    });
    return found ? found.name : 'Lampa - (' + host + ')';
}

// Покращена перевірка: без іконок, з урахуванням 404 та черговістю
function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? window.location.protocol + '//' + domain : domain;

    var controller = new AbortController();
    var timeout = setTimeout(function() { controller.abort(); callback(false); }, 5000);

    fetch(testUrl, { method: 'GET', signal: controller.signal, mode: 'no-cors', cache: 'no-cache' })
        .then(function() { clearTimeout(timeout); callback(true); })
        .catch(function() { clearTimeout(timeout); callback(false); });
}

function startMe() { 
    var current_host = window.location.hostname;
    var current_friendly = getFriendlyName(current_host);

    if (window.location.search != '?redirect=1') { 
        var savedServer = Lampa.Storage.get('location_server');
        if(savedServer && savedServer !== '-' && current_host !== savedServer) { 
             window.location.href = (savedServer.indexOf('://') === -1 ? 'http://' : '') + savedServer + '?redirect=1'; 
        } 
    } else {
        Lampa.Storage.set('location_server','-');
    } 

    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    // 1. ПОТОЧНИЙ СЕРВЕР (ЖОВТА НАЗВА + РИСКА В КОЛІР)
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

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'title_header', type: 'static' },
        field: { name: 'Виберіть сервер Lampa:' },
        onRender: function(item) {
            item.removeClass('selector selector-item').css({'pointer-events': 'none', 'padding-top': '15px'});
            item.find('.settings-param__name').css('opacity', '0.6');
        }
    });

    // 2. СПИСОК СЕРВЕРІВ (ЧЕРГОВА ПЕРЕВІРКА)
    servers.forEach(function(srv, index) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item').css('cursor', 'pointer');
                item.on('hover:enter click', function() {
                    Lampa.Storage.set('location_server', srv.url);
                    Lampa.Settings.update();
                    Lampa.Noty.show('Вибрано: ' + srv.name);
                });

                // Робимо затримку для кожного наступного сервера, щоб не блокував браузер
                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        var isSelected = Lampa.Storage.get('location_server') === srv.url;
                        item.find('.settings-param__name').html((isSelected ? '✓ ' : '') + srv.name + ' <span style="color:' + color + '; font-size: 0.85em;">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }, index * 500); 
            }
        });
    });

    // 3. КНОПКА ПЕРЕЗАВАНТАЖЕННЯ
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    window.location.href = 'http://' + target + '?redirect=1';
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
