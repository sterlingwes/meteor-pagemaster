Meteor.publish('pagemasterRecs', function(params, limit) {
    check(params, Object);    
    find = params.find || {};
    options = params.options || {};
    options.limit = limit;
    check(params.collection, String);

    var recs = global[params.collection].find(find, options);
    //console.log('sub for', params.subid, recs.count(), find, limit);
    return recs;
});

Meteor.publish('pagemasterCounts', function(params) {
    var subid;
    check(params, Object);    
    find = params.find || {};
    subid = params.subid;
    check(params.collection, String);
    collection = params.collection;
    
    var count = 0,
        init = true,
        self = this,
        uuid = Random.id(),
        handle = global[collection].find(find, {fields:{_id:1}}).observeChanges({
            added: function(doc,idx) {
                count++;
                if(!init)
                    self.changed("pagemaster_counts", uuid, {subid: subid, count:count});
            },
            removed: function(doc,idx) {
                count--;
                self.changed("pagemaster_counts", uuid, {subid: subid, count:count});
            }
        });
    
    init = false;
    
    //publish initial count
    self.added("pagemaster_counts", uuid, {subid: subid, count:count});
    self.ready();
    
    // stop observe when client unsubs
    self.onStop(function() {
        handle.stop();
    });
});