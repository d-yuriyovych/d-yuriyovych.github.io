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

    function cleanUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }

    function ServerSwitcherComponent() {
        var selected_url = null;
        var selected_name = null;
        var layer;

        function check(url, status_el, item_el) {
            var controller = new AbortController();
            setTimeout(function() { controller.abort(); }, 4000);
            fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
                .then(function() {
                    status_el.innerText = ' - Online';
                    status_el.style.color = '#4caf50';
                })
                .catch(function() {
                    status_el.innerText = ' - Offline';
                    status_el.style.color = '#f44336';
                    if(item_el) {
                        $(item_el).removeClass('selector').css({opacity: 0.5, 'pointer-events': 'none'});
                    }
                });
        }

        this.create = function () {
            var html = $(`
                <div class="settings-param module-settings">
                    <div class="settings-param__head">Зміна сервера</div>
                    <div class="settings-param__body">
                        <div style="margin-bottom: 10px; color: #aaa;">Поточний сервер:</div>
                        <div style="margin-bottom: 20px; font-size: 1.2em;">
                            <span class="curr-name" style="color: #f1c40f; font-weight: bold;">Перевірка...</span>
                            <span class="curr-stat"></span>
                        </div>
                        <div style="margin-bottom: 10px; color: #aaa;">Список серверів:</div>
                        <div class="srv-list" style="margin-bottom: 20px;"></div>
                        <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                            <div class="sel-info" style="margin-bottom: 10px; min-height: 20px; color: #fff;">Виберіть сервер зі списку</div>
                            <div class="selector button srv-btn" style="background-color: #3f51b5; color: white; text-align: center; padding: 12px; border-radius: 5px; width: 100%; box-sizing: border-box;">ЗМІНИТИ СЕРВЕР</div>
                        </div>
                    </div>
                </div>
            `);

            layer = html;

            var currentHost = cleanUrl(window.location.host + window.location.pathname);
            var current = servers.find(s => cleanUrl(s.url).includes(currentHost));
            layer.find('.curr-name').text(current ? current.name : 'Custom');
            check(window.location.href, layer.find('.curr-stat')[0]);

            servers.forEach(function(s) {
                var item = $(`<div class="selector srv-item" style="padding: 12px 10px; margin-bottom: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; display: flex; justify-content: space-between;">
                    <span>${s.name}</span><span class="s-stat">...</span>
                </div>`);

                item.on('hover:enter click', function() {
                    layer.find('.srv-item').css('background', 'rgba(255,255,255,0.05)');
                    $(this).css('background', 'rgba(255,255,255,0.2)');
                    selected_url = s.url;
                    selected_name = s.name;
                    layer.find('.sel-info').html('Вибрано: <b style="color:#f1c40f">' + s.name + '</b>');
                });

                layer.find('.srv-list').append(item);
                check(s.url, item.find('.s-stat')[0], item[0]);
            });

            layer.find('.srv-btn').on('hover:enter click', function() {
                if (!selected_url) return Lampa.Noty.show('Виберіть сервер!');
                Lampa.Select.show({
                    title: 'Перехід',
                    text: 'Змінити сервер на ' + selected_name + '?',
                    items: [{title: 'Так', value: 'yes'}, {title: 'Ні', value: 'no'}],
                    onSelect: function(a) {
                        if (a.value === 'yes') window.location.href = selected_url;
                        else Lampa.Controller.toggle('settings_component');
                    },
                    onBack: function() { Lampa.Controller.toggle('settings_component'); }
                });
            });

            return layer;
        };
    }

    function openSrv() {
        Lampa.Component.add('srv_switcher_comp', ServerSwitcherComponent);
        Lampa.Settings.create('srv_switcher_comp');
    }

    function init() {
        // Монітор кнопок
        setInterval(function() {
            // Header
            var head = $('.head .head__actions');
            if (head.length && !head.find('.srv-head').length) {
                $(`<div class="head__action selector srv-head" style="margin-right:15px">${icon_svg}</div>`)
                    .on('hover:enter click', openSrv).insertBefore(head.find('.head__action--settings').length ? head.find('.head__action--settings') : head.firstChild);
            }
            // Меню
            var menu = $('.menu .menu__list');
            if (menu.length && !menu.find('.srv-menu').length) {
                $(`<li class="menu__item selector srv-menu"><div class="menu__ico">${icon_svg}</div><div class="menu__text">Сервери</div></li>`)
                    .on('hover:enter click', openSrv).appendTo(menu);
            }
            // Налаштування (якщо відкриті)
            var setts = $('.settings__layer');
            if (setts.length && !setts.find('.srv-sett').length) {
                $(`<div class="settings__item selector srv-sett"><div class="settings__item-icon">${icon_svg}</div><div class="settings__item-name">Зміна сервера</div></div>`)
                    .on('hover:enter click', openSrv).prependTo(setts);
            }
        }, 2000);
    }

    if (window.Lampa) init();
    else window.addEventListener('lampa_init', init);

})();
