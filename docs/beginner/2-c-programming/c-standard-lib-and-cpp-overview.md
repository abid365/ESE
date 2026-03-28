# C Standard Library and Embedded Libraries

**Who this is for**: C learners who want to know what libraries are available and get a quick overview of C++.  
**Time to complete**: ~2 weeks, 1–2 hours per day.  
**Why it matters**: Knowing available libraries saves reinventing the wheel. Understanding C++ basics helps when reading embedded frameworks like Arduino or ARM CMSIS.

**Videos**:

- [C Standard Library Overview](https://www.youtube.com/watch?v=3akK6KpvKqM)
- [C vs C++ Explained](https://www.youtube.com/watch?v=yx4FQV6z8z4)

---

## How this connects to embedded work

Microcontrollers use specific libraries for hardware access, timing, and communication. Knowing what's available lets you focus on your application, not reinventing basic functions.

---

## Module structure

### Week 1 — Essential C Libraries for Embedded

**Core idea**: Most embedded C code uses a small set of libraries. Learn these and you can read most embedded code.

**Why it matters in embedded**: Every MCU has its own header files for hardware access. Knowing standard libraries helps you navigate any codebase.

**The 20/80 of C Libraries**:

These 6 libraries cover ~80% of what you need:

| Library | Purpose | Use Case |
| ------- | ------- | -------- |
| `<stdint.h>` | Fixed-width types | Essential for portable code |
| `<stdbool.h>` | Boolean types | True/false logic |
| `<stdio.h>` | I/O functions | printf for debugging |
| `<string.h>` | String functions | Memory/string operations |
| `<stdlib.h>` | Utility functions | Memory, conversion |
| `<math.h>` | Math functions | Only on systems with FPU |

**Library details**:

**`<stdint.h>`** — The most important embedded library:

```c
#include <stdint.h>
#include <inttypes.h>

// Fixed-width integer types
int8_t    a;    // 1 byte: -128 to 127
uint8_t   b;    // 1 byte: 0 to 255
int16_t   c;    // 2 bytes: -32,768 to 32,767
uint16_t  d;    // 2 bytes: 0 to 65,535
int32_t   e;    // 4 bytes: -2.1B to 2.1B
uint32_t  f;    // 4 bytes: 0 to 4.3B
int64_t   g;    // 8 bytes

// Format specifiers for printf
printf("Value: %" PRId8 "\n", a);
printf("Value: %" PRIu16 "\n", d);

// Limits
printf("INT8_MAX: %d\n", INT8_MAX);   // 127
printf("UINT8_MAX: %u\n", UINT8_MAX); // 255
```

**`<stdbool.h>`** — Clean boolean logic:

```c
#include <stdbool.h>

bool is_ready = true;
bool error_occurred = false;

if (is_ready && !error_occurred) {
    start_operation();
}

// Boolean is just 1 byte (0 or 1)
```

**`<stdio.h>`** — Limited use on MCUs:

```c
#include <stdio.h>

// Works on systems with stdout (UART, USB CDC)
printf("Temperature: %.1f C\n", temp);

// Format specifiers
%d    // int (decimal)
%u    // unsigned int
%x    // hexadecimal
%f    // float (may not work on small MCUs)
%p    // pointer
%s    // string
%c    // character

// Snprintf for safe string building
char buffer[50];
snprintf(buffer, sizeof(buffer), "Value: %d", value);
```

**`<string.h>`** — Memory and string operations:

```c
#include <string.h>

// Memory functions (work on any data)
memset(buffer, 0, 100);        // Set 100 bytes to 0
memcpy(dest, src, 20);         // Copy 20 bytes
memcmp(a, b, 10);              // Compare 10 bytes

// String functions (for char arrays)
strlen(str);                   // Length of string
strcpy(dest, src);             // Copy string
strcat(dest, src);             // Append string
strcmp(a, b);                  // Compare strings (0 = equal)
```

**`<stdlib.h>`** — Utility functions:

```c
#include <stdlib.h>

// Numeric conversion
int num = atoi("123");         // String to int
long l = atol("123456");       // String to long
float f = atof("3.14");        // String to float

// Memory (if heap available - most MCUs don't have this!)
void* ptr = malloc(100);       // Allocate 100 bytes
free(ptr);                     // Release memory

// Sort (useful for data processing)
int arr[] = {3, 1, 4, 1, 5};
qsort(arr, 5, sizeof(int), compare_int);
```

::: warning Heap on embedded
Many microcontrollers don't have `malloc`/`free`. Use static/stack allocation instead. Check your platform documentation.
:::

**Code example — practical embedded usage**:

```c
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>

#define BUFFER_SIZE 64

typedef struct {
    char name[32];
    uint16_t value;
    bool active;
} Sensor;

void init_sensor(Sensor* s, const char* name, uint16_t val) {
    memset(s, 0, sizeof(Sensor));  // Clear structure
    strncpy(s->name, name, 31);    // Safe string copy
    s->value = val;
    s->active = true;
}

void print_sensor(const Sensor* s) {
    if (s->active) {
        printf("Sensor: %s, Value: %u\n", s->name, s->value);
    }
}

int main(void) {
    Sensor temp_sensor;
    init_sensor(&temp_sensor, "Temp", 250);
    print_sensor(&temp_sensor);
    
    return 0;
}
```

**MCU-specific libraries** (most common):

| Platform | Library/Header | Purpose |
| -------- | --------------- | ------- |
| STM32 | `stm32f4xx.h` | Device registers |
| AVR | `avr/io.h` | AVR I/O registers |
| ESP32 | `esp_idf.h` | ESP-IDF framework |
| Arduino | `Arduino.h` | Arduino functions |
| ARM Cortex | `cmsis_device.h` | ARM CMSIS |

```c
// STM32 example
#include "stm32f4xx_hal.h"

HAL_Init();
SystemClock_Config();
GPIO_Init();

// AVR example
#include <avr/io.h>
#include <util/delay.h>

DDRB |= (1 << PB0);  // Set PB0 as output
PORTB |= (1 << PB0); // Set PB0 high
```

**Check your understanding**: Why use `<stdint.h>` types like `uint16_t` instead of plain `int`? What's the benefit?

---

### Week 2 — C to C++ Quick Overview

**Core idea**: C++ adds features on top of C. If you know C, here's the 20% of C++ that covers 80% of what you'll encounter in embedded.

**Why it matters in embedded**: Many frameworks (Arduino, ARM CMSIS, Mbed) use C++. Knowing these basics helps you read and write C++ code.

::: info C vs C++ - Quick Comparison
C++ is mostly a superset of C. Everything you know in C works in C++. C++ adds:
- Classes and OOP
- References and references
- Templates
- Exceptions (rare in embedded)
- STL (usually not on MCUs)

This section covers what you'll see most often.
:::

**Key C++ additions you'll encounter**:

**1. References (`&`)** — Like pointers but safer:

```cpp
// C version - pointer
void increment(int* x) {
    (*x)++;
}

// C++ version - reference (cleaner syntax)
void increment(int& x) {
    x++;
}

// Usage
int a = 5;
increment(&a);    // C: pass address
increment(a);     // C++: pass reference (cleaner)
```

**2. Classes** — Group data and functions:

```cpp
// C version
struct LED {
    uint8_t pin;
    bool state;
};

void led_init(LED* led, uint8_t pin) {
    led->pin = pin;
    led->state = false;
}

void led_on(LED* led) {
    led->state = true;
}

// C++ version - everything in one place
class LED {
private:
    uint8_t pin;
    bool state;
    
public:
    LED(uint8_t p) : pin(p), state(false) {}  // Constructor
    
    void on() { state = true; }
    void off() { state = false; }
    void toggle() { state = !state; }
};

// Usage
LED led(13);     // Create (constructor initializes)
led.on();        // Call method (no pointer needed)
```

**3. `new` and `delete`** — C++ memory allocation:

```cpp
// C
int* arr = malloc(10 * sizeof(int));
free(arr);

// C++
int* arr = new int[10];
delete[] arr;

// In embedded: usually avoid these, use static allocation
```

**4. Function overloading** — Same name, different parameters:

```cpp
// C - need different names
int add_int(int a, int b);
float add_float(float a, float b);

// C++ - same name works
int add(int a, int b) { return a + b; }
float add(float a, float b) { return a + b; }

int x = add(1, 2);       // Calls add(int, int)
float y = add(1.0f, 2.0f); // Calls add(float, float)
```

**5. `std::` namespace** — Standard library prefix:

```cpp
// Old C++ (still works)
#include <iostream.h>

// Modern C++
#include <iostream>
#include <string>
#include <vector>

std::string name = "Sensor";
std::vector<uint16_t> data;  // Dynamic array
```

**6. `cout` and `cin`** — C++ I/O (often not on MCUs):

```cpp
#include <iostream>

using namespace std;  // Avoid typing std::

cout << "Hello" << endl;
cout << "Value: " << value << endl;

cin >> name;
```

**7. Classes with inheritance** — Common in frameworks:

```cpp
// Base class
class Sensor {
public:
    virtual float read() = 0;  // Pure virtual
    virtual void init() {}
    virtual ~Sensor() {}
};

// Derived class
class TempSensor : public Sensor {
public:
    float read() override {
        return read_adc() * 0.1f;
    }
};

// Usage through base pointer
Sensor* s = new TempSensor();
float val = s->read();  // Calls TempSensor::read()
delete s;
```

**Quick C++ glossary**:

| Term | C Equivalent | Meaning |
| ---- | ------------ | ------- |
| `class` | `struct` | Groups data and functions |
| `public:` | — | Accessible everywhere |
| `private:` | — | Accessible only in class |
| `protected:` | — | Like private but for derived classes |
| `virtual` | — | Can be overridden |
| `new`/`delete` | `malloc`/`free` | C++ memory allocation |
| `&` (reference) | `*` (pointer) | Alternative to pointers |
| `::` | — | Scope resolution (e.g., `std::`) |
| `cout` | `printf` | C++ output |
| `this` | — | Pointer to current object |

**Code example — Arduino-style C++**:

```cpp
// What you'll see in Arduino/embedded C++ code

class TemperatureSensor {
private:
    uint8_t pin;
    float offset;
    
public:
    // Constructor
    TemperatureSensor(uint8_t p, float o) : pin(p), offset(o) {}
    
    // Member function
    float read() {
        uint16_t raw = analogRead(pin);
        return (raw * 5.0f / 1024.0f - 0.5f) * 100.0f + offset;
    }
    
    // Inline initialization (common in embedded)
    void begin() {
        pinMode(pin, INPUT);
    }
};

// Usage
TemperatureSensor temp(0, -1.5f);
temp.begin();

while (true) {
    float t = temp.read();
    delay(1000);
}
```

**When you'll see C++ in embedded**:

| Framework | Language | Example |
| ---------- | -------- | ------- |
| Arduino | C++ | `class Servo`, `class Wire` |
| ARM mbed | C++ | `DigitalOut`, `InterruptIn` |
| STM32 HAL | C | Mostly C, some C++ wrappers |
| ESP-IDF | C++ | `class WiFi`, `class BLE` |
| Raspberry Pi | C++ | Full C++ available |

**Check your understanding**: What's the difference between `int* p` and `int& r` in C++? When would you use a class instead of a struct?

---

## Common misconceptions

| Misconception | Reality |
| ------------- | ------- |
| "C++ doesn't work on MCUs" | Arduino, mbed, ESP-IDF all use C++ on MCUs |
| "I need to learn all of C++" | You only need the basics for embedded |
| "malloc doesn't work on MCUs" | Many MCUs have no heap, but some (ESP32) do |
| "printf is always available" | On small MCUs, printf may not work |
| "std::string is available" | Usually not on embedded — use char arrays |

---

## Self-check before moving on

You're ready to move on when you can do all of these without looking anything up:

<SelfCheckList storageKey="c-libraries-checklist" :items="[
  { id: '1', label: 'Use stdint.h types (uint8_t, uint16_t) in your code' },
  { id: '2', label: 'Use memset to clear a struct' },
  { id: '3', label: 'Explain what a reference (&) is in C++' },
  { id: '4', label: 'Convert a C struct to a simple C++ class' },
  { id: '5', label: 'What is the difference between new and malloc?' }
]" />