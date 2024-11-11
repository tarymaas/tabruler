# TabRuler Extension

TabRuler allows users to jump to the next vertical ruler in VSCode by hitting the <kbd>Space</kbd> key twice in quick succession. This makes it easier to keep inline comments organized. TabRuler is especially helpful in combination with VSCode's auto-complete feature.

![](https://raw.githubusercontent.com/tarymaas/tabruler/refs/heads/main/images/example.gif)

## Features

- TabRuler finds the next ruler on double tap of <kbd>Space</kbd> and inserts as many spaces as required to reach the ruler. If no ruler is found, 2 spaces are inserted instead, as if just two spaces had been typed. Optionally, it starts a comment when jumping to the next ruler position, by inserting e. g. `//` in C/C++, `#` in Python etc.
- Comments aligned to a ruler are held aligned even if text is inserted or deleted in the line, before the comment.

![](https://raw.githubusercontent.com/tarymaas/tabruler/refs/heads/main/images/realign.gif)

## Getting Started

- Install the extension from VSCode or download from Visual Studio Marketplace.
- Set up as many rulers as you would like by specifying the `rulerLocations` configuration setting.
- Optionally, set the color of the rulers with the `rulerColors` setting. These settings edit the contents of `settings.json`.

## Extension Settings

This extension contributes the following settings:

|Setting|Default value|Description|
|-------|-----------|-----------|
|`doubleTapTime`|`200`|Time in milliseconds to detect double-tap of the <kbd>Space</kbd> key|
|`startComment`|`true`|Start a comment after jumping to the next ruler|
|`rulerLocations`|`[68, 104]`|Define the column positions of the rulers|
|`rulerColors`|`["#404040", "#404040"]`|Define the colors of the rulers|

## Hotkeys

TabRuler defines the following hotkeys to quickly access commands:
|Command|Hotkey|Command ID|
|---|---|---|
|Jump to next ruler|<kbd>Space</kbd> <kbd>Space</kbd>| `tabruler.insertSpacesToNextRuler`|
|Align comments in selected lines|<kbd>Control</kbd> + <kbd>Alt</kbd> + <kbd>Space</kbd>|`tabruler.alignCommentsWithRulers`|

## Known Issues

There are no known issues.

> **Note:** Since the extension manipulates the behavior of the <kbd>Space</kbd> key, it might conflict with other extensions or functionality utilizing <kbd>Space</kbd>.

## Release Notes

For the full release notes, see [the changelog](https://github.com/tarymaas/tabruler/blob/main/CHANGELOG.md).

## About

* The source code is available in the [GitHub repository](https://github.com/tarymaas/tabruler).