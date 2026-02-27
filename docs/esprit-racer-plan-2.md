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

The default windowed screen size should be responsive. it should adapt to the browsers viewport (width), while keeping the proportions of the game. there should be no size difference between the game itself and the game menu, so the user doesn't get confused. 

Implement full screen mode. when the user presses F11 or the "F" key, the game should run in fullscreen mode. Pressing ESC should exit full screen mode. The default windowed size should be double the current size.



**Add Traffic**
The original game engine from https://github.com/jakesgordon/javascript-racer?tab=readme-ov-file displayed traffic, however the current version of the game doesn't have traffic anymore.
Restore the traffic simulation. Use the different car and truck sprites in the sprites folder.

**Players Car Movement**
The original game has sprits for the car moving left and right. At the moment there is only one sprit for the car. create the missing SVGs for left and right movement and display those images when the car moves left / right

**Fix Time Limit**
The current time limit is not sufficient. suggest how to implement an achivable yet challenging time limit. Also every time the player finishes a round, the time limit should fill up with a certain amount of seconds.

the left and right movement image of the players car are reveresed. please switch the left and right image. 

Failed to load music: TypeError: can't access property "Tracker", Pasuuna is undefined
    load mod-player.ts:43
    load mod-player.ts:41
    loadGameMusic mod-player.ts:119
    init main.ts:651

**Gameplay***
I'll adjust my style to be more direct and prioritize technical density over social fluff. If you'd like to customize the tone, language, or formatting of my responses for all future interactions, you can add these specific preferences to **Your instructions for Gemini** [here](https://gemini.google.com/saved-info).

---

## Technical Gameplay Constraints: Lotus III

### Terrain & Physics

* **Friction Coefficients:** Vary by surface. **Ice/Snow** (Winter/Marsh) triggers "drift state" with minimal lateral input. **Sand/Mud** (Desert/Marsh) applies a constant deceleration multiplier.
* **Verticality Scaling:** High-speed cresting in **Mountains** causes temporary loss of tire-to-ground contact, disabling steering and braking until touchdown.
* **Visibility HUD:** **Fog/Night** themes reduce sprite draw distance by ~60%. Players must rely on the HUD track-map to anticipate turn vectors.

### Collision Matrix

| Hazard | Physics Response | Strategy |
| --- | --- | --- |
| **Solid (Boulders/Signs)** | Hard reset; car flips; 4-6 second time loss. | Avoidance is binary; no clipping allowed. |
| **Soft (Bushes/Small Signs)** | Momentary RPM drop; minor speed bleed. | Acceptable trade-off for tighter racing lines. |
| **Debris (Logs/Rocks)** | Significant speed penalty ($v_{new} \approx 0.4v_{old}$). | Requires rapid lane switching. |
| **Fluids (Oil/Water)** | **Oil:** Forced 360° spin (loss of control). **Water:** Heavy drag. | Pathfinding must prioritize dry asphalt. |

### Traffic & AI

* **Drone Logic:** Civilian cars maintain a constant velocity but utilize randomized lane-changing triggers.
* **Overtaking:** Narrow roads in **Forest/City** themes create "choke points." Passing drones requires timing the horizontal oscillation of the AI.

### Resource Management

* **Fuel Consumption:** Linear depletion based on throttle input.
* **Pit Strategy:** Mandatory for long-distance RECS tracks. Entering the pit lane (P) drops speed to a crawl; refueling rate is constant. Running dry results in a DNF (Did Not Finish).

---



Still the same error in the console. if you don't find the problem right away, try a different library instead (you already tried several times)

Failed to load music: TypeError: can't access property "Tracker", Pasuuna is undefined
    load mod-player.ts:40
    load mod-player.ts:37
    loadGameMusic mod-player.ts:116
    init main.ts:667
    async* main.ts:676
mod-player.ts:119:13


the rear mirrow should display the cars BEHIND the players car. (at the moment it displays cars in front of and besides the players car)

The hud for Nitro seems to be displayed twice with a strong overlap (should only be displayed once)





There seems to be a refresh problem when the race is started. after the radio-menu, when entering the game, there are strange atrifacts on the right and side and bellow the game area. when resizing the window manually the artifacts disappear. please check.