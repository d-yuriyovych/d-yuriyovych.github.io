(function () {
    'use strict';

    // === КОНФІГУРАЦІЯ СЕРВЕРІВ ===
    var servers = [
        { name: 'Lampa (MX)', url: 'http://lampa.mx', type: 'standard' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', type: 'custom' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip', type: 'custom' },
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw', type: 'custom' },
        { name: 'Prisma', url: 'http://prisma.ws/', type: 'custom' }
    ];

    // Іконка для кнопок
    var icon_svg = '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="white"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>';

    function cleanUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }

    // === КОМПОНЕНТ ІНТЕРФЕЙСУ ===
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
                    item_element.classList.remove('selector');
                    item_element.style.opacity = '0.5';
                    item_element.style.pointerEvents = 'none';
                });
        }

        this.create = function () {
            // Шаблон вікна
            var html = `
                <div class="settings-param module-settings">
                    <div class="settings-param__head">Зміна сервера</div>
                    <div class="settings-param__body">
                        <div class="server-group-title" style="margin-bottom: 10px; color: #aaa;">Поточний сервер:</div>
                        <div class="server-current-info" style="margin-bottom: 20px; font-size: 1.1em;">
                            <span class="current-server-name" style="color: #f1c40f; font-weight: bold;">Визначається...</span>
                            <span class="current-server-status"></span>
                        </div>
                        <div class="server-group-title" style="margin-bottom: 10px; color: #aaa;">Список серверів:</div>
                        <div class="server-list" style="margin-bottom: 20px;"></div>
                        <div class="server-action" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                            <div class="selected-info" style="margin-bottom: 10px; min-height: 20px;">Виберіть сервер зі списку вище</div>
                            <div class="selector button button--primary server-submit-btn" style="background-color: #3f51b5; color: white; text-align: center; padding: 10px; border-radius: 5px;">ЗМІНИТИ СЕРВЕР</div>
                        </div>
                    </div>
                </div>
            `;

            layer = $(Lampa.Template.get('settings_server_switch', html));
            
            // Поточний сервер
            var currentHost = cleanUrl(window.location.host + window.location.pathname);
            var currentServerObj = servers.find(s => cleanUrl(s.url).includes(currentHost));
            var currentName = currentServerObj ? currentServerObj.name : 'Невідомий (' + window.location.host + ')';
            
            layer.find('.current-server-name').text(currentName);
            
            // Перевірка поточного
            var currentStatusEl = layer.find('.current-server-status')[0];
            checkAvailability(window.location.href, currentStatusEl, { classList: { remove: ()=>{} }, style: {} });

            // Список серверів
            var listContainer = layer.find('.server-list');
            servers.forEach(function(server) {
                var item = $(`<div class="selector server-item" style="padding: 10px; margin-bottom: 5px; background-color: rgba(255,255,255,0.05); border-radius: 4px; display: flex; justify-content: space-between; cursor: pointer;">
                    <span class="server-name">${server.name}</span>
                    <span class="server-status" style="margin-left: 10px;"> - Checking...</span>
                </div>`);

                item.on('hover:enter click', function() {
                    layer.find('.server-item').css('background-color', 'rgba(255,255,255,0.05)').removeClass('is-selected');
                    $(this).css('background-color', 'rgba(255,255,255,0.2)').addClass('is-selected');
                    selected_url = server.url;
                    selected_name = server.name;
                    layer.find('.selected-info').html('Вибрано: <b style="color:#f1c40f">' + server.name + '</b>. Натисніть кнопку нижче.');
                });

                listContainer.append(item);
                checkAvailability(server.url, item.find('.server-status')[0], item[0]);
            });

            // Кнопка дії
            layer.find('.server-submit-btn').on('hover:enter click', function() {
                if (!selected_url) {
                    Lampa.Noty.show('Виберіть сервер!');
                    return;
                }
                Lampa.Select.show({
                    title: 'Зміна сервера',
                    text: 'Перейти на ' + selected_name + '?',
                    items: [{ title: 'Так', value: 'yes' }, { title: 'Ні', value: 'no' }],
                    onSelect: function(a) {
                        if (a.value === 'yes') {
                            Lampa.Noty.show('Переходимо...');
                            setTimeout(function(){ window.location.href = selected_url; }, 500);
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

    // === ФУНКЦІЯ ЗАПУСКУ ===
    function openServerSwitcher() {
        Lampa.Component.add('settings_server_switch', new ServerSwitcherComponent());
        Lampa.Settings.create('settings_server_switch');
    }

    // === ІНІЦІАЛІЗАЦІЯ В РІЗНИХ МІСЦЯХ ===
    function init() {
        // 1. Додавання в НАЛАШТУВАННЯ
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'settings') {
                var item = $(`
                    <div class="settings__item selector" data-component="server_switcher">
                        <div class="settings__item-icon">${icon_svg}</div>
                        <div class="settings__item-name">Зміна сервера</div>
                        <div class="settings__item-descr">Список дзеркал</div>
                    </div>
                `);
                
                item.on('hover:enter click', openServerSwitcher);
                
                // Спроба вставити перед "Плагіни" або в кінець
                var pluginsBtn = e.body.find('[data-component="plugins"]');
                if(pluginsBtn.length) pluginsBtn.after(item);
                else e.body.find('.settings__param').eq(0).append(item);
            }
        });

        // 2. Додавання в ШАПКУ (Header)
        var headCheck = setInterval(function() {
            var headActions = $('.head .head__actions');
            if (headActions.length) {
                if (headActions.find('.server-switch-head').length) return; // Вже є

                var headBtn = $(`<div class="head__action selector server-switch-head" style="margin-right: 10px;">
                    ${icon_svg}
                </div>`);
                
                headBtn.on('hover:enter click', openServerSwitcher);
                
                // Вставляємо перед налаштуваннями або в початок
                var settingsBtn = headActions.find('.head__action--settings');
                if (settingsBtn.length) settingsBtn.before(headBtn);
                else headActions.prepend(headBtn);
                
                clearInterval(headCheck);
            }
        }, 1000);

        // 3. Додавання в ЛІВЕ МЕНЮ
        var menuCheck = setInterval(function() {
            var menuList = $('.menu .menu__list');
            if (menuList.length) {
                if (menuList.find('.server-switch-menu').length) return; // Вже є

                var menuItem = $(`<li class="menu__item selector server-switch-menu">
                    <div class="menu__ico">${icon_svg}</div>
                    <div class="menu__text">Сервери</div>
                </li>`);

                menuItem.on('hover:enter click', openServerSwitcher);
                
                // Вставляємо після "Налаштування" або в кінець
                var settingsMenu = menuList.find('[data-action="settings"]');
                if (settingsMenu.length) settingsMenu.after(menuItem);
                else menuList.append(menuItem);

                clearInterval(menuCheck);
            }
        }, 1000);
    }

    if (window.Lampa) {
        if(window.Lampa.Listener) Lampa.Listener.follow('app', 'ready', init);
        else init();
    } else {
        window.addEventListener('lampa_init', init);
    }

})();
