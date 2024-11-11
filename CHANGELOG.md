# Change Log

## 1.2.2 - 2024-11-11
- Added option to automatically align comments after opening new line with <kbd>Enter</kbd>.

## 1.2.1 - 2024-11-11
- Changed default hotkey for aligning existing comments to <kbd>Control</kbd> + <kbd>Shift</kbd> + <kbd>Space</kbd>.

## 1.2.0 - 2024-11-11
- Added functionality to auto-align existing comments to rulers.

## 1.1.1 - 2024-11-11
- Added configuration options to specify ruler locations (`rulerLocations`) and colors (`rulerColors`).

## 1.1.0 - 2024-11-07
- Inserting or removing text from a line before a comment aligned on a ruler now keeps the comment aligned to the ruler by deleting or inserting the correct amount of spaces from before the comment.

## 1.0.7 - 2024-11-06
- Fixed mistakes in documentation.

## 1.0.6 - 2024-11-05
- Default value of `startComment` is now `true`.

## 1.0.5 - 2024-11-05
- Updated documentation.

## 1.0.4 - 2024-11-05
- The cursor now jumps to the next ruler even if not currently at the end of the line.
- Added option to automatically start a comment at the next ruler.

## 1.0.3 - 2024-11-05
- Improved documentation.

## 1.0.2 - 2024-11-05
- Fixed a bug that inserted one more space than intended if no ruler was found.

## 1.0.1 - 2024-11-05
- Moved hotkey from <kbd>Tab</kbd> to <kbd>Space</kbd> to avoid conflict with VSCode autocomplete.

## 1.0.0 - 2024-11-05
- Initial release of TabRuler.