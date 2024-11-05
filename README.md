# TabRuler extension

TabRuler allows users to jump to the next vertical ruler in VSCode by hitting the `Space` key twice in quick succession. This makes it easier to keep inline comments organized. TabRuler is especially helpful in combination with VSCode's auto-complete feature.

![](https://raw.githubusercontent.com/tarymaas/tabruler/refs/heads/main/images/example.gif)

## Features

- TabRuler finds the next ruler on double tap of `Space` and inserts as many spaces as required to reach the ruler. If no ruler is found, 2 spaces are inserted instead, as if just two spaces had been typed.
- Optionally, TabRuler starts a comment when jumping to the next ruler position, by inserting e. g. `// ` in C/C++, `# ` in Python etc.

## Extension Settings

This extension contributes the following settings:

* `tabruler.doubleTapTime`: Time in milliseconds to detect double-tap of the space key (default: `200 ms`).
* `tabruler.startComment`: Start a comment after jumping to the next ruler (default: `true`).

## Known Issues

There are no known issues yet, but since the extension manipulates the behavior of the `Space` key, it might conflict with other extensions or functionality utilizing `Space`.

## Release Notes

For the full release notes, see [the changelog](https://github.com/yourusername/tabruler/blob/main/CHANGELOG.md).

## About

* [GitHub repository](https://github.com/yourusername/tabruler)