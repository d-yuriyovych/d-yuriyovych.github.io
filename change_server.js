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

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase().replace(/\/$/, "");
    var found = servers.find(function(s) { 
        var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase().replace(/\/$/, "");
        return host === sUrl;
    });
    return found ? found.name : 'Lampa - (' + host + ')';
}

function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);
    var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase().replace(/\/$/, "");
    if (host === window.location.hostname.toLowerCase()) return callback(true);

    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;

    var controller = new AbortController();
    var timer = setTimeout(function() {
        controller.abort();
        callback(false);
    }, 4000);

    fetch(testUrl, { mode: 'no-cors', cache: 'no-cache' }).then(function() {
        clearTimeout(timer);
        callback(true);
    }).catch(function() {
        clearTimeout(timer);
        callback(false);
    });
}

function startMe() { 
    var current_host = window.location.hostname.toLowerCase().replace(/\/$/, "");
    var current_friendly = getFriendlyName(current_host);
    var savedServer = Lampa.Storage.get('location_server', '-');

    // ПЕРЕВІРКА НА ЗАЦИКЛЕННЯ ПРИ ЗАПУСКУ
    if (savedServer !== '-' && savedServer !== '') {
        var cleanSaved = savedServer.replace(/https?:\/\//, "").split('/')[0].toLowerCase().replace(/\/$/, "");
        // Якщо ми вже на цьому сервері - скидаємо вибір, щоб не було петлі
        if (current_host === cleanSaved) {
            Lampa.Storage.set('location_server', '-');
        } else if (window.location.search.indexOf('redirect=1') === -1) {
            // Якщо сервер інший і це не редірект-петля - переходимо
            window.location.href = (savedServer.indexOf('://') === -1 ? 'http://' : '') + savedServer + '?redirect=1';
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

    servers.forEach(function(srv, index) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item').css('cursor', 'pointer');
                
                // ТУТ ВИПРАВЛЕНО: Тільки візуальний вибір, без негайного редіректу
                item.on('hover:enter click', function() {
                    if (server_states[srv.url] === false) {
                        Lampa.Noty.show('Сервер недоступний');
                        return;
                    }
                    // Просто зберігаємо в пам'ять, редірект зробить кнопка нижче
                    window.pending_lampa_server = srv.url; 
                    Lampa.Noty.show('Вибрано: ' + srv.name + '. Тепер натисніть кнопку "ЗМІНИТИ СЕРВЕР"');
                    
                    item.parent().find('.settings-param__name').each(function() {
                        $(this).html($(this).html().replace('✓ ', ''));
                    });
                    item.find('.settings-param__name').prepend('✓ ');
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '; font-size: 0.85em;">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
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
                var target = window.pending_lampa_server;
                if (target) {
                    // Тільки тут ми реально записуємо в Storage і перезавантажуємо
                    Lampa.Storage.set('location_server', target);
                    window.location.href = (target.indexOf('://') === -1 ? 'http://' : '') + target + '?redirect=1';
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
