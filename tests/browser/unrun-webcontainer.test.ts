/// <reference lib="dom" />
import { WebContainer } from '@webcontainer/api'
import { describe, expect, it } from 'vitest'
import {
  createFixtureTree,
  runWebContainerCommand,
  type BrowserFixtureName,
} from '../utils/browser-utils'

interface BrowserFixtureTestCase {
  name: BrowserFixtureName
  label: string
  expectedOutput: string
}

const browserFixtureTestCases: BrowserFixtureTestCase[] = [
  {
    name: 'basic',
    label: 'basic usage',
    expectedOutput: '[fixture] unrun browser test',
  },
  {
    name: 'tsdown',
    label: 'tsdown build',
    expectedOutput: '[fixture] tsdown browser build',
  },
]

describe('unrun in WebContainers', () => {
  for (const { name, label, expectedOutput } of browserFixtureTestCases) {
    it(`works with ${label}`, async () => {
      const webcontainer = await WebContainer.boot()

      try {
        await webcontainer.mount(createFixtureTree(name))

        const installResult = await runWebContainerCommand(
          webcontainer,
          'npm',
          [
            'install',
            '--no-fund',
            '--no-audit',
            '--prefer-offline',
            '--progress=false',
          ],
          `install:${name}`,
        )

        if (installResult.exitCode !== 0) {
          throw new Error(
            `[browser-test] npm install failed:\n${installResult.output}`,
          )
        }

        const runResult = await runWebContainerCommand(
          webcontainer,
          'npm',
          ['run', 'start'],
          `run:${name}`,
        )

        expect(runResult.exitCode, runResult.output).toBe(0)
        expect(runResult.output).toContain(expectedOutput)
      } finally {
        webcontainer.teardown()
      }
    }, 240_000)
  }
})
