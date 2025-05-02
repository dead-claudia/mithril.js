import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

// This is not quite exhaustive. It could still be improved.

// Easy way to force a stack overflow.
const overflowStack = () => overflowStack() + 1

o.spec("snapshot enter", () => {
	o.spec("set inside snapshot", () => {
		o("dyn reads initial value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			o(snapshot(() => myVar(456, () => myVar()))).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			o(snapshot(() => {
				myVar(456, () => {})
				return myVar()
			})).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = snapshot(() => {
				try {
					myVar(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			const thrown = snapshot(() => {
				try {
					myVar(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = m.snap()
			const myVar = m.dyn(123)
			o(snapshot(() => myVar(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside empty snapshot", () => {
		o("dyn reads initial value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = m.snap()
			const myVar = m.dyn(123)
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = m.snap()
			const myVar = m.dyn(123)
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot without dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = testVar("foo", () => m.snap())
			const myVar = m.dyn(123)
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside non-empty snapshot with dyn set", () => {
		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(999)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap())
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside empty nested snapshot", () => {
		o("dyn reads initial value correctly", () => {
			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = m.snap()(() => m.snap())
			const myVar = m.dyn(123)
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with other dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with other dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(123)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			o(snapshot(() => myVar(456, () => myVar()))).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			o(snapshot(() => {
				myVar(456, () => {})
				return myVar()
			})).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			const error = new Error("test")
			const thrown = snapshot(() => {
				try {
					myVar(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			const thrown = snapshot(() => {
				try {
					myVar(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const snapshot = testVar("foo", () => m.snap()(() => m.snap()))
			const myVar = m.dyn(123)
			o(snapshot(() => myVar(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with accessed dyn set", () => {
		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => m.snap()(() => myVar(555, () => m.snap())))
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with accessed dyn set", () => {
		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))
			o(snapshot(() => myVar(456, () => myVar()))).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))
			o(snapshot(() => {
				myVar(456, () => {})
				return myVar()
			})).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))
			const error = new Error("test")
			const thrown = snapshot(() => {
				try {
					myVar(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))
			const thrown = snapshot(() => {
				try {
					myVar(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = m.snap()(() => myVar(555, () => m.snap()))
			o(snapshot(() => myVar(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with self dyn then other dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => myVar(555, () => testVar("foo", () => m.snap())))
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with self dyn then other dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))
			o(snapshot(() => myVar(456, () => myVar()))).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))
			o(snapshot(() => {
				myVar(456, () => {})
				return myVar()
			})).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))
			const error = new Error("test")
			const thrown = snapshot(() => {
				try {
					myVar(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))
			const thrown = snapshot(() => {
				try {
					myVar(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = myVar(555, () => testVar("foo", () => m.snap()))
			o(snapshot(() => myVar(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set outside nested snapshot with other dyn then self dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(myVar(456, () => snapshot(spy, "test"))).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))
			myVar(456, () => {
				snapshot(() => {})
			})
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))
			const error = new Error("test")
			const thrown = myVar(456, () => {
				try {
					snapshot(() => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))
			const thrown = myVar(456, () => {
				try {
					snapshot(overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = myVar(999, () => testVar("foo", () => myVar(555, () => m.snap())))
			o(myVar(456, () => snapshot(spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})

	o.spec("set inside nested snapshot with other dyn then self dyn set", () => {
		const testVar = m.dyn("")

		o("dyn reads initial value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))

			let calls = 0
			let receivedThis, receivedArgs

			function spy(...args) {
				calls++
				receivedThis = this
				receivedArgs = args
				return myVar()
			}

			o(snapshot(spy, "test")).equals(555)
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})

		o("dyn reads immediately set value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))
			o(snapshot(() => myVar(456, () => myVar()))).equals(456)
		})

		o("dyn set restores value correctly", () => {
			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))
			o(snapshot(() => {
				myVar(456, () => {})
				return myVar()
			})).equals(555)
		})

		o("dyn set restores value correctly after error", () => {
			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))
			const error = new Error("test")
			const thrown = snapshot(() => {
				try {
					myVar(456, () => {
						throw error
					})
				} catch (e) {
					return e
				}
			})
			o(thrown).equals(error)
			o(myVar()).equals(123)
		})

		o("dyn set restores value correctly after stack overflow", () => {
			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))
			const thrown = snapshot(() => {
				try {
					myVar(456, overflowStack)
					return false
				} catch (_) {
					return true
				}
			})
			o(thrown).equals(true)
			o(myVar()).equals(123)
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

			const myVar = m.dyn(123)
			const snapshot = testVar("foo", () => myVar(555, () => m.snap()))
			o(snapshot(() => myVar(456, spy, "test"))).equals("foo")
			o(calls).equals(1)
			o(receivedThis).equals(undefined)
			o(receivedArgs).deepEquals(["test"])
		})
	})
})
