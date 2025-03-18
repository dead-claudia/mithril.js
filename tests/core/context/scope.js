import o from "ospec"

import m from "../../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("`m.scope` basics", () => {
	o("var reads initial value correctly", () => {
		const snapshot = new m.Snapshot()
		const myVar = new m.Var(123)

		let calls = 0
		let receivedThis, receivedArgs

		function spy(...args) {
			calls++
			receivedThis = this
			receivedArgs = args
			return myVar.v
		}

		o(snapshot.enter(() => m.scope(spy, "test"))).equals(123)
		o(calls).equals(1)
		o(receivedThis).equals(undefined)
		o(receivedArgs).deepEquals(["test"])
		o(myVar.v).equals(123)
	})
})

function testVariants() {
	testVariant("cvar.set", (cvar, value, f, ...args) => cvar.set(value, f, ...args))
	testVariant("cvar.v = ...", (cvar, value, f, ...args) => m.scope(() => {
		cvar.v = value
		return f(...args)
	}))
}

function testVariant(name, setVar) {
	o.spec(`\`m.scope\` + \`${name}\` interaction`, () => {
		o.spec("set inside snapshot", () => {
			o("var reads immediately set value correctly", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, () => myVar.v)))).equals(456)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => {
					setVar(myVar, 456, () => {})
					return myVar.v
				}))).equals(123)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, () => { throw error })
					} catch (e) {
						return e
					}
				}))
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				}))
				o(thrown).equals(true)
				o(myVar.v).equals(123)
			})

			o("`contextVar.set(...)` calls callback exactly once with provided arguments", () => {
				const snapshot = new m.Snapshot()

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return "foo"
				}

				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside empty snapshot", () => {
			o("var reads immediately set value correctly", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(setVar(myVar, 456, () => snapshot.enter(() => m.scope(spy, "test")))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = new m.Snapshot()
				const myVar = new m.Var(123)
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
				o(thrown).equals(true)
				o(myVar.v).equals(123)
			})

			o("`contextVar.set(...)` calls callback exactly once with provided arguments", () => {
				const snapshot = new m.Snapshot()

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return "foo"
				}

				const myVar = new m.Var(123)
				o(setVar(myVar, 456, () => snapshot.enter(() => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside non-empty snapshot without var set", () => {
			const testVar = new m.Var("")

			o("var reads immediately set value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())
				const myVar = new m.Var(123)
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())
				const myVar = new m.Var(123)
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
				o(thrown).equals(true)
				o(myVar.v).equals(123)
			})

			o("`contextVar.set(...)` calls callback exactly once with provided arguments", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return "foo"
				}

				const myVar = new m.Var(123)
				o(setVar(myVar, 456, () => snapshot.enter(() => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside non-empty snapshot with var set", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(setVar(myVar, 456, () => snapshot.enter(() => m.scope(spy, "test")))).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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
				const snapshot = setVar(myVar, 999, () => new m.Snapshot())
				o(setVar(myVar, 456, () => (
					[m.scope(spy, "test"), myVar.v, snapshot.enter(() => myVar.v)]
				))).deepEquals(["foo", 456, 999])
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside empty nested snapshot", () => {
			o("var reads initial value correctly", () => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals(456)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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

				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				const myVar = new m.Var(123)
				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside nested snapshot with other var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals(456)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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

				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set inside nested snapshot with other var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, () => myVar.v)))).equals(456)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => {
					setVar(myVar, 456, () => {})
					return myVar.v
				}))).equals(123)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, () => { throw error })
					} catch (e) {
						return e
					}
				}))
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				}))
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

				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				const myVar = new m.Var(123)
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside nested snapshot with accessed var set", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals(456)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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
				const snapshot = setVar(myVar, 999, () => new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot())))
				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set inside nested snapshot with accessed var set", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, () => myVar.v)))).equals(456)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => {
					setVar(myVar, 456, () => {})
					return myVar.v
				}))).equals(555)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))
				const error = new Error("test")
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, () => { throw error })
					} catch (e) {
						return e
					}
				}))
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				}))
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
				const snapshot = new m.Snapshot().enter(() => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals(456)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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
				const snapshot = setVar(myVar, 999, () => setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot())))
				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set inside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, () => myVar.v)))).equals(456)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => {
					setVar(myVar, 456, () => {})
					return myVar.v
				}))).equals(555)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))
				const error = new Error("test")
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, () => { throw error })
					} catch (e) {
						return e
					}
				}))
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				}))
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
				const snapshot = setVar(myVar, 555, () => testVar.set("foo", () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set outside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals(456)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))
				setVar(myVar, 456, () => {
					snapshot.enter(() => m.scope(() => {}))
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))
				const error = new Error("test")
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(() => { throw error }))
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))
				const thrown = setVar(myVar, 456, () => {
					try {
						snapshot.enter(() => m.scope(overflowStack))
						return false
					} catch (_) {
						return true
					}
				})
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
				const snapshot = setVar(myVar, 999, () => testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot())))
				o(snapshot.enter(() => setVar(myVar, 456, () => m.scope(spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})

		o.spec("set inside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(snapshot.enter(() => m.scope(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, () => myVar.v)))).equals(456)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => {
					setVar(myVar, 456, () => {})
					return myVar.v
				}))).equals(555)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))
				const error = new Error("test")
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, () => { throw error })
					} catch (e) {
						return e
					}
				}))
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))
				const thrown = snapshot.enter(() => m.scope(() => {
					try {
						setVar(myVar, 456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				}))
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
				const snapshot = testVar.set("foo", () => setVar(myVar, 555, () => new m.Snapshot()))
				o(snapshot.enter(() => m.scope(() => setVar(myVar, 456, spy, "test")))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
				o(myVar.v).equals(123)
			})
		})
	})
}

testVariants()
