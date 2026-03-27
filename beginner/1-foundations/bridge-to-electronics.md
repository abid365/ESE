# Bridge to Electronics Fundamentals

**Who this is for**: Junior developers who've completed the calculus and circuit laws modules.  
**Time to complete**: ~3 weeks, 1–2 hours per day.  
**Goal**: Move from abstract circuit theory to real component-level intuition. By the end, you should be able to look at a schematic and understand _why_ each part is there — not just what it's called.

---

## Why component-level understanding matters

Microcontrollers don't exist in isolation. Every GPIO pin connects to something — a resistor, a sensor, a transistor, a relay. When firmware behaves unexpectedly, the bug is often not in your code but in the circuit surrounding the MCU. A floating pin, a missing decoupling capacitor, a diode wired backwards — these cause behaviour that no amount of debugging in software will fix.

This module gives you the vocabulary and intuition to read hardware the same way you read code.

**Videos**:
- [Electronic Basics - GreatScott!](https://www.youtube.com/playlist?list=PLgyFKdJBORkkC3KmqeNFLgXaAvMaJFlh-)
- [Make: Electronics](https://www.youtube.com/results?search_query=Make+Electronics+tutorial)

---

## Resistors

### What they actually do

A resistor opposes the flow of current. That one property makes them useful in almost every circuit. The governing relationship is Ohm's Law:

<KatexMath :expression="'V = IR'" :displayMode="true" />

where $V$ is voltage across the resistor, $I$ is current through it, and $R$ is resistance in ohms.

### Current limiting — protecting your GPIO

Every MCU datasheet specifies a maximum current per GPIO pin — typically 8–20 mA. An LED forward voltage is around 2V; if you connect it directly to a 3.3V pin with no resistor, the current is limited only by the LED's internal resistance, which is tiny. The LED (or the pin) burns out.

With a series resistor, you control the current precisely:

<KatexMath :expression="'R = \\frac{V_{\\text{supply}} - V_f}{I_{\\text{desired}}}'" :displayMode="true" />

For a 3.3V supply, a red LED with <KatexMath expression="V_f = 2.0\,\text{V}" />, and a target of 10 mA:

<KatexMath expression="R = \frac{3.3 - 2.0}{0.010} = 130\,\Omega" :displayMode="true" />

You'd pick the nearest standard value — 150Ω.

### Voltage dividers — scaling signals down

Two resistors in series create a predictable fraction of the supply voltage at their midpoint:

<KatexMath expression="V_{\text{out}} = V_{\text{in}} \cdot \frac{R_2}{R_1 + R_2}" :displayMode="true" />

**Embedded use case**: Your MCU's ADC accepts 0–3.3V, but you want to measure a 0–5V sensor output. A voltage divider with <KatexMath expression="R_1 = 20\,\text{k}\Omega" /> and <KatexMath expression="R_2 = 33\,\text{k}\Omega" /> scales the signal into a safe range. This is one of the most common interface circuits in embedded design.

**Important caveat**: Voltage dividers only work correctly into high-impedance loads like an ADC input. If you try to draw current from the midpoint, the output voltage sags — the ratio changes and your reading becomes inaccurate. This is why they're never used as power supplies.

### Pull-up and pull-down resistors

When a GPIO is configured as an input and nothing is actively driving it, the pin is _floating_ — it picks up noise and reads random values. A pull-up or pull-down resistor ties the pin to a defined logic level when the line is idle.

**Pull-up**: resistor between the pin and VCC. Idle state is HIGH. A button press pulls it LOW.  
**Pull-down**: resistor between the pin and GND. Idle state is LOW. A button press pulls it HIGH.

Most MCUs have configurable internal pull-ups (typically 10–50 kΩ), but external ones give you tighter control — relevant for I²C bus lines, open-drain outputs, and long wire runs.

---

## Capacitors

### What they actually do

A capacitor stores charge. Unlike a battery, it charges and discharges nearly instantaneously — which makes it useful not for energy storage but for _timing_ and _noise rejection_. The stored charge relationship:

<KatexMath expression="Q = CV" :displayMode="true" />

where $Q$ is charge in coulombs, $C$ is capacitance in farads, and $V$ is voltage across the capacitor.

The defining behaviour is that a capacitor _resists change in voltage_. It cannot instantaneously change its voltage — it must charge or discharge through whatever resistance is in the circuit. This RC time constant governs how fast:

<KatexMath expression="\tau = RC" :displayMode="true" />

After one time constant, a charging capacitor reaches about 63% of the supply voltage. After five time constants, it's considered fully charged (≈99%).

### Decoupling capacitors — the most important capacitor you'll ever place

When your MCU switches states — toggling a GPIO, starting a peripheral, executing a burst of instructions — it draws a brief spike of current from the supply rail. If that current has to travel far from the power supply, the inductance of the PCB trace causes the voltage to momentarily dip. This glitch can corrupt registers, cause resets, or introduce noise into ADC readings.

A decoupling capacitor (typically 100nF ceramic) placed physically close to each power pin of the MCU provides a local charge reservoir. It supplies that burst of current instantly, before the main supply can respond.

**Rule of thumb**: Place a 100nF capacitor within 1–2mm of every VCC/VDD pin. Add a bulk 10µF electrolytic or tantalum somewhere on the board for slower transients. This is not optional — it is one of the first things a hardware engineer checks when debugging erratic MCU behaviour.

### Filtering — smoothing noisy signals

A low-pass RC filter attenuates high-frequency noise on a signal line. The cutoff frequency is:

<KatexMath expression="f_c = \frac{1}{2\pi RC}" :displayMode="true" />

**Embedded use case**: Analog sensor outputs often carry high-frequency noise from switching regulators or electromagnetic interference. A simple RC filter before the ADC input removes that noise while preserving the slow-changing physical signal you care about. Choose $R$ and $C$ so that <KatexMath expression="f_c" /> is well above the highest frequency in your signal but well below the noise frequency.

### Timing circuits

In combination with a resistor, a capacitor creates predictable delay. Many embedded timing ICs — the classic 555 timer, for example — use the RC time constant to set oscillator frequency or one-shot pulse width. Even if you never use a discrete timer IC, understanding this relationship is essential for reading datasheets that specify timing in terms of external RC components.

---

## Diodes

### What they actually do

A diode allows current to flow in one direction only — from anode to cathode. In the forward direction, it conducts once the voltage across it exceeds the _forward voltage_ <KatexMath expression="V_f" /> (typically 0.6–0.7V for silicon, ~2–3V for LEDs depending on colour). In reverse, it blocks current up to its _reverse breakdown voltage_.

### Reverse polarity protection

If a user plugs a battery in backwards, an unprotected circuit can instantly destroy the MCU. A series diode in the power path blocks reverse current entirely. The cost is a <KatexMath expression="V_f" /> drop on the supply rail — acceptable in many cases, or avoidable by using a P-channel MOSFET for near-zero drop protection.

### Flyback diodes — protecting against inductive loads

Inductors (coils, relays, motor windings) resist changes in current. When you switch off a relay coil, the collapsing magnetic field generates a voltage spike — potentially 50–100V in the reverse direction. This spike will destroy a transistor or MCU pin driving the load.

A flyback diode placed across the inductive load — cathode toward the positive rail — provides a path for this current to safely dissipate. Any time your firmware switches a relay or motor driver, a flyback diode is mandatory in the hardware design.

### LEDs as indicators

An LED is a diode that emits light when forward biased. Always pair with a current-limiting resistor (see resistor section). The colour determines <KatexMath expression="V_f" />: red ≈ 2.0V, green ≈ 2.1V, blue/white ≈ 3.0–3.3V. At 3.3V logic, a blue LED with no resistor is essentially shorted — current would be enormous.

---

## Transistors

### What they actually do

A transistor is a current-controlled (BJT) or voltage-controlled (MOSFET) switch. The core problem they solve: an MCU GPIO pin can source or sink only a few milliamps. A motor might need 500mA. A relay coil needs 50–100mA. A transistor lets that small GPIO signal control a much larger load current.

### BJT (NPN) as a switch

In saturation (fully on), the collector-emitter path acts like a closed switch. The base current controls it:

<KatexMath expression="I_C = \beta \cdot I_B" :displayMode="true" />

where <KatexMath expression="\beta" /> (hFE) is the transistor's current gain, typically 100–300 for small-signal BJTs.

**Embedded use case**: Driving a relay coil (50mA) from a GPIO (8mA max). With a 2N2222 (<KatexMath expression="\beta \approx 200" />), a base resistor that allows 1mA of base current gives 200mA of collector current — more than enough. Calculate the base resistor:

<KatexMath expression="R_B = \frac{V_{\text{GPIO}} - V_{BE}}{I_B} = \frac{3.3 - 0.7}{0.001} = 2.6\,\text{k}\Omega" :displayMode="true" />

Use 2.7kΩ. Add a flyback diode across the relay coil. This is a complete, safe relay driver.

### MOSFET as a switch

MOSFETs are voltage-controlled — the gate draws essentially no current in steady state, which makes them more GPIO-friendly for many applications. An N-channel MOSFET switches on when <KatexMath expression="V_{GS}" /> exceeds the gate threshold voltage <KatexMath expression="V_{th}" />, typically 1–4V.

**Logic-level MOSFETs** are specifically rated to turn on fully with a 3.3V or 5V gate signal — critical for direct MCU control. A standard MOSFET might need 10V on the gate to reach full conduction. Always check <KatexMath expression="V_{GS(th)}" /> and <KatexMath expression="R_{DS(on)}" /> at your gate voltage in the datasheet.

**When to use MOSFET over BJT**: higher currents, higher efficiency (lower on-resistance means less heat), PWM control of motors, and whenever gate drive current from the MCU is a constraint.

---

## Hands-on prototyping workflow

Understanding component equations is necessary but not sufficient. The only way to build real intuition is to build circuits, measure them, and compare what you expected to what you actually see.

**Step 1 — Calculate before building.** Before touching the breadboard, work out expected voltages and currents. If you're building an LED circuit, calculate the resistor. If it's a filter, calculate the cutoff frequency.

**Step 2 — Build on a breadboard.** Breadboards let you iterate without soldering. Keep wiring neat — spaghetti wiring causes intermittent connections and makes debugging harder.

**Step 3 — Measure with a multimeter.** Check DC voltages at key nodes. Compare to your calculated values. A 10–20% discrepancy is normal due to component tolerances; larger gaps usually point to a wiring error or a wrong assumption.

**Step 4 — Probe with an oscilloscope if available.** A multimeter can't show you transients, switching noise, or signal shape. Even a cheap USB oscilloscope (~$20–30) is transformative for embedded debugging — it makes decoupling effects, PWM waveforms, and I²C bus traffic visible.

**Step 5 — Iterate.** Change one thing at a time. If behaviour doesn't match expectation, form a hypothesis before touching anything. Debugging by random component swapping teaches you nothing.

---

## Suggested resources

### Start here — practical and visual

**Make: Electronics** (Charles Platt)  
The best first book for this stage. Experiments-first approach — you build before you fully understand, then the explanation follows. Chapters 1–6 cover everything in this module with hands-on exercises. Read this before opening anything else.

**GreatScott! — Electronic Basics** (YouTube)  
Short, focused videos (5–10 min each) on individual components. Watch the episode on a component _after_ reading the corresponding section here — you'll get more from it with context already in place. Particularly useful: resistors, capacitors, MOSFETs, and transistor as a switch.

### Go deeper when you hit a specific problem

**The Art of Electronics** (Horowitz and Hill)  
The canonical reference. Extraordinarily detailed, but not a learning book — it's what you open when you have a specific problem and need a rigorous answer. Don't read it cover to cover at this stage. Useful sections: Chapter 1 (foundations), Chapter 2 (BJTs), Chapter 3 (MOSFETs).

**Practical Electronics for Inventors** (Scherz and Monk)  
A solid middle ground. Better as a second book — once you've built some circuits and want more rigorous explanations than Make: Electronics provides, but aren't ready for The Art of Electronics.

### For schematic reading practice

Find the datasheet for any MCU you plan to use (STM32, ATmega, RP2040) and locate the reference schematic in the hardware design guide. Every component on that schematic — the decoupling caps, the pull-up resistors on reset, the crystal load capacitors — is explained by something in this module. Try to explain each part before reading the accompanying notes.

---

## Self-check before moving on

You're ready for the next module when you can answer all of these without looking anything up:

<SelfCheckList 
  storageKey="bridge-to-electronics-selfcheck"
  :items='[
    { id: 1, label: "A 3.3V GPIO drives a green LED /V_f = 2.1\\,V/ at 10mA. What resistor value do you use?" },
    { id: 2, label: "What does a decoupling capacitor do, and where physically should it be placed on a PCB?" },
    { id: 3, label: "Your ADC reads 0–3.3V but your sensor outputs 0–5V. Sketch the voltage divider and calculate /R_1/ and /R_2/." },
    { id: 4, label: "A relay coil draws 80mA. Your GPIO can source 8mA. What component do you add, and what else must you include to protect it?" },
    { id: 5, label: "What is a flyback diode and when is it mandatory?" },
    { id: 6, label: "What is the RC time constant /tau/ and what does it determine in a filter circuit?" }
  ]'
/>
