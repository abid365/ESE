# Principles of Electric Circuits: The Laws of Physics

<CoursePlayer 
  videoSrc="https://www.w3schools.com/html/mov_bbb.mp4"
  storageKey="foundations-electric-circuits"
  :lessons="[
    { title: 'Overview', link: '/docs/beginner/1-foundations/' },
    { title: 'Basic Calculus', link: '/docs/beginner/1-foundations/basic-calculus' },
    { title: 'Electric Circuits Principles', link: '/docs/beginner/1-foundations/electric-circuits-principles' },
    { title: 'Bridge to Electronics', link: '/docs/beginner/1-foundations/bridge-to-electronics' }
  ]"
/>

Before writing firmware to toggle pins or read sensors, you need the circuit-level physics that defines what is electrically safe and possible.

## Why It Matters in Embedded Systems

- It prevents hardware damage from overcurrent or incorrect voltage assumptions.
- It turns debugging from guessing into measurement-based diagnosis.
- It helps design power-efficient systems for battery-operated products.

**Videos**:

- [Basic Circuit Theory I - Prof. Razavi](https://www.youtube.com/watch?v=NSjn0C4jZCs)
- [Circuit Analysis A-Z by Question Solutions](https://www.youtube.com/results?search_query=Circuit+Analysis+A-Z+Question+Solutions)

## Detailed Theory Topics

### Ohm's Law

<KatexMath expression="V = IR" :displayMode="true" />

- Core relationship between voltage, current, and resistance.
- Used to verify safe current draw from microcontroller pins.

### Kirchhoff's Current Law (KCL)

- Current entering a node equals current leaving a node.
- Essential for analyzing branches in power and signal networks.

### Kirchhoff's Voltage Law (KVL)

- Sum of voltages around a closed loop is zero.
- Used to reason about voltage drops across sensors, resistors, and loads.

### Power and Energy

<KatexMath expression="P = VI" :displayMode="true" />

- Central to runtime and thermal budgeting.
- Critical in low-power IoT and wearable designs.

## Insights and Outcomes

- You gain the ability to read and validate a circuit with a multimeter.
- You can compare measured values against expected values from KVL and Ohm's Law.

## Practical Example: LED Interface

Given a 3.3 V microcontroller and target LED current of 20 mA:

- Use Ohm's Law to size a current-limiting resistor.
- Protect both the LED and the microcontroller pin from overcurrent.

## Caveats

- Textbook analysis often assumes ideal wiring.
- Real wiring has resistance and capacitance that can distort high-speed signals such as SPI and I2C, especially on long traces or cables.

## Suggested Resources

### Books

- Fundamentals of Electric Circuits (Alexander and Sadiku)
- Principles of Electric Circuits (Thomas Floyd)

### Video

- [Basic Circuit Theory I (Prof. Razavi)](https://www.youtube.com/playlist?list=PLmYAn6p6p6vQpL8o_GvscfS-O0K-XvX5H)

<SelfCheckList storageKey="electric-circuits-checklist" :items="[
  { id: '1', label: 'Use Ohm\'s Law to calculate the current through a resistor given voltage and resistance' },
  { id: '2', label: 'Apply KCL to find the current at a node where multiple branches meet' },
  { id: '3', label: 'Apply KVL to write the equation for a simple loop with a voltage source and resistors' },
  { id: '4', label: 'Calculate the power consumed by a component using /P = VI/' },
  { id: '5', label: 'Size a current-limiting resistor for an LED given source voltage, LED forward voltage, and desired current' }
]" />
