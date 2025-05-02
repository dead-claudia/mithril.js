import {run} from "./context/dyn.js"

export var hasOwn = {}.hasOwnProperty

// Specially coded so it's just one arrow function expression and just reuses the input variables.
// It won't minify like this otherwise without making it even less readable.
//
// Only really done to reduce size.
export var invokeRedrawable = (snap, redraw, fn, thisValue, ...args) => (
	typeof fn === "function" &&
	(thisValue = snap.call(thisValue, fn, ...args)) !== "skip-redraw" &&
	(
		thisValue &&
		(
			thisValue = typeof thisValue.then === "function"
				? Promise.resolve(thisValue)
				: (
					typeof thisValue === "object" ||
					typeof thisValue === "function"
				) && typeof thisValue[Symbol.iterator] === "function"
					? snap(run, () => thisValue)
					: null
		)
			? thisValue.then((value) => value !== "skip-redraw" && redraw())
			: redraw()
	)
)

/**
 * @type {{
 *     <C>(callback: C, allowNull: false, label?: string): C & Function
 *     <C>(callback: C, allowNull: true, label?: string): C & (undefined | null | Function)
 * }}
 */
export var checkCallback = (callback, allowNull, label = "callback") => {
	if (allowNull && callback == null || typeof callback === "function") {
		return callback
	}

	throw new TypeError(`\`${label}\` must be a function${allowNull ? " if provided." : "."}`)
}

// Warnig: do *not* expose this. It's also used as a sentinel.
export var noop = () => {}
