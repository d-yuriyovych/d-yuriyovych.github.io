(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

// Список серверів винесено на початок для зручності та використання у функціях
var servers = [
    { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa - (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa - (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa - (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

function getFriendlyName(url) {
    if (!url) return 'Невідомо';
    // Шукаємо назву у нашому масиві серверів за збігом URL
    var found = servers.find(function(s) { 
        return url.indexOf(s.url.replace(/\/$/, "")) !== -1; 
    });
    return found ? found.name : url;
}

function checkOnline(url, callback) {
    if (url === '-' || url === '' || !url) return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "");
    // Перевіряємо через поточний протокол (http або https)
    var testUrl = (domain.indexOf('://') === -1) ? window.location.protocol + '//' + domain : domain;
    var img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(true); }; 
    img.src = testUrl + '/favicon.ico?v=' + Math.random();
    setTimeout(function() { if(!img.complete) { img.src = ''; callback(false); } }, 2500);
}

function startMe() { 
    var current_host = window.location.hostname;
    var current_friendly = getFriendlyName(current_host);

    if (window.location.search != '?redirect=1') { 
        var savedServer = Lampa.Storage.get('location_server');
        if(savedServer && savedServer !== '-' && current_host !== savedServer) { 
             // Використовуємо протокол сайту, з якого переходимо
             window.location.href = window.location.protocol + '//' + savedServer + '?redirect=1'; 
        } 
    } else {
        Lampa.Storage.set('location_server','-');
    } 

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
            item.removeClass('selector selector-item').css({
                'pointer-events': 'none',
                'user-select': 'none'
            });

            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                var status = isOk ? 'доступний' : 'недоступний';
                var isSelected = (Lampa.Storage.get('location_server') === '-' || !Lampa.Storage.get('location_server'));
                var mark = isSelected ? '<span style="color:#2ecc71">✓ </span>' : '';
                
                item.find('.settings-param__name').html(
                    '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                    '<div>' +
                    mark + '<span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + current_friendly + '</span>' +
                    ' — <span style="color:' + color + '">' + status + '</span>' +
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
            item.removeClass('selector selector-item').css({
                'pointer-events': 'none',
                'padding-top': '15px'
            });
            item.find('.settings-param__name').css('opacity', '0.6');
        }
    });

    servers.forEach(function(srv) {
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

                var isSelected = Lampa.Storage.get('location_server') === srv.url;
                var mark = isSelected ? '<span style="color:#2ecc71">✓ </span>' : '';
                checkOnline(srv.url, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(mark + srv.name + ' <span style="color:' + color + '; font-size: 0.85em;">- доступний</span>');
                });
            }
        });
    });

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector selector-item').css({
                'cursor': 'pointer',
                'margin-top': '15px'
            });
            
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    // Форсуємо перехід через http, якщо звичайний не спрацював
                    window.location.href = window.location.protocol + '//' + target + '?redirect=1';
                } else {
                    Lampa.Noty.show('Сервер не змінено');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
