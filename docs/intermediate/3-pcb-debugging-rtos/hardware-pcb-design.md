# Hardware and PCB Design

**Who this is for**: Embedded engineers ready to move from breadboards to professional hardware implementations
**Time to complete**: 4 weeks
**Prerequisites**: Electric Circuits Principles, Breadboarding Basics, STM32 Bare-Metal Development

**Why it matters**: Breadboards are great for prototyping, but they're unreliable for final products. PCB design skills let you create reliable, reproducible hardware that can be manufactured and deployed. Every commercial embedded product uses a PCB.

---

## How this connects to embedded work

Before this module, you built circuits on breadboards—useful for experimentation but prone to loose connections, noise, and impossible to replicate reliably. After this module, you'll be able to:

- **Before**: Wire up an STM32 on a breadboard, hoping nothing comes loose
- **After**: Design a 4-layer PCB with proper power distribution, signal integrity, and manufacturing files ready for assembly

PCB design bridges firmware and hardware—you'll apply your register-level understanding of peripherals to create schematics and layout that actually work.

---

## Module structure

### Week 1 — PCB Fundamentals and Design Tools

**Core idea**: Understand what PCBs are, how they're manufactured, and learn industry-standard design software

**Key concepts to learn**:

- PCB layers: substrate, copper, solder mask, silkscreen
- Through-hole vs surface mount (SMD) components
- Software tools: KiCad (free), Altium Designer, Eagle
- PCB design workflow: schematic → footprint → layout → manufacturing

::: info Glossary: PCB-Related Terms

- **Substrate**: The insulating base material (typically FR4 fiberglass)
- **Solder mask**: Green (or other color) protective coating over copper
- **Silkscreen**: White ink printing for component labels and polarity marks
- **Via**: Plated hole connecting different copper layers
- **Annular ring**: Copper ring around a via or pad
- **Pad**: Exposed copper area for soldering components
- **Trace**: Copper line connecting components
- **Land pattern**: The copper footprint on the PCB where a component solder
  :::

**The PCB stack-up**:

```
Top Layer (Component side)
--------------------------
Prepreg (Insulating layer)
--------------------------
Inner Layer 1 (Ground plane)
--------------------------
Core (Insulating layer)
--------------------------
Inner Layer 2 (Power plane)
--------------------------
Prepreg (Insulating layer)
--------------------------
Bottom Layer (Solder side)
```

**Design rule basics**:

| Parameter           | Typical Value           | Why It Matters     |
| ------------------- | ----------------------- | ------------------ |
| Minimum trace width | 6-8 mil (0.15-0.2mm)    | Manufacturability  |
| Minimum spacing     | 6-8 mil                 | Prevents shorts    |
| Via diameter        | 0.3-0.8mm               | Depends on current |
| Pad size            | 1.2-1.5× component lead | Solderability      |

**Your first schematic in KiCad**:

1. Launch KiCad → Create new project → Open Schematic Editor
2. Place components from the library ( resistors, capacitors, ICs)
3. Wire components together using the wire tool
4. Add power symbols (VCC, GND) and labels for nets
5. Annotate components (give them reference designators R1, C1, U1)
6. Assign footprints (0402, SOIC-8, etc.)
7. Run Electrical Rules Check (ERC) to find missing connections

::: tip Pro Tip
Start with a block diagram before schematic. Know your power rails, major components, and connections first. A clean schematic prevents layout nightmares.
:::

**Check your understanding**:

- Why does a 4-layer PCB cost more than a 2-layer PCB?
- What is the difference between a via and a through-hole component pad?
- Why do you need a solder mask?

---

### Week 2 — Schematic Design and Component Selection

**Core idea**: Design a schematic that's complete, manufacturable, and accounts for real-world component behavior

**Key concepts to learn**:

- Power supply design: LDOs, DC-DC converters
- Decoupling capacitors: why, where, and what values
- Pull-up/pull-down resistors for GPIO
- Crystal oscillator selection for microcontrollers
- USB termination and ESD protection
- Datasheet reading for footprint and specifications

**Power supply design**:

```
                    5V Input
                       │
                       ▼
              ┌────────────────┐
              │   LDO 3.3V     │  (e.g., MCP1700-3302)
              │   250mA max    │
              └────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       VDD_3V3      VDD_3V3      VDD_3V3
       (MCU)        (Periph)     (Memory)
```

**Decoupling capacitor placement**:

::: warning Critical
Always place 100nF capacitors as close as possible to the VDD pin of each IC. This isn't optional—skipping them causes noise, glitches, and intermittent failures that are extremely difficult to debug.
:::

| Component       | Capacitor Placement       |
| --------------- | ------------------------- |
| MCU VDD pins    | 100nF each, within 2mm    |
| MCU VDD overall | 4.7µF to 10µF bulk nearby |
| USB data lines  | 22pF near connector       |
| Oscillator pins | 22pF near crystal         |

**Pull-up resistor calculation**:

For a GPIO input with a button to ground:

```
VCC ────────[Pull-up 10kΩ]────── GPIO
                            │
                           [Button]
                            │
                           GND
```

- When button open: GPIO reads HIGH via pull-up
- When button pressed: GPIO reads LOW, current = 3.3V/10kΩ = 330µA (safe)
- Pull-up value too high (>100kΩ): susceptible to noise
- Pull-up value too low (<1kΩ): wastes power when pressed

**Common schematic mistakes**:

| Mistake                     | Problem                | Solution                    |
| --------------------------- | ---------------------- | --------------------------- |
| No decoupling caps          | MCU resets randomly    | Add 100nF per VDD pin       |
| Wrong footprint             | Can't solder           | Verify package in datasheet |
| No series resistors on LEDs | Overcurrent            | Calculate and add ~330Ω     |
| USB without ESD protection  | Device death on unplug | Add USBLC6-2                |
| Crystal without load caps   | Won't oscillate        | Add 18-22pF caps            |

**Check your understanding**:

- Why do you need a bulk capacitor (10µF) in addition to small ceramics (100nF)?
- Calculate the pull-up resistor value for a 5V system with a button that will be read by a 3.3V MCU GPIO (hint: consider what happens when the button isn't pressed)
- What happens if you use a DC-DC boost converter instead of an LDO for a noise-sensitive analog circuit?

---

### Week 3 — PCB Layout Techniques

**Core idea**: Convert your schematic into a manufacturable, reliable PCB layout

**Key concepts to learn**:

- Component placement strategy
- Power and ground plane design
- Signal routing: impedance control, length matching
- EMI/EMC considerations
- Thermal management
- DRC (Design Rule Check) and manufacturing outputs

**Component placement**:

::: tip Placement Guidelines

1. Place power supply components first (near board edge for input connector)
2. Place the main MCU/processor centrally
3. Place connectors at board edges
4. Group related components (crystal near MCU, USB near USB lines)
5. Consider assembly: avoid placing components too close
   :::

**Power plane design**:

```
Good power distribution:

    VCC Plane ( pours and thick traces)
        │
    ┌───┴───┐
    │  MCU  │
    └───┬───┘
        │
   ┌────┴────┐
   │         │
  VDD       VDD
 (Periph)  (Flash)

Avoid this (fragmented planes):

    VCC ──── MCU ──── [broken trace] ──── Periph
```

**Critical routing rules**:

| Signal Type           | Trace Width           | Notes                |
| --------------------- | --------------------- | -------------------- |
| Power (5V, 500mA)     | 30-40 mil             | Use polygon pour     |
| Power (3.3V, 200mA)   | 20-30 mil             | Polygon pour         |
| MCU power pins        | Direct to plane       | Via directly to pad  |
| GPIO signals          | 8-12 mil              | Keep short           |
| High-speed (USB, ETH) | 10-15 mil             | Controlled impedance |
| Crystal signals       | 8 mil, matched length | Keep near MCU        |

**Ground plane rules**:

::: warning Golden Rule
Never slice up your ground plane with signal traces. A continuous ground plane provides return path for signals and shields against EMI. If you must route through a ground plane, use a via to connect top and bottom ground.
:::

**Via stitching for ground connections**:

```
Component Side Ground
    │
    ├──Via──┬──Via──┬──Via──┐
    │       │       │       │
    │    [MCU]      │       │
    │       │       │       │
    └──Via──┴──Via──┴──Via──┘
                    │
               Solder Side Ground
```

**USB differential pair routing**:

- Impedance: 90Ω differential
- Trace width/spacing calculated for your stack-up
- Length match: within 150 mil (0.15")
- Keep away from noisy signals (motor, switchmode power)
- Series resistors near the MCU (22-33Ω)

**Check your understanding**:

- Why is a continuous ground plane important for signal integrity?
- What happens if USB D+ and D- traces are mismatched by 1 inch?
- Why should you avoid 90-degree corners in high-speed routing?

---

### Week 4 — Manufacturing and Bring-Up

**Core idea**: Generate manufacturing files and bring up your first PCB

**Key concepts to learn**:

- Gerber file generation and verification
- PCB manufacturing options: 2-layer vs 4-layer, HASL vs ENIG
- PCB assembly: solder paste, reflow, hand soldering
- Bring-up procedures and debugging
- Flying probe testing

**Manufacturing file outputs**:

| File          | Extension    | Contents              |
| ------------- | ------------ | --------------------- |
| Copper layers | .gtl, .gbl   | Top/bottom copper     |
| Solder mask   | .gts, .gsb   | Green (or color) mask |
| Silkscreen    | .gto, .gbo   | Component labels      |
| Drill file    | .drl or .txt | Hole locations/sizes  |
| Drill map     | .drl         | Excellon format       |

**KiCad manufacturing output**:

```
Project → Generate Bill of Materials (BOM)
    → Plot (for Gerber files)
    → Generate Drill Files
```

**Verify your Gerbers**:

- Use a Gerber viewer (Gerbv, ViewMate, or online UCamco)
- Check for:
  - Missing copper layers
  - Drill holes aligned with pads
  - Silkscreen text not overlapping pads
  - Annular rings not too thin (< 5 mil)

**Assembly options**:

| Method          | Best For                      | Cost                     |
| --------------- | ----------------------------- | ------------------------ |
| Hand soldering  | Prototypes, through-hole only | ~$50 in tools            |
| Reflow oven     | SMD prototypes                | ~$200 (toaster oven mod) |
| Hot air station | Rework, small batches         | ~$50                     |
| Assembly house  | Production                    | $500+ depending on qty   |

**Bring-up procedure**:

::: warning Follow This Order

1. Visual inspection under magnification
2. Continuity test: check for shorts between power and ground
3. Power up with current limit: set bench supply to correct voltage, current limit to 100mA, monitor for smoke/burning smell
4. Check voltage rails with multimeter
5. Connect programmer/debugger: verify MCU is detected
6. Flash and test basic blinky
7. Test peripherals one by one
   :::

**Common bring-up failures**:

| Symptom                         | Likely Cause                      | Fix                                          |
| ------------------------------- | --------------------------------- | -------------------------------------------- |
| Current limit trips immediately | Short between power and ground    | Visual inspection, continuity test           |
| MCU not detected by programmer  | No boot voltages, bad crystal     | Check VDD, measure crystal with oscilloscope |
| Blinks but resets randomly      | Decoupling insufficient, brownout | Add caps, check VDD under load               |
| Peripherals don't work          | Wrong pin assignment, no pull-ups | Review schematic vs layout                   |

**Check your understanding**:

- What's the difference between HASL and ENIG surface finish?
- Why should you set a current limit on your bench power supply during initial bring-up?
- Your PCB has a 4-layer stackup. What files do you need to send to the manufacturer?

---

## Common misconceptions

| Misconception                               | Reality                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| "I can just copy the reference design"      | Reference designs are starting points—you need to verify for YOUR layout, load, and thermal conditions  |
| "Any trace works for power"                 | Power traces need enough width for current AND sufficient copper weight for thermal rise                |
| "Solder mask covers everything"             | Solder mask covers copper but doesn't prevent you from soldering through it during assembly             |
| "4 layers is always better than 2"          | 4-layer boards cost 2-3× more; use them only when you need controlled impedance or high-density routing |
| "The PCB manufacturer will catch my errors" | Manufacturers check format, not design—bad design means bad boards                                      |

---

## Suggested resources

### Videos

- [Hardware Design - Phil's Lab](https://www.youtube.com/playlist?list=PLP29wDx6HiE7G69fD_qXhH2V7o1vXpA1e)
- [Altium Tutorials for Beginners - Robert Feranec](https://www.youtube.com/playlist?list=PL3By7U2WnU8XyWjGf-zJ9CshxR_1m_mP_)
- [KiCad Beginner Tutorials - Contextual Electronics](https://www.youtube.com/watch?v=bb2e-2WVpHY)
- [Signal Integrity and Power Integrity - Keysight](https://www.youtube.com/watch?v=cdiYQRkpqeE)

### Reading

- [KiCad Documentation](https://docs.kicad.org/)
- [Altium Designer Getting Started](https://www.altium.com/documentation/)
- [IPC Standards Overview](https://www.ipc.org/)
- [Microchip PCB Design Guide](https://ww1.microchip.com/downloads/en/DeviceDoc/00001621C.pdf)

### Hardware

| Item                            | Notes                               |
| ------------------------------- | ----------------------------------- |
| KiCad (free)                    | Primary design tool, cross-platform |
| Benchtop mini drill             | For manual through-hole drilling    |
| Soldering iron (60W adjustable) | For hand assembly and rework        |
| USB microscope (200x)           | Essential for inspection            |
| Digital multimeter              | Verify continuity before power      |

---

## Self-check before moving on

When all skills below can be performed without looking anything up, the module is complete.

### PCB Design

1. Create a schematic in KiCad with power supply, MCU, and 3 peripherals with proper decoupling
2. Assign correct footprints (0402, SOIC, etc.) to all components
3. Design a 2-layer PCB layout with proper power and ground planes
4. Route differential USB pair with controlled impedance and length matching
5. Generate Gerber files and verify them in a Gerber viewer
6. Create a bill of materials (BOM) for assembly
7. Identify 5 common layout mistakes in a provided design
8. Calculate trace width for 500mA through a 2-layer PCB
