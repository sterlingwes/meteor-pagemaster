# Pagemaster

Pagination module for Meteor that actually limits records sent to the client, and provides template wrappers for manual and infinite scroll loading.

### Installation

`mrt add pagemaster`

### Components

Pagemaster comes with:

*   An extendable template wrapper that streamlines creating paginated lists with button or scroll (infinite) triggered loading.
*   Prebuilt publications to handle proper record limiting server-side.
*   Augmented queries, so you don't have to specify db query parameters that won't change with each subscription.

### Example 1 (Button Triggered Loading)
    
**1. Subscribe.**

    Deps.autorun(function() {
        Pagemaster.subscribe('pagedPosts', function() {
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
        });
    });
    
**2. Render in your template.**

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
    
**3. Hook up your template.**

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

#### Pagemaster.subscribe(subid, query)

Subscribes, returning a subscription handle. `subid` is a unique identifier you reference in the template wiring, and `query` is a function returning a query object with `find`, `options` and `collection` keys..

If you called the `add` method beforehand, the `query` can be an ordinary javascript object or an object with dot notation keys, similar to dot notation queries in MongoDB. Except, Pagemaster expands all queries with forward slashes instead of dots, so that you can pass along dot notation searches to MongoDB. This augments the query object provided to `add`.

For example:

    { find: { person: { lastname: 'johnson' } } }

is equivalent to:

    { 'find/person/lastname': 'johnson' }

and:

    { 'find/person.lastname': 'johnson' }

Except that the third query passes along a dot notation search to MongoDB:

    { find: { 'person.lastname': 'johnson' } }
    
Similar to `Pagemaster.add()`, `find` and `options` keys are used to find the appropriate records server-side, and must be separated with a forward slash when using this notation.

#### Pagemaster.add(subid, query[, limit])

Sets up the pagination subscription, where `subid` is a unique identifier and `query` is an object with `find` and/or `options` keys that define the "static" portion of your query. This method is not necessary if you provide a function to subscribe for a reactive query.

#### Pagemaster.template(name, subid, templateCfg)
#### Pagemaster.template(name, templateCfg)

Wraps the core Meteor `Template` for the template you specify in order to streamline common pagination tasks. Provides the following helpers to your template specified with `name`.

*   `{{ pageReady }}`, which is *true* when the subscription is ready
*   `{{ pageHasEnded }}`, which is *true* when the pagination has ended (all records have been displayed)
*   `{{ pageTotal }}`, which returns the total number of records that can be loaded
*   `{{ pageLoaded }}`, which returns the current number of records that have been loaded
*   `{{ pageInfinite }}`, which serves as the "end of records" marker that triggers scroll-based loading when it comes into view

`subid` indicates the unique subscription for the template. This can be omitted if the same variable is passed to the template's context on render.

`templateCfg` is an object with either `helpers`, `events`, `created`, `rendered`, or `destroyed` keys, specifying helpers, event handlers, or lifecycle functions as you'd normally specify with `Template.name.whatever`.

### Todo

*   Cross-browser testing
*   Make tests
*   Less pre-packaged assets, more configurability
*   Hooks for publication allow / deny

### License

MIT

### Who

Wes [@SterlingWes](http://twitter.com/sterlingwes)