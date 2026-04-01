# GPIO, Timers, and Interrupts: Bare-Metal Peripheral Control

**Who this is for**: Embedded developers who've completed the Arduino prototyping module and want to understand microcontrollers at the register level.
**Time to complete**: ~4 weeks, 1–2 hours per day.
**Prerequisites**: Arduino Prototyping, C programming (pointers, bitwise operations), basic electronics.

**Why it matters**: Arduino's `digitalWrite()` and `pinMode()` hide register manipulation. Bare-metal programming teaches you what's actually happening — configuring GPIO registers, setting timer prescalers, and writing interrupt handlers. This knowledge transfers to any microcontroller: STM32, ESP32, PIC, or ARM Cortex.

---

## How this connects to embedded work

In Arduino, you write:

```cpp
pinMode(13, OUTPUT);
digitalWrite(13, HIGH);
```

What actually happens (STM32 equivalent pseudocode):

```cpp
*(uint32_t*)0x40022000 |= (1 << 5);  // Enable GPIO clock
*(uint32_t*)0x40010800 &= ~(0xF << 4); // Clear MODE bits
*(uint32_t*)0x40010800 |= (0x3 << 4);  // Set as output
*(uint32_t*)0x4001080C |= (1 << 5);     // Set ODR bit
```

Bare-metal programming gives you:

- **Direct hardware control** — no library overhead
- **Predictable timing** — you know exactly how many cycles each operation takes
- **Smaller binaries** — no Arduino framework bloat
- **Deeper understanding** — debugging becomes easier when you know what's under the hood

---

## Module structure

### Week 1 — GPIO at the Register Level

**Core idea**: Learn to configure and control GPIO pins directly through memory-mapped registers.

**Key concepts to learn**:

- Memory-mapped I/O and peripheral addresses
- GPIO port structure (moder, otyper, ospeedr, pupdr, idr, odr)
- Clock enable registers (RCC)
- Bit banding for atomic operations

**Understanding memory-mapped I/O**:

Microcontroller peripherals are accessed like memory — reading/writing to specific addresses controls hardware. The STM32F4 reference manual contains a "Memory Map" showing each peripheral's base address.

```
Peripheral Base Addresses (STM32F4):
- GPIOA: 0x40020000
- GPIOB: 0x40020400
- GPIOC: 0x40020800
- ...
- RCC:  0x40023800 (Reset and Clock Control)
```

**GPIO configuration sequence**:

```cpp
// Example: Configure PA5 as output (LED on STM32F4Discovery)

// 1. Enable GPIOA clock in RCC
RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

// 2. Configure PA5 as output (moder = 01)
GPIOA->MODER &= ~GPIO_MODER_MODER5;  // Clear bits
GPIOA->MODER |= GPIO_MODER_MODER5_0; // Set bit 0 to 01

// 3. Set output high
GPIOA->ODR |= GPIO_ODR_OD5;
```

**GPIO port registers explained**:

| Register | Function          | Notes                            |
| -------- | ----------------- | -------------------------------- |
| MODER    | Mode selection    | Input, Output, Alternate, Analog |
| OTYPER   | Output type       | Push-pull or Open-drain          |
| OSPEEDR  | Speed             | Low, Medium, Fast, High          |
| PUPDR    | Pull-up/Pull-down | None, Pull-up, Pull-down         |
| IDR      | Input data        | Read-only                        |
| ODR      | Output data       | Read/write                       |
| BSRR     | Bit set/reset     | Atomic set/reset                 |

**Bit manipulation essentials**:

```cpp
// Setting a bit (set bit 5 high)
REG |= (1 << 5);

// Clearing a bit (set bit 5 low)
REG &= ~(1 << 5);

// Toggling a bit
REG ^= (1 << 5);

// Setting multiple bits
REG |= (1 << 5) | (1 << 9);

// Atomic set/reset using BSRR (preferred for outputs)
GPIOA->BSRR = (1 << 5);    // Set PA5 high
GPIOA->BSRR = (1 << 16);    // Reset PA5 low
```

::: tip Bit banding
Cortex-M3/M4 cores support bit banding — aliased addresses where each bit has a unique 32-bit address. This enables atomic read-modify-write without disabling interrupts:

```
Bit band alias: 0x42000000 + (offset * 32) + (bit * 4)
```

:::

**Check your understanding**: What happens if you write to ODR without first enabling the GPIO clock? What is the difference between BSRR and ODR for setting output pins?

---

### Week 2 — Timer Configuration and PWM

**Core idea**: Use hardware timers for precise timing independent of CPU load.

**Key concepts to learn**:

- Timer clock sources and prescaling
- Auto-reload register (ARR) and prescaler (PSC)
- Output compare mode and PWM generation
- Timer interrupts (update, capture/compare)

::: info Glossary: Timer-Related Terms

- **ARR (Auto-Reload Register)**: Determines the timer's overflow value. When CNT reaches ARR, it resets to 0 (or reloads) and optionally triggers an interrupt.
- **PSC (Prescaler)**: Divides the timer input clock. A PSC of 8399 means the counter increments once every 8400 clock cycles.
- **CNT (Counter)**: The timer's internal counter that increments on each tick.
- **CCR (Capture/Compare Register)**: Stores the value to compare against CNT for output or interrupt generation.
- **PWM (Pulse-Width Modulation)**: Duty cycle variation where the compare match controls how long the output is high vs low.
  :::

**Timer architecture**:

```
Timer Clock (APB) → Prescaler (PSC) → Counter (CNT) → Auto-reload (ARR) → Overflow/Update
                                    ↓
                         Capture/Compare Registers
```

**Basic timer configuration**:

```cpp
// Configure TIM2 for 1ms ticks
// Assuming APB1 clock = 84MHz

void timer2_init(void) {
    // 1. Enable TIM2 clock
    RCC->APB1ENR |= RCC_APB1ENR_TIM2EN;

    // 2. Set prescaler (84MHz / 8400 = 10kHz)
    TIM2->PSC = 8399;

    // 3. Set auto-reload (10kHz / 1000 = 10Hz = 1000ms)
    TIM2->ARR = 999;

    // 4. Enable update interrupt
    TIM2->DIER |= TIM_DIER_UIE;

    // 5. Start counter
    TIM2->CR1 |= TIM_CR1_CEN;
}
```

**PWM generation with timer**:

```cpp
// Configure TIM3 CH2 (PC7) for PWM output
void pwm_init(void) {
    // Enable GPIOC clock and configure PC7 as AF
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOCEN;
    GPIOC->MODER &= ~GPIO_MODER_MODER7;
    GPIOC->MODER |= GPIO_MODER_MODER7_1;  // AF mode
    GPIOC->AFR[0] |= (2 << 28);           // AF2 for PC7 (TIM3_CH2)

    // Enable TIM3 clock
    RCC->APB1ENR |= RCC_APB1ENR_TIM3EN;

    // Configure PWM
    TIM3->PSC = 83;           // 84MHz / 84 = 1MHz
    TIM3->ARR = 999;          // 1MHz / 1000 = 1kHz PWM
    TIM3->CCR2 = 500;         // 50% duty cycle

    TIM3->CCMR1 &= ~TIM_CCMR1_OC2M;        // Clear OC2 mode
    TIM3->CCMR1 |= TIM_CCMR1_OC2M_1 | TIM_CCMR1_OC2M_2;  // PWM mode 1
    TIM3->CCMR1 |= TIM_CCMR1_OC2PE;       // Enable preload

    TIM3->CCER |= TIM_CCER_CC2E;          // Enable capture/compare

    TIM3->CR1 |= TIM_CR1_CEN;             // Enable counter
}

// Adjust duty cycle (0-999)
void pwm_set_duty(uint16_t duty) {
    if (duty > 999) duty = 999;
    TIM3->CCR2 = duty;
}
```

**Timer interrupt handler**:

```cpp
volatile uint32_t milliseconds = 0;

void TIM2_IRQHandler(void) {
    if (TIM2->SR & TIM_SR_UIF) {
        TIM2->SR &= ~TIM_SR_UIF;  // Clear interrupt flag
        milliseconds++;
    }
}

// Usage
uint32_t get_tick(void) {
    return milliseconds;
}

void delay_ms(uint32_t ms) {
    uint32_t start = milliseconds;
    while ((milliseconds - start) < ms);
}
```

::: warning Timer clock frequency
Timer clocks come from APB1 or APB2 buses, which may be double the core frequency. Always check the clock tree in your reference manual. On STM32F4, APB1 max is 42MHz, APB2 max is 84MHz.
:::

**Check your understanding**: If you want a 1Hz timer interrupt on a 84MHz system with a 16-bit timer, what PSC and ARR values would you use? What happens if PSC = 0 vs PSC = 1?

---

### Week 3 — Interrupt Handling and Priority

**Core idea**: Respond to hardware events immediately with interrupt service routines (ISRs).

**Key concepts to learn**:

- NVIC (Nested Vector Interrupt Controller)
- Interrupt enable and priority configuration
- ISR writing conventions (naked, weak attributes)
- Clearing vs acknowledging interrupt flags

::: info Glossary: Interrupt-Related Terms

- **ISR (Interrupt Service Routine)**: A function that executes when a hardware interrupt occurs. Should be short and fast.
- **NVIC (Nested Vector Interrupt Controller)**: The Cortex-M block that manages interrupt enable, priority, and pending states.
- **IRQn (Interrupt Request Number)**: A number assigned to each interrupt source (e.g., TIM2_IRQn = 28).
- **Priority**: Determines which interrupt runs first when multiple are pending. Lower number = higher priority.
- **Pending Bit**: Set when an interrupt occurs but cannot be serviced yet; cleared when the ISR runs.
- **Masking**: Temporarily disabling interrupts (globally or per-source) to create critical sections.
  :::

**NVIC overview**:

The Cortex-M NVIC manages all interrupts. Each interrupt has:

- **Enable bit** — turn the interrupt on/off
- **Priority** — higher priority = lower number (0 is highest)
- **Pending bit** — set when interrupt occurs, cleared when handled

```cpp
// Enable TIM2 interrupt in NVIC
NVIC_EnableIRQ(TIM2_IRQn);
NVIC_SetPriority(TIM2_IRQn, 1);  // Priority 1 (0 = highest)

// Or direct register access
*(uint32_t*)0xE000E100 = (1 << 28);  // Enable TIM2 (IRQ 28)
*(uint32_t*)0xE000E400 = (1 << 4);   // Set priority to 1
```

**Writing ISRs**:

```cpp
// In C, with startup code defining the vector
void TIM2_IRQHandler(void) {
    // 1. Check the flag (always check before clearing!)
    if (TIM2->SR & TIM_SR_UIF) {
        // 2. Clear the flag FIRST (some chips require this)
        TIM2->SR = ~TIM_SR_UIF;

        // 3. Do work
        // ...
    }
}
```

**External interrupt (EXTI) example**:

```cpp
// Configure PA0 as external interrupt (falling edge)
void exti_init(void) {
    // Enable SYSCFG clock
    RCC->APB2ENR |= RCC_APB2ENR_SYSCFGEN;

    // Select PA0 as EXTI0 source
    SYSCFG->EXTICR[0] &= ~SYSCFG_EXTICR1_EXTI0;
    SYSCFG->EXTICR[0] |= SYSCFG_EXTICR1_EXTI0_PA;

    // Configure EXTI0
    EXTI->IMR |= EXTI_IMR_IM0;      // Unmask
    EXTI->FTSR |= EXTI_FTSR_TR0;   // Falling edge trigger

    // Enable in NVIC
    NVIC_EnableIRQ(EXTI0_IRQn);
    NVIC_SetPriority(EXTI0_IRQn, 0);
}

void EXTI0_IRQHandler(void) {
    if (EXTI->PR & EXTI_PR_PR0) {
        EXTI->PR = EXTI_PR_PR0;  // Clear pending

        // Handle button press
        // ...
    }
}
```

**Interrupt priority levels**:

| Priority | Name    | Use Case                 |
| -------- | ------- | ------------------------ |
| 0        | Highest | System tick, hard faults |
| 1-2      | High    | Time-critical hardware   |
| 3-4      | Medium  | Normal peripherals       |
| 5+       | Low     | Non-critical, debug      |

::: warning Don't do too much in an ISR
ISRs should be short and fast. Set flags for main code to process, avoid blocking operations (delay, printf), and be careful with data sharing (use volatile or disable interrupts).
:::

::: tip Interrupt precedence in Cortex-M
Lower priority number = higher precedence. But in NVIC registers, higher value = higher priority for some reason. Check your vendor header definitions carefully.
:::

**Check your understanding**: Can two interrupts of the same priority run at the same time? What determines which runs first? What is a pending interrupt?

---

### Week 4 — Real-Time Constraints and Optimization

**Core idea**: Understand timing guarantees and optimize for predictable, deterministic behavior.

**Key concepts to learn**:

- Interrupt latency and response time
- Critical sections (global interrupts)
- Memory barriers and instruction synchronization
- Power optimization (sleep modes)

::: info Glossary: Timing and Optimization Terms

- **Latency**: Time delay between an event and the system's response to it. For interrupts, this is the time from interrupt signal to first ISR instruction.
- **Jitter**: Variation in timing. Real-time systems require bounded jitter (predictable max deviation).
- **Critical Section**: A code region where interrupts are disabled to prevent concurrent access to shared data.
- **Memory Barrier (\_\_DMB)**: An instruction that ensures all memory accesses before the barrier complete before any after it start.
- **WFI (Wait For Interrupt)**: A CPU instruction that stops execution until an interrupt occurs. Used for sleep modes.
- **DWT (Data Watchpoint and Trace)**: A Cortex-M debug component that includes a cycle counter used for precise timing measurement.
  :::

**Interrupt latency**:

```
Interrupt latency = Time from interrupt signal to first ISR instruction
Interrupt response = Latency + ISR execution time
```

Typical Cortex-M3/M4 interrupt latency: 12-20 cycles

**Critical sections**:

```cpp
// Method 1: Disable interrupts
__disable_irq();
/* critical code */
__enable_irq();

// Method 2: Use BASEPRI (Cortex-M)
__set_BASEPRI_MAX(1 << 4);  // Block priority 1 and below
/* critical code */
__set_BASEPRI(0);           // Restore

// Method 3: Use PRIMASK
uint32_t primask = __get_PRIMASK();
__disable_irq();
/* critical code */
__set_PRIMASK(primask);
```

**Predictable timing patterns**:

```cpp
// Anti-pattern: Variable execution time
void process_data(void) {
    for (int i = 0; i < count; i++) {  // count varies!
        do_work(i);
    }
}

// Better: Fixed iteration count
void process_data(void) {
    for (int i = 0; i < MAX_COUNT; i++) {
        if (i < count) do_work(i);  // Conditional inside
    }
}

// Best: Deterministic instructions
void process_data(void) {
    int i = 0;
    while (i < count) {
        do_work(i);
        i++;
    }
}
```

**Using DWT cycle counter for precise timing**:

```cpp
void dwt_init(void) {
    DEM_CR |= DEM_CR_TRCENA;    // Enable trace
    DWT_CYCCNT = 0;             // Reset counter
    DWT_CR |= DWT_CR_CYCCNTENA; // Enable cycle counter
}

uint32_t dwt_get_cycles(void) {
    return DWT_CYCCNT;
}

void delay_cycles(uint32_t cycles) {
    uint32_t start = DWT_CYCCNT;
    while ((DWT_CYCCNT - start) < cycles);
}
```

::: warning Compiler optimization effects
The compiler may reorder or eliminate code, especially around volatile variables and timing-sensitive sections. Use `__volatile__`, memory barriers (`__DMB()`), or inline assembly when exact sequence matters.
:::

**Check your understanding**: What is the maximum latency your system can tolerate for a button press interrupt? How would you measure it?

---

## Common misconceptions

| Misconception                           | Reality                                                                |
| --------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------- |
| "More clock speed = faster code"        | Peripheral access speed matters more; flash wait states can bottleneck |
| "Bitwise OR always sets bits"           | `REG                                                                   | = (1<<5)`sets bit 5, but`REG = REG \| value` reads, modifies, writes |
| "Interrupts always execute immediately" | Pending interrupts wait for current instruction and priority check     |
| "volatile is enough for shared data"    | ISR-to-main communication needs memory barriers or critical sections   |
| "delay_ms() is accurate"                | Software delays depend on interrupts firing; use hardware timers       |

---

## Suggested resources

### Videos

- [Bare Metal Embedded Programming: Theory and Practice Using STM32](https://www.youtube.com/playlist?list=PLP29wDx6HiE7S8p2W_vP_i8S-K1vW3c5O)
- [STM32 Peripheral Access — Controllerstech](https://youtube.com/playlist?list=PLfIJKC1ud8AhfquK7N7p0t1L4hH1G9j9m)

### Reading

- **STM32F4 Reference Manual (RM0090)**: Complete register documentation
- **Cortex-M3/M4 Programming Manual**: ARM processor core documentation
- **Embedded Systems Fundamentals** (Alexander Dean) — Good bare-metal foundations

### Hardware (recommended)

| Board                  | Notes                                                 |
| ---------------------- | ----------------------------------------------------- |
| STM32F4Discovery       | 168MHz Cortex-M4, many peripherals, good for learning |
| STM32 Nucleo-F401RE    | Arduino-compatible headers, cheap                     |
| Black Pill (STM32F411) | Cheap, breadboard-friendly, no built-in debugger      |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="bare-metal-gpio-timers-checklist" :items="[
  { id: '1', label: 'Configure a GPIO pin as output and toggle it using BSRR register' },
  { id: '2', label: 'Set up a timer to generate a 1kHz PWM signal with 75% duty cycle' },
  { id: '3', label: 'Write an external interrupt handler for a button press on EXTI' },
  { id: '4', label: 'Calculate PSC and ARR values for a 10ms timer interrupt at 84MHz' },
  { id: '5', label: 'Implement a critical section that prevents timer interrupts from interfering' },
  { id: '6', label: 'Explain the difference between latency and response time for interrupts' }
]" />
