To generate tracks that authentically capture the *Lotus III* vibe, you need to avoid "generic" AI music generators (like Udio or Suno) because they tend to produce modern, over-produced MP3s. To get the **Patrick Phelan** or **Barry Leitch** sound, you need **Symbolic AI**—AI that generates *instructions* (MIDI) rather than *audio*.

Here is the recommended workflow to replicate that 90s Euro-synth-pop sound:

### 1. The "Logic-First" Method: Aiva or MusicLM (MIDI Export)

The goal is to generate the "skeleton" of the song without the AI choosing the instruments.

* **Step:** Use an AI like **Aiva** or **LALAM.AI**. Set the style to "Synthwave" or "Euro-Pop" and the tempo to **130–140 BPM**.
* **The Key:** Only export the **MIDI file**.
* **Why:** This gives you the notes, the 16th-note basslines, and the soaring melodies, but lets *you* control the "crunchy" DOS-era sounds later.

### 2. The "Chiptune" Specialized Method: BeepBox / NeuroScribe

There are AI-assisted tools specifically designed for retro gaming.

* **Tool:** **BeepBox** (Open Source). While not "pure" AI, you can use procedural generation patterns within it to create "FM Synthesis" style tracks.
* **Workflow:** Set the scale to **Minor** (Lotus music is rarely "happy" major key; it's driving and "cool"). Use the "FM" or "Chip" presets.
* **Result:** You get a file that sounds exactly like a SoundBlaster card from 1992.

### 3. The "Transfer" Method: AI Style Transfer

If you have a modern melody but want it to sound like *Lotus III*:

* **Tool:** **Google Magenta (NSynth)**.
* **Method:** Take a modern synth recording and use "Style Transfer" using a sample of a **Yamaha OPL3** (the DOS sound chip).
* **Result:** It will morph the texture of your modern song into the metallic, thin, "chirpy" quality of the original game.

---

### The Recommended "Hybrid" Workflow

If I were building a *Lotus III* clone today, this is the exact technical path I would take to generate "Infinite Lotus Music":

1. **Generate MIDI via AI:** Use **Mubert** or **Aiva** to generate 10–20 "90s Arcade Racing" MIDI files.
2. **Filter the "Lotus" Hooks:** Edit the MIDI to ensure the bassline is doing a "Slap Bass" pattern (alternating octaves).
3. **The "Sound Engine":** Use the open-source **ADLMIDI** library.
4. **The Soundbank:** Load the **original OPL3 patches** (often found in `.WOPL` files).
* *This is the "Secret Sauce."* By playing AI-generated MIDI through the exact instrument definitions used in 1992, the result is indistinguishable from the original game.



### Technical Parameters to give the AI:

When prompting an AI for these tracks, use these specific descriptors:

> *"140 BPM, 90s Euro-Dance, 16-bit FM Synthesis, driving syncopated slap-bass, soaring sawtooth lead melody, gated reverb drums, minor key, cinematic racing energy."*

---

**Would you like me to find an open-source library of "OPL3 Patches" that you can use to make any MIDI sound like it’s coming straight out of a 1992 DOS PC?**