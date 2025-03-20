/* global FormData */

// This alone amounts to almost 150k assertions total, but that's because it almost fully
// exhaustively tests the function. (Turns out it's not all that hard.) The function's pretty
// simple, so it doesn't take as long as you'd think.

import o from "ospec"

import m from "../../src/entry/mithril.esm.js"
import {setupGlobals} from "../../test-utils/global.js"

o.spec("fetch supertests", () => {
	let global, oldFetch
	setupGlobals({
		initialize(g) {
			global = g
			oldFetch = g.fetch
		},
		cleanup(g) {
			global = null
			g.fetch = oldFetch
		},
	})

	const methods = [
		"HEAD",
		"GET",
		"PATCH",
		"POST",
		"PUT",
		"DELETE",
	]

	const okStatuses = {
		200: "OK",
		201: "Created",
		202: "Accepted",
		203: "Non-authoritative Information",
		206: "Partial Content",
		207: "Multi-Status",
		208: "Already Reported",
		226: "IM Used",
	}

	const emptyStatuses = {
		204: "No Content",
		205: "Reset Content",
	}

	const emptyErrorStatuses = {
		// 1xx statuses aren't supported: https://github.com/whatwg/fetch/issues/1759
		// It's likely that in the future, 101 may be supported, but not 103.
		// 101: "Switching Protocols",
		// 103: "Early Hints",
		304: "Not Modified",
	}

	const errorStatuses = {
		// 1xx statuses aren't supported: https://github.com/whatwg/fetch/issues/1759
		// 100: "Continue",
		// 102: "Processing",
		300: "Multiple Choices",
		301: "Moved Permanently",
		302: "Found",
		303: "See Other",
		305: "Use Proxy",
		307: "Temporary Redirect",
		308: "Permanent Redirect",
		400: "Bad Request",
		401: "Unauthorized",
		402: "Payment Required",
		403: "Forbidden",
		404: "Not Found",
		405: "Method Not Allowed",
		406: "Not Acceptable",
		407: "Proxy Authentication Required",
		408: "Request Timeout",
		409: "Conflict",
		410: "Gone",
		411: "Length Required",
		412: "Precondition Failed",
		413: "Payload Too Large",
		414: "Request-URI Too Long",
		415: "Unsupported Media Type",
		416: "Requested Range Not Satisfiable",
		417: "Expectation Failed",
		418: "I'm a teapot",
		421: "Misdirected Request",
		422: "Unprocessable Entity",
		423: "Locked",
		424: "Failed Dependency",
		425: "Too Early",
		426: "Upgrade Required",
		428: "Precondition Required",
		429: "Too Many Requests",
		431: "Request Header Fields Too Large",
		444: "Connection Closed Without Response",
		451: "Unavailable For Legal Reasons",
		499: "Client Closed Request",
		500: "Internal Server Error",
		501: "Not Implemented",
		502: "Bad Gateway",
		503: "Service Unavailable",
		504: "Gateway Timeout",
		505: "HTTP Version Not Supported",
		506: "Variant Also Negotiates",
		507: "Insufficient Storage",
		508: "Loop Detected",
		510: "Not Extended",
		511: "Network Authentication Required",
		599: "Network Connect Timeout Error",
	}

	const allStatuses = {...okStatuses, ...emptyStatuses, ...emptyErrorStatuses, ...errorStatuses}

	const allResponseTypes = ["json", "formdata", "arraybuffer", "blob", "text", "document"]

	/**
	 * @typedef FetchOptions
	 * @property {number} status
	 * @property {string} [contentType]
	 * @property {boolean} [contentLength]
	 * @property {null | Array<string | number[]>} body
	 */

	/** @implements {UnderlyingByteSource} */
	class FetchSource {
		/** @param {Uint8Array[]} chunks */
		constructor(chunks) {
			this.type = "bytes"
			this.i = 0
			this.chunks = chunks
		}

		/** @param {ReadableByteStreamController} ctrl */
		pull(ctrl) {
			if (this.i === this.chunks.length) {
				ctrl.close()
			} else {
				ctrl.enqueue(Uint8Array.from(this.chunks[this.i++]))
			}
		}
	}

	const encoder = new TextEncoder()

	/** @param {FetchOptions} options */
	const executeFetch = ({status, headers = {}, contentLength, body}) => {
		let chunks = null
		let byteLength = 0

		if (body != null) {
			chunks = []
			for (let chunk of body) {
				chunk = typeof chunk === "string" ? encoder.encode(chunk) : Uint8Array.from(chunk)
				byteLength += chunk.length
				chunks.push(chunk)
			}
			body = new ReadableStream(new FetchSource(chunks))
		}

		if (contentLength) {
			headers["content-length"] = byteLength
		}

		return new Response(body, {status, statusText: allStatuses[status], headers})
	}

	/** @param {FetchOptions} options */
	const setupFetch = (options) => {
		global.fetch = o.spy(() => executeFetch(options))
	}

	const bufferToArray = (v) => [...new Uint8Array(v)]

	/** @type {Array<(method: string, status: number) => Promise<void>>} */
	const okStatusSupertest = async (method, status) => {
		status = Number(status)

		/**********************************/
		/* arraybuffer, no content length */
		/**********************************/
		// null body
		{
			setupFetch({status, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, body: []})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, body: [[10]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, body: [[10], [20]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10, 20])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, body: []})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, body: [[10]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10])
			o(reports).deepEquals([[1, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, body: [[10], [20]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10, 20])
			o(reports).deepEquals([[1, -1], [2, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/***********************************/
		/* arraybuffer, has content length */
		/***********************************/
		// null body
		{
			setupFetch({status, contentLength: true, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, contentLength: true, body: []})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10, 20])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: []})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10])
			o(reports).deepEquals([[1, 1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([10, 20])
			o(reports).deepEquals([[1, 2], [2, 2]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/***************************/
		/* text, no content length */
		/***************************/
		// null body
		{
			setupFetch({status, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, body: []})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, body: [[10]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, body: [[10], [20]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, body: []})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, body: [[10]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("\x0A")
			o(reports).deepEquals([[1, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, body: [[10], [20]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("\x0A\x14")
			o(reports).deepEquals([[1, -1], [2, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/****************************/
		/* text, has content length */
		/****************************/
		// null body
		{
			setupFetch({status, contentLength: true, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, contentLength: true, body: []})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: []})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("\x0A")
			o(reports).deepEquals([[1, 1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("\x0A\x14")
			o(reports).deepEquals([[1, 2], [2, 2]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/***************************/
		/* blob, no content length */
		/***************************/
		// null body
		{
			setupFetch({status, body: null})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, body: []})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, body: [[10]]})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, body: [[10], [20]]})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, body: []})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, body: [[10]]})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("\x0A")
			o(reports).deepEquals([[1, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, body: [[10], [20]]})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("\x0A\x14")
			o(reports).deepEquals([[1, -1], [2, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/****************************/
		/* blob, has content length */
		/****************************/
		// null body
		{
			setupFetch({status, contentLength: true, body: null})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, contentLength: true, body: []})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: null})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: []})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10]]})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("\x0A")
			o(reports).deepEquals([[1, 1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("\x0A\x14")
			o(reports).deepEquals([[1, 2], [2, 2]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/***************************/
		/* json, no content length */
		/***************************/
		// null body
		{
			setupFetch({status, body: null})

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, body: []})

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, body: ["123"]})

			const result = await m.fetch("/url", {
				method,
				responseType: "json",
			})

			o(result).equals(123)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, body: ["123", "456"]})

			const result = await m.fetch("/url", {
				method,
				responseType: "json",
			})

			o(result).equals(123456)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, body: []})

			const reports = []

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, body: ["123"]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "json",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals(123)
			o(reports).deepEquals([[3, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, body: ["123", "456"]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "json",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals(123456)
			o(reports).deepEquals([[3, -1], [6, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/****************************/
		/* json, has content length */
		/****************************/
		// null body
		{
			setupFetch({status, contentLength: true, body: null})

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body
		{
			setupFetch({status, contentLength: true, body: []})

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk
		{
			setupFetch({status, contentLength: true, body: ["123"]})

			const result = await m.fetch("/url", {
				method,
				responseType: "json",
			})

			o(result).equals(123)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks
		{
			setupFetch({status, contentLength: true, body: ["123", "456"]})

			const result = await m.fetch("/url", {
				method,
				responseType: "json",
			})

			o(result).equals(123456)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// null body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: null})

			const reports = []

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// empty body + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: []})

			const reports = []

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// single non-empty chunk + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: ["123"]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "json",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals(123)
			o(reports).deepEquals([[3, 3]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// two non-empty chunks + `onprogress` listener
		{
			setupFetch({status, contentLength: true, body: ["123", "456"]})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "json",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals(123456)
			o(reports).deepEquals([[3, 6], [6, 6]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/*************/
		/* form data */
		/*************/
		if (typeof FormData === "function") {
			setupFetch({
				status,
				headers: {
					"content-type": "multipart/form-data; boundary=123456",
				},
				contentLength: true,
				body: [
					"--123456\r\n",
					"Content-Disposition: form-data; name=\"test\"\r\n",
					"\r\n",
					"value\r\n",
					"--123456--\r\n",
				],
			})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "formdata",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o([...result]).deepEquals([
				["test", "value"],
			])
			o(reports).deepEquals([
				[10, 76],
				[55, 76],
				[57, 76],
				[64, 76],
				[76, 76],
			])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		/************/
		/* document */
		/************/
		if (typeof DOMParser === "function") {
			// works without content type
			{
				setupFetch({
					status,
					body: ["<!doctype html><div id=foo></div>"],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}

			// works with content type text/html
			{
				setupFetch({
					status,
					headers: {
						"content-type": "text/html",
					},
					body: ["<!doctype html><div id=foo></div>"],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}

			// works with content type application/xhtml+xml
			{
				setupFetch({
					status,
					headers: {
						"content-type": "application/xhtml+xml",
					},
					body: ['<!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml"><head><title>test</title></head><body><div id="foo" /></body></html>'],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}

			// works with content type application/xml
			{
				setupFetch({
					status,
					headers: {
						"content-type": "application/xml",
					},
					body: ['<html xmlns="http://www.w3.org/1999/xhtml"><head><title>test</title></head><body><div id="foo" /></body></html>'],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}

			// works with content type text/xml
			{
				setupFetch({
					status,
					headers: {
						"content-type": "text/xml",
					},
					body: ['<html><head><title>test</title></head><body><div id="foo" /></body></html>'],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}

			// works with content type image/svg+xml
			{
				setupFetch({
					status,
					headers: {
						"content-type": "image/svg+xml",
					},
					body: ['<svg><g id="foo" /></svg>'],
				})

				const reports = []
				const result = await m.fetch("/url", {
					method,
					responseType: "formdata",
					onprogress: (current, total) => reports.push([current, total]),
				})

				o(result.getElementById("foo")).notEquals(null)
				o(reports).deepEquals([[33, -1]])
				o(global.fetch.callCount).equals(1)
				o(global.fetch.args[0]).equals("/url")
				o(global.fetch.args[1].method).equals(method)
			}
		}

		/******************/
		/* custom extract */
		/******************/
		{
			setupFetch({
				status,
				body: ["123"],
			})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				onprogress: (current, total) => reports.push([current, total]),
				extract: async (response) => `${await response.text()}456`,
			})

			o(result).equals("123456")
			o(reports).deepEquals([
				[3, -1],
			])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}
	}

	const emptyStatusSupertest = async (method, status) => {
		status = Number(status)

		// arraybuffer, no `onprogress` listener
		{
			setupFetch({status, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// arraybuffer, with `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "arraybuffer",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result instanceof ArrayBuffer).equals(true)
			o(bufferToArray(result)).deepEquals([])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// text, no `onprogress` listener
		{
			setupFetch({status, body: null})

			const result = await m.fetch("/url", {
				method,
				responseType: "text",
			})

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// text, with `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				responseType: "text",
				onprogress: (current, total) => reports.push([current, total]),
			})

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// blob, no `onprogress` listener
		{
			setupFetch({status, body: null})

			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
			})
			const result = await blob.text()

			o(result).equals("")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// blob, with `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []
			const blob = await m.fetch("/url", {
				method,
				responseType: "blob",
				onprogress: (current, total) => reports.push([current, total]),
			})
			const result = await blob.text()

			o(result).equals("")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// json, no `onprogress` listener
		{
			setupFetch({status, body: null})

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// json, with `onprogress` listener
		{
			setupFetch({status, body: null})

			const reports = []

			let error
			try {
				await m.fetch("/url", {
					method,
					responseType: "json",
				})
			} catch (e) {
				error = e
			}

			o(error).notEquals(undefined)
			o(error.cause).notEquals(undefined)
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}

		// custom extract
		{
			setupFetch({
				status,
				body: null,
			})

			const reports = []
			const result = await m.fetch("/url", {
				method,
				onprogress: (current, total) => reports.push([current, total]),
				extract: async (response) => `${await response.text()}456`,
			})

			o(result).equals("456")
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}
	}

	const emptyErrorStatusSupertest = async (method, status) => {
		status = Number(status)
		let error

		for (const responseType of allResponseTypes) {
			// no `onprogress` listener
			setupFetch({status, body: null})
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(emptyErrorStatuses[status])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// with `onprogress` listener
			setupFetch({status, body: null})

			const reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(emptyErrorStatuses[status])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}
	}

	const errorStatusSupertest = async (method, status) => {
		status = Number(status)
		let error, reports

		for (const responseType of allResponseTypes) {
			// no content length, null body
			setupFetch({status, body: null})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, empty body
			setupFetch({status, body: []})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, single non-empty chunk
			setupFetch({status, body: [[10]]})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, two non-empty chunks
			setupFetch({status, body: [[10], [20]]})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, null body + `onprogress` listener
			setupFetch({status, body: null})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, empty body + `onprogress` listener
			setupFetch({status, body: []})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, single non-empty chunk + `onprogress` listener
			setupFetch({status, body: [[10]]})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A")
			o(reports).deepEquals([[1, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// no content length, two non-empty chunks + `onprogress` listener
			setupFetch({status, body: [[10], [20]]})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A\x14")
			o(reports).deepEquals([[1, -1], [2, -1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, null body
			setupFetch({status, contentLength: true, body: null})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, empty body
			setupFetch({status, contentLength: true, body: []})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, single non-empty chunk
			setupFetch({status, contentLength: true, body: [[10]]})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, two non-empty chunks
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A\x14")
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, null body + `onprogress` listener
			setupFetch({status, contentLength: true, body: null})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, empty body + `onprogress` listener
			setupFetch({status, contentLength: true, body: []})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals(errorStatuses[status])
			o(reports).deepEquals([])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, single non-empty chunk + `onprogress` listener
			setupFetch({status, contentLength: true, body: [[10]]})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A")
			o(reports).deepEquals([[1, 1]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)

			// has content length, two non-empty chunks + `onprogress` listener
			setupFetch({status, contentLength: true, body: [[10], [20]]})

			reports = []
			error = undefined
			try {
				await m.fetch("/url", {
					method,
					responseType,
					onprogress: (current, total) => reports.push([current, total]),
				})
			} catch (e) {
				error = e
			}

			o(error.message).equals("\x0A\x14")
			o(reports).deepEquals([[1, 2], [2, 2]])
			o(global.fetch.callCount).equals(1)
			o(global.fetch.args[0]).equals("/url")
			o(global.fetch.args[1].method).equals(method)
		}
	}

	for (const method of methods) {
		o.spec(method, () => {
			for (const status of Object.keys(okStatuses)) {
				o(status, () => okStatusSupertest(method, status))
			}

			for (const status of Object.keys(emptyStatuses)) {
				o(status, () => emptyStatusSupertest(method, status))
			}

			for (const status of Object.keys(emptyErrorStatuses)) {
				o(status, () => emptyErrorStatusSupertest(method, status))
			}

			for (const status of Object.keys(errorStatuses)) {
				o(status, () => errorStatusSupertest(method, status))
			}
		})
	}
})
