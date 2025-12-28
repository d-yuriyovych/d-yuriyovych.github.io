(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws' }
];

var server_states = {};

function checkOnline(url, callback) {
    var testUrl = window.location.protocol + '//' + url.replace(/https?:\/\//, "") + '/favicon.ico?v=' + Math.random();
    var img = new Image();
    var done = false;
    img.onload = function() { if (!done) { done = true; callback(true); } };
    img.onerror = function() { if (!done) { done = true; callback(true); } };
    setTimeout(function() { if (!done) { done = true; callback(false); } }, 4000);
    img.src = testUrl;
}

function startMe() { 
    var current_host = window.location.hostname.toLowerCase();

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
            var srvTitle = "Lampa (Невідомий)";
            for(var i = 0; i < servers.length; i++) {
                if(current_host.indexOf(servers[i].url.split('/')[0]) !== -1) {
                    srvTitle = servers[i].name;
                    break;
                }
            }
            checkOnline(current_host, function(isOk) {
                var color = isOk ? '#2ecc71' : '#ff4c4c';
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

    // Список серверів
    for(var j = 0; j < servers.length; j++) {
        (function(srv, idx) {
            Lampa.SettingsApi.addParam({
                component: 'location_redirect',
                param: { name: 'srv_' + idx, type: 'static' },
                field: { name: srv.name },
                onRender: function(item) {
                    item.addClass('selector selector-item').css('cursor', 'pointer');
                    item.on('hover:enter click', function() {
                        if (server_states[srv.url]) {
                            Lampa.Storage.set('lampa_dest', srv.url); 
                            Lampa.Noty.show('Вибрано: ' + srv.name);
                        }
                    });

                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                        var color = isOk ? '#2ecc71' : '#ff4c4c';
                        item.css('opacity', isOk ? '1' : '0.4');
                        item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    });
                }
            });
        })(servers[j], j);
    }

    // Кнопка переходу
    Lampa.SettingsApi.addParam({
        component: 'location_redirect',
        param: { name: 'apply_reload', type: 'static' },
        field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
        onRender: function(item) {
            item.addClass('selector selector-item').css({'cursor': 'pointer', 'margin-top': '15px'});
            item.on('hover:enter click', function() {
                var target = Lampa.Storage.get('lampa_dest', '-');
                if (target !== '-' && server_states[target]) {
                    Lampa.Storage.set('lampa_dest', '-');
                    window.location.href = window.location.protocol + '//' + target;
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();
