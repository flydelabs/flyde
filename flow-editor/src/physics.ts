import { Size } from "./utils";

export interface Vector {
  x: number;
  y: number;
}

export const size = (w: number, h: number): Size => ({ width: w, height: h });

export const vec = (x: number, y: number) => ({ x, y });

export interface Entity extends Object {
  id: string;
  p: Vector;
  v: Vector;
  m: number;
  f: Vector;
  c?: string;
  s: Size;
}

export const rnd = (top = 100, min = 0) =>
  Math.floor(Math.random() * (top - min)) + min;

export const vZero: Vector = { x: 0, y: 0 };

export const vMul = ({ x, y }: Vector, s: number): Vector => ({
  x: x * s,
  y: y * s,
});
export const vDiv = ({ x, y }: Vector, s: number): Vector =>
  vMul({ x, y }, 1 / s);
export const vAdd = (a: Vector, b: Vector) => ({ x: a.x + b.x, y: a.y + b.y });
export const vSub = (a: Vector, b: Vector) => vAdd(a, vMul(b, -1));
export const vLen = ({ x, y }: Vector): number => Math.sqrt(x * x + y * y);
export const vNorm = (a: Vector) => vDiv(a, vLen(a) || 1);

export const vToStr = ({ x, y }: Vector) => `${x.toFixed(1)},${y.toFixed(1)}`;

export const coulombs = (e1: Entity, e2: Entity, rep: number): Vector => {
  const distance = vLen(vSub(e1.p, e2.p));
  if (distance === 0) {
    const dirVector = vec(-1 + Math.random() * 2, -1 + Math.random() * 2); // some vector
    const fs = (e1.m * e2.m) / Math.pow(10, 2);
    return vMul(dirVector, fs * rep);
  } else {
    const dirVector = vNorm(vSub(e2.p, e1.p));
    const fs = (e1.m * e2.m) / Math.pow(distance + 0.1, 2);
    return vMul(dirVector, fs * rep);
  }
};

export const hookes = (
  e1: Entity,
  e2: Entity,
  minLength: number,
  maxLength: number,
  rep: number
): Vector => {
  const distance = vLen(vSub(e1.p, e2.p));
  const dirVector = vNorm(vSub(e1.p, e2.p));
  // the direction of the spring

  let displacement = 0;
  if (distance < minLength) {
    displacement = minLength - distance;
  } else if (distance > maxLength) {
    displacement = maxLength - distance;
  }

  return vMul(dirVector, rep * displacement);

  // var direction = d.normalise();

  // apply force to each end point
};

export const itrPhysics = <T extends Entity>(dt: number, e: T): T => {
  const { p, v, f, m } = e;
  const a = vDiv(f, m);
  const mod = dt / 1000;

  const newV = vAdd(vMul(a, mod), v);
  const newP = vAdd(vMul(newV, mod), p);

  return { ...(e as any), p: newP, v: newV, f: vec(0, 0) };
};

export const totalEnergy = (ents: Entity[]) => {
  return ents.reduce((prev, curr) => {
    const s = vLen(curr.v);
    return prev + 0.5 * curr.m * s * s;
  }, 0);
};
