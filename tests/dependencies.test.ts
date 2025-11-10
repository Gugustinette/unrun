import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'
import { unrun } from '../src'
import { captureConsole } from './utils/capture-console'

function normalizeFileId(id: string) {
  const normalized = id.startsWith('file:') ? fileURLToPath(id) : id
  return path.normalize(normalized)
}

describe('dependencies tracking', () => {
  const cwd = process.cwd()

  const scenarios = [
    {
      name: 'collects direct dependencies',
      entry: './tests/fixtures/dependencies/direct/index.ts',
      expected: [
        'tests/fixtures/dependencies/direct/index.ts',
        'tests/fixtures/dependencies/direct/message.ts',
      ],
    },
    {
      name: 'collects nested dependencies',
      entry: './tests/fixtures/dependencies/nested/index.ts',
      expected: [
        'tests/fixtures/dependencies/nested/index.ts',
        'tests/fixtures/dependencies/nested/feature.ts',
        'tests/fixtures/dependencies/nested/utils/helper.ts',
      ],
    },
    {
      name: 'collects shared dependencies without duplicates',
      entry: './tests/fixtures/dependencies/shared/index.ts',
      expected: [
        'tests/fixtures/dependencies/shared/index.ts',
        'tests/fixtures/dependencies/shared/a.ts',
        'tests/fixtures/dependencies/shared/b.ts',
        'tests/fixtures/dependencies/shared/common.ts',
      ],
    },
    {
      name: 'ignore npm dependencies',
      entry: './tests/fixtures/dependencies/npm/index.ts',
      expected: [],
    },
  ]

  for (const scenario of scenarios) {
    test(scenario.name, async () => {
      let module
      let dependencies: string[] = []

      await captureConsole(async () => {
        const { module: tempModule, dependencies: tempDependencies } =
          await unrun({ path: scenario.entry })
        module = tempModule
        dependencies = tempDependencies
      })

      expect(module).toBeDefined()

      const normalizedFiles = dependencies.map((id) => normalizeFileId(id))
      const expectedFiles = scenario.expected.map((relative) =>
        normalizeFileId(path.resolve(cwd, relative)),
      )

      for (const expected of expectedFiles) {
        expect(normalizedFiles).toContain(expected)
      }

      expect(new Set(normalizedFiles).size).toBe(normalizedFiles.length)
    })
  }
})
