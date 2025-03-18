import o from "ospec"

import m from "../../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

function testVariants() {
	testVariant("m.wrap", m.wrap)
	testVariant("snapshot.wrap", (f, ...args) => new m.Snapshot().wrap(f, ...args))
}

function testVariant(name, wrap) {
	o.spec(`\`${name}\` with bound args`, () => {
		o.spec("set inside snapshot", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(wrap(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				o(wrap(() => myVar.set(456, () => myVar.v))()).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				o(wrap(() => {
					myVar.set(456, () => {})
					return myVar.v
				})()).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = wrap(() => {
					try {
						myVar.set(456, () => {
							throw error
						})
					} catch (e) {
						return e
					}
				})()
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const thrown = wrap(() => {
					try {
						myVar.set(456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				})()
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
				o(wrap(() => myVar.set(456, spy, "test"))()).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside empty snapshot", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(wrap(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(myVar.set(456, wrap(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const wrapped = wrap(() => {})
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const wrapped = wrap(() => { throw error })
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const wrapped = wrap(overflowStack)
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				o(myVar.set(456, wrap(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside non-empty snapshot without var set", () => {
			const testVar = new m.Var("")
			const wrapSnapshot = (...args) => testVar.set("foo", () => wrap(...args))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(wrapSnapshot(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(myVar.set(456, wrapSnapshot(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const wrapped = wrapSnapshot(() => {})
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const wrapped = wrapSnapshot(() => { throw error })
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const wrapped = wrapSnapshot(overflowStack)
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				o(myVar.set(456, wrapSnapshot(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside non-empty snapshot with var set", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => wrap(spy, "test"))
				o(wrapped()).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => wrap(spy, "test"))
				o(myVar.set(456, wrapped)).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => wrap(() => {}))
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => wrap(() => { throw error }))
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => wrap(overflowStack))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				const wrapped = myVar.set(999, () => wrap(spy, "test"))
				o(myVar.set(456, () => wrapped())).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside empty nested snapshot", () => {
			const testWrapped = (...args) => wrap(() => wrap(...args))()

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = testWrapped(spy, "test")
				o(myVar.set(456, () => wrapped())).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const wrapped = testWrapped(() => {})
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const wrapped = testWrapped(() => { throw error })
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const wrapped = testWrapped(overflowStack)
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				const wrapped = testWrapped(spy, "test")
				o(myVar.set(456, () => wrapped())).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with other var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (...args) =>
				testVar.set("foo", wrap(() => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(myVar.set(456, testWrapped(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const wrapped = testWrapped(() => {})
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const wrapped = testWrapped(() => { throw error })
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const wrapped = testWrapped(overflowStack)
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				o(myVar.set(456, testWrapped(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with other var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (...args) =>
				testVar.set("foo", wrap(() => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(spy, "test")()).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(() => myVar.set(456, () => myVar.v))()).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(() => {
					myVar.set(456, () => {})
					return myVar.v
				})()).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = testWrapped(() => {
					try {
						myVar.set(456, () => {
							throw error
						})
					} catch (e) {
						return e
					}
				})()
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const thrown = testWrapped(() => {
					try {
						myVar.set(456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				})()
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
				o(testWrapped(() => myVar.set(456, spy, "test"))()).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with accessed var set", () => {
			const testWrapped = (myVar, ...args) =>
				wrap(() => myVar.set(555, () => wrap(...args)))()

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(wrapped()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(myVar.set(456, wrapped)).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => {}))
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => { throw error }))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, overflowStack))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				o(myVar.set(456, testWrapped(myVar, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with accessed var set", () => {
			const testWrapped = (myVar, ...args) =>
				wrap(() => myVar.set(555, () => wrap(...args)))()

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(myVar, spy, "test")()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => myVar.set(456, () => myVar.v))()).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => {
					myVar.set(456, () => {})
					return myVar.v
				})()).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, () => {
							throw error
						})
					} catch (e) {
						return e
					}
				})()
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				})()
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
				o(testWrapped(myVar, () => myVar.set(456, spy, "test"))()).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (myVar, ...args) =>
				myVar.set(555, () => testVar.set("foo", () => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(wrapped()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(myVar.set(456, wrapped)).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => {}))
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => { throw error }))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, overflowStack))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(myVar.set(456, wrapped)).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (myVar, ...args) =>
				myVar.set(555, () => testVar.set("foo", () => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(myVar, spy, "test")()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => myVar.set(456, () => myVar.v))()).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => {
					myVar.set(456, () => {})
					return myVar.v
				})()).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, () => {
							throw error
						})
					} catch (e) {
						return e
					}
				})()
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				})()
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
				o(testWrapped(myVar, () => myVar.set(456, spy, "test"))()).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (myVar, ...args) =>
				myVar.set(555, () => testVar.set("foo", () => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(myVar, spy, "test")()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(myVar.set(456, testWrapped(myVar, spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => {}))
				myVar.set(456, () => {
					wrapped()
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const wrapped = myVar.set(999, () => testWrapped(myVar, () => { throw error }))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
					} catch (e) {
						return e
					}
				})
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const wrapped = myVar.set(999, () => testWrapped(myVar, overflowStack))
				const thrown = myVar.set(456, () => {
					try {
						wrapped()
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
				const wrapped = myVar.set(999, () => testWrapped(myVar, spy, "test"))
				o(myVar.set(456, wrapped)).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")
			const testWrapped = (myVar, ...args) =>
				testVar.set("foo", () => myVar.set(555, () => wrap(...args)))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				o(testWrapped(myVar, spy, "test")()).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => myVar.set(456, () => myVar.v))()).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				o(testWrapped(myVar, () => {
					myVar.set(456, () => {})
					return myVar.v
				})()).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, () => {
							throw error
						})
					} catch (e) {
						return e
					}
				})()
				o(thrown).equals(error)
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after stack overflow", () => {
				const myVar = new m.Var(123)
				const thrown = testWrapped(myVar, () => {
					try {
						myVar.set(456, overflowStack)
						return false
					} catch (_) {
						return true
					}
				})()
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
				o(testWrapped(myVar, () => myVar.set(456, spy, "test"))()).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})
	})

	o.spec(`\`${name}\` with runtime args`, () => {
		var makeEnter = () => wrap(function (f, ...args) {
			return Reflect.apply(f, this, args)
		})

		o.spec("set inside snapshot", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const enter = makeEnter()
				const myVar = new m.Var(123)
				o(enter(() => myVar.set(456, () => myVar.v))).equals(456)
			})

			o("var set restores value correctly", () => {
				const enter = makeEnter()
				const myVar = new m.Var(123)
				o(enter(() => {
					myVar.set(456, () => {})
					return myVar.v
				})).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = makeEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = enter(() => {
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
				const enter = makeEnter()
				const myVar = new m.Var(123)
				const thrown = enter(() => {
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

				const enter = makeEnter()
				const myVar = new m.Var(123)
				o(enter(() => myVar.set(456, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside empty snapshot", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const enter = makeEnter()
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = makeEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = makeEnter()
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = makeEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside non-empty snapshot without var set", () => {
			const testVar = new m.Var("")
			const testEnter = () => testVar.set("foo", () => makeEnter())

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = testEnter()
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = makeEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside non-empty snapshot with var set", () => {
			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => makeEnter())
				o(enter(spy, "test")).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => makeEnter())
				o(myVar.set(456, () => enter(spy, "test"))).equals(999)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => makeEnter())
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => makeEnter())
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = myVar.set(999, () => makeEnter())
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = myVar.set(999, () => makeEnter())
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside empty nested snapshot", () => {
			const testEnter = () => makeEnter()(() => makeEnter())

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = makeEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = testEnter()
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = testEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with other var set", () => {
			const testVar = new m.Var("")
			const testEnter = () =>
				testVar.set("foo", () => makeEnter()(() => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = testEnter()
				const myVar = new m.Var(123)
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = testEnter()
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with other var set", () => {
			const testVar = new m.Var("")
			const testEnter = () =>
				testVar.set("foo", () => makeEnter()(() => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter()
				o(enter(spy, "test")).equals(123)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				o(enter(() => myVar.set(456, () => myVar.v))).equals(456)
			})

			o("var set restores value correctly", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				o(enter(() => {
					myVar.set(456, () => {})
					return myVar.v
				})).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const enter = testEnter()
				const myVar = new m.Var(123)
				const error = new Error("test")
				const thrown = enter(() => {
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
				const enter = testEnter()
				const myVar = new m.Var(123)
				const thrown = enter(() => {
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

				const enter = testEnter()
				const myVar = new m.Var(123)
				o(enter(() => myVar.set(456, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with accessed var set", () => {
			const testEnter = (myVar) =>
				makeEnter()(() => myVar.set(555, () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = myVar.set(999, () => testEnter(myVar))
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with accessed var set", () => {
			const testEnter = (myVar) =>
				makeEnter()(() => myVar.set(555, () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter(myVar)
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, () => myVar.v))).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => {
					myVar.set(456, () => {})
					return myVar.v
				})).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				const error = new Error("test")
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")
			const testEnter = (myVar) =>
				myVar.set(555, () => testVar.set("foo", () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = myVar.set(999, () => testEnter(myVar))
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with self var then other var set", () => {
			const testVar = new m.Var("")
			const testEnter = (myVar) =>
				myVar.set(555, () => testVar.set("foo", () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter(myVar)
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, () => myVar.v))).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => {
					myVar.set(456, () => {})
					return myVar.v
				})).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				const error = new Error("test")
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set outside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")
			const testEnter = (myVar) =>
				testVar.set("foo", () => myVar.set(555, () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				myVar.set(456, () => {
					enter(() => {})
				})
				o(myVar.v).equals(123)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = myVar.set(999, () => testEnter(myVar))
				const error = new Error("test")
				const thrown = myVar.set(456, () => {
					try {
						enter(() => {
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
				const enter = myVar.set(999, () => testEnter(myVar))
				const thrown = myVar.set(456, () => {
					try {
						enter(overflowStack)
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
				const enter = myVar.set(999, () => testEnter(myVar))
				o(myVar.set(456, () => enter(spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})

		o.spec("set inside nested snapshot with other var then self var set", () => {
			const testVar = new m.Var("")
			const testEnter = (myVar) =>
				testVar.set("foo", () => myVar.set(555, () => makeEnter()))

			o("var reads initial value correctly", () => {
				const myVar = new m.Var(123)

				let calls = 0
				let receivedThis, receivedArgs

				function spy(...args) {
					calls++
					receivedThis = this
					receivedArgs = args
					return myVar.v
				}

				const enter = testEnter(myVar)
				o(enter(spy, "test")).equals(555)
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})

			o("var reads immediately set value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, () => myVar.v))).equals(456)
			})

			o("var set restores value correctly", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				o(enter(() => {
					myVar.set(456, () => {})
					return myVar.v
				})).equals(555)
			})

			o("var set restores value correctly after error", () => {
				const myVar = new m.Var(123)
				const enter = testEnter(myVar)
				const error = new Error("test")
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				const thrown = enter(() => {
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
				const enter = testEnter(myVar)
				o(enter(() => myVar.set(456, spy, "test"))).equals("foo")
				o(calls).equals(1)
				o(receivedThis).equals(undefined)
				o(receivedArgs).deepEquals(["test"])
			})
		})
	})
}

testVariants()
