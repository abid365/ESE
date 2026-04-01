# Serial Protocols: UART, SPI, and I2C Communication

**Who this is for**: Embedded developers who've completed the Advanced C module and want to implement serial communication protocols.
**Time to complete**: ~4 weeks, 1–2 hours per day.
**Prerequisites**: Advanced C techniques, bare-metal GPIO/timers, DMA for efficient transfers.

**Why it matters**: Most embedded systems communicate with sensors, radios, displays, and other microcontrollers using serial protocols. UART for simple point-to-point, SPI for high-speed peripherals, I2C for multi-device buses. Knowing bare-metal implementation lets you debug protocol issues and optimize for your specific constraints.

---

## How this connects to embedded work

In Arduino:

```cpp
#include <Wire.h>
Wire.begin();
Wire.beginTransmission(0x68);
Wire.write(0x00);
Wire.endTransmission();
```

Bare-metal I2C:

```cpp
I2C1->CR1 |= I2C_CR1_START;           // Generate START
while (!(I2C1->SR1 & I2C_SR1_SB));
I2C1->DR = (0x68 << 1);              // Send address + W
while (!(I2C1->SR1 & I2C_SR1_ADDR));
volatile uint32_t temp = I2C1->SR2;   // Clear ADDR
I2C1->DR = 0x00;                      // Send register address
while (!(I2C1->SR1 & I2C_SR1_TXE));
// ... continue with actual read
```

Protocol knowledge enables:

- **Sensor integration** — IMU, temperature, pressure all use I2C/SPI
- **Wireless communication** — LoRa, WiFi, Bluetooth modules use UART/SPI
- **Display interfaces** — OLED, LCD, E-ink use SPI
- **Debugging** — Knowing protocols helps trace issues with logic analyzers

---

## Module structure

### Week 1 — UART/Serial Communication

**Core idea**: Implement reliable UART communication with proper framing, error handling, and flow control.

**Key concepts to learn**:

- UART framing (start, data, parity, stop bits)
- Baud rate generation and accuracy
- TX/RX with DMA and interrupts
- RS-232 vs TTL vs RS-485

::: info Glossary: UART-Related Terms

- **UART (Universal Asynchronous Receiver-Transmitter)**: A hardware peripheral for asynchronous serial communication.
- **Baud Rate**: The symbol rate — 115200 baud means 115200 bits per second (not 115200 bytes).
- **Start Bit**: The first bit after idle — always 0 — signals the start of a frame.
- **Stop Bit**: The last bit(s) after data — always 1 — marks the end of a frame.
- **Parity Bit**: Optional error detection — odd or even parity of the data bits.
- **RS-232/RS-485**: Electrical standards for serial communication over longer distances.
- **Flow Control (RTS/CTS)**: Hardware handshaking to prevent transmitter overflow.

:::

**UART register map (STM32F4)**:

```cpp
typedef struct {
    volatile uint32_t SR;   // Status register
    volatile uint32_t DR;   // Data register
    volatile uint32_t BRR;  // Baud rate register
    volatile uint32_t CR1;  // Control register 1
    volatile uint32_t CR2;  // Control register 2
    volatile uint32_t CR3;  // Control register 3
    volatile uint32_t GTPR; // Guard time and prescaler
} UART_TypeDef;

// Status flags
#define UART_SR_TXE    (1 << 7)   // Transmit data register empty
#define UART_SR_RXNE   (1 << 5)   // Read data register not empty
#define UART_SR_ORE    (1 << 3)   // Overrun error
#define UART_SR_FE     (1 << 1)   // Framing error
#define UART_SR_PE     (1 << 0)   // Parity error
```

**Baud rate calculation**:

```
USARTDIV = UART_CLK / (16 * BaudRate)

For 84MHz UART clock, 115200 baud:
USARTDIV = 84000000 / (16 * 115200) = 45.5729

BRR = 0x2D (integer part) + fraction

STM32F4 fraction uses bits [3:0] with oversampling by 16:
DIV_Fraction = (fractional_part * 16) & 0xF
```

```cpp
void uart_set_baudrate(UART_TypeDef* uart, uint32_t baudrate) {
    uint32_t uartclk = 84000000;  // PCLK1 for APB1, or PCLK2 for APB2
    uint32_t integer_div = uartclk / (16 * baudrate);
    uint32_t fractional_div = ((uartclk % (16 * baudrate)) * 16) / baudrate;
    uart->BRR = (integer_div << 4) | (fractional_div & 0xF);
}

void uart_init(UART_TypeDef* uart, uint32_t baudrate) {
    // Enable UART clock (example for USART1 on APB2)
    RCC->APB2ENR |= RCC_APB2ENR_USART1EN;

    // Configure: 8 data bits, 1 stop bit, no parity
    uart->CR1 = USART_CR1_TE | USART_CR1_RE | USART_CR1_RXNEIE;
    uart->CR2 = 0;
    uart->CR3 = 0;

    // Set baud rate
    uart_set_baudrate(uart, baudrate);

    // Enable UART
    uart->CR1 |= USART_CR1_UE;
}
```

**UART transmit (polling)**:

```cpp
void uart_send_byte(UART_TypeDef* uart, uint8_t byte) {
    // Wait for TXE (transmit buffer empty)
    while (!(uart->SR & UART_SR_TXE));
    uart->DR = byte;
}

void uart_send_string(UART_TypeDef* uart, const char* str) {
    while (*str) {
        uart_send_byte(uart, *str++);
    }
}

// Wait for transmission complete
void uart_wait_tx_complete(UART_TypeDef* uart) {
    while (!(uart->SR & UART_SR_TC));
}
```

**UART receive (interrupt-driven)**:

```cpp
// Ring buffer for received bytes
extern RingBuffer uart_rx_buffer;

void USART1_IRQHandler(void) {
    if (USART1->SR & UART_SR_RXNE) {
        uint8_t byte = USART1->DR;
        ringbuf_put(&uart_rx_buffer, byte);
    }
}

// Main loop processes buffer
void process_uart(void) {
    uint8_t byte;
    while (ringbuf_get(&uart_rx_buffer, &byte)) {
        // Process received byte
        // ...
    }
}
```

::: warning UART receive overrun
If the CPU doesn't read DR before the next byte arrives, the ORE (overrun) flag is set and the new byte is lost. Use DMA or fast ISRs to prevent this.
:::

**Check your understanding**: What baud rate error is acceptable? If your clock is 84MHz and you want 9600 baud, what's the actual error?

---

### Week 2 — SPI Protocol Implementation

**Core idea**: Master SPI for high-speed full-duplex communication with displays, sensors, and memory.

**Key concepts to learn**:

- SPI modes (CPOL, CPHA) and clock polarity
- Full-duplex vs half-duplex
- DMA for high-speed transfers
- Chip select management

::: info Glossary: SPI-Related Terms

- **SPI (Serial Peripheral Interface)**: A synchronous serial protocol with clock (SCK), data out (MOSI), data in (MISO), and chip select (CS/SS).
- **CPOL (Clock Polarity)**: Determines idle state of SCK — 0 = low idle, 1 = high idle.
- **CPHA (Clock Phase)**: Determines when data is sampled — edge 1 or edge 2.
- **MOSI (Master Out Slave In)**: Data line from master to slave.
- **MISO (Master In Slave Out)**: Data line from slave to master.
- **SS/CS (Slave Select/Chip Select)**: A signal to select which device to communicate with.
- **Full-duplex**: Data transmitted and received simultaneously.
- **FIFO**: Hardware buffer in SPI peripheral for batching transfers.

:::

**SPI timing modes**:

| Mode | CPOL | CPHA | Idle SCK | Sample Edge        |
| ---- | ---- | ---- | -------- | ------------------ |
| 0    | 0    | 0    | Low      | 1st edge (rising)  |
| 1    | 0    | 1    | Low      | 2nd edge (falling) |
| 2    | 1    | 0    | High     | 1st edge (falling) |
| 3    | 1    | 1    | High     | 2nd edge (rising)  |

```cpp
// SPI configuration
typedef struct {
    volatile uint32_t CR1;    // Control register 1
    volatile uint32_t CR2;    // Control register 2
    volatile uint32_t SR;     // Status register
    volatile uint32_t DR;     // Data register
    volatile uint32_t CRCPR;  // CRC polynomial register
    volatile uint32_t RXCRCR; // RX CRC register
    volatile uint32_t TXCRCR; // TX CRC register
    volatile uint32_t I2SCFGR;// I2S configuration register
} SPI_TypeDef;

// SPI flags
#define SPI_SR_TXE   (1 << 1)   // TX buffer empty
#define SPI_SR_RXNE  (1 << 0)   // RX buffer not empty
#define SPI_SR_BSY   (1 << 7)   // Busy flag

void spi_init(SPI_TypeDef* spi) {
    // Enable SPI clock
    RCC->APB2ENR |= RCC_APB2ENR_SPI1EN;

    // Configure SPI: Master, software NSS, 8-bit, software CS
    spi->CR1 = SPI_CR1_MSTR |    // Master mode
               SPI_CR1_SSI |      // Software slave select
               SPI_CR1_SSM |      // Software NSS
               SPI_CR1_SPE |      // Enable SPI
               SPI_CR1_BR_0;      // Baud rate: Fcpu/4 (21MHz)
    spi->CR2 = 0;
}

uint8_t spi_transfer(SPI_TypeDef* spi, uint8_t byte) {
    // Wait for TX buffer empty
    while (!(spi->SR & SPI_SR_TXE));
    spi->DR = byte;

    // Wait for RX buffer not empty
    while (!(spi->SR & SPI_SR_RXNE));
    return spi->DR;
}

// Send buffer
void spi_send_buffer(SPI_TypeDef* spi, const uint8_t* data, uint16_t len) {
    for (uint16_t i = 0; i < len; i++) {
        spi_transfer(spi, data[i]);
    }
}

// Receive buffer (send dummy bytes)
void spi_receive_buffer(SPI_TypeDef* spi, uint8_t* data, uint16_t len) {
    for (uint16_t i = 0; i < len; i++) {
        data[i] = spi_transfer(spi, 0xFF);
    }
}
```

**SPI with GPIO chip select**:

```cpp
GPIO_HandleTypeDef spics = {
    .base = GPIOA_BASE,
    .pin = GPIO_PIN_4,  // CS pin
    .mode = GPIO_MODE_OUTPUT,
    .otype = GPIO_OTYPE_PP,
    .pupd = GPIO_PUPD_PULLUP,
};

void spi_cs_low(void) {
    gpio_write_pin(&spics, 0);
}

void spi_cs_high(void) {
    gpio_write_pin(&spics, 1);
}

// Read a register from SPI device
uint8_t spi_read_register(uint8_t reg_addr) {
    spi_cs_low();
    spi_transfer(SPI1, reg_addr | 0x80);  // Read bit set
    uint8_t value = spi_transfer(SPI1, 0xFF);
    spi_cs_high();
    return value;
}

void spi_write_register(uint8_t reg_addr, uint8_t value) {
    spi_cs_low();
    spi_transfer(SPI1, reg_addr & ~0x80);  // Write
    spi_transfer(SPI1, value);
    spi_cs_high();
}
```

::: tip SPI speed vs distance
SPI is not designed for long distances. At high speeds (>10MHz), keep traces short (<30cm) and use proper impedance matching. For longer distances, consider RS-485 or differential SPI.
:::

**Check your understanding**: If you connect an SPI device and it reads all 0xFF, what could be wrong? What about reading all 0x00?

---

### Week 3 — I2C Protocol Implementation

**Core idea**: Implement I2C for connecting multiple devices on the same bus using only two wires.

**Key concepts to learn**:

- I2C addressing (7-bit and 10-bit)
- Start/Stop/ACK/NACK timing
- Polling vs interrupt vs DMA
- Clock stretching and bus arbitration

::: info Glossary: I2C-Related Terms

- **I2C (Inter-Integrated Circuit)**: A 2-wire serial bus with clock (SCL) and data (SDA), supporting multiple masters and slaves.
- **SCL (Serial Clock)**: The clock line, generated by the master.
- **SDA (Serial Data)**: The bidirectional data line.
- **ACK/NACK**: Acknowledgment — the receiver pulls SDA low (ACK) or leaves it high (NACK).
- **START/STOP Condition**: Special SDA transitions while SCL is high to begin/end a transfer.
- **Address Frame**: The first byte after START, containing the 7-bit device address + R/W bit.
- **Clock Stretching**: A slave holding SCL low to pause the master until it's ready.
- **Bus Arbitration**: Multiple masters both try to drive SDA — whoever writes the expected value wins.

:::

**I2C register map and timing**:

```cpp
typedef struct {
    volatile uint32_t CR1;     // Control register 1
    volatile uint32_t CR2;     // Control register 2
    volatile uint32_t OAR1;    // Own address register 1
    volatile uint32_t OAR2;    // Own address register 2
    volatile uint32_t DR;      // Data register
    volatile uint32_t SR1;     // Status register 1
    volatile uint32_t SR2;     // Status register 2
    volatile uint32_t CCR;     // Clock control register
    volatile uint32_t TRISE;   // Rise time register
} I2C_TypeDef;

// I2C status flags (SR1)
#define I2C_SR1_SB     (1 << 0)   // Start bit (master)
#define I2C_SR1_ADDR   (1 << 1)   // Address sent/matched
#define I2C_SR1_TXE    (1 << 7)   // Data register empty
#define I2C_SR1_RXNE   (1 << 6)   // Data register not empty

// I2C status flags (SR2)
#define I2C_SR2_BUSY   (1 << 1)   // Bus busy
#define I2C_SR2_MSL    (1 << 0)   // Master/slave mode

// I2C clock calculation
// Standard mode (100kHz): t_high = t_low = CCR * t_PCLK1
// Fast mode (400kHz): use I2C_CCR_FS and CCR > 0
```

**I2C initialization**:

```cpp
void i2c_init(I2C_TypeDef* i2c, uint32_t clock_speed) {
    // Enable I2C clock
    RCC->APB1ENR |= RCC_APB1ENR_I2C1EN;

    // Configure pins (open-drain required for I2C)
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOBEN;

    // Configure PB6 (SCL) and PB9 (SDA) as alternate function
    GPIOB->MODER &= ~(0xF << (6 * 2));
    GPIOB->MODER |= (0xA << (6 * 2));  // AF mode
    GPIOB->AFR[0] |= (4 << 24);        // AF4 for PB6
    GPIOB->AFR[1] |= (4 << 4);         // AF4 for PB9

    // Configure as open-drain
    GPIOB->OTYPER |= (1 << 6) | (1 << 9);

    // Enable I2C
    i2c->CR1 = I2C_CR1_PE;
}

void i2c_set_clock(I2C_TypeDef* i2c, uint32_t clock_speed) {
    uint32_t pclk1 = 42000000;  // APB1 clock
    uint32_t ccr;

    i2c->CR1 &= ~I2C_CR1_PE;  // Disable during config

    if (clock_speed <= 100000) {
        // Standard mode
        ccr = pclk1 / (clock_speed * 2);
        i2c->CCR = ccr & I2C_CCR_CCR;
        i2c->TRISE = (pclk1 / 1000000) + 1;  // 1000ns + 1
    } else {
        // Fast mode
        i2c->CCR |= I2C_CCR_FS | I2C_CCR_DUTY;
        ccr = pclk1 / (clock_speed * 3);  // 2/3 duty cycle
        i2c->CCR = (ccr & I2C_CCR_CCR) | 1;
        i2c->TRISE = ((pclk1 / 1000000) * 3 / 10) + 1;
    }

    i2c->CR1 |= I2C_CR1_PE;  // Re-enable
}
```

**I2C read/write sequence**:

```cpp
// Wait for specific flag
int i2c_wait_flag(I2C_TypeDef* i2c, uint32_t flag, uint8_t state, uint32_t timeout) {
    while (timeout--) {
        uint32_t sr1 = i2c->SR1;
        if (state) {
            if (sr1 & flag) return 0;  // Success
        } else {
            if (!(sr1 & flag)) return 0;  // Success
        }
        for (volatile int i = 0; i < 10; i++);
    }
    return -1;  // Timeout
}

// I2C START condition
int i2c_start(I2C_TypeDef* i2c, uint8_t addr, uint8_t dir) {
    i2c->CR1 |= I2C_CR1_START;  // Generate START

    if (i2c_wait_flag(i2c, I2C_SR1_SB, 1, 1000)) return -1;

    i2c->DR = (addr << 1) | dir;  // Send address + R/W

    if (dir == 0) {  // Write
        if (i2c_wait_flag(i2c, I2C_SR1_TXE, 1, 1000)) return -1;
    } else {  // Read
        if (i2c_wait_flag(i2c, I2C_SR1_ADDR, 1, 1000)) return -1;
        volatile uint32_t temp = i2c->SR2;  // Clear ADDR
    }

    return 0;
}

// I2C STOP condition
void i2c_stop(I2C_TypeDef* i2c) {
    i2c->CR1 |= I2C_CR1_STOP;
}

// Write single byte
int i2c_write(I2C_TypeDef* i2c, uint8_t byte) {
    if (i2c_wait_flag(i2c, I2C_SR1_TXE, 1, 1000)) return -1;
    i2c->DR = byte;
    if (i2c_wait_flag(i2c, I2C_SR1_TXE, 1, 1000)) return -1;
    return 0;
}

// Read single byte (send NACK for last byte)
int i2c_read(I2C_TypeDef* i2c, uint8_t* byte, uint8_t nack) {
    if (i2c_wait_flag(i2c, I2C_SR1_RXNE, 1, 1000)) return -1;
    *byte = i2c->DR;
    if (nack) i2c->CR1 &= ~I2C_CR1_ACK;
    return 0;
}

// Read register from I2C device
int i2c_read_register(I2C_TypeDef* i2c, uint8_t addr,
                       uint8_t reg, uint8_t* data) {
    i2c_start(i2c, addr, 0);     // START + write
    i2c_write(i2c, reg);         // Register address
    i2c_start(i2c, addr, 1);     // START + read
    i2c_read(i2c, data, 1);      // Read with NACK
    i2c_stop(i2c);               // STOP
    return 0;
}
```

::: warning I2C pull-up resistors
I2C requires pull-up resistors on SCL and SDA. Values depend on bus capacitance and speed:

- 10kΩ for short buses at 100kHz
- 4.7kΩ for 400kHz Fast Mode
- 2.2kΩ for 1MHz Fast Mode Plus
  Too strong (>2kΩ) can damage drivers on 3.3V systems if 5V is accidentally applied.
  :::

**Check your understanding**: What is clock stretching and why does it exist? What happens if two masters start transmitting at the same time?

---

## Common misconceptions

| Misconception                    | Reality                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| "I2C is faster than UART"        | Actually slower (400kHz vs 1Mbps+ for UART) but supports multiple devices                             |
| "SPI can have unlimited devices" | Limited by chip select pins — each device needs its own CS                                            |
| "I can use any GPIO as UART TX"  | Yes, but dedicated UART peripherals handle timing precisely                                           |
| "I2C always needs pull-ups"      | With open-drain drivers, yes. Some microcontrollers have internal pull-ups but they're often too weak |
| "Higher baud rate = faster"      | If error > 5%, you'll get framing errors at high baud rates                                           |

---

## Suggested resources

### Videos

- [UART, SPI, I2C Explained — Derek Molloy](https://youtube.com/watch?v=js3ROPkoLH0)
- [I2C Timing Diagrams — Chainer](https://youtube.com/watch?v=tcQ7RZVGJ3w)

### Reading

- **UM10204 I2C Bus Specification** (NXP) — The official I2C spec
- **RM0090 STM32F4 Reference Manual** — UART, SPI, I2C register descriptions
- **SPI Protocol Tutorial** — Total Phase Knowledge Base

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="serial-protocols-checklist" :items="[
  { id: '1', label: 'Configure UART1 for 115200-8-N-1 and send/receive bytes' },
  { id: '2', label: 'Implement SPI Mode 3 (CPOL=1, CPHA=1) for an external flash chip' },
  { id: '3', label: 'Read a sensor register over I2C using a 7-bit address' },
  { id: '4', label: 'Calculate the baud rate error for 9600 baud at 84MHz PCLK' },
  { id: '5', label: 'Implement a SPI transfer with GPIO-controlled chip select' },
  { id: '6', label: 'Debug an I2C device that returns 0xFF — list 5 possible causes' }
]" />
