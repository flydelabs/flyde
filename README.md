# Flyde - Visual Programming Inside VSCode

_"The world is asynchronous - don't try to force the systems we build into a synchronous framework!" - J. Paul Morisson R.I.P_

Flyde is a visual functional reactive flow-based programming tool that can be used to build anything from CLI tools to bots and webapps built. It comes with a [VSCode extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode) that allows you to create Flyde flows from within your editor, and integrate them to your codebase using the runtime library.

Checkout the official website at [flyde.dev](https://www.flyde.dev) or the [examples](/examples) folder for more information

**Note:** Flyde is still WIP and is not intended for production use (_yet_)

---

![A dad joke cli tool built with Flyde](/examples/dad-jokes-cli/preview.gif)

## License

Everything needed to run a Flyde file is _MIT_ licensed. That includes:

- `@flyde/core`
- `@flyde/resolver`
- `@flyde/runtime`
- `@flyde/stdlib`

The UI library, and other parts of the toolkit are GNU AGPLv3 licensed.

In other words, using Flyde flows in your software is permitted without any limitation. However, if you use Flyde's visual editor in your own work, it must be open-sourced as well. More about [GNU APGLv3](https://choosealicense.com/licenses/agpl-3.0/) here

## FAQ

### Is this production ready?

No. Not yet. Flyde hasn't been truly battle-tested other than some internal use-cases. However, if interest and usage grows there is absolutely no reason for Flyde to stay an experimental tool. If you're using Flyde for anything that received real traffic please let me know! I'd love to chat.

### Does it replace normal coding?

No. There many things textual coding shines at. Algorithms for example would be a nightmare to build using Flyde.
However, orchestrating 3 async APIs with a bit of transformation logic using Flyde feels just natural.
Flyde is built to integrate with your existing code, not replace it.

### What about performance?

Flyde is not optimized yet for runtime performance, nor was benchmarked. This means it should be slower than writing regular code. Just like JS is slower than C. That's the cost of abstractions. However, there are many possible ideas to improving it's performance, so it's safe to say performance will improve drastically in the future.

### What languages are supported?

Currently only JavaScript and TypeScript are supported. However, because Flyde's a higher level abstraction, I see no real logical barrier in adding support for other languages in the future.

### Why did you build this?

Spending several years drawing and reviewing software design in whiteboards caused me to start dreaming of a small "run" button on the corner of whiteboard. Modern development consisted of a lot of "glue" code, lot's of concurrency, asynchronicity and third party apis. I find it hard to believe that developers will code the same way in 10 years, and I'm sure we're ready for the next abstraction. Flyde is my attempt to make that happen, and lower the barrier for developers to write complex software, just like Assembly did to [punched cards programming](https://en.wikipedia.org/wiki/Computer_programming_in_the_punched_card_era), and C did to Assembly.
