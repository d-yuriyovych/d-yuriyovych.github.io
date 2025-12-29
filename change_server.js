(function () {

    if (!window.Lampa) return;

    console.log('CHANGE SERVER PLUGIN LOADED');

    Lampa.Menu.add({
        title: 'TEST SERVER',
        icon: 'network_check',
        action: function () {
            Lampa.Noty.show('Плагін працює ✔ Lampa 1.12.3');
        }
    });

})();
