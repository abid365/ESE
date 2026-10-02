# Starter: Raspberry Pi Pico

**Who this is for**: Absolute beginners — no prior programming, no electronics, no command-line experience required. If you've never written code or touched a circuit, start here.

**Time to complete**: ~4 weeks, 1 hour per day.

**Prerequisites**: None. A Raspberry Pi Pico and a USB cable is all you need to start.

**Why it matters**: The fastest path into embedded systems is making something real happen on real hardware. The Pico is $5, has no extra components required to blink its onboard LED, and supports MicroPython — a friendly Python dialect that runs directly on the chip. Within an hour you'll have a working program. From there, the same Pico runs the same C/C++ code as professional embedded engineers use, on the same ARM Cortex-M architecture you'll meet later in the Intermediate track.

---

## How this connects to embedded work

This module is the on-ramp for the rest of the curriculum.

**Before this module**:
- No exposure to microcontrollers
- No idea what "flashing firmware" means
- No experience with command-line tools

**After this module**:
- You have a working dev environment (Thonny for MicroPython, Pico SDK + CMake for C/C++)
- You can read inputs (buttons, sensors) and drive outputs (LEDs, buzzers) on real hardware
- You've written your first embedded C program and understand how it differs from desktop C

By the end of this module you'll have the practical context that makes the math, circuit theory, and register-level programming in the rest of the curriculum land instead of floating in the abstract.

---

## What you need

| Item | Cost | Notes |
| --- | --- | --- |
| Raspberry Pi Pico (or Pico W) | $5–$7 | Pico W adds WiFi — useful but not required for this module |
| Micro-USB cable (data, not charge-only) | $3 | Must support data — some cheap cables are power-only |
| Computer running Windows, macOS, or Linux | — | Thonny IDE works everywhere |
| Total | ~$10 | One of the cheapest entry points in embedded |

> **Don't buy extras yet.** The Pico's onboard LED, button-free inputs, and the temperature sensor built into the RP2040 chip are enough for every lesson here. When you finish this module and move to Beginner 1, you'll add a breadboard, resistors, and jumper wires.

---

## Module structure

### [1. Pico with MicroPython](./1-pico/pico-micropython.md)

Use Python to make the Pico do things — no compilation, no toolchain, no build errors. Thonny connects to the Pico over USB and lets you type code line by line.

**What you'll learn**:
- What the Pico is, what's on it, and why it's a great learning board
- Installing Thonny and loading MicroPython firmware
- The interactive REPL — running code one statement at a time
- `machine.Pin` for digital input and output
- `machine.PWM` for analog-like output (LED fading, buzzers)
- `machine.ADC` for analog input (potentiometers, sensors)
- A button-and-LED project that ties it together

### [2. Pico with C/C++ and the Pico SDK](./1-pico/pico-ccpp-sdk.md)

Switch from Python to C — the language embedded engineers actually use. This lesson mirrors lesson 1 in C, so you see exactly which lines of MicroPython correspond to which C concepts.

**What you'll learn**:
- Why C matters for embedded (size, speed, direct hardware access)
- Installing the Pico SDK, CMake, and the ARM GCC toolchain
- Building and flashing your first C program (the classic blink)
- The structure of a Pico SDK project (CMakeLists.txt, source files)
- GPIO, PWM, and ADC in C
- `printf()` over USB serial — the embedded equivalent of "hello world"
- How this connects to the STM32 register-level work in the Intermediate track

---

## How this fits the rest of the curriculum

```
Starter (Pico)         — You are here. Hardware fun, low friction.
  └── Beginner 1       — Now formalize: calculus, circuits, electronics theory
  └── Beginner 2       — Deeper C/C++ syntax, memory, OOP
  └── Beginner 3       — Breadboarding, multimeter, Arduino (different board, same ideas)
  └── Intermediate 1   — STM32 bare-metal registers (same ARM architecture as Pico)
  └── Intermediate 2   — Serial protocols (UART, SPI, I2C)
  └── Intermediate 3   — PCB design, GDB debugging, RTOS
  └── Advanced         — Embedded Linux, TinyML, security, AUTOSAR
```

You don't have to complete this Starter module if you already have basic programming or electronics experience. In that case, skip straight to [Beginner 1: Math, Circuits, and Electronics](../beginner/1-foundations/).

---

## Recommended videos

- [Raspberry Pi Pico - Getting Started (official)](https://www.youtube.com/watch?v=YkH7-7A1xLQ)
- [MicroPython for the Raspberry Pi Pico - DroneBot Workshop](https://www.youtube.com/watch?v=tpw9syG5uOk)
- [Raspberry Pi Pico C/C++ SDK Setup - Shawn Hymel](https://www.youtube.com/watch?v=7gTdUWlHFww)

---

## Self-check before moving on

You should be comfortable with all of these before starting Beginner 1:

1. Connect a Pico to your computer and see it appear as a USB drive
2. Install MicroPython firmware and connect from Thonny
3. Blink the onboard LED from a MicroPython script saved on the Pico
4. Read a button press using `machine.Pin`
5. Fade an LED using `machine.PWM`
6. Read a potentiometer using `machine.ADC`
7. Install the Pico C/C++ SDK toolchain and build a "blink" example
8. Explain in one sentence why embedded C programs typically don't have an operating system
