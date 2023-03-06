---
sidebar_position: 6
---

# Creating New Code Parts

While Flyde is a great tool for creating flows, sometimes you need to do something that is not possible with the built-in components.
Code parts allow you to create custom components using TypeScript or JavaScript. Inside Code parts you can use any library you want.

To create a new code part, you need to:
1. Create a new file ending with `.flyde.ts` (or `.flyde.js` if you prefer JavaScript)
2. Export an object that adheres to the [CodePart](/docs/api-reference/interfaces/CodePart.md) interface. Actually, you can return as many code parts as you want from a single file

The `.flyde.[j|t]s` ending hints the Flyde editor to look for code parts in this file, and suggest them inside the "add part" menu.

## Example

Let's say we want create a scraping part that uses [Scrape-it](https://www.npmjs.com/package/scrape-it). We can create a new file called `scrape-it.flyde.ts` and add the following code:

```ts
import { CodePart } from "@flyde/core";
import scrapeIt from "scrape-it";

export const scrapeItPart: CodePart = {
  name: "Scrape It",
  description: "Scrapes a website",
  inputs: {
    url: {
      type: "string",
      description: "The URL to scrape",
    },
    options: {
        type: "object",
        description: "The options to pass to scrape-it",
    }
  },
  outputs: {
    data: {
      type: "object",
      description: "The scraped data",
    },
  },
  async fn(inputs) {
    const data = await scrapeIt(inputs.url, inputs.options);

    return {
      data,
    };
  },
};
```

Then, you should be able to use it in your flows!


