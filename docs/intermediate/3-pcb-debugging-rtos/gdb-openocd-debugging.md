# GDB and OpenOCD Debugging

**Who this is for**: Embedded developers who want to debug firmware beyond printf statements
**Time to complete**: 3 weeks
**Prerequisites**: STM32 Bare-Metal Development, GPIO/Timers/Interrupts, C Syntax Basics

**Why it matters**: printf debugging works for simple cases, but real firmware bugs—race conditions, timing issues, memory corruption—require real debugging tools. GDB with OpenOCD gives you hardware-level debugging: stop the CPU, inspect variables, set breakpoints, and watch memory change in real-time.

---

## How this connects to embedded work

Before this module, you might have used serial print statements to figure out why your code misbehaved. This works for simple cases but has major drawbacks:

- **Before**: Adding printf() everywhere, recompiling, hoping you catch the bug
- **After**: Setting breakpoints, stepping through code, watching variables change, catching hard faults with full register dumps

This module connects your C programming skills to actual hardware debugging. You'll learn to debug issues that are impossible to find with print statements: timing bugs, interrupt race conditions, and memory corruption.

---

## Module structure

### Week 1 — GDB Fundamentals

**Core idea**: Master GDB commands for source-level debugging of embedded applications

**Key concepts to learn**:

- GDB command line interface
- Starting and stopping programs
- Setting breakpoints (break, tbreak, watch)
- Inspecting variables and registers
- Stepping through code (step, next, finish, continue)
- Examining memory (x command)

::: info Glossary: GDB-Related Terms

- **Breakpoint**: A point where execution pauses so you can inspect state
- **Watchpoint**: Triggers when a variable's value changes
- **Step**: Execute one source line, diving into function calls
- **Next**: Execute one source line, stepping over function calls
- **Continue**: Resume execution until next breakpoint/watchpoint
- **Frame**: The current function call stack frame
- **Register**: CPU registers (PC, SP, LR, R0-R12 on ARM Cortex-M)
  :::

**GDB basic commands**:

| Command           | Shortcut | Description                      |
| ----------------- | -------- | -------------------------------- |
| `break function`  | `b`      | Set breakpoint at function entry |
| `break file:line` | `b`      | Set breakpoint at source line    |
| `run`             | `r`      | Start program execution          |
| `continue`        | `c`      | Resume execution                 |
| `step`            | `s`      | Step one line (into functions)   |
| `next`            | `n`      | Step one line (over functions)   |
| `print var`       | `p var`  | Print variable value             |
| `info registers`  | -        | Show all register values         |
| `backtrace`       | `bt`     | Show call stack                  |
| `list`            | `l`      | Show source code                 |
| `quit`            | `q`      | Exit GDB                         |

**Practical GDB session**:

```bash
# Load program and connect to OpenOCD
arm-none-eabi-gdb firmware.elf

# In GDB prompt:
(gdb) target remote localhost:3333    # Connect to OpenOCD
(gdb) monitor reset halt             # Reset and halt MCU
(gdb) load                           # Flash the firmware
(gdb) break main                     # Break at main
(gdb) continue                       # Run to main
(gdb) next                           # Step through main
(gdb) print counter                  # Print variable
(gdb) watch counter                  # Stop when counter changes
(gdb) continue                       # Run until counter changes
```

**Examining memory with x command**:

```
(gdb) x/4xw 0x20000000     # Examine 4 words (4*4=16 bytes) in hex
0x20000000:  0x00000001    0x00000002    0x00000003    0x00000004

(gdb) x/8xb my_string      # Examine 8 bytes as hex
(gdb) x/s 0x20000010        # Examine as string
(gdb) x/4dw 0x20000000      # Examine 4 words as signed decimal
```

::: tip Pro Tip
Use `display` command to automatically print a variable after each step:

```
(gdb) display counter
(gdb) display/x my_pointer
```

:::

**Check your understanding**:

- What's the difference between `step` and `next` when stepping over a function call?
- How would you set a breakpoint at line 42 of main.c?
- What does `bt` (backtrace) show you?

---

### Week 2 — OpenOCD and Hardware Debugging

**Core idea**: Connect GDB to actual hardware through OpenOCD debug probe interface

**Key concepts to learn**:

- JTAG vs SWD (Serial Wire Debug)
- OpenOCD configuration files
- Debug probe options: ST-Link, J-Link, CMSIS-DAP
- Flash programming via OpenOCD
- Reset and halt control
- Multi-core debugging basics

::: info Glossary: Debug Interface Terms

- **JTAG**: Joint Test Action Group—standard debug/test interface with 4+ wires (TMS, TCK, TDI, TDO)
- **SWD**: Serial Wire Debug—2-wire alternative to JTAG (SWDIO, SWCLK)
- **Debug probe**: Hardware device bridging USB to target's debug interface
- **OpenOCD**: Open On-Chip Debugger—software that speaks GDB protocol and talks to debug probes
- **SWDIO**: Serial Wire Debug I/O (bidirectional data)
- **SWCLK**: Serial Wire Clock
  :::

**OpenOCD architecture**:

```
┌─────────────┐     TCP/IP      ┌─────────────┐     JTAG/SWD     ┌─────────────┐
│   GDB       │ ◄──────────────►│   OpenOCD   │ ◄────────────────►│   Target    │
│  (Client)   │                 │   (Server)   │                   │   MCU       │
└─────────────┘                 └─────────────┘                   └─────────────┘
    Port 3333                       USB                             20-pin JTAG
                                    │                               or 10-pin SWD
                              ┌─────┴─────┐
                              │ Debug     │
                              │ Probe     │
                              │ (ST-Link) │
                              └───────────┘
```

**OpenOCD configuration for STM32F4**:

Create `openocd.cfg`:

```
# Debug adapter (ST-Link v2)
adapter driver stlink

# Transport (SWD for STM32)
transport select hla_swd

# Target chip
source [find target/stm32f4x.cfg]

# Clock speed
adapter speed 4000

# Reset configuration
reset_config srst_only
```

**Launching OpenOCD**:

```bash
# Terminal 1: Start OpenOCD
openocd -f interface/stlink.cfg -f target/stm32f4x.cfg

# Terminal 2: Connect with GDB
arm-none-eabi-gdb firmware.elf
(gdb) target remote localhost:3333
```

**ST-Link v2 vs J-Link vs CMSIS-DAP**:

| Probe      | Pros                                 | Cons                       |
| ---------- | ------------------------------------ | -------------------------- |
| ST-Link v2 | Cheap ($5-20), works with STM32      | Limited to STM32, no trace |
| J-Link     | Fast, many devices, trace support    | Expensive (~$300+)         |
| CMSIS-DAP  | Open standard, works with many chips | Slower than J-Link         |

**Flash programming**:

```
(gdb) monitor reset halt     # Reset and halt
(gdb) flash erase_address    # Erase flash if needed
(gdb) load                   # Program flash
(gdb) monitor reset run      # Reset and run
```

**Useful OpenOCD commands**:

```
monitor reset halt           # Reset and halt
monitor flash erase_address 0x08000000 0x10000  # Erase 64KB
monitor reset run            # Reset and continue
monitor sleep 500            # Wait 500ms
```

::: warning Important
OpenOCD must be running BEFORE you start GDB. GDB connects to OpenOCD, not directly to the hardware.
:::

**Check your understanding**:

- Why does OpenOCD need to run in a separate process from GDB?
- What's the difference between JTAG and SWD?
- Your OpenOCD says "Error: init timeout". What could be wrong?

---

### Week 3 — Advanced Debugging Techniques

**Core idea**: Debug real-world embedded problems: hard faults, race conditions, and memory issues

**Key concepts to learn**:

- Hard fault analysis: reading fault registers and stack trace
- Conditional breakpoints
- Watchpoints for detecting memory corruption
- Post-mortem debugging with core dumps
- Debugging optimized code
- RTOS-aware debugging

**Hard fault debugging**:

When your MCU hits a hard fault, the stack frame contains valuable information:

```c
// In your hard fault handler
void HardFault_Handler(void) {
    __asm volatile(
        "tst lr, #4\n"
        "ite eq\n"
        "mrseq r0, msp\n"
        "mrsne r0, psp\n"
        "mov r1, lr\n"
        "bl PrintFaultInfo"
    );
}

void PrintFaultInfo(uint32_t* stack) {
    // stack[0] = R0
    // stack[1] = R1
    // stack[2] = R2
    // stack[3] = R3
    // stack[4] = R12
    // stack[5] = LR
    // stack[6] = PC (where fault occurred)
    // stack[7] = xPSR

    printf("Hard Fault!\n");
    printf("PC = 0x%08lX\n", stack[6]);
    printf("LR = 0x%08lX\n", stack[5]);
    printf("HFSR = 0x%08lX\n", SCB->HFSR);
    printf("CFSR = 0x%08lX\n", SCB->CFSR);
}
```

**Fault register meanings**:

| Register | Name                      | Purpose                                  |
| -------- | ------------------------- | ---------------------------------------- |
| HFSR     | Hard Fault Status         | What caused hard fault                   |
| CFSR     | Configurable Fault Status | Details of fault (memManage, bus, usage) |
| MMFAR    | MemManage Fault Address   | Address that caused fault                |
| BFAR     | Bus Fault Address         | Address that caused fault                |

**CFSR bitfield analysis**:

```
CFSR = 0x00008200  // Example value

Byte 2: UsageFault
  - DIVBYZERO (bit 25)
  - UNALIGNED (bit 24)

Byte 1: BusFault
  - BFARVALID (bit 15)
  - IMPRECISERR (bit 13)
  - PRECISERR (bit 12)

Byte 0: MemManage
  - MMARVALID (bit 7)
  - IACCVIOL (bit 0)
```

**Conditional breakpoints**:

```
(gdb) break my_function
(gdb) condition 1 counter > 10    # Stop only when counter > 10
(gdb) condition 1                  # List condition
(gdb) delete condition 1           # Remove condition
```

**Watchpoint for memory corruption**:

```
(gdb) watch global_variable        # Stop when variable changes
(gdb) watch *0x20000000             # Watch memory location
(gdb) watch *(uint32_t*)0x20000000 # Watch 32-bit value

(gdb) rwatch global_variable       # Stop on read
(gdb) awatch global_variable       # Stop on read or write
```

::: warning Hardware Limit
ARM Cortex-M has 4 hardware watchpoints. Complex bugs may need multiple debugging sessions.
:::

**Debugging optimized code**:

When you compile with `-O2` or `-O3`, the debugger shows confusing values because of reordering and register allocation. Solutions:

1. **Compile with `-Og`** (recommended for debug):

   ```bash
   arm-none-eabi-gcc -Og -g3 -o firmware.elf main.c
   ```

2. **Use volatile** for variables that change unexpectedly:

   ```c
   volatile uint32_t* const TIMER_CNT = (uint32_t*)0x40010024;
   ```

3. **Understand register allocation**:
   ```c
   // Compiler might keep 'i' in R0, not memory
   for (int i = 0; i < 100; i++) { ... }
   // Use 'display i' to see current value
   ```

**Debug symbols**:

| Flag     | Meaning                       |
| -------- | ----------------------------- |
| `-g`     | Basic debug symbols           |
| `-g3`    | Include macro definitions     |
| `-ggdb3` | GDB-specific extended symbols |

::: tip Best Practice
Always compile with `-g3` during development. The size overhead is minimal, and full debug info is invaluable.
:::

**Common debugging scenarios**:

| Symptom                     | Likely Cause                     | Debug Approach                         |
| --------------------------- | -------------------------------- | -------------------------------------- |
| Variables show wrong values | Memory corruption, optimization  | Use `-Og`, check array bounds          |
| Code jumps unexpectedly     | Stack corruption, wild pointer   | Check stack pointer, use watchpoints   |
| ISR never executes          | NVIC not enabled, priority wrong | Check ISER register, interrupt enable  |
| Hard fault on function call | Stack overflow, bad pointer      | Check stack usage, analyze stack frame |
| Debugger disconnects        | Hardware issue, brownout         | Check power, debug connector           |

**Check your understanding**:

- A hard fault occurs. The stack shows PC = 0x08001234. How do you find what source line caused it?
- You suspect a pointer is corrupting memory. How would you use watchpoints to find it?
- Why might `print my_variable` show a different value than expected when optimization is enabled?

---

## Common misconceptions

| Misconception                                  | Reality                                                                                       |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------- |
| "GDB is too complicated—I can just use printf" | Printf can't catch race conditions, timing bugs, or find memory corruption                    |
| "OpenOCD and GDB are the same thing"           | OpenOCD is the server that talks to hardware; GDB is the client that talks to OpenOCD         |
| "Debug symbols make my code slow"              | Debug symbols don't run—only add info to .elf file                                            |
| "I can debug with -O2 just fine"               | Optimization causes variable values to be unreliable in debugger                              |
| "Watchpoints work like breakpoints"            | Watchpoints are hardware-limited (typically 4) and may not work as expected with optimization |

---

## Suggested resources

### Videos

- [How to Use OpenOCD to Debug Embedded Software with GDB](https://www.youtube.com/watch?v=LpS6_kG6M5o)
- [GDB Tutorial - Derek Molloy](https://www.youtube.com/watch?v=7195_D8AcHM)
- [ARM Cortex-M Debugging - IoT DevFest](https://www.youtube.com/watch?v=97se8McqNs0)
- [Reverse Engineering Embedded Systems - Joe Grand](https://www.youtube.com/watch?v=T7qRzue-N1c)

### Reading

- [GDB User Manual](https://sourceware.org/gdb/current/onlinedocs/gdb/)
- [OpenOCD Manual](https://openocd.org/documentation.html)
- [ARMv7-M Architecture Reference Manual](https://developer.arm.com/documentation/ddi0403/latest/)
- [Debugging Hard Faults on ARM Cortex-M](https://www.segger.com/debugging-hard-faults-on-arm-cortex-m/)

### Hardware

| Item              | Notes                         |
| ----------------- | ----------------------------- |
| ST-Link v2 or v3  | Budget debug probe for STM32  |
| J-Link EDU        | Education discount for J-Link |
| 20-pin JTAG cable | For JTAG-based debugging      |
| 10-pin SWD cable  | For SWD-based debugging       |
| Logic analyzer    | For timing verification       |

---

## Self-check before moving on

When all skills below can be performed without looking anything up, the module is complete.

### GDB and OpenOCD Debugging

1. Connect GDB to OpenOCD and load firmware onto an STM32 target
2. Set a breakpoint at a function, run to it, and step through with `next` and `step`
3. Use `print` and `display` to inspect variables during execution
4. Use `watch` to detect when a variable changes value
5. Analyze a hard fault by reading SCB->CFSR and locating the faulting PC
6. Set a conditional breakpoint that stops only when a counter exceeds a threshold
7. Debug code compiled with `-Og` and explain any differences from `-O0`
8. Use the `bt` command to trace a call stack and identify function call order
