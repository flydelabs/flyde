import { assert } from "chai";
import { DataShape, dataShaper, DataShapeType } from ".";

describe("data shaper", () => {
  it("returns shape of simple data", () => {
    assert.equal(dataShaper(1), DataShapeType.NUMBER);
    assert.equal(dataShaper("bob"), DataShapeType.STRING);
    assert.equal(dataShaper(false), DataShapeType.BOOLEAN);
    assert.equal(dataShaper(null), DataShapeType.NULL);
  });

  it("returns object and list data, respecting max depth", () => {
    assert.equal(dataShaper({ a: 1 }, 1), DataShapeType.OBJECT);
    assert.deepEqual(dataShaper({ a: 1 }, 2), { a: DataShapeType.NUMBER });
    assert.deepEqual(dataShaper({ a: { b: 2 }, list: [1, 2] }, 2), {
      a: DataShapeType.OBJECT,
      list: DataShapeType.ARRAY,
    });
  });

  it("returns array data, respecting array check", () => {
    assert.deepEqual(dataShaper([1, 2, 3], 5, 3), [
      DataShapeType.NUMBER,
      DataShapeType.NUMBER,
      DataShapeType.NUMBER,
    ]);
    assert.deepEqual(dataShaper([1, 2, 3], 5, 2), [DataShapeType.NUMBER, DataShapeType.NUMBER]);
    assert.deepEqual(dataShaper([1, 2, 3], 5, 1), [DataShapeType.NUMBER]);
    assert.deepEqual(dataShaper([1, 2, 3], 5, 99), [
      DataShapeType.NUMBER,
      DataShapeType.NUMBER,
      DataShapeType.NUMBER,
    ]);
  });

  it("returns shape of more complex data", () => {
    const data = {
      a: 1,
      name: "gabi",
      occupation: {
        name: "developer",
        company: "google",
      },
      favoriteNumbers: [1, 2, null, 3],
      aTuple: [42, "bob"],
      aTriple: ["Lala", { name: "Bob" }, 42],
    };
    const shape = dataShaper(data);

    const aTriple: DataShape =  [DataShapeType.STRING, { name: DataShapeType.STRING }, DataShapeType.NUMBER];

    const expected: DataShape =  {
      a: DataShapeType.NUMBER,
      aTuple: [DataShapeType.NUMBER, DataShapeType.STRING] as any,
      aTriple: [DataShapeType.STRING, { name: DataShapeType.STRING }, DataShapeType.NUMBER] as any,
      name: DataShapeType.STRING,
      occupation: {
        name: DataShapeType.STRING,
        company: DataShapeType.STRING,
      },
      favoriteNumbers: [
        DataShapeType.NUMBER,
        DataShapeType.NUMBER,
        DataShapeType.NULL,
        DataShapeType.NUMBER,
      ],
    };

    assert.deepEqual(shape, {
      a: DataShapeType.NUMBER,
      aTuple: [DataShapeType.NUMBER, DataShapeType.STRING],
      aTriple: [DataShapeType.STRING, { name: DataShapeType.STRING }, DataShapeType.NUMBER],
      name: DataShapeType.STRING,
      occupation: {
        name: DataShapeType.STRING,
        company: DataShapeType.STRING,
      },
      favoriteNumbers: [
        DataShapeType.NUMBER,
        DataShapeType.NUMBER,
        DataShapeType.NULL,
        DataShapeType.NUMBER,
      ],
    } as DataShape);

  });
  it('returns the shape keys in alphabetical order', () => {
    const shape = dataShaper({b: 2, z: {dave: 2, alice: 7}, abbie: 5});
    assert.deepEqual(Object.keys(shape), ['abbie', 'b', 'z']);
  })
});
