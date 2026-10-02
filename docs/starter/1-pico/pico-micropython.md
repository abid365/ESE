# Pico with MicroPython

**Who this is for**: Absolute beginners who have never programmed before. If you've written any code, you can skim the early sections.

**Time to complete**: ~2 weeks, 1 hour per day.

**Prerequisites**: A Raspberry Pi Pico, a USB cable, and a computer. That's it.

**Why it matters**: MicroPython lets you talk to a microcontroller in plain Python — no compilation step, no Makefiles, no "build error" before you even start. You type code, press Enter, and the LED turns on. That immediate feedback is the fastest way to learn what a microcontroller actually does. The same hardware runs C in the next lesson, so the time spent here is not wasted.

---

## How this connects to embedded work

Before this lesson, a microcontroller is an abstract chip on someone else's desk. After this lesson, you've written programs that run on one, debugged them with print statements, and watched an LED respond to your code in real time. Everything in the rest of the curriculum — registers, timers, protocols, RTOS — is a more detailed version of what you're about to do.

---

## What is the Raspberry Pi Pico?

The Pico is a small green circuit board with a silver square chip in the middle. That chip is the **RP2040**, designed by Raspberry Pi. Inside the RP2040:

- Two ARM Cortex-M0+ processor cores (run your code)
- 264 KB of RAM (where variables live while your program runs)
- 2 MB of flash storage (where your program is saved)
- GPIO pins (the metal legs on the sides — connect buttons, LEDs, sensors)
- USB connector (the silver tab at one end — for power and data)
- An LED on the board (the green component near the USB end — programmable)

The "Pico W" version adds a WiFi antenna and radio chip. For this lesson, plain Pico is fine.

---

## Glossary: terms you'll meet in this lesson

- **Microcontroller** — a small computer on a single chip. Has a processor, RAM, storage, and input/output pins, all in one package.
- **Firmware** — the program that runs on a microcontroller. Unlike "software" on your laptop, firmware lives in flash and runs forever (or until you replace it).
- **GPIO (General Purpose Input/Output)** — the pins on the side of the chip. You can configure each one as an input (read a button) or output (drive an LED).
- **Digital** — two states: HIGH (3.3 V) or LOW (0 V). On the Pico, "on" and "off" for an LED.
- **Analog** — a range of values, not just two. The Pico reads analog voltages on three specific pins (GP26, GP27, GP28) using an ADC.
- **PWM (Pulse Width Modulation)** — a way to fake analog output with a digital pin by switching it on and off very fast. Used to dim LEDs.
- **REPL** — Read-Eval-Print Loop. You type code, the Pico runs it, and you see the result. Like a chat with the chip.
- **Thonny** — a beginner-friendly Python IDE that talks to the Pico's REPL.
- **Pull-up resistor** — a tiny built-in resistor that holds a GPIO pin at HIGH until something pulls it LOW (like a button press). Avoids "floating" pins that read random values.

---

## Step 1 — Install Thonny and flash MicroPython

### 1.1 Download Thonny

Go to [thonny.org](https://thonny.org) and install the version for your operating system. Thonny is a Python IDE that bundles everything an absolute beginner needs.

### 1.2 Download MicroPython firmware

The Pico ships blank — it doesn't know Python yet. You have to give it a MicroPython firmware file.

1. Go to [micropython.org/download/rp2-pico/](https://micropython.org/download/rp2-pico/)
2. Download the latest stable `.uf2` file (something like `RP2-PICO-20240105-v1.22.2.uf2`)
3. Save it somewhere you can find it

### 1.3 Flash the firmware

1. Hold down the white **BOOTSEL** button on the Pico
2. While holding BOOTSEL, plug the USB cable into your computer
3. Release BOOTSEL — the Pico appears as a USB drive called `RPI-RP2`
4. Drag the `.uf2` file onto the drive
5. The Pico disconnects itself and reboots — it's now running MicroPython

This is what "flashing" means. The `.uf2` is a special file format that the bootloader in the RP2040 knows how to copy into flash storage.

### 1.4 Connect Thonny to the Pico

1. Open Thonny
2. Bottom-right corner has an interpreter selector. Click it → "MicroPython (Raspberry Pi Pico)"
3. Thonny opens a connection to the Pico's REPL

You should see a prompt:

```
>>>
```

That's the REPL waiting for you. Type the following and press Enter:

```python
print("hello from the Pico")
```

If you see `hello from the Pico`, you're in. The chip is running your code.

---

## Step 2 — The onboard LED

The Pico has a small green LED on the board, connected to **GPIO 25**. You don't need any extra components for this — no wires, no resistors, nothing. The LED is built in.

In the REPL:

```python
from machine import Pin
led = Pin(25, Pin.OUT)
led.on()
```

The LED turns on. Type:

```python
led.off()
```

It turns off. That's your first embedded program.

**What just happened?**

- `from machine import Pin` — load the `Pin` class. The `machine` module is MicroPython's hardware API.
- `Pin(25, Pin.OUT)` — make GPIO 25 an output. You're telling the chip "this pin drives a voltage, it doesn't read one."
- `led.on()` — drive GPIO 25 to 3.3 V. The LED lights up.
- `led.off()` — drive GPIO 25 to 0 V. The LED goes dark.

### Make it blink

The REPL runs one statement at a time, but you can save a multi-line script. In Thonny, click File → New, type the following, and press the green Run button (or F5):

```python
from machine import Pin
import time

led = Pin(25, Pin.OUT)

while True:
    led.on()
    time.sleep(0.5)       # 0.5 seconds on
    led.off()
    time.sleep(0.5)       # 0.5 seconds off
```

The LED blinks at 1 Hz. You just wrote your first embedded program.

**Why `time.sleep()` and not `time.sleep(1)`?** Either works. MicroPython accepts both — `0.5` means half a second, `1` means one second.

### Stop the blinking

The script runs forever (`while True`). To stop it, click the red Stop button in Thonny, or press Ctrl+C in the REPL.

---

## Step 3 — An external LED

The onboard LED is great for learning, but real projects use external LEDs. This is your first circuit.

### What you need

- 1 × LED (any color)
- 1 × resistor, **330 Ω** (orange-orange-brown)
- 2 × jumper wires (male-to-male)

### Wiring

```
Pico GP15  ──── [330 Ω resistor] ────  LED anode (long leg, +)
                                          │
                                       LED cathode (short leg, -)
                                          │
Pico GND   ─────────────────────────────────
```

### Why the resistor?

An LED drops about 2 V when on. The Pico outputs 3.3 V. Without the resistor, the rest of that voltage would push too much current through the LED and burn it out. The resistor limits the current to a safe value (around 4 mA here).

### Wiring table

| Component lead | Connects to |
| --- | --- |
| LED long leg (+) | One end of 330 Ω resistor |
| Other end of resistor | Pico **GP15** |
| LED short leg (-) | Pico **GND** (any GND pin) |

### Code

```python
from machine import Pin
import time

led = Pin(15, Pin.OUT)

while True:
    led.on()
    time.sleep(0.25)
    led.off()
    time.sleep(0.25)
```

The external LED blinks alongside or instead of the onboard one.

::: tip Common mistakes

- **LED doesn't light up?** Check polarity — long leg is +, short leg is -. Try flipping the LED.
- **Resistor value wrong?** 330 Ω is orange-orange-brown. 1 kΩ (brown-black-red) also works but the LED will be dimmer. 100 Ω (brown-black-brown) is too low — risk of damage.
- **Wrong GPIO number?** Count carefully. GP15 is the 15th GPIO pin, not the 15th physical pin. The Pico has 40 physical pins but only 26 of them are user GPIOs.

:::

---

## Step 4 — Reading a button

Digital input is the other half of GPIO. A button is just a switch that connects a pin to GND when pressed.

### What you need

- 1 × pushbutton (tactile switch, 4-pin)
- 1 × jumper wire

### Wiring

```
Pico GP14  ──── button pin A
Pico GND   ──── button pin B (diagonal from pin A)
```

Press the button → GP14 connects to GND → pin reads LOW.
Release the button → pin is "floating" → pin reads random values unless we use a pull-up.

### Code with internal pull-up

The Pico's GPIO pins have internal pull-up resistors you can enable in software. This avoids needing an external resistor.

```python
from machine import Pin
import time

button = Pin(14, Pin.IN, Pin.PULL_UP)
led = Pin(15, Pin.OUT)

while True:
    if button.value() == 0:    # 0 means pressed (pulled to GND)
        led.on()
    else:
        led.off()
    time.sleep(0.01)           # small delay to debounce
```

::: info Glossary: pull-up

A **pull-up resistor** holds the pin at HIGH when nothing else is connected. When the button is pressed, it overrides the pull-up and pulls the pin to LOW. Reading the pin then tells you "pressed" vs "not pressed" reliably. Without the pull-up, the pin is "floating" and reads random noise.

:::

### Try it

Press the button — LED on. Release — LED off. You have input controlling output, which is the foundation of every embedded device.

---

## Step 5 — PWM: fading an LED

So far LEDs are either on or off. To dim them, you need **PWM** — pulse width modulation. The Pico switches the pin on and off thousands of times per second. The percentage of time it's on (the **duty cycle**) controls brightness.

### How PWM looks on a wire

```
Duty 25%  ─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─     LED appears dim
            └─┘ └─┘ └─┘ └─┘ └─┘ └─┘ └─

Duty 75%  ─┐ ┌───┐ ┌───┐ ┌───┐ ┌───   LED appears bright
            └─┘   └─┘   └─┘   └─┘   └─
```

### Code

```python
from machine import Pin, PWM
import time

led_pwm = PWM(Pin(15))

led_pwm.freq(1000)              # 1 kHz — too fast to see flicker

while True:
    for duty in range(0, 65536, 1000):
        led_pwm.duty_u16(duty)  # 0 to 65535 = 0% to 100%
        time.sleep(0.01)
    for duty in range(65535, 0, -1000):
        led_pwm.duty_u16(duty)
        time.sleep(0.01)
```

The LED fades smoothly up to full brightness, then down. You can read the value with `led_pwm.duty_u16()` at any time.

::: tip Frequency choice

The PWM frequency must be high enough that the eye can't see individual pulses. For LEDs, anything above ~100 Hz works. For motors and servos, use the frequency the device expects (servos are usually 50 Hz).

:::

---

## Step 6 — ADC: reading a potentiometer

The Pico has three analog input pins: **GP26, GP27, GP28**. They read voltages between 0 V and 3.3 V and convert them to numbers from 0 to 65535 (in 16-bit mode) or 0 to 4095 (in 12-bit default).

### What you need

- 1 × potentiometer (any value, 10 kΩ is typical)

### Wiring

```
Potentiometer pin 1 (left)    ──── Pico 3.3V
Potentiometer pin 2 (middle)  ──── Pico GP26 (ADC0)
Potentiometer pin 3 (right)   ──── Pico GND
```

Turn the knob → pin 2 voltage changes → ADC reading changes.

### Code

```python
from machine import Pin, ADC, PWM
import time

adc = ADC(Pin(26))             # ADC0 on GP26
led_pwm = PWM(Pin(15))
led_pwm.freq(1000)

while True:
    raw = adc.read_u16()       # 0 to 65535
    led_pwm.duty_u16(raw)
    print("ADC:", raw)
    time.sleep(0.05)
```

The **Serial Monitor in Thonny** (View → Serial Monitor, or the Serial tab) shows the live ADC readings. Twisting the pot moves the numbers.

### Why 16-bit?

The Pico's ADC is physically 12 bits (4096 distinct values). MicroPython's `read_u16()` scales the 12-bit value up to 16 bits so you can use the same range as `duty_u16()`. It's a convenience, not extra resolution.

---

## Step 7 — The internal temperature sensor

The RP2040 has a built-in temperature sensor. It's not accurate enough for a thermometer (about ±10 °C), but it's useful for "is this chip hotter than usual" debugging.

```python
from machine import ADC
import time

sensor_temp = ADC(4)           # ADC channel 4 is the internal sensor
conversion_factor = 3.3 / 65535

while True:
    raw = sensor_temp.read_u16()
    voltage = raw * conversion_factor
    temperature_c = 27 - (voltage - 0.706) / 0.001721
    print(f"{temperature_c:.1f} °C")
    time.sleep(1)
```

Pinch the chip between your fingers — the temperature reading goes up.

---

## Step 8 — Mini project: knob-controlled LED brightness

Combining everything you've learned:

```python
from machine import Pin, ADC, PWM

pot = ADC(Pin(26))           # knob on GP26
led = PWM(Pin(15))           # LED on GP15
led.freq(1000)

while True:
    led.duty_u16(pot.read_u16())   # knob directly drives LED brightness
```

That's the whole project. Twist the knob, LED brightens or dims. Twelve lines of code, one complete input-processing-output system.

### Going further

- Add a second knob (on GP27) that controls blink rate
- Print ADC and PWM values to the serial monitor
- Add a button (on GP14) that toggles between "knob controls brightness" and "knob controls blink rate"

---

## Common misconceptions

| Misconception | Reality |
| --- | --- |
| "Pico and Arduino are competitors" | Different form factors, same family of microcontroller. Many engineers use both. |
| "Python is too slow for microcontrollers" | MicroPython is slower than C by ~100×, but most beginner projects don't care. For real-time critical work, switch to C (next lesson). |
| "I need to buy a special cable" | Any USB cable that supports data works. Charge-only cables won't connect. |
| "MicroPython replaces the firmware" | It loads on top of the bootloader. You can always wipe it and go back to C. |
| "GP26 means pin 26 on the board" | Pin numbering can confuse you. Always count GPIOs separately from physical pins. |

---

## Suggested resources

### Videos
- [Raspberry Pi Pico - MicroPython for Beginners](https://www.youtube.com/watch?v=tpw9syG5uOk)
- [MicroPython Basics - Tony Goodhew](https://www.youtube.com/playlist?list=PLgyFFxNC3pfGhfyqC7sC-yF4Bl7p_N55T)

### Reading
- [Raspberry Pi Pico Python SDK](https://datasheets.raspberrypi.com/pico/raspberry-pi-pico-python-sdk.pdf)
- [MicroPython documentation](https://docs.micropython.org/)

### Hardware
- SunFounder Pico Kit ($45) — Pico + 300+ components, optional

---

## Self-check before moving on

When all of these can be performed without looking anything up, you're ready for [Pico with C/C++](./pico-ccpp-sdk):

1. Flash MicroPython firmware to a Pico using BOOTSEL mode
2. Connect Thonny to the Pico's REPL and run a one-line Python statement
3. Save and run a MicroPython script that blinks the onboard LED
4. Wire an external LED with a 330 Ω current-limiting resistor and blink it from GP15
5. Read a button press on GP14 using `Pin.PULL_UP`
6. Fade an LED using PWM and explain what "duty cycle" means
7. Read a potentiometer using ADC and print the value to the serial monitor
8. Combine ADC input with PWM output in a single working program
