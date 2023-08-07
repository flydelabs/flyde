// import { Project, Trigger, FlydeFlow } from "@flyde/core";

// export const flowToProject = (flow: FlydeFlow): Project => {
//     // begin normalization to conventional project
//     let resolvedNodes: any = {};
//     if (flow.main) {
//         resolvedNodes.Main = flow.main;
//     }
//     if (flow.parts) {
//         resolvedNodes = {...resolvedNodes, ...flow.parts};
//     }

//     for (const key in resolvedNodes) {
//         resolvedNodes[key].id = key;
//     }

//     const fakeTriggersToSatisfyCurrentEditor: Trigger[] = [
//         {
//             "id": "not-relevant",
//             "type": "rest-api",
//             "data": {
//               "path": "/",
//               "method": "GET"
//             },
//             "nodeId": "Main"
//           }
//     ]

//     const fakeProject: Project = {
//         id: 'pseudo-proj',
//         authorId: 'system',
//         created: Date.now(),
//         updated: Date.now(),
//         name: 'pseudo-proj',
//         slug: '/pseudo-proj',
//         resolvedNodes: resolvedNodes,
//         triggers: fakeTriggersToSatisfyCurrentEditor
//     }
//     // throw 'bob'
//     return fakeProject;
// }
