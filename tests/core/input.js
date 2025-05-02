import o from "ospec"

import {installValueSetterSpy} from "../../test-utils/setterSpy.js"
import {setupGlobals} from "../../test-utils/global.js"

import m from "../../src/entry/mithril.esm.js"

o.spec("form inputs", function() {
	var G = setupGlobals()

	o.spec("input", function() {
		o("maintains focus after move", function() {
			var input

			m.render(G.root, m.keyed([[1, input = m("input")], [2, m("a")], [3, m("b")]]))
			input.d.focus()
			m.render(G.root, m.keyed([[2, m("a")], [1, input = m("input")], [3, m("b")]]))

			o(G.window.document.activeElement).equals(input.d)
		})

		o("maintains focus when changed manually in hook", function() {
			var input = m("input", m.layout((dom) => {
				dom.focus()
			}));

			m.render(G.root, input)

			o(G.window.document.activeElement).equals(input.d)
		})

		o("syncs input value if DOM value differs from vdom value", function() {
			var input = m("input", {value: "aaa", oninput: function() {}})
			var updated = m("input", {value: "aaa", oninput: function() {}})
			var redraw = o.spy()

			m.render(G.root, input, {redraw})

			//simulate user typing
			var e = new G.window.KeyboardEvent("input", {bubbles: true, cancelable: true})
			input.d.focus()
			input.d.value += "a"
			input.d.dispatchEvent(e)
			o(redraw.callCount).equals(1)

			//re-render may use same vdom value as previous render call
			m.render(G.root, updated, {redraw})

			o(updated.d.value).equals("aaa")
			o(redraw.callCount).equals(1)
		})

		o("clear element value if vdom value is set to undefined (aka removed)", function() {
			var input = m("input", {value: "aaa", oninput: function() {}})
			var updated = m("input", {value: undefined, oninput: function() {}})

			m.render(G.root, input)
			m.render(G.root, updated)

			o(updated.d.value).equals("")
		})

		o("syncs input checked attribute if DOM value differs from vdom value", function() {
			var input = m("input", {type: "checkbox", checked: true, onclick: function() {}})
			var updated = m("input", {type: "checkbox", checked: true, onclick: function() {}})
			var redraw = o.spy()

			m.render(G.root, input, {redraw})

			//simulate user clicking checkbox
			var e = new G.window.TouchEvent("click", {bubbles: true, cancelable: true})
			input.d.focus()
			input.d.dispatchEvent(e)
			o(redraw.callCount).equals(1)

			//re-render may use same vdom value as previous render call
			m.render(G.root, updated, {redraw})

			o(updated.d.checked).equals(true)
			o(redraw.callCount).equals(1)
		})

		// Hack to "set" the value without actually setting it in the DOM
		function createInputFileHijacker() {
			var desc = Object.getOwnPropertyDescriptor(G.window.HTMLInputElement.prototype, "value")
			var inputHijacked = false
			var targetInput, targetValue
			Object.defineProperty(G.window.HTMLInputElement.prototype, "value", {
				get() {
					if (inputHijacked && this === targetInput) return targetValue
					return desc.get.call(this)
				},
				set(value) {
					if (inputHijacked && this === targetInput) {
						targetValue = `${value}`
					} else {
						desc.set.call(this, value)
					}
				}
			})
			return (input, value) => {
				inputHijacked = true
				targetInput = input
				targetValue = `${value}`
			}
		}

		o("syncs file input value attribute if DOM value differs from vdom value and is empty", function() {
			var hijackFileInput = createInputFileHijacker()
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated = m("input", {type: "file", value: "", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			m.render(G.root, input)
			hijackFileInput(G.root.firstChild, "test.png")

			try {
				console.error = spy
				m.render(G.root, updated)
			} finally {
				console.error = error
			}

			o(updated.d.value).equals("")
			o(spy.callCount).equals(0)
		})

		o("warns and ignores file input value attribute if DOM value differs from vdom value and is non-empty", function() {
			var hijackFileInput = createInputFileHijacker()
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated = m("input", {type: "file", value: "other.png", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			m.render(G.root, input)
			hijackFileInput(G.root.firstChild, "test.png")

			try {
				console.error = spy
				m.render(G.root, updated)
			} finally {
				console.error = error
			}

			o(updated.d.value).equals("test.png")
			o(spy.callCount).equals(1)
		})

		o("retains file input value attribute if DOM value is the same as vdom value and is non-empty", function() {
			var hijackFileInput = createInputFileHijacker()
			var input = m("input", {type: "file", value: "", onclick: function() {}})
			var updated1 = m("input", {type: "file", value: "test.png", onclick: function() {}})
			var updated2 = m("input", {type: "file", value: "test.png", onclick: function() {}})
			var spy = o.spy()
			var error = console.error

			m.render(G.root, input)
			var valueSetter = installValueSetterSpy(input.d)

			// Verify our assumptions about the outer element state
			o(valueSetter.callCount).equals(0)
			hijackFileInput(input.d, "")
			o(valueSetter.callCount).equals(0)
			input.d.value = "test.png"
			o(valueSetter.callCount).equals(1)

			try {
				console.error = spy
				m.render(G.root, updated1)
			} finally {
				console.error = error
			}

			o(updated1.d.value).equals("test.png")
			o(spy.callCount).equals(0)
			o(valueSetter.callCount).equals(1)

			try {
				console.error = spy
				m.render(G.root, updated2)
			} finally {
				console.error = error
			}

			o(updated2.d.value).equals("test.png")
			o(spy.callCount).equals(0)
			o(valueSetter.callCount).equals(1)
		})
	})

	o.spec("select", function() {
		o("select works without attributes", function() {
			var select = m("select",
				m("option", {value: "a"}, "aaa")
			)

			m.render(G.root, select)

			o(select.d.value).equals("a")
			o(select.d.selectedIndex).equals(0)
		})

		o("select option can have empty string value", function() {
			var select = m("select",
				m("option", {value: ""}, "aaa")
			)

			m.render(G.root, select)

			o(select.d.firstChild.value).equals("")
		})

		o("option value defaults to textContent unless explicitly set", function() {
			var select = m("select",
				m("option", "aaa")
			)

			m.render(G.root, select)

			o(select.d.firstChild.value).equals("aaa")
			o(select.d.value).equals("aaa")

			//test that value changes when content changes
			select = m("select",
				m("option", "bbb")
			)

			m.render(G.root, select)

			o(select.d.firstChild.value).equals("bbb")
			o(select.d.value).equals("bbb")

			//test that value can be set to "" in subsequent render
			select = m("select",
				m("option", {value: ""}, "aaa")
			)

			m.render(G.root, select)

			o(select.d.firstChild.value).equals("")
			o(select.d.value).equals("")

			//test that value reverts to textContent when value omitted
			select = m("select",
				m("option", "aaa")
			)

			m.render(G.root, select)

			o(select.d.firstChild.value).equals("aaa")
			o(select.d.value).equals("aaa")
		})

		o("select yields invalid value without children", function() {
			var select = m("select", {value: "a"})

			m.render(G.root, select)

			o(select.d.value).equals("")
			o(select.d.selectedIndex).equals(-1)
		})

		o("select value is set correctly on first render", function() {
			var select = m("select", {value: "b"},
				m("option", {value: "a"}, "aaa"),
				m("option", {value: "b"}, "bbb"),
				m("option", {value: "c"}, "ccc")
			)

			m.render(G.root, select)

			o(select.d.value).equals("b")
			o(select.d.selectedIndex).equals(1)
		})

		o("syncs select value if DOM value differs from vdom value", function() {
			function makeSelect() {
				return m("select", {value: "b"},
					m("option", {value: "a"}, "aaa"),
					m("option", {value: "b"}, "bbb"),
					m("option", {value: "c"}, "ccc")
				)
			}

			m.render(G.root, makeSelect())

			//simulate user selecting option
			G.root.firstChild.value = "c"
			G.root.firstChild.focus()

			//re-render may use same vdom value as previous render call
			m.render(G.root, makeSelect())

			o(G.root.firstChild.value).equals("b")
			o(G.root.firstChild.selectedIndex).equals(1)
		})
	})
})
