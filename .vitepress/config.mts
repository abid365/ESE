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
          { text: "3. Prototyping", link: "/docs/beginner/3-prototyping/" },
        ],
      },
      {
        text: "Intermediate",
        collapsed: false,
        items: [
          { text: "1. Bare-Metal", link: "/docs/intermediate/1-bare-metal/" },
          {
            text: "2. Programming and Protocols",
            link: "/docs/intermediate/2-programming-protocols/",
          },
          {
            text: "3. PCB, Debugging, and RTOS",
            link: "/docs/intermediate/3-pcb-debugging-rtos/",
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
