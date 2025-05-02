// Load order is important for the imports.

/* global globalThis, window, global */

import o from "ospec"

import m from "../src/entry/mithril.esm.js"

import {clearPending} from "./callAsync.js"
import {createLocationProxy} from "./navigation.js"
import throttleMocker from "./throttleMock.js"

const G = (
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined" ? window : global
)

const originalWindow = G.window || G.jsdomWindow
const originalDocument = G.document || G.jsdomDocument
const originalConsoleError = console.error

if (originalWindow === undefined || originalDocument === undefined) {
	throw new TypeError("DOM globals must be present and pre-loaded")
}

let prevWindow = originalWindow
let prevDocument = originalDocument
let prevConsoleError = originalConsoleError

/**
 * @typedef SetupState
 * @property {Set<any>} registeredRoots
 * @property {HTMLIFrameElement} iframe
 * @property {Window & typeof globalThis} hackWindow
 * @property {ReturnType<import("./throttleMock.js")["default"]>} rafMock
 */

/** @returns {SetupState} */
function doInit(env) {
	const iframe = originalDocument.createElement("iframe")
	iframe.srcdoc = "<!doctype html>"
	// Have to append it live so that the window gets initialized. It gets removed at the end of
	// the test, after unmounting (so it correctly gets removed).
	originalDocument.body.appendChild(iframe)

	const $window = iframe.contentWindow

	// Suggests a failure to immediately initialize the iframe.
	if (!$window) {
		// Remove so it doesn't leak. I don't want to go through this song and dance *that* many
		// times.
		iframe.remove()
		throw new Error("Could not construct window (likely browser bug)")
	}

	// There's at the time of writing a bug in JSDOM where windows for blank, synchronously
	// detached iframes return `undefined` for `window.document`. This is not the case in Chrome,
	// but this unblocks use of JSDOM in tests so I'm not going through the complexity of wiring
	// everything up in Puppeteer just for correct behavior.
	if (!$window.document) {
		// Remove so it doesn't leak. I don't want to go through this song and dance *that* many
		// times.
		iframe.remove()
		throw new Error("Could not construct document (likely browser bug)")
	}

	const rafMock = throttleMocker()

	// Extreme hack to replace the location object in the window.
	//
	// I can't just overwrite `location` as it's `[LegacyUnforgeable]` and thus not configurable.
	// Also, I have to use getters and setters to preserve the `[PutForwards=href]` IDL attribute's
	// behavior.
	//
	// And finally, since Mithril uses `elem.ownerDocument.defaultView` to get the window in many
	// cases, I have to hack that in as well.
	const hackDescriptors = Object.getOwnPropertyDescriptors($window)
	hackDescriptors.location.get = () => location
	hackDescriptors.location.set = (v) => { location.href = v }
	hackDescriptors.history.get = () => history
	/** @type {Window & typeof globalThis} */
	const hackWindow = Object.create(Object.getPrototypeOf($window), hackDescriptors)
	const {location, history} = createLocationProxy(hackWindow, env)
	// Also, to ensure this is transparent to window accesses via `root.ownerDocument.defaultView`,
	// hack that to return the proxied window as well.
	const oldDefaultView = Object.getOwnPropertyDescriptor(hackWindow.Document.prototype, "defaultView").get
	Object.defineProperty(hackWindow.Document.prototype, "defaultView", {
		get() {
			const result = oldDefaultView.call(this)
			return result === $window ? hackWindow : result
		},
	})

	hackWindow.requestAnimationFrame = rafMock.schedule
	hackWindow.cancelAnimationFrame = rafMock.clear

	prevWindow = G.window
	prevDocument = G.document
	prevConsoleError = console.error

	G.window = hackWindow
	G.document = hackWindow.document

	if (env && env.expectNoConsoleError) {
		console.error = (...args) => {
			if (typeof process === "function") process.exitCode = 1
			var replacement = console.error
			// Node's `console.trace` delegates to `console.error` as a property. Have it
			// actually call what it intended to call.
			try {
				console.error = originalConsoleError
				console.trace("Unexpected `console.error` call")
			} finally {
				console.error = replacement
			}
			originalConsoleError.apply(console, args)
		}
	}

	return {iframe, hackWindow, rafMock, registeredRoots: new Set([hackWindow.document.body])}
}

/** @param {SetupState} state */
function doCleanup(state) {
	const errors = []
	for (const root of state.registeredRoots) {
		try {
			m.render(root, null)
		} catch (e) {
			errors.push(e)
		}
	}
	state.iframe.remove()
	G.window = prevWindow
	G.document = prevDocument
	console.error = prevConsoleError
	clearPending()
	o(errors).deepEquals([])
	errors.length = 0
	o(state.rafMock.queueLength()).equals(0)
}

class GlobalState {
	constructor(env) {
		this._ = null
		this.register = (root) => {
			this._.registeredRoots.add(root)
			return root
		}

		o.beforeEach(() => {
			this._ = doInit(env)
			return env.initialize && env.initialize(G)
		})

		o.afterEach(() => {
			const state = this._
			this._ = null
			doCleanup(state)
			return env.cleanup && env.cleanup(G)
		})
	}

	get window() {
		return this._.hackWindow
	}

	get rafMock() {
		return this._.rafMock
	}

	get root() {
		return this.window.document.body
	}
}

export function setupGlobals(env = {}) {
	return new GlobalState(env)
}
