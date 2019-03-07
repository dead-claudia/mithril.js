[*Up*](./README.md)

# MVP Utilities

These are all various utilities that are, unless otherwise listed, kept out of the core bundle, but they are part of the MVP of this proposal.

## Vnode inspection Utilities

This is exposed under `mithril/vnodes` and in the full bundle via `Mithril.Vnodes`.

- `Vnodes.tag(vnode)` - Get the resolved tag name, component reference, or built-in component reference.
- `Vnodes.attrs(vnode)` - Get the resolved attributes as a frozen object, including `is` for DOM `is` attributes, `key` for the key, `ref` for the ref, and `children` for the resolved children.
- `Vnodes.children(vnode)` - Get the resolved children as a frozen array.

### Why?

Given that [vnode allocation and inspection now requires interpretation](vnode-structure.md), there needs to be some standard library functions for easily inspecting various properties of attributes.

## Composable refs

This is exposed under `mithril/ref` and in the full bundle via `Mithril.Ref`. It exists to help make refs considerably more manageable.

- `refs = Ref.join(({...elems}) => ...)` - Create a combined ref that invokes a callback once all named refs are received.
    - `ref = refs(key)` - Create and get a ref linked to that callback key
    - `ref = refs(Ref.join)` - Create and get a ref called to send an object, or `undefined` if named refs exist.
    - `value = refs()` - Get the resolved values or `undefined` if some are still pending

- `refs = Ref.all(([...elems]) => ...)` - Create a combined ref that invokes a callback once all named refs are received.
    - `ref = refs(index)` - Create and get a ref linked to that index
    - `ref = refs(Ref.all)` - Get a ref called to send an empty array, or `undefined` if named refs exist.
    - `value = refs()` - Get the resolved values or `undefined` if some are still pending

Notes:

- The resulting refs only propagate the first argument, the element or component ref.
- These don't type check the values themselves apart from checking identity with a private sentinel object.

This is implemented [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/ref.mjs), with an optimized implementation [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/optimized/ref.mjs).

## Trusted vnodes

This is exposed under `mithril/trust` and in the full bundle via `Mithril.Trust`. is a userland implementation of `m.trust`, something that's been around since v0.1. It's out-of-core because `innerHTML` is better for most use cases.

- `m(Trust, {tag = "div", xmlns = null}, ...children)`
    - `tag:` - The tag name to use for the temporary parent. By default, it uses `"div"`
    - `xmlns:` - The namespace to use for the temporary parent. By default, it falls back to just using the default document namespace.
    - `children:` - An array of children strings to render as part of the fragment.
    - `ref:` - This provides an array of child nodes for its ref.

This is implemented [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/trust.mjs), with an optimized implementation [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/optimized/trust.mjs).

### Why?

People are going to ask for it anyways, so why not? Plus, it shows off some of the flexibility of the component model.

## Router API

This is exposed under `mithril/router` and in the full bundle via `Mithril.Router`. The default export is a global router instance. It depends on the internal path parsing utilities, but that's it.

- `newRouter = Router.create(init: (update) => history)` - Create a new global router instance with a different history.
    - `{href, state} = history.current()` - Return the current URL + state pair
    - `history.push(href, state, title)` - Push a new URL + state pair with an optional descriptive title
    - `history.replace(href, state, title)` - Replace the current URL + state pair with an optional descriptive title
    - `history.pop()` - Pop the current URL + state pair and restore the previous pair
    - `history.prefix` - Any prefix to tack on to linked children.
    - `update()` - Schedule a change callback using the current change callback.
    - The default history splices off the prefix, but custom histories don't necessarily have to.
    - The `update` callback indirectly invokes `Router.update`.
    - The history should be somehow initialized with a reference to its corresponding global router instance

- `Router.history` - Get the router history.
    - The default history has a `history.prefix` property with some extra magic semantics
        - When the prefix starts with `#`, routing is based on the URL's hash.
        - When the prefix starts with `?`, routing is based on the URL's query + hash.
        - When the prefix starts with anything else, routing is based on the full URL path, query, and hash.
        - The default prefix is `"#!"`.
        - When no DOM exists, the default history throws an error from every method.

- `Router.match({...routes, default, current?})` - Dispatch based on a route.
    - `current = href | {href, state}` forces a current route, ignoring the history altogether. Passing a string is equivalent to passing `{path: current, state: null}`. Don't use this unless you're rendering server-side.
    - `default:` is the fallback route if no route is detected, if no routes match, or if the current route's `href` is literally `""`.
    - `"/route/:param": (params) => ...` - Define a route
        - `params` contains both query params and template params.
        - This can return one of `router` to skip, an object of child routes (for composable routes, detected by the presence of a property starting with `/`) to then dispatch from, a vnode child, or a state reducer returning one of the above.
        - Child route objects may also contain `default:` properties, but not `current:`.
        - This is exact by default, but the prefix carried by the context specifically *excludes* any final parameter, either `:param` or `:param...`.
    - When there is no active history (as in, when running without a global DOM and without an explicit `history:`), `current` is required.
    - If you want a 404 route, define a final route of `"/:path...": () => ...`.
    - Note: this returns a state reducer. So this *can* be used independently of Mithril's view.

- `Router.push(href | setOpts).then(...)` - Set the current route.
    - `opts.href` - The target URL to move to. Specifying a string is equivalent to passing this without parameters.
    - `opts.params` - The data you want to interpolate and append as query parameters
    - `opts.state` - The state to associate with the history entry
    - `opts.title` - The title of the history entry

- `Router.replace(href | setOpts).then(...)` - Replace the current route, taking into account any prefix.
    - Options are identical to `Router.push(href | setOpts).then(...)`
    - This is intentionally unwieldy. Prefer `Router.Link` where possible.
    - Use this to redirect. `route: () => { Router.redirect(...) }` is the preferred idiom.

- `Router.pop().then(...)` - Go back to the previous route.
    - The returned promises await the change to execute first as well as the `onupdate` to execute.

- `m(Router.Link, {...}, elem)` - Create a link using the router's parent's implicit prefix
    - `children:` - An element to hook into with `onclick` + `href` (required)
    - All other options are passed to `router.push(opts)`

This is implemented [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/router.mjs), although it currently lacks support for state reducers returning anything other than vnodes.

### Notes

- Prefer `Router.Link` over explicit `router.push(...)`/`router.replace(...)`/`router.pop(...)` for URLs. Mithril handles most of the boilerplate and
- Each of these strips the prefix as necessary, and they wrap inconsistencies in the history passed to `Router.create(...)`.
- This is fully zero-dependency and the only utility that requires vnodes is the `router.Link` component, so you *could* use this in both state reducers and the virtual DOM tree without issue as long as you don't use `router.Link`.

## Request API

This is exposed under `mithril/request`.

- JSONP support is gone. It's basically obsolete now in light of CORS being available on all supported platforms, and our code is easy to just copy if necessary.

Beyond that, the API is probably fine as-is after [#2335](https://github.com/MithrilJS/mithril.js/pull/2335) and [#2361](https://github.com/MithrilJS/mithril.js/pull/2361) are merged.

## Async loading sugar

This is exposed under `mithril/async` and in the full bundle via `Mithril.Async`.

Basically https://github.com/MithrilJS/mithril.js/issues/2282.

- `m(Async, {init, destroy, loading, ready, error, destroyed})`
    - `init:` - Initialize the resource and return a promise resolved once ready, rejected if error. This is a function accepting a cancellation scheduler so you can abort requests as necessary.
    - `destroy:` - Destroy an initialized resource and return a promise resolved once destroyed, rejected if an error occurred during destruction.
    - `loading:`, `ready:`, `error:`, `destroyed:` - Render a body based on the state
        - `loading()` - Resource is currently loading
        - `ready(data)` - Resource is ready
        - `error(error)` - An error occurred when creating or destroying the resource.
        - `destroyed()` - Resource is successfully destroyed
    - `ref:` - This provides a `destroy()` callback as its `ref`, so you can manually and gracefully destroy the resource.
    - This is also a state reducer factory, so yes, you can use it in your state reducers, too. And it's zero-dependency, so it doesn't care whether you return vnodes or something else entirely.

This is implemented [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/async.mjs), with an optimized implementation [here](https://github.com/isiahmeadows/mithril.js/blob/v3-redesign/src/optimized/async.mjs).

### Why?

1. It makes lazy resource loading *way* easier to manage.
1. It takes all the boilerplate out of CRUD-like views.
1. It enables something like [`React.lazy`](https://reactjs.org/docs/code-splitting.html#reactlazy) + [`React.Suspense`](https://reactjs.org/docs/code-splitting.html#suspense), but it's generalized and makes error handling a bit easier.
1. Together with `Router` above, async route loading is practically trivial.
1. One might conceptualize a component + server-side helper built on this + `mithril/hydrate` + `mithril/render-html` to create delimited components that incrementally load from the server as needed, with implicit HTML hydration to speed it up significantly. With React, it's *possible* to build something through mixing `React.lazy` + `React.suspense`, but it's not something you could just put together in a weekend on your own.

## Transition API

This is exposed under `mithril/transition` and in the full bundle via `Mithril.Transition`.

- `m(Transition, {in, out, show, onin, onout}, children)` - Define a transitioned element
    - `in:` - Zero or more space-separated classes to toggle while transitioning inward.
    - `out:` - Zero or more space-separated classes to toggle while transitioning outward.
    - `show:` - Whether this should be considered shown.
    - `onin:` - Called after the transition for `in:` completes, if `in:` is present.
    - `onout:` - Called after the transition for `out:` completes, if `out:` is present.
    - `children:` - The element to transition with. Note: this *must* be a single element.

Notes:

- `onfinish` is only called for `in`/`out` finish when the relevant property exists and is `!= null`.
- Transitioned elements are cloned with appropriate attributes added and event handlers wrapped.
- When an element is hidden and immediately re-shown, the removal animation is awaited and the element fully removed before it's re-added.
- When an element is removed and immediately re-added and removed again, the removal animation is *not* restarted, nor is it re-added.

### Why?

1. Transitions are common enough they should have a story.

## HTML renderer

This is exposed under `mithril/render-html`.

Basically `mithril-node-render`, moved into core. Optionally, I might also expose a streaming interface so it can be incrementally written to the stream as it becomes ready for it, for very streamlined server-side rendering support.

### Why?

1. It's a very common renderer that has to know a lot about Mithril's internals to begin with.
1. It shares a lot in common with hydration, so they both need to be at least somewhat aware of each others' existence.
1. It lets us keep API changes much more tightly integrated.
1. It helps us determine more easily what's common between single-shot and retained renderers, so we can know what abstractions to expose.
1. It makes our SSR support much more discoverable.
1. It's a much simpler upgrading story.

## Streams

This is exposed under `mithril/stream`, and is the same as what's there today. Nothing is changing here except [maybe moving it into the main bundle itself](https://github.com/MithrilJS/mithril.js/issues/2380), but that's separate to this whole effort.