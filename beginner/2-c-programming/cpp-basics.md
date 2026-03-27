# C++ Basics: Object-Oriented Programming

**Who this is for**: Developers moving from C to C++ for embedded systems, or learning OOP concepts.  
**Time to complete**: ~3 weeks, 1–2 hours per day.  
**Why it matters**: Many embedded frameworks (Arduino, ARM CMSIS, embedded Linux drivers) use C++ classes for hardware abstraction and organized code.

**Videos**:

- [C++ OOP Tutorial - Derek Banas](https://www.youtube.com/watch?v=1n2uqnC1p0M)
- [C++ Classes and Objects - FreeCodeCamp](https://www.youtube.com/watch?v=vLnPwxZdJ4Y)

---

## How this connects to embedded work

C++ adds object-oriented features on top of C. Many embedded frameworks use classes to wrap hardware:

```cpp
class LED {
private:
    uint8_t pin;
    bool state;
    
public:
    LED(uint8_t p) : pin(p), state(false) {}
    
    void on() { state = true; }
    void off() { state = false; }
    void toggle() { state = !state; }
};

// Usage
LED led1(13);
led1.on();
```

This keeps hardware code organized and reusable.

---

## Module structure

### Week 1 — Classes, objects, and access specifiers

**Core idea**: A class is a blueprint that bundles data (members) and functions (methods) together. An object is an instance of a class.

**Why it matters in embedded**: Classes let you encapsulate hardware peripherals. A `UART` class can hide all the register details — users just call `.send()`.

**Key concepts to learn**:

- Class declaration and definition
- Objects and instantiation
- Access specifiers: public, private, protected
- Member variables and member functions
- Constructors and destructors

**Access specifiers table**:

| Specifier | Visibility | Use Case |
| --------- | ---------- | -------- |
| `public` | Accessible from anywhere | Interface methods |
| `private` | Accessible only within the class | Internal data, helpers |
| `protected` | Accessible within class and derived classes | Inherited members |

**Code example — LED class**:

```cpp
#include <cstdint>

class LED {
private:
    uint8_t pin;      // Private: external code can't access directly
    bool state;
    
public:
    // Constructor - called when object is created
    LED(uint8_t p) : pin(p), state(false) {
        // Initialize hardware (simulated)
    }
    
    // Destructor - called when object is destroyed
    ~LED() {
        // Cleanup hardware
    }
    
    // Member functions
    void on() {
        state = true;
    }
    
    void off() {
        state = false;
    }
    
    void toggle() {
        state = !state;
    }
    
    bool isOn() const {
        return state;
    }
};

int main() {
    LED led1(13);         // Create object
    LED led2(14);
    
    led1.on();            // Public method
    led2.off();
    
    // led1.pin = 5;       // ERROR: pin is private
    
    return 0;
}
```

**Member initializer list** (preferred for embedded):

```cpp
class Sensor {
private:
    uint8_t channel;
    float calibration;
    
public:
    // Using initializer list (more efficient)
    Sensor(uint8_t ch, float cal) : channel(ch), calibration(cal) {
        // Constructor body can be empty
    }
    
    // NOT recommended (copy then assign):
    // Sensor(uint8_t ch, float cal) {
    //     channel = ch;
    //     calibration = cal;
    // }
};
```

**Check your understanding**: Why is `pin` marked private in the LED class? What would happen if it were public?

---

### Week 2 — Constructors, destructors, and memory management

**Core idea**: Constructors initialize objects. Destructors clean up. In embedded C++, you must be careful with dynamic memory — heap may be limited or unavailable.

**Why it matters in embedded**: Many MCUs have no dynamic memory (no heap). Understanding when constructors/destructors run helps avoid memory leaks.

::: info What is a Heap?
The **heap** is a region of computer memory used for dynamic allocation. When you use `new` in C++, memory is allocated from the heap. Unlike the **stack** (where local variables live), the heap:
- Is larger but slower
- Requires manual management (`new`/`delete`)
- Can become fragmented
- May not exist at all on small MCUs

In embedded systems, avoid the heap when possible — use the stack or static allocation instead.
:::

**Constructor types**:

| Type | Description | Example |
| ---- | ----------- | ------- |
| Default | No arguments | `LED()` |
| Parameterized | Takes arguments | `LED(uint8_t pin)` |
| Copy | Takes another object | `LED(const LED& other)` |
| Move | Takes rvalue reference | `LED(LED&& other)` |

**Code example — multiple constructors**:

```cpp
class UART {
private:
    uint8_t tx_pin;
    uint8_t rx_pin;
    uint32_t baud_rate;
    
public:
    // Default constructor
    UART() : tx_pin(0), rx_pin(1), baud_rate(9600) {}
    
    // Parameterized constructor
    UART(uint8_t tx, uint8_t rx, uint32_t baud) 
        : tx_pin(tx), rx_pin(rx), baud_rate(baud) {}
    
    // Destructor
    ~UART() {
        // Disable UART, release pins
    }
    
    void send(uint8_t data);
    uint8_t receive();
};

int main() {
    UART uart1;                      // Default constructor
    UART uart2(4, 5, 115200);        // Parameterized
    
    return 0;
}
```

**Destructor uses**:

::: info What is RAII?
**RAII** (Resource Acquisition Is Initialization) is a C++ idiom where resources are tied to object lifetime:
- Acquire resources (like file handles, mutexes) in constructor
- Release them in destructor
- Automatic cleanup when object goes out of scope

Example: A `Mutex` class locks in constructor, unlocks in destructor. When the object is destroyed, the mutex is automatically unlocked — even if an exception occurs.
:::

```cpp
class PWM {
private:
    uint8_t pin;
    bool initialized;
    
public:
    PWM(uint8_t p) : pin(p), initialized(false) {}
    
    ~PWM() {
        if (initialized) {
            // Disable PWM on pin
        }
    }
    
    void init() { initialized = true; }
};
```

**On embedded memory**:

::: info What is a Stack?
The **stack** is a region of memory used for storing local variables and function call data. It's:
- Fast (just moving a pointer)
- Automatically managed (variables are cleaned up when function ends)
- Limited in size (typically 1-8KB on MCUs)
- The opposite of the heap — use stack for small, temporary data

Prefer stack allocation for local variables instead of `new`.
:::

::: warning Avoid `new` and `delete` on MCUs
Most embedded MCUs (Arduino, STM32, ESP32) have limited heap. Prefer:
- Static allocation: `MyClass obj;`
- Stack allocation: `MyClass obj(123);`
- Avoid: `MyClass* obj = new MyClass();`

If you must use dynamic allocation, check your MCU has enough RAM.
:::

**Code example — safe embedded class**:

```cpp
// No dynamic allocation - safe for embedded
class TemperatureSensor {
private:
    uint8_t adc_channel;
    float offset;
    bool active;
    
public:
    TemperatureSensor(uint8_t ch, float off) 
        : adc_channel(ch), offset(off), active(false) {}
    
    void start() { active = true; }
    
    float read() const {
        // In real code, read ADC register
        float raw = 0.0f;  // Simulated
        return raw + offset;
    }
    
    bool isActive() const { return active; }
};

// Stack allocation - preferred on MCU
int main() {
    TemperatureSensor temp0(0, -0.5f);
    TemperatureSensor temp1(1, 0.0f);
    
    temp0.start();
    temp1.start();
    
    float t = temp0.read();
    
    return 0;
}
```

**Check your understanding**: When is the destructor called? What happens if you allocate an object with `new` on a microcontroller with no heap?

---

### Week 3 — Inheritance and polymorphism

**Core idea**: Inheritance lets classes build on other classes. Polymorphism lets objects be treated as their base type while behaving differently based on their actual type.

::: info What is Inheritance?
**Inheritance** is when a class (called derived or child class) acquires the properties and behaviors of another class (called base or parent class). It models an "is-a" relationship:
- A `Dog` **is a** `Animal`
- A `LED` **is a** `Device`
- A `TemperatureSensor` **is a** `Sensor`

The derived class automatically gets all public/protected members of the base class, and can add new ones or override existing ones.
:::

::: info What is Polymorphism?
**Polymorphism** (literally "many forms") means the same code behaves differently based on the actual object type. In C++:
- A `Sensor*` pointer can point to a `TemperatureSensor`, `PressureSensor`, or any other sensor
- Calling `sensor->read()` runs the correct version automatically
- The code doesn't need to know the exact type — polymorphism handles it at runtime
:::

**Why it matters in embedded**: Many frameworks use polymorphism for sensor drivers. A `Sensor` base class can have `TemperatureSensor`, `PressureSensor`, `HumiditySensor` — all share the same interface.

**Inheritance**:

```cpp
// Base class (parent)
class Device {
protected:
    bool initialized;
    
public:
    Device() : initialized(false) {}
    
    virtual void init() {
        initialized = true;
    }
    
    virtual bool isReady() const {
        return initialized;
    }
    
    virtual ~Device() {}  // Virtual destructor important!
};

// Derived class (child)
class LED : public Device {
private:
    uint8_t pin;
    
public:
    LED(uint8_t p) : pin(p) {}
    
    void init() override {
        // Initialize LED pin
        initialized = true;
    }
    
    void on() {}
    void off() {}
};
```

**Inheritance access specifiers**:

| Specifier in inheritance | Base public | Base protected | Base private |
| ------------------------ | ----------- | ------------- | ------------ |
| `public` | public | protected | private |
| `protected` | protected | protected | private |
| `private` | private | private | private |

**Polymorphism with virtual functions**:

::: info What are Virtual Functions?
A **virtual function** is a member function that can be overridden in derived classes. The key points:
- Declared with `virtual` keyword in base class
- Can be overridden in derived classes with `override`
- When called through a base pointer/reference, the actual object's version runs
- Enables runtime polymorphism — deciding which function to call at runtime, not compile time

Without `virtual`, the compiler decides which version to call based on the pointer type. With `virtual`, the runtime decides based on the actual object type.
:::

```cpp
#include <cstdint>

class Sensor {
public:
    virtual ~Sensor() = default;
    
    virtual float read() = 0;  // Pure virtual - must override
    
    virtual void init() {
        // Default implementation
    }
};

class TemperatureSensor : public Sensor {
private:
    uint8_t channel;
    
public:
    TemperatureSensor(uint8_t ch) : channel(ch) {}
    
    float read() override {
        // Read temperature
        return 25.5f;
    }
};

class PressureSensor : public Sensor {
public:
    float read() override {
        // Read pressure
        return 101.3f;
    }
};

int main() {
    // Polymorphism - base pointer to derived object
    Sensor* sensors[] = {
        new TemperatureSensor(0),
        new PressureSensor()
    };
    
    for (int i = 0; i < 2; i++) {
        float value = sensors[i]->read();  // Calls correct version
    }
    
    return 0;
}
```

**Virtual function table (vtable)**:

::: info What is a vtable?
A **vtable** (virtual function table) is a lookup table that C++ uses to implement dynamic dispatch for virtual functions. Each class with virtual functions has its own vtable:
- Usually 4 or 8 bytes per object (added as hidden pointer)
- Allows the correct function to be called at runtime
- The runtime cost is a pointer indirection — slightly slower than direct calls
- Trade-off: flexibility vs. performance

On memory-constrained MCUs, consider if you really need virtual functions.
:::

::: warning Memory cost on embedded
Each class with virtual functions has a vtable pointer (usually 4 or 8 bytes). On memory-constrained MCUs, this adds up. Consider:
- Only use virtual when needed (e.g., sensor drivers)
- Avoid deep inheritance hierarchies
- Sometimes a function pointer is lighter than vtable
:::

**Abstract classes**:

```cpp
// Abstract class - cannot be instantiated
class Printable {
public:
    virtual void print() const = 0;  // Pure virtual
    virtual ~Printable() = default;
};

// Concrete class
class Report : public Printable {
public:
    void print() const override {
        // Print report
    }
};
```

**Code example — sensor driver hierarchy**:

```cpp
class AnalogSensor {
protected:
    uint8_t channel;
    float scale;
    float offset;
    
public:
    AnalogSensor(uint8_t ch, float s, float o) 
        : channel(ch), scale(s), offset(o) {}
    
    virtual float readRaw() = 0;
    
    float read() {
        return readRaw() * scale + offset;
    }
};

class TMP36 : public AnalogSensor {
public:
    TMP36(uint8_t ch) : AnalogSensor(ch, 0.1f, -50.0f) {}
    
    float readRaw() override {
        // Read ADC, convert to voltage
        return 750.0f;  // mV
    }
};

class Photoresistor : public AnalogSensor {
public:
    Photoresistor(uint8_t ch) : AnalogSensor(ch, 1.0f, 0.0f) {}
    
    float readRaw() override {
        // Read ADC
        return 512.0f;
    }
};
```

**Check your understanding**: Why is the destructor virtual in the base class? What happens if you delete a derived object through a base pointer without a virtual destructor?

---

### Week 4 — Operator overloading

**Core idea**: Operator overloading lets you define custom behavior for operators (+, -, ==, <<, etc.) when used with your class types. It makes code more readable and intuitive.

**Why it matters in embedded**: Operator overloading is useful for fixed-point math, matrix operations, hardware registers, and unit types (like `Voltage`, `Current`).

**Operators that can be overloaded**:

| Category | Operators |
| -------- | ---------- |
| Arithmetic | `+`, `-`, `*`, `/`, `%` |
| Comparison | `==`, `!=`, `<`, `>`, `<=`, `>=` |
| Bitwise | `&`, `|`, `^`, `<<`, `>>` |
| Assignment | `=`, `+=`, `-=`, `*=`, `/=` |
| Increment/Decrement | `++`, `--` |
| Stream | `<<`, `>>` |
| Subscript | `[]` |
| Function call | `()` |

**Operators that cannot be overloaded**: `::`, `?:`, `.`, `.*`, `sizeof`

**Code example — Fixed-point math for embedded**:

```cpp
#include <cstdint>

// Fixed-point Q8.8 format (8 bits integer, 8 bits fractional)
class FixedPoint {
private:
    int16_t raw;  // 16-bit storage
    
public:
    FixedPoint() : raw(0) {}
    
    // From integer
    explicit FixedPoint(int i) : raw(i << 8) {}
    
    // From float
    explicit FixedPoint(float f) : raw(static_cast<int16_t>(f * 256.0f)) {}
    
    // Convert to float
    float toFloat() const {
        return raw / 256.0f;
    }
    
    // Addition operator
    FixedPoint operator+(const FixedPoint& other) const {
        FixedPoint result;
        result.raw = raw + other.raw;
        return result;
    }
    
    // Subtraction operator
    FixedPoint operator-(const FixedPoint& other) const {
        FixedPoint result;
        result.raw = raw - other.raw;
        return result;
    }
    
    // Multiplication operator
    FixedPoint operator*(const FixedPoint& other) const {
        FixedPoint result;
        // 16-bit * 16-bit = 32-bit result, then shift
        result.raw = static_cast<int16_t>((static_cast<int32_t>(raw) * other.raw) >> 8);
        return result;
    }
    
    // Comparison operators
    bool operator==(const FixedPoint& other) const {
        return raw == other.raw;
    }
    
    bool operator<(const FixedPoint& other) const {
        return raw < other.raw;
    }
};

int main() {
    FixedPoint a(2.5f);   // 2.5 as fixed-point
    FixedPoint b(1.5f);   // 1.5 as fixed-point
    
    FixedPoint c = a + b;  // Should be 4.0
    FixedPoint d = a * b;  // Should be 3.75
    
    if (c == FixedPoint(4.0f)) {
        // Comparison works
    }
    
    return 0;
}
```

**Code example — Stream operator for printing**:

```cpp
#include <cstdint>
#include <iostream>  // For std::cout, or use custom UART

class SensorReading {
private:
    uint16_t raw_value;
    float scaled_value;
    
public:
    SensorReading(uint16_t raw, float scaled) 
        : raw_value(raw), scaled_value(scaled) {}
    
    // Stream insertion operator (for printing)
    friend std::ostream& operator<<(std::ostream& os, const SensorReading& s) {
        os << "Sensor[raw=" << s.raw_value << ", scaled=" << s.scaled_value << "]";
        return os;
    }
};

// Usage
int main() {
    SensorReading temp(2048, 1.65f);
    std::cout << temp << std::endl;
    
    return 0;
}
```

**Code example — LED state with operator**:

```cpp
#include <cstdint>

class LEDState {
private:
    uint8_t pins;  // Bitmask of which LEDs are on
    
public:
    LEDState() : pins(0) {}
    
    // Turn on an LED by pin number
    void on(uint8_t pin) {
        pins |= (1 << pin);
    }
    
    // Turn off an LED by pin number
    void off(uint8_t pin) {
        pins &= ~(1 << pin);
    }
    
    // Check if LED is on
    bool isOn(uint8_t pin) const {
        return (pins & (1 << pin)) != 0;
    }
    
    // OR operator for combining states
    LEDState operator|(const LEDState& other) const {
        LEDState result;
        result.pins = pins | other.pins;
        return result;
    }
    
    // AND operator for intersection
    LEDState operator&(const LEDState& other) const {
        LEDState result;
        result.pins = pins & other.pins;
        return result;
    }
    
    // XOR operator for toggle
    LEDState operator^(const LEDState& other) const {
        LEDState result;
        result.pins = pins ^ other.pins;
        return result;
    }
    
    // Get raw bits for hardware write
    uint8_t getRaw() const { return pins; }
};

int main() {
    LEDState leds;
    
    leds.on(0);   // LED 0 on
    leds.on(2);  // LED 2 on
    
    LEDState pattern;
    pattern.on(1);  // Pattern has LED 1 on
    
    LEDState combined = leds | pattern;  // Both on
    
    return 0;
}
```

**Code example — Smart pointer with operators** (common in embedded):

```cpp
#include <cstdint>

template<typename T>
class RefPtr {
private:
    T* ptr;
    uint32_t* ref_count;
    
public:
    RefPtr(T* p = nullptr) : ptr(p) {
        static uint32_t dummy_count = 0;
        ref_count = &dummy_count;
        if (ptr) {
            ref_count = new uint32_t(1);
        }
    }
    
    // Copy constructor (increment ref count)
    RefPtr(const RefPtr& other) : ptr(other.ptr), ref_count(other.ref_count) {
        if (ptr) ++(*ref_count);
    }
    
    // Assignment operator
    RefPtr& operator=(const RefPtr& other) {
        if (this != &other) {
            if (ptr && --(*ref_count) == 0) {
                delete ptr;
                delete ref_count;
            }
            ptr = other.ptr;
            ref_count = other.ref_count;
            if (ptr) ++(*ref_count);
        }
        return *this;
    }
    
    // Arrow operator
    T* operator->() { return ptr; }
    
    // Dereference operator
    T& operator*() { return *ptr; }
    
    // Boolean conversion
    explicit operator bool() const { return ptr != nullptr; }
    
    // Destructor
    ~RefPtr() {
        if (ptr && --(*ref_count) == 0) {
            delete ptr;
            delete ref_count;
        }
    }
};
```

**Guidelines for operator overloading in embedded**:

| Guideline | Reason |
| --------- | ------- |
| Use `explicit` for converting constructors | Prevents accidental implicit conversions |
| Keep operators simple and predictable | Complex operators are hard to debug |
| Prefer member functions for `=`, `[]`, `->`, `()` | These require member access |
| Use friend functions for symmetric operators | So `a + b` and `b + a` both work |
| Don't overload unless it makes code clearer | Overuse reduces readability |

**Check your understanding**: Why is the stream operator `<<` typically a friend function? What would happen if you made it a member function?

---

## Common misconceptions

| Misconception | Reality |
| ------------- | ------- |
| "C++ is just C with classes" | C++ adds STL, RAII, templates, exceptions, and more. |
| "Virtual functions are free" | They add vtable pointer and indirect call overhead. |
| "new/delete are like C's malloc/free" | They call constructors/destructors, not just allocate memory. |
| "All embedded code must be C" | Many frameworks (Arduino, ARM mbed) use C++ successfully. |
| "Classes are only for desktop" | Embedded frameworks widely use classes for hardware abstraction. |
| "Inheritance is the best way to reuse code" | Composition (has-a) is often better than inheritance (is-a). |

---

## Suggested resources

### For beginners

- **[C++ OOP Tutorial - Derek Banas](https://www.youtube.com/watch?v=1n2uqnC1p0M)**: Fast-paced OOP overview.
- **[Learn C++ - Programiz](https://www.programiz.com/cpp-programming)**: Structured tutorials.

### Textbooks

- **C++ Primer** (Lippman): Comprehensive, good for deep understanding.
- **Programming: Principles and Practice Using C++** (Stroustrup): Written by C++ creator.

### Embedded C++

- **[Embedded C++ Basics - Intel](https://www.intel.com/content/www/us/en/developer/articles/technical/embedded-c-plus-plus-basics.html)**: Embedded-specific considerations.

---

## Self-check before moving on

You're ready for the next module when you can do all of these without looking anything up:

<SelfCheckList storageKey="cpp-basics-checklist" :items="[
  { id: '1', label: 'Create a class with private member variables and public methods' },
  { id: '2', label: 'Explain the difference between public, private, and protected' },
  { id: '3', label: 'Write a constructor with an initializer list' },
  { id: '4', label: 'Create a derived class that inherits from a base class' },
  { id: '5', label: 'Explain why virtual functions enable polymorphism' },
  { id: '6', label: 'Explain why virtual destructors are important when deleting through base pointers' },
  { id: '7', label: 'Overload the + operator for a custom class' },
  { id: '8', label: 'Explain why the stream operator << is typically a friend function' }
]" />