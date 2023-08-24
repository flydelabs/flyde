declare module "*.flyde" {
  type FlydeFlow = import("@flyde/core").FlydeFlow;
  type ResolvedDependencies = import("@flyde/core").ResolvedDependencies;

  const classes: { dependencies: ResolvedDependencies; flow: FlydeFlow };
  export default classes;
}

declare module "@flyde/stdlib/dist/all-browser";
