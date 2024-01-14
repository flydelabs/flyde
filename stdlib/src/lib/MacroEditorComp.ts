// TODO - move to core

export interface MacroEditorCompProps<T> {
  value: T;
  onChange: (value: T) => void;
}

export interface MacroEditorComp<T> extends React.FC<MacroEditorCompProps<T>> {}
