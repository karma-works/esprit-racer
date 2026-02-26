**Main Menu**
The menu still looks blury, please check. 
The main menu should work as follows: With the arrow keys, the user can move the selection (red box), pressing enter or space executes the corresponding action e.g. Start. Mouse over also leads to the red box. pressing the left mouse button instantly executes the corresponding action at the mouse position. modify the the menu svg if necessary (remove red box / display red box on hover / cursor key selection). Pressing start leads to the radio menu.

**Radio**
as soon as the player selects to start the challenge, the radio channel selection appears. implement the radio channel page using music-selection.svg pressing space or enter in the music-selection menu should start the game. left / right should select the mod which is played during the game.


implement the HUD
## **User Interface (HUD)**

The screen is bordered by several gameplay indicators in a blocky, white font:

* **Top Left:** Displays `016 KMH`, indicating a very low current speed. Below this is a **gray progress bar** with a small red section filled in.
* **Middle Left:** Large text displays `1ST`, indicating the player's current race position.
* **Top Right:** A status bar showing a mostly green meter with a small red section.
* **Middle Right:** The number `20` is displayed above a small icon consisting of four horizontal bars (likely representing remaining "boosts" or lives).
* **Rear-view Mirror:** A rectangular box in the upper right quadrant shows a simplified view of what is behind the player—specifically a red car and green grass.



**Fix music playback**
Failed to load music: TypeError: PasuunaPlayer is not a constructor
    load mod-player.ts:41
    load mod-player.ts:39
    loadGameMusic mod-player.ts:110
    init main.ts:498
    async* main.ts:507
mod-player.ts:113:13


**Screen size**

Implement full screen mode. when the user presses F11 or the "F" key, the game should run in fullscreen mode. Pressing ESC should exit full screen mode. The default windowed size should be double the current size.



**Add Traffic**
The original game engine from https://github.com/jakesgordon/javascript-racer?tab=readme-ov-file displayed traffic, however the current version of the game doesn't have traffic anymore.
Restore the traffic simulation. Use the different car and truck sprites in the sprites folder.

**Players Car Movement**
The original game has sprits for the car moving left and right. At the moment there is only one sprit for the car. create the missing SVGs for left and right movement and display those images when the car moves left / right

**Fix Time Limit**
The current time limit is not sufficient. suggest how to implement an achivable yet challenging time limit. Also every time the player finishes a round, the time limit should fill up with a certain amount of seconds.