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

    // --- ФУНКЦІЯ ВІДКРИТТЯ ВІКНА ВИБОРУ ---
    function openServerModal() {
        var selected_url = null;
        var selected_name = null;
        
        var modal = $(`
            <div class="server-switcher-modal" style="padding: 10px; min-width: 280px;">
                <div style="margin-bottom: 10px; color: #aaa;">Доступні сервери:</div>
                <div class="srv-list-container"></div>
                <div class="sel-info" style="margin: 15px 0; text-align: center; color: #fff;">Оберіть сервер</div>
                <div class="selector button srv-btn-confirm" style="background-color: #3f51b5; color: white; text-align: center; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box;">ЗМІНИТИ СЕРВЕР</div>
            </div>
        `);

        function checkStatus(url, el, item) {
            var controller = new AbortController();
            var timeout = setTimeout(() => controller.abort(), 3500);

            fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-cache', signal: controller.signal })
            .then(() => {
                clearTimeout(timeout);
                $(el).text(' - Online').css('color', '#4caf50');
            })
            .catch(() => {
                clearTimeout(timeout);
                $(el).text(' - Offline').css('color', '#f44336');
                // Не блокуємо вибір, навіть якщо Offline (про всяк випадок)
            });
        }

        servers.forEach(s => {
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
            checkStatus(s.url, item.find('.s-stat-label'), item);
        });

        modal.find('.srv-btn-confirm').on('hover:enter click', function() {
            if (selected_url) {
                Lampa.Noty.show('Перехід на ' + selected_name);
                setTimeout(() => { window.location.href = selected_url; }, 500);
            } else {
                Lampa.Noty.show('Виберіть сервер зі списку');
            }
        });

        Lampa.Modal.open({
            title: 'Сервери Lampa',
            html: modal,
            size: 'small',
            onBack: function() {
                Lampa.Modal.close();
                Lampa.Controller.toggle(Lampa.Controller.enabled().name);
            }
        });
    }

    // --- ОСНОВНА ЛОГІКА ТА ІНТЕГРАЦІЯ ---
    function startPlugin() {
        // 1. Метод з твого аналогу (SettingsApi) - гарантує пункт в налаштуваннях
        Lampa.SettingsApi.addComponent({
            component: 'server_redirect_mod',
            name: 'Зміна сервера',
            icon: icon_svg
        });

        Lampa.SettingsApi.addParam({
            component: 'server_redirect_mod',
            param: { name: 'open_modal_trigger', type: 'title' },
            field: { name: 'Відкрити список серверів' },
            onRender: function(item) {
                item.addClass('selector');
                item.on('click hover:enter', function() {
                    openServerModal();
                });
            }
        });

        // 2. Додаткові кнопки (Шапка та Ліве меню) - через інтервал
        setInterval(function() {
            // Header
            var head = $('.head__actions');
            if (head.length && !head.find('.srv-head-btn').length) {
                $('<div class="head__action selector srv-head-btn" style="margin-right:15px; cursor: pointer;">' + icon_svg + '</div>')
                    .on('click hover:enter', openServerModal).prependTo(head);
            }

            // Menu
            var menu = $('.menu__list');
            if (menu.length && !menu.find('.srv-menu-item').length) {
                $('<li class="menu__item selector srv-menu-item"><div class="menu__ico">' + icon_svg + '</div><div class="menu__text">Сервери</div></li>')
                    .on('click hover:enter', openServerModal).appendTo(menu);
            }
        }, 2000);
    }

    // Запуск після готовності
    if (window.appready) startPlugin();
    else {
        Lampa.Listener.follow('app', function(e) {
            if (e.type == 'ready') startPlugin();
        });
    }

})();
