import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("`m.wrap`", () => {
	o.spec("set inside snapshot", () => {
		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = m.wrap(() => myDyn(456, () => myDyn()))
			o(enter()).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const enter = m.wrap(() => {
				myDyn(456, () => {})
				return myDyn()
			})
			const myDyn = m.dyn(123)
			o(enter()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = m.wrap(() => {
				try {
					myDyn(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(enter()).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = m.wrap(() => {
				try {
					myDyn(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(enter()).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = m.wrap(() => myDyn(456, spy, "test"))
			o(enter()).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside empty snapshot", () => {
		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(myDyn(456, () => enter("test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const enter = m.wrap(() => {})
			const myDyn = m.dyn(123)
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = m.wrap(() => {
				throw error
			})
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const enter = m.wrap(overflowStack)
			const myDyn = m.dyn(123)
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = m.wrap(spy)
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot without dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (f) => testDyn("foo", () => m.wrap(f))

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(myDyn(456, () => enter("test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const enter = wrap(() => {})
			const myDyn = m.dyn(123)
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const enter = wrap(() => {
				throw error
			})
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const enter = wrap(overflowStack)
			const myDyn = m.dyn(123)
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = m.wrap(spy)
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot with dyn set", () => {
		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => m.wrap(spy))
			o(enter("test")).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => m.wrap(spy))
			o(myDyn(456, () => enter("test"))).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => m.wrap(() => {}))
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => m.wrap(() => {
				throw error
			}))
			const error = new Error("test")
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => m.wrap(overflowStack))
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => m.wrap(spy))
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside empty nested snapshot", () => {
		const wrap = (f) => m.wrap(() => m.wrap(f))()

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = m.wrap(spy)
			o(myDyn(456, () => enter("test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const enter = wrap(() => {})
			const myDyn = m.dyn(123)
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const enter = wrap(() => {
				throw error
			})
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const enter = wrap(overflowStack)
			const myDyn = m.dyn(123)
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(spy)
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with other dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (f) =>
			testDyn("foo", () => m.wrap(() => m.wrap(f))())

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(spy)
			o(myDyn(456, () => enter("test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const enter = wrap(() => {})
			const myDyn = m.dyn(123)
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = wrap(() => {
				throw error
			})
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const enter = wrap(overflowStack)
			const myDyn = m.dyn(123)
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(spy)
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with other dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (f) =>
			testDyn("foo", () => m.wrap(() => m.wrap(f))())

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(spy)
			o(enter("test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(() => myDyn(456, () => myDyn()))
			o(enter()).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(() => {
				myDyn(456, () => {})
				return myDyn()
			})
			o(enter()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = wrap(() => {
				try {
					myDyn(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(enter()).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(() => {
				try {
					myDyn(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(enter()).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(() => myDyn(456, spy, "test"))
			o(enter()).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with accessed dyn set", () => {
		const wrap = (myDyn, f) =>
			m.wrap(() => myDyn(555, () => m.wrap(f)))()

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, () => {}))
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, () => { throw error }))
			const error = new Error("test")
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, overflowStack))
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with accessed dyn set", () => {
		const wrap = (myDyn, f) =>
			m.wrap(() => myDyn(555, () => m.wrap(f)))()

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(myDyn, spy)
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, () => myDyn()))
			o(enter()).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				myDyn(456, () => {})
				return myDyn()
			})
			o(enter()).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(enter()).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(enter()).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, spy, "test"))
			o(enter()).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with self dyn then other dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (myDyn, f) =>
			myDyn(555, () => testDyn("foo", () => m.wrap(f)))

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, () => {}))
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = myDyn(999, () => wrap(myDyn, () => {
				throw error
			}))
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, overflowStack))
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with self dyn then other dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (myDyn, f) =>
			myDyn(555, () => testDyn("foo", () => m.wrap(f)))

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(myDyn, spy)
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, () => myDyn()))
			o(enter()).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				myDyn(456, () => {})
				return myDyn()
			})
			o(enter()).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(enter()).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(enter()).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, spy, "test"))
			o(enter()).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with other dyn then self dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (myDyn, f) =>
			testDyn("foo", () => myDyn(555, () => m.wrap(f)))

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, () => {}))
			myDyn(456, () => {
				enter()
			})
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = myDyn(999, () => wrap(myDyn, () => {
				throw error
			}))
			const thrown = myDyn(456, () => {
				try {
					enter()
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, overflowStack))
			const thrown = myDyn(456, () => {
				try {
					enter()
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = myDyn(999, () => wrap(myDyn, spy))
			o(myDyn(456, () => enter("test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with other dyn then self dyn set", () => {
		const testDyn = m.dyn("")
		const wrap = (myDyn, f) =>
			testDyn("foo", () => myDyn(555, () => m.wrap(f)))

		o("dyn reads initial value correctly", () => {
			const myDyn = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myDyn()
			}

			const enter = wrap(myDyn, spy)
			o(enter("test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, () => myDyn()))
			o(enter()).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				myDyn(456, () => {})
				return myDyn()
			})
			o(enter()).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myDyn = m.dyn(123)
			const error = new Error("test")
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(enter()).equals(error)
			o(myDyn()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => {
				try {
					myDyn(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(enter()).equals(true)
			o(myDyn()).equals(123)
		})

		o("dyn set calls callback exactly once with provided arguments", () => {
			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return "foo"
			}

			const myDyn = m.dyn(123)
			const enter = wrap(myDyn, () => myDyn(456, spy, "test"))
			o(enter()).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})
})
