# Protocol Integration and Troubleshooting: Building Robust Communication

**Who this is for**: Embedded developers who've completed the UART, SPI, and I2C modules and want to integrate multiple protocols into a cohesive system.
**Time to complete**: ~3 weeks, 1–2 hours per day.
**Prerequisites**: UART/SPI/I2C modules, advanced C techniques, DMA and interrupts.

**Why it matters**: Real systems use multiple protocols simultaneously — UART for debug console, I2C for sensors, SPI for display. Integration challenges include timing, resource sharing, error recovery, and debugging across protocol boundaries. This module teaches you to build robust, maintainable communication stacks.

---

## How this connects to embedded work

**Simple system** (single protocol):

```cpp
// Just I2C temperature sensor
read_temperature();
process_data();
```

**Real-world system** (multiple protocols):

```cpp
// Multiple protocols working together
void system_task(void) {
    // I2C: Read IMU at 100Hz
    imu_read(&imu_data);

    // SPI: Update display at 30Hz
    display_update(&display_state);

    // UART: Send telemetry at 10Hz
    if (telemetry_timer_expired()) {
        uart_send_telemetry();
    }

    // UART: Receive commands
    command_parse(&cmd_buffer);

    // Process data
    fusion_update(&imu_data, &cmd_buffer);
}
```

Integration challenges:

- **Resource conflicts** — Multiple peripherals sharing the same bus
- **Timing constraints** — Real-time deadlines for each protocol
- **Error recovery** — What happens when a read fails?
- **Debug complexity** — Issues span protocol boundaries

---

## Module structure

### Week 1 — Multi-Protocol Integration Patterns

**Core idea**: Design patterns for managing multiple communication channels efficiently.

**Key concepts to learn**:

- Time-division multiplexing
- Priority-based scheduling
- Resource locking and reentrancy
- Event-driven vs polling architectures

::: info Glossary: Integration Pattern Terms

- **Time-Division Multiplexing (TDM)**: Allocating specific time slots to different communication channels.
- **Polling Loop**: Continuously checking peripheral flags in a loop. Simple but wastes CPU.
- **Event-Driven**: Responding to interrupts or callbacks when data arrives. Efficient but complex.
- **Reentrancy**: A function that can be safely called while already executing (important for callbacks).
- **Resource Locking**: Preventing concurrent access to shared hardware (e.g., mutex for SPI bus).
- **Priority Inversion**: When a low-priority task holds a resource needed by high-priority task — can cause missed deadlines.

:::

**Polling loop with multiple protocols**:

```cpp
typedef struct {
    uint32_t interval_ms;
    uint32_t last_tick;
    void (*task)(void);
} ScheduledTask;

ScheduledTask tasks[] = {
    { .interval_ms = 10,  .last_tick = 0, .task = read_imu_task },      // 100Hz
    { .interval_ms = 33,  .last_tick = 0, .task = update_display_task }, // 30Hz
    { .interval_ms = 100, .last_tick = 0, .task = send_telemetry_task }, // 10Hz
    { .interval_ms = 1000,.last_tick = 0, .task = heartbeat_task },    // 1Hz
};

uint32_t get_tick_ms(void) {
    return milliseconds;
}

void scheduler_run(void) {
    uint32_t now = get_tick_ms();

    for (size_t i = 0; i < sizeof(tasks) / sizeof(tasks[0]); i++) {
        if ((now - tasks[i].last_tick) >= tasks[i].interval_ms) {
            tasks[i].task();
            tasks[i].last_tick = now;
        }
    }
}

int main(void) {
    system_init();

    while (1) {
        scheduler_run();
        process_uart_commands();  // Run as fast as possible
    }
}
```

**Event-driven with DMA callbacks**:

```cpp
// DMA-based UART with callback
typedef void (*UART_Callback)(uint8_t byte);

typedef struct {
    UART_TypeDef* base;
    RingBuffer rx_buffer;
    UART_Callback on_byte;
} UART_Handle;

void uart_rx_isr(UART_Handle* uart) {
    if (uart->base->SR & UART_SR_RXNE) {
        uint8_t byte = uart->base->DR;

        if (uart->on_byte) {
            uart->on_byte(byte);  // Invoke callback
        } else {
            ringbuf_put(&uart->rx_buffer, byte);
        }
    }
}

// Command parser as callback
void on_uart_byte(uint8_t byte) {
    static Command_Parser parser;

    Command_Result result = cmd_parser_feed(&parser, byte);

    if (result == CMD_OK) {
        // Process complete command
        handle_command(parser.buffer, parser.payload_length);
        cmd_parser_init(&parser);
    } else if (result < 0) {
        // Error — reset parser
        cmd_parser_init(&parser);
    }
}
```

::: warning Priority inversion with shared SPI
If your system has multiple tasks accessing SPI (display, flash, radio), a low-priority task holding the SPI mutex can block a high-priority task. Use priority inheritance mutexes or avoid shared SPI with a bus manager.
:::

**Check your understanding**: What happens if the IMU read task takes longer than 10ms? How would you detect and handle this?

---

### Week 2 — Error Detection and Recovery

**Core idea**: Handle communication failures gracefully and recover to a known state.

**Key concepts to learn**:

- Timeout and retry logic
- CRC/checksum verification
- Watchdog timers
- State machine recovery

::: info Glossary: Error Handling Terms

- **Timeout**: Failing an operation if it doesn't complete within a specified time.
- **Retry Logic**: Attempting an operation multiple times before reporting failure.
- **CRC (Cyclic Redundancy Check)**: A polynomial division checksum for detecting transmission errors.
- **Watchdog Timer**: A hardware timer that resets the system if not periodically "kicked" — catches hangs.
- **Deadlock**: Two or more tasks waiting for each other forever — neither can proceed.
- **Starvation**: A task never gets CPU time because other tasks always have priority.
- **BAUD Rate Tolerance**: Maximum baud rate error (typically 2-5%) before frames become unreliable.

:::

**I2C with timeout and retry**:

```cpp
typedef enum {
    I2C_OK = 0,
    I2C_TIMEOUT,
    I2C_NACK,
    I2C_ARBITRATION_LOST,
    I2C_BUS_ERROR,
} I2C_Status;

#define I2C_TIMEOUT_MS  100
#define I2C_MAX_RETRIES 3

I2C_Status i2c_write_with_retry(I2C_TypeDef* i2c, uint8_t addr,
                                  const uint8_t* data, uint16_t len) {
    for (int retry = 0; retry < I2C_MAX_RETRIES; retry++) {
        // Generate START
        i2c->CR1 |= I2C_CR1_START;
        if (i2c_wait_flag(i2c, I2C_SR1_SB, 1, I2C_TIMEOUT_MS) != 0) {
            i2c_reset_bus(i2c);  // Recovery
            continue;
        }

        // Send address
        i2c->DR = (addr << 1) | 0;  // Write
        if (i2c_wait_flag(i2c, I2C_SR1_ADDR, 1, I2C_TIMEOUT_MS) != 0) {
            i2c_stop(i2c);
            continue;  // NACK or timeout
        }
        volatile uint32_t temp = i2c->SR2;  // Clear ADDR

        // Send data
        for (uint16_t i = 0; i < len; i++) {
            if (i2c_wait_flag(i2c, I2C_SR1_TXE, 1, I2C_TIMEOUT_MS) != 0) {
                i2c_stop(i2c);
                continue;
            }
            i2c->DR = data[i];
        }

        // Wait for TX completion and send STOP
        if (i2c_wait_flag(i2c, I2C_SR1_TXE, 1, I2C_TIMEOUT_MS) != 0) {
            i2c_stop(i2c);
            continue;
        }

        i2c->CR1 |= I2C_CR1_STOP;
        return I2C_OK;  // Success
    }

    return I2C_TIMEOUT;  // All retries exhausted
}

void i2c_reset_bus(I2C_TypeDef* i2c) {
    // Toggle SCL to clear any stuck slave
    i2c->CR1 &= ~I2C_CR1_PE;

    // Toggle SCL manually if possible, or just retry
    i2c->CR1 |= I2C_CR1_PE;
    i2c->CR1 |= I2C_CR1_SWRST;
    i2c->CR1 &= ~I2C_CR1_SWRST;
}
```

**CRC checksum for packet verification**:

```cpp
// CRC-16-CCITT (polynomial 0x1021)
// Used in many protocols: XMODEM, SD cards, Bluetooth L2CAP

uint16_t crc16_ccitt(uint8_t byte, uint16_t crc) {
    crc ^= (uint16_t)byte << 8;

    for (int i = 0; i < 8; i++) {
        if (crc & 0x8000) {
            crc = (crc << 1) ^ 0x1021;
        } else {
            crc <<= 1;
        }
    }

    return crc;
}

uint16_t crc16_ccitt_buf(const uint8_t* data, uint16_t len) {
    uint16_t crc = 0xFFFF;

    for (uint16_t i = 0; i < len; i++) {
        crc = crc16_ccitt(data[i], crc);
    }

    return crc;
}

// Using CRC in packet protocol
typedef struct {
    uint8_t header[2];      // 0xAA, 0x55
    uint8_t length;
    uint8_t type;
    uint8_t payload[64];
    uint16_t crc;
} Packet;

int packet_verify(const Packet* pkt) {
    if (pkt->header[0] != 0xAA || pkt->header[1] != 0x55) {
        return -1;  // Invalid header
    }

    uint16_t calculated = crc16_ccitt_buf(&pkt->type,
                                           2 + pkt->length);

    if (calculated != pkt->crc) {
        return -2;  // CRC mismatch
    }

    return 0;  // Valid
}
```

**Watchdog timer configuration**:

```cpp
// STM32F4 Independent Watchdog (IWDG)
void wdt_init(uint32_t timeout_ms) {
    // Enable write to IWDG
    IWDG->KR = 0x5555;

    // Set prescaler (LSI is ~32kHz)
    // Prescaler values: 4, 8, 16, 32, 64, 128, 256
    IWDG->PR = 5;  // /64 -> ~500Hz tick

    // Set reload value
    // Timeout = (4 * reload) / 32000
    uint32_t reload = (timeout_ms * 32) / 4;
    IWDG->RLR = reload;

    // Start watchdog
    IWDG->KR = 0xCCCC;
}

void wdt_kick(void) {
    IWDG->KR = 0xAAAA;  // Reset watchdog counter
}
```

::: tip Watchdog strategy

- Kick the watchdog in your main idle loop
- If an ISR is taking too long, you won't kick in time
- For hard real-time tasks, use a task watchdog ( FreeRTOS has this)
- If the watchdog fires, check which task was running to diagnose hang
  :::

**Check your understanding**: Your I2C device sometimes NACKs randomly. What's a better strategy: infinite retries, or fail after N attempts and notify the user?

---

### Week 3 — Debugging Communication Issues

**Core idea**: Systematic approach to diagnosing and fixing protocol-level bugs.

**Key concepts to learn**:

- Logic analyzer usage
- Protocol decoding
- Common failure modes
- Signal integrity basics

::: info Glossary: Debugging Terms

- **Logic Analyzer**: A tool that captures digital signals over time — essential for serial protocol debugging.
- **Protocol Decoder**: Software that interprets raw signal data as protocol messages (UART bytes, I2C frames, etc.).
- **Signal Integrity**: Ensuring electrical signals meet specifications (voltage levels, rise/fall times, noise).
- **Pull-up Strength**: The resistance value determining how quickly SDA/SCL rise. Too weak = slow edges. Too strong = high current.
- **Ground Loop**: Multiple ground connections at different potentials causing noise in signals.
- **Decoupling Capacitor**: A capacitor placed near a chip's power pins to filter voltage spikes.

:::

**Logic analyzer setup for I2C**:

```
Logic Analyzer Channels:
- Channel 0: SCL (I2C clock)
- Channel 1: SDA (I2C data)

Minimum sample rate: 2x the clock rate
For 400kHz Fast Mode: use 8MHz+ sample rate
```

**I2C timing analysis**:

```
Expected waveform for: I2C START + Address(0x68) + Write

SDA: ___---¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯ (START: high→low while SCL high)
      ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓  ↓
SCL:  ¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯¯
                 ↓     ↓     ↓  ↓
      Start  Adr[6]  R/W  ACK ...

Decode shows:
1. START condition (SDA high→low, SCL high)
2. Address byte: 0x68 (1101000) + Write bit (0)
3. ACK bit (slave pulls SDA low)
```

**Common I2C issues**:

| Symptom               | Possible Cause                                 | Fix                                               |
| --------------------- | ---------------------------------------------- | ------------------------------------------------- |
| All reads return 0xFF | No pull-ups, wrong address, device not powered | Check power, add pull-ups, verify address         |
| All reads return 0x00 | SDA stuck low                                  | Toggle SCL to clock out stuck byte                |
| Intermittent NACKs    | Weak pull-ups, long wires, noise               | Stronger pull-ups, shorter wires, add capacitance |
| Data corruption       | Timing violation, clock stretching issue       | Check timing specs, scope the signals             |
| Bus stuck busy        | Master crashed mid-transfer                    | Master resets bus, toggles SCL/SDA                |

**SPI debugging checklist**:

```cpp
// Checklist when SPI returns garbage:

1. Verify chip select
   gpio_write_pin(&cs, 0);     // CS low before transfer
   // ... transfer ...
   gpio_write_pin(&cs, 1);     // CS high after transfer

2. Verify mode (CPOL, CPHA)
   // Datasheet shows clock polarity on idle
   // Sample edge should be where data is stable

3. Verify bit order (MSB vs LSB first)
   // Usually MSB first, but check datasheet

4. Check clock speed
   // Some devices have max speed (e.g., 10MHz)
   // Too fast = unreliable

5. Verify voltage levels
   // 3.3V device with 5V SPI may work but be unreliable
```

**Signal integrity tips**:

```
Oscilloscope measurements for SPI at high speed:

1. Check for ground bounce:
   - Measure between IC ground pin and board ground
   - Should be < 50mV

2. Check signal overshoot:
   - Long probe leads add inductance
   - Use 10x probes or active probes

3. Check clock duty cycle:
   - Should be 45-55% at high speeds
   - Asymmetric clock causes timing drift

4. Check rise/fall times:
   - Should be < 10% of bit time for high-speed
   - Slow edges indicate excessive capacitance
```

::: warning Always scope the actual signals!
You cannot debug protocol issues by looking at code alone. A $50 logic analyzer or $100 oscilloscope will save you days of frustration.
:::

**Check your understanding**: Your I2C bus works at 1 inch but fails at 6 inches. List 5 things you would try to fix this.

---

## Common misconceptions

| Misconception                           | Reality                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------- |
| "Software can always recover"           | If hardware fails (disconnected cable, dead chip), software can't fix it   |
| "More retries = more reliability"       | Infinite retries can cause deadlock and prevent error reporting            |
| "Logic analyzer is for hardware people" | Every embedded developer needs one — it's your window into the system      |
| "Higher clock speed is always better"   | Faster = more signal integrity issues, shorter cable limits                |
| "CRC guarantees data integrity"         | CRC catches random errors but not intentional corruption or replay attacks |

---

## Suggested resources

### Videos

- [I2C Debugging with Logic Analyzer — Data Bob](https://youtube.com/watch?v=6Y6N3G7cT-Q)
- [SPI Protocol Debugging — Numato Lab](https://youtube.com/watch?v=6Y6N3G7cT-Q)

### Reading

- **UM10204 I2C Bus Specification** (NXP)
- **AN255 I2C/master-slave communication** (ST)
- **Signal Integrity Fundamentals** (Intel)

### Tools

| Tool                  | Purpose                 | Cost  |
| --------------------- | ----------------------- | ----- |
| Saleae Logic Analyzer | Protocol decoding       | ~$100 |
| DSLogic Plus          | Higher channel count    | ~$200 |
| Rigol DS1054z         | Oscilloscope + protocol | ~$350 |
| 8-channel USB Logic   | Basic protocol capture  | ~$30  |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="protocol-integration-checklist" :items="[
  { id: '1', label: 'Design a system that uses UART, I2C, and SPI simultaneously without resource conflicts' },
  { id: '2', label: 'Implement I2C communication with timeout, retry, and CRC verification' },
  { id: '3', label: 'Configure and use a watchdog timer to recover from hangs' },
  { id: '4', label: 'Use a logic analyzer to capture and decode I2C traffic' },
  { id: '5', label: 'Debug an I2C device returning 0xFF and describe your systematic approach' },
  { id: '6', label: 'Implement graceful degradation when a communication channel fails' }
]" />
