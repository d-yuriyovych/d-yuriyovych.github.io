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
    var testUrl = window.location.protocol + '//' + domain;

    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    var done = false;

    var timer = setTimeout(function() {
        if (!done) {
            done = true;
            if(frame.parentNode) document.body.removeChild(frame);
            callback(false);
        }
    }, 5000);

    frame.onload = frame.onerror = function() {
        if (!done) {
            done = true;
            clearTimeout(timer);
            if(frame.parentNode) document.body.removeChild(frame);
            callback(true);
        }
    };

    frame.src = testUrl;
    document.body.appendChild(frame);
}

function startMe() { 
    var current_host = window.location.hostname.toLowerCase();
    var savedServer = Lampa.Storage.get('location_server', '-');
    
    // ПЕРЕВІРКА: Чи ми вже там, куди хотіли?
    if (savedServer !== '-') {
        var target_clean = savedServer.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        if (current_host === target_clean || current_host.indexOf(target_clean) !== -1) {
            // Ми на місці! Очищуємо чергу переходу
            Lampa.Storage.set('location_server', '-');
        } else {
            // Ми НЕ на місці. Перевіряємо, чи ми вже пробували перейти в цій сесії
            if (!sessionStorage.getItem('lampa_redirect_active')) {
                sessionStorage.setItem('lampa_redirect_active', 'true');
                var targetUrl = (savedServer.indexOf('://') === -1 ? window.location.protocol + '//' : '') + savedServer + '?redirect=1';
                window.location.replace(targetUrl); // Використовуємо replace, щоб не плодити історію
                return;
            }
        }
    }

    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    // Поточний статус (Риска в колір статусу)
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'main_status', type: 'static' },
        field: { name: 'Поточний сервер:' },
        onRender: function(item) {
            item.removeClass('selector selector-item').css({'pointer-events': 'none'});
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
                var srvName = servers.find(s => s.url.includes(current_host))?.name || current_host;
                item.find('.settings-param__name').html(
                    '<span style="opacity: 0.6;">Поточний сервер:</span><br><br>' + 
                    '<div>' +
                    '<span style="color:yellow; font-weight: bold; font-size: 1.2em;">' + srvName + '</span>' +
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

    // Список вибору
    servers.forEach(function(srv, index) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item').css('cursor', 'pointer');
                
                item.on('hover:enter click', function() {
                    if (server_states[srv.url] === false) {
                        Lampa.Noty.show('Цей сервер недоступний. Увімкніть VPN!');
                        return;
                    }
                    Lampa.Storage.set('location_server', srv.url);
                    Lampa.Settings.update();
                    Lampa.Noty.show('Вибрано: ' + srv.name);
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        var isSelected = Lampa.Storage.get('location_server') === srv.url;
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html((isSelected ? '✓ ' : '') + srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }, index * 500);
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
                var target = Lampa.Storage.get('location_server', '-');
                if (target !== '-' && server_states[target] !== false) {
                    sessionStorage.removeItem('lampa_redirect_active'); // Дозволяємо новий перехід
                    var targetUrl = (target.indexOf('://') === -1 ? window.location.protocol + '//' : '') + target + '?redirect=1';
                    window.location.replace(targetUrl);
                } else {
                    Lampa.Noty.show('Виберіть доступний (зелений) сервер');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
