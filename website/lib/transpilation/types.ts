export interface PlaygroundFile {
  name: string;
  type: 'flyde' | 'ts';
  content: string;
  modified?: boolean;
}

export interface PlaygroundApp {
  files: PlaygroundFile[];
}

export enum PlaygroundFileType {
  FLYDE = 'flyde',
  TYPESCRIPT = 'ts',
  ENTRY_POINT = 'entry'
}