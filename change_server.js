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
        var modal = $(`
            <div class="server-switcher-modal" style="padding: 10px; min-width: 280px;">
                <div style="margin-bottom: 10px; color: #aaa;">Оберіть сервер:</div>
                <div class="srv-list-container"></div>
                <div class="sel-info" style="margin: 15px 0; text-align: center; color: #f1c40f; min-height: 1.2em;"></div>
                <div class="selector button srv-btn-confirm" style="background-color: #3f51b5; color: white; text-align: center; padding: 12px; border-radius: 8px; width: 100%; box-sizing: border-box;">ПЕРЕЙТИ</div>
            </div>
        `);

        servers.forEach(function(s) {
            var item = $(`<div class="selector srv-item-row" style="padding: 12px; margin-bottom: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; display: flex; justify-content: space-between; cursor: pointer;">
                <span>${s.name}</span>
            </div>`);

            item.on('hover:enter click', function() {
                modal.find('.srv-item-row').css('background', 'rgba(255,255,255,0.1)');
                $(this).css('background', 'rgba(255,255,255,0.3)');
                selected_url = s.url;
                modal.find('.sel-info').text('Вибрано: ' + s.name);
            });
            modal.find('.srv-list-container').append(item);
        });

        modal.find('.srv-btn-confirm').on('hover:enter click', function() {
            if (selected_url) window.location.href = selected_url;
        });

        Lampa.Modal.open({
            title: 'Сервери Lampa',
            html: modal,
            size: 'small',
            onBack: function() {
                Lampa.Modal.close();
                // ПРИМУСОВЕ ПОВЕРНЕННЯ ФОКУСУ
                setTimeout(function(){
                    Lampa.Controller.toggle(Lampa.Controller.enabled().name || 'content');
                }, 100);
            }
        });
    }

    function startPlugin() {
        // РЕЄСТРАЦІЯ КОМПОНЕНТА В НАЛАШТУВАННЯХ
        Lampa.SettingsApi.addComponent({
            component: 'server_redirect_mod',
            name: 'Зміна сервера',
            icon: icon_svg
        });

        // ДОДАВАННЯ ПУНКТУ ЯК ПРОСТОЇ КНОПКИ (БЕЗ ПАРАМЕТРІВ)
        Lampa.SettingsApi.addParam({
            component: 'server_redirect_mod',
            param: { name: 'any_trigger', type: 'title' },
            field: { name: 'Відкрити список дзеркал' },
            onRender: function(item) {
                // Використовуємо setTimeout щоб Lampa встигла відрендерити елемент
                setTimeout(function() {
                    item.addClass('selector').off('click').on('click', function() {
                        openServerModal();
                    });
                }, 10);
            }
        });

        // HEADER + MENU
        setInterval(function() {
            if (!$('.srv-head-btn').length && $('.head__actions').length) {
                $('<div class="head__action selector srv-head-btn" style="margin-right:15px;">' + icon_svg + '</div>')
                    .off('click').on('click', openServerModal).prependTo('.head__actions');
            }
            if (!$('.srv-menu-item').length && $('.menu__list').length) {
                $('<li class="menu__item selector srv-menu-item"><div class="menu__ico">' + icon_svg + '</div><div class="menu__text">Сервери</div></li>')
                    .off('click').on('click', openServerModal).appendTo('.menu__list');
            }
        }, 2000);
    }

    if (window.appready) startPlugin();
    else Lampa.Listener.follow('app', function(e) { if (e.type == 'ready') startPlugin(); });
})();
