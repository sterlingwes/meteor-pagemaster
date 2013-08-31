# Pagemaster

Plug-and-play pagination module for Meteor that actually limits records published to the client.

### Installation

`mrt add pagemaster`

### Components

Pagemaster comes with:

*   An extendable template wrapper that streamlines creating paginated lists with button or scroll (infinite) triggered loading.
*   Prebuilt publications to handle proper record limiting server-side.
*   Augmented queries, so you don't have to specify db query parameters that won't change with each subscription.

### Example 1 (Button Triggered Loading)

**1. Specify the base query object for your subscription.**

    MyQueries = {
        
        posts: function() {
            var from = new Date();
            return {
                collection: 'Posts',
                find: {
                    time:   {$gte:from}
                },
                options: {
                    sort:   {time:1},
                    limit:  20
                }
            };
        }
    };
    
    Pagemaster.add('pagedPosts', MyQueries.posts());
    
**2. Subscribe.**

    Deps.autorun(function() {
        Pagemaster.subscribe('pagedPosts', {'find/tagged':'rants'});
    });
    
**3. Render in your template.**

    <template name="myposts">
        {{#if pageReady}}
            <ul>
            {{#each post}}
                <li>{{message}}</li>
            {{/each}}
            </ul>
            <div class="button pageMore {{#if pageHasEnded}}hidden{{/if}}">{{pageLoaded}} of {{pageTotal}} - Load More</div>
        {{/if}}
    </template>
    
**4. Hook up your template.**

    Pagemaster.template('myposts', {
        helpers: {
            post: function() {
                return Posts.find();
            }
        },
        events: {}
    });
    
This is the same example in the repo under `example`.

### Example 2 (Infinite Scroll Loading)

Similar to example 1, except in the `Pagemaster.template()` wiring, specify `infinite: true` as a property, and add the `{{ pageInfinite }}` helper to the base of your paginated list.

See `example-infinite` for more detail.

### API

#### Pagemaster.add(subid, query[, limit])

Sets up the pagination subscription, where `subid` is a unique identifier and `query` is an object with `find` and/or `options` keys that define the "static" portion of your query.

#### Pagemaster.subscribe(subid, reactiveQuery)

Subscribes, returning a subscription handle. `subid` is the unique identifier you specified in `add()`, and `reactiveQuery` is the part of your query that will change with every subscription.

The `reactive query` is either an ordinary javascript object, or an object with dot notation keys, similar to dot notation queries in MongoDB. Except, Pagemaster expands all queries with forward slashes instead of dots, so that you can pass along dot notation searches to MongoDB.

For example:

    { find: { person: { lastname: 'johnson' } } }

is equivalent to:

    { 'find/person/lastname': 'johnson' }

and:

    { 'find/person.lastname': 'johnson' }

Except that the third query passes along a dot notation search to MongoDB:
    { find: { 'person.lastname': 'johnson' } }
    
Similar to `Pagemaster.add()`, `find` and `options` keys are used to find the appropriate records server-side, and must be separated with a forward slash when using this notation.

#### Pagemaster.template(name, subid, templateCfg)
#### Pagemaster.template(name, templateCfg)

Wraps the core Meteor `Template.helpers` and `Template.events` in order to streamline common pagination tasks. Provides the following helpers to your template specified with `name`.

*   `{{ pageReady }}`, which is *true* when the subscription is ready
*   `{{ pageHasEnded }}`, which is *true* when the pagination has ended (all records have been displayed)
*   `{{ pageTotal }}`, which returns the total number of records that can be loaded
*   `{{ pageLoaded }}`, which returns the current number of records that have been loaded

`subid` indicates the unique subscription for the template. This can be omitted if the same variable is passed to the template's context on render.

`templateCfg` is an object with either `helpers`, `events`, `created`, `rendered`, or `destroyed` keys, with helpers, event handlers, or lifecycle functions as you'd normally specify with `Template.name.whatever`.

### Todo

*   Cross-browser testing
*   Make tests
*   Less pre-packaged assets, more configurability
*   Hooks for publication allow / deny

### License

MIT

### Who

Wes [@SterlingWes](http://twitter.com/sterlingwes)