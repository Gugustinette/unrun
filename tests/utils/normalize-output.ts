export function normalizeOutput(
  str: string,
  cwd: string,
  root: string,
): string {
  const normCwd = cwd.replaceAll('\\', '/')
  const normRoot = root.replaceAll('\\', '/')
  return (
    `${str}\n`
      .replaceAll('\n\t', '\n')
      .replaceAll('\\', '/')
      .split(normCwd)
      .join('<cwd>')
      .split(normRoot)
      .join('<root>')
      // remove line:column numbers in stack-like messages
      .replaceAll(/:(\d+):(\d+)([\s')])/g, '$3')
      // node:internal becomes internal in some node versions
      .replaceAll(/node:(internal|events)/g, '$1')
      .replaceAll('.js)', ')')
      .replaceAll('file:///', 'file://')
      .replaceAll(/Node\.js v[\d.]+/g, 'Node.js v<version>')
      .replaceAll(/ParseError: \w:\/:\s+/g, 'ParseError: ')
      .replaceAll('TypeError [ERR_INVALID_ARG_TYPE]:', 'TypeError:')
      .replaceAll('eval_evalModule', 'evalModule')
      .replaceAll(/\(node:\d+\)/g, '(node)')
      // Node 18 diffs
      .replaceAll(
        '  ErrorCaptureStackTrace(err);',
        "validateFunction(listener, 'listener');",
      )
      .replaceAll('internal/errors:496', 'events:276')
      .replaceAll('    ^', '  ^')
      .replaceAll('ExperimentalWarning: CommonJS module', '')
      // strip ANSI
      // eslint-disable-next-line no-control-regex
      .replaceAll(/\u001B\[[\d;]*m/gu, '')
      // Replace any absolute path (with or without file:///) to a placeholder
      .replaceAll(/(?:file:\/\/\/)?\/?(?:[A-Za-z]:)?(?:\/[\w.-]+)+/g, '<path>')
      .trim()
  )
}
