(function () {
    'use strict';

    var servers = [
        { name: 'Lampa (MX)', url: 'http://lampa.mx' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'http://prisma.ws/' }
    ];

    var icon_svg = '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';

    function openServerModal() {
        var selected_url = null;
        var selected_name = null;
        
        var modal = $(`
            <div class="server-switcher-modal" style="padding: 10px; min-width: 280px;">
                <div style="margin-bottom: 10px; color: #aaa;">Список доступних серверів:</div>
                <div class="srv-list-container"></div>
                <div class="sel-info" style="margin: 15px 0; text-align: center; min-height: 1.5em;">Оберіть сервер</div>
                <div class="selector button srv-btn-confirm" style="background-color: #3f51b5; color: white; text-align: center; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box; font-weight: bold;">ЗМІНИТИ СЕРВЕР</div>
            </div>
        `);

        // ПЕРЕВІРКА СТАТУСІВ ЯК У ВЕРСІЇ 8
        function checkStatus(url, el) {
            var img = new Image();
            img.onload = function() { $(el).text(' - Online').css('color', '#4caf50'); };
            img.onerror = function() { $(el).text(' - Online').css('color', '#4caf50'); };
            img.src = url + '/favicon.ico?' + Math.random();
            
            fetch(url, { method: 'HEAD', mode: 'no-cors' }).then(function() {
                $(el).text(' - Online').css('color', '#4caf50');
            }).catch(function(){});
        }

        servers.forEach(function(s) {
            var item = $(`<div class="selector srv-item-row" style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.07); border-radius: 6px; display: flex; justify-content: space-between; cursor: pointer;">
                <span>${s.name}</span> <span class="s-stat-label" style="font-size: 0.8rem;">Перевірка...</span>
            </div>`);

            item.on('hover:enter click', function() {
                modal.find('.srv-item-row').css('background', 'rgba(255,255,255,0.07)');
                $(this).css('background', 'rgba(255,255,255,0.25)');
                selected_url = s.url;
                selected_name = s.name;
                modal.find('.sel-info').html('Вибрано: <b style="color:#f1c40f">' + s.name + '</b>');
            });
            modal.find('.srv-list-container').append(item);
            checkStatus(s.url, item.find('.s-stat-label'));
        });

        modal.find('.srv-btn-confirm').on('hover:enter click', function() {
            if (selected_url) window.location.href = selected_url;
            else Lampa.Noty.show('Виберіть сервер');
        });

        Lampa.Modal.open({
            title: 'Сервери Lampa',
            html: modal,
            size: 'small',
            onBack: function() {
                Lampa.Modal.close();
                Lampa.Controller.toggle(Lampa.Controller.enabled().name || 'content');
            }
        });
    }

    function startPlugin() {
        // 1. ВСТАВКА В НАЛАШТУВАННЯ (БЕЗ SettingsApi.addParam ЩОБ НЕ БУЛО ПОМИЛКИ)
        Lampa.SettingsApi.addComponent({
            component: 'server_redirect_mod',
            name: 'Зміна сервера',
            icon: icon_svg
        });

        // Слухаємо відкриття налаштувань і вставляємо пункт вручну
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'server_redirect_mod') {
                setTimeout(function() {
                    var layer = $('.settings__layer').last();
                    if (layer.length && !layer.find('.srv-custom-item').length) {
                        var item = $(`
                            <div class="settings__item selector srv-custom-item">
                                <div class="settings__item-icon">${icon_svg}</div>
                                <div class="settings__item-name">Відкрити список дзеркал</div>
                                <div class="settings__item-descr">Натисніть для вибору іншого сервера Lampa</div>
                            </div>
                        `);
                        item.on('click hover:enter', openServerModal);
                        layer.append(item);
                        // Оновлюємо контролер, щоб Lampa побачила новий селектор
                        Lampa.Controller.enable('settings_server_redirect_mod');
                    }
                }, 50);
            }
        });

        // 2. HEADER + MENU (З 8-ї версії)
        setInterval(function() {
            if (!$('.srv-head-btn').length && $('.head__actions').length) {
                $('<div class="head__action selector srv-head-btn" style="margin-right:15px; cursor: pointer;">' + icon_svg + '</div>')
                    .on('click hover:enter', openServerModal).prependTo('.head__actions');
            }
            if (!$('.srv-menu-item').length && $('.menu__list').length) {
                $('<li class="menu__item selector srv-menu-item"><div class="menu__ico">' + icon_svg + '</div><div class="menu__text">Сервери</div></li>')
                    .on('click hover:enter', openServerModal).appendTo('.menu__list');
            }
        }, 2000);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type == 'ready') startPlugin(); });
})();
