# Pico with C/C++ and the Pico SDK

**Who this is for**: Anyone who finished [Pico with MicroPython](./pico-micropython) and wants to use the same language professional embedded engineers use. Also appropriate as a direct entry point if you already know C and just want to program a microcontroller.

**Time to complete**: ~2 weeks, 1–2 hours per day.

**Prerequisites**: A working Pico MicroPython setup (so you have the toolchain habit and the board), or prior C experience.

**Why it matters**: MicroPython is great for learning and quick prototypes, but real embedded firmware is written in C. Switching to C reveals what's actually happening inside the chip — every line maps directly to hardware, every cycle counts, and you stop treating the board as magic. By the end of this lesson you'll write a C program, compile it, flash it, and see the same LED blink you blinked in MicroPython — but now you understand the whole pipeline.

---

## How this connects to embedded work

This lesson is the bridge between "I wrote Python on a chip" and "I'm writing firmware."

**Before this lesson**:
- You typed Python and the REPL executed it
- The Pico interpreted each line at runtime
- MicroPython's runtime was sitting between your code and the hardware

**After this lesson**:
- You compile C into a `.uf2` binary that runs directly on the ARM Cortex-M0+ core
- There is no interpreter — your code is the only thing running
- The same architecture (ARM Cortex-M) appears in the STM32 work in the Intermediate track, just with more peripherals

If you've used Arduino before, this lesson is what Arduino hides from you — Arduino sketches are C++, but the setup is hidden behind the IDE. Here you'll do the setup by hand.

---

## Why C, not Python?

| Concern | MicroPython | C/C++ |
| --- | --- | --- |
| Speed | ~100× slower | Native ARM Cortex-M |
| Code size | 100s of KB | Single-digit KB |
| Memory use | Heap allocator running always | Static allocation |
| Real-time guarantees | No (GC can pause) | Yes (deterministic) |
| Direct hardware access | Through Python wrappers | Direct register access |
| Startup time | 1–2 seconds | Microseconds |

For learning and prototyping, Python's productivity wins. For production firmware where timing matters, C is the only option.

---

## Glossary: terms you'll meet

- **Toolchain** — the set of programs (compiler, linker, etc.) that turns your C source code into something the chip can run.
- **Cross-compilation** — building code on your laptop for a different target architecture (ARM) than your laptop uses (x86 or ARM).
- **ARM GCC** — the GNU C Compiler configured for ARM Cortex-M targets. Standard compiler for embedded work.
- **CMake** — a build system generator. You describe your project in `CMakeLists.txt`, and CMake generates Makefiles (or Ninja files, or Visual Studio projects).
- **SDK (Software Development Kit)** — Raspberry Pi's official Pico SDK. Wraps the raw chip registers in friendlier C functions.
- **ELF file** — the compiled output, with symbols and debug info. Used by debuggers.
- **UF2 file** — a special drag-and-drop firmware format. The Pico bootloader can flash UF2 directly.
- **Header file** — a `.h` file that declares functions, types, and macros. `#include "pico/stdlib.h"` pulls in Pico SDK declarations.
- **Linker script** — tells the linker where in flash and RAM to put your code and data.
- **`main()`** — the entry point of a C program. The chip boots, sets up hardware, and calls `main()`.

---

## Step 1 — Install the toolchain

You need three things:

1. **ARM GCC** — the compiler for ARM targets
2. **CMake** — the build system
3. **Pico SDK** — Raspberry Pi's C library for the Pico

### macOS (using Homebrew)

```bash
brew install cmake
brew tap ArmMbed/homebrew-formulae
brew install arm-none-eabi-gcc
```

Then clone the Pico SDK:

```bash
mkdir -p ~/pico
cd ~/pico
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
export PICO_SDK_FETCH_FROM_GIT=1
```

### Windows

Download and install:
1. [ARM GCC toolchain](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads) — pick the "Windows (zip)" file under "Arm GNU Toolchain for Embedded"
2. [CMake](https://cmake.org/download/) — Windows installer
3. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) — needed for the `nmake` build tools
4. [Git for Windows](https://git-scm.com/download/win)

Then in a Git Bash terminal:

```bash
mkdir -p /c/pico
cd /c/pico
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
export PICO_SDK_FETCH_FROM_GIT=1
```

### Linux (Debian/Ubuntu)

```bash
sudo apt install cmake gcc-arm-none-eabi libnewlib-arm-none-eabi build-essential
mkdir -p ~/pico
cd ~/pico
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
export PICO_SDK_FETCH_FROM_GIT=1
```

> **Make the environment permanent.** Add `export PICO_SDK_PATH=/path/to/pico-sdk` to your shell's `~/.bashrc`, `~/.zshrc`, or equivalent. The build system reads this variable to find the SDK.

---

## Step 2 — Your first C project: blink

### 2.1 Create a project folder

```bash
mkdir -p ~/pico/blink
cd ~/pico/blink
```

### 2.2 Create `blink.c`

Save this as `blink.c` in your project folder:

```c
#include "pico/stdlib.h"

int main() {
    // Initialize the GPIO pin for the onboard LED (GPIO 25)
    const uint LED_PIN = 25;
    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);

    while (true) {
        gpio_put(LED_PIN, 1);   // LED on
        sleep_ms(500);          // 500 ms
        gpio_put(LED_PIN, 0);   // LED off
        sleep_ms(500);
    }

    return 0;   // never reached
}
```

::: info Line-by-line

- `#include "pico/stdlib.h"` — pulls in Pico SDK declarations (`gpio_init`, `sleep_ms`, etc.)
- `int main()` — every C program has a `main()`. The chip calls this on startup.
- `const uint LED_PIN = 25;` — GPIO 25 is the onboard LED.
- `gpio_init(LED_PIN)` — set up the pin's hardware.
- `gpio_set_dir(LED_PIN, GPIO_OUT)` — configure as output.
- `while (true)` — infinite loop. Embedded programs never exit; they just run forever.
- `gpio_put(LED_PIN, 1)` — drive the pin HIGH (3.3 V).
- `sleep_ms(500)` — busy-wait for 500 milliseconds. MicroPython's `time.sleep` was a higher-level abstraction over this.

:::

### 2.3 Create `CMakeLists.txt`

```cmake
cmake_minimum_required(VERSION 3.13)

# Pull in the Pico SDK
include(pico_sdk_import.cmake)

project(blink C CXX ASM)

set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 17)

pico_sdk_init()

# Add our blink executable
add_executable(blink blink.c)

# Pull in the GPIO and stdlib libraries
target_link_libraries(blink pico_stdlib)

# Generate the .uf2 file when building
pico_enable_stdio_usb(blink 1)
pico_add_extra_outputs(blink)
```

### 2.4 Copy `pico_sdk_import.cmake`

```bash
cp $PICO_SDK_PATH/external/pico_sdk_import.cmake .
```

### 2.5 Configure and build

```bash
mkdir build
cd build
cmake .. -DPICO_BOARD=pico
make -j4
```

If everything works, you should see:

```
[100%] Built target blink
```

And in the `build/` directory:

- `blink.elf` — the compiled binary with debug symbols
- `blink.uf2` — the drag-and-drop firmware file

### 2.6 Flash it

1. Hold the BOOTSEL button on the Pico
2. Plug in the USB cable while holding BOOTSEL
3. Release BOOTSEL — the Pico appears as a USB drive
4. Drag `blink.uf2` onto the drive
5. The Pico reboots automatically and runs your C program

The onboard LED blinks at 1 Hz. You just compiled, linked, and flashed your first embedded C program.

---

## Step 3 — Compare with the MicroPython version

Side by side:

**MicroPython** (from previous lesson):

```python
from machine import Pin
import time
led = Pin(25, Pin.OUT)
while True:
    led.on()
    time.sleep(0.5)
    led.off()
    time.sleep(0.5)
```

**C with Pico SDK**:

```c
#include "pico/stdlib.h"
int main() {
    gpio_init(25);
    gpio_set_dir(25, GPIO_OUT);
    while (true) {
        gpio_put(25, 1);
        sleep_ms(500);
        gpio_put(25, 0);
        sleep_ms(500);
    }
}
```

Same logic, different syntax. C is more verbose but:
- Runs ~100× faster
- Uses ~1 KB of flash instead of ~500 KB (the MicroPython runtime)
- Starts in microseconds instead of seconds
- Doesn't need an interpreter

---

## Step 4 — GPIO input: button

Read a button on GP14 using the Pico SDK:

```c
#include "pico/stdlib.h"

int main() {
    const uint LED_PIN = 25;
    const uint BTN_PIN = 14;

    gpio_init(LED_PIN);
    gpio_set_dir(LED_PIN, GPIO_OUT);

    gpio_init(BTN_PIN);
    gpio_set_dir(BTN_PIN, GPIO_IN);
    gpio_pull_up(BTN_PIN);     // internal pull-up

    while (true) {
        if (gpio_get(BTN_PIN) == 0) {   // pressed = LOW
            gpio_put(LED_PIN, 1);
        } else {
            gpio_put(LED_PIN, 0);
        }
        sleep_ms(10);   // small delay for debouncing
    }
}
```

Wiring is the same as the MicroPython version: button between GP14 and GND. The SDK's `gpio_pull_up()` does the same thing as MicroPython's `Pin.PULL_UP`.

---

## Step 5 — PWM: fade an LED

Use the Pico SDK's PWM API to dim an LED on GP15:

```c
#include "pico/stdlib.h"

int main() {
    const uint LED_PIN = 15;
    gpio_set_function(LED_PIN, GPIO_FUNC_PWM);

    // Figure out which PWM slice this GPIO is on
    uint slice_num = pwm_gpio_to_slice_num(LED_PIN);

    // 1 kHz frequency
    pwm_set_clkdiv(slice_num, 125.0f);    // 125 MHz / 125 = 1 MHz
    pwm_set_wrap(slice_num, 999);          // 1 MHz / 1000 = 1 kHz
    pwm_set_enabled(slice_num, true);

    while (true) {
        // Fade up
        for (uint level = 0; level < 1000; level++) {
            pwm_set_gpio_level(LED_PIN, level);
            sleep_ms(2);
        }
        // Fade down
        for (uint level = 999; level > 0; level--) {
            pwm_set_gpio_level(LED_PIN, level);
            sleep_ms(2);
        }
    }
}
```

::: info What those numbers mean

The Pico's PWM peripheral runs at 125 MHz by default. Dividing that by 125 gives 1 MHz ticks. Wrapping at 999 gives 1000 distinct duty levels (0 to 999), at a 1 kHz refresh rate. So `level = 500` means 50% duty cycle, 50% brightness.

This kind of "calculate the prescaler and wrap values" math is exactly what you'll see in the Intermediate track's STM32 work — same peripheral, different chip.

:::

---

## Step 6 — ADC: read a potentiometer

Read a potentiometer on GP26 (ADC0) and print the value:

```c
#include "pico/stdlib.h"
#include "hardware/adc.h"
#include <stdio.h>

int main() {
    stdio_init_all();    // set up USB serial for printf

    adc_init();
    adc_gpio_init(26);   // GP26 = ADC0
    adc_select_input(0);

    const uint LED_PIN = 15;
    gpio_set_function(LED_PIN, GPIO_FUNC_PWM);
    uint slice_num = pwm_gpio_to_slice_num(LED_PIN);
    pwm_set_clkdiv(slice_num, 125.0f);
    pwm_set_wrap(slice_num, 999);
    pwm_set_enabled(slice_num, true);

    while (true) {
        uint16_t raw = adc_read();        // 0 to 4095 (12-bit)
        pwm_set_gpio_level(LED_PIN, raw / 4);   // scale to 0–999
        printf("ADC: %d\n", raw);         // print to USB serial
        sleep_ms(50);
    }
}
```

To see the `printf()` output, connect to the Pico's USB serial. In a terminal:

```bash
# Linux/macOS
minicom -D /dev/ttyACM0 -b 115200

# Or use Thonny's Serial Monitor
```

In PlatformIO, the Serial Monitor works the same way.

---

## Step 7 — The structure of an embedded C project

A typical Pico SDK project has:

```
my_project/
├── CMakeLists.txt           # build configuration
├── pico_sdk_import.cmake    # pulls in the SDK (copied from the SDK)
├── main.c                   # your code (can be multiple files)
├── README.md
└── build/                   # generated
    ├── blink.elf
    └── blink.uf2
```

For larger projects you split `main.c` into multiple files:

```
my_project/
├── CMakeLists.txt
├── pico_sdk_import.cmake
├── src/
│   ├── main.c
│   ├── led.c
│   ├── led.h
│   ├── uart.c
│   └── uart.h
└── build/
```

Each `.c` file is compiled separately, then linked together. This is normal C structure — not specific to embedded.

---

## Common misconceptions

| Misconception | Reality |
| --- | --- |
| "C is way harder than Python" | C has fewer built-in conveniences, but the syntax is simpler. Fewer concepts, more manual work. |
| "Embedded C is a different language" | It's the same C99/C11 you write on desktop, with no operating system and a smaller standard library. |
| "I have to write my own printf" | The Pico SDK includes `printf` over USB serial. You get formatted printing for free. |
| "CMake is overkill" | For one file, yes. For a real firmware project with multiple modules, CMake (or similar) is unavoidable. |
| "ARM Cortex-M0+ is too slow" | 133 MHz dual-core M0+ is plenty for 99% of embedded work. The constraint is memory, not speed. |

---

## Suggested resources

### Videos
- [Raspberry Pi Pico C/C++ SDK Setup - Shawn Hymel](https://www.youtube.com/watch?v=7gTdUWlHFww)
- [Getting Started with Pico SDK - Digikey's Intro](https://www.youtube.com/watch?v=LB1o9g9PMzE)
- [Pico SDK Examples Walkthrough - Learn Embedded Systems](https://www.youtube.com/watch?v=1kHd2tDOQI0)

### Reading
- [Raspberry Pi Pico C/C++ SDK documentation](https://datasheets.raspberrypi.com/pico/raspberry-pi-pico-c-sdk.pdf)
- [Pico SDK GitHub repository](https://github.com/raspberrypi/pico-sdk)
- [Getting started with Pico — official guide](https://datasheets.raspberrypi.com/pico/getting-started-with-pico.pdf)
- [ARM Cortex-M0+ Generic User Guide](https://developer.arm.com/documentation/dui0662/latest/)

### Hardware
| Item | Notes |
| --- | --- |
| Raspberry Pi Pico | Already have it |
| Micro-USB cable | Data-capable |
| Breadboard + jumper wires | For wiring buttons/LEDs |
| 330 Ω resistors, LEDs | For external LED circuits |

---

## Self-check before moving on

When all of these can be performed without looking anything up, you're ready for the [Beginner track](../../beginner/1-foundations/):

1. Install the ARM GCC toolchain, CMake, and Pico SDK on your computer
2. Set `PICO_SDK_PATH` and verify a hello-world CMake build succeeds
3. Create a new Pico project from scratch and flash it to the board
4. Blink the onboard LED at 5 Hz using `sleep_ms`
5. Read a button press using `gpio_get` with an internal pull-up
6. Generate a 1 kHz PWM signal and fade an LED
7. Read a potentiometer with ADC and `printf` the value over USB serial
8. Explain the difference between `gpio_put()` and writing directly to the GPIO register (hint: read the Pico SDK source for `gpio_put`)
