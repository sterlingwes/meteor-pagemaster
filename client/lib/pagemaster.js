Pagemaster = (function() {

    var queries = {},
        currentLimit = {},
        initialLimit = {},
        subs = {},
        counts = {},
        scrollSpot,
        hasInfiniteListener,
        markerHeight,
        
        countsCollection = new Meteor.Collection("pagemaster_counts"),
        
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
    
    function pagingHasEnded(subid) {
        var current = Pagemaster.fetch(subid || this.subid).length,
            count = Pagemaster.count(subid || this.subid);
        if(!count && count!==0) return false;
        return current >= count;
    }
    
    function isInViewport(el) {
        // a la Dan @ http://stackoverflow.com/a/7557433
        
        if(!el.length) return false;
        
        var rect = el[0].getBoundingClientRect();
        
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= $(window).height() &&
            rect.right <= $(window).width()
        );
    }
    
    function infiniteTrigger(subid,latency) {
        return function() {
            var el = $('#pagemasterMarker');
            if(!markerHeight)   markerHeight = el.height();
            if(isInViewport(el)) {
                if(!pagingHasEnded(subid)) {
                    Meteor.setTimeout(function() {
                        Pagemaster.loadMore(subid);
                    }, latency||50);
                }
            }
        };
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
            if(!subs[subid])    return false;
            return subs[subid].ready();
        },
        
        fetch: function(subid) {
            if(!queries[subid]) return false;
            var q = queries[subid];
            return window[q.collection].find(q.find, _.omit(q.options,'limit')).fetch();
        },
        
        Counts: countsCollection,
        
        count: function(subid) {
            if(!countsCollection) return false;
            var countRec = countsCollection.findOne({subid:subid});
            if(!countRec)   return false;
            return countRec.count;
        },
        
        loadMore: function(subid, addThisMuch) {
            if(!currentLimit[subid] || !subs[subid].ready())
                return false;
            currentLimit[subid] += addThisMuch || initialLimit[subid];
            scrollSpot = $('body').scrollTop();
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
            
            if(!tpl && _.isObject(subid)) {
                tpl = subid;
                subid = null;
            }
            
            if(_.isObject(tpl)) {
                if(tpl.helpers) {
                    _.extend(tpl.helpers, {
                        pageReady: function() {
                            return Pagemaster.isReady(this.subid || subid);
                        },
                        pageHasEnded: function() {
                            return pagingHasEnded.call(this,subid);
                        },
                        pageTotal: function() {
                            return Pagemaster.count(this.subid || subid);
                        },
                        pageLoaded: function() {
                            return Pagemaster.fetch(this.subid || subid).length;
                        },
                        pageInfinite: function() {
                            var subId = this.subid || subid, that = this;
                            return new Handlebars.SafeString(Template.pagemaster_infinite_marker({
                                infiniteLoading: function() {
                                    return !pagingHasEnded.call(that,subId) && Pagemaster.isReady(subId);
                                },
                                pageCount: function() {
                                    return Pagemaster.fetch(subId).length + " of " + Pagemaster.count(subId)
                                }
                            }));
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
                
                Template[tplName].rendered = function() {
                    if(typeof tpl.rendered === "function")
                        tpl.rendered.apply(this, arguments);
                    
                    if(scrollSpot) {
                        var scrollOffset = tpl.infinite ? markerHeight+5 : 0;
                        $('body').scrollTop(scrollSpot-scrollOffset);
                    }
                };
                
                if(tpl.infinite) {
                    Template.pagemaster_infinite_marker.rendered = function() {
                        if(!hasInfiniteListener) {
                            hasInfiniteListener = true;
                            $(document).on('ready', infiniteTrigger(subid,tpl.addLatency));
                            $(window).on('load resize scroll', infiniteTrigger(subid,tpl.addLatency));
                        }
                    };
                    Template.pagemaster_infinite_marker.destroyed = function() {
                        if(hasInfiniteListener) {
                            $(document).off('ready', infiniteTrigger(subid,tpl.addLatency));
                            $(window).off('load resize scroll', infiniteTrigger(subid,tpl.addLatency));
                            hasInfiniteListener = false;
                            isLoading = undefined;
                        }
                    };
                }
                
                if(typeof tpl.created === "function") {
                    tpl.created.apply(this, arguments);
                }
                
                Template[tplName].destroyed = function() {
                    if(typeof tpl.destroyed === "function")
                        tpl.destroyed.apply(this, arguments);
                };
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