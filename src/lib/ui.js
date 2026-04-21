export function printHelp() {
  console.log(`creator-cli

Usage:
  creator init
  creator topic <idea> [--platform <name>] [--niche <name>] [--tone <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator outline <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator draft <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator title <idea> [--platform <name>] [--audience <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator profile [show]
  creator profile set <key> <value>
  creator profile provider <name> [--enable] [--disable] [--model <id>] [--baseUrl <url>] [--apiKeyEnv <env>]
  creator library [list]
  creator library add <pillar|banned|series> <value>
  creator library remove <pillar|banned|series> <value>
  creator providers list
  creator providers use <name>
  creator providers test [name] [--model <id>] [--no-live]
  creator voice list
  creator voice init <name>
  creator voice show [name]
  creator voice use <name>
  creator voice train <name> <path>
  creator voice edit [name] <field> <value>
  creator voice audit [name] <file-or-text>
  creator voice improve [name] <file-or-text>
  creator repurpose <source> [--to <platform>] [--provider <name>] [--model <id>] [--voice <name>]
  creator calendar <theme> [--days <count>] [--platform <name>] [--provider <name>] [--model <id>] [--voice <name>]
  creator chat
  creator help
`);
}

export function printError(message) {
  console.error(`Error: ${message}`);
}

export function printSuccess(message) {
  console.log(message);
}

export function printWarning(message) {
  console.warn(`Warning: ${message}`);
}
