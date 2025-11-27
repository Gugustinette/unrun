import rootPackageJson from '../../package.json?raw'
import type {
  DirectoryNode,
  FileNode,
  FileSystemTree,
  SymlinkNode,
  WebContainer,
  WebContainerProcess,
} from '@webcontainer/api'

const fixtureFiles = import.meta.glob('../fixtures/browser-basic/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const distFiles = import.meta.glob('../../dist/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

const localPackageJson = buildLocalPackageJson(rootPackageJson)

const STREAM_CLOSE_TIMEOUT_MS = 2_000

export interface WebContainerCommandResult {
  exitCode: number
  output: string
}

export function createFixtureTree(): FileSystemTree {
  assertDistArtifacts()
  const tree: FileSystemTree = {}
  const insertFile = createFileInserter(tree)

  addFilesFromGlob(
    fixtureFiles,
    '../fixtures/browser-basic/',
    (segments, contents) => insertFile(segments, contents),
  )

  insertFile(['local-unrun', 'package.json'], localPackageJson)

  addFilesFromGlob(distFiles, '../../', (segments, contents) => {
    insertFile(['local-unrun', ...segments], contents)
  })

  return tree
}

export async function runWebContainerCommand(
  webcontainer: WebContainer,
  command: string,
  args: string[],
  label?: string,
): Promise<WebContainerCommandResult> {
  const process = await webcontainer.spawn(command, args)
  return collectProcessResult(process, label ?? command)
}

export async function collectProcessResult(
  process: WebContainerProcess,
  label?: string,
): Promise<WebContainerCommandResult> {
  const reader = process.output.getReader()
  const decoder = typeof TextDecoder === 'undefined' ? null : new TextDecoder()
  let output = ''
  let readerFinished = false

  const pumpPromise = (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          readerFinished = true
          break
        }

        const chunk =
          typeof value === 'string'
            ? value
            : (decoder?.decode(value, { stream: true }) ?? '')

        if (!chunk) {
          continue
        }

        output += chunk
        if (label) {
          console.info(`[webcontainer:${label}] ${chunk}`)
        }
      }
    } catch (error) {
      if (!isAbortError(error)) {
        throw error
      }
    } finally {
      reader.releaseLock()
    }
  })()

  const exitCode = await process.exit

  if (!readerFinished) {
    const completedNaturally = await Promise.race([
      pumpPromise
        .then(() => true)
        .catch((error) => {
          if (isAbortError(error)) {
            return true
          }
          throw error
        }),
      delay(STREAM_CLOSE_TIMEOUT_MS).then(() => false),
    ])

    if (!completedNaturally) {
      await reader.cancel().catch(() => {})
    }
  }

  await pumpPromise.catch((error) => {
    if (!isAbortError(error)) {
      throw error
    }
  })

  if (decoder) {
    output += decoder.decode()
  }

  return { exitCode, output }
}

export function assertDistArtifacts(): void {
  if (Object.keys(distFiles).length === 0) {
    throw new Error(
      '[browser-test] Missing build artifacts. Run "pnpm run build" before executing browser tests.',
    )
  }
}

export function buildLocalPackageJson(source: string): string {
  const parsed = JSON.parse(source)
  const subset = {
    name: parsed.name,
    version: parsed.version,
    type: parsed.type,
    main: parsed.main,
    module: parsed.module,
    types: parsed.types,
    exports: parsed.exports,
    bin: parsed.bin,
    files: parsed.files,
    dependencies: parsed.dependencies,
    peerDependencies: parsed.peerDependencies,
    peerDependenciesMeta: parsed.peerDependenciesMeta,
    publishConfig: parsed.publishConfig,
  }

  return `${JSON.stringify(subset, null, 2)}\n`
}

function addFilesFromGlob(
  files: Record<string, string>,
  prefixToTrim: string,
  insertFile: (segments: string[], contents: string) => void,
): void {
  for (const [absolutePath, contents] of Object.entries(files)) {
    const relativePath = normalizeGlobPath(absolutePath, prefixToTrim)
    if (!relativePath) {
      continue
    }

    insertFile(relativePath.split('/'), contents)
  }
}

function normalizeGlobPath(path: string, prefix: string): string {
  let normalized = path.replace(/\?raw$/, '')

  if (normalized.startsWith(prefix)) {
    normalized = normalized.slice(prefix.length)
  }

  return normalized.replace(/^\/+/, '')
}

function createFileInserter(tree: FileSystemTree) {
  return (segments: string[], contents: string): void => {
    const normalizedSegments = segments.filter(Boolean)
    const fileName = normalizedSegments.pop()

    if (!fileName) {
      throw new Error('Invalid path: missing file name')
    }

    let current = tree

    for (const segment of normalizedSegments) {
      const existing = current[segment]

      if (!existing) {
        current[segment] = { directory: {} }
      } else if (!isDirectoryNode(existing)) {
        throw new Error(`Expected directory at ${segment}, but found a file`)
      }

      current = (current[segment] as DirectoryNode).directory
    }

    current[fileName] = {
      file: {
        contents,
      },
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}

function isDirectoryNode(
  node: DirectoryNode | FileNode | SymlinkNode,
): node is DirectoryNode {
  return 'directory' in node && !!node.directory
}
