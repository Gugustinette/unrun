import { pathToFileURL } from "node:url";

//#region rolldown:runtime
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function() {
	return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

//#endregion
//#region tests/fixtures/jiti/error-runtime/index.ts
var require_error_runtime = /* @__PURE__ */ __commonJS({ "tests/fixtures/jiti/error-runtime/index.ts": (() => {
	const __unrun_filename = "/Users/augustinmercier/Desktop/unrun/tests/fixtures/jiti/error-runtime/index.ts";
	const __unrun_dirname = "/Users/augustinmercier/Desktop/unrun/tests/fixtures/jiti/error-runtime";
	try {
		if (!("filename" in import.meta)) Object.defineProperty(import.meta, "filename", {
			value: __unrun_filename,
			configurable: true
		});
	} catch {}
	try {
		if (!("dirname" in import.meta)) Object.defineProperty(import.meta, "dirname", {
			value: __unrun_dirname,
			configurable: true
		});
	} catch {}
	try {
		Object.defineProperty(import.meta, "url", {
			value: pathToFileURL(__unrun_filename).href,
			configurable: true
		});
	} catch {}
	try {
		Object.defineProperty(import.meta, "resolve", {
			value: (s) => {
				try {
					const base = pathToFileURL(__unrun_filename);
					return new URL(s, base).href;
				} catch {
					return s;
				}
			},
			configurable: true
		});
	} catch {}
	throw new Error("test error");
}) });

//#endregion
export default require_error_runtime();

export {  };