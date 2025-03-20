// Load order is important for the imports.

/* global globalThis, window, global */

import o from "ospec"

import m from "../src/entry/mithril.esm.js"

import browserMock from "./browserMock.js"
import {clearPending} from "./callAsync.js"
import throttleMocker from "./throttleMock.js"

const G = (
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined" ? window : global
)

const originalWindow = G.window
const originalDocument = G.document
const originalConsoleError = console.error

export function restoreDOMGlobals() {
	G.window = originalWindow
	G.document = originalDocument
}

/**
 * @typedef SetupState
 * @property {Set<any>} registeredRoots
 * @property {ReturnType<import("./browserMock.js")["default"]>} $window
 * @property {ReturnType<import("./throttleMock.js")["default"]>} rafMock
 */

/** @returns {SetupState} */
function doInit(env) {
	const $window = browserMock({...env})
	const rafMock = throttleMocker()
	const registeredRoots = new Set([$window.document.body])
	G.window = $window.window
	G.document = $window.document
	$window.requestAnimationFrame = rafMock.schedule
	$window.cancelAnimationFrame = rafMock.clear

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
	return {$window, rafMock, registeredRoots}
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
	restoreDOMGlobals()
	console.error = originalConsoleError
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

		this.initialize = (env) => {
			this._ = doInit(env)
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
		return this._.$window
	}

	get rafMock() {
		return this._.rafMock
	}

	get root() {
		return this._.$window.document.body
	}
}

export function setupGlobals(env = {}) {
	return new GlobalState(env)
}
