# Basic Calculus: The Math of Change

**Who this is for**: Junior developers learning embedded systems with some algebra background.  
**Time to complete**: ~5 weeks, 1–2 hours per day.  
**Why it matters**: Before you touch a PID controller, a Kalman filter, or a DSP algorithm, calculus is the language those systems speak. This module builds that language from scratch.

---

## How this connects to embedded work

Every sensor reading is a function of time. A temperature sensor outputs a value that changes — calculus tells you _how fast_ it's changing (derivative) and _how much it has changed overall_ (integral). When you later tune a motor controller or filter noisy ADC data, you'll be applying these concepts directly, not as abstraction but as firmware logic.

**Quick example**: Your accelerometer gives you `a(t)` — acceleration at time `t`. You can't directly measure velocity or position. But:

<KatexMath expression="\mathrm{velocity}(t) = \int a(t) dt" :displayMode="true" />
<KatexMath expression="\mathrm{position}(t) = \int v(t) dt" :displayMode="true" />

This is dead reckoning, used in drones, robots, and wearables. You'll implement this in a later module.

---

## Module structure

### Week 1 — Limits and continuity

**Core idea**: A limit asks "what value does a function approach as we get very close to a point?" It doesn't matter what happens _at_ that point — only what happens _near_ it.

**Why it matters in embedded**: Your MCU samples a continuous physical signal at discrete intervals (e.g. 1000 Hz). The signal between samples is never observed — you're always working with an approximation. Limits give you the theoretical basis for understanding what information you're losing, and how fast sampling must be to avoid it (Nyquist theorem, covered later).

**Key concepts to learn**:

- One-sided limits: approaching from the left vs the right
- Continuity: what it means for a function to have no sudden jumps
- L'Hôpital's rule (optional at this stage — come back to it)

**Check your understanding**: If a temperature sensor updates every 10 ms, and the temperature changes smoothly, what does continuity guarantee about the values between samples?

---

### Weeks 2–3 — Derivatives (differential calculus)

**Core idea**: The derivative of a function at a point is its instantaneous rate of change — the slope of the tangent line at that point.

<KatexMath expression="f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}" :displayMode="true" />

Think of it as: "if I nudge `x` by a tiny amount, how much does `f(x)` change?"

**Rules to learn (in this order)**:

1. Power rule: <KatexMath expression="\frac{d}{dx}[x^n] = n \cdot x^{n-1}" />
2. Sum rule: derivative of a sum = sum of derivatives
3. Product rule: for functions multiplied together
4. Chain rule: for functions nested inside other functions

**Embedded application — the D term in PID**:

A PID controller's derivative term computes:

<KatexMath expression="\mathrm{D\_term} = K_d \cdot \frac{d(\mathrm{error})}{dt}" :displayMode="true" />

> **What this does**: Responds to how fast the error is changing. If error is decreasing rapidly, the D term "brakes" early to prevent overshoot.

This asks: "is the error growing or shrinking, and how fast?" If your motor is overshooting a target position and the error is decreasing rapidly, the D term brakes early — before the overshoot happens. Without derivatives, you'd always react late.

**Worked example**: Suppose error `e(t) = 5·sin(2t)`. Then:

<KatexMath expression="\frac{de}{dt} = 10 \cdot \cos(2t)" :displayMode="true" />

At `t = 0`, the error is 0 but its rate of change is 10 — the system is moving fast toward an error. The D term catches this early.

**Exercise**: Given `f(t) = 3t² + 2t`, compute `f'(t)`. What does this represent if `f(t)` is the position of a robot arm?

---

### Week 4 — Integrals (integral calculus)

**Core idea**: Integration is the reverse of differentiation. It computes the area under a curve — equivalently, the total accumulated value of a quantity over an interval.

<KatexMath expression="\int_a^b f(t) \, dt = \mathrm{total\ area\ under\ } f(t) \mathrm{\ from\ } a \mathrm{\ to\ } b" :displayMode="true" />

**Rules to learn**:

1. Power rule for integration: <KatexMath expression="\int x^n \, dx = \frac{x^{n+1}}{n+1} + C" />
2. Definite vs indefinite integrals (the difference between "total over a range" vs "general formula")
3. Fundamental theorem of calculus: differentiation and integration are inverse operations

**Embedded application — the I term in PID and battery estimation**:

The integral term in PID:

<KatexMath expression="\mathrm{I\_term} = K_i \cdot \int \mathrm{error}(t) \, dt" :displayMode="true" />

> **What this does**: Accumulates error over time. If the system has been below target for a while, the I term builds up and pushes harder to eliminate the persistent offset.

This accumulates error over time. If your heater holds temperature slightly below target for 60 seconds, the I term has been building up — it will nudge the output higher to correct that persistent offset. Without it, your system can be permanently off by a small amount (called steady-state error).

Battery state of charge works the same way:

<KatexMath expression="\mathrm{charge\_remaining} = \mathrm{initial\_charge} - \int I(t) \, dt" :displayMode="true" />

Every embedded fuel gauge implements this, often called coulomb counting.

**Exercise**: A motor draws `I(t) = 2 + 0.5t` amps over 10 seconds. How many coulombs of charge are consumed? (Hint: integrate from 0 to 10.)

---

### Week 5 — Bringing it together

By now you have both tools. Here's a realistic embedded workflow:

**Scenario**: You're writing firmware for a balance robot. The IMU gives you angular velocity `ω(t)` from the gyroscope.

<KatexMath expression="\mathrm{angle}(t) = \int \omega(t) \, dt" :displayMode="true" />
<KatexMath expression="\mathrm{error}(t) = \mathrm{target} - \mathrm{angle}(t)" :displayMode="true" />
<KatexMath expression="\mathrm{correction} = K_p \cdot e + K_i \cdot \int e \, dt + K_d \cdot \frac{de}{dt}" :displayMode="true" />

All three calculus operations appear in a single control loop. When you tune `Kp`, `Ki`, and `Kd`, you are adjusting how aggressively the system responds to value, accumulation, and rate of change respectively.

---

## Visualizing key ideas

### What a derivative looks like

Plot `f(x) = x²`. The derivative `f'(x) = 2x` is the slope at any point. At `x = 0` the slope is 0 (the bottom of the curve). At `x = 3` the slope is 6 (steeply rising). This is the instantaneous velocity if `f` is position.

### What an integral looks like

Plot a constant current `I = 2A` over 5 seconds. The integral — the area under that flat line — is `2 × 5 = 10 coulombs`. If the current varies, you sum up thin slices of area. That's integration.

---

## Common misconceptions

| Misconception                                         | Reality                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| "Calculus is only for analog systems"                 | Digital systems approximate calculus at every sample step — knowing this lets you understand the error |
| "I'll use a library, I don't need to understand this" | You'll need to tune parameters and debug instability; that requires intuition                          |
| "Derivatives and integrals are unrelated"             | They are exact inverses — the fundamental theorem of calculus                                          |

---

## Suggested resources

### For building intuition first (recommended starting point)

- **3Blue1Brown — Essence of Calculus** (YouTube): 12-video series. Watch this before opening any textbook. The visualizations make limits and derivatives feel obvious, not abstract.
- **Khan Academy — Calculus 1**: Free, structured, with practice problems at every step. Use this alongside your reading.

### Textbooks

- **Calculus For Dummies** (Mark Ryan): Genuinely accessible. Good for concepts and worked examples.
- **Thomas' Calculus**: More rigorous. Useful once you have intuition and want formal treatment.

### Embedded-specific context

- **Control Systems Engineering** (Nise): Chapter 1 covers why calculus underlies all control theory — worth reading after completing this module.

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

- [ ] Differentiate <KatexMath expression="f(t) = 4t^3 - 2t + 7" />
- [ ] Explain in plain English what the derivative tells you about a signal
- [ ] Integrate <KatexMath expression="\int 3t^2 \, dt" /> and evaluate it from <KatexMath expression="t = 0" :displayMode="false" /> to <KatexMath expression="t = 2" :displayMode="false" />
- [ ] Explain what the I term in a PID controller is accumulating and why that fixes steady-state error
- [ ] Sketch what <KatexMath expression="f(t) = t^2" :displayMode="false" /> and its derivative <KatexMath expression="f'(t) = 2t" :displayMode="false" /> both look like on a graph
