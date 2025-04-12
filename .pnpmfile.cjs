/**
 * @see https://pnpm.io/pnpmfile
 */

function readPackage(pkg) {
  if (pkg.scripts) {
    // npm과 yarn 사용 방지를 위한 스크립트 수정
    Object.keys(pkg.scripts).forEach((scriptName) => {
      const scriptCommand = pkg.scripts[scriptName];
      if (scriptCommand.includes("npm ") || scriptCommand.includes("yarn ")) {
        pkg.scripts[scriptName] = scriptCommand
          .replace(/\bnpm\s+/g, "pnpm ")
          .replace(/\byarn\s+/g, "pnpm ");
      }
    });
  }
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
