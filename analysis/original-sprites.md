***Can i view the original textures? what format do they have?**

Yes, you can view the original textures, but you'll have to do a little bit of "digital archeology." In the early 90s, games didn't use standard formats like PNG or JPG; they used formats optimized for the limited RAM and CPU power of the time.

For *Lotus III: The Ultimate Challenge* on DOS, the graphics are stored inside the files you'll find after extracting your `.IMG`.

### 1. The File Formats

If you look inside the game folder, you will likely see these extensions:

* **`.LBM` or `.BBM` (Deluxe Paint):** This is the most common format for Gremlin Graphics games. It stands for **Interleaved Bitmap**. It was the industry standard on the Amiga and ported to DOS. These files contain the UI, menus, and sometimes large background elements.
* **`.SPR` or `.DAT` (Custom Sprite Sheets):** Many of the "in-race" sprites (like the car from different angles and the roadside trees) are packed into custom binary blobs to make them faster for the game engine to read.
* **`.PAL` (Palette Files):** Since the game uses **indexed color** (usually 256 colors), the actual "color information" is often stored in a separate palette file. If you open a texture without the correct palette, it will look like "rainbow static" or neon garbage.

### 2. How to View Them

Since standard Windows or Mac viewers can't read these, you'll need specialized retro-tools:

* **GrafX2 (Recommended):** This is a free, open-source bitmap editor specifically designed for retro enthusiasts. It can natively open `.LBM` and `.BBM` files and correctly handle their 256-color palettes.
* **IrfanView:** A classic Windows image viewer. With its "Plugins" pack installed, it can open most `.LBM` files from the DOS era.
* **Tiled:** If you discover that the track elements are stored as tiles, **Tiled** is an open-source map editor that can help you reassemble them.

### 3. The "Sprite Sheet" Challenge

In *Lotus III*, the car isn't a 3D model; it’s a series of 2D drawings. To replicate the turning animation, the game developers drew the car at multiple angles:

If you find a `.BBM` file that looks like a giant grid of cars, you have found the **Sprite Sheet**. To use these in your JavaScript or Godot engine:

1. Open the `.BBM` in **GrafX2**.
2. Save it as a **PNG** (this converts the old format to a modern one while keeping the pixels perfect).
3. Ensure the background color is set to **Transparent**.

### 4. Technical Note on Palettes

If the images look "wrong" (e.g., the red car looks blue), it’s because the `.LBM` file isn't loading the correct **Global Palette**. You may need to find a `.PAL` file in the game directory and "Apply Palette" inside your image editor to see the true colors.

***Here is a rough breakdown of what you'll find inside the .IMG***

1. The Car Sprites (The Bulk)

The most asset-heavy part of the game is the cars. Since they aren't 3D models, every angle must be drawn as a separate sprite.

    Player Cars: There are 3 cars (Esprit S4, Elan SE, and M200 Concept). Each car has roughly 15–20 frames for the main driving animations (turning left/right, leaning, etc.).

    Opponent Cars: There are several variations of AI cars.

    Total: You are looking at roughly 100–150 individual sprites just for the vehicles.

2. The Scenery Objects (Track-side)

These are the sprites that "zoom" past you to create the illusion of speed.

    Scenarios: The game has 13 distinct themes (Snow, Desert, Forest, Fog, Marsh, Future, etc.).

    Objects: Each theme has roughly 5–10 unique objects (trees, cacti, road signs, rocks, lamp posts).

    Total: Approximately 80–130 scenery sprites.

3. Backgrounds and UI

    Parallax Backgrounds: Each of the 13 scenarios has a "backdrop" (the mountains or city skyline in the distance). These are usually large, wide .BBM or .LBM images.

    UI Elements: The "Lotus" steering wheel, the dashboard, the CD player interface, and the RECS track editor menus.

    Intro/Outro: Full-screen title images and the "ending" screens.

    Total: Roughly 30–50 large bitmap files.

4. The RECS System (Procedural Data)

It's important to note that Lotus III doesn't have "3 trillion" image files. It has a small set of tileable road textures (straight, curve, hill). The RECS engine then mathematically stretches and bends these few textures to create the tracks on the fly.
Total Rough Count:

If you were to extract everything and save it as modern PNGs, you would end up with:

    ~250–300 Sprite Frames (Cars and obstacles)

    ~20–30 Large Background/UI Images

    13-15 Palette Files (.PAL)