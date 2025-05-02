import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("interval", () => {
	var ctrl

	o.beforeEach(() => {
		ctrl = new AbortController()
	})

	o.afterEach(() => {
		ctrl.abort()
	})

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	// Not testing infinite loops. I'd have to do it in a child process or iframe, and that just
	// requires way more setup than I feel like doing. Besides, `signal` is purely additive.

	o("handles immediate inner aborting", async () => {
		var ticks = 0
		var p = m.interval(5, () => {
			ticks++
			ctrl.abort()
		}, ctrl.signal)
		await sleep(50, ctrl.signal)
		ctrl.abort()
		o(await p).equals(undefined)
		o(ticks).equals(1)
	})

	o("handles late inner aborting", async () => {
		var ticks = 0
		var p = m.interval(5, () => {
			ticks++
			if (ticks > 1) ctrl.abort()
		}, ctrl.signal)
		await sleep(50, ctrl.signal)
		ctrl.abort()
		o(await p).equals(undefined)
		o(ticks).equals(2)
	})

	o("handles pre-aborting", async () => {
		ctrl.abort()
		var ticks = 0
		var p = m.interval(10, () => {
			ticks++
		}, ctrl.signal)
		o(await p).equals(undefined)
		o(ticks).equals(0)
	})

	o("handles immediate post-aborting", async () => {
		var ticks = 0
		var p = m.interval(10, () => {
			ticks++
		}, ctrl.signal)
		ctrl.abort()
		o(await p).equals(undefined)
		o(ticks).equals(0)
	})

	// This is inherently time-based.
	o("handles multiple ticks", async () => {
		var ticks = 0
		var p = m.interval(40, () => {
			ticks++
		}, ctrl.signal)
		// It's (supposed to be) modified in the callback
		// eslint-disable-next-line no-unmodified-loop-condition
		while (ticks < 2) {
			await sleep(100, ctrl.signal)
		}
		ctrl.abort()
		o(await p).equals(undefined)
		o(ticks).satisfies((v) => ({
			pass: v >= 2,
			message: `expected 2+ ticks, found ${v}`,
		}))
	})
})
