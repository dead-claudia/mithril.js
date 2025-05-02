/*
Context is very specially structured for performance and low overhead.

## Use of arrays for the context key/value tables

Arrays are used to ensure easy and fast access. Context variables are rarely more than a few in
number, and it's faster to perform iterative lookups in small arrays than to perform hash table
lookups with same-size hash tables. (Currently, engines use hash tables for all sizes, so this
optimization is very useful to explicitly add.)

Arrays are also extremely fast to copy, and `array.slice()` is explicitly fast-pathed in many
engines. (In particular, V8 uses libc's `memcpy`, which may use accelerated instructions like x86's
`rep movsb`.) There's no hashing, so storage is basically zero overhead.

## Index caching

An inline cache is used for the map index to avoid a full lookup. It's just two loads and a pointer
compare, which is way faster than for a map. Cross-snapshot accesses are rare, so it's okay to not
optimize.

> To boost performance of this cache, it's kept consistently up to date on set, so if you always
> follow the same get and set sequence for every snapshot, you'll always get cache hits.
*/

import {checkCallback} from "../util.js"

// Just needs to be higher than `currentSnapshotId`.
var resourceId = 2
// 1 = root, 0 = no snapshot
var currentSnapshotId = 1
var currentTable = []
var snapshotMap

/**
 * @template V, I
 * @typedef {{
 *     (): V
 *     (value: I): void
 *     <T, A extends any[], R>(this: T, value: I, f: (this: T, ...args: A) => R, ...args: A): R
 * }} Dyn
 */

/**
 * @typedef {(
 *     <T, A extends any[], R>(this: T, f: (this: T, ...args: A) => R, ...args: A) => R
 * )} Snapshot
 */

// At least bring some monomorphism into this, so it can be properly optimized.
/** @template T, I */
class DynS {
	/**
	 * @param {T} init
	 * @param {undefined | ((value: I) => T)} cast
	 */
	constructor(init, cast) {
		this.k = resourceId++
		this.i = -1
		this.s = 0
		this.d = 0
		this.v = init
		this.c = cast
	}

	a(tv, value, f, ...args) {
		var {k, i, c} = this
		var len = currentTable.length
		var map = snapshotMap

		if (arguments.length > 1) {
			if (arguments.length < 3) {
				if (this.d) {
					throw new TypeError("Default can only be modified while the variable is not in use.")
				}
				this.v = typeof c === "function" ? c(value) : value
				return
			}

			checkCallback(f, false, "f")

			currentTable.push(k, typeof c === "function" ? c(value) : value)
			this.d++
			// Optimize for this, so it doesn't have to look it up so far inside the block.
			this.i = len

			try {
				snapshotMap = undefined
				return Reflect.apply(f, tv, args)
			} finally {
				snapshotMap = map
				currentTable.length = len
				this.i = i
				this.d--
			}
		}

		found:
		if (this.s !== currentSnapshotId || i >= len || currentTable[i] !== k) {
			this.s = currentSnapshotId
			i = len
			while (i) if (currentTable[i -= 2] === k) break found
			this.i = i = -1
			return this.v
		} else if (i < 0) {
			return this.v
		}

		value = currentTable[i + 1]
		this.i = i
		if (map != null) map.set(k, value)
		return value
	}
}

/**
 * @template V, I
 * @param {V} init
 * @param {(value: I) => V} [cast] Can be used for both type casting and type checking
 * @returns {Dyn<V, I>}
 */
var dyn = (init, cast) => {
	var state = new DynS(init, cast)
	return function() {
		return state.a(this, ...arguments)
	}
}

/**
 * @param {() => void} [keyTracker]
 * @returns {Snapshot}
 */
var snap = (keyTracker) => {
	// This property is used both for easier debugging and for lookups.
	var id = resourceId++
	var prev = snapshotMap
	var table

	if (typeof keyTracker === "function") {
		// It's not the common case. It's okay to be slow. If speed becomes a problem, it can
		// be addressed then.
		snapshotMap = new Map()
		try {
			keyTracker()
			table = [].concat(...snapshotMap)
		} finally {
			snapshotMap = prev
		}
	} else {
		// The V8 fast path for `.slice()` requires the prototype to be the original array
		// prototype. I'd rather the class subtype `Array` for memory reasons, but that just
		// isn't feasible.
		table = currentTable.slice()
	}

	return function(f, ...args) {
		checkCallback(f, false, "f")

		var prevSnapshotId = currentSnapshotId
		var prevTable = currentTable

		currentSnapshotId = id
		currentTable = table

		try {
			return Reflect.apply(f, this, args)
		} finally {
			currentSnapshotId = prevSnapshotId
			currentTable = prevTable
		}
	}
}

/**
 * @template {any[]} A
 * @template R
 * @param {Snapshot} saved
 * @param {(...args: A) => Iterable<any, R, any>} f
 * @param {A} args
 * @returns {Promise<Awaited<R>>}
 */
var run = async (f, ...args) => {
	var result = checkCallback(f, false, "f")(...args)
	var iter = checkCallback(result[Symbol.iterator], false, "iter[Symbol.iterator]").call(result)
	var iterNext = checkCallback(iter.next, false, "iter.next")
	var iterThrow = checkCallback(iter.throw, true, "iter.throw")
	// Creates a snapshot without actually allocating a snapshot function. Speeds this along a bit,
	// very useful for extra-spammy events
	var snapshot = snap()
	var iterAdvance = iterNext
	var value

	while (!({value} = snapshot.call(iter, iterAdvance, value)).done) {
		try {
			value = await value
			iterAdvance = iterNext
		} catch (e) {
			if ((iterAdvance = iterThrow) == null) throw e
			value = e
		}
	}

	return value
}

/**
 * The idea is you'd use it like `m.with(dyn1, value1, dyn2, value2, f, ...args)`
 * @template R
 * @template {any[]} A
 * @param {(...args: A) => R} f
 * @param {A} args
 */
var with_ = (f, ...args) => f(...args)

/**
 * @template T, R
 * @template {any[]} A
 * @param {(this: T, ...args: A) => R} f
 * @returns {(this: T, ...args: A) => R}
 */
var wrap = (f) => {
	var s = snap()
	return function(...args) {
		return s.call(this, f, ...args)
	}
}

export {dyn, snap, run, with_, wrap}
