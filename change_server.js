(function() { 'use strict'; Lampa.Platform.tv();
var icon_server_redirect = '<svg width="256px" height="256px" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M13 21.75C13.4142 21.75 13.75 21.4142 13.75 21C13.75 20.5858 13.4142 20.25 13 20.25V21.75ZM3.17157 19.8284L3.7019 19.2981H3.7019L3.17157 19.8284ZM20.8284 4.17157L20.2981 4.7019V4.7019L20.8284 4.17157ZM21.25 13C21.25 13.4142 21.5858 13.75 22 13.75C22.4142 13.75 22.75 13.4142 22.75 13H21.25ZM10 3.75H14V2.25H10V3.75ZM2.75 13V12H1.25V13H2.75ZM2.75 12V11H1.25V12H2.75ZM13 20.25H10V21.75H13V20.25ZM21.25 11V12H22.75V11H21.25ZM1.25 13C1.25 14.8644 1.24841 16.3382 1.40313 17.489C1.56076 18.6614 1.89288 19.6104 2.64124 20.3588L3.7019 19.2981C3.27869 18.8749 3.02502 18.2952 2.88976 17.2892C2.75159 16.2615 2.75 14.9068 2.75 13H1.25ZM10 20.25C8.09318 20.25 6.73851 20.2484 5.71085 20.1102C4.70476 19.975 4.12511 19.7213 3.7019 19.2981L2.64124 20.3588C3.38961 21.1071 4.33855 21.4392 5.51098 21.5969C6.66182 21.7516 8.13558 21.75 10 21.75V20.25ZM14 3.75C15.9068 3.75 17.2615 3.75159 18.2892 3.88976C19.2952 4.02502 19.8749 4.27869 20.2981 4.7019L21.3588 3.64124C20.6104 2.89288 19.6614 2.56076 18.489 2.40313C17.3382 2.24841 15.8644 2.25 14 2.25V3.75ZM22.75 11C22.75 9.13558 22.7516 7.66182 22.5969 6.51098C22.4392 5.33855 22.1071 4.38961 21.3588 3.64124L20.2981 4.7019C20.7213 5.12511 20.975 5.70476 21.1102 6.71085C21.2484 7.73851 21.25 9.09318 21.25 11H22.75ZM10 2.25C8.13558 2.25 6.66182 2.24841 5.51098 2.40313C4.33856 2.56076 3.38961 2.89288 2.64124 3.64124L3.7019 4.7019C4.12511 4.27869 4.70476 4.02502 5.71085 3.88976C6.73851 3.75159 8.09318 3.75 10 3.75V2.25ZM2.75 11C2.75 9.09318 2.75159 7.73851 2.88976 6.71085C3.02502 5.70476 3.27869 5.12511 3.7019 4.7019L2.64124 3.64124C1.89288 4.38961 1.56076 5.33855 1.40313 6.51098C1.24841 7.66182 1.25 9.13558 1.25 11H2.75ZM2 12.75H22V11.25H2V12.75ZM21.25 12V13H22.75V12H21.25Z" fill="currentColor"></path></g></svg>' 

function getFriendlyName(url) {
    if (url.indexOf('koyeb.app') !== -1) return 'Lampac Koyeb';
    if (url.indexOf('lampa.mx') !== -1) return 'lampa.mx';
    return url;
}

function checkOnline(url, callback) {
    if (url === '-' || url === '') return callback(true);
    var domain = url.split('?')[0].replace(/\/$/, "");
    var testUrl = (domain.indexOf('://') === -1) ? 'http://' + domain : domain;
    
    // Використовуємо Image як максимально швидкий метод без CORS обмежень
    var img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(true); }; 
    img.src = testUrl + '/favicon.ico?v=' + Math.random();
    setTimeout(function() { if(!img.complete) { img.src = ''; callback(false); } }, 2000);
}

function startMe() { 
    var current_host = window.location.hostname;
    var current_friendly = getFriendlyName(current_host);

    if (window.location.search != '?redirect=1') { 
        if(current_host != Lampa.Storage.get('location_server')) { 
            if (Lampa.Storage.get('location_server') != '-' && Lampa.Storage.get('location_server') != '') 
                window.location.href = 'http://' + Lampa.Storage.get('location_server') + '?redirect=1'; 
        } 
    } else {
        Lampa.Storage.set('location_server','-');
    } 

    Lampa.SettingsApi.addComponent({ 
        component: 'location_redirect', 
        name: 'Зміна сервера', 
        icon: icon_server_redirect 
    }); 

    var servers = { 
        '-': 'Поточний : ' + current_friendly, 
        'central-roze-d-yuriyovych-74a9dc5c.koyeb.app/': 'Lampac Koyeb', 
        'lampa.mx': 'lampa.mx' 
    }; 

    Lampa.SettingsApi.addParam({ 
        component: 'location_redirect', 
        param: { name: 'location_server', type: 'select', values: servers, default: '-' }, 
        field: { name: 'Виберіть сервер Lampa' }, 
        onChange: function () { startMe(); },
        onRender: function(item) {
            
            // Функція примусового оновлення тексту
            var updateElement = function($el, serverKey) {
                var domain = (serverKey === '-') ? current_host : serverKey;
                checkOnline(domain, function(isOk) {
                    var color = isOk ? '#2ecc71' : '#ff4c4c';
                    var statusText = isOk ? ' - доступний' : ' - недоступний';
                    var originalName = servers[serverKey];
                    
                    // Використовуємо .contents() щоб не затерти іконку "галочку" в селекторі
                    $el.html('<span style="color:' + color + '">' + originalName + statusText + '</span>');
                });
            };

            // 1. Оновлюємо головне меню (Скрін 1) - запускаємо циклічно, поки ми в налаштуваннях
            var mainInterval = setInterval(function() {
                var $valField = item.find('.settings-param__value');
                if($valField.length) {
                    var cur = Lampa.Storage.get('location_server') || '-';
                    // Оновлюємо тільки якщо ще не додано статус
                    if($valField.text().indexOf('доступний') === -1) {
                        updateElement($valField, cur);
                    }
                }

                // 2. Оновлюємо меню вибору (Скрін 2) - шукаємо активне модальне вікно
                $('.selector__item').each(function() {
                    var $this = $(this);
                    var rawText = $this.text().trim();
                    
                    Object.keys(servers).forEach(function(key) {
                        if (rawText === servers[key]) {
                            updateElement($this, key);
                        }
                    });
                });
            }, 300); // 0.3 сек для миттєвої реакції

            item.on('destroy', function() { clearInterval(mainInterval); });
        }
    }); 
} 

if(window.appready) startMe(); 
else { Lampa.Listener.follow('app', function(e) { if(e.type == 'ready') startMe(); }); } 
})();

