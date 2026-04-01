# RTOS Fundamentals

**Who this is for**: Embedded developers who need to manage multiple concurrent tasks in real-time applications
**Time to complete**: 4 weeks
**Prerequisites**: C Programming (arrays, pointers, functions), Interrupts, Timers, and Basic Multithreading Concepts

**Why it matters**: Real embedded systems almost always have multiple things happening simultaneously—reading sensors, updating displays, responding to buttons, communicating. Without an RTOS, you manage this complexity with state machines and interrupt flags. With an RTOS, you express concurrency naturally as multiple tasks, making code simpler and more maintainable.

---

## How this connects to embedded work

Before this module, you managed concurrency with flags and state machines:

- **Before**: A superloop that checks `if (sensor_ready) process_sensor(); if (button_pressed) handle_button();` with shared flags protected by critical sections
- **After**: Separate tasks for sensor processing, button handling, and display update that run independently, with queues and semaphores coordinating between them

This module builds on your interrupt knowledge—you'll learn how the RTOS uses interrupts to switch between tasks, creating the illusion of parallel execution on a single CPU core.

---

## Module structure

### Week 1 — RTOS Concepts and FreeRTOS Architecture

**Core idea**: Understand what an RTOS is, how it schedules tasks, and learn FreeRTOS architecture

**Key concepts to learn**:

- Real-time scheduling: hard vs soft real-time
- Task states: running, ready, blocked, suspended
- The idle task and CPU usage
- Tick interrupt and time slicing
- FreeRTOS task creation and deletion
- Task priority assignment

::: info Glossary: RTOS-Related Terms

- **RTOS**: Real-Time Operating System—an OS designed for real-time applications with deterministic timing
- **Scheduler**: The part of the RTOS that decides which task runs next
- **Task**: A unit of execution (similar to a thread in desktop OS)
- **Context switch**: Saving one task's state and restoring another's
- **Tick**: Periodic interrupt that drives the RTOS clock
- **Priority**: Number determining task importance (higher = more important)
- **Blocking**: Waiting for something (delay, semaphore, queue)
- **Preemption**: Higher priority task interrupting lower priority task
  :::

**Real-time concepts**:

| Type           | Deadline       | Consequence of Missing       |
| -------------- | -------------- | ---------------------------- |
| Hard real-time | Must meet      | System failure (airbag, ABS) |
| Firm real-time | Should meet    | Significant degradation      |
| Soft real-time | Prefer to meet | Minor performance loss       |

**FreeRTOS task states**:

```
                    ┌──────────────┐
                    │   Running    │◄─────────────────────┐
                    └──────┬───────┘                      │
                           │                              │
              ┌────────────┼────────────┐                 │
              │            │            │                 │
              ▼            ▼            ▼                 │
       ┌──────────┐  ┌──────────┐  ┌────────────┐        │
       │  Ready   │  │ Blocked  │  │ Suspended   │        │
       └──────────┘  └──────────┘  └────────────┘        │
              │            │            │                 │
              └────────────┴────────────┴─────────────────┘
                         Scheduler
```

**Task creation example**:

```c
#include "FreeRTOS.h"
#include "task.h"

// Task function (must never return)
void vTaskSensor(void* pvParameters) {
    // pvParameters contains parameters passed during creation
    while (1) {
        // Read sensor
        float temp = read_temperature();

        // Send to queue (will block if queue is full)
        xQueueSend(sensor_queue, &temp, portMAX_DELAY);

        // Block for 100ms (sensor sampling rate)
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

int main(void) {
    // Create task
    // Parameters: task function, name, stack size, params, priority, handle
    xTaskCreate(
        vTaskSensor,           // Task function
        "Sensor Task",         // Name (for debugging)
        256,                   // Stack size in words (not bytes!)
        NULL,                  // Parameters
        2,                     // Priority (0 is lowest by default)
        NULL                   // Task handle (can be NULL)
    );

    // Start scheduler
    vTaskStartScheduler();

    // Should never reach here
    while (1);
}
```

**Task priorities**:

::: tip Priority Assignment

- Highest priority: Time-critical interrupt handlers that do minimal work
- High priority: Tasks that respond to external events (buttons, communications)
- Medium priority: Data processing tasks
- Low priority: Background logging, status updates
- Idle priority: Always the lowest—idle task runs when nothing else can
  :::

**Stack size calculation**:

```c
// Each task needs stack for:
// - Local variables
// - Function call return addresses
// - Saved registers
// - ISR stack frame (worst case)

// Rule of thumb: 256 words (1KB) for simple tasks
//                512 words (2KB) for tasks with large local buffers
//                1024+ for tasks with deep call stacks

// Check stack usage with:
// vTaskList() - prints task info including stack usage
// ulTaskGetStackHighWaterMark() - returns minimum remaining stack
```

**Check your understanding**:

- Why can a task function never return in FreeRTOS?
- What's the difference between a task being "ready" and "running"?
- If Task A (priority 1) is running and Task B (priority 2) becomes ready, what happens?

---

### Week 2 — Task Scheduling, Delays, and Synchronization

**Core idea**: Master the scheduler's behavior and use delays, semaphores, and mutexes for task coordination

**Key concepts to learn**:

- Preemptive vs cooperative scheduling
- Tickless idle mode
- vTaskDelay vs vTaskDelayUntil
- Binary semaphores for ISR synchronization
- Mutexes for resource protection
- Priority inversion and inheritance
- Deadlock avoidance

::: info Glossary: Scheduling Terms

- **Preemptive scheduling**: RTOS can interrupt a task at any time to run a higher priority task
- **Time slicing**: Round-robin scheduling among tasks of same priority
- **Priority inversion**: Low priority task blocks high priority task by holding a resource
- **Priority inheritance**: Temporary priority boost to solve priority inversion
- **Deadlock**: Two tasks waiting for each other's resources forever
- **Starvation**: Task never gets CPU time due to scheduling
  :::

**vTaskDelay vs vTaskDelayUntil**:

```c
// WRONG: Drift accumulates
void vBadTask(void* pvParam) {
    while (1) {
        process_data();
        vTaskDelay(100);  // 100ms from when delay was called, not started
    }
}

// CORRECT: Fixed period
void vGoodTask(void* pvParam) {
    TickType_t last_wake = xTaskGetTickCount();
    while (1) {
        process_data();
        vTaskDelayUntil(&last_wake, pdMS_TO_TICKS(100));  // Exactly 100ms
    }
}
```

**Binary semaphore for ISR synchronization**:

```c
SemaphoreHandle_t uart_semaphore;

// ISR handler
void UART1_IRQHandler(void) {
    BaseType_t higher_priority_woken = pdFALSE;

    // Give semaphore from ISR
    // This unblocks the waiting task
    xSemaphoreGiveFromISR(uart_semaphore, &higher_priority_woken);

    // Trigger scheduler if a higher priority task is now ready
    portYIELD_FROM_ISR(higher_priority_woken);
}

// Task waits for semaphore
void vUartTask(void* pvParam) {
    uint8_t byte;
    while (1) {
        // Block until ISR gives semaphore
        if (xSemaphoreTake(uart_semaphore, portMAX_DELAY) == pdTRUE) {
            // Read and process UART data
            while (USART_ReadByte(&byte)) {
                process_byte(byte);
            }
        }
    }
}
```

**Mutex for shared resource protection**:

```c
SemaphoreHandle_t i2c_mutex;

// Initialize mutex (created empty)
i2c_mutex = xSemaphoreCreateMutex();

// Protected I2C access
void read_sensor(void) {
    // Take mutex (blocks if someone else has it)
    xSemaphoreTake(i2c_mutex, portMAX_DELAY);

    // Critical section - only one task accesses I2C at a time
    i2c_start();
    i2c_sendaddress(SENSOR_ADDR);
    i2c_readdata(buffer, len);
    i2c_stop();

    // Give mutex back
    xSemaphoreGive(i2c_mutex);
}
```

::: warning Critical: Priority Inversion
Without priority inheritance, this sequence causes priority inversion:

1. LowPri task takes mutex
2. MediumPri task starts running (LowPri blocked)
3. HighPri task tries to take mutex, waits
4. MediumPri continues (HighPri blocked!)
5. HighPri waits for MediumPri, which waits for LowPri

FreeRTOS mutexes have priority inheritance—HighPri temporarily "borrows" LowPrio's priority until mutex is released.
:::

**Deadlock example and avoidance**:

```c
// DEADLOCK: Task A holds Mutex1, waits for Mutex2
//           Task B holds Mutex2, waits for Mutex1
void vTaskA(void* pvParam) {
    while (1) {
        xSemaphoreTake(Mutex1, portMAX_DELAY);
        xSemaphoreTake(Mutex2, portMAX_DELAY);
        do_work();
        xSemaphoreGive(Mutex2);
        xSemaphoreGive(Mutex1);
    }
}

// AVOIDED: Always take in same order
void vTaskA(void* pvParam) {
    while (1) {
        // Take in consistent order prevents deadlock
        if (xSemaphoreTake(Mutex1, pdMS_TO_TICKS(100)) == pdTRUE) {
            if (xSemaphoreTake(Mutex2, pdMS_TO_TICKS(100)) == pdTRUE) {
                do_work();
                xSemaphoreGive(Mutex2);
            }
            xSemaphoreGive(Mutex1);
        }
    }
}
```

**Check your understanding**:

- Why might vTaskDelay(100) not give exactly 100ms of delay?
- What's the difference between a semaphore and a mutex?
- Task A (priority 2) holds a mutex. Task B (priority 1) tries to take it. What happens?

---

### Week 3 — Inter-Task Communication and Queues

**Core idea**: Learn to safely pass data between tasks using queues, mailboxes, and notifications

**Key concepts to learn**:

- Queue fundamentals: FIFO, length, item size
- Sending to queues: from task vs from ISR
- Receiving from queues with timeouts
- Queue sets for monitoring multiple queues
- Direct to task notifications (Faster than queues)
- Stream buffers and message buffers

::: info Glossary: Communication Terms

- **Queue**: FIFO data structure for passing data between tasks
- **Mailbox**: Queue (sometimes specifically a queue of length 1)
- **Producer**: Task that sends data
- **Consumer**: Task that receives data
- **Task notification**: Direct signaling to a task without queue overhead
  :::

**Queue creation and use**:

```c
// Create queue: 10 items, each 4 bytes (holds uint32_t or pointers)
QueueHandle_t data_queue = xQueueCreate(10, sizeof(uint32_t));

// Producer task
void vProducerTask(void* pvParam) {
    uint32_t counter = 0;
    while (1) {
        counter++;

        // Send (blocks if queue full)
        xQueueSend(data_queue, &counter, portMAX_DELAY);

        vTaskDelay(pdMS_TO_TICKS(200));
    }
}

// Consumer task
void vConsumerTask(void* pvParam) {
    uint32_t received;
    while (1) {
        // Receive (blocks if queue empty)
        if (xQueueReceive(data_queue, &received, pdMS_TO_TICKS(1000)) == pdTRUE) {
            printf("Received: %lu\n", received);
        } else {
            printf("Timeout - no data\n");
        }
    }
}
```

**Passing structures through queues**:

```c
typedef struct {
    uint8_t type;
    float value;
    uint32_t timestamp;
} SensorData_t;

QueueHandle_t sensor_queue;

// Sending task
void vSensorTask(void* pvParam) {
    SensorData_t data;
    while (1) {
        data.type = SENSOR_TEMP;
        data.value = read_temp();
        data.timestamp = xTaskGetTickCount();

        xQueueSend(sensor_queue, &data, portMAX_DELAY);
        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

// Receiving task
void vProcessingTask(void* pvParam) {
    SensorData_t data;
    while (1) {
        if (xQueueReceive(sensor_queue, &data, portMAX_DELAY) == pdTRUE) {
            switch (data.type) {
                case SENSOR_TEMP:
                    handle_temp(data.value);
                    break;
                case SENSOR_PRESSURE:
                    handle_pressure(data.value);
                    break;
            }
        }
    }
}
```

**Direct to task notifications**:

::: tip Use Notifications for Simplicity
Task notifications are faster than queues (no kernel objects) but only work for one-to-one communication where the receiving task knows the sender.

```c
// Task waits for notification
void vUartRxTask(void* pvParam) {
    while (1) {
        // Wait for notification (not a semaphore!)
        ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

        // Process received bytes
        while (USART_HasData()) {
            process_byte(USART_Read());
        }
    }
}

// ISR notifies task directly
void UART_IRQHandler(void) {
    BaseType_t woken = pdFALSE;

    // Read all bytes
    uint8_t byte = USART_Read();

    // Store in buffer, then...

    // Notify task (more efficient than semaphore)
    vTaskNotifyGiveFromISR(task_handle, &woken);
    portYIELD_FROM_ISR(woken);
}
```

:::

**Stream buffers for streaming data**:

```c
// Create stream buffer: 128 bytes, allow sender to block
StreamBufferHandle_t stream = xStreamBufferCreate(128, 1);

// Send to stream buffer
size_t sent = xStreamBufferSend(stream, buffer, length, portMAX_DELAY);

// Receive from stream buffer
size_t received = xStreamBufferReceive(stream, buffer, 64, pdMS_TO_TICKS(100));
```

**Check your understanding**:

- A queue can hold 5 items. What happens when a task tries to send a 6th item?
- When might you choose a task notification over a queue?
- Two tasks both send to the same queue. How does the consumer know which task sent each item?

---

### Week 4 — Practical RTOS Patterns and Debugging

**Core idea**: Apply RTOS patterns to real embedded problems and debug common issues

**Key concepts to learn**:

- Command pattern with queues
- Service daemon tasks
- Timer daemon (software timers)
- Resource management patterns
- RTOS-aware debugging
- Memory allocation strategies
- Stack overflow detection

::: info Glossary: RTOS Patterns

- **Command pattern**: Encapsulate requests as objects for queuing
- **Service daemon**: Task that waits for requests and processes them
- **Timer daemon**: Software timer managed by RTOS tick
  :::

**Command pattern implementation**:

```c
typedef enum {
    CMD_LED_ON,
    CMD_LED_OFF,
    CMD_LED_TOGGLE,
    CMD_SET_BRIGHTNESS,
    CMD_MOTOR_SPEED,
} CommandType_t;

typedef struct {
    CommandType_t type;
    union {
        uint8_t led_brightness;
        int16_t motor_speed;
    } param;
} Command_t;

QueueHandle_t cmd_queue;

// Interrupt or high-priority task sends commands
void button_handler(void) {
    Command_t cmd = {.type = CMD_LED_TOGGLE};
    xQueueSendFromISR(cmd_queue, &cmd, NULL);
}

// Low-priority service daemon processes commands
void vLedService(void* pvParam) {
    Command_t cmd;
    while (1) {
        if (xQueueReceive(cmd_queue, &cmd, portMAX_DELAY) == pdTRUE) {
            switch (cmd.type) {
                case CMD_LED_ON:
                    LED_On();
                    break;
                case CMD_LED_OFF:
                    LED_Off();
                    break;
                case CMD_LED_TOGGLE:
                    LED_Toggle();
                    break;
                case CMD_SET_BRIGHTNESS:
                    LED_SetBrightness(cmd.param.led_brightness);
                    break;
            }
        }
    }
}
```

**Software timers**:

```c
TimerHandle_t blink_timer;
TimerHandle_t auto_off_timer;

// One-shot timer callback
void vAutoOffCallback(TimerHandle_t xTimer) {
    LED_Off();  // Turn off after delay
}

// Periodic timer callback
void vBlinkCallback(TimerHandle_t xTimer) {
    LED_Toggle();  // Blink LED
}

// Create and start timers
void setup_timers(void) {
    blink_timer = xTimerCreate(
        "Blink",
        pdMS_TO_TICKS(500),    // Period
        pdTRUE,                 // Auto-reload
        NULL,                   // ID
        vBlinkCallback          // Callback
    );
    xTimerStart(blink_timer, 0);

    // Start one-shot timer (will be reset by application)
    auto_off_timer = xTimerCreate(
        "AutoOff",
        pdMS_TO_TICKS(5000),    // 5 second timeout
        pdFALSE,                // One-shot
        NULL,
        vAutoOffCallback
    );
}

// Application: reset auto-off timer when button pressed
void on_button_press(void) {
    LED_On();
    xTimerReset(auto_off_timer, 0);  // Reset 5 second countdown
}
```

**Memory allocation configuration**:

::: warning Heap Management
FreeRTOS offers multiple heap schemes. Choose based on your memory constraints:

| Scheme | Best For                    | Fragmentation Risk        |
| ------ | --------------------------- | ------------------------- |
| heap_1 | Simple systems, no deletion | None (never frees)        |
| heap_2 | Systems that delete tasks   | Low (best fit)            |
| heap_3 | Thread-safe malloc/free     | Depends on implementation |
| heap_4 | General purpose             | Medium                    |
| heap_5 | Non-contiguous memory       | Medium                    |

:::

**Stack overflow detection**:

```c
// Enable in FreeRTOSConfig.h:
// #define configCHECK_FOR_STACK_OVERFLOW 2

// Option 1: Hook function
void vApplicationStackOverflowHook(TaskHandle_t xTask, char* pcTaskName) {
    printf("STACK OVERFLOW in %s\n", pcTaskName);
    while (1);  // Halt
}

// Option 2: Check high water mark periodically
void vMonitorTask(void* pvParam) {
    while (1) {
        TaskHandle_t handles[] = {task1, task2, task3};
        for (int i = 0; i < 3; i++) {
            UBaseType_t high = uxTaskGetStackHighWaterMark(handles[i]);
            if (high < 50) {  // Less than 50 words left
                printf("WARNING: Task %d stack critical: %lu words\n", i, high);
            }
        }
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}
```

**RTOS-aware debugging in GDB**:

```bash
# FreeRTOS provides GDB thread awareness
(gdb) info threads       # List all tasks
(gdb) thread n          # Switch to task n
(gdb) bt                # Backtrace for current task
(gdb) thread apply all bt  # Backtrace all tasks

# FreeRTOS-specific commands (with FreeRTOS GDB plugin)
(gdb) px                # List all tasks and states
(gdb) pq                # List all queues
(gdb) pt                # List all timers
```

**Common RTOS bugs and fixes**:

| Symptom                                    | Cause                    | Fix                                   |
| ------------------------------------------ | ------------------------ | ------------------------------------- | --- |
| System hangs after running for hours       | Memory fragmentation     | Use heap_4, pre-allocate buffers      |
| High priority task starves others          | Blocking too long        | Break work into chunks                |
| Data corruption between tasks              | No synchronization       | Add mutex/semaphore                   |
| Tasks randomly stop responding             | Stack overflow           | Increase stack, enable overflow check |
| printf doesn't work after scheduler starts | ITM/Semihosting conflict | Use ITM_SendChar or UART              |     |

**Check your understanding**:

- How would you implement a one-shot timer that resets when new data arrives?
- A task blocks forever on xQueueReceive. How do you debug this?
- What's the difference between heap_1 and heap_4? When would you use each?

---

## Common misconceptions

| Misconception                             | Reality                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| "RTOS makes things real-time"             | RTOS makes scheduling deterministic, not faster. Hard deadlines need proper design regardless |
| "More tasks = better design"              | Tasks have overhead. Split only when concurrency genuinely simplifies logic                   |
| "Priority 1 is highest"                   | In FreeRTOS, higher number = higher priority by default (configMAX_PRIORITIES-1 is max)       |
| "Mutex and binary semaphore are the same" | Mutex has priority inheritance; semaphore doesn't. Use mutex for resources                    |
| "printf works fine with RTOS"             | Printf may block and cause priority inversion. Use async logging or ITM                       |

---

## Suggested resources

### Videos

- [Introduction to RTOS - DigiKey](https://www.youtube.com/playlist?list=PLEBQazB0HUyQ4hAPU1cJED6t3DU0h34fz)
- [FreeRTOS Tutorial -光亮](https://www.youtube.com/watch?v=c0mC6z1M-vA)
- [RTOS Concepts - Australian Embedded](https://www.youtube.com/watch?v=F321087y7yc)
- [Debugging FreeRTOS - Sean衍](https://www.youtube.com/watch?v=qWXG5MFXo2c)

### Reading

- [FreeRTOS Documentation](https://www.freertos.org/)
- [Mastering FreeRTOS - Richard Barry](https://www.freertos.org/Documentation/books/Mastering_the_FreeRTOS_Real_Time_Kernel.pdf)
- [Micrium RTOS Books](https://www.micrium.com/rtos/books/)
- [Real-Time Systems and Programming Languages](https://www.amazon.com/Real-Time-Systems-Programming-Languages/dp/0321417453)

### Hardware

| Item                              | Notes                          |
| --------------------------------- | ------------------------------ |
| STM32F4 Discovery or NUCLEO board | Runs FreeRTOS out of box       |
| J-Link or ST-Link                 | For RTOS-aware debugging       |
| Logic analyzer                    | Verify timing of task switches |
| Oscilloscope                      | Check interrupt latency        |

---

## Self-check before moving on

When all skills below can be performed without looking anything up, the module is complete.

### RTOS Fundamentals

1. Create two FreeRTOS tasks with different priorities and observe preemptive scheduling
2. Use xSemaphoreCreateMutex() to protect shared I2C bus access between two tasks
3. Implement a producer-consumer pattern using xQueueCreate() to pass data between tasks
4. Replace a semaphore with task notification (ulTaskNotifyTake) and measure performance difference
5. Create a software timer that toggles an LED at 1Hz
6. Implement the command pattern with a queue for an LED controller
7. Enable stack overflow checking and trigger a stack overflow to observe the behavior
8. Use GDB with RTOS awareness to list all tasks and their current states
