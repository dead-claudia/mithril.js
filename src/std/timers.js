/* global performance, setTimeout, clearTimeout */

import m from "../core.js"

/**
 * A utility to simplify sleeping.
 *
 * @param {number} ms
 * How long to sleep for in milliseconds
 *
 * @param {AbortSignal} [signal]
 * An optional signal to abort the sleep timer.
 *
 * @returns {boolean}
 * `true` if the sleep completed, `false` if it was aborted first.
 */
var sleep = (ms, signal) => new Promise((resolve) => {
	if (!signal) {
		// eslint-disable-next-line no-bitwise
		setTimeout(resolve, ms | 0, true)
	} else if (signal.aborted) {
		resolve(false)
	} else {
		var resume = (ev) => {
			clearTimeout(t)
			signal.removeEventListener("abort", resume)
			resolve(!ev)
		}
		// eslint-disable-next-line no-bitwise
		var t = setTimeout(resume, ms | 0)
		signal.addEventListener("abort", resume)
	}
})

/**
 * A utility to simplify interval watching. It's much more accurate than `setInterval` as it
 * monitors the current time. It also usefully triggers right away rather than waiting (which is
 * rarely what you want in practice).
 *
 * @param {number} ms
 * How long to sleep for in milliseconds
 *
 * @param {() => Promise<void>} callback
 * An optional callback to call every `ms` milliseconds. It starts right at the next microtask.
 *
 * You can return a promise, in which it's awaited before looping back around. This helps you *not*
 * overload servers and other stuff with requests if they get stuck somehow.
 *
 * @param {AbortSignal} [signal]
 * An optional signal to abort the sleep timer.
 *
 * @returns {Promise<void>}
 * Resolves once the signal aborts.
 */
var interval = async (ms, callback, signal) => {
	// eslint-disable-next-line no-bitwise
	ms |= 0
	if (ms < 0) ms = 0
	var start = performance.now()
	var snapshot = m.snap()
	// This is intentional.
	await 0
	if (signal.aborted) return
	do {
		try {
			await snapshot(callback)
		} catch (e) {
			console.error(e)
		}
		var delta = performance.now() - start
		start += Math.ceil(Math.max(1, delta / ms)) * ms
	} while (await m.sleep(Math.ceil(delta), signal))
}

export {sleep, interval}
