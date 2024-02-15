# Contributing to Flyde

Flyde is an open-source, visual programming language. It runs in the IDE, integrates with existing TypeScript code, both browser and Node.js.

The [Open Source Guides](https://opensource.guide/) website has a collection of resources for individuals, communities, and companies. These resources help people who want to learn how to run and contribute to open source projects. Contributors and people new to open source alike will find the following guides especially useful:

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Building Welcoming Communities](https://opensource.guide/building-community/)

## Get involved

There are many ways to contribute to Flyde, and many of them do not involve writing any code. Here's a few ideas to get started:

- Simply start using Flyde. Go through the [Getting Started](https://www.flyde.dev/docs/) guide. Does everything work as expected? If not, we're always looking for improvements. Let us know by [opening an issue](#reporting-new-issues).
- Look through the [open issues](https://github.com/flydelabs/flyde/issues). A good starting point would be issues tagged [good first issue](https://github.com/flydelabs/flyde/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22). Provide workarounds, ask for clarification, or suggest labels. Help [triage issues](#triaging-issues-and-pull-requests).
- If you find an issue you would like to fix, [open a pull request](#pull-requests).
- Read through our [documentation](https://www.flyde.dev/docs). If you find anything that is confusing or can be improved, you can make edits by clicking "Edit this page" at the bottom left of the page.
- Take a look at the [features requested](https://github.com/flydelabs/flyde/issues?q=is%3Aopen+is%3Aissue+label%3A%22feature+request%22) by others in the community and consider opening a pull request if you see something you want to work on.

Contributions are very welcome. If you think you need help planning your contribution, please ping us on Discord at [flyde.dev/discord](https://www.flyde.dev/discord) and let us know you are looking for a bit of help.

### Triaging issues and pull requests

One great way you can contribute to the project without writing any code is to help triage issues and pull requests as they come in.

- Ask for more information if you believe the issue does not provide all the details required to solve it.
- Flag issues that are stale or that should be closed.
- Ask for test plans and review code.

## Bugs

We use [GitHub issues](https://www.flyde.dev/flydelabs/flyde/issues) for our public bugs. If you would like to report a problem, take a look around and see if someone already opened an issue about it. If you are certain this is a new unreported bug, you can submit a [bug report](#reporting-new-issues).

If you have questions about using Flyde, contact us on Discord at [flyde.dev/chat](https://flyde.dev/chat), and we will do our best to answer your questions.

If you see anything you'd like to be implemented, create a [feature request issue](https://github.com/flydelabs/flyde/issues/new?template=feature_request.yml)

### Reporting new issues

When [opening a new issue](https://github.com/flydelabs/flyde/issues/new/choose), always make sure to fill out the issue template. **This step is very important!** Not doing so may result in your issue not being managed in a timely fashion. Don't take this personally if this happens, and feel free to open a new issue once you've gathered all the information required by the template.

- **One issue, one bug:** Please report a single bug per issue.
- **Provide reproduction steps:** List all the steps necessary to reproduce the issue. The person reading your bug report should be able to follow these steps to reproduce your issue with minimal effort. If possible, use the [Playground](https://play.flyde.dev) to create your reproduction.

## Pull requests

### Proposing a change

If you would like to request a new feature or enhancement but are not yet thinking about opening a pull request, you can also file an issue with [feature template](https://github.com/flydelabs/flyde/issues/new?template=feature_request.yml).

If you're only fixing a bug, it's fine to submit a pull request right away, but we still recommend that you file an issue detailing what you're fixing. This is helpful in case we don't accept that specific fix but want to keep track of the issue.

Small pull requests are much easier to review and more likely to get merged.

### Pre-requisites

1. Ensure you have [pnpm](https://pnpm.io/installation) installed. After cloning the repository, run `pnpm install`.
2. Ensure you have [VSCode](https://code.visualstudio.com/) installed.
3. Ensure you have enabled the `code` command in your PATH. You can do this by opening the Command Palette (Ctrl+Shift+P) and searching for "Shell Command: Install 'code' command in PATH".
4. Clone https://github.com/flydelabs/flyde-vscode and make sure it is next to the `flyde` repository. For example, if you cloned `flyde` in `~/projects/flyde`, clone `flyde-vscode` in `~/projects/flyde-vscode`. This is a temporary hack until https://github.com/flydelabs/flyde-vscode/issues/10 is done.

### Running Locally

Run `pnpm start` - this will open VSCode with the main workspace, and also open the extension's development instance.

Note: this is still early days for Flyde, therefore issues running Flyde locally are expected. Please ping us on Discord at [flyde.dev/discord](https://www.flyde.dev/discord) if you need help. Any question or issue you have is valuable to us and will help us document the process better.

### Creating a branch

Fork [the repository](https://github.com/flydelabs/flyde) and create your branch from `main`. If you've never sent a GitHub pull request before, you can learn how from [this free video series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github).

### Testing

A good test plan has the exact commands you ran and their output, provides screenshots or videos if the pull request changes UI.

- If you've changed APIs, update the documentation.

#### Running tests

- To run test, run `pnpm test`.

### Sending your pull request

Please make sure the following is done when submitting a pull request:

1. Describe your **test plan** in your pull request description. Make sure to test your changes.
1. Make sure your code builds (`pnpm build`).
1. Make sure your tests pass (`pnpm test`).

All pull requests should be opened against the `main` branch. Make sure the PR does only one thing, otherwise please split it. If this change should contribute to a version bump, run `npx changeset` at the root of the repository after a code change and select the appropriate packages.

#### Breaking changes

When adding a new breaking change, follow this template in your pull request:

```md
### New breaking change here

- **Who does this affect**:
- **How to migrate**:
- **Why make this breaking change**:
- **Severity (number of people affected x effort)**:
```

## License

By contributing to Flyde, you agree that your contributions will be licensed under its [license](https://github.com/flydelabs/flyde/blob/master/LICENSE.md).

## Questions

Feel free to ask in `#contributing` on [Discord](https://www.flyde.dev/chat) if you have questions about our process, how to proceed, etc.
