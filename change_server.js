(function () {
    'use strict';

    // 1. Створюємо функцію вікна (компонент)
    function SS_Comp(object) {
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var list = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' },
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];
        
        this.create = function () {
            var _this = this;
            var html = $('<div><div class="settings-title">Вибір сервера</div></div>');

            list.forEach(function (item) {
                var itm = $('<div class="settings-param selector"><div class="settings-param__name">' + item.name + '</div><div class="settings-param__descr">' + item.url + '</div></div>');
                itm.on('hover:enter', function () {
                    window.location.href = item.url;
                });
                html.append(itm);
            });
            scroll.append(html);
        };

        this.render = function () { return scroll.render(); };
        this.pause = function () {};
        this.stop = function () {};
        this.destroy = function () { scroll.destroy(); };
    }

    // 2. Функція ініціалізації
    function start() {
        Lampa.Component.add('ss_plugin', SS_Comp);

        var openSS = function() {
            Lampa.Activity.push({
                title: 'Сервери',
                component: 'ss_plugin',
                page: 1
            });
        };

        // 3. Пряма вставка в DOM через інтервал (найтупіший, але найнадійніший метод)
        setInterval(function() {
            // ШАПКА
            if ($('.header__actions').length && !$('.ss-h').length) {
                var h = $('<div class="header__action selector ss-h" style="color:#f5c518 !important"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"></path></svg></div>');
                h.on('click', openSS);
                $('.header__actions').prepend(h);
            }

            // МЕНЮ ЗЛІВА
            if ($('.menu__list').length && !$('.ss-m').length) {
                var m = $('<li class="menu__item selector ss-m"><div class="menu__ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5c518" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect></svg></div><div class="menu__text">Сервер</div></li>');
                m.on('click', openSS);
                $('.menu__list').find('.menu__item[data-action="settings"]').before(m);
            }

            // НАЛАШТУВАННЯ (головний екран)
            if ($('.settings__content').length && !$('.ss-s').length) {
                var s = $('<div class="settings-param selector ss-s"><div class="settings-param__name" style="color:#f5c518">Зміна сервера</div><div class="settings-param__descr">Перейти на інше дзеркало</div></div>');
                s.on('click', openSS);
                $('.settings__content').prepend(s);
            }
        }, 1000);
    }

    // Запуск
    if (window.Lampa) start();
    else {
        document.addEventListener('DOMContentLoaded', function() {
            if (window.Lampa) start();
        });
    }
})();
