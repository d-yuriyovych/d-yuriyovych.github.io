(function () {
    'use strict';

    function ServerSwitch(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var items = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];
        
        var html = $('<div></div>');

        this.create = function () {
            var _this = this;
            html.append('<div class="settings-title">Поточний сервер: ' + window.location.hostname + '</div>');

            items.forEach(function (item) {
                var itm = $('<div class="settings-param selector"><div class="settings-param__name">' + item.name + '</div><div class="settings-param__descr">' + item.url + '</div></div>');
                itm.on('hover:enter', function () {
                    Lampa.Select.show({
                        title: 'Перехід',
                        items: [{title: 'Запустити ' + item.name, go: true}, {title: 'Відміна'}],
                        onSelect: function (a) {
                            if (a.go) window.location.href = item.url;
                            else Lampa.Controller.toggle('content');
                        },
                        onBack: function () { Lampa.Controller.toggle('content'); }
                    });
                });
                html.append(itm);
            });
            scroll.append(html);
        };

        this.render = function () { return scroll.render(); };
        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () { scroll.destroy(); html.remove(); };
    }

    function init() {
        // 1. Реєстрація компонента
        Lampa.Component.add('server_switch', ServerSwitch);

        // 2. Функція відкриття
        var open = function () {
            Lampa.Activity.push({
                url: '',
                title: 'Зміна сервера',
                component: 'server_switch',
                page: 1
            });
        };

        // 3. Реєстрація в головних налаштуваннях через API
        Lampa.SettingsApi.addParam({
            component: 'server_switch',
            param: {
                name: 'server_switch_link',
                title: 'Зміна сервера',
                description: 'Швидкий перехід на інше дзеркало Lampa',
                icon: 'server'
            },
            field: { name: 'Відкрити' },
            onChange: function() { open(); }
        });

        // 4. Потужний інжектор для Шапки та Меню
        var inject = function() {
            // Шапка
            if ($('.header__actions').length && !$('.js-ss-head').length) {
                var btn = $('<div class="header__action selector js-ss-head"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path></svg></div>');
                btn.on('click', function(e) { e.preventDefault(); open(); });
                $('.header__actions').prepend(btn);
            }
            // Ліве меню
            if ($('.menu__list').length && !$('.js-ss-menu').length) {
                var item = $('<li class="menu__item selector js-ss-menu"><div class="menu__ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg></div><div class="menu__text">Сервер</div></li>');
                item.on('click', function(e) { e.preventDefault(); open(); });
                var set = $('.menu__item[data-action="settings"]');
                if (set.length) set.before(item); else $('.menu__list').append(item);
            }
        };

        // Слідкуємо за змінами в DOM (щоб кнопки не зникали)
        var observer = new MutationObserver(inject);
        observer.observe(document.body, { childList: true, subtree: true });
        inject();
    }

    if (window.Lampa) init();
    else Lampa.Listener.follow('app', function (e) { if (e.type == 'ready') init(); });
})();
