(function () {
    'use strict';

    // 1. Конфігурація серверів
    var servers = [
        { name: 'Lampa (MX)', url: 'http://lampa.mx', type: 'standard' },
        { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/', type: 'custom' },
        { name: 'Lampa (VIP)', url: 'http://lampa.vip', type: 'custom' }, // Зазвичай http, але може бути https
        { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw', type: 'custom' },
        { name: 'Prisma', url: 'http://prisma.ws/', type: 'custom' }
    ];

    // Допоміжна функція для нормалізації URL (щоб порівняти поточний з списком)
    function cleanUrl(url) {
        return url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    }

    function ServerSwitcher() {
        var network = new Lampa.Reguest();
        var selected_url = null;
        var selected_name = null;
        var layer;

        // Функція перевірки доступності (ping)
        function checkAvailability(url, status_element, item_element) {
            var controller = new AbortController();
            var signal = controller.signal;
            var timeoutId = setTimeout(function() { controller.abort(); }, 5000); // 5 секунд таймаут

            // Використовуємо mode: 'no-cors', бо ми перевіряємо лише доступність, а не читаємо контент
            fetch(url, { method: 'HEAD', mode: 'no-cors', signal: signal })
                .then(function() {
                    clearTimeout(timeoutId);
                    // Успіх
                    status_element.innerText = ' - Online';
                    status_element.style.color = '#4caf50'; // Зелений
                })
                .catch(function() {
                    clearTimeout(timeoutId);
                    // Помилка
                    status_element.innerText = ' - Offline';
                    status_element.style.color = '#f44336'; // Червоний
                    
                    // Робимо елемент неактивним
                    item_element.classList.remove('selector');
                    item_element.style.opacity = '0.5';
                    item_element.style.pointerEvents = 'none';
                });
        }

        // Головна функція рендеру
        this.create = function () {
            var html = Lampa.Template.get('settings_server_switch', `
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
                            <div class="selector button button--primary server-submit-btn" style="background-color: #3f51b5; color: white; text-align: center; padding: 10px; border-radius: 5px;">
                                ЗМІНИТИ СЕРВЕР
                            </div>
                        </div>

                    </div>
                </div>
            `);

            layer = $(html);
            
            // 1. Визначення та відображення поточного сервера
            var currentHost = cleanUrl(window.location.host + window.location.pathname);
            var currentServerObj = servers.find(s => cleanUrl(s.url).includes(currentHost));
            var currentName = currentServerObj ? currentServerObj.name : 'Невідомий (' + window.location.host + ')';
            
            layer.find('.current-server-name').text(currentName);
            
            // Перевірка статусу поточного сервера
            var currentStatusParams = {
                el: layer.find('.current-server-status'),
                dummy: { classList: { remove: ()=>{} }, style: {} } // Заглушка, бо поточний сервер не треба блокувати
            };
            checkAvailability(window.location.href, currentStatusParams.el[0], currentStatusParams.dummy);


            // 2. Рендеринг списку серверів
            var listContainer = layer.find('.server-list');

            servers.forEach(function(server) {
                // Створюємо елемент списку
                var item = $(`<div class="selector server-item" style="padding: 10px; margin-bottom: 5px; background-color: rgba(255,255,255,0.05); border-radius: 4px; display: flex; justify-content: space-between;">
                    <span class="server-name">${server.name}</span>
                    <span class="server-status" style="margin-left: 10px;"> - Checking...</span>
                </div>`);

                // Логіка кліку (вибору)
                item.on('hover:enter click', function() {
                    // Знімаємо виділення з інших
                    layer.find('.server-item').css('background-color', 'rgba(255,255,255,0.05)').removeClass('is-selected');
                    
                    // Виділяємо поточний
                    $(this).css('background-color', 'rgba(255,255,255,0.2)').addClass('is-selected');
                    
                    // Оновлюємо змінні вибору
                    selected_url = server.url;
                    selected_name = server.name;

                    // Оновлюємо текст підказки
                    layer.find('.selected-info').html('Вибрано: <b style="color:#f1c40f">' + server.name + '</b>. Натисніть кнопку нижче для переходу.');
                });

                listContainer.append(item);

                // Запускаємо перевірку доступності для цього сервера
                checkAvailability(server.url, item.find('.server-status')[0], item[0]);
            });


            // 3. Логіка кнопки "Змінити сервер"
            layer.find('.server-submit-btn').on('hover:enter click', function() {
                if (!selected_url) {
                    Lampa.Noty.show('Будь ласка, спочатку виберіть доступний сервер зі списку.');
                    return;
                }

                Lampa.Select.show({
                    title: 'Підтвердження',
                    text: 'Ви дійсно хочете перейти на сервер ' + selected_name + '?',
                    items: [
                        { title: 'Так, перейти', value: 'yes' },
                        { title: 'Скасувати', value: 'no' }
                    ],
                    onSelect: function(a) {
                        if (a.value === 'yes') {
                            Lampa.Noty.show('Змінюємо сервер на ' + selected_name + '...');
                            setTimeout(function(){
                                window.location.href = selected_url;
                            }, 1000);
                        } else {
                            Lampa.Controller.toggle('settings_component'); // Повертаємо фокус
                        }
                    },
                    onBack: function() {
                         Lampa.Controller.toggle('settings_component');
                    }
                });
            });

            return layer;
        };
    }

    // Додаємо пункт в налаштування
    function addSettingsItem() {
        if (window.plugin_server_switch_ready) return;
        window.plugin_server_switch_ready = true;

        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name === 'settings') {
                e.body.find('[data-component="plugins"]').after(`
                    <div class="settings__item selector" data-component="server_switcher">
                        <div class="settings__item-icon">
                            <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" fill="white"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div class="settings__item-name">Зміна сервера</div>
                        <div class="settings__item-descr">Вибір дзеркала Lampa</div>
                    </div>
                `);
                
                e.body.find('[data-component="server_switcher"]').on('hover:enter click', function () {
                    Lampa.Component.add('settings_server_switch', new ServerSwitcher());
                    Lampa.Settings.create('settings_server_switch');
                });
            }
        });
    }

    if (window.Lampa) {
        addSettingsItem();
    } else {
        // Якщо плагін завантажився раніше ніж Lampa
        window.addEventListener('lampa_init', addSettingsItem);
    }

})();
