# Intermediate 3: PCB, Debugging, and RTOS

**Who this is for**: Embedded engineers ready to design professional hardware, debug with hardware-level tools, and manage concurrent tasks with an RTOS
**Time to complete**: 11 weeks (4 weeks for PCB, 3 weeks for debugging, 4 weeks for RTOS)
**Prerequisites**: Completion of Intermediate 1-2 and all Beginner modules

**Why it matters**: This module bridges the gap between prototype and production. You'll learn to design PCBs that can be manufactured, debug firmware with professional tools that catch bugs print statements miss, and structure complex applications with an RTOS.

---

## How this connects to embedded work

**Before this module**:

- Breadboards that come loose and cause intermittent bugs
- Debugging with printf statements that miss timing-sensitive issues
- Managing concurrency with complex state machines and flags

**After this module**:

- Professional PCB designs ready for manufacturing
- Hardware-level debugging with GDB, breakpoints, and watchpoints
- Concurrent task management using FreeRTOS patterns

---

## Topics

### [1. Hardware and PCB Design](./hardware-pcb-design.md)

Design professional PCBs using industry-standard tools like KiCad. Learn schematic capture, component selection, layout techniques, and manufacturing preparation.

### [2. GDB and OpenOCD Debugging](./gdb-openocd-debugging.md)

Debug firmware beyond print statements. Master hardware-level debugging with GDB, OpenOCD, breakpoints, watchpoints, and hard fault analysis.

### [3. RTOS Fundamentals](./rtos-fundamentals.md)

Learn FreeRTOS from the ground up. Master task scheduling, synchronization primitives, inter-task communication, and real-time patterns.

---

## Recommended Videos

- [Hardware Design - Phil's Lab](https://www.youtube.com/playlist?list=PLP29wDx6HiE7G69fD_qXhH2V7o1vXpA1e)
- [Altium Tutorials for Beginners - Robert Feranec](https://www.youtube.com/playlist?list=PL3By7U2WnU8XyWjGf-zJ9CshxR_1m_mP_)
- [How to Use OpenOCD to Debug Embedded Software with GDB](https://www.youtube.com/watch?v=LpS6_kG6M5o)
- [Introduction to RTOS - DigiKey](https://www.youtube.com/playlist?list=PLEBQazB0HUyQ4hAPU1cJED6t3DU0h34fz)

---

## Learning Goals

By completing this module, you will be able to:

- Design a 4-layer PCB with proper power distribution and signal integrity
- Use GDB with OpenOCD to debug hard faults, set breakpoints, and inspect memory
- Implement multi-task applications using FreeRTOS with proper synchronization
- Generate manufacturing files and bring up a custom PCB

---

## Module Structure

| Week | Topic                     | Key Skills                                      |
| ---- | ------------------------- | ----------------------------------------------- |
| 1-4  | Hardware and PCB Design   | KiCad, schematic capture, layout, manufacturing |
| 5-7  | GDB and OpenOCD Debugging | Breakpoints, watchpoints, fault analysis        |
| 8-11 | RTOS Fundamentals         | FreeRTOS tasks, queues, semaphores, mutexes     |
