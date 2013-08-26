Package.describe({
    summary: "Reactive pagination that actually limits records published"
});

Package.on_use(function(api) {
    
    api.use('underscore', 'client');

    api.export('Pagemaster', 'client');
    
    api.add_files(['server/publications.js'], 'server');
    api.add_files(['client/lib/pagemaster.js'], 'client');
});