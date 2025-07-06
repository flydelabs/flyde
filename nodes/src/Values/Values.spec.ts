// import {
//   ResolvedFlydeRuntimeFlow,
//   dynamicNodeInput,
//   eventually,
//   execute,
//   randomInt,
// } from "@flyde/core";
// import { assert } from "chai";

// import { spiedOutput } from "@flyde/core/dist/test-utils";

// // ugly hack to avoid a circular dependency with resolver
// import { resolveFlowByPath } from "../../../resolver/dist";

// describe.only("Values", () => {
//   describe("Code Expression", () => {
//     it("evaluates simple code", async () => {
//       const resolvedFlow = resolveFlowByPath(
//         __dirname + "/Fixture1.flyde",
//         "implementation"
//       ) as ResolvedFlydeRuntimeFlow;

//       const [s, output] = spiedOutput();

//       const input = dynamicNodeInput();

//       execute({
//         node: resolvedFlow.main,
//         outputs: { output },
//         inputs: { input },
//         resolvedDeps: resolvedFlow.dependencies,
//         ancestorsInsIds: "bob",
//       });
//       input.subject.next("");

//       await eventually(() => {
//         assert.equal(s.callCount, 1);
//         assert.equal(s.lastCall.args[0], 2);
//       });
//     });

//     it("evaluates expressions with inputs", async () => {
//       const resolvedFlow = resolveFlowByPath(
//         __dirname + "/Fixture2.flyde",
//         "implementation"
//       ) as ResolvedFlydeRuntimeFlow;

//       const [s, output] = spiedOutput();

//       const input = dynamicNodeInput();

//       execute({
//         node: resolvedFlow.main,
//         outputs: { output },
//         inputs: { input },
//         resolvedDeps: resolvedFlow.dependencies,
//         ancestorsInsIds: "bob",
//       });
//       input.subject.next(2);

//       await eventually(() => {
//         assert.equal(s.callCount, 1);
//         assert.equal(s.lastCall.args[0], 4);
//       });
//     });

//     it("evaluates expressions that use execution context", async () => {
//       const resolvedFlow = resolveFlowByPath(
//         __dirname + "/Fixture3.flyde",
//         "implementation"
//       ) as ResolvedFlydeRuntimeFlow;

//       const [s, output] = spiedOutput();

//       const input = dynamicNodeInput();

//       const magicNumber = randomInt(1000);

//       execute({
//         node: resolvedFlow.main,
//         outputs: { output },
//         inputs: { input },
//         resolvedDeps: resolvedFlow.dependencies,
//         ancestorsInsIds: "bob",
//         extraContext: { magicNumber },
//         onBubbleError: (e) => {
//           throw e;
//         },
//       });
//       input.subject.next(2);

//       await eventually(() => {
//         assert.equal(s.callCount, 1);
//         assert.equal(s.lastCall.args[0], 2 + magicNumber);
//       });
//     });
//   });
// });
