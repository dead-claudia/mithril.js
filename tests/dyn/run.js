import o from "ospec"

import m from "../../src/entry/mithril.esm.js"

/** @param {Partial<TestOptions>} extraOpts  */
function runSpec(name, baseValue, {modifyValue = baseValue, ...extraOpts}) {
	o.spec(name, () => {
		runTest("across yield sync value", {
			checker: ["YieldChecker", 1],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 2, throw: 0},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: modifyValue,
				nextParam: 1,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			...extraOpts,
		})

		runTest("across sync next throw", {
			checker: ["YieldCheckerNextThrow", error],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 1, throw: 0},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			...extraOpts,
		})

		runTest("across yield sync-resolving thenable", {
			checker: ["YieldChecker", {then(resolve) { resolve(1) }}],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 2, throw: 0},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: modifyValue,
				nextParam: 1,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			...extraOpts,
		})

		runTest("across caught yield sync-rejecting thenable", {
			checker: ["YieldCheckerThrowCatch", {then(_, reject) { reject(error) }}],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 1, throw: 1},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: modifyValue,
				throwParam: error,
			},
			...extraOpts,
		})

		runTest("across rethrowing yield sync-rejecting thenable", {
			checker: ["YieldCheckerThrowCatchRethrow", {then(_, reject) { reject(error) }}],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 1, throw: 1},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: modifyValue,
				throwParam: error,
			},
			...extraOpts,
		})

		runTest("across yield resolving promise", {
			checker: ["YieldChecker", Promise.resolve(1)],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 2, throw: 0},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: modifyValue,
				nextParam: 1,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			...extraOpts,
		})

		runTest("across caught yield rejecting promise", {
			checker: ["YieldCheckerThrowCatch", Promise.reject(error)],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 1, throw: 1},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: modifyValue,
				throwParam: error,
			},
			...extraOpts,
		})

		runTest("across rethrowing yield rejecting promise", {
			checker: ["YieldCheckerThrowCatchRethrow", Promise.reject(error)],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: undefined,
				throwParam: undefined,
			},
			afterCalls: {next: 1, throw: 1},
			afterValues: {
				init: baseValue,
				next: modifyValue,
				return: undefined,
				nextParam: undefined,
				throw: undefined,
				catch: modifyValue,
				throwParam: error,
			},
			...extraOpts,
		})
	})
}

/**
 * @param {string} name
 * @param {object} options
 * @param {number} options.baseValue
 * @param {(checker: YieldChecker, f?: () => void)} options.run
 */
function runSpecFamily(name, {
	baseValue,
	run,
}) {
	o.spec(name, () => {
		runSpec("dyn reads initial value correctly", baseValue, {
			run: (checker) => run(checker),
		})

		runSpec("dyn reads immediately set value correctly", baseValue, {
			run: (checker, state) => run(checker, () => {
				checker.dyn(456, () => {
					state.setValue = checker.dyn()
				})
			}),
			beforeCheck(state) {
				o(state.setValue).equals(456)
			},
		})

		runSpec("dyn set restores value correctly", baseValue, {
			run(checker, state) {
				state.setError = new Error("set test")
				return run(checker, () => {
					try {
						checker.dyn(456, () => {
							throw state.setError
						})
					} catch (e) {
						state.thrown = e
					}
				})
			},
			beforeCheck(state) {
				o(state.thrown).equals(state.setError)
			},
		})

		runSpec("dyn set before yield calls callback exactly once with provided arguments", baseValue, {
			run(checker, state) {
				function setSpy(...args) {
					state.spyCalls++
					state.spyThis = this
					state.spyArgs = args
				}
				state.spyCalls = 0
				state.spyThis = undefined
				state.spyArgs = undefined
				return run(checker, () => {
					checker.dyn.call("this value", 456, setSpy, "test")
				})
			},
			beforeCheck(state) {
				o(state.spyCalls).equals(1)
				o(state.spyThis).equals("this value")
				o(state.spyArgs).deepEquals(["test"])
			},
			afterCheck(state) {
				o(state.spyCalls).equals(1)
			},
		})

		runSpec("dyn set after yield calls callback exactly once with provided arguments", baseValue, {
			afterYieldSpy(state) {
				function setSpy(...args) {
					state.spyCalls++
					state.spyThis = this
					state.spyArgs = args
				}
				state.spyCalls = 0
				state.spyThis = undefined
				state.spyArgs = undefined
				return (checker) => {
					checker.dyn.call("this value", 456, setSpy, "test")
				}
			},
			run: (checker) => run(checker),
			beforeCheck(state) {
				o(state.spyCalls).equals(0)
			},
			afterCheck(state) {
				if (this.expectError && this.afterCalls.throw === 0) {
					o(state.spyCalls).equals(0)
				} else {
					o(state.spyCalls).equals(1)
					o(state.spyThis).equals("this value")
					o(state.spyArgs).deepEquals(["test"])
				}
			},
		})
	})
}

function runSuite() {
	runSpecFamily("dyn set inside empty snapshot", {
		baseValue: 123,
		run: (checker, f) => m.run(checker.spy(f), "test"),
	})

	runSpecFamily("dyn set outside empty snapshot", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = m.snap()
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside empty nested snapshot", {
		baseValue: 456,
		run: (checker, f) => m.snap()(() => checker.dyn(456, () => m.run(checker.spy(f), "test"))),
	})

	runSpecFamily("dyn set outside empty nested snapshot", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = m.snap()(() => m.snap())
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside empty censored snapshot", {
		baseValue: 456,
		run: (checker, f) => checker.dyn(999, () => m.snap(() => {}))(() => checker.dyn(456, () => m.run(checker.spy(f), "test"))),
	})

	runSpecFamily("dyn set outside empty censored snapshot", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => m.snap(() => {}))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside snapshot, other dyn set", {
		baseValue: 123,
		run: (checker, f) => testDyn("foo", () => m.run(checker.spy(f), "test")),
	})

	runSpecFamily("dyn set outside snapshot, other dyn set", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => m.snap())
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside censored snapshot allowing other, other dyn set", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => m.snap(() => testDyn()))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside nested snapshot, other dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => m.snap()(() => m.snap()))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside nested snapshot, other dyn set", {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => m.snap()(() => m.snap()))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside snapshot, accessed dyn set", {
		baseValue: 999,
		run: (checker, f) => checker.dyn(999, () => m.run(checker.spy(f), "test")),
	})

	runSpecFamily("dyn set outside snapshot, accessed dyn set", {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => m.snap())
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside censored snapshot allowing accessed, accessed dyn set", {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => m.snap(() => checker.dyn()))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside nested snapshot, accessed dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => m.snap()(() => m.snap()))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside nested snapshot, accessed dyn set", {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => m.snap()(() => m.snap()))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside snapshot, other then accessed dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => checker.dyn(999, () => checker.dyn(555, () => m.snap())))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside snapshot, other then accessed dyn set", {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = testDyn("foo", () => checker.dyn(999, () => checker.dyn(555, () => m.snap())))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside nested snapshot, other then accessed dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => checker.dyn(555, () => testDyn("foo", () => m.snap())))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside nested snapshot, other then accessed dyn set", {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => checker.dyn(555, () => testDyn("foo", () => m.snap())))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside snapshot, accessed then other dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => testDyn("foo", () => checker.dyn(555, () => m.snap())))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside snapshot, accessed then other dyn set", {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => testDyn("foo", () => checker.dyn(555, () => m.snap())))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set inside nested snapshot, accessed then other dyn set", {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => testDyn("foo", () => checker.dyn(555, () => m.snap())))
			return snapshot(() => checker.dyn(456, () => m.run(checker.spy(f), "test")))
		},
	})

	runSpecFamily("dyn set outside nested snapshot, accessed then other dyn set", {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.dyn(999, () => testDyn("foo", () => checker.dyn(555, () => m.snap())))
			return checker.dyn(456, () => snapshot(() => m.run(checker.spy(f), "test")))
		},
	})
}

/* * * * * * * * * * * * * * * * * * * * *\
 * And all the support stuff lies here.  *
\* * * * * * * * * * * * * * * * * * * * */

// Abstract away all the state. It's the same across everything and I want to track
// everything at a low level.
class YieldChecker {
	constructor(yieldResult, afterYield) {
		this.afterYield = afterYield
		this.result = {done: false, value: yieldResult}
		this.dyn = m.dyn(123)
		this.calls = {
			init: 0,
			next: 0,
			throw: 0,
		}
		this.init = {
			this: /** @type {any} */ (undefined),
			args: /** @type {undefined | any[]} */ (undefined),
		}
		this.values = {
			init: /** @type {any} */ (undefined),
			next: /** @type {any} */ (undefined),
			return: /** @type {any} */ (undefined),
			nextParam: /** @type {any} */ (undefined),
			throw: /** @type {any} */ (undefined),
			catch: /** @type {any} */ (undefined),
			throwParam: /** @type {any} */ (undefined),
		}
		// To make mistakes easier to trace.
		Object.freeze(this)
	}

	[Symbol.iterator]() {
		return this
	}

	_resume() {
		const afterYield = this.afterYield
		const {done, value} = this.result
		this.result.done = true
		this.result.value = "result"
		if (typeof afterYield === "function" && done) {
			afterYield(this)
		}
		return {done, value}
	}

	next(value) {
		this.calls.next++
		if (this.result.done) {
			this.values.nextParam = value
			this.values.return = this.dyn()
		} else {
			this.values.next = this.dyn()
		}
		return this._resume()
	}

	spy(f) {
		const self = this
		return function (...args) {
			self.calls.init++
			self.init.this = this
			self.init.args = args
			self.values.init = self.dyn()
			if (typeof f === "function") f()
			return self
		}
	}
}

class YieldCheckerNextThrow extends YieldChecker {
	next(value) {
		const result = super.next(value)
		if (!result.done) throw result.value
		return result
	}
}

class YieldCheckerThrowCatch extends YieldChecker {
	throw(value) {
		this.calls.throw++
		if (this.result.done) {
			this.values.throwParam = value
			this.values.catch = this.dyn()
		} else {
			this.values.throw = this.dyn()
		}
		return this._resume()
	}
}

class YieldCheckerThrowCatchRethrow extends YieldCheckerThrowCatch {
	throw(value) {
		super.throw(value)
		throw value
	}
}

const Checkers = {
	YieldChecker,
	YieldCheckerNextThrow,
	YieldCheckerThrowCatch,
	YieldCheckerThrowCatchRethrow,
}

const testDyn = m.dyn("")
const error = new Error("test")

/** @typedef {Omit<YieldChecker["calls"], "init">} TestCalls */
/** @typedef {Partial<YieldChecker["values"]>} TestValues */

/**
 * @typedef TestOptions
 * @property {(state: any) => (checker: YieldChecker) => void} [afterYieldSpy]
 * @property {[keyof typeof Checkers, any]} checker
 * @property {(checker: YieldChecker, state: any) => any} run
 * @property {boolean} [expectError]
 * @property {TestCalls} beforeCalls
 * @property {TestValues} beforeValues
 * @property {(state: any) => void} [beforeCheck]
 * @property {TestCalls} afterCalls
 * @property {TestValues} afterValues
 * @property {(state: any) => void} [afterCheck]
 */

// This will get executed hundreds of times. Factoring this out and making all tests call the same
// function will speed up the tests somewhat.
/** @param {TestOptions} opts */
async function executeTest(opts) {
	const state = {__proto__: null}
	const afterYield = opts.afterYieldSpy ? opts.afterYieldSpy(state) : undefined
	const [checkerName, yieldResult] = opts.checker
	const checker = new Checkers[checkerName](yieldResult, afterYield)
	const promise = opts.run(checker, state)
	o(checker.calls.init).equals(1)("before checker.calls.init")
	o(checker.calls.next).equals(opts.beforeCalls.next)("before checker.calls.next")
	o(checker.calls.throw).equals(opts.beforeCalls.throw)("before checker.calls.throw")
	o(checker.init.this).equals(undefined)("before checker.init.this")
	o(checker.init.args).deepEquals(["test"])("before checker.init.args")
	o(checker.values.init).equals(opts.beforeValues.init)("before checker.values.init")
	o(checker.values.next).equals(opts.beforeValues.next)("before checker.values.next")
	o(checker.values.return).equals(opts.beforeValues.return)("before checker.values.return")
	o(checker.values.nextParam).equals(opts.beforeValues.nextParam)("before checker.values.nextParam")
	o(checker.values.throw).equals(opts.beforeValues.throw)("before checker.values.throw")
	o(checker.values.catch).equals(opts.beforeValues.catch)("before checker.values.catch")
	o(checker.values.throwParam).equals(opts.beforeValues.throwParam)("before checker.values.throwParam")
	o(checker.dyn()).equals(123)("before checker.dyn()")
	o(testDyn()).equals("")("before testVar()")
	if (opts.beforeCheck) {
		opts.beforeCheck(state)
	}
	if (opts.expectError) {
		let thrown
		try {
			await promise
		} catch (e) {
			thrown = e
		}
		o(thrown).equals(error)
	} else {
		o(await promise).equals("result")
	}
	o(checker.calls.init).equals(1)("after checker.calls.init")
	o(checker.calls.next).equals(opts.afterCalls.next)("after checker.calls.next")
	o(checker.calls.throw).equals(opts.afterCalls.throw)("after checker.calls.throw")
	o(checker.values.init).equals(opts.afterValues.init)("after checker.values.init")
	o(checker.values.next).equals(opts.afterValues.next)("after checker.values.next")
	o(checker.values.return).equals(opts.afterValues.return)("after checker.values.return")
	o(checker.values.nextParam).equals(opts.afterValues.nextParam)("after checker.values.nextParam")
	o(checker.values.throw).equals(opts.afterValues.throw)("after checker.values.throw")
	o(checker.values.catch).equals(opts.afterValues.catch)("after checker.values.catch")
	o(checker.values.throwParam).equals(opts.afterValues.throwParam)("after checker.values.throwParam")
	o(checker.dyn()).equals(123)("after checker.dyn()")
	o(testDyn()).equals("")("after testVar()")
	if (opts.afterCheck) {
		opts.afterCheck(state)
	}
}

/** @param {string} name @param {TestOptions} opts */
function runTest(name, opts) {
	if (opts.checker[1] instanceof Promise) {
		// Silence any "unhandled" warnings that might arise from immediate promises
		opts.checker[1].catch(() => {})
	}
	o(name, () => executeTest(opts))
}

o.spec("`m.run`", runSuite)
