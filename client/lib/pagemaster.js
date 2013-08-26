Pagemaster = (function() {

    var queries = {},
        currentLimit = {},
        initialLimit = {},
        subs = {},
        counts = {},
        
        LIMIT_KEY = 'pagemaster_limit_',
        
        debug = false;
    
    function _augment(src,obj) {
        _.each(obj, function(val,dots) {
            var path = dots.split('/'),
                current = src;
            _.each(path, function(step,i) {
                if(!current[step]) {
                    var s = {}; s[step] = {};
                    _.extend(current, s);
                }
                if(i==path.length-1)
                    current[step] = val;
                else
                    current = current[step];
            });
        });
    }
    
    return {
        add:    function(subid, query, limit) {
            if(!query || !_.isObject(query))
                return console.error('No query provided for '+subid+' pagemaster subscription.');
            
            if(query.options && _.isNumber(query.options.limit))
                limit = query.options.limit;
            
            Session.set(LIMIT_KEY+subid, limit);
            initialLimit[subid] = currentLimit[subid] = limit;
            query.subid = subid;
            queries[subid] = query;
        },
        
        subscribe: function(subid, update) {
            
            if(!queries[subid])
                return console.warn('No query available for '+subid+' pagemaster subscription');
            
            if(_.isObject(update)) {
                _augment(queries[subid], update);
            }
            
            counts[subid] = Meteor.subscribe('pagemasterCounts', queries[subid]);
            subs[subid] = Meteor.subscribe('pagemasterRecs', queries[subid], Session.get(LIMIT_KEY+subid), {
                
                onReady: function() {
                    if(debug)  console.log('Pagemaster sub onReady for '+queries[subid].collection);
                },
                
                onError: function(err) {
                    if(debug)  console.warn('Pagemaster sub onError for '+queries[subid].collection, err);
                }
                
            });
            
            return subs[subid];
        },
        
        handle: function(subid) {
            return subs[subid];
        },
        
        isReady: function(subid) {
            return subs[subid].ready();
        },
        
        fetch: function(subid) {
            if(!queries[subid]) return false;
            var q = queries[subid];
            return window[q.collection].find(q.find, _.omit(q.options,'limit')).fetch();
        },
        
        count: function(subid) {
            if(!Pagecounts) return false;
            var countRec = Pagecounts.findOne({subid:subid});
            if(!countRec)   return false;
            return countRec.count;
        },
        
        loadMore: function(subid, addThisMuch) {
            if(!currentLimit[subid])    return false;
            currentLimit[subid] += addThisMuch || initialLimit[subid];
            Session.set(LIMIT_KEY+subid, currentLimit[subid]);
        },
        
        stop: function(subid) {
            if(subs[subid])
                subs[subid].stop();
            if(counts[subid])
                counts[subid].stop();
        },
        
        template: function(tplName, subid, tpl) {
            if(!Template[tplName])
                return console.warn('No template by the name '+tplName+' found');
            
            if(!tpl && _.isObject(subid))
                tpl = subid;
            
            if(_.isObject(tpl)) {
                if(tpl.helpers) {
                    _.extend(tpl.helpers, {
                        pageReady: function() {
                            return Pagemaster.isReady(this.subid || subid);
                        },
                        pageHasEnded: function() {
                            var current = Pagemaster.fetch(this.subid || subid).length,
                                count = Pagemaster.count(this.subid || subid);
                            if(!count) return false;
                            return current >= count;
                        },
                        pageTotal: function() {
                            return Pagemaster.count(this.subid || subid);
                        },
                        pageLoaded: function() {
                            return Pagemaster.fetch(this.subid || subid).length;
                        }
                    });
                    Template[tplName].helpers(tpl.helpers);
                }
                if(tpl.events) {
                    _.extend(tpl.events, {
                        'click .pageMore': function(evt) {
                            Pagemaster.loadMore(this.subid || subid);
                        }
                    });
                    Template[tplName].events(tpl.events);
                }
            }
        },
        
        clearSession: function() {
            _.each(Session.keys, function(v,k) {
                if(k.search('pagemaster_')!=-1)
                    Session.set(k, undefined);
            });
        },
        
        _logQuery: function(subid) {
            console.log(queries[subid]);
        }
    };
})();