# Control Flow and Functions

**Who this is for**: C beginners who understand basic syntax and want to write organized, reusable code.  
**Time to complete**: ~3 weeks, 1–2 hours per day.  
**Why it matters**: Control flow determines what your program does. Functions organize code into reusable pieces. Together, they let you build any program imaginable.

**Videos**:

- [C Control Flow - FreeCodeCamp](https://www.youtube.com/watch?v=1F1DOtD3Mak)
- [C Functions Tutorial - Derek Banas](https://www.youtube.com/watch?v=CVT2h4_mLkg)

---

## How this connects to embedded work

Every embedded program uses control flow. A temperature monitor checks if temperature exceeds a threshold, then turns on a fan. A button handler checks if a button is pressed, then toggles an LED. Functions wrap hardware operations:

```c
// Control flow in embedded
void monitor_temperature(uint16_t temp) {
    if (temp > THRESHOLD_HIGH) {
        fan_on();
    } else if (temp < THRESHOLD_LOW) {
        fan_off();
    }
}

// Functions organize hardware code
void init_uart(void);
void send_byte(uint8_t byte);
uint8_t receive_byte(void);
```

---

## Module structure

### Week 1 — Conditional statements

**Core idea**: Conditionals let your program make decisions. Based on whether a condition is true or false, different code runs.

**Why it matters in embedded**: Every sensor decision, every threshold check, every state transition uses conditionals. They're the foundation of all control logic.

**Key concepts to learn**:

- if, else if, else
- switch statements
- Comparison operators
- Logical operators
- Boolean expressions

**if-else syntax**:

```c
if (condition) {
    // Runs if condition is true (non-zero)
} else if (another_condition) {
    // Runs if first condition is false but this is true
} else {
    // Runs if all conditions are false
}

// Single statement - no braces needed
if (temp > 30)
    fan_on();  // Only runs if true

// Common embedded example
if (button_pressed) {
    led_toggle();
    button_pressed = 0;
}
```

**Comparison operators**:

| Operator | Meaning | Example |
| -------- | ------- | ------- |
| `==` | Equal to | `if (x == 5)` |
| `!=` | Not equal | `if (x != 0)` |
| `>` | Greater than | `if (temp > 100)` |
| `<` | Less than | `if (value < threshold)` |
| `>=` | Greater or equal | `if (count >= 10)` |
| `<=` | Less or equal | `if (index <= max)` |

**Logical operators**:

| Operator | Meaning | Example |
| -------- | ------- | ------- |
| `&&` | Logical AND | `if (temp > 0 && temp < 100)` |
| `\|\|` | Logical OR | `if (error \|\| timeout)` |
| `!` | Logical NOT | `if (!initialized)` |

::: info What is a Boolean?
A **boolean** (or bool) is a value that is either true or false. In C:
- Non-zero = true (1)
- Zero = false (0)
- Modern C has `_Bool` and `<stdbool.h>` gives you `bool`, `true`, `false`

```c
#include <stdbool.h>

bool is_safe = (temp < THRESHOLD);  // true or false
if (is_safe) { ... }
```
:::

**Code example — temperature monitor**:

```c
#include <stdint.h>
#include <stdbool.h>

#define TEMP_HIGH 80
#define TEMP_LOW  60

void control_fan(uint16_t temperature) {
    if (temperature >= TEMP_HIGH) {
        fan_set_speed(100);  // Full speed
    } else if (temperature >= TEMP_LOW) {
        fan_set_speed(50);   // Half speed
    } else {
        fan_set_speed(0);    // Off
    }
}

// Using boolean
bool is_critical(uint16_t temp) {
    return (temp > 100 || temp < -20);
}
```

**switch statement**:

```c
switch (variable) {
    case value1:
        // Runs if variable == value1
        break;
    case value2:
        // Runs if variable == value2
        break;
    default:
        // Runs if no case matches
        break;
}

// Without break - cases "fall through"
switch (mode) {
    case 0:
    case 1:
        // Runs for mode 0 or 1
        init();
        break;
    case 2:
        reset();
        break;
    default:
        error();
        break;
}
```

**Code example — UART command parser**:

```c
#include <stdint.h>
#include <stdbool.h>

typedef enum {
    CMD_NONE,
    CMD_READ,
    CMD_WRITE,
    CMD_RESET,
    CMD_STATUS
} Command;

Command parse_command(uint8_t byte) {
    switch (byte) {
        case 'R':
        case 'r':
            return CMD_READ;
        case 'W':
        case 'w':
            return CMD_WRITE;
        case 'X':
            return CMD_RESET;
        case 'S':
            return CMD_STATUS;
        default:
            return CMD_NONE;
    }
}

void handle_command(Command cmd) {
    switch (cmd) {
        case CMD_READ:
            read_sensor();
            break;
        case CMD_WRITE:
            write_value();
            break;
        case CMD_RESET:
            system_reset();
            break;
        case CMD_STATUS:
            print_status();
            break;
        default:
            break;
    }
}
```

**Check your understanding**: What's the difference between `if (x = 5)` and `if (x == 5)`? Why does one cause bugs?

---

### Week 2 — Loops

**Core idea**: Loops repeat code multiple times. They run a block of code repeatedly until a condition is met.

**Why it matters in embedded**: Loops process sensor data, update displays, check buttons, and implement state machines. Almost every embedded program has loops.

**Key concepts to learn**:

- for loops
- while loops
- do-while loops
- Loop control: break, continue
- Infinite loops

**for loop**:

```c
// for (initialization; condition; increment)
for (int i = 0; i < 10; i++) {
    // Runs 10 times: i = 0, 1, 2, ..., 9
}

// Common embedded: iterate over array
uint16_t data[5] = {10, 20, 30, 40, 50};
for (int i = 0; i < 5; i++) {
    process(data[i]);
}

// Reverse loop
for (int i = 9; i >= 0; i--) {
    // Count down
}
```

**while loop**:

```c
// Pre-test: condition checked before each iteration
while (condition) {
    // Keep running while condition is true
}

// Example: wait for button press
while (!button_pressed) {
    // Do nothing, just wait
    // (often add small delay to avoid busy-waiting)
}

// Loop that might not run at all
int count = 0;
while (count < 5) {
    count++;
}
// If count started at 10, loop body never executes
```

**do-while loop**:

```c
// Post-test: runs at least once, then checks condition
do {
    // Runs at least once
} while (condition);

// Example: read ADC until valid reading
uint16_t read_adc_filtered(void) {
    uint16_t value;
    do {
        value = read_adc_raw();
    } while (value == 0 || value == 4095);  // Reject edge values
    return value;
}
```

::: info What is an Infinite Loop?
An **infinite loop** runs forever (or until the program is stopped). In embedded systems, the main loop often runs forever:

```c
int main(void) {
    init();  // One-time setup
    
    while (1) {  // Infinite loop - program never exits
        // Main logic runs continuously
        process_data();
    }
    // Never reached
}
```

The `while (1)` or `for (;;)` is the standard way to create the main loop in embedded firmware.
:::

**Loop control**:

| Keyword | What it does |
| ------- | ------------- |
| `break` | Exit the loop immediately |
| `continue` | Skip to next iteration |

```c
// break - exit loop early
for (int i = 0; i < 100; i++) {
    if (data[i] == -1) {
        break;  // Exit when error found
    }
}

// continue - skip this iteration
for (int i = 0; i < 10; i++) {
    if (data[i] == 0) {
        continue;  // Skip processing zeros
    }
    process(data[i]);  // Only processes non-zero values
}
```

**Code example — moving average filter**:

```c
#include <stdint.h>

#define BUFFER_SIZE 8

uint16_t moving_average(uint16_t new_value) {
    static uint16_t buffer[BUFFER_SIZE];
    static uint8_t index = 0;
    
    // Add new value to buffer
    buffer[index] = new_value;
    index = (index + 1) % BUFFER_SIZE;
    
    // Calculate average
    uint32_t sum = 0;
    for (uint8_t i = 0; i < BUFFER_SIZE; i++) {
        sum += buffer[i];
    }
    
    return sum / BUFFER_SIZE;
}
```

**Code example — debounce button**:

```c
#include <stdint.h>

#define DEBOUNCE_MS 50

bool button_pressed(uint8_t pin) {
    static uint32_t last_press_time = 0;
    uint32_t now = get_tick_ms();
    
    if (read_gpio(pin) && (now - last_press_time > DEBOUNCE_MS)) {
        last_press_time = now;
        return true;
    }
    return false;
}

void main_loop(void) {
    while (1) {
        if (button_pressed(BUTTON_PIN)) {
            led_toggle();
        }
        // Other tasks...
    }
}
```

**Check your understanding**: What's the difference between while and do-while? When would you use each?

---

### Week 3 — Functions

**Core idea**: A function is a reusable block of code. It takes inputs (parameters), does something, and optionally returns a value.

**Why it matters in embedded**: Functions organize code, make it reusable, and hide complexity. Hardware initialization, sensor reading, data processing — all go in functions.

**Key concepts to learn**:

- Function declaration and definition
- Parameters and arguments
- Return values
- Scope and variable lifetime
- Function prototypes

**Function structure**:

```c
// Function declaration (prototype) - tells compiler what to expect
return_type function_name(parameter_list);

// Function definition - the actual implementation
return_type function_name(parameter_list) {
    // Function body
    // ...
    return value;  // Return something of return_type
}

// Example
uint16_t add_numbers(uint16_t a, uint16_t b) {
    uint16_t result = a + b;
    return result;
}
```

**Function types**:

| Return Type | Description | Example |
| ----------- | ----------- | ------- |
| `void` | No return value | `void init(void)` |
| `int` | Returns integer | `int read_adc(void)` |
| `float` | Returns float | `float calculate_temp(uint16_t raw)` |
| `uint8_t*` | Returns pointer | `uint8_t* get_buffer(void)` |

**Parameters and arguments**:

```c
// Function with parameters
void set_led(uint8_t led_number, bool state) {
    if (state) {
        led_on(led_number);
    } else {
        led_off(led_number);
    }
}

// Call with arguments
set_led(0, true);   // Turn LED 0 on
set_led(1, false);  // Turn LED 1 off

// Passing arrays to functions
uint16_t sum_array(uint16_t arr[], uint8_t size) {
    uint16_t total = 0;
    for (uint8_t i = 0; i < size; i++) {
        total += arr[i];
    }
    return total;
}

// Call with array
uint16_t data[] = {10, 20, 30};
uint16_t result = sum_array(data, 3);
```

**Return values**:

```c
// Return a value
int square(int x) {
    return x * x;
}

// Return multiple values via pointers
void get_min_max(uint16_t arr[], uint8_t size, uint16_t* min_val, uint16_t* max_val) {
    *min_val = arr[0];
    *max_val = arr[0];
    for (uint8_t i = 1; i < size; i++) {
        if (arr[i] < *min_val) *min_val = arr[i];
        if (arr[i] > *max_val) *max_val = arr[i];
    }
}

// Call it
uint16_t minimum, maximum;
get_min_max(sensor_data, 10, &minimum, &maximum);
```

::: info What is Scope?
**Scope** is where a variable can be accessed. In C:
- **Block scope**: Variables inside `{}` exist only within those braces
- **Function scope**: Parameters and local variables exist only within the function
- **File scope** (global): Variables outside functions, accessible everywhere

```c
int global_var;  // File scope - accessible everywhere

void function(void) {
    int local_var;  // Function scope - only in this function
    
    if (1) {
        int block_var;  // Block scope - only in this if block
    }
    // block_var not accessible here
}
```
:::

**Code example — modular embedded code**:

```c
#include <stdint.h>
#include <stdbool.h>

// ===== Hardware functions =====

void gpio_init(void) {
    // Initialize GPIO pins
}

void uart_init(uint32_t baud) {
    // Initialize UART at specified baud
}

void adc_init(void) {
    // Initialize ADC
}

// ===== Sensor functions =====

uint16_t read_temperature_raw(void) {
    return adc_read(0);  // Read channel 0
}

float convert_to_celsius(uint16_t raw) {
    float voltage = (raw / 4095.0f) * 3.3f;
    return (voltage - 0.5f) * 100.0f;
}

// ===== Control functions =====

bool check_thresholds(float temp) {
    if (temp > 80.0f) {
        return true;  // Over temperature!
    }
    return false;
}

// ===== Main application =====

int main(void) {
    // Initialize all hardware
    gpio_init();
    uart_init(115200);
    adc_init();
    
    // Main loop
    while (1) {
        uint16_t raw = read_temperature_raw();
        float temp = convert_to_celsius(raw);
        
        if (check_thresholds(temp)) {
            alarm_on();
        }
        
        // Small delay before next reading
        delay_ms(100);
    }
    
    return 0;
}
```

**Static variables**:

```c
// Static variable - persists between function calls
void counter(void) {
    static int count = 0;  // Initialized only once!
    count++;
    printf("Count: %d\n", count);
}

// Each call increments count: 1, 2, 3, 4...

// Common embedded use: state machine
typedef enum {
    STATE_IDLE,
    STATE_READY,
    STATE_RUNNING,
    STATE_DONE
} State;

State get_next_state(State current) {
    static State previous = STATE_IDLE;
    
    // Use previous state to decide next
    // ...
    
    previous = current;
    return new_state;
}
```

**Function prototypes**:

```c
// Put prototypes at top of file (or in header)
void init_system(void);
uint16_t read_sensor(uint8_t channel);
void process_data(uint16_t* data, uint8_t size);

// Main function
int main(void) {
    init_system();
    // ...
}
```

**Check your understanding**: What's the difference between passing a value to a function and passing a pointer? Why would you use each?

---

### Week 4 — Advanced control flow

**Core idea**: Beyond basics — state machines, function pointers, and embedded-specific patterns.

**Why it matters in embedded**: Complex embedded systems use state machines for mode management. Function pointers enable callbacks and table-driven code.

**State machines**:

```c
typedef enum {
    STATE_INIT,
    STATE_IDLE,
    STATE_MEASURING,
    STATE_SENDING,
    STATE_ERROR
} SystemState;

void state_machine(void) {
    static SystemState current_state = STATE_INIT;
    static uint32_t tick_count = 0;
    
    switch (current_state) {
        case STATE_INIT:
            init_hardware();
            current_state = STATE_IDLE;
            break;
            
        case STATE_IDLE:
            if (start_button_pressed()) {
                current_state = STATE_MEASURING;
            }
            break;
            
        case STATE_MEASURING:
            if (measurement_complete()) {
                current_state = STATE_SENDING;
            }
            break;
            
        case STATE_SENDING:
            if (send_complete()) {
                current_state = STATE_IDLE;
            }
            break;
            
        case STATE_ERROR:
            if (reset_button_pressed()) {
                current_state = STATE_INIT;
            }
            break;
    }
}
```

::: info What is a Function Pointer?
A **function pointer** is a variable that holds the address of a function. It lets you:
- Pass functions as arguments (callbacks)
- Create table-driven dispatch
- Implement state machines

```c
// Function pointer type
typedef void (*Handler)(void);

// Functions with matching signature
void on_button(void) { led_on(); }
void off_button(void) { led_off(); }

// Array of function pointers
Handler handlers[] = {on_button, off_button};

// Call through pointer
handlers[0]();  // Calls on_button
```
:::

**Code example — button handler with function pointers**:

```c
#include <stdint.h>
#include <stdbool.h>

// Function pointer type for button callbacks
typedef void (*ButtonCallback)(void);

// Button handler structure
typedef struct {
    uint8_t pin;
    bool last_state;
    ButtonCallback on_press;
    ButtonCallback on_release;
} ButtonHandler;

ButtonHandler buttons[4];

void button_init(ButtonHandler* btn, uint8_t pin, ButtonCallback press, ButtonCallback release) {
    btn->pin = pin;
    btn->last_state = false;
    btn->on_press = press;
    btn->on_release = release;
}

void button_update(ButtonHandler* btn) {
    bool current = read_gpio(btn->pin);
    
    if (current && !btn->last_state) {
        // Just pressed
        if (btn->on_press) btn->on_press();
    } else if (!current && btn->last_state) {
        // Just released
        if (btn->on_release) btn->on_release();
    }
    
    btn->last_state = current;
}

// Callback functions
void led_toggle_on_press(void) {
    led_toggle(0);
}

void fan_toggle_on_press(void) {
    fan_toggle();
}

int main(void) {
    // Set up buttons with callbacks
    button_init(&buttons[0], 0, led_toggle_on_press, NULL);
    button_init(&buttons[1], 1, fan_toggle_on_press, NULL);
    
    while (1) {
        for (int i = 0; i < 4; i++) {
            button_update(&buttons[i]);
        }
    }
}
```

**Code example — command table**:

```c
#include <stdint.h>
#include <stdio.h>

typedef void (*CommandFunc)(uint8_t);

void cmd_read(uint8_t param) { printf("Read: %u\n", param); }
void cmd_write(uint8_t param) { printf("Write: %u\n", param); }
void cmd_status(uint8_t param) { printf("Status\n"); }
void cmd_reset(uint8_t param) { printf("Reset\n"); }

typedef struct {
    char code;
    CommandFunc func;
} CommandEntry;

CommandEntry commands[] = {
    {'R', cmd_read},
    {'W', cmd_write},
    {'S', cmd_status},
    {'X', cmd_reset},
};

void execute_command(char code, uint8_t param) {
    for (int i = 0; i < 4; i++) {
        if (commands[i].code == code) {
            commands[i].func(param);
            return;
        }
    }
    printf("Unknown command\n");
}

int main(void) {
    execute_command('R', 10);  // Calls cmd_read(10)
    execute_command('W', 20);  // Calls cmd_write(20)
    
    return 0;
}
```

**Check your understanding**: When would you use a state machine vs simple if/else? What are the advantages of function pointers?

---

## Common misconceptions

| Misconception | Reality |
| ------------- | ------- |
| "I can use = in place of ==" | `=` is assignment, `==` is comparison. Using `=` where you mean `==` is a common bug. |
| "for loops are only for counting" | for loops can iterate over any condition, not just counting |
| "Global variables are always bad" | In embedded, globals for hardware registers are often necessary |
| "return exits the whole function" | return exits only the current function call |
| "All variables go on the stack" | Some go in registers, some are optimized away entirely |

---

## Suggested resources

### For beginners

- **[C Control Flow - FreeCodeCamp](https://www.youtube.com/watch?v=1F1DOtD1Mak)**: Full video course.
- **[W3Schools C Control Flow](https://www.w3schools.com/c/c_if_else.php)**: Quick reference.

### Textbooks

- **C Programming Language** (Kernighan & Ritchie): Chapter 3 covers control flow.
- **C Primer Plus** (Prata): More detailed explanations.

### Embedded-specific

- **[State Machines in Embedded C](https://www.embedded.com/electronics-blogs/other/4025099/Implementing-a-state-machine-in-C)**: Practical state machine patterns.

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="control-flow-checklist" :items="[
  { id: '1', label: 'Write an if-else chain to check temperature ranges' },
  { id: '2', label: 'Use switch to handle multiple command codes' },
  { id: '3', label: 'Write a for loop to sum all elements in an array' },
  { id: '4', label: 'Explain the difference between while and do-while' },
  { id: '5', label: 'Create a function that takes two parameters and returns their sum' },
  { id: '6', label: 'Use pointers to return multiple values from a function' },
  { id: '7', label: 'Explain what a static variable does' },
  { id: '8', label: 'Implement a simple state machine' }
]" />