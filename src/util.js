export var hasOwn = {}.hasOwnProperty

export var invokeRedrawable = async (redraw, fn, thisValue, ...args) => {
	if (typeof fn === "function") {
		thisValue = Reflect.apply(fn, thisValue, args)
		if (thisValue === "skip-redraw") return
		if (thisValue && typeof thisValue.then === "function" && (await thisValue) === "skip-redraw") return
		redraw()
	}
}

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
