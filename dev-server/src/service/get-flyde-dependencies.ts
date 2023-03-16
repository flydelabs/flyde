import * as pkgUp from "pkg-up";

const FLYDE_PACKAGE_PATTERN = /^\@flyde\/(.*)/;
const FLYDE_LIBRARY = /^flyde[-_](.*)/;

export const getFlydeDependencies = async (rootPath: string) => {
    const pjsonPath = await pkgUp({ cwd: rootPath });
  
    if (!pjsonPath) {
      return []; // no package.json found
    }
    
    const { dependencies, devDependencies } = require(pjsonPath);
    const combinedDeps = { ...dependencies, ...devDependencies };
  
    const depKeys = Object.keys(combinedDeps) || [];
    return depKeys.filter((dep) => {
      return dep.match(FLYDE_PACKAGE_PATTERN) || dep.match(FLYDE_LIBRARY);
    });
  };
  