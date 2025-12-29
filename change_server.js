(function () {
    'use strict';

    function ServerSwitcher() {
        // Список серверів згідно з вашим запитом
        const server_list = [
            { name: 'Lampa (MX)', url: 'http://lampa.mx' }, // Стандартний, зазвичай http
            { name: 'Lampa (Koyeb)', url: 'https://central-roze-d-yuriyovych-74a9dc5c.koyeb.app/' },
            { name: 'Lampa (VIP)', url: 'http://lampa.vip' },
            { name: 'Lampa (NNMTV)', url: 'http://lam.nnmtv.pw' },
            { name: 'Prisma', url: 'http://prisma.ws/' }
        ];

        let selected_new_server = null;
        let component_body = null;

        // Нормалізація URL для коректного порівняння та збереження
        function cleanUrl(url) {
            return url.replace(/\/$/, '').toLowerCase();
        }

        // Функція перевірки доступності
        function checkServerStatus(server, element, status_text) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // Таймаут 5 сек

            // Використовуємо fetch з mode: 'no-cors', щоб уникнути CORS помилок (нам головне, що сервер відповів)
            // Або 'cors' якщо сервер дозволяє. Для Lampa Android 'no-cors' надійніше для пінгу.
            fetch(server.url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
                .then(() => {
                    clearTimeout(timeoutId);
                    status_text.text('Доступний').css('color', '#4caf50'); // Зелений
                    element.find('.server-status-dot').css('background-color', '#4caf50');
                    element.removeClass('server-offline').addClass('selector'); // Робимо активним
                })
                .catch(() => {
                    clearTimeout(timeoutId);
                    status_text.text('Недоступний').css('color', '#f44336'); // Червоний
                    element.find('.server-status-dot').css('background-color', '#f44336');
                    element.addClass('server-offline').removeClass('selector'); // Робимо неактивним
                    element.css('opacity', '0.5');
                });
        }

        this.create = function () {
            const html = $(`
                <div class="server-switcher-plugin">
                    <div class="server-switcher-scroll"></div>
                    <div class="server-switcher-footer"></div>
                </div>
            `);

            const scroll = html.find('.server-switcher-scroll');
            const footer = html.find('.server-switcher-footer');
            
            // --- БЛОК 1: Поточний сервер ---
            scroll.append('<div class="server-header" style="padding: 1em; color: #aaa; font-size: 1.1em;">Поточний сервер:</div>');
            
            let current_url = Lampa.Storage.get('source', 'lampa.mx');
            // Якщо збережено просто домен без протоколу, додаємо http для порівняння, але відображаємо як є
            if(current_url === 'lampa.mx') current_url = 'http://lampa.mx';

            const current_server_obj = server_list.find(s => cleanUrl(s.url) === cleanUrl(current_url)) || { name: current_url, url: current_url };

            const current_item = $(`
                <div class="server-item current-server-item" style="padding: 1em; display: flex; align-items: center; background: rgba(255,255,255,0.05); margin-bottom: 20px;">
                    <div style="flex-grow: 1;">
                        <div style="font-size: 1.2em; font-weight: bold; color: #ffeb3b;">${current_server_obj.name}</div>
                        <div class="status-line" style="font-size: 0.9em; margin-top: 5px;">Статус: <span class="current-status-text">Перевірка...</span></div>
                    </div>
                </div>
            `);
            
            // Перевірка статусу поточного
            checkServerStatus(current_server_obj, current_item, current_item.find('.current-status-text'));
            scroll.append(current_item);


            // --- БЛОК 2: Список серверів ---
            scroll.append('<div class="server-header" style="padding: 1em; color: #aaa; font-size: 1.1em; border-top: 1px solid rgba(255,255,255,0.1);">Список серверів:</div>');

            server_list.forEach(server => {
                // Пропускаємо поточний сервер зі списку вибору або показуємо його (за бажанням). 
                // Зазвичай зручніше бачити всі.
                
                const item = $(`
                    <div class="server-item server-candidate" data-url="${server.url}" data-name="${server.name}" style="padding: 1em; display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <div class="server-status-dot" style="width: 10px; height: 10px; border-radius: 50%; background-color: #999; margin-right: 15px;"></div>
                        <div style="flex-grow: 1;">
                            <div style="font-size: 1.1em;">${server.name}</div>
                            <div class="status-line" style="font-size: 0.8em; color: #aaa;">Статус: <span class="list-status-text">Перевірка...</span></div>
                        </div>
                    </div>
                `);

                // Спочатку блокуємо вибір, поки не пройде перевірка
                item.removeClass('selector'); 

                item.on('hover:enter', function () {
                    if ($(this).hasClass('server-offline')) return;

                    // Знімаємо виділення з інших
                    scroll.find('.server-candidate').css('background', 'transparent');
                    $(this).css('background', 'rgba(255,255,255,0.1)');
                    
                    selected_new_server = {
                        url: server.url,
                        name: server.name
                    };
                    
                    Lampa.Noty.show('Вибрано: ' + server.name + '. Натисніть кнопку внизу для зміни.');
                    
                    // Оновлюємо текст кнопки
                    apply_btn.find('.btn-text').text(`Змінити на: ${server.name}`);
                });

                checkServerStatus(server, item, item.find('.list-status-text'));
                scroll.append(item);
            });

            // --- БЛОК 3: Кнопка дії ---
            const apply_btn = $(`
                <div class="selector" style="background-color: #673ab7; padding: 1em; text-align: center; margin: 1em; border-radius: 5px; cursor: pointer;">
                    <span class="btn-text" style="font-weight: bold;">Виберіть сервер зі списку</span>
                </div>
            `);

            apply_btn.on('hover:enter', function () {
                if (!selected_new_server) {
                    Lampa.Noty.show('Спочатку виберіть доступний сервер зі списку вище!');
                    return;
                }

                Lampa.Select.show({
                    title: 'Підтвердження',
                    text: `Ви дійсно хочете змінити сервер на <b>${selected_new_server.name}</b>?<br>Додаток буде перезавантажено.`,
                    items: [
                        { title: 'Так, змінити', value: 1 },
                        { title: 'Скасувати', value: 0 }
                    ],
                    onSelect: (v) => {
                        if (v.value === 1) {
                            // Логіка зміни сервера
                            // Якщо це стандартний MX, Lampa іноді хоче бачити просто 'lampa.mx'
                            let final_url = selected_new_server.url;
                            if(final_url.includes('lampa.mx')) final_url = 'lampa.mx';

                            Lampa.Storage.set('source', final_url);
                            
                            // Примусове перезавантаження
                            location.reload();
                        }
                    }
                });
            });

            footer.append(apply_btn);
            
            // Збірка
            html.find('.server-switcher-scroll').css('max-height', '70vh').css('overflow-y', 'auto');
            
            this.activity.loader = false;
            this.activity.toggle();
        };

        this.start = function () {
            const _this = this;
            Lampa.Controller.add('server_switcher', {
                toggle: function () {
                    Lampa.Controller.collectionSet(_this.render());
                    Lampa.Controller.collectionFocus(_this.render().find('.selector').first(), _this.render());
                },
                left: function () {
                    Lampa.Controller.toggle('settings');
                },
                up: function () {
                    Lampa.Controller.collectionUp(_this.render());
                },
                down: function () {
                    Lampa.Controller.collectionDown(_this.render());
                },
                back: function () {
                    Lampa.Activity.backward();
                }
            });

            Lampa.Activity.push({
                url: '',
                title: 'Зміна сервера',
                component: 'server_switcher',
                stats: false,
                create: function () { return _this.create() }
            });
        };
    }

    // Додаємо кнопку в налаштування
    function addSettingsButton() {
        if (window.appready) {
            Lampa.Settings.listener.follow('open', function (e) {
                if (e.name == 'main') {
                    let item = $(`
                        <div class="settings-param selector" data-type="button" data-name="server_switch">
                            <div class="settings-param__name">Змінити сервер</div>
                            <div class="settings-param__descr">Менеджер редиректів та перевірка доступності</div>
                            <div class="settings-param__status"></div>
                        </div>
                    `);

                    item.on('hover:enter', function () {
                        new ServerSwitcher().start();
                    });

                    // Вставляємо, наприклад, після розділу "Інше" або в кінець
                    $('.settings__content').append(item);
                }
            });
        } else {
            setTimeout(addSettingsButton, 500);
        }
    }

    addSettingsButton();

})();
