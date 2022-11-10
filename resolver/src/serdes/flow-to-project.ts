// import { Project, Trigger, FlydeFlow } from "@flyde/core";

// export const flowToProject = (flow: FlydeFlow): Project => {
//     // begin normalization to conventional project
//     let repo: any = {};
//     if (flow.main) {
//         repo.Main = flow.main;
//     }
//     if (flow.parts) {
//         repo = {...repo, ...flow.parts};
//     }

//     for (const key in repo) {
//         repo[key].id = key;
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
//         customRepo: repo,
//         triggers: fakeTriggersToSatisfyCurrentEditor
//     }
//     // throw 'bob'
//     return fakeProject;
// }