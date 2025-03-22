declare module "*.flyde" {
  type VisualNode = import("@flyde/core").VisualNode;

  const data: { node: VisualNode };
  export default data;
}

declare module "@flyde/stdlib/dist/all-browser";
