# Advanced C Techniques: Writing Maintainable Embedded Code

**Who this is for**: Embedded developers who've completed the bare-metal module and want to write cleaner, safer, more maintainable firmware code.
**Time to complete**: ~3 weeks, 1–2 hours per day.
**Prerequisites**: Bare-Metal module, C programming (pointers, structures, bitfields), understanding of memory-mapped hardware.

**Why it matters**: Bare-metal code often becomes spaghetti — global variables everywhere, magic numbers scattered through functions, and no abstraction between hardware and application layers. This module teaches you to write C the way professional embedded engineers do: with clear abstractions, safe memory practices, and testable design patterns.

---

## How this connects to embedded work

**Before (messy code)**:

```cpp
volatile uint32_t* const UART1_DR = (uint32_t*)0x40013804;
volatile uint32_t* const UART1_SR = (uint32_t*)0x40013800;
#define BAUD_115200 115200

void uart_send(char c) {
    while (!(*UART1_SR & (1 << 7)));  // Wait for TXE
    *UART1_DR = c;
}
```

**After (clean abstraction)**:

```cpp
#include "uart.h"

UART_HandleTypeDef huart1 = {
    .base = UART1_BASE,
    .baud = 115200,
    .word_length = UART_WORDLENGTH_8,
    .stop_bits = UART_STOPBITS_1,
};

void uart_init(&huart1);
uart_send(&huart1, 'A');
```

Clean code principles:

- **Hardware abstraction** — isolate register access behind functions
- **Typedef structs** — group related configuration
- **Const correctness** — prevent accidental writes
- **DRY (Don't Repeat Yourself)** — macros for common patterns

---

## Module structure

### Week 1 — Hardware Abstraction and Typedef Structs

**Core idea**: Create clean interfaces between application code and hardware registers.

**Key concepts to learn**:

- Typedef structs for peripheral configuration
- Handle pattern (opaque pointers)
- Static inline functions for register access
- Peripheral initialization patterns

::: info Glossary: Code Architecture Terms

- **HAL (Hardware Abstraction Layer)**: A software layer that provides a consistent API for hardware access, hiding register details.
- **Handle (or HandleTypeDef)**: A structure that holds all configuration and state for a peripheral instance.
- **Opaque Pointer**: A pointer to a structure whose internals are hidden from the caller — only the pointer is exposed.
- **Init/Deinit Pattern**: Standard initialization function that configures hardware, and optional deinitialization to reset it.
- **const-correctness**: Using `const` to prevent modification of parameters or data that shouldn't change.

:::

**Typedef struct for GPIO**:

```cpp
// gpio.h - Hardware abstraction for GPIO

#ifndef GPIO_H
#define GPIO_H

#include <stdint.h>

// Peripheral base addresses
#define GPIOA_BASE   0x40020000
#define GPIOB_BASE   0x40020400
#define GPIOC_BASE   0x40020800

// Register offsets
#define GPIO_MODER_OFFSET    0x00
#define GPIO_OTYPER_OFFSET   0x04
#define GPIO_OSPEEDR_OFFSET   0x08
#define GPIO_PUPDR_OFFSET    0x0C
#define GPIO_IDR_OFFSET      0x10
#define GPIO_ODR_OFFSET      0x14
#define GPIO_BSRR_OFFSET     0x18
#define GPIO_LCKR_OFFSET     0x1C
#define GPIO_AFRL_OFFSET     0x20
#define GPIO_AFRH_OFFSET     0x24

// GPIO mode values
typedef enum {
    GPIO_MODE_INPUT  = 0,
    GPIO_MODE_OUTPUT = 1,
    GPIO_MODE_AF    = 2,
    GPIO_MODE_ANALOG = 3,
} GPIO_Mode_TypeDef;

// GPIO output type
typedef enum {
    GPIO_OTYPE_PP = 0,  // Push-pull
    GPIO_OTYPE_OD = 1,  // Open-drain
} GPIO_OType_TypeDef;

// GPIO pull-up/down
typedef enum {
    GPIO_PUPD_NONE    = 0,
    GPIO_PUPD_PULLUP  = 1,
    GPIO_PUPD_PULLDOWN = 2,
} GPIO_PuPd_TypeDef;

// GPIO speed
typedef enum {
    GPIO_SPEED_LOW    = 0,
    GPIO_SPEED_MEDIUM = 1,
    GPIO_SPEED_FAST   = 2,
    GPIO_SPEED_HIGH   = 3,
} GPIO_Speed_TypeDef;

// GPIO pin number
typedef enum {
    GPIO_PIN_0  = (1 << 0),
    GPIO_PIN_1  = (1 << 1),
    GPIO_PIN_2  = (1 << 2),
    GPIO_PIN_3  = (1 << 3),
    GPIO_PIN_4  = (1 << 4),
    GPIO_PIN_5  = (1 << 5),
    GPIO_PIN_6  = (1 << 6),
    GPIO_PIN_7  = (1 << 7),
    GPIO_PIN_8  = (1 << 8),
    GPIO_PIN_9  = (1 << 9),
    GPIO_PIN_10 = (1 << 10),
    GPIO_PIN_11 = (1 << 11),
    GPIO_PIN_12 = (1 << 12),
    GPIO_PIN_13 = (1 << 13),
    GPIO_PIN_14 = (1 << 14),
    GPIO_PIN_15 = (1 << 15),
    GPIO_PIN_ALL = 0xFFFF,
} GPIO_Pin_TypeDef;

// GPIO handle structure
typedef struct {
    volatile uint32_t* base;
    GPIO_Mode_TypeDef  mode;
    GPIO_OType_TypeDef otype;
    GPIO_Speed_TypeDef speed;
    GPIO_PuPd_TypeDef  pupd;
    uint16_t          pin;
} GPIO_HandleTypeDef;

// Register access macros
#define GPIO_REG(base, offset)   (*(volatile uint32_t*)((base) + (offset)))

// Static inline functions for GPIO operations
static inline void gpio_write_pin(GPIO_HandleTypeDef* gpio, uint8_t state) {
    if (state) {
        GPIO_REG(gpio->base, GPIO_BSRR_OFFSET) = gpio->pin;           // Set
    } else {
        GPIO_REG(gpio->base, GPIO_BSRR_OFFSET) = (gpio->pin << 16);    // Reset
    }
}

static inline uint16_t gpio_read_pin(GPIO_HandleTypeDef* gpio) {
    return GPIO_REG(gpio->base, GPIO_IDR_OFFSET) & gpio->pin;
}

static inline void gpio_toggle_pin(GPIO_HandleTypeDef* gpio) {
    uint32_t odr = GPIO_REG(gpio->base, GPIO_ODR_OFFSET);
    GPIO_REG(gpio->base, GPIO_ODR_OFFSET) = odr ^ gpio->pin;
}

// Initialization
int gpio_init(GPIO_HandleTypeDef* gpio);

#endif // GPIO_H
```

**gpio.c implementation**:

```cpp
// gpio.c

int gpio_init(GPIO_HandleTypeDef* gpio) {
    if (gpio == NULL || gpio->base == NULL) {
        return -1;  // Error: invalid handle
    }

    uint32_t moder, pupdr;

    // Configure mode (2 bits per pin)
    moder = GPIO_REG(gpio->base, GPIO_MODER_OFFSET);
    moder &= ~(0x3 << (gpio->pin * 2));
    moder |= (gpio->mode << (gpio->pin * 2));
    GPIO_REG(gpio->base, GPIO_MODER_OFFSET) = moder;

    // Configure output type
    uint32_t otyper = GPIO_REG(gpio->base, GPIO_OTYPER_OFFSET);
    otyper &= ~gpio->pin;
    otyper |= (gpio->otype << gpio->pin);
    GPIO_REG(gpio->base, GPIO_OTYPER_OFFSET) = otyper;

    // Configure pull-up/down
    pupdr = GPIO_REG(gpio->base, GPIO_PUPDR_OFFSET);
    pupdr &= ~(0x3 << (gpio->pin * 2));
    pupdr |= (gpio->pupd << (gpio->pin * 2));
    GPIO_REG(gpio->base, GPIO_PUPDR_OFFSET) = pupdr;

    return 0;  // Success
}
```

**Usage in application**:

```cpp
#include "gpio.h"

GPIO_HandleTypeDef led1 = {
    .base  = GPIOA_BASE,
    .pin   = GPIO_PIN_5,
    .mode  = GPIO_MODE_OUTPUT,
    .otype = GPIO_OTYPE_PP,
    .speed = GPIO_SPEED_MEDIUM,
    .pupd  = GPIO_PUPD_NONE,
};

int main(void) {
    gpio_init(&led1);

    while (1) {
        gpio_toggle_pin(&led1);
        for (volatile int i = 0; i < 500000; i++);
    }
}
```

::: tip Why static inline?
`static inline` functions in headers are:

- Inlined by the compiler (no function call overhead)
- Private to each compilation unit (no linking conflicts)
- Debuggable (unlike macros)
- Type-safe (unlike macros)
  :::

**Check your understanding**: What happens if you pass a NULL pointer to gpio_init()? How would you handle errors in embedded code vs desktop code?

---

### Week 2 — Bitfields, volatile, and Memory Barriers

**Core idea**: Master the C features essential for embedded programming.

**Key concepts to learn**:

- Bitfield structures for register maps
- volatile qualifier and when to use it
- Memory barriers and compiler barriers
- restrict keyword for pointer aliasing

::: info Glossary: C Memory Terms

- **volatile**: A qualifier telling the compiler that a variable may change at any time (hardware register, shared by ISR, etc.) — prevents optimization.
- **Memory Barrier (**DMB, **DSB, \_\_ISB)**: Hardware instruction ensuring all memory accesses before the barrier complete before any after begin. Essential for proper synchronization.
- **Compiler Barrier**: Prevents the compiler from reordering memory accesses across the barrier, without affecting hardware memory ordering.
- **restrict**: A hint to the compiler that a pointer is the only reference to that memory — enables better optimization.
- **Bitfield**: A struct member with a specified number of bits, allowing compact storage of flag registers.

:::

**Bitfield structures for registers**:

```cpp
// stm32f4xx_uart.h - Using bitfields for register maps

typedef struct {
    volatile uint32_t PE    : 1;    // Parity error
    volatile uint32_t FE    : 1;    // Framing error
    volatile uint32_t NE    : 1;    // Noise error
    volatile uint32_t ORE   : 1;    // Overrun error
    volatile uint32_t IDLE  : 1;    // IDLE line detected
    volatile uint32_t RXNE  : 1;    // Read data register not empty
    volatile uint32_t TC    : 1;    // Transmission complete
    volatile uint32_t TXE    : 1;    // Transmit data register empty
    volatile uint32_t LBD   : 1;    // LIN break detection
    volatile uint32_t CTS   : 1;    // CTS flag
    volatile uint32_t : 23;         // Reserved
} UART_SR_bitfield;

typedef struct {
    volatile uint32_t DIV_Mantissa : 12;  // DIV_Mantissa
    volatile uint32_t : 4;                // Reserved
    volatile uint32_t DIV_Fraction : 4;   // DIV_Fraction
    volatile uint32_t : 12;               // Reserved
} UART_BRR_bitfield;

typedef struct {
    volatile uint32_t PE    : 1;    // Parity error interrupt enable
    volatile uint32_t TXEIE  : 1;    // TXE interrupt enable
    volatile uint32_t TCIE   : 1;    // Transmission complete interrupt enable
    volatile uint32_t RXNEIE  : 1;    // RXNE interrupt enable
    volatile uint32_t IDLEIE  : 1;    // IDLE interrupt enable
    volatile uint32_t : 27;           // Reserved
} UART_CR1_bitfield;

// Register structure
typedef struct {
    UART_SR_bitfield  SR;     // Status register
    UART_BRR_bitfield BRR;    // Baud rate register
    uint32_t          DR;      // Data register (32-bit access)
    UART_CR1_bitfield CR1;    // Control register 1
    // ... more registers
} UART_TypeDef;

// Usage
#define UART1 ((UART_TypeDef*)0x40011000)

void uart_send(uint8_t data) {
    while (!UART1->SR.TXE);  // Wait for TXE
    UART1->DR = data;
}
```

::: warning Bitfield caveats

- Bitfield access order is implementation-defined (usually LSB to MSB)
- Don't assume atomicity — bitfields are NOT atomic on most architectures
- Bitfields in volatile registers must themselves be volatile-qualified
- Don't use bitfields for hardware that requires strict bit positioning (check the reference manual)
  :::

**volatile for hardware registers**:

```cpp
// Anti-pattern: Missing volatile
uint32_t* const status = (uint32_t*)0x40011000;  // UART status register
while (!(*status & (1 << 7)));  // Compiler might cache the read!

// Correct: volatile
volatile uint32_t* const status = (volatile uint32_t*)0x40011000;
while (!(*status & (1 << 7)));  // Compiler reads every time

// For bitfield registers, the bitfield struct should be volatile
// (already shown in the UART_SR_bitfield example above)
```

**Memory barriers in C**:

```cpp
#include "stm32f4xx.h"

// Compiler barrier - prevents compiler reordering only
#define __COMPILER_BARRIER()   __asm volatile ("" ::: "memory")

// Data memory barrier - ensures completion of memory transactions
#define __DMB()                __asm volatile ("dmb sy" ::: "memory")

// Data synchroniz barrier - ensures completion and flushes caches
#define __DSB()                __asm volatile ("dsb sy" ::: "memory")

// Instruction synchroniz barrier - flushes instruction pipeline
#define __ISB()                __asm volatile ("isb sy" ::: "memory")

// Usage: protecting shared data between ISR and main
volatile uint32_t shared_flag = 0;

void some_interrupt_handler(void) {
    shared_flag = 1;
    __DMB();  // Ensure the write completes before ISR returns
}

int main(void) {
    while (shared_flag == 0);  // Without barrier, compiler might
                                // cache shared_flag in a register
    __DMB();  // Ensure we see the latest value
    // Process data
}
```

::: tip When to use barriers

- Between writing to a peripheral and reading its status
- Between configuring a peripheral and enabling it
- Between enabling an interrupt and waiting for it
- Between ISR writing shared data and main reading it
  :::

**Check your understanding**: What's the difference between a compiler barrier and a memory barrier? When do you need each?

---

### Week 3 — State Machines and Ring Buffers

**Core idea**: Apply design patterns commonly used in embedded systems.

**Key concepts to learn**:

- Enum-based state machines
- Ring buffer (circular buffer) implementation
- Callback functions for event handling
- Error handling and return codes

::: info Glossary: Design Pattern Terms

- **State Machine**: A programming pattern where code behaves differently based on internal "state" — useful for protocols, user interfaces, and sequential operations.
- **Ring Buffer (Circular Buffer)**: A fixed-size buffer where data wraps around — ideal for UART receive/transmit queues.
- **FSM (Finite State Machine)**: A state machine with a finite number of states — transitions are triggered by events.
- **Callback Function**: A function pointer passed to another function, called when some event occurs — enables event-driven architectures.
- **Lookahead Pattern**: Reading data without consuming it — useful for parsing protocols.

:::

**State machine example (UART command parser)**:

```cpp
// Command parser state machine
typedef enum {
    CMD_STATE_IDLE,
    CMD_STATE_HEADER,
    CMD_STATE_LENGTH_MSB,
    CMD_STATE_LENGTH_LSB,
    CMD_STATE_PAYLOAD,
    CMD_STATE_CHECKSUM,
} Command_State;

typedef enum {
    CMD_OK = 0,
    CMD_BAD_HEADER,
    CMD_BAD_CHECKSUM,
    CMD_BAD_LENGTH,
    CMD_IN_PROGRESS,
} Command_Result;

typedef struct {
    Command_State state;
    uint8_t header_count;
    uint16_t payload_length;
    uint16_t bytes_received;
    uint8_t checksum;
    uint8_t buffer[256];
} Command_Parser;

void cmd_parser_init(Command_Parser* parser) {
    parser->state = CMD_STATE_IDLE;
    parser->header_count = 0;
    parser->bytes_received = 0;
    parser->checksum = 0;
}

Command_Result cmd_parser_feed(Command_Parser* parser, uint8_t byte) {
    parser->checksum ^= byte;

    switch (parser->state) {
        case CMD_STATE_IDLE:
            if (byte == 0xAA) {
                parser->header_count = 1;
                parser->state = CMD_STATE_HEADER;
            }
            break;

        case CMD_STATE_HEADER:
            if (byte == 0xAA) {
                parser->header_count++;
                if (parser->header_count >= 2) {
                    parser->state = CMD_STATE_LENGTH_MSB;
                }
            } else {
                parser->state = CMD_STATE_IDLE;
                return CMD_BAD_HEADER;
            }
            break;

        case CMD_STATE_LENGTH_MSB:
            parser->payload_length = (uint16_t)byte << 8;
            parser->state = CMD_STATE_LENGTH_LSB;
            break;

        case CMD_STATE_LENGTH_LSB:
            parser->payload_length |= byte;
            if (parser->payload_length > 255) {
                parser->state = CMD_STATE_IDLE;
                return CMD_BAD_LENGTH;
            }
            parser->bytes_received = 0;
            parser->state = CMD_STATE_PAYLOAD;
            break;

        case CMD_STATE_PAYLOAD:
            parser->buffer[parser->bytes_received++] = byte;
            if (parser->bytes_received >= parser->payload_length) {
                parser->state = CMD_STATE_CHECKSUM;
            }
            break;

        case CMD_STATE_CHECKSUM:
            parser->state = CMD_STATE_IDLE;
            if (byte == parser->checksum) {
                return CMD_OK;
            } else {
                return CMD_BAD_CHECKSUM;
            }

        default:
            parser->state = CMD_STATE_IDLE;
            break;
    }

    return CMD_IN_PROGRESS;
}
```

**Ring buffer implementation**:

```cpp
// ringbuffer.h - Lock-free ring buffer for ISR/main communication

#ifndef RINGBUFFER_H
#define RINGBUFFER_H

#include <stdint.h>
#include <stdbool.h>

#define RINGBUFFER_SIZE 64

typedef struct {
    volatile uint8_t buffer[RINGBUFFER_SIZE];
    volatile uint16_t head;  // Write position
    volatile uint16_t tail;  // Read position
} RingBuffer;

// Initialize buffer
static inline void ringbuf_init(RingBuffer* rb) {
    rb->head = 0;
    rb->tail = 0;
}

// Space available (producer side)
static inline uint16_t ringbuf_space(RingBuffer* rb) {
    return RINGBUFFER_SIZE - 1 - ((rb->head - rb->tail) & (RINGBUFFER_SIZE - 1));
}

// Data available (consumer side)
static inline uint16_t ringbuf_available(RingBuffer* rb) {
    return (rb->head - rb->tail) & (RINGBUFFER_SIZE - 1);
}

// Put one byte (returns false if full)
static inline bool ringbuf_put(RingBuffer* rb, uint8_t byte) {
    if (ringbuf_space(rb) == 0) {
        return false;  // Buffer full
    }
    rb->buffer[rb->head] = byte;
    rb->head = (rb->head + 1) & (RINGBUFFER_SIZE - 1);
    return true;
}

// Get one byte (returns false if empty)
static inline bool ringbuf_get(RingBuffer* rb, uint8_t* byte) {
    if (ringbuf_available(rb) == 0) {
        return false;  // Buffer empty
    }
    *byte = rb->buffer[rb->tail];
    rb->tail = (rb->tail + 1) & (RINGBUFFER_SIZE - 1);
    return true;
}

// Bulk write (returns bytes written)
uint16_t ringbuf_write(RingBuffer* rb, const uint8_t* data, uint16_t len);

// Bulk read (returns bytes read)
uint16_t ringbuf_read(RingBuffer* rb, uint8_t* data, uint16_t len);

#endif // RINGBUFFER_H
```

::: warning ISR considerations
The ring buffer implementation above is designed for single-producer (ISR) / single-consumer (main) or vice versa. If both ISR and main write to the same buffer, you need:

1. Critical sections around head updates
2. Or use atomic operations (C11 atomics, or Cortex-M LDREX/STREX)
   :::

**Check your understanding**: What happens if you call ringbuf_put when the buffer is full? How does the caller know if data was lost?

---

## Common misconceptions

| Misconception                                            | Reality                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| "volatile is enough for multi-threaded/ISR access"       | Only prevents compiler caching; doesn't prevent hardware reordering without memory barriers                 |
| "bitfields are atomic"                                   | Bitfield read-modify-write is NOT atomic on most architectures                                              |
| "I don't need abstraction, I can remember all registers" | Abstraction makes code portable and maintainable across chip families                                       |
| "Global variables are faster"                            | With optimization, access to locals and globals is identical; globals just make code harder to reason about |
| "Ring buffers are lock-free"                             | Only if you have single producer/consumer; multiple producers need synchronization                          |

---

## Suggested resources

### Videos

- [Embedded C Best Practices — Jacob Beningo](https://youtube.com/watch?v=vLFcR2ujD_4)
- [State Machine Design Pattern — Phil Vigeon](https://youtube.com/watch?v=3E9XPFPU_OE)

### Reading

- **Embedded C Coding Standard** (Michael Barr) — Industry-standard naming and style guidelines
- **Modern C** (Jens Gustedt) — Advanced C programming techniques
- **UML for embedded systems** — State machine visualization

### Reference

| Pattern              | Use Case                         |
| -------------------- | -------------------------------- |
| Handle/Init          | All peripheral drivers           |
| State Machine        | Protocol parsers, UI, sequencing |
| Ring Buffer          | UART TX/RX, data acquisition     |
| Callback             | Event-driven architectures       |
| Finite State Machine | Protocol state tracking          |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="advanced-c-checklist" :items="[
  { id: '1', label: 'Create a HAL-style GPIO driver with init, write, read, and toggle functions' },
  { id: '2', label: 'Define a bitfield structure for a status register and use it correctly' },
  { id: '3', label: 'Implement a state machine to parse a simple text-based protocol' },
  { id: '4', label: 'Implement a ring buffer and use it to buffer UART RX data' },
  { id: '5', label: 'Explain when to use volatile vs const vs restrict' },
  { id: '6', label: 'Add memory barriers where needed in ISR-to-main communication' }
]" />
