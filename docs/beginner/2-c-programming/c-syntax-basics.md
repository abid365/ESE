# C Syntax Basics

**Who this is for**: Beginners starting their journey in embedded systems and C programming.  
**Time to complete**: ~3 weeks, 1–2 hours per day.  
**Why it matters**: C is the language of embedded systems. Before you can write firmware for microcontrollers, you must understand C syntax — the grammar that every C program follows.

**Videos**:

- [C Programming for Beginners | Full Course](https://www.youtube.com/watch?v=KJgsSF0SqIQ)
- [C Syntax and Structure - Microchip University](https://mu.microchip.com/syntax-and-structure-of-c-simply-c)

---

## How this connects to embedded work

Every embedded program — from a simple LED blinker to a complex RTOS — is built from C syntax. Understanding data types tells you how much memory each variable consumes on your MCU. Knowing operators lets you manipulate sensor values. Understanding printf helps you debug via UART.

**Quick example**: A temperature sensor returns a raw ADC value. You need to convert it:

```c
int raw_value = 2048;           // 12-bit ADC reading
float voltage = raw_value * 3.3 / 4095.0;  // Convert to voltage
float temperature = (voltage - 0.5) * 100; // Convert to Celsius
```

Every line uses C syntax: variable declaration, arithmetic operators, assignment.

---

## Module structure

### Week 1 — Data types, variables, and constants

**Core idea**: Every piece of data in your program has a type. The type determines how the data is stored, how much memory it uses, and what operations you can perform on it.

**Why it matters in embedded**: MCUs have limited RAM (often 2KB–64KB). Choosing the right data type isn't just about correctness — it's about fitting your code in memory. A `long` on a 32-bit ARM takes 4 bytes. On an 8-bit AVR, it might take 4 bytes too, but your RAM is only 2KB total.

**Key concepts to learn**:

- Primitive data types and their sizes
- Variable declaration and initialization
- Constants (const, #define)
- Type modifiers (signed, unsigned, short, long)

**Data types table**:

| Type | Size (typical) | Range | Example |
| ---- | --------------- | ----- | ------- |
| `char` | 1 byte | -128 to 127 (signed) or 0 to 255 (unsigned) | `char grade = 'A';` |
| `int` | 2 or 4 bytes | -32,768 to 32,767 (16-bit) or -2,147,483,648 to 2,147,483,647 (32-bit) | `int count = 42;` |
| `float` | 4 bytes | ±3.4e38 (~7 decimal digits) | `float temp = 23.5;` |
| `double` | 8 bytes | ±1.8e308 (~15 decimal digits) | `double voltage = 3.301;` |
| `void` | — | — | Used for functions that return nothing |

**Size-specific types (recommended for embedded)**:

| Type | Size | Purpose |
| ---- | ---- | ------- |
| `int8_t` | 1 byte | Exact -128 to 127 |
| `uint8_t` | 1 byte | Exact 0 to 255 (often used for bytes) |
| `int16_t` | 2 bytes | Exact -32,768 to 32,767 |
| `uint16_t` | 2 bytes | Exact 0 to 65,535 |
| `int32_t` | 4 bytes | Exact -2.1B to 2.1B |
| `uint32_t` | 4 bytes | Exact 0 to 4.3B |

These are from `<stdint.h>` — use them for predictable, portable code across different MCUs.

**Code example**:

```c
#include <stdint.h>

// Constants
#define LED_PIN 13
#define SENSOR_THRESHOLD 500

// Variables
uint16_t adc_value = 0;
float temperature = 0.0f;
char status_flag = 'A';

// Initialization
uint8_t counter = 0;    // Initialize on declaration
```

**Check your understanding**: On a 16-bit MCU, how many bytes does `int` use? How many does `int32_t` use? Why use `uint8_t` instead of `int` for a byte counter?

---

### Week 2 — Operators and expressions

**Core idea**: Operators let you perform computations, make comparisons, and combine values. An expression is a combination of operators and operands that produces a value.

**Why it matters in embedded**: Every sensor calculation, every threshold check, every PWM duty cycle computation uses operators. Knowing operator precedence prevents subtle bugs.

**Arithmetic operators**:

| Operator | Description | Example |
| -------- | ----------- | ------- |
| `+` | Addition | `sum = a + b;` |
| `-` | Subtraction | `diff = a - b;` |
| `*` | Multiplication | `product = a * b;` |
| `/` | Division | `quotient = a / b;` |
| `%` | Modulo (remainder) | `remainder = a % b;` |
| `++` | Increment | `a++;` (adds 1) |
| `--` | Decrement | `b--;` (subtracts 1) |

**Relational operators** (return 1 for true, 0 for false):

| Operator | Description | Example |
| -------- | ----------- | ------- |
| `==` | Equal to | `if (x == 5)` |
| `!=` | Not equal to | `if (x != 0)` |
| `>` | Greater than | `if (a > b)` |
| `<` | Less than | `if (a < b)` |
| `>=` | Greater or equal | `if (a >= 10)` |
| `<=` | Less or equal | `if (a <= 100)` |

**Logical operators**:

| Operator | Description | Example |
| -------- | ----------- | ------- |
| `&&` | Logical AND | `if (a > 0 && b > 0)` |
| `\|\|` | Logical OR | `if (a == 1 \|\| b == 2)` |
| `!` | Logical NOT | `if (!done)` |

**Bitwise operators** (crucial for embedded):

| Operator | Description | Example |
| -------- | ----------- | ------- |
| `&` | Bitwise AND | `mask = 0xFF & 0x0F;` |
| `\|` | Bitwise OR | `flags = 0x01 \| 0x02;` |
| `^` | Bitwise XOR | `toggle = a ^ b;` |
| `~` | Bitwise NOT (invert) | `inverted = ~mask;` |
| `<<` | Left shift | `value << 2;` |
| `>>` | Right shift | `value >> 3;` |

**Assignment operators**:

| Operator | Example | Equivalent to |
| -------- | ------- | -------------- |
| `=` | `x = 5;` | Assign 5 to x |
| `+=` | `x += 3;` | `x = x + 3;` |
| `-=` | `x -= 2;` | `x = x - 2;` |
| `*=` | `x *= 4;` | `x = x * 4;` |
| `/=` | `x /= 2;` | `x = x / 2;` |

**Operator precedence** (highest to lowest):

1. `()` — parentheses
2. `++`, `--` (postfix), `!`, `~`, `+`, `-` (unary)
3. `*`, `/`, `%`
4. `+`, `-`
5. `<<`, `>>`
6. `<`, `>`, `<=`, `>=`
7. `==`, `!=`
8. `&` (bitwise AND)
9. `^` (bitwise XOR)
10. `|` (bitwise OR)
11. `&&`
12. `||`
13. `?:` (ternary)
14. `=`, `+=`, `-=`, etc.

**Code example — sensor reading conversion**:

```c
#include <stdint.h>

uint16_t read_adc(void) {
    // Simulated ADC reading
    return 2048;
}

int main(void) {
    uint16_t raw = read_adc();
    
    // Convert 12-bit ADC (0-4095) to voltage (0-3.3V)
    float voltage = (raw / 4095.0f) * 3.3f;
    
    // Convert voltage to temperature (10mV/°C, 0°C = 500mV)
    float temperature = (voltage - 0.5f) * 100.0f;
    
    // Check if temperature is in safe range
    if (temperature > 25.0f && temperature < 85.0f) {
        // Safe range
    }
    
    // Bit manipulation: extract high and low nibbles
    uint8_t high_nibble = (raw >> 4) & 0xFF;
    uint8_t low_nibble = raw & 0x0F;
    
    return 0;
}
```

**Exercise**: Write an expression that converts Celsius to Fahrenheit. Formula: `F = C * 9/5 + 32`.

---

### Week 3 — Input/Output and program structure

**Core idea**: Every program needs a structure — where code goes, how it's organized, and how it interacts with the outside world through I/O.

**Why it matters in embedded**: Your MCU talks to the world via UART, SPI, I2C, GPIO. printf() often goes to a serial console. Understanding program structure makes debugging possible.

**Program structure**:

```c
// Include headers
#include <stdio.h>      // For printf
#include <stdint.h>     // For fixed-width types

// Function prototypes (optional for main.c)
void init_system(void);

// Main function — entry point
int main(void) {
    // Initialization
    init_system();
    
    // Main loop or one-time computation
    int value = 42;
    printf("The value is: %d\n", value);
    
    return 0;  // 0 = success
}

// Function definitions
void init_system(void) {
    // Setup code here
}
```

**printf format specifiers**:

| Specifier | Type | Example Output |
| --------- | ---- | -------------- |
| `%d` or `%i` | int (signed decimal) | `-42`, `42` |
| `%u` | int (unsigned decimal) | `42` |
| `%x` | int (hexadecimal) | `2A` |
| `%o` | int (octal) | `52` |
| `%f` | float/double | `3.140000` |
| `%f` with `.2` | float with precision | `3.14` |
| `%e` | float (scientific) | `3.14e+00` |
| `%c` | char | `A` |
| `%s` | string (char*) | `Hello` |
| `%p` | pointer | `0x20000000` |

**printf escape sequences**:

| Sequence | Meaning |
| -------- | ------- |
| `\n` | Newline |
| `\t` | Tab |
| `\\` | Backslash |
| `\"` | Double quote |
| `%%` | Percent sign |

**Code example — formatted sensor output**:

```c
#include <stdio.h>
#include <stdint.h>

int main(void) {
    uint16_t raw_adc = 2048;
    float voltage = (raw_adc / 4095.0f) * 3.3f;
    float temp_c = (voltage - 0.5f) * 100.0f;
    
    // Print with formatting
    printf("Sensor Reading\n");
    printf("--------------\n");
    printf("Raw ADC:   %u\n", raw_adc);
    printf("Voltage:   %.2f V\n", voltage);
    printf("Temperature: %.1f C\n", temp_c);
    
    // Memory info
    printf("\nData type sizes:\n");
    printf("char:   %zu byte(s)\n", sizeof(char));
    printf("int:    %zu byte(s)\n", sizeof(int));
    printf("float:  %zu byte(s)\n", sizeof(float));
    printf("double: %zu byte(s)\n", sizeof(double));
    
    return 0;
}
```

**Output**:
```
Sensor Reading
--------------
Raw ADC:   2048
Voltage:   1.65 V
Temperature: 115.0 C

Data type sizes:
char:   1 byte(s)
int:    4 byte(s)
float:  4 byte(s)
double: 8 byte(s)
```

**scanf basics** (for reading input):

```c
#include <stdio.h>

int main(void) {
    int age;
    float score;
    
    printf("Enter age: ");
    scanf("%d", &age);    // Note: & is required!
    
    printf("Enter score: ");
    scanf("%f", &score);
    
    printf("Age: %d, Score: %.2f\n", age, score);
    
    return 0;
}
```

::: tip The & operator
scanf requires the address of the variable (`&age`), not the value itself. This is because scanf needs to write into the variable.
:::

---

## Common misconceptions

| Misconception | Reality |
| ------------- | ------- |
| "`int` is always 4 bytes" | On 16-bit MCUs, `int` is often 2 bytes. Use `int32_t` for guaranteed 4 bytes. |
| "`float` is more precise than `int`" | `float` has ~7 decimal digits of precision but can represent enormous ranges. For exact counts, use integers. |
| "printf is only for debugging" | On embedded systems, printf often goes to UART — it's your primary output channel. |
| "I can skip learning syntax" | Every embedded program is built from these basics. Skipping syntax means every future step is harder. |
| "char is for characters only" | `char` is just 1 byte — it can store ASCII, small integers, or raw bytes. |

---

## Suggested resources

### For beginners (recommended starting point)

- **[C Programming for Beginners | Full Course](https://www.youtube.com/watch?v=KJgsSF0SqIQ)**: Comprehensive video course covering all basics.
- **[W3Schools C Tutorial](https://www.w3schools.com/c/)**: Quick reference with interactive examples.
- **[C Tutorial - Programiz](https://www.programiz.com/c-programming)**: Good for structured learning.

### Textbooks

- **C Programming Language** (Kernighan & Ritchie): The classic. Short but dense.
- **C Primer Plus** (Prata): More detailed, good for beginners.

### Embedded-specific

- **[Microchip University - C Syntax](https://mu.microchip.com/syntax-and-structure-of-c-simply-c)**: Free course focused on embedded C.

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="c-syntax-basics-checklist" :items="[
  { id: '1', label: 'Declare a variable of type uint16_t and initialize it to 1000' },
  { id: '2', label: 'Explain the difference between int, float, and double' },
  { id: '3', label: 'Write a printf statement that prints a float with 2 decimal places' },
  { id: '4', label: 'Use bitwise operators to extract the upper 4 bits of a uint8_t' },
  { id: '5', label: 'Explain why int8_t is preferred over int for exact -128 to 127 range' }
]" />