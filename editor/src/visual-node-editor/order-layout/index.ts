import {
  Vector,
  Entity,
  vec,
  vAdd,
  vMul,
  vLen,
  vNorm,
  itrPhysics,
  totalEnergy,
  vSub,
} from "../../physics";
import { Size } from "../../utils";

export type LayoutNodeData = { [id: string]: { p: Vector; s: Size } };

export type LayoutData = {
  nodes: LayoutNodeData;
  edges: Array<[string, string]>;
};

const DAMPING = 0.5;
const VERTICAL_PUSH_FORCE = 1000;
const HORIZONTAL_PUSH_FORCE = 1000;

const IDEAL_MIN_VERTICAL_DIS = 150;
const IDEAL_MAX_VERTICAL_DIS = 200;

const MIN_HORIZONTAL_DISTANCE = 400;
const MIN_VERTCIAL_DISTANCE_TO_APPLY_HOR_DISTANCE = 80; // only if they are at least 100 pixels close we want to move them apart

const MIN_VERTICAL_DISTANCE_FOR_ALIGNING = 50;
const ALIGNMENT_FORCE = 100;

const MIN_ENERGY = 0.01;
const MAX_SPEED = 100;
const DT_SIZE = 15;

const MIN_DIS_FROM_NODE_I_TO_O = 500;

const entitiesToLayout = (entities: Entity[]): LayoutNodeData => {
  return entities.reduce((prev, curr) => {
    const topLeft = vSub(curr.p, vec(curr.s.width / 2, curr.s.height / 2));
    return { ...prev, [curr.id]: { p: topLeft, s: curr.s } };
  }, {});
};

export const orderLayout = (
  { nodes, edges }: LayoutData,
  maxItrs: number,
  onItr?: (ld: LayoutData, idx: number) => void
): LayoutData & { itrs: number; timeout: boolean; total: number } => {
  let entities = Object.entries(nodes).map(([id, value]): Entity => {
    const center = vAdd(value.p, vec(value.s.width / 2, value.s.height / 2));
    return {
      id,
      p: center,
      f: vec(0, 0),
      v: vec(0, 0),
      m: 1,
      s: value.s,
    };
  });

  let itrs = 0;
  while (itrs < maxItrs && (itrs < 2 || totalEnergy(entities) > MIN_ENERGY)) {
    // eslint-disable-next-line no-loop-func

    let ents = entities;

    for (let i = 0; i < ents.length; i++) {
      for (let j = i + 1; j < ents.length; j++) {
        if (i !== j) {
          const e1 = ents[i];
          const e2 = ents[j];

          if (!e1 || !e2) {
            continue;
          }

          const diff = vSub(e1.p, e2.p);

          const dx = Math.abs(diff.x);
          const dy = Math.abs(diff.y);

          const isE1NodeInput = e1.id.startsWith("node-input");
          const isE1NodeOutput = e1.id.startsWith("node-output");

          const isE2NodeInput = e2.id.startsWith("node-input");
          const isE2NodeOutput = e2.id.startsWith("node-output");

          // push aside those that are too close horizontally
          if (
            dx < MIN_HORIZONTAL_DISTANCE &&
            dy < MIN_VERTCIAL_DISTANCE_TO_APPLY_HOR_DISTANCE
          ) {
            const delta = MIN_HORIZONTAL_DISTANCE - dx;
            const force = delta * HORIZONTAL_PUSH_FORCE;
            e1.f = vAdd(e1.f, vec(force * 0.5, 0));
            e2.f = vAdd(e2.f, vec(force * -0.5, 0));
          }

          if (dy < MIN_VERTICAL_DISTANCE_FOR_ALIGNING) {
            const force = diff.y * ALIGNMENT_FORCE;
            e1.f = vAdd(e1.f, vec(0, force * 0.5));
            e2.f = vAdd(e2.f, vec(0, force * -0.5));
          }

          if (isE1NodeInput && isE2NodeOutput) {
            // make sure e1 is above e2
            const delta = vSub(e1.p, e2.p);

            const dy = delta.y;

            if (dy < -MIN_DIS_FROM_NODE_I_TO_O) {
              const mod = MIN_HORIZONTAL_DISTANCE - dy;

              const force = mod * ALIGNMENT_FORCE;

              e1.f = vAdd(e1.f, vec(0, force * -0.5));
              e2.f = vAdd(e2.f, vec(0, force * 0.5));
            }
          } else if (isE1NodeOutput && isE2NodeInput) {
            const delta = vSub(e1.p, e2.p);

            const dy = delta.y;

            if (dy < MIN_DIS_FROM_NODE_I_TO_O) {
              const mod = MIN_HORIZONTAL_DISTANCE - dy;

              const force = mod * ALIGNMENT_FORCE;

              e1.f = vAdd(e1.f, vec(0, force * -0.5));
              e2.f = vAdd(e2.f, vec(0, force * 0.5));
            }
          } else if (isE1NodeInput && isE2NodeInput) {
            // make sure e1 and e2 are aligned horizontal
          } else if (isE2NodeInput && isE2NodeOutput) {
            // make sure e1 and e2 are aligned horizontal
          }

          // push to middle

          const midDif = vSub(e1.p, vec(0, e1.p.y));
          // const midDif2 = vSub(e2.p, vec(0, e.p.y ));
          const distanceFromMiddle = vLen(midDif);
          const force = vMul(vNorm(midDif), distanceFromMiddle * -50);

          e1.f = vAdd(e1.f, force);
        }
      }
    }

    edges.forEach((edge) => {
      let e1 = ents.find((e) => e.id === edge[0]);
      let e2 = ents.find((e) => e.id === edge[1]);

      if (!e1 || !e2) {
        console.warn("weoops", edge[0], edge[1]);
        return;
      }

      const idealDiff = vec(0, -IDEAL_MAX_VERTICAL_DIS);

      const realDiff = vSub(e1.p, e2.p);

      const delta = vSub(idealDiff, realDiff);
      const deltaLen = vLen(delta);

      const forceMagnitude = deltaLen * VERTICAL_PUSH_FORCE;

      // only apply if it's a distancing force, not pushing
      // if (forceMagnitude > 0) {
      const force1 = vMul(vNorm(delta), forceMagnitude * 0.5);
      const force2 = vMul(vNorm(delta), forceMagnitude * -0.5);

      e1.f = vAdd(e1.f, force1);
      e2.f = vAdd(e2.f, force2);
    });

    // make the wheels of neuton turn
    ents = ents.map((ent) => {
      return itrPhysics(DT_SIZE, ent);
    });

    // damp & cap speed
    ents = ents.map((ent) => {
      const damped = vMul(ent.v, DAMPING);
      const vel =
        vLen(damped) > MAX_SPEED ? vMul(vNorm(damped), MAX_SPEED) : damped;
      return { ...ent, v: vel };
    });

    entities = ents;
    if (onItr) {
      onItr(
        {
          nodes: entitiesToLayout(ents),
          edges,
        },
        itrs
      );
    }
    itrs++;
  }

  return {
    nodes: entitiesToLayout(entities),
    edges,
    itrs,
    timeout: itrs >= maxItrs,
    total: totalEnergy(entities),
  };
};
