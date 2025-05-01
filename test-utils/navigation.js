import {callAsync} from "./callAsync.js"
import parseURL from "./parseURL.js"

function prefix(prefix, value) {
	if (value === "") return ""
	return (value.charAt(0) !== prefix ? prefix : "") + value
}

class NavState {
	constructor(window, env) {
		this.protocol = String(env.protocol || "http:")
		this.hostname = String(env.hostname || "localhost")

		this.port = ""
		this.pathname = "/"
		this.search = ""
		this.hash = ""

		this.past = []
		this.future = []

		this.hashchangePending = false
		this.$window = window

		this.past.push({url: this.getURL(), isNew: true, state: null, title: null})
	}

	getURL() {
		if (this.protocol === "file:") return this.protocol + "//" + this.pathname + this.search + this.hash
		return this.protocol + "//" + this.hostname + prefix(":", this.port) + this.pathname + this.search + this.hash
	}

	setURL(value) {
		var data = parseURL(value, this)
		var isNew = false
		if (data.protocol != null && data.protocol !== this.protocol) this.protocol = data.protocol, isNew = true
		if (data.hostname != null && data.hostname !== this.hostname) this.hostname = data.hostname, isNew = true
		if (data.port != null && data.port !== this.port) this.port = data.port, isNew = true
		if (data.pathname != null && data.pathname !== this.pathname) this.pathname = data.pathname, isNew = true
		if (data.search != null && data.search !== this.search) this.search = data.search, isNew = true
		if (data.hash != null && data.hash !== this.hash) {
			this.hash = data.hash
			if (!isNew) {
				this.hashchange()
			}
		}
		return isNew
	}

	hashchange() {
		if (this.hashchangePending) return
		callAsync(() => {
			this.hashchangePending = false
			if (typeof this.$window.onhashchange === "function") {
				this.$window.onhashchange({type: "hashchange"})
			}
		})
		this.hashchangePending = true
	}

	popstate() {
		if (typeof this.$window.onpopstate === "function") {
			this.$window.onpopstate({type: "popstate", state: this.$window.history.state})
		}
	}

	unload() {
		if (typeof this.$window.onunload === "function") {
			this.$window.onunload({type: "unload"})
		}
	}
}

class Location {
	constructor(navState) {
		this._ = navState
	}

	get protocol() {
		return this._.protocol
	}
	get hostname() {
		return this._.hostname
	}
	get port() {
		return this._.port
	}
	get pathname() {
		return this._.pathname
	}
	get search() {
		return this._.search
	}
	get hash() {
		return this._.hash
	}
	get origin() {
		if (this._.protocol === "file:") return "null"
		return this._.protocol + "//" + this._.hostname + prefix(":", this._.port)
	}
	get host() {
		if (this._.protocol === "file:") return ""
		return this._.hostname + prefix(":", this._.port)
	}
	get href() {
		return this._.getURL()
	}

	set protocol(value) {
		throw new Error("Protocol is read-only")
	}
	set hostname(value) {
		this._.unload()
		this._.past.push({url: this._.getURL(), isNew: true})
		this._.future = []
		this._.hostname = value
	}
	set port(value) {
		if (this._.protocol === "file:") throw new Error("Port is read-only under `file://` protocol")
		this._.unload()
		this._.past.push({url: this._.getURL(), isNew: true})
		this._.future = []
		this._.port = value
	}
	set pathname(value) {
		if (this._.protocol === "file:") throw new Error("Pathname is read-only under `file://` protocol")
		this._.unload()
		this._.past.push({url: this._.getURL(), isNew: true})
		this._.future = []
		this._.pathname = prefix("/", value)
	}
	set search(value) {
		this._.unload()
		this._.past.push({url: this._.getURL(), isNew: true})
		this._.future = []
		this._.search = prefix("?", value)
	}
	set hash(value) {
		var oldHash = this._.hash
		this._.past.push({url: this._.getURL(), isNew: false})
		this._.future = []
		this._.hash = prefix("#", value)
		if (oldHash != this._.hash) this._.hashchange()
	}

	set origin(value) {
		//origin is writable but ignored
	}
	set host(value) {
		//host is writable but ignored in Chrome
	}
	set href(value) {
		var url = this._.getURL()
		var isNew = this._.setURL(value)
		if (isNew) {
			this._.setURL(url)
			this._.unload()
			this._.setURL(value)
		}
		this._.past.push({url: url, isNew: isNew})
		this._.future = []
	}
}

class History {
	constructor(navState) {
		this._ = navState
	}

	pushState(state, title, url) {
		this._.past.push({url: this._.getURL(), isNew: false, state: state, title: title})
		this._.future = []
		this._.setURL(url)
	}
	replaceState(state, title, url) {
		var entry = this._.past[this._.past.length - 1]
		entry.state = state
		entry.title = title
		this._.setURL(url)
	}
	back() {
		if (this._.past.length > 1) {
			var entry = this._.past.pop()
			if (entry.isNew) this._.unload()
			this._.future.push({url: this._.getURL(), isNew: false, state: entry.state, title: entry.title})
			this._.setURL(entry.url)
			if (!entry.isNew) this._.popstate()
		}
	}
	forward() {
		var entry = this._.future.pop()
		if (entry != null) {
			if (entry.isNew) this._.unload()
			this._.past.push({url: this._.getURL(), isNew: false, state: entry.state, title: entry.title})
			this._.setURL(entry.url)
			if (!entry.isNew) this._.popstate()
		}
	}
	get state() {
		return this._.past.length === 0 ? null : this._.past[this._.past.length - 1].state
	}
}

export function installNavMock(window, env = {}) {
	var prevLocation = Object.getOwnPropertyDescriptor(window, "location")
	var prevHistory = Object.getOwnPropertyDescriptor(window, "history")

	var navState = new NavState(window, env)

	Object.defineProperty(window, "location", {
		configurable: true,
		enumerable: true,
		writable: true,
		value: new Location(navState),
	})

	Object.defineProperty(window, "history", {
		configurable: true,
		enumerable: true,
		writable: true,
		value: new History(navState),
	})

	return () => {
		Object.defineProperty(window, "location", prevLocation)
		Object.defineProperty(window, "history", prevHistory)
	}
}
