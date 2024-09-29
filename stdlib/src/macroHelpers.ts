export function replaceTemplateVars(
  obj: any,
  inputs: Record<string, string>
): any {
  if (typeof obj === "string") {
    return obj.replace(/\{\{(\w+)\}\}/g, (_, key) => inputs[key] || "");
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => replaceTemplateVars(v, inputs));
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceTemplateVars(v, inputs)])
    );
  }
  return obj;
}
