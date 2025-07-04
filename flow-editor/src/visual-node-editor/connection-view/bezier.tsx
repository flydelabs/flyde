export enum Position {
  Left = "left",
  Top = "top",
  Right = "right",
  Bottom = "bottom",
}

export interface GetBezierPathParams {
  sourceX: number;
  sourceY: number;
  sourcePosition?: Position;
  targetX: number;
  targetY: number;
  targetPosition?: Position;
  curvature?: number;
}

interface GetControlWithCurvatureParams {
  pos: Position;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  c: number;
}

function calculateControlOffset(distance: number, curvature: number): number {
  if (distance >= 0) {
    return 0.5 * distance;
  } else {
    return curvature * 35 * Math.sqrt(-distance);
  }
}
function calculateHorizontalOffset(distanceX: number, distanceY: number): number {
  distanceX = Math.abs(distanceX);
  distanceY = Math.abs(distanceY);

  let cx = distanceX / 2;

  if (cx < 50 && cx >= 0) {
    cx = 50;
    if (distanceY < 50) cx -= 50 - distanceY;
  }

  if (cx > 230) cx = 230;
  return cx;
}

function getControlWithCurvature({
  pos,
  x1,
  y1,
  x2,
  y2,
  c,
}: GetControlWithCurvatureParams): [number, number] {
  let ctX: number, ctY: number;
  switch (pos) {
    case Position.Left:
      ctX = x1 - calculateHorizontalOffset(x2 - x1, y2 - y1);
      ctY = y1;
      break;
    case Position.Right:
      ctX = x1 + calculateHorizontalOffset(x2 - x1, y2 - y1);
      ctY = y1;
      break;
    case Position.Top:
      ctX = x1;
      ctY = y1 - calculateControlOffset(y1 - y2, c);
      break;
    case Position.Bottom:
      ctX = x1;
      ctY = y1 + calculateControlOffset(y2 - y1, c);
      break;
  }
  return [ctX, ctY];
}

export const calcBezierPath = ({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  curvature = 0.25,
}: GetBezierPathParams): string => {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature,
  });
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature,
  });
  return `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`;
};

export function getBezierCenter({
  sourceX,
  sourceY,
  sourcePosition = Position.Bottom,
  targetX,
  targetY,
  targetPosition = Position.Top,
  curvature = 0.25,
}: GetBezierPathParams): [number, number, number, number] {
  const [sourceControlX, sourceControlY] = getControlWithCurvature({
    pos: sourcePosition,
    x1: sourceX,
    y1: sourceY,
    x2: targetX,
    y2: targetY,
    c: curvature,
  });
  const [targetControlX, targetControlY] = getControlWithCurvature({
    pos: targetPosition,
    x1: targetX,
    y1: targetY,
    x2: sourceX,
    y2: sourceY,
    c: curvature,
  });
  // cubic bezier t=0.5 mid point, not the actual mid point, but easy to calculate
  // https://stackoverflow.com/questions/67516101/how-to-find-distance-mid-point-of-bezier-curve
  const centerX =
    sourceX * 0.125 +
    sourceControlX * 0.375 +
    targetControlX * 0.375 +
    targetX * 0.125;
  const centerY =
    sourceY * 0.125 +
    sourceControlY * 0.375 +
    targetControlY * 0.375 +
    targetY * 0.125;
  const xOffset = Math.abs(centerX - sourceX);
  const yOffset = Math.abs(centerY - sourceY);
  return [centerX, centerY, xOffset, yOffset];
}
