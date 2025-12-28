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
    if (!url || url === '-') return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "").replace(/https?:\/\//, "");
    var testUrl = window.location.protocol + '//' + domain + '/favicon.ico?v=' + Math.random();

    var img = new Image();
    var done = false;
    img.onload = function() { if (!done) { done = true; callback(true); } };
    img.onerror = function() { if (!done) { done = true; callback(true); } };
    
    setTimeout(function() {
        if (!done) { done = true; img.src = ''; callback(false); }
    }, 5000);
    img.src = testUrl;
}

function startMe() { 
    var current_host = window.location.hostname.toLowerCase();
    
    // ПОВНЕ ВИМКНЕННЯ ВНУТРІШНЬОГО ПЕРЕХОДУ ПРИ СТАРТІ
    // Ми нічого не пишемо в location_server при завантаженні, щоб не провокувати Android
    if (Lampa.Storage.get('location_server') !== '-') {
        Lampa.Storage.set('location_server', '-');
    }

    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    // Поточний сервер
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'main_status', type: 'static' },
        field: { name: 'Поточний сервер:' },
        onRender: function(item) {
            item.removeClass('selector selector-item').css({'pointer-events': 'none'});
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                var srvTitle = current_host;
                for(var i=0; i<servers.length; i++) {
                    if(servers[i].url.indexOf(current_host) !== -1) srvTitle = servers[i].name;
                }
                item.find('.settings-param__name').html(
                    '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                    '<div><span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + srvTitle + '</span>' +
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
            item.removeClass('selector selector-item').css({'pointer-events': 'none', 'padding-top': '15px'});
            item.find('.settings-param__name').css('opacity', '0.6');
        }
    });

    // Список вибору
    servers.forEach(function(srv, index) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item').css('cursor', 'pointer');
                
                item.on('hover:enter click', function() {
                    if (server_states[srv.url]) {
                        Lampa.Storage.set('location_server_tmp', srv.url); 
                        Lampa.Noty.show('Вибрано: ' + srv.name);
                    }
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }, index * 400);
            }
        });
    });

    // Кнопка переходу
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server_tmp', '-');
                if (target !== '-' && server_states[target]) {
                    Lampa.Storage.set('location_server_tmp', '-');
                    // Використовуємо replace для жорсткої заміни адреси
                    window.location.replace(window.location.protocol + '//' + target);
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
