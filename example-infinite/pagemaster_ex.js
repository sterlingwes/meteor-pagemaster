Posts = new Meteor.Collection('posts');

if (Meteor.isClient) {
    
    MyQueries = {
        posts: function() {
            var from = new Date();
            return {
                collection: 'Posts',
                find: {
                    time:   {$lte:from}
                },
                options: {
                    sort:   {time:1},
                    limit:  5
                }
            };
        }
    };
    
    Pagemaster.add('pagedPosts', MyQueries.posts());
    
    Deps.autorun(function() {
        Pagemaster.subscribe('pagedPosts', {'find/tagged':'rants'});
    });
    
    Pagemaster.template('myposts', 'pagedPosts', {
        helpers: {
            post: function() {
                var count = 0;
                return Posts.find().map(function(post) {
                    count++;
                    post.num = count;
                    return post;
                });
            }
        },
        events: {},
        infinite: true,
        addLatency: 1000
    });
    
}

if (Meteor.isServer) {
    
    Meteor.startup(function () {
    
      // seed some example data
      if(Posts.find().count()==0) {
          _.times(30, function(i) {
              _.each(SeedPosts, function(post,ii) {
                  Posts.insert({
                      message:  post,
                      time:     new Date(2013, 1, i, ii+8),
                      tagged:   i%2==0 ? 'rants' : 'diatribes'
                  });
              });
          });
      }
      
    });
    
}