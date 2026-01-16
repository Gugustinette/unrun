import type { OutputChunk, Plugin } from 'rolldown'

const INSPECT_HELPER_SNIPPET = `(function(){
  function __unrun__fmt(names, getter, np){
    var onlyDefault = names.length === 1 && names[0] === "default";
    var o = np ? Object.create(null) : {};
    for (var i = 0; i < names.length; i++) {
      var n = names[i];
      try { o[n] = getter(n) } catch {}
    }
    if (onlyDefault) {
      try {
          var s = JSON.stringify(o.default);
        if (s !== undefined) {
            s = s.replace(/"([^"]+)":/g, "$1: ").replace(/,/g, ", ").replace(/{/g, "{ ").replace(/}/g, " }");
          return "[Module: null prototype] { default: " + s + " }";
        }
      } catch {}
      return "[Module: null prototype] { default: " + String(o.default) + " }";
    }
    return o;
  }
  function __unrun__setInspect(obj, names, getter, np){
    try {
      var __insp = Symbol.for('nodejs.util.inspect.custom');
      Object.defineProperty(obj, __insp, {
        value: function(){ return __unrun__fmt(names, getter, np) },
        enumerable: false, configurable: true
      });
    } catch {}
    return obj;
  }
  try {
    Object.defineProperty(globalThis, "__unrun__setInspect", {
      value: __unrun__setInspect,
      enumerable: false,
    });
  } catch {}
})();`

const WRAPPER_SNIPPET = `(function __unrun__wrapRolldownHelpers(){
  if (typeof __unrun__setInspect !== "function") return;
  if (typeof __export === "function" && !__export.__unrunPatched) {
    var __unrun__origExport = __export;
    var __unrun__patchedExport = (...__unrun__args) => {
      var __unrun__target = __unrun__origExport(...__unrun__args);
      if (__unrun__target && typeof __unrun__target === "object") {
        try {
          var __unrun__map = (__unrun__args[0] && typeof __unrun__args[0] === "object") ? __unrun__args[0] : {};
          var __unrun__names = Object.keys(__unrun__map).filter(function(n){ return n !== "__esModule" });
          __unrun__setInspect(
            __unrun__target,
            __unrun__names,
            function(n){
              var getter = __unrun__map[n];
              return typeof getter === "function" ? getter() : getter;
            },
            false,
          );
        } catch {}
      }
      return __unrun__target;
    };
    __unrun__patchedExport.__unrunPatched = true;
    __export = __unrun__patchedExport;
  }
  if (typeof __exportAll === "function" && !__exportAll.__unrunPatched) {
    var __unrun__origExportAll = __exportAll;
    var __unrun__patchedExportAll = (...__unrun__args) => {
      var __unrun__target = __unrun__origExportAll(...__unrun__args);
      if (__unrun__target && typeof __unrun__target === "object") {
        try {
          var __unrun__map = (__unrun__args[0] && typeof __unrun__args[0] === "object") ? __unrun__args[0] : {};
          var __unrun__names = Object.keys(__unrun__map).filter(function(n){ return n !== "__esModule" });
          __unrun__setInspect(
            __unrun__target,
            __unrun__names,
            function(n){
              var getter = __unrun__map[n];
              return typeof getter === "function" ? getter() : getter;
            },
            false,
          );
        } catch {}
      }
      return __unrun__target;
    };
    __unrun__patchedExportAll.__unrunPatched = true;
    __exportAll = __unrun__patchedExportAll;
  }
  if (typeof __copyProps === "function" && !__copyProps.__unrunPatched) {
    var __unrun__origCopyProps = __copyProps;
    var __unrun__patchedCopyProps = (...__unrun__args) => {
      var __unrun__result = __unrun__origCopyProps(...__unrun__args);
      if (__unrun__result && typeof __unrun__result === "object") {
        try {
          var __unrun__names = Object.keys(__unrun__result).filter(function(n){ return n !== "__esModule" });
          __unrun__setInspect(__unrun__result, __unrun__names, function(n){ return __unrun__result[n] }, true);
        } catch {}
      }
      return __unrun__result;
    };
    __unrun__patchedCopyProps.__unrunPatched = true;
    __copyProps = __unrun__patchedCopyProps;
  }
})();`

const HELPER_DECLARATION_PATTERN = /__unrun__setInspect\b/
const WRAPPER_MARKER = '__unrun__wrapRolldownHelpers'

export function createConsoleOutputCustomizer(): Plugin {
  return {
    name: 'unrun-console-output-customizer',
    generateBundle: {
      handler(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue

          injectInspectHelper(chunk)
          injectHelperWrappers(chunk)
        }
      },
    },
  }
}

function injectInspectHelper(chunk: OutputChunk) {
  if (HELPER_DECLARATION_PATTERN.test(chunk.code)) return

  const codeWithHelper = chunk.code.startsWith('#!')
    ? insertAfterShebang(chunk.code, `${INSPECT_HELPER_SNIPPET}\n`)
    : `${INSPECT_HELPER_SNIPPET}\n${chunk.code}`

  chunk.code = codeWithHelper
}

function injectHelperWrappers(chunk: OutputChunk) {
  if (chunk.code.includes(WRAPPER_MARKER)) return

  const insertIndex = findRuntimeBoundary(chunk.code)
  const snippet = `${WRAPPER_SNIPPET}\n`

  if (insertIndex === -1) {
    chunk.code = `${chunk.code}\n${snippet}`
    return
  }

  chunk.code = `${chunk.code.slice(0, insertIndex)}${snippet}${chunk.code.slice(insertIndex)}`
}

function findRuntimeBoundary(code: string): number {
  const markerIndex = code.indexOf('//#endregion')
  if (markerIndex === -1) return -1
  const newlineIndex = code.indexOf('\n', markerIndex)
  return newlineIndex === -1 ? code.length : newlineIndex + 1
}

function insertAfterShebang(code: string, insertion: string): string {
  const nl = code.indexOf('\n')
  if (nl === -1) return `${code}\n${insertion}`
  return `${code.slice(0, nl + 1)}${insertion}${code.slice(nl + 1)}`
}
