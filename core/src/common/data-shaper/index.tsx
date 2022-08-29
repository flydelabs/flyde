export enum DataShapeType {
  STRING = 0,
  NUMBER = 1,
  BOOLEAN = 2,
  ARRAY = 3,
  OBJECT = 4,
  NULL = 5,
}

const typeToShaperType = {
  string: DataShapeType.STRING,
  number: DataShapeType.NUMBER,
  boolean: DataShapeType.BOOLEAN,
  object: DataShapeType.OBJECT,
  array: DataShapeType.ARRAY,
  null: DataShapeType.NULL,
};

const typeofWithNull = (v: any) => {
  return v === null ? "null" : typeof v;
};

export type DataShaperOptions = {
  maxDepth: number;
  maxArrayCheckIdx: number;
};

const sortObject = (o) =>
  Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});

export type DataShape = DataShapeType | DataShape[] | {[key: string]: DataShape};

export const dataShaper = (data: any, maxDepth = 5, maxArrayCheckIdx = 5): DataShape => {
  const type = typeofWithNull(data);
  if (type === "object") {
    // if data is an array
    if (Array.isArray(data)) {
      if (maxDepth > 1) {
        return data
          .filter((_, i) => i < maxArrayCheckIdx)
          .map((v) => dataShaper(v, maxDepth - 1, maxArrayCheckIdx));
      } else {
        return typeToShaperType["array"];
      }
    }
    if (maxDepth > 1) {
      const shape: any = {};
      for (const key in data) {
        shape[key] = dataShaper(data[key], maxDepth - 1, maxArrayCheckIdx);
      }
      return sortObject(shape);
    } else {
      return typeToShaperType["object"];
    }
  }
  return typeToShaperType[type];
};
