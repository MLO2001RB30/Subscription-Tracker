#!/usr/bin/env node
const semver = process.versions.node.split(".");
const major = Number(semver[0]);
const allowedMajors = new Set([18, 20]);
if (allowedMajors.has(major)) {
  process.exit(0);
}
const message = `\nSubTrackDK requires Node.js 18 LTS or 20 LTS.\nYou are running Node.js ${process.version}.\nPlease switch to a supported Node version before continuing.\nSee NODE_VERSION_FIX.md for detailed instructions.\n`;
console.error(message);
process.exit(1);
