(function () {
    'use strict';

    if (!window.Lampa) return;

    const PLUGIN_NAME = 'server_switcher';

    const SERVERS = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx', default: true },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'https://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'https://prisma.ws' }
    ];

    let selected = null;
    let status = {};

    /* ---------- перевірка доступності ---------- */
    function check(url) {
        return fetch(url, { method: 'HEAD', cache: 'no-store' })
            .then(() => true)
            .catch(() => false);
    }

    async function updateStatus() {
        status = {};
        for (let s of SERVERS) {
            status[s.url] = await check(s.url);
        }
    }

    function currentName() {
        let cur = Lampa.Storage.get('server') || '';
        let found = SERVERS.find(s => cur.includes(s.url));
        return found ? found.name : 'Невідомо';
    }

    function dot(ok) {
        return ok
            ? '<span style="color:#4CAF50">●</span>'
            : '<span style="color:#F44336">●</span>';
    }

    /* ---------- головне меню ---------- */
    function openMenu() {
        selected = null;

        updateStatus().then(() => {
            let items = [];

            items.push({ title: 'Поточний сервер:', noselect: true });
            items.push({
                title: `<span style="color:yellow">${currentName()}</span>`,
                noselect: true
            });

            items.push({ title: ' ', noselect: true });
            items.push({ title: 'Список серверів:', noselect: true });

            SERVERS.forEach(s => {
                let ok = status[s.url];

                items.push({
                    title: `${dot(ok)} ${s.name}`,
                    disabled: !ok,
                    select: () => {
                        if (!ok) {
                            Lampa.Noty.show('Сервер недоступний');
                            return;
                        }
                        selected = s;
                        Lampa.Noty.show(`Обрано: ${s.name}`);
                    }
                });
            });

            items.push({ title: ' ', noselect: true });

            items.push({
                title: '<span style="color:#03A9F4">Застосувати сервер</span>',
                select: () => {
                    if (!selected) {
                        Lampa.Noty.show('❗ Оберіть сервер');
                        return;
                    }

                    Lampa.Storage.set('server', selected.url);
                    Lampa.Noty.show(
                        `Сервер змінено на: ${selected.name}\nПерезапустіть Lampa`
                    );
                }
            });

            Lampa.Select.show({
                title: 'Зміна сервера',
                items: items
            });
        });
    }

    /* ---------- реєстрація плагіна ---------- */
    Lampa.Plugin.register({
        name: 'Зміна сервера',
        version: '1.0.0',
        author: 'ChatGPT',
        description: 'Зміна сервера Lampa з перевіркою доступності',
        icon: 'network_check',
        oninit: function () {

            /* кнопка в лівому меню */
            Lampa.Menu.add({
                title: 'Зміна сервера',
                icon: 'network_check',
                action: openMenu
            });

            /* кнопка в шапці */
            Lampa.Header.add({
                title: 'Сервер',
                icon: 'dns',
                action: openMenu
            });
        }
    });

})();
