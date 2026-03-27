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
          { text: "Soft Skills", link: "/soft-skills" },
        ],
      },
      {
        text: "Beginner",
        collapsed: false,
        items: [
          {
            text: "1. Foundations",
            items: [
              { text: "Overview", link: "/beginner/1-foundations/" },
              {
                text: "Basic Calculus",
                link: "/beginner/1-foundations/basic-calculus",
              },
              {
                text: "Electric Circuits Principles",
                link: "/beginner/1-foundations/electric-circuits-principles",
              },
              {
                text: "Bridge to Electronics",
                link: "/beginner/1-foundations/bridge-to-electronics",
              },
            ],
          },
          {
            text: "2. C/C++ Programming",
            items: [
              { text: "Overview", link: "/beginner/2-c-programming/" },
              {
                text: "C Syntax Basics",
                link: "/beginner/2-c-programming/c-syntax-basics.md",
              },
              {
                text: "Arrays, Pointers, and Memory",
                link: "/beginner/2-c-programming/arrays-pointers-memory.md",
              },
              {
                text: "Control Flow and Functions",
                link: "/beginner/2-c-programming/control-flow-and-functions.md",
              },
              {
                text: "C++ Basics: OOP",
                link: "/beginner/2-c-programming/cpp-basics.md",
              },
              {
                text: "C Standard Lib & C++ Overview",
                link: "/beginner/2-c-programming/c-standard-lib-and-cpp-overview.md",
              },
            ],
          },
          { text: "3. Prototyping", link: "/beginner/3-prototyping/" },
        ],
      },
      {
        text: "Intermediate",
        collapsed: false,
        items: [
          { text: "1. Bare-Metal", link: "/intermediate/1-bare-metal/" },
          {
            text: "2. Programming and Protocols",
            link: "/intermediate/2-programming-protocols/",
          },
          {
            text: "3. PCB, Debugging, and RTOS",
            link: "/intermediate/3-pcb-debugging-rtos/",
          },
        ],
      },
      {
        text: "Advanced",
        collapsed: false,
        items: [
          {
            text: "1. Linux and Build Systems",
            link: "/advanced/1-linux-build-systems/",
          },
          {
            text: "2. AI, DSP, and Control",
            link: "/advanced/2-ai-dsp-control/",
          },
          {
            text: "3. Security and AUTOSAR",
            link: "/advanced/3-security-autosar/",
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
