import { assert } from "chai";
import { compileObjectTemplate, compileStringTemplate } from ".";

describe("value builder", () => {
  it("compiles string templates", () => {
    const template = "hello ${user}!";
    const inputs = { user: "bob" };
    const result = compileStringTemplate(encodeURIComponent(template), inputs);
    assert.equal(result, "hello bob!");
  });

  it("compiles object templates", () => {
    const template = {
      bob: "$${inner}",
      name: "${name}",
    };

    const inputs = { inner: { age: 8 }, name: "hi" };
    const result = compileObjectTemplate(
      encodeURIComponent(JSON.stringify(template)),
      inputs
    );

    assert.equal(result.bob.age, 8);
    assert.equal(result.name, "hi");
  });

  it("works with line breaks in objects", () => {
    const template = {
      a: "${a}",
      b: "${b}",
    };

    const a = `
    
    hi
    `;

    const b = "bob\nbob";

    const inputs = {
      a,
      b,
    };

    const result = compileObjectTemplate(
      encodeURIComponent(JSON.stringify(template)),
      inputs
    );

    assert.equal(result.a, a);
    assert.equal(result.b, b);
  });

  it("works with double quotes", () => {
    const template = {
      a: "${a}",
      b: "${b}",
      c: "${c}",
    };

    const a = `"bob"`;
    const b = '"bob"';
    const c = '"bob"';

    const inputs = {
      a,
      b,
      c,
    };

    const result = compileObjectTemplate(
      encodeURIComponent(JSON.stringify(template)),
      inputs
    );

    assert.equal(result.a, a);
    assert.equal(result.b, b);
    assert.equal(result.c, c);
  });
});
