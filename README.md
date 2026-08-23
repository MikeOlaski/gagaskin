# Pixel Painter Pro

I want you to build this application end-to-end from the attached project bundle.

The ZIP contains the complete product handoff, including the PRD, technical specification, exact Minecraft UV mapping specification, UX/UI requirements, roadmap, acceptance criteria, QA plan, and the current working HTML prototype.

Start by reading:

README_FIRST.md

LOVABLE_ONE_SHOT_PROMPT.md

Then inspect the rest of the documentation before implementing.

Treat the documentation in the bundle as the source of truth. In particular, the Minecraft UV dimensions and coordinates must be mathematically exact. Do not eyeball or approximate any body-part geometry.

The existing reference/prototype.html is a functional reference, not the desired final architecture. Rebuild the application properly as a production-quality React + TypeScript app.

Important: do not just create the UI or a mockup. Build the working application.

The completed V1 must include:

mathematically exact exploded Minecraft skin UV editor

independent left/right arms and legs

pixel-level painting

pencil, eraser, fill, eyedropper

undo/redo

reference-image upload

palette extraction

fitting a reference image onto a selected face

import of an existing 64×64 Minecraft skin

canonical 64×64 RGBA skin texture as the single source of truth

clean PNG export

live 2D preview

real interactive 3D Minecraft-style model with the current skin wrapped onto it

orbit/zoom controls

nearest-neighbor texture rendering

responsive application layout

Do not use the visible editor or preview canvas as the canonical skin source. The actual 64×64 texture must remain separate so grids, labels, borders, and selection indicators can never contaminate the exported PNG.

Please implement the project, run through the acceptance criteria and QA requirements included in the bundle, fix issues you find, and leave the project in a deployable state.

Do not stop after planning. Proceed with the build.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://gagaskin.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f998c71f-c146-49f2-bd1a-9aebfd7d4f4e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
