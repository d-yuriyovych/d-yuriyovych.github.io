(function () {
    'use strict';

    if (!window.Lampa) return;

    const SERVERS = [
        { name: 'Lapma (MX)', url: 'https://lampa.mx', default: true },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app' },
        { name: 'Lampa (VIP)', url: 'https://lampa.vip' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
        { name: 'Prisma', url: 'https://prisma.ws' }
    ];

    let selected = null;
    let statuses = {};

    function checkServer(server) {
        return fetch(server.url, { method: 'HEAD', cache: 'no-store' })
            .then(() => true)
            .catch(() => false);
    }

    async function updateStatuses() {
        statuses = {};
        await Promise.all(
            SERVERS.map(async s => {
                statuses[s.url] = await checkServer(s);
            })
        );
    }

    function getCurrentServerName() {
        let current = Lampa.Storage.get('server') || '';
        let found = SERVERS.find(s => current.indexOf(s.url) !== -1);
        return found ? found.name : 'Невідомо';
    }

    function statusText(server) {
        return statuses[server.url]
            ? '<span style="color:#4CAF50">●</span>'
            : '<span style="color:#F44336">●</span>';
    }

    function openMenu() {
        selected = null;

        updateStatuses().then(() => {
            let items = [];

            // Поточний сервер
            items.push({
                title: 'Поточний сервер:',
                noselect: true
            });

            items.push({
                title: `<span style="color:yellow">${getCurrentServerName()}</span>`,
                noselect: true
            });

            items.push({ title: ' ', noselect: true });

            // Список серверів
            items.push({
                title: 'Список серверів:',
                noselect: true
            });

            SERVERS.forEach(server => {
                let online = statuses[server.url];

                items.push({
                    title: `${statusText(server)} ${server.name}`,
                    disabled: !online,
                    select: function () {
                        if (!online) {
                            Lampa.Noty.show('Сервер недоступний');
                            return;
                        }

                        selected = server;
                        Lampa.Noty.show(`Обрано сервер: ${server.name}`);
                    }
                });
            });

            items.push({ title: ' ', noselect: true });

            // Кнопка застосування
            items.push({
                title: '<span style="color:#03A9F4">Застосувати сервер</span>',
                select: function () {
                    if (!selected) {
                        Lampa.Noty.show('❗ Спочатку виберіть сервер');
                        return;
                    }

                    Lampa.Storage.set('server', selected.url);
                    Lampa.Noty.show(
                        `Сервер змінено на: ${selected.name}\nПерезапустіть додаток`
                    );
                }
            });

            Lampa.Select.show({
                title: 'Зміна сервера',
                items: items
            });
        });
    }

    // Кнопка в меню налаштувань
    Lampa.SettingsApi.addParam({
        component: 'server_switcher',
        param: {
            type: 'button',
            name: 'Зміна сервера',
        },
        onChange: openMenu
    });

})();
