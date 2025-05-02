import m from "../core.js"

import {checkCallback, invokeRedrawable} from "../util.js"

function Init({f}, old) {
	if (old) return m.retain()
	var ctrl = new AbortController()
	var s = m.snap()
	queueMicrotask(() => invokeRedrawable(s, this.redraw, f, undefined, ctrl.signal))
	return m.remove(() => ctrl.abort())
}

var init = (f) => m(Init, {f: checkCallback(f)})

export {init as default}
