(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws' }
];

var states_cache = {}; 

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
    var found = servers.find(function(s) { 
        var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        return host === sUrl || host.indexOf(sUrl) !== -1;
    });
    return found ? found.name : host;
}

function checkOnline(url, callback) {
    var domain = url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
    if (states_cache[domain] !== undefined) return callback(states_cache[domain]);

    var controller = new AbortController();
    var timeoutId = setTimeout(function() { controller.abort(); }, 2000); 

    fetch('http://' + domain + '/?t=' + Date.now(), { mode: 'no-cors', signal: controller.signal })
        .then(function() {
            clearTimeout(timeoutId);
            states_cache[domain] = true;
            callback(true);
        })
        .catch(function() {
            clearTimeout(timeoutId);
            states_cache[domain] = false;
            callback(false);
        });
}

function startMe() { 
    // Очищуємо кеш статусів ПРИ КОЖНОМУ відкритті
    states_cache = {};

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
            item.removeClass('selector selector-item').css({'pointer-events': 'none', 'padding-top': '15px', 'opacity': '0.6'});
        }
    });

    servers.forEach(function(srv) {
        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'srv_' + srv.url.replace(/\W/g, ''), type: 'static' },
            field: { name: srv.name },
            onRender: function(item) {
                item.addClass('selector selector-item');
                // Видаляємо старий стан для цього сервера, щоб перевірити заново
                delete states_cache[srv.url.replace(/\/$/, "")];

                checkOnline(srv.url, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    item.find('.settings-param__name').html(srv.name + ' <span style="color:' + color + '">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                    if (!isOk) item.css('opacity', '0.4');
                });

                item.on('hover:enter click', function() {
                    var domain = srv.url.replace(/https?:\/\//, "").split('/')[0].replace(/\/$/, "");
                    if (states_cache[domain] === false) {
                        Lampa.Noty.show('Сервер недоступний');
                        return;
                    }
                    // Фіксуємо вибір у Storage
                    Lampa.Storage.set('location_server', srv.url);
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
            item.addClass('selector selector-item').on('hover:enter click', function() {
                var target = Lampa.Storage.get('location_server');
                
                if (target && target !== '-') {
                    var clean = target.replace(/https?:\/\//, "").replace(/\/$/, "");
                    
                    // Записуємо нову адресу в налаштування Android-додатка
                    Lampa.Storage.set('server_url', clean);
                    Lampa.Storage.set('location_server', '-');
                    
                    Lampa.Noty.show('Перехід на ' + clean);
                    
                    setTimeout(function(){
                        // Повністю змінюємо URL і перезавантажуємося
                        var final_url = 'http://' + clean + '/?r=' + Math.random();
                        window.location.replace(final_url);
                    }, 300);
                } else {
                    Lampa.Noty.show('Виберіть доступний сервер зі списку');
                }
            });
            item.find('.settings-param__name').css({'color': '#3498db', 'font-weight': 'bold'});
        }
    });
} 

// Слухач для оновлення при вході
Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); });
Lampa.Listener.follow('settings', function(e) {
    if(e.type == 'open' && e.name == 'location_redirect') {
        startMe();
    }
});
})();
