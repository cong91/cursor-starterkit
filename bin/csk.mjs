#!/usr/bin/env node
import { installProject } from '../src/install-project.mjs'
import { printHelp, parseArgs } from '../src/cli.mjs'

async function main() {
  const cli = parseArgs(process.argv.slice(2))

  if (cli.help) {
    printHelp('csk')
    process.exit(0)
  }

  const command = cli.command || 'install'

  if (command === 'install') {
    const result = await installProject({
      cwd: process.cwd(),
      yes: cli.options.yes,
      forceMemory: cli.options.forceMemory,
      forceRules: cli.options.forceRules,
      noBeads: cli.options.noBeads,
    })
    process.exit(result.cancelled ? 1 : 0)
  }

  printHelp('csk')
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
