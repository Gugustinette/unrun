import type { Plugin } from 'rolldown'

/**
 * Attach a util.inspect customizer to namespace-like module objects produced by rolldown helpers
 * so console.log prints concrete values instead of [Getter], while preserving live bindings.
 *
 * Cleaner strategy: inject a tiny helper at the top of the chunk and minimally augment
 * rolldown helpers (__export and __copyProps) right inside their definitions, before use.
 */
export function createConsoleOutputCustomizer(): Plugin {
  return {
    name: 'unrun-console-output-customizer',
    generateBundle: {
      handler(_, bundle) {
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') continue

          // 1) Inject small helper once, preserving shebang position
          if (!/__unrun__setInspect\b/.test(chunk.code)) {
            const helper = [
              '(function(){',
              '  function __unrun__fmt(names, getter, np){',
              '    var onlyDefault = names.length === 1 && names[0] === "default";',
              '    var o = np ? Object.create(null) : {};',
              '    for (var i = 0; i < names.length; i++) {',
              '      var n = names[i];',
              '      try { o[n] = getter(n) } catch {}',
              '    }',
              '    if (onlyDefault) {',
              '      try {',
              '        var s = JSON.stringify(o.default);',
              '        if (s !== undefined) {',
              '          s = s.replace(/"([^"]+)":/g, "$1: ").replace(/,/g, ", ").replace(/{/g, "{ ").replace(/}/g, " }");',
              '          return "[Module: null prototype] { default: " + s + " }";',
              '        }',
              '      } catch {}',
              '      return "[Module: null prototype] { default: " + String(o.default) + " }";',
              '    }',
              '    return o;',
              '  }',
              '  function __unrun__setInspect(obj, names, getter, np){',
              '    try {',
              "      var __insp = Symbol.for('nodejs.util.inspect.custom')",
              '      Object.defineProperty(obj, __insp, {',
              '        value: function(){ return __unrun__fmt(names, getter, np) },',
              '        enumerable: false, configurable: true',
              '      })',
              '    } catch {}',
              '    return obj;',
              '  }',
              '  try { Object.defineProperty(globalThis, "__unrun__setInspect", { value: __unrun__setInspect, enumerable: false }) } catch {}',
              '})();',
            ].join('\n')
            if (chunk.code.startsWith('#!')) {
              const nl = chunk.code.indexOf('\n')
              // eslint-disable-next-line unicorn/no-negated-condition
              if (nl !== -1) {
                chunk.code = `${chunk.code.slice(0, nl + 1)}${helper}\n${chunk.code.slice(nl + 1)}`
              } else {
                chunk.code = `${helper}\n${chunk.code}`
              }
            } else {
              chunk.code = `${helper}\n${chunk.code}`
            }
          }

          // 2) Lightly augment __export
          chunk.code = chunk.code.replace(
            /var\s+__export\s*=\s*\(all\)\s*=>\s*\{([\s\S]*?)return\s+target;\s*\}/,
            (_m, body: string) => {
              const injected = [
                body,
                '  try {',
                '    var __names = Object.keys(all).filter(function(n){ return n !== "__esModule" })',
                '    __unrun__setInspect(target, __names, function(n){ return all[n]() }, false)',
                '  } catch {}',
                '  return target;',
              ].join('\n')
              return `var __export = (all) => {\n${injected}\n}`
            },
          )

          // 3) Lightly augment __copyProps
          chunk.code = chunk.code.replace(
            /var\s+__copyProps\s*=\s*\(to,\s*from,\s*except,\s*desc\)\s*=>\s*\{([\s\S]*?)return\s+to;\s*\};/,
            (_m, body: string) => {
              const injected = [
                body,
                '  try {',
                '    var __names = Object.keys(to).filter(function(n){ return n !== "__esModule" })',
                '    __unrun__setInspect(to, __names, function(n){ return to[n] }, true)',
                '  } catch {}',
                '  return to;',
              ].join('\n')
              return `var __copyProps = (to, from, except, desc) => {\n${injected}\n};`
            },
          )
        }
      },
    },
  }
}
