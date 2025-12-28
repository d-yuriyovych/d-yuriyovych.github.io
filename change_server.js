(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa - (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa - (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa - (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

var server_states = {};

function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "").replace(/https?:\/\//, "");
    var testUrl = window.location.protocol + '//' + domain + '/favicon.ico?v=' + Math.random();

    var img = new Image();
    var done = false;
    img.onload = img.onerror = function() {
        if (!done) { done = true; callback(true); }
    };
    setTimeout(function() {
        if (!done) { done = true; img.src = ''; callback(false); }
    }, 4000);
    img.src = testUrl;
}

function startMe() { 
    var current_host = window.location.hostname.toLowerCase();
    var savedServer = Lampa.Storage.get('location_server', '-');
    
    // ЛОГІКА ПЕРЕХОДУ (спрощена)
    if (savedServer !== '-' && window.location.search.indexOf('redirected') === -1) {
        var target_clean = savedServer.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        if (current_host !== target_clean && current_host.indexOf(target_clean) === -1) {
            var targetUrl = (savedServer.indexOf('://') === -1 ? window.location.protocol + '//' : '') + savedServer + '?redirected=1';
            Lampa.Storage.set('location_server', '-'); // Очищуємо відразу, щоб не було петлі
            window.location.replace(targetUrl);
            return;
        }
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
            item.removeClass('selector selector-item').css({'pointer-events': 'none'});
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                var srvName = servers.find(function(s){ return s.url.indexOf(current_host) !== -1 })?.name || current_host;
                item.find('.settings-param__name').html(
                    '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                    '<div><span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + srvName + '</span>' +
                    ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span></div>'
                );
            });
        }
    });

    servers.forEach(function(srv, index) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item').css('cursor', 'pointer');
                item.on('hover:enter click', function() {
                    if (server_states[srv.url]) {
                        Lampa.Storage.set('location_server', srv.url);
                        Lampa.Settings.update();
                        Lampa.Noty.show('Вибрано: ' + srv.name);
                    }
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        var isSelected = Lampa.Storage.get('location_server') === srv.url;
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html((isSelected ? '✓ ' : '') + srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }, index * 300);
            }
        });
    });

    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server', '-');
                if (target !== '-' && server_states[target]) {
                    window.location.replace((target.indexOf('://') === -1 ? window.location.protocol + '//' : '') + target + '?redirected=1');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
