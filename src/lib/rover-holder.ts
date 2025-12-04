import { readFileSync, existsSync } from "fs";
import { join } from "path";

const ROVER_HOLDERS_PATH = join(process.cwd(), "data", "rover-holders.csv");

let roverHolders: Set<string> | null = null;

export function loadRoverHolders(): Set<string> {
  if (roverHolders) return roverHolders;

  roverHolders = new Set();

  if (!existsSync(ROVER_HOLDERS_PATH)) {
    console.log(`[ROVER] CSV not found at ${ROVER_HOLDERS_PATH}`);
    return roverHolders;
  }

  try {
    const content = readFileSync(ROVER_HOLDERS_PATH, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());

    const hasHeader =
      lines[0]?.toLowerCase().includes("wallet") ||
      lines[0]?.toLowerCase().includes("address");
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const wallet = lines[i].trim().toLowerCase();
      if (wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet)) {
        roverHolders.add(wallet);
      }
    }

    console.log(`[ROVER] Loaded ${roverHolders.size} holders`);
  } catch (error) {
    console.error(`[ROVER] Error loading CSV:`, error);
  }

  return roverHolders;
}

export function isRoverHolder(ethAddress: string): boolean {
  if (!ethAddress) return false;
  return loadRoverHolders().has(ethAddress.toLowerCase().trim());
}
