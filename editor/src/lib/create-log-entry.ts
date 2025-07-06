export const createLogEntry = (val: any) => {
  const time = new Date().toLocaleTimeString();
  let strVal = val;
  if (!["string", "number"].includes(typeof val)) {
    try {
      strVal = JSON.stringify(strVal);
    } catch (e) {
      console.warn("unable to stringify value", val, e);
      strVal = `Error! Unable to stringify value`;
    }
  }

  return { time, val: strVal };
};
