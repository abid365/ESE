# STM32 Bare-Metal Development: From Startup to Application

**Who this is for**: Embedded developers who've completed the GPIO/Timers/Interrupts and ADC modules and want to build complete bare-metal applications on STM32.
**Time to complete**: ~4 weeks, 1–2 hours per day.
**Prerequisites**: GPIO/Timers/Interrupts module, ADC module, C programming (structs, pointers, bitfields).

**Why it matters**: This module ties everything together — startup code, linker scripts, system initialization, and building a complete firmware application without any HAL or Arduino framework. You'll understand what happens before `main()` runs and how to structure bare-metal firmware projects.

---

## How this connects to embedded work

In Arduino/PlatformIO, you write:

```cpp
void setup() { /* configure hardware */ }
void loop() { /* run forever */ }
```

In bare-metal STM32:

```cpp
// startup_stm32f407vgtx.s defines Reset_Handler
// SystemInit() configures clock
// __libc_init_array() runs constructors
// main() is finally called

int main(void) {
    SystemInit();        // From system_stm32f4xx.c
    clock_init_168MHz(); // Configure PLL
    gpio_init();         // Configure GPIOs
    uart_init(115200);   // Debug serial

    printf("System running at 168MHz\n");

    while (1) {
        process_sensors();
        transmit_data();
        enter_sleep();
    }
}
```

Bare-metal project structure:

```
project/
├── startup.s              # Assembly startup code
├── system_stm32f4xx.c     # System init (clock, flash)
├── linker script.ld        # Memory layout
├── main.c                  # Application code
├── peripheral.h/c          # Register definitions
└── Makefile               # Build automation
```

---

## Module structure

### Week 1 — Startup Code and Linker Scripts

**Core idea**: Understand what happens before main() and how memory is organized.

**Key concepts to learn**:

- Cortex-M reset sequence
- Vector table placement
- Stack and heap initialization
- Memory regions (FLASH, SRAM, CCM)

::: info Glossary: Startup and Linker Terms

- **Vector Table**: An array of addresses at the start of flash. Position 0 is the initial SP (stack pointer), position 1 is the Reset_Handler address, followed by interrupt handlers.
- **Reset_Handler**: The entry point after reset — initializes .data, zeros .bss, then calls SystemInit() and main().
- **.text**: The code section — stored in flash, contains executable instructions.
- **.data**: Initialized global/static variables — stored in flash but copied to SRAM at startup.
- **.bss (Block Started by Symbol)**: Uninitialized global/static variables — zeroed at startup.
- **Linker Script**: A file (.ld) that describes memory regions and how sections are placed in them.
- **Memory-Mapped I/O**: Peripherals appear as memory addresses; writing to those addresses controls hardware.
  :::

**Startup sequence**:

```
1. Power-on reset
2. CPU reads SP (stack pointer) from address 0x00000000 (vector 0)
3. CPU reads PC (program counter) from address 0x00000004 (vector 1 = Reset_Handler)
4. Reset_Handler executes
5. SystemInit() called
6. __libc_init_array() runs C++ constructors
7. main() called
8. If main() returns, default handler loops forever
```

**Minimal startup code (ARM Assembly)**:

```assembly
.syntax unified
.cpu cortex-m4
.fpu softvfp
.thumb

.global g_pfnVectors
.global Default_Handler

.word _sidata
.word _sdata
.word _edata
.word _sbss
.word _ebss

.section .text.Reset_Handler
.weak Reset_Handler
.type Reset_Handler, %function
Reset_Handler:
    // Copy data from flash to sram
    ldr r0, =_sidata
    ldr r1, =_sdata
    ldr r2, =_edata
    movs r3, #0
    b CheckCopy

CopyLoop:
    ldr r4, [r0, r3]
    str r4, [r1, r3]
    adds r3, r3, #4

CheckCopy:
    adds r4, r1, r3
    cmp r4, r2
    bcc CopyLoop

    // Zero BSS
    ldr r2, =_sbss
    ldr r4, =_ebss
    movs r3, #0
    b CheckZero

ZeroLoop:
    str r3, [r2]
    adds r2, r2, #4

CheckZero:
    cmp r2, r4
    bcc ZeroLoop

    // Call system init
    bl SystemInit

    // Call constructors
    ldr r0, =__libc_init_array
    bl atexit
    bl __libc_init_array

    // Call main
    bl main

    // If main returns, loop
FaultLoop:
    b FaultLoop

.size Reset_Handler, .-Reset_Handler

.section .text.Default_Handler,"ax",%progbits
Default_Handler:
Infinite_Loop:
    b Infinite_Loop
    .size Default_Handler, .-Default_Handler

.section .isr_vector,"a",%progbits
.type g_pfnVectors, %object
g_pfnVectors:
    .word _estack
    .word Reset_Handler
    .word NMI_Handler
    .word HardFault_Handler
    // ... more vectors
```

**Linker script (STM32F407VG - 1MB flash, 192KB SRAM)**:

```ld
ENTRY(Reset_Handler)

MEMORY
{
    FLASH (rx)  : ORIGIN = 0x08000000, LENGTH = 1024K
    SRAM (rwx)  : ORIGIN = 0x20000000, LENGTH = 192K
    CCM   (rwx) : ORIGIN = 0x10000000, LENGTH = 64K
}

_estack = ORIGIN(SRAM) + LENGTH(SRAM);

SECTIONS
{
    .text :
    {
        . = ALIGN(4);
        *(.text)
        *(.text*)
        *(.rodata)
        *(.rodata*)
        . = ALIGN(4);
        _etext = .;
    } > FLASH

    .data :
    {
        . = ALIGN(4);
        _sdata = .;
        *(.data)
        *(.data*)
        . = ALIGN(4);
        _edata = .;
    } > SRAM AT > FLASH

    _sidata = LOADADDR(.data);

    .bss :
    {
        . = ALIGN(4);
        _sbss = .;
        *(.bss)
        *(.bss*)
        *(COMMON)
        . = ALIGN(4);
        _ebss = .;
    } > SRAM
}
```

::: warning Stack overflow
The linker sets `_estack` to the end of SRAM. If your stack grows into uninitialized memory, you'll get silent corruption. Use a stack monitor or check SP against known boundaries during development.
:::

**Check your understanding**: What happens if you declare a large array in .bss but your SRAM is smaller? Where does .data get stored during compilation vs after boot?

---

### Week 2 — Clock Configuration and SystemInit

**Core idea**: Configure the STM32 clock tree to achieve desired frequencies.

**Key concepts to learn**:

- PLL (Phase-Locked Loop) configuration
- Clock sources (HSI, HSE, PLL)
- AHB, APB bus dividers
- Flash wait states for overclocking

::: info Glossary: Clock-Related Terms

- **PLL (Phase-Locked Loop)**: A frequency multiplier — takes an input clock and outputs a higher frequency by multiplying and dividing.
- **HSI (High-Speed Internal)**: The chip's internal 16MHz RC oscillator. Inaccurate (±1%) but starts immediately.
- **HSE (High-Speed External)**: An external crystal oscillator. More accurate (±50ppm) but requires external component.
- **SYSCLK (System Clock)**: The main CPU clock — can come from HSI, HSE, or PLL.
- **AHB (Advanced High-performance Bus)**: The main system bus. CPU, DMA, and memory connect here.
- **APB (Advanced Peripheral Bus)**: Slower buses for peripherals. APB1 max 42MHz, APB2 max 84MHz on STM32F4.
- **Flash Wait States**: Extra cycles added when reading flash to account for the CPU running faster than flash can deliver instructions.
- **Flash Latency**: The number of wait states (0-5) configured in FLASH_ACR.
  :::

**STM32F4 clock tree**:

```
        _____
HSI -->|     |-->|   |-->|     |
 16MHz | PLL |   |    |   |CPU  |--> 168MHz (SYSCLK)
HSE -->|     |   | MUX|   |     |
 8MHz  |_____|   |____|   |AHB  |--> 168MHz
                 |       |APB1 |--> 42MHz (max)
                 |       |APB2 |--> 84MHz (max)
```

**Clock initialization to 168MHz**:

```cpp
// Clock initialization for STM32F4 @ 168MHz using HSE (8MHz crystal)

#define HSE_VALUE    8000000
#define HSI_VALUE    16000000
#define PLL_M        8
#define PLL_N        336
#define PLL_P        2
#define PLL_Q        7
#define FLASH_LATENCY 5

void clock_init_168MHz(void) {
    // 1. Enable HSE and wait for ready
    RCC->CR |= RCC_CR_HSEON;
    while (!(RCC->CR & RCC_CR_HSERDY));

    // 2. Configure flash wait states (needed for >120MHz)
    FLASH->ACR = FLASH_ACR_ICEN |   // Instruction cache
                 FLASH_ACR_DCEN |   // Data cache
                 FLASH_ACR_LATENCY_5WS;  // 5 wait states

    // 3. Configure AHB divider (no division = 1)
    RCC->CFGR |= RCC_CFGR_HPRE_DIV1;   // HCLK = 168MHz

    // 4. Configure APB dividers
    RCC->CFGR |= RCC_CFGR_PPRE1_DIV4;  // APB1 = 42MHz (max 42!)
    RCC->CFGR |= RCC_CFGR_PPRE2_DIV2;  // APB2 = 84MHz (max 84!)

    // 5. Configure PLL
    RCC->PLLCFGR = PLL_M |           // M divider
                   (PLL_N << 6) |     // N multiplier
                   ((PLL_P >> 1) << 16) | // P divider (2)
                   RCC_PLLCFGR_PLLSRC_HSE | // HSE source
                   (PLL_Q << 24);    // Q divider (USB, RNG)

    // 6. Enable PLL and wait
    RCC->CR |= RCC_CR_PLLON;
    while (!(RCC->CR & RCC_CR_PLLRDY));

    // 7. Select PLL as system clock
    RCC->CFGR |= RCC_CFGR_SW_PLL;
    while ((RCC->CFGR & RCC_CFGR_SWS) != RCC_CFGR_SWS_PLL);

    // System clock is now 168MHz
}
```

**Clock configuration check**:

```cpp
uint32_t get_system_clock(void) {
    uint32_t clock = 0;
    uint32_t cfgr = RCC->CFGR & RCC_CFGR_SWS;

    switch (cfgr) {
        case RCC_CFGR_SWS_HSI: clock = HSI_VALUE; break;
        case RCC_CFGR_SWS_HSE: clock = HSE_VALUE; break;
        case RCC_CFGR_SWS_PLL:
            // Calculate PLL output
            uint32_t m = RCC->PLLCFGR & 0x3F;
            uint32_t n = (RCC->PLLCFGR >> 6) & 0x1FF;
            uint32_t p = ((RCC->PLLCFGR >> 16) & 0x03) + 1;
            uint32_t source = (RCC->PLLCFGR & RCC_PLLCFGR_PLLSRC) ? HSE_VALUE : HSI_VALUE;
            clock = (source / m) * n / p;
            break;
    }
    return clock;
}
```

::: warning APB1/APB2 limits
STM32F4 APB1 bus is limited to 42MHz! If you set APB1 prescaler to 1 with 168MHz system clock, you'll overclock the bus and get unpredictable behavior. Always use dividers.
:::

**Check your understanding**: If you need 48MHz for USB, what PLL_Q value would you use with the 168MHz configuration above?

---

### Week 3 — Project Structure and Makefile

**Core idea**: Build a complete, reproducible bare-metal project with proper tooling.

**Key concepts to learn**:

- Makefile structure and targets
- Object file dependencies
- Binary formats (.bin, .hex, .elf)
- Flash programming tools (OpenOCD, st-link)

**Bare-metal project structure**:

```
bare-metal-project/
├── Makefile
├── linker/
│   └── STM32F407VG_FLASH.ld
├── src/
│   ├── main.c
│   ├── system_stm32f4xx.c
│   ├── gpio.c
│   ├── uart.c
│   └── adc.c
├── inc/
│   ├── stm32f4xx.h
│   ├── system_stm32f4xx.h
│   ├── gpio.h
│   ├── uart.h
│   └── adc.h
├── startup/
│   └── startup_stm32f407vg.s
└── README.md
```

**Makefile for bare-metal STM32**:

```makefile
# Target device
DEVICE = STM32F407VG
CPU = cortex-m4

# Toolchain
PREFIX = arm-none-eabi-
CC = $(PREFIX)gcc
AS = $(PREFIX)gcc -x assembler-with-cpp
LD = $(PREFIX)ld
OBJCOPY = $(PREFIX)objcopy
OBJDUMP = $(PREFIX)objdump
SIZE = $(PREFIX)size

# Flags
CFLAGS = -mcpu=$(CPU) -mthumb -mfloat-abi=soft \
          -Wall -fno-common -ffunction-sections -fdata-sections
CFLAGS += -MD -MP -MF .dep/$(@F).d
ASFLAGS = -mcpu=$(CPU) -mthumb -Wall
LDFLAGS = -mcpu=$(CPU) -mthumb -specs=nosys.specs \
          -lc -lm -lnosys -Wl,--gc-sections \
          -Tlinker/$(DEVICE)_FLASH.ld
LDFLAGS += -Wl,-Map=$(@:.elf=.map)

# Directories
SRC_DIR = src
INC_DIR = inc
STARTUP_DIR = startup
BUILD_DIR = build

# Source files
SOURCES = $(wildcard $(SRC_DIR)/*.c)
STARTUP = $(STARTUP_DIR)/startup_$(DEVICE).s

# Objects
OBJECTS = $(SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)
OBJECTS += $(STARTUP:%.s=$(BUILD_DIR)/%.o)

# Default target
all: $(BUILD_DIR)/$(DEVICE).elf $(BUILD_DIR)/$(DEVICE).bin $(BUILD_DIR)/$(DEVICE).hex

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) -I$(INC_DIR) -c $< -o $@

$(BUILD_DIR)/%.o: $(STARTUP_DIR)/%.s | $(BUILD_DIR)
	$(AS) $(ASFLAGS) -D__ASSEMBLY__ -I$(INC_DIR) -c $< -o $@

$(BUILD_DIR)/%.elf: $(OBJECTS)
	$(CC) $^ $(LDFLAGS) -o $@
	$(SIZE) $@

$(BUILD_DIR)/%.bin: $(BUILD_DIR)/%.elf
	$(OBJCOPY) -O binary $< $@

$(BUILD_DIR)/%.hex: $(BUILD_DIR)/%.elf
	$(OBJCOPY) -O ihex $< $@

# Flash using OpenOCD
flash: $(BUILD_DIR)/$(DEVICE).elf
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
	        -c "program $< verify reset exit"

# Erase flash
erase:
	openocd -f interface/stlink.cfg -f target/stm32f4x.cfg \
	        -c "init" -c "reset halt" -c "stm32f4x mass_erase 0" -c "shutdown"

clean:
	rm -rf $(BUILD_DIR)

.PHONY: all flash erase clean
```

**Build output**:

```
arm-none-eabi-size build/STM32F407VG.elf
   text    data     bss     dec     hex filename
  12684       0    1024   13708    358c build/STM32F407VG.elf
```

::: tip Build size optimization
Use `-Wl,--gc-sections` in LDFLAGS to remove unused code. Use `arm-none-eabi-objdump -h build/project.elf` to see section sizes. Minimizing .text (code) is critical for embedded.
:::

**Check your understanding**: What happens if you change the LDFLAGS to use a different linker script? What is the difference between .bin and .hex files?

---

### Week 4 — Debugging and System Verification

**Core idea**: Use debugging tools to verify and troubleshoot bare-metal firmware.

**Key concepts to learn**:

- GDB debugging fundamentals
- OpenOCD and ST-Link connection
- Breakpoints, watchpoints, register inspection
- System reset behavior

::: info Glossary: Debugging-Related Terms

- **GDB (GNU Debugger)**: The standard command-line debugger for embedded systems. Communicates with OpenOCD via RSP (Remote Serial Protocol).
- **OpenOCD (Open On-Chip Debugger)**: Software that bridges GDB to JTAG/SWD debug adapters like ST-Link.
- **JTAG/SWD (Joint Test Action Group / Serial Wire Debug)**: Hardware debug protocols for communicating with the chip's debug block (CoreSight on ARM).
- **ST-Link**: STMicroelectronics's debug probe, built into most Discovery and Nucleo boards.
- **Semihosting**: A technique where the target uses the host's stdin/stdout via the debug connection — slow but useful for printf debugging.
- **Breakpoint**: A marker that stops execution when the PC reaches a specific address or condition.
- **Watchpoint**: A breakpoint that triggers when a memory location is read or written.
  :::

**OpenOCD + GDB debugging session**:

```bash
# Terminal 1: Start OpenOCD
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# Terminal 2: Connect GDB
arm-none-eabi-gdb build/project.elf
(gdb) target remote localhost:3333
(gdb) monitor reset halt
(gdb) load
(gdb) monitor arm semihosting enable
(gdb) break main
(gdb) continue
```

**GDB useful commands**:

| Command                     | Shortcut | Description                     |
| --------------------------- | -------- | ------------------------------- |
| `break func`                | `b func` | Break at function               |
| `break *0x08000000`         |          | Break at address                |
| `info registers`            |          | Show CPU registers              |
| `info breakpoints`          |          | Show all breakpoints            |
| `x/16xw 0x20000000`         |          | Examine 16 words at addr        |
| `print variable`            | `p var`  | Print variable value            |
| `display/i $pc`             |          | Show current instruction        |
| `stepi`                     | `si`     | Single instruction              |
| `nexti`                     | `ni`     | Single instruction (skip calls) |
| `monitor reset halt`        |          | Reset and halt CPU              |
| `monitor mdw 0x08000000 16` |          | OpenOCD: read memory            |

**Debug startup issues**:

```cpp
// Check if we're in the right place
void assert_failed(uint8_t* file, uint32_t line) {
    volatile uint32_t* hcr = (uint32_t*)0xE000ED23;
    *hcr = 0x01;  // Enable debug faults

    printf("ASSERTION FAILED at %s:%lu\n", file, line);
    while(1);
}

// Hard fault handler
void HardFault_Handler(void) {
    volatile uint32_t hfsr = SCB->HFSR;
    volatile uint32_t cfsr = SCB->CFSR;
    volatile uint32_t mmfar = SCB->MMFAR;
    volatile uint32_t bfar = SCB->BFAR;

    if (hfsr & 0x40000000) {
        // Forced hard fault
        if (cfsr & 0x0000FF00) {
            // Configurable fault (e.g., data bus error)
        }
    }

    while(1);  // Trap here
}
```

::: tip Semihosting for debug output
Enable ARM semihosting to use `printf()` which outputs to GDB console:

```
monitor arm semihosting enable
```

Then use normal printf() in your code. This is slow but useful for debugging without UART.
:::

**Check your understanding**: If HardFault_Handler triggers immediately after reset, what are the likely causes? How would you use GDB to find the faulting instruction?

---

## Common misconceptions

| Misconception                        | Reality                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| "main() is the first code that runs" | Reset_Handler runs first; main() is called after SystemInit                         |
| "PLL can use any frequency"          | PLL input/output constrained by datasheet (F_vco must be 1-2MHz in, 192-432MHz out) |
| "All SRAM is equal"                  | STM32F4 has CCM (core-coupled memory) that's faster but cannot be used for DMA      |
| "Debug works the same as simulation" | Real hardware has timing issues, power supply noise, and chip-specific quirks       |
| "Object files contain actual code"   | Relocatable code needs linking; .bin is the actual bytes programmed to flash        |

---

## Suggested resources

### Videos

- [Makefile Tutorial for Embedded Linux/STM32 —原子雄)](https://youtube.com/watch?v=d3cJwoorzWc)
- [OpenOCD GDB Debugging — Phil Martin](https://youtube.com/watch?v=LpS6_kG6M5o)

### Reading

- **STM32F4xx Reference Manual** — Clock configuration chapter
- **ARM Cortex-M3/M4 Programming Manual** — Assembly and interrupts
- **GNU ARM Embedded Toolchain Documentation**

### Tools

| Tool              | Purpose               |
| ----------------- | --------------------- |
| OpenOCD           | JTAG/SWD debug server |
| ST-Link Utility   | STM32 programming     |
| arm-none-eabi-gdb | Debugger              |
| LLVM objdump      | Binary analysis       |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="bare-metal-stm32-checklist" :items="[
  { id: '1', label: 'Create a bare-metal project with startup code, linker script, and Makefile from scratch' },
  { id: '2', label: 'Configure PLL to run STM32F4 at 168MHz using 8MHz HSE' },
  { id: '3', label: 'Use GDB with OpenOCD to single-step through your code' },
  { id: '4', label: 'Build your project and generate both .bin and .hex files' },
  { id: '5', label: 'Analyze the .map file to find where your variables are placed' },
  { id: '6', label: 'Implement a hard fault handler that prints the fault registers' }
]" />
