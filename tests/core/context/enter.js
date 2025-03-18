import o from "ospec"

import m from "../../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("`snapshot.enter`", () => {
	o.spec("set inside snapshot", () => {
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			o(snapshot.enter(() => myVar.set(456, () => myVar.v))).equals(456)
		})

		o("var reads immediately assigned value correctly", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			o(snapshot.enter(() => {
				myVar.v = 456
				return myVar.v
			})).equals(456)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			o(snapshot.enter(() => {
				myVar.set(456, () => {})
				return myVar.v
			})).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, () => {
						throw error
					})
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
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, overflowStack)
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

			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			o(snapshot.enter(() => myVar.set(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside empty snapshot", () => {
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

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

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
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
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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

			const snapshot = new m.Snapshot()
			const myVar = new m.Var(123)
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot without var set", () => {
		const testVar = new m.Var("")

		o("var reads initial value correctly", () => {
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

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

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot())
			const myVar = new m.Var(123)
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot())
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
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
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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

			const snapshot = testVar.set("foo", () => new m.Snapshot())
			const myVar = new m.Var(123)
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot with var set", () => {
		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot())

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot())

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot())
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot())
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot())
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			const snapshot = myVar.set(999, () => new m.Snapshot())
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
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

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
			const myVar = new m.Var(123)
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
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
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
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

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			const myVar = new m.Var(123)
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
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
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
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

			o(snapshot.enter(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			const myVar = new m.Var(123)
			o(snapshot.enter(() => myVar.set(456, () => myVar.v))).equals(456)
		})

		o("var set restores value correctly", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			const myVar = new m.Var(123)
			o(snapshot.enter(() => {
				myVar.set(456, () => {})
				return myVar.v
			})).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			const myVar = new m.Var(123)
			const error = new Error("test")
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, () => {
						throw error
					})
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
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, overflowStack)
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
			o(snapshot.enter(() => myVar.set(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with accessed var set", () => {
		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			const snapshot = myVar.set(999, () => new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot())))
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with accessed var set", () => {
		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, () => myVar.v))).equals(456)
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => {
				myVar.set(456, () => {})
				return myVar.v
			})).equals(555)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))
			const error = new Error("test")
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, overflowStack)
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
			const snapshot = new m.Snapshot().enter(() => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with self var then other var set", () => {
		const testVar = new m.Var("")

		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			const snapshot = myVar.set(999, () => myVar.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with self var then other var set", () => {
		const testVar = new m.Var("")

		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, () => myVar.v))).equals(456)
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))
			o(snapshot.enter(() => {
				myVar.set(456, () => {})
				return myVar.v
			})).equals(555)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))
			const error = new Error("test")
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, overflowStack)
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
			const snapshot = myVar.set(555, () => testVar.set("foo", () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with other var then self var set", () => {
		const testVar = new m.Var("")

		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))
			myVar.set(456, () => {
				snapshot.enter(() => {})
			})
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))
			const error = new Error("test")
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))
			const thrown = myVar.set(456, () => {
				try {
					snapshot.enter(overflowStack)
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
			const snapshot = myVar.set(999, () => testVar.set("foo", () => myVar.set(555, () => new m.Snapshot())))
			o(myVar.set(456, () => snapshot.enter(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with other var then self var set", () => {
		const testVar = new m.Var("")

		o("var reads initial value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar.v
			}

			o(snapshot.enter(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("var reads immediately set value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, () => myVar.v))).equals(456)
		})

		o("var set restores value correctly", () => {
			const myVar = new m.Var(123)
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => {
				myVar.set(456, () => {})
				return myVar.v
			})).equals(555)
		})

		o("var set restores value correctly after error", () => {
			const myVar = new m.Var(123)
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))
			const error = new Error("test")
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar.v).equals(123)
		})

		o("var set restores value correctly after stack overflow", () => {
			const myVar = new m.Var(123)
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))
			const thrown = snapshot.enter(() => {
				try {
					myVar.set(456, overflowStack)
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
			const snapshot = testVar.set("foo", () => myVar.set(555, () => new m.Snapshot()))
			o(snapshot.enter(() => myVar.set(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})
})
