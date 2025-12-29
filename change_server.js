
(function () {
    'use strict';

    // === КОНФІГУРАЦІЯ ===
    var servers = [
        { name: 'Lampa (MX)', url: 'http://lampa.mx', type: 'standard' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', type: 'custom' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip', type: 'custom' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw', type: 'custom' },
        { name: 'Prisma', url: 'http://prisma.ws/', type: 'custom' }
    ];

    var icon_svg = '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';

    function cleanUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }

    // === ЛОГІКА ІНТЕРФЕЙСУ (ВІКНО ВИБОРУ) ===
    function ServerSwitcherComponent() {
        var selected_url = null;
        var selected_name = null;
        var layer;

        function checkAvailability(url, status_element, item_element) {
            var controller = new AbortController();
            var timeoutId = setTimeout(function() { controller.abort(); }, 5000);

            fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
                .then(function() {
                    clearTimeout(timeoutId);
                    status_element.innerText = ' - Online';
                    status_element.style.color = '#4caf50';
                })
                .catch(function() {
                    clearTimeout(timeoutId);
                    status_element.innerText = ' - Offline';
                    status_element.style.color = '#f44336';
                    if(item_element) {
                        item_element.classList.remove('selector');
                        item_element.style.opacity = '0.5';
                        item_element.style.pointerEvents = 'none';
                    }
                });
        }

        this.create = function () {
            var html = `
                <div class="settings-param module-settings">
                    <div class="settings-param__head">Зміна сервера</div>
                    <div class="settings-param__body">
                        <div class="server-group-title" style="margin-bottom: 10px; color: #aaa;">Поточний сервер:</div>
                        <div class="server-current-info" style="margin-bottom: 20px; font-size: 1.2em;">
                            <span class="current-server-name" style="color: #f1c40f; font-weight: bold;">Визначається...</span>
                            <span class="current-server-status"></span>
                        </div>
                        <div class="server-group-title" style="margin-bottom: 10px; color: #aaa;">Список серверів:</div>
                        <div class="server-list" style="margin-bottom: 20px;"></div>
                        <div class="server-action" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                            <div class="selected-info" style="margin-bottom: 10px; min-height: 20px;">Виберіть сервер зі списку вище</div>
                            <div class="selector button button--primary server-submit-btn" style="background-color: #3f51b5; color: white; text-align: center; padding: 12px; border-radius: 5px; font-size: 1.1em;">ЗМІНИТИ СЕРВЕР</div>
                        </div>
                    </div>
                </div>
            `;

            layer = $(Lampa.Template.get('settings_server_switch', html));
            
            // Поточний сервер
            var currentHost = cleanUrl(window.location.host + window.location.pathname);
            var currentServerObj = servers.find(s => cleanUrl(s.url).includes(currentHost));
            var currentName = currentServerObj ? currentServerObj.name : 'Custom / ' + window.location.host;
            
            layer.find('.current-server-name').text(currentName);
            checkAvailability(window.location.href, layer.find('.current-server-status')[0], null);

            // Список
            var listContainer = layer.find('.server-list');
            servers.forEach(function(server) {
                var item = $(`<div class="selector server-item" style="padding: 12px 10px; margin-bottom: 8px; background-color: rgba(255,255,255,0.05); border-radius: 6px; display: flex; justify-content: space-between; cursor: pointer; align-items: center;">
                    <span class="server-name" style="font-weight: 500;">${server.name}</span>
                    <span class="server-status" style="margin-left: 10px; font-size: 0.9em;">Wait...</span>
                </div>`);

                item.on('hover:enter click', function() {
                    layer.find('.server-item').css('background-color', 'rgba(255,255,255,0.05)').removeClass('is-selected');
                    $(this).css('background-color', 'rgba(255,255,255,0.2)').addClass('is-selected');
                    selected_url = server.url;
                    selected_name = server.name;
                    layer.find('.selected-info').html('Вибрано: <b style="color:#f1c40f">' + server.name + '</b>');
                });

                listContainer.append(item);
                checkAvailability(server.url, item.find('.server-status')[0], item[0]);
            });

            // Кнопка
            layer.find('.server-submit-btn').on('hover:enter click', function() {
                if (!selected_url) {
                    Lampa.Noty.show('Спочатку виберіть сервер (зелений статус)');
                    return;
                }
                Lampa.Select.show({
                    title: 'Підтвердження',
                    text: 'Змінити сервер на ' + selected_name + '?',
                    items: [{ title: 'Так, змінити', value: 'yes' }, { title: 'Ні', value: 'no' }],
                    onSelect: function(a) {
                        if (a.value === 'yes') {
                            // Зберігаємо вибір (опціонально, Lampa сама запам'ятає URL)
                            localStorage.setItem('lampa_custom_server', selected_url);
                            window.location.href = selected_url;
                        } else {
                            Lampa.Controller.toggle('settings_component');
                        }
                    },
                    onBack: function() { Lampa.Controller.toggle('settings_component'); }
                });
            });

            return layer;
        };
    }

    function openSwitcher() {
        Lampa.Component.add('settings_server_switch', new ServerSwitcherComponent());
        Lampa.Settings.create('settings_server_switch');
    }

    // === МОНІТОР ІНТЕРФЕЙСУ (Агресивна вставка) ===
    function startPlugin() {
        // 1. Вставка в Налаштування (через подію)
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'settings') {
                if (e.body.find('[data-component="server_switcher"]').length) return;
                
                var item = $(`
                    <div class="settings__item selector" data-component="server_switcher">
                        <div class="settings__item-icon">${icon_svg}</div>
                        <div class="settings__item-name">Зміна сервера</div>
                        <div class="settings__item-descr">Список доступних дзеркал</div>
                    </div>
                `);
                item.on('hover:enter click', openSwitcher);
                
                // Пробуємо вставити в різні місця, щоб точно з'явилось
                var container = e.body.find('.settings__body .settings__layer').eq(0); // Загальний контейнер
                if(container.length) {
                     container.prepend(item); // Ставимо на самий верх налаштувань
                } else {
                     e.body.find('[data-component="plugins"]').after(item);
                }
            }
        });

        // 2. Вставка в Ліве Меню і Шапку (через інтервал)
        setInterval(function() {
            // --- ЛІВЕ МЕНЮ ---
            var menu = $('.menu .menu__list');
            if (menu.length && !menu.find('.server-switch-menu').length) {
                var menuItem = $(`<li class="menu__item selector server-switch-menu" data-action="server_switch">
                    <div class="menu__ico">${icon_svg}</div>
                    <div class="menu__text">Сервери</div>
                </li>`);
                menuItem.on('hover:enter click', openSwitcher);
                
                // Вставляємо після "Налаштувань" або в кінець
                var settingsParams = menu.find('[data-action="settings"]');
                if(settingsParams.length) settingsParams.after(menuItem);
                else menu.append(menuItem);
            }

            // --- ШАПКА (Header) ---
            var header = $('.head .head__actions');
            if (header.length && !header.find('.server-switch-head').length) {
                var headBtn = $(`<div class="head__action selector server-switch-head" style="margin-right:15px">
                    ${icon_svg}
                </div>`);
                headBtn.on('hover:enter click', openSwitcher);
                
                var settingsHead = header.find('.head__action--settings');
                if(settingsHead.length) settingsHead.before(headBtn);
                else header.prepend(headBtn);
            }

        }, 1500); // Перевіряємо кожні 1.5 сек
    }

    if (window.Lampa) {
        if (window.Lampa.Listener) Lampa.Listener.follow('app', 'ready', startPlugin);
        startPlugin(); // Пробуємо запустити одразу теж
    } else {
        window.addEventListener('lampa_init', startPlugin);
    }

})();
