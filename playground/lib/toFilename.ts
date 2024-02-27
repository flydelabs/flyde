import { AppFile, AppFileType } from "@/components/AppView";

export function toFilename(appFile: AppFile) {
  if (appFile.type === AppFileType.ENTRY_POINT) {
    return "index.ts";
  } else {
    return `${appFile.name}.${appFile.type}`;
  }
}
