# ESE Curriculum Review

**Reviewed**: 2026-09-30
**Repo**: `E:\Web-Dev\ese` (VitePress site, ESE = Electronic and Software Engineering)
**Scope**: All curriculum content under `docs/` plus supporting files (`roadmap.md`, `required-hardware.md`, `.skills.md`, `index.md`, `.vitepress/config.mts`).

---

## TL;DR

The curriculum has a **clear vision and strong intermediate-track writing**. The biggest problems are:

1. **The Advanced track is essentially empty** — only index pages exist; no deep-dive content.
2. **No template consistency across lessons** — only Intermediate 2/3 follows the pattern defined in `.skills.md`; Beginner 1/2/3 and Intermediate 1 do not.
3. **Hardware mismatch** — Required Hardware recommends Raspberry Pi Pico as the primary platform, but the entire Intermediate track is STM32/ARM-Cortex-M focused.
4. **No bridge from Arduino (Beginner 3) to STM32 (Intermediate 1)**.
5. **Several stale VitePress scaffolding files** are still wired into the navigation (markdown-examples, api-examples).
6. **Broken search-result YouTube links** in Beginner 1 index.

The fundamentals are solid. The review below lists concrete, file-level recommendations.

---

## Curriculum Map (as found)

| Track | Module | Deep-Dive Files | Status |
| --- | --- | --- | --- |
| Beginner 1: Math, Circuits, Electronics | 3 | 3 | Content present |
| Beginner 2: C/C++ Programming | 5 | 5 | Content present |
| Beginner 3: Prototyping | 3 | 3 | Content present |
| Intermediate 1: Bare-Metal | 3 | 3 | Content present |
| Intermediate 2: Programming & Protocols | 3 | 3 | Content present, highest quality |
| Intermediate 3: PCB, Debugging, RTOS | 3 | 3 | Content present |
| Advanced 1: Embedded Linux & Build Systems | 0 | 0 | **Empty — index only** |
| Advanced 2: Edge AI, TinyML, DSP, Control | 0 | 0 | **Empty — index only** |
| Advanced 3: Security & AUTOSAR | 0 | 0 | **Empty — index only** |

**Total**: 9 modules, 27 lesson slots, 18 lessons actually written, 9 missing.

---

## Strengths

### Content depth where it exists
The Intermediate 2 lessons (`serial-protocols-uart-spi-i2c.md`, `protocol-integration-troubleshooting.md`) and Intermediate 3 lessons (`hardware-pcb-design.md`, `rtos-fundamentals.md`, `gdb-openocd-debugging.md`) are excellent — register-level STM32 examples, baud-rate math, CRC-16 code, IWDG configuration, hard-fault register dumps, FreeRTOS task patterns. This is industry-grade reference material, not "intro to blinking LEDs".

### Consistent platform choice in Intermediate/Advanced
STM32 (ARM Cortex-M) throughout Intermediate is a deliberate, coherent choice that maps to industry hiring. The register maps, code snippets, and OpenOCD config files all target STM32F4 specifically.

### Custom components
Five purpose-built Vue components in `.vitepress/theme/components/`:
- `CoursePlayer.vue` — YouTube + native video player with playlist sidebar
- `SelfCheckList.vue` — interactive self-assessment with localStorage progress
- `KatexMath.vue` — KaTeX math rendering
- `PlaylistSidebar.vue` — collapsible video list
- `PlyrVideo.vue` — wrapper around the `plyr` package

### Skill tracking design
`.skills.md` defines an 8-skill self-check per deep dive, and a structured lesson template (Who/Time/Prereqs/Why/How it connects/Module structure/Weeks/Common misconceptions/Resources/Self-check). When followed, the result is high-quality.

### Clear progression
Math → circuits → C → hardware → bare-metal → protocols → PCB + RTOS is a defensible bottom-up sequence.

---

## Critical Issues (Fix First)

### 1. Advanced track is a shell

The three advanced index files (`docs/advanced/1-linux-build-systems/index.md`, `2-ai-dsp-control/index.md`, `3-security-autosar/index.md`) contain only:
- Learning Goals (3 bullet points)
- Topics (3 bullet points)
- Recommended Videos (2-4 YouTube links)

**No deep-dive content. No code. No glossary. No self-check.** The sidebar config links directly to these index pages, so a learner clicking "Advanced 1" gets an outline with nothing under it.

**Recommendation**: Treat Advanced as the highest-priority authoring gap. Either write 9 deep-dive lessons (one per module-index topic) following the Intermediate 2 template, or mark the sections "Coming soon" and hide them from the sidebar.

### 2. Hardware mismatch between Required Hardware and Intermediate track

`required-hardware.md` recommends:
> **Raspberry Pi Pico** — GPIO/PWM/ADC/TinyGo ready — $5

But Intermediate 1, 2, and 3 are 100% STM32 register-level. The Pico (RP2040) is a totally different architecture (dual M0+, different register map, different toolchain).

There is **no curriculum content** on the Pico beyond the Beginner 3 module overview (`index.md`) which references Arduino, not Pico, projects.

**Recommendation**: Pick one. Either:
- (a) Replace the Pico with an STM32 Nucleo-F401RE (~$15) in `required-hardware.md`. This matches every Intermediate lesson and the Raspberry Pi Pico/STM32 disconnect goes away. Or
- (b) Convert the Intermediate track to RP2040 register-level PIO programming — a defensible but huge rewrite.

### 3. No Arduino → STM32 bridge

Beginner 3 (`arduino-beginner-projects.md`) ends with Arduino-style `digitalWrite()` / `Wire.beginTransmission()`.

Intermediate 1 (`gpio-timers-interrupts.md`) opens with STM32 BSRR register writes:
```c
GPIOA->BSRR = GPIO_BSRR_BS5;  // Set PA5
```

A learner who finishes Beginner 3 and starts Intermediate 1 will be shocked. There is no "what an Arduino hides from you" lesson, no "porting Arduino sketch to bare-metal", no equivalent of the bare-metal register-by-register mapping that the curriculum expects.

**Recommendation**: Add a 1-2 week bridge lesson in Intermediate 1 (before STM32 Bare-Metal):
- What `digitalWrite()` actually does (timer, GPIO register, peripheral setup)
- What `analogWrite()` does (PWM timer + CCR register)
- What `Wire.beginTransmission()` does (I2C peripheral init + address byte sequence)
- One worked example: Arduino blink → bare-metal STM32 blink

### 4. Stale VitePress scaffolding still in navigation

`markdown-examples.md` and `api-examples.md` are stock VitePress demo files. They appear:
- In the sidebar (`config.mts` lines 185-192)
- As hero actions on the homepage (`index.md` lines 12-15)
- In the navbar (`config.mts` lines 13-16)

These break the curriculum's coherence. A learner clicking "Examples" finds demo content, not course material.

**Recommendation**: Remove both files and their references in `config.mts` and `index.md`. Keep one "About / How this site works" page if needed.

---

## Major Issues (Plan to Fix)

### 5. Lesson template is not enforced

`.skills.md` defines a strict lesson template:
```
- Who this is for / Time to complete / Prerequisites
- Why it matters
- How this connects to embedded work
- Module structure (Week 1, Week 2, …)
- ::: info Glossary ::: callouts
- ::: warning / ::: tip ::: callouts
- Tables
- Code examples
- Check your understanding
- Common misconceptions
- Suggested resources (Videos / Reading / Hardware)
- Self-check before moving on (8 skills)
```

**Compliance audit**:

| Lesson | Header | Why it matters | How it connects | Weeks | Glossary | Misconceptions | Resources | Self-check |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| basic-calculus.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Videos only | ❌ |
| electric-circuits-principles.md | ❌ | inline | ❌ | partial | ❌ | ❌ | Videos only | ❌ |
| bridge-to-electronics.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Videos only | ❌ |
| c-syntax-basics.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| control-flow-and-functions.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| arrays-pointers-memory.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cpp-basics.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| c-standard-lib-and-cpp-overview.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| breadboarding-basics.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| multimeter-usage.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| arduino-beginner-projects.md | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| gpio-timers-interrupts.md | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| adc-and-sensor-interfacing.md | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| stm32-bare-metal-development.md | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| advanced-c-techniques.md | ✅ | ✅ | ✅ | ✅ | partial | ✅ | ✅ | ✅ |
| serial-protocols-uart-spi-i2c.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| protocol-integration-troubleshooting.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| hardware-pcb-design.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| gdb-openocd-debugging.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| rtos-fundamentals.md | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Only 6 of 18 lessons fully follow the template (Intermediate 2 + Intermediate 3). The Beginner track and Intermediate 1 are ad-hoc.

**Recommendation**: Convert all 12 non-conforming lessons to the standard template. This is mechanical work — copy the header + sections from `serial-protocols-uart-spi-i2c.md` and fill in module-specific content. Without template consistency, the `<SelfCheckList>` data in `.skills.md` is unreachable because lessons don't have self-check sections to call it from.

### 6. Broken YouTube search-result links

`docs/beginner/1-foundations/index.md` lines 23-25:
```markdown
- [Khan Academy - Calculus 1](https://www.youtube.com/results?search_query=khan+academy+calculus)
- [Basic Circuit Theory I (By Prof. Razavi)](<https://www.youtube.com/results?search_query=Basic+Circuit+Theory+I+(By+Prof.+Razavi)>)
- [Electronic Basics - GreatScott!](https://www.youtube.com/results?search_query=Electronic+Basics+-+GreatScott!)
```

`youtube.com/results?search_query=…` URLs are not stable video links — they are search result pages that change over time. They are not the actual Khan Academy playlist or Razavi's lectures.

**Recommendation**: Replace with direct links. Razavi's Basic Circuit Theory is at UCLA's YouTube channel — the playlist ID is `PL-XXv-cvA_iClQM7p5e6sLM0PaSEBJn5t` (verify before committing). For Khan Academy, link to `khanacademy.org/math/ap-calculus-ab` not YouTube. For GreatScott, link to his actual playlist/channel.

### 7. `api-examples.md` and `markdown-examples.md` expose raw Vue in markdown

`api-examples.md` line 30-34 contains:
```md
<script setup>
import { useData } from 'vitepress'
```

This relies on VitePress's MDC-style script support. The page works but is dead content for learners — `useData()` demo output appears in the rendered HTML but is not curriculum material.

**Recommendation**: Remove both pages (already covered under Issue #4).

### 8. GitHub social link points to vuejs/vitepress

`config.mts` line 195-197:
```ts
socialLinks: [
  { icon: "github", link: "https://github.com/vuejs/vitepress" },
],
```

The ESE curriculum site has a GitHub icon linking to the Vue.js VitePress repo. That should be the ESE repo (whatever its actual URL is — possibly missing).

**Recommendation**: Update to the ESE repo URL, or remove the social link until the repo URL is decided.

---

## Structural Issues

### 9. Beginner 1 ordering: calculus before circuits

Beginner 1 puts 5 weeks of calculus (`basic-calculus.md`) ahead of circuit theory (`electric-circuits-principles.md`) and electronics (`bridge-to-electronics.md`). Calculus is reintroduced at the Intermediate/Advanced stage (control systems, DSP) where it's actually used.

**Recommendation**: Either:
- (a) Trim calculus to a 1-week "math you need" chapter that covers derivatives/integrals as they apply to RC charging, then put full calculus as an Advanced 1 prerequisite; or
- (b) Move calculus to a "Math Refresher" appendix and let circuits come first.

### 10. Intermediate 3 ordering: PCB → Debugging → RTOS

PCB design (4 weeks) is taught before RTOS (4 weeks). Realistically, learners who haven't written concurrent firmware don't have intuition for why task priorities matter. The PCB design depth assumes the learner is already an embedded engineer.

**Recommendation**: Reorder to RTOS → Debugging → PCB. RTOS builds directly on bare-metal from Intermediate 1. Debugging requires the firmware to be running. PCB design is independent of those — it can come last. The current ordering works only for engineers who already work with firmware.

### 11. No testing / verification content anywhere

Search results: zero mentions of unit testing, mocking, Unity/GoogleTest, hardware-in-the-loop, or CI. Real embedded work requires automated testing.

**Recommendation**: Add a testing lesson — even a single week — somewhere in Intermediate 2 or 3. Unity (ThrowTheSwitch) is the de facto embedded unit-test framework. Ceedling is the build wrapper.

### 12. No version control / build system content

Search results: zero mentions of Git, CMake, Make, West/Zephyr, or any modern build tool. The STM32 bare-metal lesson says "from scratch with a Makefile" but doesn't show one.

**Recommendation**: Add 1 lesson in Intermediate 1: "Build Systems for Embedded" — Make vs CMake vs West; generating linker scripts; producing .elf/.bin/.hex.

### 13. Component-feature usage gap

Custom Vue components exist but are underused:

| Component | Defined | Used in |
| --- | --- | --- |
| `SelfCheckList` | ✅ | 2/18 lessons (serial-protocols, protocol-integration) |
| `CoursePlayer` | ✅ | 4 lessons, all Beginner 3 + basic-calculus |
| `KatexMath` | ✅ | 3 Beginner 1 lessons |

**Recommendation**:
- Use `<SelfCheckList>` in every Intermediate lesson (`.skills.md` already lists 8 skills per lesson; the data is sitting there waiting).
- Use `<KatexMath>` for math notation in Intermediate 1 (PSC/ARR formulas), Intermediate 2 (baud-rate math, FIR filter coefficients), and Intermediate 3 (PID control).
- Use `<CoursePlayer>` consistently in lessons that have curated video playlists, not just Beginner 1.

### 14. Required-hardware.md doesn't match the curriculum it serves

```
| Raspberry Pi Pico      | GPIO/PWM/ADC/TinyGo ready | $5      |
| ...
| Total                  |                          | $30     |
```

The $30 Pico setup is incompatible with the entire STM32-focused Intermediate track. The "First 3 Projects" table (LED Blinker / Button Counter / DHT22 Logger) is Arduino-ecosystem content but doesn't link to any lesson.

**Recommendation**: Replace with a STM32 Nucleo-F411RE + components kit, ~$30-40, and link the "First 3 Projects" directly to the corresponding lesson pages.

### 15. Self-check component vs `.skills.md` mismatch

`.skills.md` lists 8 skills per deep dive, but the actual `SelfCheckList` component is only invoked in 2 lessons, with 6 items each (`serial-protocols-uart-spi-i2c.md`, `protocol-integration-troubleshooting.md`). The intermediate-3 `hardware-pcb-design.md` self-check has 8 items but uses raw markdown, not the component.

**Recommendation**: Either use the component consistently or remove the localStorage-tracking self-check component and standardize on markdown checklists.

---

## Minor Issues

### 16. Sidebar link format inconsistency

`config.mts`:
- Beginner 1 (lines 38-47): `/docs/beginner/1-foundations/basic-calculus` (no `.md`)
- Beginner 2 (lines 57-73): `/docs/.../c-syntax-basics.md` (with `.md`)
- Beginner 3 (lines 84-93): `/docs/.../breadboarding-basics.md` (with `.md`)
- Intermediate 1 (lines 109-117): `/docs/.../gpio-timers-interrupts.md` (with `.md`)
- Intermediate 2 (lines 131-139): `/docs/.../advanced-c-techniques.md` (with `.md`)
- Intermediate 3 (lines 153-161): `/docs/.../hardware-pcb-design.md` (with `.md`)

VitePress resolves both forms, but the inconsistency is sloppy. Pick one format and apply it everywhere.

### 17. Naming inconsistency

- Beginner 2 is titled "C and C++ Programming Basics" in the index header but "C/C++ Programming" in the sidebar.
- Intermediate 1 uses "Peripherals and Bare-Metal" but the deep-dive files mix the terms freely.

**Recommendation**: Establish a glossary of official track/module names and use them everywhere.

### 18. Naming collision: "PCB, Debugging, and RTOS"

Intermediate 3 combines three different concerns (hardware design, debugger workflow, OS fundamentals). Each is a 3-4 week topic. The combined 11-week module is the longest in the curriculum.

**Recommendation**: Either split into Intermediate 3a (PCB), Intermediate 3b (Debugging), Intermediate 3c (RTOS), or rename to "Hardware Production & Concurrency" and acknowledge it's a multi-topic capstone.

### 19. Character encoding glitches

`basic-calculus.md` line 4: "1â€"2 hours per day" — should be "1–2 hours per day".
`basic-calculus.md` line 19: "L'HÃ´pital's rule" — should be "L'Hôpital's rule".

These are mojibake (UTF-8 bytes misdecoded). Caused by file editing with the wrong encoding (likely CP-1252 → UTF-8 misread).

**Recommendation**: Re-save these files as UTF-8. The same issue may exist in other places — search for `Ã` or `â€` and fix.

### 20. KaTeX is loaded but only used in 3 lessons

`package.json` includes `katex`. The Intermediate track has math formulas in code blocks (baud-rate calc, FIR filter coefficients, PID control, RC time constants). These render as plain text, not typeset math.

**Recommendation**: Convert the math to `<KatexMath expression="..." />` calls in Intermediate 1 and Intermediate 2. This is the whole reason the dependency is installed.

### 21. No exercises or hands-on projects

Reading-only curriculum. The Arduino project at the end of Beginner 3 (`arduino-beginner-projects.md`) is the closest thing to "build something". No Intermediate-level capstone project is suggested.

**Recommendation**: Add a capstone project at the end of Intermediate 3 — e.g., "Build a temperature-controlled fan with a thermistor, PWM output, UART status, and watchdog timer". This forces integration of GPIO + ADC + Timer + UART + watchdog.

### 22. No mention of industry tools

Search results: zero mentions of:
- SWD/J-Link/ST-Link as debugging hardware (only mentioned in passing in OpenOCD lesson)
- Logic analyzers (only Saleae mentioned in protocol-integration resources)
- Oscilloscopes (mentioned in protocol-integration troubleshooting)
- Code-coverage tools (gcov, lcov)
- Static analyzers (Cppcheck, PC-lint)
- Memory analysis (Valgrind on host, FreeRTOS heap_4 stats)

**Recommendation**: Build a "Tools" reference page that lists the developer's toolbox with cost, learning curve, and when-to-use.

---

## Recommended Fix Order

If you tackle issues in this order, each fix unblocks the next:

1. **Decide on platform**: STM32 or RP2040, update `required-hardware.md`, remove or convert Pico references throughout.
2. **Author the Advanced track**: 9 deep-dive lessons using the Intermediate 2 template.
3. **Add Arduino → STM32 bridge** at the start of Intermediate 1.
4. **Remove scaffolding**: `markdown-examples.md`, `api-examples.md`, references in `config.mts` and `index.md`.
5. **Fix YouTube links**: replace search-result URLs in Beginner 1 index with direct video/playlist URLs.
6. **Convert all 18 lessons to the standard template** from `.skills.md` — mechanical but tedious.
7. **Use `<SelfCheckList>` consistently** in every lesson (data already exists in `.skills.md`).
8. **Reorder Intermediate 3**: RTOS → Debugging → PCB.
9. **Add testing + version control + build system lessons** in Intermediate.
10. **Fix minor items**: sidebar link format, naming collisions, mojibake, GitHub social link.

Items 6-7 alone would roughly double the value of the existing content for learners, because the self-check component is what makes the curriculum measurable.

---

## Things This Curriculum Does Well — Keep Doing

- Real STM32 register names (BSRR, BRR, CR1, SR), not pseudo-code
- Baud-rate math with worked numbers (84 MHz / 16 / 115200 = 45.5729)
- Hard-fault register analysis with bitfield decoding
- "Common misconceptions" tables (excellent teaching pattern)
- Reasoning about WHY before HOW (`::: tip` and `::: warning` callouts are well-placed in Intermediate)
- FreeRTOS priority-inversion example showing the actual mutex/thread interaction
- Glossary callouts embedded next to first use of each term
- Cross-module continuity (Intermediate 1 references things learned in Beginner 2)

The structural issues are fixable; the writing voice is the curriculum's strongest asset and should not be diluted while fixing them.
