# Flyde Example Project - Dad Jokes in your CLI

![Preview](preview.gif)

CLI tool that generates dad jokes, with a slight delay between the joke's setup and punch-line.
Built using:

- _Flyde_ ✨
- [DadJokes.io](https://dadjokes.io/) for the jokes
- Typescript

## Usage
`dad-joke [delay]`

`delay` is optional and specifies the number of milliseconds to wait before printing the punchline. If no delay is provided, the default delay of 2000 ms will be used.

## Examples
```
$ dad-joke
Why was the math book sad?
(2000 ms delay)
Because it had too many problems.

$ dad-joke 5000
Why couldn't the bicycle stand up by itself?
(5000 ms delay)
It was two-tired.
```


## Running locally

1. `yarn`
2. `yarn joke [delay]`

## Prerequisites

1. [VS Code](https://code.visualstudio.com/)
2. [Flyde VS Code Extension](https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode)
3. Yarn

---

Looking to learn more about Flyde? Visit the official website at https://www.flyde.dev
