import { ensureWorkspace } from "../lib/storage.js";
import { printSuccess } from "../lib/ui.js";

export async function runInit() {
  const workspace = await ensureWorkspace();
  printSuccess(`Initialized creator workspace at ${workspace.creatorDir}`);
  printSuccess(`Provider config: ${workspace.providersPath}`);
}
