(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

function getFriendlyName(url) {
    if (url.indexOf('koyeb.app') !== -1) return 'Lampac Koyeb';
    if (url.indexOf('lampa.mx') !== -1) return 'lampa.mx';
    return url;
}

function checkOnline(url, callback) {
    if (url === '-' || url === '' || !url) return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;
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
             window.location.href = 'http://' + savedServer + '?redirect=1'; 
        } 
    } else {
        Lampa.Storage.set('location_server','-');
    } 

    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    // 1. ПОТОЧНИЙ СЕРВЕР (ЖОВТА НАЗВА)
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'main_status', type: 'static' },
        field: { name: 'Поточний' },
        onRender: function(item) {
            item.addClass('selector-item selector').css('cursor', 'pointer');
            item.on('hover:enter click', function() {
                Lampa.Storage.set('location_server', '-');
                Lampa.Settings.update();
                Lampa.Noty.show('Вибрано поточний сервер');
            });
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                var status = isOk ? ' - доступний' : ' - недоступний';
                var isSelected = (Lampa.Storage.get('location_server') === '-' || !Lampa.Storage.get('location_server'));
                var mark = isSelected ? '<span style="color:#2ecc71">✓ </span>' : '';
                item.find('.settings-param__name').html(mark + 'Поточний : <span style="color:yellow">' + current_friendly + '</span><span style="color:' + color + '">' + status + '</span>');
            });
        }
    });

    // 2. ЗАГОЛОВОК
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'title_header', type: 'static' },
        field: { name: 'Виберіть сервер Lampa:' }
    });

    // 3. СПИСОК СЕРВЕРІВ
    var servers = [
        { name: 'Lampac Koyeb', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'lampa.mx', url: 'lampa.mx' }
    ];

    servers.forEach(function(srv) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector-item selector').css('cursor', 'pointer');
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

    // 4. КНОПКА ПЕРЕЗАВАНТАЖЕННЯ (СИНЯ)
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector-item selector').css('cursor', 'pointer');
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                if (target && target !== '-') {
                    window.location.href = 'http://' + target + '?redirect=1';
                } else {
                    Lampa.Noty.show('Ви вже на цьому сервері');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
