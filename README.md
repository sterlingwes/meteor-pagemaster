# Pagemaster

`mrt add pagemaster`

## API

### Pagemaster.add(subid, query[, limit])

Sets up the pagination subscription, where `subid` is a unique identifier and `query` is an object with `find` and/or `options` keys that define the "static" portion of your query.

### Pagemaster.subscribe(subid, reactiveQuery)

Subscribes, returning a subscription handle. `subid` is the unique identifier you specified in `add()`, and `reactiveQuery` is the part of your query that will change with every subscription.

### Pagemaster.template(name, subid, helpersAndEvents)
### Pagemaster.template(name, helpersAndEvents)

Wraps the core Meteor `Template.helpers` and `Template.events` in order to streamline common pagination tasks. Provides the following helpers to your template specified with `name`.

*   `{{ pageReady }}`, which is *true* when the subscription is ready
*   `{{ pageHasEnded }}`, which is *true* when the pagination has ended (all records have been displayed)
*   `{{ pageTotal }}`, which returns the total number of records that can be loaded
*   `{{ pageLoaded }}`, which returns the current number of records that have been loaded

`subid` indicates the unique subscription for the template. This can be omitted if the same variable is passed to the template's context on render.

`helpersAndEvents` is an object with either `helpers` or `events` keys, with helpers or event handlers as you'd normally provide to `Template.helpers` or `Template.events`.

## License

MIT

## Who

Wes [@SterlingWes](http://twitter.com/sterlingwes)