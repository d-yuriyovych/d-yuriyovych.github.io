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
var selected_target = null; // Тимчасова змінна для вибору

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = url.replace(/https?:\/\//, "").split('/')[0].split(':')[0].toLowerCase();
    var found = servers.find(function(s) { 
        var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].split(':')[0].toLowerCase();
        return host === sUrl;
    });
    return found ? found.name : 'Lampa - (' + host + ')';
}

function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);
    var host = url.replace(/https?:\/\//, "").split('/')[0].split(':')[0].toLowerCase();
    if (host === window.location.hostname.toLowerCase().split(':')[0]) return callback(true);

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
    var current_host = window.location.hostname.toLowerCase().split(':')[0];
    var current_friendly = getFriendlyName(current_host);
    
    // КРОК 1: ВБИВАЄМО ЗАЦИКЛЕННЯ ПРИ СТАРТІ
    // Щойно ми зайшли на сторінку - чистимо команду на редірект
    Lampa.Storage.set('location_server', '-');

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
                
                item.on('hover:enter click', function() {
                    if (server_states[srv.url] === false) {
                        Lampa.Noty.show('Сервер недоступний');
                        return;
                    }
                    
                    // КРОК 2: ТІЛЬКИ ВІЗУАЛЬНИЙ ВИБІР
                    selected_target = srv.url; 
                    Lampa.Noty.show('Вибрано: ' + srv.name);
                    
                    item.parent().find('.settings-param__name').css('color', 'white');
                    item.find('.settings-param__name').css('color', 'yellow');
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '; font-size: 0.85em;">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }, index * 200);
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
                if (selected_target) {
                    var host_to_go = selected_target.replace(/https?:\/\//, "").split('/')[0].split(':')[0].toLowerCase();
                    
                    // Якщо ми вже тут - нічого не робимо
                    if (host_to_go === current_host) {
                        Lampa.Noty.show('Ви вже на цьому сервері');
                        return;
                    }

                    // КРОК 3: ПЕРЕХІД БЕЗ ПОВЕРНЕННЯ
                    // Пишемо в Storage тільки перед самим стрибком
                    Lampa.Storage.set('location_server', selected_target);
                    var finalUrl = (selected_target.indexOf('://') === -1 ? 'http://' : '') + selected_target;
                    window.location.replace(finalUrl + (finalUrl.indexOf('?') > -1 ? '&' : '?') + 'redirect=1');
                } else {
                    Lampa.Noty.show('Виберіть сервер зі списку');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
