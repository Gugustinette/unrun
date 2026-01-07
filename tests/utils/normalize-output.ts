const SPECIAL_REGEX_CHARS = /[.*+?^${}()|[\]\\]/g

function escapeRegExp(value: string): string {
  return value.replaceAll(SPECIAL_REGEX_CHARS, String.raw`\$&`)
}

function replacePathLike(
  input: string,
  target: string,
  replacement: string,
): string {
  if (!target) return input

  const flags = /^[A-Z]:\//i.test(target) ? 'gi' : 'g'
  const escapedTarget = escapeRegExp(target)
  const slashPattern = String.raw`\/+`
  const flexibleSlashes = escapedTarget.replaceAll('/', slashPattern)
  return input.replace(new RegExp(flexibleSlashes, flags), replacement)
}

function replacePath(
  input: string,
  target: string,
  replacement: string,
): string {
  if (!target) return input

  return /^[A-Z]:\//i.test(target)
    ? replacePathLike(input, target, replacement)
    : input.split(target).join(replacement)
}

export function normalizeOutput(
  str: string,
  cwd: string,
  root: string,
): string {
  const normCwd = cwd.replaceAll('\\', '/')
  const normRoot = root.replaceAll('\\', '/')

  const normalizeAbsolutePath = (match: string): string => {
    let value = match

    if (value.startsWith('file:///')) value = value.slice('file:///'.length)
    else if (value.startsWith('file://')) value = value.slice('file://'.length)

    value = value.replaceAll('\\', '/')
    value = value.replaceAll(/\/{2,}/g, '/')

    // Some Node versions format file URLs as `file://Users/...` (no leading slash)
    if (!value.startsWith('/') && !/^[A-Z]:\//i.test(value)) value = `/${value}`

    const isWindowsPath = /^[A-Z]:\//i.test(value)
    const normCwdForCompare = isWindowsPath ? normCwd.toLowerCase() : normCwd
    const normRootForCompare = isWindowsPath ? normRoot.toLowerCase() : normRoot
    const valueForCompare = isWindowsPath ? value.toLowerCase() : value

    if (normCwdForCompare && valueForCompare.startsWith(normCwdForCompare)) {
      return `<cwd>${value.slice(normCwd.length)}`
    }

    if (normRootForCompare && valueForCompare.startsWith(normRootForCompare)) {
      return `<root>${value.slice(normRoot.length)}`
    }

    return match
  }

  let normalized = `${str}\n`.replaceAll('\n\t', '\n').replaceAll('\\', '/')

  normalized = replacePath(normalized, normCwd, '<cwd>')
  normalized = replacePath(normalized, normRoot, '<root>')

  return (
    normalized
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
      // Replace repo absolute paths, but keep repo-relative segments when possible
      .replaceAll(
        /(?:file:\/\/\/|file:\/\/)?\/?(?:[A-Z]:)?(?:\/[\w.-]+)+/gi,
        normalizeAbsolutePath,
      )
      .trim()
  )
}
