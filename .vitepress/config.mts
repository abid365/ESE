import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "ESE",
  description: "A comprehensive guide on Electronic and Software Engineering",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Roadmap",
        collapsed: false,
        items: [
          { text: "Overview", link: "/roadmap" },
          { text: "Required Hardware", link: "/required-hardware" },
        ],
      },
      {
        text: "Beginner",
        collapsed: false,
        items: [
          {
            text: "1. Foundations",
            collapsed: false,
            items: [
              { text: "Overview", link: "/docs/beginner/1-foundations/" },
              {
                text: "Basic Calculus",
                link: "/docs/beginner/1-foundations/basic-calculus",
              },
              {
                text: "Electric Circuits Principles",
                link: "/docs/beginner/1-foundations/electric-circuits-principles",
              },
              {
                text: "Bridge to Electronics",
                link: "/docs/beginner/1-foundations/bridge-to-electronics",
              },
            ],
          },
          {
            text: "2. C/C++ Programming",
            collapsed: false,
            items: [
              { text: "Overview", link: "/docs/beginner/2-c-programming/" },
              {
                text: "C Syntax Basics",
                link: "/docs/beginner/2-c-programming/c-syntax-basics.md",
              },
              {
                text: "Arrays, Pointers, and Memory",
                link: "/docs/beginner/2-c-programming/arrays-pointers-memory.md",
              },
              {
                text: "Control Flow and Functions",
                link: "/docs/beginner/2-c-programming/control-flow-and-functions.md",
              },
              {
                text: "C++ Basics: OOP",
                link: "/docs/beginner/2-c-programming/cpp-basics.md",
              },
              {
                text: "C Standard Lib & C++ Overview",
                link: "/docs/beginner/2-c-programming/c-standard-lib-and-cpp-overview.md",
              },
            ],
          },
          {
            text: "3. Prototyping",
            collapsed: false,
            items: [
              { text: "Overview", link: "/docs/beginner/3-prototyping/" },
              {
                text: "Breadboarding Basics",
                link: "/docs/beginner/3-prototyping/breadboarding-basics.md",
              },
              {
                text: "Multimeter Usage",
                link: "/docs/beginner/3-prototyping/multimeter-usage.md",
              },
              {
                text: "Arduino Beginner Projects",
                link: "/docs/beginner/3-prototyping/arduino-beginner-projects.md",
              },
            ],
          },
        ],
      },
      {
        text: "Intermediate",
        collapsed: false,
        items: [
          {
            text: "1. Bare-Metal",
            collapsed: false,
            items: [
              { text: "Overview", link: "/docs/intermediate/1-bare-metal/" },
              {
                text: "GPIO, Timers, and Interrupts",
                link: "/docs/intermediate/1-bare-metal/gpio-timers-interrupts.md",
              },
              {
                text: "ADC and Sensor Interfacing",
                link: "/docs/intermediate/1-bare-metal/adc-and-sensor-interfacing.md",
              },
              {
                text: "STM32 Bare-Metal Development",
                link: "/docs/intermediate/1-bare-metal/stm32-bare-metal-development.md",
              },
            ],
          },
          {
            text: "2. Programming and Protocols",
            collapsed: false,
            items: [
              {
                text: "Overview",
                link: "/docs/intermediate/2-programming-protocols/",
              },
              {
                text: "Advanced C Techniques",
                link: "/docs/intermediate/2-programming-protocols/advanced-c-techniques.md",
              },
              {
                text: "Serial Protocols: UART, SPI, I2C",
                link: "/docs/intermediate/2-programming-protocols/serial-protocols-uart-spi-i2c.md",
              },
              {
                text: "Protocol Integration and Troubleshooting",
                link: "/docs/intermediate/2-programming-protocols/protocol-integration-troubleshooting.md",
              },
            ],
          },
          {
            text: "3. PCB, Debugging, and RTOS",
            collapsed: false,
            items: [
              {
                text: "Overview",
                link: "/docs/intermediate/3-pcb-debugging-rtos/",
              },
              {
                text: "Hardware and PCB Design",
                link: "/docs/intermediate/3-pcb-debugging-rtos/hardware-pcb-design.md",
              },
              {
                text: "GDB and OpenOCD Debugging",
                link: "/docs/intermediate/3-pcb-debugging-rtos/gdb-openocd-debugging.md",
              },
              {
                text: "RTOS Fundamentals",
                link: "/docs/intermediate/3-pcb-debugging-rtos/rtos-fundamentals.md",
              },
            ],
          },
        ],
      },
      {
        text: "Advanced",
        collapsed: false,
        items: [
          {
            text: "1. Linux and Build Systems",
            link: "/docs/advanced/1-linux-build-systems/",
          },
          {
            text: "2. AI, DSP, and Control",
            link: "/docs/advanced/2-ai-dsp-control/",
          },
          {
            text: "3. Security and AUTOSAR",
            link: "/docs/advanced/3-security-autosar/",
          },
        ],
      },
      {
        text: "Examples",
        collapsed: false,
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
});
