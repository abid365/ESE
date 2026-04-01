# Arduino Beginner Projects: Your First Firmware

**Who this is for**: Developers who've completed the C programming basics and want to apply them to real hardware.  
**Time to complete**: ~4 weeks, 1–2 hours per day.  
**Why it matters**: Arduino provides the easiest path from "I wrote code" to "I see an LED blink." It bridges software and hardware, teaching you how firmware interacts with physical components.

**Videos**:

- [Arduino R4 WiFi LESSONS for Absolute Beginners](https://youtu.be/S66Iwhk2V7A?si=XtC_Yms3BW48rMpA)
- [Arduino Tutorial for Beginners - DroneBot Workshop](https://www.youtube.com/results?search_query=Arduino+Tutorial+for+Beginners+DroneBot+Workshop)

<CoursePlayer
  videoSrc="https://www.youtube.com/watch?v=S66Iwhk2V7A"
  storageKey="arduino-beginner"
  :lessons="[
    { title: 'Arduino R4 WiFi Setup', link: 'https://youtu.be/S66Iwhk2V7A' },
    { title: 'Blink Sketch Explained', link: 'https://youtu.be/S66Iwhk2V7A' },
    { title: 'Digital Output Basics', link: 'https://youtu.be/S66Iwhk2V7A' },
    { title: 'Digital Input with Button', link: 'https://youtu.be/S66Iwhk2V7A' }
  ]"
/>

---

## How this connects to embedded work

Arduino is C/C++ running on real hardware. Every concept from the C programming module applies:

- **GPIO pins** = digitalWrite() / digitalRead()
- **Timers** = millis() / delay()
- **ADC** = analogRead()
- **PWM** = analogWrite() (on supported pins)

The difference from "real" embedded: Arduino hides complexity behind libraries. This is good for learning — you see results fast. Later, you'll use STM32 HAL or bare metal to access registers directly.

**Quick example**: Blinking an LED is "Hello World" in hardware:

```cpp
void setup() {
    pinMode(LED_BUILTIN, OUTPUT);  // Configure pin as output
}

void loop() {
    digitalWrite(LED_BUILTIN, HIGH);  // Turn LED on
    delay(1000);                       // Wait 1 second
    digitalWrite(LED_BUILTIN, LOW);   // Turn LED off
    delay(1000);                       // Wait 1 second
}
```

This code runs on ARM Cortex-M, AVR, ESP32, or any Arduino-compatible board. The firmware concept is identical across platforms.

---

## Module structure

### Week 1 — Arduino IDE setup and first sketch

**Core idea**: Get the development environment working and understand the Arduino program structure.

**Why it matters in embedded**: Arduino uses a simplified bootloader and USB-UART interface. Understanding this flow helps when you later switch to JTAG/SWD programming on ARM.

**Key concepts to learn**:

- Arduino IDE installation and board manager
- Sketch structure: setup() and loop()
- Selecting the correct board and port
- Upload process and bootloader role

**Installing Arduino IDE**:

1. Download from [arduino.cc/en/software](https://www.arduino.cc/en/software)
2. Install board drivers when prompted
3. For Arduino R4 WiFi: use Board Manager to install Renesas RA board package

**Arduino sketch structure**:

```cpp
// runs once at startup or after reset
void setup() {
    // Initialize GPIO, serial, etc.
}

// runs repeatedly forever
void loop() {
    // Main firmware logic
}
```

::: tip Why loop() exists
Unlike desktop C where main() runs and exits, embedded firmware runs forever. The loop() function is called repeatedly by the Arduino framework — your code never stops unless you cut power or reset.
:::

**Selecting board and port**:

- Tools → Board → Select your board (Arduino UNO, Nano, R4 WiFi, etc.)
- Tools → Port → Select the COM port assigned to your board
- On Linux/Mac: device will be /dev/ttyUSB0 or similar

**Uploading a sketch**:

```
1. Click Upload button (right arrow →)
2. Arduino IDE compiles the sketch
3. IDE resets the board (DTR toggle on USB)
4. Bootloader receives code for ~2 seconds
5. Code uploads and runs
```

**Check your understanding**: What happens if you select the wrong board in the IDE? What happens if you select the wrong port?

---

### Week 2 — Digital output and GPIO control

**Core idea**: Control physical pins to turn LEDs on/off, drive relays, or signal other hardware.

**Why it matters in embedded**: Every embedded system controls GPIO. Understanding pinMode, digitalWrite, and the difference between source and sink current is foundational.

**Key concepts to learn**:

- pinMode() configuration
- digitalWrite() to set output state
- Source vs sink current
- Built-in LED vs external LED
- Current-limiting resistors

**pinMode() configuration**:

| Mode           | Description                         | Use Case                          |
| -------------- | ----------------------------------- | --------------------------------- |
| OUTPUT         | Pin drives HIGH or LOW              | LED, relay, transmitter           |
| INPUT          | Pin reads HIGH or LOW               | Button, sensor output             |
| INPUT_PULLUP   | Input with internal 20-50kΩ pull-up | Button (avoids external resistor) |
| INPUT_PULLDOWN | Input with internal pull-down       | Button (rare on Arduino)          |

**Digital output code**:

```cpp
const int LED_PIN = 13;  // Built-in LED on most Arduino boards

void setup() {
    pinMode(LED_PIN, OUTPUT);  // Configure as output
}

void loop() {
    digitalWrite(LED_PIN, HIGH);  // Set pin to 3.3V or 5V (depending on board)
    delay(500);                    // Wait 500ms
    digitalWrite(LED_PIN, LOW);   // Set pin to 0V
    delay(500);                    // Wait 500ms
}
```

**Source vs sink current**:

| Concept | Description                              | Limit                              |
| ------- | ---------------------------------------- | ---------------------------------- |
| Source  | Current flows OUT of the pin to the load | ~20-40mA per pin (varies by board) |
| Sink    | Current flows INTO the pin from the load | ~20-40mA per pin                   |

Most GPIO pins can source or sink similar current. Just don't exceed total current for the chip.

**External LED circuit**:

```
Arduino Pin 13 ──── 330Ω Resistor ──── LED (+) ──── LED (-) ──── GND

Resistor calculation for 5V Arduino, LED Vf = 2V, I = 10mA:
R = (5V - 2V) / 0.010A = 300Ω → use 330Ω standard
```

**Why the resistor?** Without it, the LED (or the GPIO pin) will burn out. The resistor limits current to a safe value.

**Multiple LED control**:

```cpp
const int LEDS[] = {2, 3, 4, 5, 6};
const int NUM_LEDS = 5;

void setup() {
    for (int i = 0; i < NUM_LEDS; i++) {
        pinMode(LEDS[i], OUTPUT);
    }
}

void loop() {
    // Chase pattern
    for (int i = 0; i < NUM_LEDS; i++) {
        digitalWrite(LEDS[i], HIGH);
        delay(100);
        digitalWrite(LEDS[i], LOW);
    }
}
```

**Check your understanding**: Why do you need a resistor in series with an LED? What happens if you connect an LED directly from pin to GND without a resistor?

---

### Week 3 — Digital input and button handling

**Core idea**: Read the state of physical inputs like buttons and switches to make decisions in code.

**Why it matters in embedded**: User input (buttons, switches) is common. Understanding pull-up/pull-down resistors and debouncing is essential for reliable input handling.

**Key concepts to learn**:

- digitalRead() to read pin state
- Pull-up and pull-down resistors
- Internal pull-ups (INPUT_PULLUP)
- Button debouncing
- State change detection

**Button circuit with pull-down resistor**:

```
3.3V/5V ──── Button ──── Pin 2 ──── 10kΩ Resistor ──── GND

Button open: Pin reads LOW (0V)
Button closed: Pin reads HIGH (3.3V/5V)
```

**Button circuit with INPUT_PULLUP**:

```cpp
const int BUTTON_PIN = 2;

void setup() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);  // Use internal pull-up
    // External resistor not needed!
}

void loop() {
    int buttonState = digitalRead(BUTTON_PIN);
    // Button pressed: reads LOW (0V) because pulled to GND
    // Button released: reads HIGH because internal pull-up
}
```

::: tip Why INPUT_PULLUP inverts logic
With INPUT_PULLUP, the pin is HIGH when button is NOT pressed. Pressing the button pulls it LOW. This means your code checks for LOW to detect a press. This is backwards from intuition — use a variable name to remind yourself:
`bool isButtonPressed = (digitalRead(BUTTON_PIN) == LOW);`
:::

**Basic button handling**:

```cpp
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

void setup() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    if (digitalRead(BUTTON_PIN) == LOW) {
        digitalWrite(LED_PIN, HIGH);  // Turn on when pressed
    } else {
        digitalWrite(LED_PIN, LOW);   // Turn off when released
    }
}
```

**Debouncing — the problem**:

Mechanical buttons don't make perfect contact. When pressed, they "bounce" between making and breaking contact for ~5-50ms. Without debouncing, a single press might register as multiple presses.

**Debouncing — the solution**:

```cpp
const int BUTTON_PIN = 2;
const int LED_PIN = 13;

bool lastButtonState = HIGH;
bool ledState = LOW;

void setup() {
    pinMode(BUTTON_PIN, INPUT_PULLUP);
    pinMode(LED_PIN, OUTPUT);
}

void loop() {
    bool reading = digitalRead(BUTTON_PIN);

    // State change detected
    if (reading != lastButtonState) {
        delay(50);  // Wait for bouncing to stop

        // Read again after debounce period
        if (digitalRead(BUTTON_PIN) == reading) {
            lastButtonState = reading;

            // Toggle LED on press (LOW because INPUT_PULLUP)
            if (reading == LOW) {
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState ? HIGH : LOW);
            }
        }
    }
}
```

**State change detection (toggling)**:

```cpp
// Track previous and current state to detect changes
bool previousState = HIGH;

void loop() {
    bool currentState = digitalRead(BUTTON_PIN);

    // Detect transition from HIGH to LOW (press)
    if (previousState == HIGH && currentState == LOW) {
        // Button just pressed
    }

    // Detect transition from LOW to HIGH (release)
    if (previousState == LOW && currentState == HIGH) {
        // Button just released
    }

    previousState = currentState;
}
```

**Check your understanding**: What is button bounce? Why does it cause problems? How does the debounce code above handle it?

---

### Week 4 — Analog input with sensors

**Core idea**: Read variable voltage signals from sensors using the ADC (Analog-to-Digital Converter).

**Why it matters in embedded**: Most sensors output analog voltages (temperature, light, potentiometer position). The ADC converts these to digital values your firmware can process.

**Key concepts to learn**:

- analogRead() function
- ADC resolution and voltage reference
- Potentiometer as analog input
- Mapping sensor values to physical units
- voltageDivider circuit for higher voltages

**Arduino ADC specs**:

| Board          | ADC Resolution  | Voltage Reference | Max Input |
| -------------- | --------------- | ----------------- | --------- |
| UNO/Nano (AVR) | 10-bit (0-1023) | Default 5V        | 5V        |
| R4 WiFi (ARM)  | 12-bit (0-4095) | Default 3.3V      | 3.3V      |
| ESP32          | 12-bit (0-4095) | Default 3.3V      | 3.3V      |

**analogRead() function**:

```cpp
void setup() {
    Serial.begin(9600);  // For printing to Serial Monitor
}

void loop() {
    int rawValue = analogRead(A0);  // Read ADC on pin A0

    // Convert to voltage
    float voltage = rawValue * (5.0 / 1023.0);  // 10-bit ADC on 5V board

    Serial.print("Raw: ");
    Serial.print(rawValue);
    Serial.print(" Voltage: ");
    Serial.println(voltage);

    delay(100);
}
```

**Potentiometer reading**:

```
VCC ──── Potentiometer (variable resistor) ──── GND
              │
              └─── Wiper ──── Arduino A0

As you turn the knob:
- All the way one direction: ~0V on A0
- Middle position: ~2.5V on A0
- All the way other direction: ~5V on A0
```

```cpp
void loop() {
    int potValue = analogRead(A0);

    // Map 0-1023 to 0-255 for PWM (explained next week)
    int brightness = map(potValue, 0, 1023, 0, 255);

    Serial.println(brightness);
    delay(100);
}
```

**Temperature sensor (TMP36)**:

```
VCC (3.3V or 5V) ──── TMP36 ──── GND
                      │
                      └─── Output ──── Arduino A0

Output voltage = 0.5V at 0°C
                 + 10mV per °C
```

```cpp
void loop() {
    int raw = analogRead(A0);
    float voltage = raw * (5.0 / 1023.0);  // Convert to voltage

    // TMP36 conversion: 10mV per °C, 500mV offset at 0°C
    float temperatureC = (voltage - 0.5) * 100.0;

    Serial.print("Temperature: ");
    Serial.print(temperatureC);
    Serial.println(" C");

    delay(1000);
}
```

**Light sensor (Photoresistor)**:

```cpp
// Voltage divider: photoresistor + 10kΩ fixed resistor
// VCC --- Photoresistor --- A0 --- 10k --- GND

void loop() {
    int light = analogRead(A0);

    // Higher value = more light (lower resistance)
    // Lower value = less light (higher resistance)

    Serial.print("Light level: ");
    Serial.println(light);

    delay(100);
}
```

**Map function for scaling**:

```cpp
// map(value, fromLow, fromHigh, toLow, toHigh)

// Example: Map ADC (0-1023) to percentage (0-100)
int percentage = map(analogRead(A0), 0, 1023, 0, 100);

// Example: Map potentiometer to servo angle (0-180 degrees)
int angle = map(analogRead(A0), 0, 1023, 0, 180);
```

**Check your understanding**: What is the ADC resolution? If you have a 10-bit ADC on a 5V system, what ADC value corresponds to 2.5V?

---

## Common misconceptions

| Misconception                                | Reality                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| "Arduino is toy hardware"                    | It uses the same ARM/AVR chips as commercial products   |
| "delay() is fine for timing"                 | It blocks the CPU; use millis() for non-blocking delays |
| "analogWrite() outputs real analog"          | It outputs PWM (rapid on/off pulses)                    |
| "Arduino is different from 'real' embedded"  | It's C/C++ on real hardware — same concepts apply       |
| "5V Arduino is compatible with 3.3V sensors" | May damage 3.3V components; use level shifting          |

---

## Suggested resources

### Videos

- **[Arduino R4 WiFi Lessons for Absolute Beginners](https://youtu.be/S66Iwhk2V7A)**: Comprehensive Arduino R4 tutorial
- **DroneBot Workshop Arduino for Beginners**: Good all-around video course

### Reading

- **Arduino Official Documentation**: [docs.arduino.cc](https://docs.arduino.cc)
- **Arduino Language Reference**: [Reference page](https://www.arduino.cc/reference/en/)

### Hardware kits (recommended for beginners)

| Kit                     | Contents                                                 | Price Range |
| ----------------------- | -------------------------------------------------------- | ----------- |
| Arduino UNO Starter Kit | Board, breadboard, LEDs, resistors, sensors, motors      | $30-60      |
| Elegoo UNO Project Kit  | Similar to official, more components, good documentation | $25-40      |
| Keyestudio UNO Kit      | Good mid-range option                                    | $20-35      |

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="arduino-beginner-checklist" :items="[
  { id: '1', label: 'Write a sketch that blinks an LED at 2Hz (on for 250ms, off for 250ms)' },
  { id: '2', label: 'Use INPUT_PULLUP mode and debounce a button to toggle an LED' },
  { id: '3', label: 'Read a potentiometer and map its value to control LED brightness' },
  { id: '4', label: 'Explain the difference between digitalWrite() HIGH and LOW on your board voltage' },
  { id: '5', label: 'Calculate the current-limiting resistor for an LED given VCC, LED forward voltage, and desired current' },
  { id: '6', label: 'Convert an ADC reading from a TMP36 to temperature in Celsius' }
]" />
