export function parseArgs(argv) {
  const args = [...argv]
  const help = args.includes('--help') || args.includes('-h')
  const command = args.find((arg) => !arg.startsWith('-')) || null

  const getFlagValue = (name) => {
    const prefix = `${name}=`
    const inline = args.find((arg) => arg.startsWith(prefix))
    if (inline) return inline.slice(prefix.length)
    const index = args.indexOf(name)
    if (index >= 0 && index + 1 < args.length) return args[index + 1]
    return null
  }

  return {
    help,
    command,
    args,
    options: {
      yes: args.includes('--yes'),
      forceMemory: args.includes('--force-memory'),
      forceRules: args.includes('--force-rules'),
      noBeads: args.includes('--no-beads'),
      globalOnly: args.includes('--global-only'),
      projectOnly: args.includes('--project-only'),
      scope: getFlagValue('--scope'),
    },
  }
}

export function printHelp(binName) {
  const isGlobal = binName === 'cursor-starterkit'
  console.log(`${binName} [command]\n`)
  console.log('Commands:')
  if (isGlobal) {
    console.log('  install    Install global Cursor baseline into ~/.cursor/')
  } else {
    console.log('  install    Install project overlay into .cursor/ in current repo')
  }
  console.log('  --help, -h Show help')
  if (!isGlobal) {
    console.log('\nNote: the recommended way to install a project overlay is the /init')
    console.log('      slash command inside Cursor — it runs this installer for you.')
    console.log('\nProject install flags (used internally by /init):')
    console.log('  --yes           Apply without confirmation')
    console.log('  --force-memory  Regenerate existing memory files')
    console.log('  --force-rules   Regenerate existing project rules')
    console.log('  --no-beads      Skip beads (.beads/) initialization')
  }
  if (isGlobal) {
    console.log('\nGlobal install flags:')
    console.log('  --yes           Non-interactive install')
  }
}
