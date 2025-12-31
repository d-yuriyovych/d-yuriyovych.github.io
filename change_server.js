(function () {
    'use strict';

    function ServerSwitch(object) {
        var network = new Lampa.Reguest();
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];
        
        var html = $('<div></div>');
        var active_item;

        this.create = function () {
            var _this = this;

            // Поточний сервер
            html.append('<div class="settings-title">Поточний сервер</div>');
            var cur = $('<div class="settings-param selector"><div class="settings-param__name" style="color:#f5c518">' + window.location.hostname + '</div><div class="settings-param__descr">Ви використовуєте це дзеркало зараз</div></div>');
            html.append(cur);

            // Список для вибору
            html.append('<div class="settings-title">Доступні дзеркала</div>');

            items.forEach(function (item) {
                var itm = $('<div class="settings-param selector"><div class="settings-param__name">' + item.name + '</div><div class="settings-param__descr">' + item.url + '</div></div>');
                
                itm.on('hover:enter', function () {
                    active_item = item;
                    Lampa.Select.show({
                        title: 'Підтвердження',
                        items: [
                            {title: 'Перейти на ' + item.name, go: true},
                            {title: 'Скасувати'}
                        ],
                        onSelect: function (a) {
                            if (a.go) window.location.href = item.url;
                            else Lampa.Controller.toggle('content');
                        },
                        onBack: function () {
                            Lampa.Controller.toggle('content');
                        }
                    });
                });
                html.append(itm);
            });

            scroll.append(html);
        };

        this.render = function () {
            return scroll.render();
        };

        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () {
            network.clear();
            scroll.destroy();
            html.remove();
        };
    }

    // Реєстрація плагіна в системі Lampa
    function init() {
        Lampa.Component.add('server_switch', ServerSwitch);

        var open = function () {
            Lampa.Activity.push({
                url: '',
                title: 'Зміна сервера',
                component: 'server_switch',
                page: 1
            });
        };

        // Вставка в інтерфейс через перевірку кожну секунду
        setInterval(function () {
            // 1. Шапка
            if ($('.header__actions').length && !$('.js-server-switch-head').length) {
                var btn = $('<div class="header__action selector js-server-switch-head" title="Сервер"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path></svg></div>');
                btn.on('click hover:enter', open);
                $('.header__actions').prepend(btn);
            }

            // 2. Меню зліва
            if ($('.menu__list').length && !$('.js-server-switch-menu').length) {
                var item = $('<li class="menu__item selector js-server-switch-menu"><div class="menu__ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg></div><div class="menu__text">Сервер</div></li>');
                item.on('click hover:enter', open);
                var set = $('.menu__item[data-action="settings"]');
                if (set.length) set.before(item);
                else $('.menu__list').append(item);
            }

            // 3. Головне вікно налаштувань
            if ($('.settings__content').length && !$('.js-server-switch-settings').length) {
                var param = $('<div class="settings-param selector js-server-switch-settings"><div class="settings-param__name" style="color:#f5c518">Зміна сервера</div><div class="settings-param__descr">Перехід на інше дзеркало Lampa</div></div>');
                param.on('click hover:enter', open);
                $('.settings__content').prepend(param);
            }
        }, 1000);
    }

    // Чекаємо на завантаження Lampa
    if (window.Lampa) init();
    else {
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready') init();
        });
    }
})();
