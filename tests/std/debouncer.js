import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("limiter (debouncer)", () => {
	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	var ctrl

	o.beforeEach(() => {
		ctrl = new AbortController()
	})

	o.afterEach(() => {
		ctrl.abort()
	})

	o("coerces create input", () => {
		m.limiter("debounce", NaN)
		m.limiter("debounce", +1/0)
		m.limiter("debounce", -1/0)
		m.limiter("debounce", "")
		m.limiter("debounce", "123")
		m.limiter("debounce", true)
		m.limiter("debounce", false)
		m.limiter("debounce", null)
		m.limiter("debounce", [])
		m.limiter("debounce", {})
		o(() => m.limiter("debounce", Symbol("wat"))).throws(TypeError)
		m.limiter("debounce")
		m.limiter("debounce", 100)
	})

	o("validates update input", () => {
		var debounced = m.limiter("debounce", undefined, ctrl.signal)

		debounced.update(NaN)
		debounced.update(+1/0)
		debounced.update(-1/0)
		debounced.update("")
		debounced.update("123")
		debounced.update(true)
		debounced.update(false)
		debounced.update(null)
		debounced.update([])
		debounced.update({})
		o(() => debounced.update(Symbol("wat"))).throws(TypeError)
		debounced.update()
		debounced.update(100)
	})

	o("detects edges correctly", async () => {
		o.timeout(1000)

		var debounced = m.limiter("debounce", 100, ctrl.signal)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		await sleep(140)
		var p4 = debounced()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("end")
		o(await p4).equals("start")

		var p5 = debounced()
		await sleep(150)
		var p6 = debounced()
		o(await p5).equals("end")
		o(await p6).equals("start")
	})

	o("resets the timer on early hit", async () => {
		o.timeout(1000)

		var debounced = m.limiter("debounce", 100, ctrl.signal)

		var slept = false
		setTimeout(() => { slept = true }, 125)
		void debounced()
		await sleep(50)
		await debounced()
		o(slept).equals(true)
	})

	o("handles dynamic changes to higher delays", async () => {
		o.timeout(1000)

		var debounced = m.limiter("debounce", 100, ctrl.signal)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		debounced.update(200)
		await sleep(140)
		var p4 = debounced()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("waiting")
		o(await p4).equals("end")

		var p5 = debounced()
		await sleep(250)
		var p6 = debounced()
		o(await p5).equals("start")
		o(await p6).equals("start")
	})

	o("handles dynamic changes to lower delays", async () => {
		o.timeout(1000)

		var debounced = m.limiter("debounce", 100, ctrl.signal)

		var p1 = debounced()
		var p2 = debounced()
		await sleep(10)
		var p3 = debounced()
		debounced.update(50)
		await sleep(100)
		var p4 = debounced()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("end")
		o(await p4).equals("start")

		var p5 = debounced()
		await sleep(100)
		var p6 = debounced()
		o(await p5).equals("end")
		o(await p6).equals("start")
	})

	o("handles same-duration changes", async () => {
		o.timeout(1000)

		var debounced = m.limiter("debounce", 100, ctrl.signal)

		var p1 = debounced()
		debounced.update(100)
		var p2 = debounced()
		debounced.update(100)
		await sleep(10)
		debounced.update(100)
		var p3 = debounced()
		debounced.update(100)
		await sleep(140)
		debounced.update(100)
		var p4 = debounced()
		debounced.update(100)
		o(await p1).equals("start")
		debounced.update(100)
		o(await p2).equals("waiting")
		debounced.update(100)
		o(await p3).equals("end")
		debounced.update(100)
		o(await p4).equals("start")
		debounced.update(100)

		var p5 = debounced()
		debounced.update(100)
		await sleep(150)
		debounced.update(100)
		var p6 = debounced()
		debounced.update(100)
		o(await p5).equals("end")
		debounced.update(100)
		o(await p6).equals("start")
	})
})
