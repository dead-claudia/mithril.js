import * as Cell from "../../../mithril/cell.mjs"
import {Keyed, m} from "../../../mithril.mjs"
import {
	countRemaining, dispatch, getTodosByStatus, hasRemaining,
	state
} from "./model.mjs"
import Router from "../../../mithril/router.mjs"

//view
function Header() {
	return m("header.header", [
		m("h1", "todos"),
		m("input#new-todo[placeholder='What needs to be done?'][autofocus]", {
			onkeypress(ev) {
				if (ev.keyCode === 13 && ev.target.value) {
					dispatch({type: "createTodo", title: ev.target.value})
					ev.target.value = ""
				}
			},
		}),
	])
}

function Todo(attrs) {
	function save(ev) {
		if (ev.keyCode === 13 || ev.type === "blur") {
			dispatch({type: "update", title: ev.target.value})
		} else if (ev.keyCode === 27) {
			dispatch({type: "reset"})
		}
	}

	return Cell.map(attrs, ({todo}) => {
		const inputRef = todo === state.editing
			? (input) => {
				if (input !== document.activeElement) {
					input.focus()
					input.selectionStart = todo.title.length
					input.selectionEnd = todo.title.length
				}
			}
			: undefined

		return m("li", {
			class: (todo.completed ? "completed" : "") + " " +
				(todo === state.editing ? "editing" : "")
		}, [
			m(".view", [
				m("input.toggle[type=checkbox]", {
					checked: todo.completed,
					onclick() {
						dispatch({
							type: "setStatus",
							todo, completed: !todo.completed,
						})
					},
				}),
				m("label", {ondblclick() {
					dispatch({type: "edit", todo})
				}}, todo.title),
				m("button.destroy", {onclick() {
					dispatch({type: "destroy", todo})
				}}),
			]),
			m("input.edit", {
				ref: inputRef, value: todo.title,
				onkeyup: save, onblur: save,
			}),
		])
	})
}

function Todos(attrs) {
	return m("section#main", [
		m("input#toggle-all[type=checkbox]", {
			checked: !hasRemaining(),
			onchange(ev) {
				dispatch({type: "setStatuses", completed: ev.target.checked})
			},
		}),
		m("label[for=toggle-all]", "Mark all as complete"),
		m("ul#todo-list", m(Keyed, Cell.map(attrs, ({showing}) =>
			getTodosByStatus({showing}).map((todo) =>
				m(Todo, {key: todo.id, todo})
			)
		))),
	])
}

function Footer(attrs) {
	const remaining = countRemaining()

	return [
		m("span#todo-count", [
			m("strong", remaining),
			remaining === 1 ? " item left" : " items left",
		]),
		m("ul#filters", Cell.map(attrs, ({showing}) => {
			function filter(href, label, children) {
				return m("li", m(Router.Link, m("a", {
					href, children,
					class: showing === label ? "selected" : ""
				})))
			}

			return [
				filter("/", "all", "All"),
				filter("/active", "active", "Active"),
				filter("/completed", "completed", "Completed"),
			]
		})),
		m("button#clear-completed", {
			onclick() { dispatch({type: "clear"}) }
		}, "Clear completed"),
	]
}

export default function View(attrs) {
	return [
		m(Header),
		state.todos.length ? Cell.map(attrs, ({showing}) => [
			m(Todos, {showing}),
			m(Footer, {showing}),
		]) : null
	]
}
