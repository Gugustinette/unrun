/// <reference lib="dom" />
import { WebContainer } from '@webcontainer/api'
import { describe, expect, it } from 'vitest'
import {
  createFixtureTree,
  runWebContainerCommand,
} from '../utils/browser-utils'

describe('unrun in WebContainers', () => {
  it('works with basic usage', async () => {
    const webcontainer = await WebContainer.boot()

    try {
      await webcontainer.mount(createFixtureTree())

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
        'install',
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
        'run',
      )

      expect(runResult.exitCode, runResult.output).toBe(0)
      expect(runResult.output).toContain('[fixture] unrun browser test')
    } finally {
      webcontainer.teardown()
    }
  }, 240_000)
})
