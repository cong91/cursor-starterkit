#!/usr/bin/env node
import { installGlobal } from '../src/install-global.mjs'
import { printHelp, parseArgs } from '../src/cli.mjs'

async function main() {
  const cli = parseArgs(process.argv.slice(2))

  if (cli.help) {
    printHelp('cursor-starterkit')
    process.exit(0)
  }

  const command = cli.command || 'install'

  if (command === 'install') {
    await installGlobal({ yes: cli.options.yes })
    process.exit(0)
  }

  printHelp('cursor-starterkit')
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
