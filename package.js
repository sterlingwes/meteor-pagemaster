Package.describe({
    summary: "Pagination module for Meteor that actually limits records sent to the client, and provides template wrappers for manual and infinite scroll loading."
});

Package.on_use(function(api) {
    
    api.use('underscore', 'client');
    api.use('standard-app-packages');

    api.export('Pagemaster', 'client');
    
    api.add_files(['server/publications.js'], 'server');
    api.add_files(['client/lib/pagemaster.js','client/views/infinite_marker.html','client/views/pagemaster.css'], 'client');
});