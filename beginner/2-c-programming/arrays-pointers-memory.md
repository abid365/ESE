# Arrays, Pointers, and Memory

**Who this is for**: C learners who understand basic syntax and want to master memory management.  
**Time to complete**: ~4 weeks, 1–2 hours per day.  
**Why it matters**: Arrays and pointers are the backbone of C — they're used for buffer handling, data structures, hardware register access, and efficient algorithm implementation.

**Videos**:

- [Pointers and Arrays in C - FreeCodeCamp](https://www.youtube.com/watch?v=1W5KXJWplbc)
- [Dynamic Memory Allocation - Derek Banas](https://www.youtube.com/watch?v=LcfvF1R77g0)

---

## How this connects to embedded work

Every embedded system works with memory directly. Sensor buffers, UART receive rings, LED patterns — all use arrays. Hardware registers are accessed via pointers. Understanding memory layout lets you write efficient firmware:

```c
// Read 10 samples from ADC into array
uint16_t adc_buffer[10];
for (int i = 0; i < 10; i++) {
    adc_buffer[i] = read_adc();
}

// Access hardware register via pointer (common in embedded)
volatile uint32_t* const TIMER_CTRL = (uint32_t*)0x40001000;
*TIMER_CTRL = 0x01;  // Enable timer
```

---

## Module structure

### Week 1 — Arrays fundamentals

**Core idea**: An array is a contiguous block of memory that holds multiple values of the same type. You access each element by its index.

**Why it matters in embedded**: Sensor data, LED patterns, and communication buffers are all arrays. MCU memory is limited — knowing array bounds prevents crashes.

**Key concepts to learn**:

- Array declaration and initialization
- Indexing and bounds
- Multi-dimensional arrays
- Array as function parameters

**Array declaration**:

```c
// Type array_name[element_count]
uint16_t readings[5];      // Uninitialized - contains garbage
uint16_t readings[5] = {0};  // All elements initialized to 0
uint16_t readings[5] = {1, 2, 3, 4, 5};  // Initialize with values
uint16_t readings[] = {1, 2, 3, 4, 5};   // Size inferred from initializer

// Common mistake: going out of bounds
readings[5] = 100;  // WRONG! Index 5 is the 6th element (0-4 are valid)
```

**Array sizes (important for embedded)**:

| Data Type | Size per Element | 10 Elements | 100 Elements |
| --------- | ---------------- | ----------- | ------------ |
| `uint8_t` | 1 byte | 10 bytes | 100 bytes |
| `uint16_t` | 2 bytes | 20 bytes | 200 bytes |
| `uint32_t` | 4 bytes | 40 bytes | 400 bytes |
| `float` | 4 bytes | 40 bytes | 400 bytes |

**Code example — LED pattern buffer**:

```c
#include <stdint.h>

// Define an LED pattern (on/off for 8 LEDs)
uint8_t led_pattern[8] = {
    0b00000001,  // LED 0 on
    0b00000010,  // LED 1 on
    0b00000100,  // LED 2 on
    0b00001000,  // LED 3 on
    0b00010000,  // LED 4 on
    0b00100000,  // LED 5 on
    0b01000000,  // LED 6 on
    0b10000000   // LED 7 on
};

// Function to set all LEDs
void set_all_leds(uint8_t* pattern, uint8_t count) {
    for (uint8_t i = 0; i < count; i++) {
        // Write to LED hardware (simulated)
    }
}

int main(void) {
    set_all_leds(led_pattern, 8);
    return 0;
}
```

**Multi-dimensional arrays**:

```c
// 2D array - like a grid
int matrix[3][4];  // 3 rows, 4 columns

// Initialize
int matrix[3][4] = {
    {1, 2, 3, 4},    // Row 0
    {5, 6, 7, 8},    // Row 1
    {9, 10, 11, 12}  // Row 2
};

// Access elements
matrix[0][0] = 1;    // First row, first column
matrix[2][3] = 12;   // Last row, last column
```

**Common embedded use — ADC buffer**:

```c
#define ADC_SAMPLES 64

// Circular buffer for storing ADC readings
uint16_t adc_readings[ADC_SAMPLES];
uint8_t adc_index = 0;

void add_adc_reading(uint16_t value) {
    adc_readings[adc_index] = value;
    adc_index = (adc_index + 1) % ADC_SAMPLES;  // Wrap around
}

uint16_t get_reading(uint8_t offset) {
    uint8_t index = (adc_index + offset) % ADC_SAMPLES;
    return adc_readings[index];
}
```

**Check your understanding**: What happens if you accidentally write to `array[10]` when the array has 10 elements (valid indices 0-9)? Why is it dangerous on an MCU?

---

### Week 2 — Pointers basics

**Core idea**: A pointer is a variable that stores a memory address. It "points" to another variable's location in memory.

**Why it matters in embedded**: Hardware registers, DMA buffers, and passing large structures all use pointers. They're essential for efficient embedded code.

::: info What is a Pointer?
A **pointer** is a variable that holds a memory address instead of a value. Think of it like a house address — the pointer doesn't contain the house itself, just where to find it.

- `int* p` means "p is a pointer to an int"
- `&x` gives the address of x
- `*p` accesses the value at the address stored in p
:::

**Pointer declaration and use**:

```c
int value = 42;        // A normal integer
int* ptr = &value;    // A pointer to that integer (stores its address)

*ptr = 100;           // Change value through pointer (value is now 100)
printf("%d\n", *ptr); // Print value via pointer (prints 100)

// The pointer itself also has an address
printf("Value address: %p\n", (void*)&value);
printf("Pointer address: %p\n", (void*)&ptr);
```

**Pointer types**:

| Type | What it points to | Example |
| ---- | ---------------- | ------- |
| `int*` | int | `int* p = &value;` |
| `uint8_t*` | uint8_t | `uint8_t* p = &byte_val;` |
| `float*` | float | `float* p = &float_val;` |
| `void*` | Unknown type | `void* p;` (generic pointer) |
| `int**` | Pointer to int | `int** pp = &ptr;` |

**Important operators**:

| Operator | Name | Purpose |
| -------- | ---- | ------- |
| `*` | Dereference | Access value at address |
| `&` | Address-of | Get memory address of variable |
| `->` | Arrow | Access member through pointer (ptr->member) |

**Code example — passing array to function**:

```c
#include <stdint.h>

// Pass array to function (decays to pointer)
void print_array(uint16_t* arr, uint8_t size) {
    for (uint8_t i = 0; i < size; i++) {
        printf("Element %u: %u\n", i, arr[i]);
    }
}

// Calculate average
uint16_t average_array(uint16_t* arr, uint8_t size) {
    uint32_t sum = 0;
    for (uint8_t i = 0; i < size; i++) {
        sum += arr[i];
    }
    return sum / size;
}

int main(void) {
    uint16_t values[] = {100, 200, 300, 400, 500};
    uint8_t count = 5;
    
    print_array(values, count);
    uint16_t avg = average_array(values, count);
    
    return 0;
}
```

**Code example — hardware register access**:

```c
#include <stdint.h>

// Hardware register addresses (example for STM32)
#define GPIOA_BASE  0x40020000UL
#define GPIOA_IDR   (*(volatile uint32_t*)(GPIOA_BASE + 0x08))  // Input data
#define GPIOA_ODR   (*(volatile uint32_t*)(GPIOA_BASE + 0x14))  // Output data

// Using pointers for register access
void set_pin_high(uint8_t pin) {
    volatile uint32_t* port = (volatile uint32_t*)GPIOA_BASE;
    port[5] |= (1 << pin);  // Set ODR bit
}

uint8_t read_pin(uint8_t pin) {
    return (GPIOA_IDR >> pin) & 1;
}
```

**Check your understanding**: What does `*ptr = 5;` do vs `ptr = 5;`? Why is the difference important?

---

### Week 3 — Pointer arithmetic and arrays

**Core idea**: Pointers support arithmetic operations. When you add 1 to a pointer, it moves by `sizeof(type)` bytes. This is how arrays and pointers are related.

**Why it matters in embedded**: Pointer arithmetic lets you traverse buffers efficiently. It's how C processes arrays under the hood.

**Pointer arithmetic operations**:

| Operation | What it does |
| --------- | ------------ |
| `ptr + 1` | Move to next element |
| `ptr - 1` | Move to previous element |
| `ptr++` | Increment pointer |
| `ptr--` | Decrement pointer |
| `ptr - other` | Number of elements between them |

```c
int arr[] = {10, 20, 30, 40, 50};
int* p = arr;  // Points to arr[0]

*p;       // 10  (arr[0])
*(p + 1); // 20  (arr[1])
*(p + 2); // 30  (arr[2])

p++;      // Now points to arr[1]
*p;       // 20

// Same as array indexing
p = arr;
p[3];     // Same as *(p + 3) = arr[3] = 40
```

::: info Why pointer arithmetic works
When you do `p + 1` on an `int*`, the compiler doesn't just add 1 byte — it adds `sizeof(int)` bytes. On a 32-bit system where int is 4 bytes, `p + 1` moves the address forward by 4 bytes. This is why pointers know what type they're pointing to.
:::

**Iterating arrays with pointers**:

```c
void process_data(uint16_t* data, uint8_t size) {
    // Method 1: Array indexing
    for (uint8_t i = 0; i < size; i++) {
        process(data[i]);
    }
    
    // Method 2: Pointer arithmetic
    for (uint8_t i = 0; i < size; i++) {
        process(*(data + i));
    }
    
    // Method 3: Pointer increment (most efficient)
    uint16_t* end = data + size;
    while (data < end) {
        process(*data);
        data++;
    }
}
```

**Code example — finding max value**:

```c
#include <stdint.h>

uint16_t find_max(uint16_t* arr, uint8_t size) {
    if (size == 0) return 0;
    
    uint16_t max = *arr;  // First element as initial max
    
    uint16_t* ptr = arr + 1;  // Start from second element
    while (ptr < arr + size) {
        if (*ptr > max) {
            max = *ptr;
        }
        ptr++;
    }
    
    return max;
}

int main(void) {
    uint16_t values[] = {34, 12, 89, 45, 67, 23};
    uint8_t count = 6;
    
    uint16_t max = find_max(values, count);
    // max = 89
    
    return 0;
}
```

**Code example — string as char array**:

```c
#include <stdint.h>
#include <stdio.h>

// Strings in C are just char arrays ending with '\0'
char message[] = "Hello";

char greeting[] = {'H', 'e', 'l', 'l', 'o', '\0'};  // Same as above

// String functions
void print_string(char* str) {
    while (*str != '\0') {
        putchar(*str);
        str++;
    }
}

int string_length(char* str) {
    int len = 0;
    while (*str != '\0') {
        len++;
        str++;
    }
    return len;
}

int main(void) {
    char text[] = "Embedded";
    
    printf("Length: %d\n", string_length(text));  // 8
    
    return 0;
}
```

**Check your understanding**: If `int* p` points to address `0x1000` on a system where `int` is 4 bytes, what address does `p + 3` point to? What about `((char*)p) + 3`?

---

### Week 4 — Dynamic memory allocation

**Core idea**: Dynamic allocation lets you request memory at runtime from the heap. Use `malloc()` to allocate, `free()` to release.

**Why it matters in embedded**: Dynamic memory is useful for variable-sized buffers, but many MCUs don't have a heap. Know when it's safe and when to avoid it.

::: info What is Dynamic Memory Allocation?
**Dynamic memory** is memory allocated at runtime (when the program is running), not compile time. The **heap** is where this memory comes from:

- `malloc(size)` — allocate `size` bytes, returns pointer or NULL
- `free(ptr)` — release previously allocated memory
- `calloc(n, size)` — allocate and zero-initialize
- `realloc(ptr, new_size)` — resize existing allocation

On desktop: heap is large. On embedded: often no heap or very limited.
:::

**Allocation functions**:

| Function | Purpose | Returns |
| -------- | ------- | -------- |
| `malloc(bytes)` | Allocate raw memory | `void*` or NULL |
| `calloc(n, size)` | Allocate zeroed memory | `void*` or NULL |
| `realloc(ptr, size)` | Resize allocation | `void*` or NULL |
| `free(ptr)` | Release memory | nothing |

```c
#include <stdlib.h>

// Allocate 10 integers (40 bytes on 32-bit)
int* arr = malloc(10 * sizeof(int));

if (arr == NULL) {
    // Allocation failed!
}

// Use the array
arr[0] = 100;
arr[9] = 200;

// When done, free it
free(arr);
arr = NULL;  // Good practice
```

**Dynamic allocation example — variable-sized buffer**:

```c
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>

// Create a buffer of requested size
uint16_t* create_buffer(uint8_t size) {
    uint16_t* buffer = malloc(size * sizeof(uint16_t));
    
    if (buffer == NULL) {
        printf("Failed to allocate memory!\n");
        return NULL;
    }
    
    // Initialize to zero
    for (uint8_t i = 0; i < size; i++) {
        buffer[i] = 0;
    }
    
    return buffer;
}

void process_sensor_data(uint8_t num_samples) {
    uint16_t* buffer = create_buffer(num_samples);
    
    if (buffer != NULL) {
        // Process samples
        for (uint8_t i = 0; i < num_samples; i++) {
            buffer[i] = read_adc();
        }
        
        // ... do something with buffer ...
        
        free(buffer);  // Don't forget!
    }
}
```

**Code example — safe memory handling**:

```c
#include <stdint.h>
#include <stdlib.h>

// Struct for sensor data
typedef struct {
    uint8_t id;
    uint16_t value;
    float temperature;
} SensorData;

SensorData* create_sensor(uint8_t id, uint16_t val, float temp) {
    SensorData* sensor = malloc(sizeof(SensorData));
    
    if (sensor != NULL) {
        sensor->id = id;
        sensor->value = val;
        sensor->temperature = temp;
    }
    
    return sensor;
}

void destroy_sensor(SensorData* sensor) {
    free(sensor);
}

int main(void) {
    SensorData* s1 = create_sensor(1, 2048, 25.5f);
    
    if (s1 != NULL) {
        printf("Sensor %u: %u, %.1fC\n", s1->id, s1->value, s1->temperature);
        destroy_sensor(s1);
    }
    
    return 0;
}
```

::: warning Heap on embedded MCUs
Many microcontrollers (AVR, PIC, STM32 with certain configurations) don't have a heap or have a very limited one:
- No `new`/`delete` or `malloc`/`free` — use static/stack allocation
- Some RTOSes provide their own allocator
- On ESP32 or Linux embedded, heap exists but be careful
- Always check if `malloc` returns NULL — don't assume it succeeds
:::

**Common memory errors**:

| Error | What happens | How to avoid |
| ------ | ------------- | ------------- |
| Null pointer dereference | Crash when using NULL | Always check return value |
| Memory leak | Memory never freed | Always `free()` what you `malloc()` |
| Double free | Crash | Set pointer to NULL after free |
| Buffer overflow | Write past array bounds | Check indices |
| Use after free | Use freed memory | Don't use after free |

**Check your understanding**: What happens if you call `free()` on a pointer that wasn't returned by `malloc()`? What's a memory leak?

---

## Common misconceptions

| Misconception | Reality |
| ------------- | ------- |
| "Array and pointer are the same" | Arrays decay to pointers in many contexts, but they're different — arrays have fixed size, pointers don't |
| "Pointer stores the value" | Pointer stores an address (memory location), not the value itself |
| "malloc always succeeds" | On embedded, it often returns NULL or isn't available |
| "I don't need to free on embedded" | If you use malloc, you must free — even on MCUs |
| "Array index starts at 1" | Array indices start at 0 in C |

---

## Suggested resources

### For beginners

- **[Pointers and Arrays in C - FreeCodeCamp](https://www.youtube.com/watch?v=1W5KXJWplbc)**: Comprehensive video.
- **[C Pointer Tutorial - W3Schools](https://www.w3schools.com/c/c_pointers.php)**: Quick reference.

### Textbooks

- **C Programming Language** (Kernighan & Ritchie): The definitive book.
- **C Primer Plus** (Prata): Good for beginners.

### Embedded-specific

- **[Embedded Systems - Pointers](https://www.embedded.com/electronics-blogs/beginners-corner/4023801/Pointers-and-embedded-systems)**: Why pointers matter in embedded.

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="arrays-pointers-checklist" :items="[
  { id: '1', label: 'Declare an array of 10 uint16_t elements and initialize them to 0' },
  { id: '2', label: 'Explain what a pointer is in simple terms' },
  { id: '3', label: 'Write a function that takes an array and returns its average' },
  { id: '4', label: 'Explain the relationship between array and pointer' },
  { id: '5', label: 'Use malloc to allocate a buffer of 100 bytes, then free it' },
  { id: '6', label: 'What is the difference between *p and p?' },
  { id: '7', label: 'Why should you set a pointer to NULL after freeing it?' }
]" />