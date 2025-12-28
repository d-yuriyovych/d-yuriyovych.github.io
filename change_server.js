(function() {
'use strict';
Lampa.Platform.tv();

var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';

var servers = [
    { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
    { name: 'Lampa (MX)', url: 'lampa.mx' }, 
    { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' }, 
    { name: 'Lampa (VIP)', url: 'lampa.vip' },
    { name: 'Prisma', url: 'prisma.ws/' }
];

var server_states = {};

function normalizeHost(host) {
    if (!host) return '';
    return host
        .replace(/^https?:\/\//,'')
        .replace(/\/$/,'')
        .toLowerCase();
}

function getFriendlyName(url) {
    if (!url) return 'Lampa';
    var host = normalizeHost(url);
    var found = servers.find(function(s) { 
        return normalizeHost(s.url) === host;
    });
    return found ? found.name : 'Lampa - (' + host + ')';
}

function checkOnline(url, callback) {
    if (!url || url === '-') return callback(true);

    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;

    var frame = document.createElement('iframe');
    frame.style.display = 'none';
    var done = false;

    var timer = setTimeout(function() {
        if (!done) {
            done = true;
            if(frame.parentNode) document.body.removeChild(frame);
            callback(false);
        }
    }, 4500);

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

    var current_host = normalizeHost(window.location.hostname);
    var current_friendly = getFriendlyName(current_host);

    var savedServer = normalizeHost(Lampa.Storage.get('location_server'));
    var redirectDone = Lampa.Storage.get('location_redirect_done');

    if (!redirectDone && savedServer && savedServer !== '-' && current_host !== savedServer) {
        Lampa.Storage.set('location_redirect_done', true);
        window.location.href = 'http://' + savedServer + '?redirect=1';
        return;
    }

    if (redirectDone && current_host === savedServer) {
        Lampa.Storage.set('location_redirect_done', false);
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
                    Lampa.Storage.set('location_server', normalizeHost(srv.url));
                    Lampa.Settings.update();
                    Lampa.Noty.show('Вибрано: ' + srv.name);
                });

                setTimeout(function() {
                    checkOnline(srv.url, function(isOk) {
                        server_states[srv.url] = isOk;
                    });
                }, index * 600);
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
                var target = normalizeHost(Lampa.Storage.get('location_server'));
                if (target && target !== '-') {
                    Lampa.Storage.set('location_redirect_done', true);
                    window.location.href = 'http://' + target + '?redirect=1';
                } else {
                    Lampa.Noty.show('Сервер не вибрано');
                }
            });
        }
    });
}

if(window.appready) startMe(); 
else {
    Lampa.Listener.follow('app', function(e) {
        if(e.type == 'ready') startMe();
    });
}

})();
