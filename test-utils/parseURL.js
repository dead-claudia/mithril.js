export default function parseURL(url, root) {
	var protocol, hostname, port, pathname

	var protocolIndex = url.indexOf("://")
	var pathnameIndex = protocolIndex > -1 ? url.indexOf("/", protocolIndex + 3) : url.indexOf("/")
	var searchIndex = url.indexOf("?")
	var hashIndex = url.indexOf("#")
	if ((pathnameIndex > searchIndex && searchIndex > -1) || (pathnameIndex > hashIndex && hashIndex > -1)) pathnameIndex = -1
	if (searchIndex > hashIndex && hashIndex > -1) searchIndex = -1
	var pathnameEnd = searchIndex > -1 ? searchIndex : hashIndex > -1 ? hashIndex : url.length
	if (protocolIndex > -1) {
		//it's a full URL
		if (pathnameIndex < 0) pathnameIndex = url.length
		var portIndex = url.indexOf(":", protocolIndex + 1)
		if (portIndex < 0) portIndex = pathnameIndex
		protocol = url.slice(0, protocolIndex + 1)
		hostname = url.slice(protocolIndex + 3, portIndex)
		port = url.slice(portIndex + 1, pathnameIndex)
		pathname = url.slice(pathnameIndex, pathnameEnd) || "/"
	}
	else {
		protocol = root.protocol
		hostname = root.hostname
		port = root.port
		if (pathnameIndex === 0) {
			//it's an absolute path
			pathname = url.slice(pathnameIndex, pathnameEnd) || "/"
		}
		else if (searchIndex !== 0 && hashIndex !== 0) {
			//it's a relative path
			var slashIndex = root.pathname.lastIndexOf("/")
			var path = slashIndex > -1 ? root.pathname.slice(0, slashIndex + 1) : "./"
			var normalized = url.slice(0, pathnameEnd).replace(/^\.$/, root.pathname.slice(slashIndex + 1)).replace(/^\.\//, "")
			var dotdot = /\/[^\/]+?\/\.{2}/g
			var pathname = path + normalized
			pathname = path + normalized
			while (dotdot.test(pathname)) pathname = pathname.replace(dotdot, "")
			pathname = pathname.replace(/\/\.\//g, "/").replace(/^(\/\.{2})+/, "") || "/"
		}
	}
	var searchEnd = hashIndex > -1 ? hashIndex : url.length
	var search = searchIndex > -1 ? url.slice(searchIndex, searchEnd) : ""
	var hash = hashIndex > -1 ? url.slice(hashIndex) : ""
	return {protocol, hostname, port, pathname, search, hash}
}
