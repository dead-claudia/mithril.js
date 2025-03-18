import o from "ospec"

import m from "../../../src/entry/mithril.esm.js"

function testVariants() {
	testVariant("m.run", m.run)
	testVariant("snapshot.run", (f, ...args) => new m.Snapshot().run(f, ...args))
}

/** @param {Partial<TestOptions>} extraOpts  */
function runSpec(name, baseValue, {modifyValue = baseValue, ...extraOpts}) {
	o.spec(name, () => {
		runTest("across yield sync value", {
			checker: ["YieldChecker", 1],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 2, throw: 0},
			afterValues: {next: modifyValue, nextParam: 1},
			...extraOpts,
		})

		runTest("across sync next throw", {
			checker: ["YieldCheckerNextThrow", error],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 1, throw: 0},
			...extraOpts,
		})

		runTest("across yield sync-resolving thenable", {
			checker: ["YieldChecker", {then(resolve) { resolve(1) }}],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 2, throw: 0},
			afterValues: {next: modifyValue, nextParam: 1},
			...extraOpts,
		})

		runTest("across caught yield sync-rejecting thenable", {
			checker: ["YieldCheckerThrowCatch", {then(_, reject) { reject(error) }}],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 1, throw: 1},
			afterValues: {throw: modifyValue, throwParam: error},
			...extraOpts,
		})

		runTest("across rethrowing yield sync-rejecting thenable", {
			checker: ["YieldCheckerThrowCatchRethrow", {then(_, reject) { reject(error) }}],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 1, throw: 1},
			afterValues: {throw: modifyValue, throwParam: error},
			...extraOpts,
		})

		runTest("across yield resolving promise", {
			checker: ["YieldChecker", Promise.resolve(1)],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 2, throw: 0},
			afterValues: {next: modifyValue, nextParam: 1},
			...extraOpts,
		})

		runTest("across caught yield rejecting promise", {
			checker: ["YieldCheckerThrowCatch", Promise.reject(error)],
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 1, throw: 1},
			afterValues: {throw: modifyValue, throwParam: error},
			...extraOpts,
		})

		runTest("across rethrowing yield rejecting promise", {
			checker: ["YieldCheckerThrowCatchRethrow", Promise.reject(error)],
			expectError: true,
			beforeCalls: {next: 1, throw: 0},
			beforeValues: {init: baseValue, next: modifyValue, nextParam: undefined},
			afterCalls: {next: 1, throw: 1},
			afterValues: {throw: modifyValue, throwParam: error},
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
		runSpec("var reads initial value correctly", baseValue, {
			run,
		})

		runSpec("var reads immediately set value correctly", baseValue, {
			run: (checker, state) => run(checker, () => {
				checker.var.set(456, () => {
					state.setValue = checker.var.v
				})
			}),
			beforeCheck(state) {
				o(state.setValue).equals(456)
			},
		})

		runSpec("var reads immediately assigned value correctly", baseValue, {
			modifyValue: 456,
			run: (checker, state) => run(checker, () => {
				checker.var.v = 456
				state.setValue = checker.var.v
			}),
			beforeCheck(state) {
				o(state.setValue).equals(456)
			},
		})

		runSpec("var set restores value correctly", baseValue, {
			run(checker, state) {
				state.setError = new Error("set test")
				return run(checker, () => {
					try {
						checker.var.set(456, () => {
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

		runSpec("var assign restores value correctly", baseValue, {
			modifyValue: 456,
			run(checker, state) {
				state.setError = new Error("set test")
				return run(checker, () => {
					try {
						checker.var.v = 456
						throw state.setError
					} catch (e) {
						state.thrown = e
					}
				})
			},
			beforeCheck(state) {
				o(state.thrown).equals(state.setError)
			},
		})

		runSpec("`contextVar.set(...)` before yield calls callback exactly once with provided arguments", baseValue, {
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
					checker.var.set(456, setSpy, "test")
				})
			},
			beforeCheck(state) {
				o(state.spyCalls).equals(1)
				o(state.spyThis).equals(undefined)
				o(state.spyArgs).deepEquals(["test"])
			},
			afterCheck(state) {
				o(state.spyCalls).equals(1)
			},
		})

		runSpec("`contextVar.set(...)` after yield calls callback exactly once with provided arguments", baseValue, {
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
					checker.var.set(456, setSpy, "test")
				}
			},
			run,
			beforeCheck(state) {
				o(state.spyCalls).equals(0)
			},
			afterCheck(state) {
				if (this.expectError && this.afterCalls.throw === 0) {
					o(state.spyCalls).equals(0)
				} else {
					o(state.spyCalls).equals(1)
					o(state.spyThis).equals(undefined)
					o(state.spyArgs).deepEquals(["test"])
				}
			},
		})
	})
}

function testVariant(runFnName, runFn) {
	const allowDirect = runFnName === "snapshot.run"
	const ind = allowDirect ? ", indirect" : ""

	runSpecFamily(`\`${runFnName}\` (var set inside empty snapshot)`, {
		baseValue: 123,
		run: (checker, f) => runFn(checker.spy(f), "test"),
	})

	runSpecFamily(`\`${runFnName}\` (var set outside empty snapshot${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = new m.Snapshot()
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside empty snapshot, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = new m.Snapshot()
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside empty nested snapshot)`, {
		baseValue: 456,
		run: (checker, f) => new m.Snapshot().enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test"))),
	})

	runSpecFamily(`\`${runFnName}\` (var set outside empty nested snapshot${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside empty nested snapshot, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = new m.Snapshot().enter(() => new m.Snapshot())
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside empty censored snapshot)`, {
		baseValue: 456,
		run: (checker, f) => checker.var.set(999, () => new m.Snapshot([])).enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test"))),
	})

	runSpecFamily(`\`${runFnName}\` (var set outside empty censored snapshot${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => new m.Snapshot([]))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside empty censored snapshot, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => new m.Snapshot([]))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside snapshot, other var set)`, {
		baseValue: 123,
		run: (checker, f) => testVar.set("foo", () => runFn(checker.spy(f), "test")),
	})

	runSpecFamily(`\`${runFnName}\` (var set outside snapshot, other var set${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => new m.Snapshot())
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside snapshot, other var set, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = testVar.set("foo", () => new m.Snapshot())
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set outside censored snapshot allowing other, other var set${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => new m.Snapshot([testVar]))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside censored snapshot allowing other, other var set, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = testVar.set("foo", () => new m.Snapshot([testVar]))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside nested snapshot, other var set)`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, other var set${ind})`, {
		baseValue: 123,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, other var set, direct)`, {
			baseValue: 123,
			run: (checker, f) => {
				const snapshot = testVar.set("foo", () => new m.Snapshot().enter(() => new m.Snapshot()))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside snapshot, accessed var set)`, {
		baseValue: 999,
		run: (checker, f) => checker.var.set(999, () => runFn(checker.spy(f), "test")),
	})

	runSpecFamily(`\`${runFnName}\` (var set outside snapshot, accessed var set${ind})`, {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => new m.Snapshot())
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside snapshot, accessed var set, direct)`, {
			baseValue: 999,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => new m.Snapshot())
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set outside censored snapshot allowing accessed, accessed var set${ind})`, {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => new m.Snapshot([checker.var]))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside censored snapshot allowing accessed, accessed var set, direct)`, {
			baseValue: 999,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => new m.Snapshot([checker.var]))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside nested snapshot, accessed var set)`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => new m.Snapshot().enter(() => new m.Snapshot()))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, accessed var set${ind})`, {
		baseValue: 999,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => new m.Snapshot().enter(() => new m.Snapshot()))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, accessed var set, direct)`, {
			baseValue: 999,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => new m.Snapshot().enter(() => new m.Snapshot()))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside snapshot, other then accessed var set${ind})`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => checker.var.set(999, () => checker.var.set(555, () => new m.Snapshot())))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside snapshot, other then accessed var set${ind})`, {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = testVar.set("foo", () => checker.var.set(999, () => checker.var.set(555, () => new m.Snapshot())))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside snapshot, other then accessed var set, direct)`, {
			baseValue: 555,
			run: (checker, f) => {
				const snapshot = testVar.set("foo", () => checker.var.set(999, () => checker.var.set(555, () => new m.Snapshot())))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside nested snapshot, other then accessed var set${ind})`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => checker.var.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, other then accessed var set${ind})`, {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => checker.var.set(555, () => testVar.set("foo", () => new m.Snapshot())))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, other then accessed var set, direct)`, {
			baseValue: 555,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => checker.var.set(555, () => testVar.set("foo", () => new m.Snapshot())))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside snapshot, accessed then other var set${ind})`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside snapshot, accessed then other var set${ind})`, {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside snapshot, accessed then other var set, direct)`, {
			baseValue: 555,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}

	runSpecFamily(`\`${runFnName}\` (var set inside nested snapshot, accessed then other var set${ind})`, {
		baseValue: 456,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
			return snapshot.enter(() => checker.var.set(456, () => runFn(checker.spy(f), "test")))
		},
	})

	runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, accessed then other var set${ind})`, {
		baseValue: 555,
		run: (checker, f) => {
			const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
			return checker.var.set(456, () => snapshot.enter(() => runFn(checker.spy(f), "test")))
		},
	})

	if (allowDirect) {
		runSpecFamily(`\`${runFnName}\` (var set outside nested snapshot, accessed then other var set, direct)`, {
			baseValue: 555,
			run: (checker, f) => {
				const snapshot = checker.var.set(999, () => testVar.set("foo", () => checker.var.set(555, () => new m.Snapshot())))
				return checker.var.set(456, () => snapshot.run(checker.spy(f), "test"))
			},
		})
	}
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
		this.var = new m.Var(123)
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
			nextParam: /** @type {any} */ (undefined),
			throw: /** @type {any} */ (undefined),
			throwParam: /** @type {any} */ (undefined),
		}
		// To make mistakes like `context.var = foo` instead of `context.var.v = foo` easier to
		// trace.
		Object.freeze(this)
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
		this.values.next = this.var.v
		this.values.nextParam = value
		return this._resume()
	}

	spy(f) {
		const self = this
		return function (...args) {
			self.calls.init++
			self.init.this = this
			self.init.args = args
			self.values.init = self.var.v
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
		this.values.throw = this.var.v
		this.values.throwParam = value
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

const testVar = new m.Var("")
const error = new Error("test")

/** @typedef {Omit<YieldChecker["calls"], "init">} TestCalls */
/** @typedef {Partial<YieldChecker["values"]>} TestValues */

/**
 * @typedef TestOptions
 * @property {(state: any) => (checker: YieldChecker) => void} [afterYieldSpy]
 * @property {[keyof typeof Checkers, any]} checker
 * @property {(checker: YieldChecker, state: any) => any} run
 * @property {number} [initValue]
 * @property {boolean} [expectError]
 * @property {TestCalls} beforeCalls
 * @property {TestValues} [beforeValues]
 * @property {(state: any) => void} [beforeCheck]
 * @property {TestCalls} afterCalls
 * @property {TestValues} [afterValues]
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
	o(checker.init.this).equals(undefined)("before checker.init.this")
	o(checker.init.args).deepEquals(["test"])("before checker.init.args")
	if ("initValue" in opts) o(checker.values.init).equals(opts.initValue)("before checker.values.init")
	o(testVar.v).equals("")("before testVar.v")
	for (const key of Object.keys(opts.beforeCalls)) {
		o(checker.calls[key]).equals(opts.beforeCalls[key])(`before checker.calls.${key}`)
	}
	for (const key of Object.keys(opts.beforeValues || {})) {
		o(checker.values[key]).equals(opts.beforeValues[key])(`before checker.values.${key}`)
	}
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
	o(checker.var.v).equals(123)("after checker.var.v")
	o(testVar.v).equals("")("after testVar.v")
	for (const key of Object.keys(opts.afterCalls)) {
		o(checker.calls[key]).equals(opts.afterCalls[key])(`after checker.calls.${key}`)
	}
	for (const key of Object.keys(opts.afterValues || {})) {
		o(checker.values[key]).equals(opts.afterValues[key])(`after checker.values.${key}`)
	}
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

testVariants()
