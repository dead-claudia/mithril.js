import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

o.spec("sleep", () => {
	o("works", async () => {
		o(await m.sleep(5)).equals(true)
	})

	o("races correctly", async () => {
		o(await Promise.race([
			m.sleep(15).then(() => 1),
			m.sleep(5).then(() => 2),
		])).equals(2)
	})

	o("accepts zero duration", async () => {
		o(await m.sleep(0)).equals(true)
	})

	o("accepts negative duration", async () => {
		o(await m.sleep(-1)).equals(true)
	})

	o("accepts +Infinity duration", async () => {
		o(await m.sleep(Infinity)).equals(true)
	})

	o("accepts -Infinity duration", async () => {
		o(await m.sleep(-Infinity)).equals(true)
	})

	o("accepts NaN duration", async () => {
		o(await m.sleep(NaN)).equals(true)
	})

	o("handles pre-aborted calls correctly", async () => {
		var ctrl = new AbortController()
		ctrl.abort()
		o(await m.sleep(5, ctrl.signal)).equals(false)
	})

	o("handles post-aborted calls correctly", async () => {
		var ctrl = new AbortController()
		var p = m.sleep(5, ctrl.signal)
		ctrl.abort()
		o(await p).equals(false)
	})
})
