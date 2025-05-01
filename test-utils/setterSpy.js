import o from "ospec"

export function installValueSetterSpy(element, property = "value") {
	var desc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), property)
	var spy = desc.set = o.spy(desc.set)
	Object.defineProperty(element, property, desc)
	return spy
}
