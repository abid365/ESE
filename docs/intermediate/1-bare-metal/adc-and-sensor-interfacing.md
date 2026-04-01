# ADC and Sensor Interfacing: Reading the Physical World

**Who this is for**: Embedded developers who've completed the GPIO/Timers/Interrupts module and want to interface with analog sensors.
**Time to complete**: ~3 weeks, 1–2 hours per day.
**Prerequisites**: GPIO/Timers/Interrupts module, understanding of ADC hardware, basic sensor physics.

**Why it matters**: Most sensors output analog voltages — temperature, light, pressure, sound. The ADC converts these continuous signals to digital values your firmware can process. Bare-metal ADC control gives you precise timing, DMA integration, and accurate sampling rates that Arduino's `analogRead()` cannot provide.

---

## How this connects to embedded work

In Arduino, you write:

```cpp
int value = analogRead(A0);
float voltage = value * (5.0 / 1023.0);
```

What actually happens (STM32 bare-metal):

```cpp
// 1. Configure ADC channel
ADC1->CHSELR = ADC_CHSELR_CHSEL0;  // Select channel 0 (PA0)

// 2. Start conversion
ADC1->CR |= ADC_CR_ADSTART;

// 3. Wait for completion (polling)
while (!(ADC1->ISR & ADC_ISR_EOC));

// 4. Read result
uint16_t raw = ADC1->DR;

// 5. Convert to voltage (3.3V reference, 12-bit)
float voltage = (raw * 3.3f) / 4095.0f;
```

Bare-metal ADC advantages:

- **Configurable resolution** — 12-bit, 10-bit, 8-bit as needed
- **DMA integration** — transfer data without CPU intervention
- **Continuous/scan modes** — sample multiple channels automatically
- **Trigger sources** — start conversion from timer, external event
- **Interrupt control** — know exactly when conversion completes

---

## Module structure

### Week 1 — ADC Fundamentals at Register Level

**Core idea**: Configure and use the ADC peripheral directly through registers.

**Key concepts to learn**:

- ADC architecture (successive approximation)
- Channel selection and sampling time
- Voltage reference (Vref+ and Vref-)
- Single conversion vs continuous mode

::: info Glossary: ADC-Related Terms

- **ADC (Analog-to-Digital Converter)**: Converts continuous analog voltages to discrete digital values.
- **SAR (Successive Approximation Register)**: The most common ADC architecture — uses a binary search to find the input voltage.
- **Resolution**: Number of bits in the output. 12-bit ADC outputs 0-4095 (2^12 values).
- **LSB (Least Significant Bit)**: The smallest voltage step = (Vref+ - Vref-) / 2^n. For 3.3V and 12-bit: ~0.8mV per LSB.
- **Sampling Time**: Time the ADC's sample-and-hold capacitor charges to the input voltage. Longer = more accurate for high-impedance sources.
- **EOC (End of Conversion)**: A flag set when a conversion completes.
- **Vref+ / Vref-**: The reference voltages defining the input range. Usually Vref+ = VDDA (3.3V) and Vref- = GND.
  :::

**STM32F4 ADC overview**:

| Feature       | STM32F4 Discovery        | Notes                      |
| ------------- | ------------------------ | -------------------------- |
| Resolution    | 12-bit (0-4095)          | Configurable to 10/8-bit   |
| Channels      | 16 external + 3 internal | VrefInt, Temp sensor, Vbat |
| Sampling time | 3-480 cycles             | Programmable per channel   |
| Max clock     | 36MHz                    | Derived from APB2          |
| Voltage range | 0 to Vref+               | Vref- typically GND        |

**ADC initialization sequence**:

```cpp
void adc_init(void) {
    // 1. Enable GPIOA clock (ADC channel 0 is on PA0)
    RCC->AHB1ENR |= RCC_AHB1ENR_GPIOAEN;

    // 2. Configure PA0 as analog mode
    GPIOA->MODER |= GPIO_MODER_MODER0;  // Analog mode (11)

    // 3. Enable ADC1 clock
    RCC->APB2ENR |= RCC_APB2ENR_ADC1EN;

    // 4. Configure ADC
    ADC1->CR1 = 0;                      // 12-bit resolution, single mode
    ADC1->CR2 |= ADC_CR2_ADON;         // Enable ADC

    // 5. Wait for ADC stabilization (~10us)
    for (volatile int i = 0; i < 10000; i++);

    // 6. Set sampling time for channel 0 (84 cycles = 3.5µs at 36MHz)
    ADC1->SMPR2 = ADC_SMPR2_SMP0;
}

uint16_t adc_read_single(uint8_t channel) {
    // Select channel
    ADC1->CHSELR = (1 << channel);

    // Clear previous EOC flag
    ADC1->SR = ~ADC_SR_EOC;

    // Start conversion
    ADC1->CR2 |= ADC_CR2_SWSTART;

    // Wait for completion
    while (!(ADC1->SR & ADC_SR_EOC));

    // Return result
    return ADC1->DR;
}
```

**Sampling time trade-offs**:

| Sampling Cycles | Sampling Time (at 36MHz) | Accuracy  | Conversion Time |
| --------------- | ------------------------ | --------- | --------------- |
| 3               | 83ns                     | Low       | 0.5µs           |
| 15              | 417ns                    | Medium    | 0.75µs          |
| 84              | 2.3µs                    | High      | 3µs             |
| 480             | 13.3µs                   | Very High | 14µs            |

Longer sampling = more accurate for high-impedance sources.

::: warning ADC clock constraints
ADC clock (ADCCLK) must be ≤ 36MHz for STM32F4. APB2 prescaler is typically divided by 2 or 4 to meet this. Check your system clock configuration.
:::

**Check your understanding**: What happens if you try to read ADC immediately after setting CHSELR? Why do you need to clear the EOC flag?

---

### Week 2 — DMA and Continuous Acquisition

**Core idea**: Use DMA to transfer ADC results to memory without CPU overhead.

**Key concepts to learn**:

- DMA architecture and channels
- Circular vs normal mode
- Half-transfer and transfer-complete interrupts
- Double-buffering for real-time processing

::: info Glossary: DMA-Related Terms

- **DMA (Direct Memory Access)**: A hardware block that transfers data between memory and peripherals without CPU involvement.
- **Stream**: A DMA "channel" on STM32 — a data path with configurable source, destination, and transfer parameters.
- **Circular Mode**: Automatically restarts the transfer when complete, creating a continuous circular buffer.
- **Half-Transfer Interrupt (HT)**: Triggered when half the data has been transferred — useful for processing while the second half fills.
- **Transfer-Complete Interrupt (TC)**: Triggered when all data has been transferred.
- **Double-Buffer Mode**: Two memory targets alternate — CPU processes one while DMA fills the other.
- **FIFO**: A hardware buffer inside the DMA stream that accumulates data before burst-transferring to memory.
  :::

**DMA overview**:

| Feature   | Notes                                                        |
| --------- | ------------------------------------------------------------ |
| Channels  | Multiple peripherals share DMA (check datasheet)             |
| Direction | Memory-to-memory, peripheral-to-memory, memory-to-peripheral |
| Mode      | Normal (single), Circular (continuous)                       |
| Size      | Byte, half-word, word                                        |

**ADC with DMA configuration**:

```cpp
#define ADC_BUFFER_SIZE 64
volatile uint16_t adc_buffer[ADC_BUFFER_SIZE];

void adc_dma_init(void) {
    // 1. Configure GPIO (PA0)
    // ... (same as before)

    // 2. Configure ADC for continuous mode
    RCC->APB2ENR |= RCC_APB2ENR_ADC1EN;
    ADC1->CR1 = 0;
    ADC1->CR2 |= ADC_CR2_ADON | ADC_CR2_CONT;  // Continuous mode
    ADC1->SMPR2 = ADC_SMPR2_SMP0;               // Channel 0, 84 cycles
    ADC1->CHSELR = (1 << 0);                    // Select channel 0

    // 3. Configure DMA2 (ADC1 uses DMA2 Channel 0)
    RCC->AHB1ENR |= RCC_AHB1ENR_DMA2EN;
    DMA2_Stream0->CR &= ~DMA_SxCR_EN;           // Disable DMA first

    DMA2_Stream0->PAR = (uint32_t)&ADC1->DR;   // Peripheral address
    DMA2_Stream0->M0AR = (uint32_t)adc_buffer; // Memory address
    DMA2_Stream0->NDTR = ADC_BUFFER_SIZE;     // Number of elements
    DMA2_Stream0->CR = DMA_SxCR_CHSEL_0 |     // Channel 0
                        DMA_SxCR_MINC |        // Memory increment
                        DMA_SxCR_CIRC |         // Circular mode
                        DMA_SxCR_PSIZE_0 |     // Peripheral: 16-bit
                        DMA_SxCR_MSIZE_0;      // Memory: 16-bit

    DMA2_Stream0->CR |= DMA_SxCR_EN;          // Enable DMA

    // 4. Enable DMA request in ADC
    ADC1->CR2 |= ADC_CR2_DMA;

    // 5. Start ADC
    ADC1->CR2 |= ADC_CR2_ADSTART;
}

// Check if buffer is half-full (first half complete)
int dma_half_complete(void) {
    return (DMA2_Stream0->CR & DMA_SxCR_HTIE) &&
           (DMA2_Stream0->NDTR == ADC_BUFFER_SIZE / 2);
}
```

**Circular buffer processing**:

```cpp
void process_adc_data(void) {
    static uint16_t last_pos = 0;
    uint16_t current_pos = ADC_BUFFER_SIZE - DMA2_Stream0->NDTR;

    if (current_pos != last_pos) {
        uint16_t start = last_pos;
        uint16_t end = current_pos;

        // Process new samples
        for (uint16_t i = start; i < end; i++) {
            float voltage = (adc_buffer[i] * 3.3f) / 4095.0f;
            // Process voltage reading
        }

        last_pos = current_pos;
        if (last_pos >= ADC_BUFFER_SIZE) last_pos = 0;
    }
}
```

::: tip Double-buffering
For higher data rates or real-time processing, use double-buffering mode with two memory targets (M0AR and M1AR) and transfer-complete interrupts to switch buffers without missing samples.
:::

**Check your understanding**: What happens if DMA buffer fills while you're still processing the previous data? How does circular mode solve this?

---

### Week 3 — Sensor Interfacing and Signal Conditioning

**Core idea**: Interface various sensors and implement signal conditioning in firmware.

**Key concepts to learn**:

- Sensor types (voltage, current, resistance output)
- Signal conditioning (amplification, filtering)
- Ratiometric sensors vs absolute reference
- Oversampling and averaging

**Temperature sensor (thermistor)**:

```cpp
// NTC Thermistor (negative temperature coefficient)
// Circuit: VCC --- 10k resistor --- ADC pin --- Thermistor --- GND

// Steinhart-Hart equation for NTC
float thermistor_temperature(uint16_t adc_raw) {
    float resistance = (10000.0f * adc_raw) / (4095.0f - adc_raw);

    // Steinhart-Hart coefficients (example for 10k NTC)
    float log_r = logf(resistance);
    float inv_t = 0.00335401643468053 +
                  0.000256524127307866 * log_r +
                  0.000002605570290375 * log_r * log_r +
                  0.000000063004180 * log_r * log_r * log_r;

    return (1.0f / inv_t) - 273.15f;  // Celsius
}
```

**Current sense amplifier**:

```cpp
// ACS712 Current Sensor (20A version)
// Output: 100mV/A, centered at 2.5V for 0A
// ADC reads voltage, need to convert to current

float current_sense(uint16_t adc_raw) {
    // Convert ADC to voltage (3.3V reference)
    float voltage = (adc_raw * 3.3f) / 4095.0f;

    // Sensitivity is 100mV/A for 20A version
    // Zero current voltage is 2.5V
    float current = (voltage - 2.5f) / 0.1f;

    return current;
}
```

**Oversampling and averaging for higher resolution**:

```cpp
// 12-bit ADC, oversample to ~16-bit
// Need 256 samples for 4-bit improvement
#define OVERSAMPLE_RATIO 256

uint16_t adc_oversample(void) {
    uint32_t sum = 0;

    for (int i = 0; i < OVERSAMPLE_RATIO; i++) {
        // Single ADC read
        ADC1->CHSELR = (1 << 0);
        ADC1->SR = ~ADC_SR_EOC;
        ADC1->CR2 |= ADC_CR2_SWSTART;
        while (!(ADC1->SR & ADC_SR_EOC));
        sum += ADC1->DR;
    }

    // Right-shift 4 bits to get 16-bit result
    return sum >> 4;
}
```

**Moving average filter**:

```cpp
#define FILTER_SIZE 16
volatile float voltage_filtered;

void moving_average_filter(uint16_t raw) {
    static uint16_t samples[FILTER_SIZE];
    static uint8_t index = 0;
    static uint32_t sum = 0;

    // Subtract oldest, add newest
    sum -= samples[index];
    sum += raw;
    samples[index] = raw;
    index = (index + 1) % FILTER_SIZE;

    voltage_filtered = (sum / FILTER_SIZE) * (3.3f / 4095.0f);
}
```

::: warning Ratiometric sensors
Sensors like potentiometers that divide VCC are "ratiometric" — their output is proportional to VCC. If you power them from 3.3V, the ADC reading is proportional to 3.3V. If VCC varies, your reading varies even if physical value is constant. Use VCC as voltage reference or use sensors with absolute reference.
:::

**Check your understanding**: Why does oversampling improve resolution only if the signal has noise? What happens if the signal is perfectly stable?

---

## Common misconceptions

| Misconception                              | Reality                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| "ADC reads 3.3V = 4095 always"             | Only if Vref+ = 3.3V. If Vref+ = 3.0V, then 3.3V would saturate at max |
| "Shorter sampling = faster conversion"     | Faster conversion, but less accurate for high-impedance sources        |
| "Oversampling always gives more precision" | Works only if signal has enough noise (≥ 1 LSB) to dither              |
| "DMA is always better"                     | Overhead of setting up DMA isn't worth it for single conversions       |
| "12-bit ADC = accurate to 12 bits"         | Effective number of bits (ENOB) is usually 10-11 due to noise          |

---

## Suggested resources

### Videos

- [ADC Programming on STM32 — ControllersTech](https://youtube.com/playlist?list=PLfIJKC1ud8AgeN6AFkvSs7CbHFmoNpY_)
- [DMA Made Easy — Robert Feranec](https://youtube.com/watch?v=vYVp6t2q2kM)

### Reading

- **STM32F4 Reference Manual (RM0090)** — ADC章节
- **Analog Devices Sensor Interfacing Handbook**
- **Op-Amp Applications Handbook** (Walter Jung)

### Hardware (recommended)

| Sensor                  | Notes                 |
| ----------------------- | --------------------- |
| NTC Thermistor (10k)    | Temperature sensing   |
| ACS712 Current Sensor   | Current measurement   |
| LM35 Temperature Sensor | Linear Celsius output |
| Photoresistor (GL5528)  | Light sensing         |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="bare-metal-adc-checklist" :items="[
  { id: '1', label: 'Configure ADC1 channel 5 (PA5) with 84-cycle sampling and read raw value' },
  { id: '2', label: 'Set up DMA to continuously fill a 256-sample buffer from ADC' },
  { id: '3', label: 'Implement a moving average filter with 32 samples' },
  { id: '4', label: 'Interface a thermistor and convert raw ADC to temperature using Steinhart-Hart' },
  { id: '5', label: 'Calculate ENOB given signal and noise measurements' },
  { id: '6', label: 'Explain the difference between ratiometric and absolute reference sensors' }
]" />
