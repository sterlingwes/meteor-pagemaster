Package.describe({
    summary: "Reactive pagination module for Meteor that actually limits records published to the client"
});

Package.on_use(function(api) {
    
    api.use('underscore', 'client');

    api.export('Pagemaster', 'client');
    
    api.add_files(['server/publications.js'], 'server');
    api.add_files(['client/lib/pagemaster.js'], 'client');
});