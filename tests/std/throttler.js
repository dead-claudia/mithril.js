import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("limiter (throttler)", () => {
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
		m.limiter("throttle", NaN)
		m.limiter("throttle", +1/0)
		m.limiter("throttle", -1/0)
		m.limiter("throttle", "")
		m.limiter("throttle", "123")
		m.limiter("throttle", true)
		m.limiter("throttle", false)
		m.limiter("throttle", null)
		m.limiter("throttle", [])
		m.limiter("throttle", {})
		o(() => m.limiter("throttle", Symbol("wat"))).throws(TypeError)
		m.limiter("throttle")
		m.limiter("throttle", 100)
	})

	o("validates update input", () => {
		var throttled = m.limiter("throttle", undefined, ctrl.signal)

		throttled.update(NaN)
		throttled.update(+1/0)
		throttled.update(-1/0)
		throttled.update("")
		throttled.update("123")
		throttled.update(true)
		throttled.update(false)
		throttled.update(null)
		throttled.update([])
		throttled.update({})
		o(() => throttled.update(Symbol("wat"))).throws(TypeError)
		throttled.update()
		throttled.update(100)
	})

	o("detects edges correctly", async () => {
		o.timeout(1000)

		var throttled = m.limiter("throttle", 100, ctrl.signal)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		await sleep(140)
		var p4 = throttled()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("end")
		o(await p4).equals("start")

		var p5 = throttled()
		await sleep(150)
		var p6 = throttled()
		o(await p5).equals("end")
		o(await p6).equals("start")
	})

	o("retains the timer on early hit", async () => {
		o.timeout(1000)

		var throttled = m.limiter("throttle", 100, ctrl.signal)

		var slept = false
		setTimeout(() => { slept = true }, 125)
		void throttled()
		await sleep(50)
		await throttled()
		o(slept).equals(false)
	})

	o("handles dynamic changes to higher delays", async () => {
		o.timeout(1000)

		var throttled = m.limiter("throttle", 100, ctrl.signal)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		throttled.update(200)
		await sleep(140)
		var p4 = throttled()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("waiting")
		o(await p4).equals("end")

		var p5 = throttled()
		await sleep(250)
		var p6 = throttled()
		o(await p5).equals("start")
		o(await p6).equals("start")
	})

	o("handles dynamic changes to lower delays", async () => {
		o.timeout(1000)

		var throttled = m.limiter("throttle", 100, ctrl.signal)

		var p1 = throttled()
		var p2 = throttled()
		await sleep(10)
		var p3 = throttled()
		throttled.update(50)
		await sleep(100)
		var p4 = throttled()
		o(await p1).equals("start")
		o(await p2).equals("waiting")
		o(await p3).equals("end")
		o(await p4).equals("start")

		var p5 = throttled()
		await sleep(100)
		var p6 = throttled()
		o(await p5).equals("end")
		o(await p6).equals("start")
	})

	o("handles same-duration changes", async () => {
		o.timeout(1000)

		var throttled = m.limiter("throttle", 100, ctrl.signal)

		var p1 = throttled()
		throttled.update(100)
		var p2 = throttled()
		throttled.update(100)
		await sleep(10)
		throttled.update(100)
		var p3 = throttled()
		throttled.update(100)
		await sleep(140)
		throttled.update(100)
		var p4 = throttled()
		throttled.update(100)
		o(await p1).equals("start")
		throttled.update(100)
		o(await p2).equals("waiting")
		throttled.update(100)
		o(await p3).equals("end")
		throttled.update(100)
		o(await p4).equals("start")
		throttled.update(100)

		var p5 = throttled()
		throttled.update(100)
		await sleep(150)
		throttled.update(100)
		var p6 = throttled()
		throttled.update(100)
		o(await p5).equals("end")
		throttled.update(100)
		o(await p6).equals("start")
	})
})
