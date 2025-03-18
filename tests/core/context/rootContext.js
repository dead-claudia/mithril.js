import o from "ospec"

import m from "../../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("context vars (root context)", () => {
	o("var reads initial value correctly", () => {
		const myVar = new m.Var(123)
		o(myVar.v).equals(123)
	})

	o("var reads immediately `.set` value correctly", () => {
		const myVar = new m.Var(123)
		o(myVar.set(456, () => myVar.v)).equals(456)
	})

	o("var reads immediately `.v = ...` value correctly", () => {
		const myVar = new m.Var(123)
		myVar.v = 456
		o(myVar.v).equals(456)
		myVar.v = 999
		o(myVar.v).equals(999)
	})

	o("var `.set` restores value correctly", () => {
		const myVar = new m.Var(123)
		myVar.set(456, () => {})
		o(myVar.v).equals(123)
	})

	o("var `.set` restores value correctly after error", () => {
		const myVar = new m.Var(123)
		const error = new Error("test")
		let thrown
		try {
			myVar.set(456, () => { throw error })
		} catch (e) {
			thrown = e
		}
		o(thrown).equals(error)
		o(myVar.v).equals(123)
	})

	o("var `.set` restores value correctly after stack overflow", () => {
		const myVar = new m.Var(123)
		let thrown = false
		try {
			myVar.set(456, overflowStack)
		} catch (_) {
			thrown = true
		}
		o(thrown).equals(true)
		o(myVar.v).equals(123)
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

		const myVar = new m.Var(123)
		o(myVar.set(456, spy, "test")).equals("foo")
		o(calls).equals(1)
		o(receivedThis).equals(undefined)
		o(receivedArgs).deepEquals(["test"])
	})
})
