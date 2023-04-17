// import { Project, Trigger, FlydeFlow } from "@flyde/core";

// export const flowToProject = (flow: FlydeFlow): Project => {
//     // begin normalization to conventional project
//     let resolvedParts: any = {};
//     if (flow.main) {
//         resolvedParts.Main = flow.main;
//     }
//     if (flow.parts) {
//         resolvedParts = {...resolvedParts, ...flow.parts};
//     }

//     for (const key in resolvedParts) {
//         resolvedParts[key].id = key;
//     }

//     const fakeTriggersToSatisfyCurrentEditor: Trigger[] = [
//         {
//             "id": "not-relevant",
//             "type": "rest-api",
//             "data": {
//               "path": "/",
//               "method": "GET"
//             },
//             "partId": "Main"
//           }
//     ]

//     const fakeProject: Project = {
//         id: 'pseudo-proj',
//         authorId: 'system',
//         created: Date.now(),
//         updated: Date.now(),
//         name: 'pseudo-proj',
//         slug: '/pseudo-proj',
//         resolvedParts: resolvedParts,
//         triggers: fakeTriggersToSatisfyCurrentEditor
//     }
//     // throw 'bob'
//     return fakeProject;
// }
