(function() {
    'use strict';
    Lampa.Platform.tv();

    // Іконки
    var icon_server_redirect = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 13H3V11H21V13ZM21 7H3V5H21V7ZM21 19H3V17H21V19Z" fill="white"/></svg>';
    var icon_globe = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>';

    var servers = [
        { name: 'Lampa - (Koyeb)', url: 'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (MX)', url: 'lampa.mx' },
        { name: 'Lampa (NNMTV)', url: 'lam.nnmtv.pw' },
        { name: 'Lampa (VIP)', url: 'lampa.vip' },
        { name: 'Prisma', url: 'prisma.ws/' }
    ];

    var server_states = {};

    function getFriendlyName(url) {
        if (!url) return 'Lampa';
        var host = url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
        var found = servers.find(function(s) {
            var sUrl = s.url.replace(/https?:\/\//, "").split('/')[0].toLowerCase();
            return host === sUrl || host.indexOf(sUrl) !== -1 || sUrl.indexOf(host) !== -1;
        });
        return found ? found.name : 'Lampa - (' + host + ')';
    }

    // НАДІЙНА ПЕРЕВІРКА (Завантаження системного ассету)
    function checkOnline(url, callback) {
        if (!url || url === '-') return callback(true);
        var domain = url.split('?')[0].replace(/\/$/, "");
        var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;
        
        // Перевіряємо завантаження стандартної іконки налаштувань, яка є в кожній версії Лампи
        // Це надійніше ніж favicon або iframe
        var imgUrl = testUrl + '/img/icons/menu/settings.svg?t=' + Date.now();
        
        var img = new Image();
        var done = false;
        
        img.onload = function() {
            if(!done) { done = true; callback(true); }
        };
        
        img.onerror = function() {
            if(!done) { done = true; callback(false); }
        };

        img.src = imgUrl;

        setTimeout(function() {
            if (!done) {
                done = true;
                img.src = ""; // Stop loading
                callback(false);
            }
        }, 4000); // Таймаут 4 сек
    }

    function addHeaderButton() {
        // Додаємо кнопку у верхній бар, якщо її немає
        if ($('.head .open--redirect-plugin').length) return;

        var btn = $('<div class="head__action selector open--redirect-plugin" style="cursor: pointer;">' + icon_globe + '</div>');
        
        btn.on('hover:enter click', function() {
            Lampa.Settings.open('location_redirect');
        });

        // Вставляємо перед кнопкою налаштувань
        if ($('.head .open--settings').length) {
            $('.head .open--settings').before(btn);
        } else {
            $('.head .head__actions').append(btn);
        }
    }

    function startMe() {
        var current_host = window.location.hostname;
        var current_friendly = getFriendlyName(current_host);

        // Додаємо кнопку завжди
        addHeaderButton();

        // --- ЛОГІКА РЕДИРЕКТУ (З ЗАХИСТОМ ВІД ЗАЦИКЛЕННЯ) ---
        if (window.location.search.indexOf('redirect=1') === -1) {
            var savedServer = Lampa.Storage.get('location_server');
            
            // Якщо сервер збережено і ми не на ньому
            if (savedServer && savedServer !== '-' && current_host !== savedServer) {
                // ПЕРЕВІРЯЄМО ЧИ ЖИВИЙ ЦІЛЬОВИЙ СЕРВЕР ПЕРЕД ПЕРЕХОДОМ
                checkOnline(savedServer, function(isOk) {
                    if (isOk) {
                        window.location.href = 'http://' + savedServer + '?redirect=1';
                    } else {
                        // Якщо збережений сервер мертвий - залишаємось тут і повідомляємо
                        Lampa.Noty.show('Збережений сервер (' + savedServer + ') недоступний. Залишаємось тут.');
                        console.log('Redirect aborted: Target server offline');
                    }
                });
                // Перериваємо, щоб інтерфейс не блимав зайвий раз, хоча checkOnline асинхронний
            }
        } else {
            // Ми успішно перейшли. Нічого не скидаємо, щоб зберегти вибір користувача,
            // але завдяки перевірці вище, якщо сервер впаде, ми не потрапимо в петлю наступного разу.
        }

        // --- НАЛАШТУВАННЯ ---
        
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
                item.removeClass('selector selector-item').css({ 'pointer-events': 'none', 'padding-top': '15px' });
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
                        Lampa.Storage.set('location_server', srv.url);
                        Lampa.Settings.update();
                        Lampa.Noty.show('Вибрано: ' + srv.name);
                    });

                    setTimeout(function() {
                        checkOnline(srv.url, function(isOk) {
                            server_states[srv.url] = isOk;
                            var color = isOk ? '#2ecc71' : '#ff4c4c';
                            var isSelected = Lampa.Storage.get('location_server') === srv.url;

                            if (!isOk) item.css('opacity', '0.4');
                            else item.css('opacity', '1');

                            item.find('.settings-param__name').html((isSelected ? '✓ ' : '') + srv.name + ' <span style="color:' + color + '; font-size: 0.85em;">- ' + (isOk ? 'доступний' : 'недоступний') + '</span>');
                        });
                    }, index * 200); // Трохи пришвидшив перевірку списку
                }
            });
        });

        Lampa.SettingsApi.addParam({
            component: 'location_redirect',
            param: { name: 'apply_reload', type: 'static' },
            field: { name: 'ЗМІНИТИ СЕРВЕР (Перезавантажити)' },
            onRender: function(item) {
                item.addClass('selector selector-item').css({ 'cursor': 'pointer', 'margin-top': '15px' });
                item.on('hover:enter click', function() {
                    var target = Lampa.Storage.get('location_server');
                    if (target && target !== '-') {
                        // Перевірка перед ручним перезавантаженням
                        checkOnline(target, function(isOk){
                             if(!isOk) {
                                 Lampa.Noty.show('Неможливо перейти: сервер недоступний');
                             } else {
                                 window.location.href = 'http://' + target + '?redirect=1';
                             }
                        });
                    } else {
                        Lampa.Noty.show('Сервер не вибрано');
                    }
                });
                item.find('.settings-param__name').css({ 'color': '#3498db', 'font-weight': 'bold' });
            }
        });
    }

    if (window.appready) startMe();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') startMe();
        });
    }
})();
