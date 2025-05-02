import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("context vars (root context)", () => {
	o("dyn reads initial value correctly", () => {
		const myDyn = m.dyn(123)
		o(myDyn()).equals(123)
	})

	o("dyn reads immediately set value correctly", () => {
		const myDyn = m.dyn(123)
		o(myDyn(456, () => myDyn())).equals(456)
	})

	o("dyn reads changed default correctly", () => {
		const myDyn = m.dyn(123)
		myDyn(456)
		o(myDyn()).equals(456)
		myDyn(999)
		o(myDyn()).equals(999)
	})

	o("dyn set restores value correctly", () => {
		const myDyn = m.dyn(123)
		myDyn(456, () => {})
		o(myDyn()).equals(123)
	})

	o("dyn set restores value correctly after error", () => {
		const myDyn = m.dyn(123)
		const error = new Error("test")
		let thrown
		try {
			myDyn(456, () => { throw error })
		} catch (e) {
			thrown = e
		}
		o(thrown).equals(error)
		o(myDyn()).equals(123)
	})

	o("dyn set restores value correctly after stack overflow", () => {
		const myDyn = m.dyn(123)
		let thrown = false
		try {
			myDyn(456, overflowStack)
		} catch (_) {
			thrown = true
		}
		o(thrown).equals(true)
		o(myDyn()).equals(123)
	})

	o("`contextVar.set(...)` calls callback exactly once with provided arguments", () => {
		let calls = 0
		let receivedThis, receivedArgs

		function spy(...args) {
			calls++
			receivedThis = this
			receivedArgs = args
			return "foo"
		}

		const myDyn = m.dyn(123)
		o(myDyn(456, spy, "test")).equals("foo")
		o(calls).equals(1)
		o(receivedThis).equals(undefined)
		o(receivedArgs).deepEquals(["test"])
	})
})
