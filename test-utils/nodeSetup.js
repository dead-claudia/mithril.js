import {JSDOM} from "jsdom"

Error.stackTraceLimit = 100

const jsdom = new JSDOM("<!doctype html>", {pretendToBeVisual: true})

global.jsdomWindow = jsdom.window
global.jsdomDocument = jsdom.window.document
