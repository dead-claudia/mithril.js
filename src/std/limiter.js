/* global performance, setTimeout, clearTimeout */

import m from "../entry/mithril.esm.js"
import {noop} from "../util.js"

/**
 * @typedef {{
 *     (edge?: "any" | "end"): Promise<"start" | "end" | "waiting">
 *     update(delay: ms): void
 * }} Limiter
 */

/**
 * A general-purpose multi-mode limiter with a dynamically configurable limit. Create as
 * `limited = m.limiter(mode, ms, signal?)` and do `if (await limiter() === "waiting") return` to
 * rate-limit the code that follows. The `signal` parameter is an optional abort signal to dispose
 * on abort.
 *
 * Call `limiter.update(ms)` to update the interval. This not only impacts future timers, but also
 * reschedules any current one as needed.
*
 * If you don't specify a delay, it defaults to 500ms on creation, which works well enough for most
 * needs. There is no default for `limiter.update(...)` - you must specify one explicitly.
 *
 * When calling the limiter, the result is one of three values, to allow you to identify edge state:
 *
 * - Leading/start edge: `"start"`
 * - Trailing/end edge: `"end"`, returned only if a second call was made
 * - No edge: `"waiting"`
 *
 * You can also call `if (limiter("end"))` to have it ignore the leading edge and only monitor
 * trailing edges.
 *
 * In debounce mode, it functions as a bi-edge debouncer. In throttle mode, it functions as a
 * bi-edge throttler. It's much better than your typical `debounce(f, ms)` or `throttle(f, ms)`:
 *
 * - It lets you easily separate the trigger and reaction using a single shared, encapsulated
 *   state object.
 * - Its use of promises lets you completely unnest your logic using `async`/`await` or `m.run` and
 *   generators.
 *
 * Example usage in debounce mode:
 *
 * ```js
 * const debounced = m.limiter("debounce")
 * let results, error
 * return (attrs) => [
 *     m.remove(debounced.dispose),
 *     m("input[type=text].value", {
 *         async oninput(ev) {
 *             // Skip redraw if rate limited - it's pointless
 *             if ((await debounced()) !== false) return false
 *             try {
 *                 const response = await fetch(m.p("/save/:id", {id: attrs.id}), {
 *                     body: JSON.stringify({value: ev.target.value}),
 *                 })
 *                 if (!response.ok) {
 *                     error = await response.text()
 *                 }
 *             } catch (e) {
 *                 error = e.message
 *             }
 *         },
 *     }),
 *     results.map((result) => m(SearchResult, {result})),
 *     !error || m(ErrorDisplay, {error})),
 * ]
 * ```
 *
 * Example usage as a throttler:
 *
 * ```js
 * const throttled = m.throttler()
 * let results, error
 * return function () {
 *     return [
 *         m.remove(throttled.dispose),
 *         m("input[type=search]", {
 *             oninput: async (ev) => {
 *                 // Skip redraw if rate limited - it's pointless
 *                 if (await throttled()) return false
 *                 error = results = null
 *                 this.redraw()
 *                 try {
 *                     const response = await fetch(m.p("/search", {q: ev.target.value}))
 *                     if (response.ok) {
 *                         results = await response.json()
 *                     } else {
 *                         error = await response.text()
 *                     }
 *                 } catch (e) {
 *                     error = e.message
 *                 }
 *             },
 *         }),
 *         results.map((result) => m(SearchResult, {result})),
 *         !error || m(ErrorDisplay, {error})),
 *     ]
 * }
 * ```
 *
 * Important note: due to the way this is implemented in basically all runtimes, the limiter's
 * clock might not tick during sleep, so if you do `await debounced()` and immediately sleep in a
 * low-power state for 5 minutes, you might have to wait another 10 minutes after resuming to a
 * high-power state.
 *
 * @param {"throttle" | "debounce"} mode
 * @param {number} [delay]
 * @param {AbortSignal} [signal]
 * @returns {Limiter}
 */
var limiter = (mode, delay = 500, signal = m.signal()) => {
	if (mode !== "throttle" && mode !== "debounce") {
		throw new TypeError("Mode must only be throttle or debounce")
	}

	// eslint-disable-next-line no-bitwise
	delay |= 0
	if (delay < 0) delay = 0

	var closed = false
	var start = 0
	var timer = 0
	var resolveNext = noop

	var callback = () => {
		timer = undefined
		resolveNext("end")
		resolveNext = noop
	}

	var limiter = async (edge = "any") => {
		if (closed) {
			return "waiting"
		}

		resolveNext("waiting")
		resolveNext = noop

		if (timer) {
			if (mode === "throttle") {
				return new Promise((resolve) => resolveNext = resolve)
			}

			clearTimeout(timer)
			edge = "end"
		}

		start = performance.now()
		timer = setTimeout(callback, delay)

		if (edge === "any") {
			return "start"
		}

		return new Promise((resolve) => resolveNext = resolve)
	}

	limiter.update = (newDelay) => {
		// eslint-disable-next-line no-bitwise
		newDelay |= 0
		if (newDelay < 0) newDelay = 0
		delay = newDelay

		if (closed) return
		if (timer) {
			clearTimeout(timer)
			timer = setTimeout(callback, (start - performance.now()) + delay)
		}
	}

	if (signal != null) {
		signal.addEventListener("abort", () => {
			if (closed) return
			closed = true
			clearTimeout(timer)
			resolveNext("waiting")
			resolveNext = noop
		})
	}

	return limiter
}

export {limiter}
