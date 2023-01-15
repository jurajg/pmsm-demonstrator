# pmsm-demonstrator
PneuMatic State Machines - demonstrator.

Copyright © 2022, 2023 Juraj Galbavy

The goal of PMSM demonstrator project is to create an UML diagram modeled state machine,
which state can be monitored using UI.

These parts will be implemented:
* HTML webpage that allows to edit a simplified UML diagram of state machine
* python target implementing event loop, universal state machine class, derived classes that define state machine actions and HTTP server allowing to monitor state of state machine. Developer is writing asynchronous code
* HTML state monitor showing UML state diagram with visualised actual state

The project is inspired by workflow from IBM Rational Rose&#174;, but with graphical workflow reduced to minimum. Most of the work done by embedded developer is in target programming language,
just the state machine is modelled and monitored using graphical diagram.
UML diagram editor is decoupled from target implementation using JSON state machine description.
Target is decoupled from monitor UI using HTTP REST protocol.

# Example simple use case

Dev wants to make a car alarm, that can have 3 states:
* idle (unlocked)
* armed (car is locked)
* alarm (car horn is sounding, lights blinking)

## Workflow
1. First, dev draws a state diagram in UML editor and defines state bubbles and transitions between states. A state transitions to another by accepting a defined event type in event queue. Everytime there's a transition action can be called. Also another action can be called when entering or exiting state bubble.
2. JSON state machine specification is exported from UML editor.
3. Dev writes a code in python that includes premade python state machine implementation. Dev extends a state machine class with methods, that will process incoming actions from transitions and state entry/exit. Also dev loads JSON specification to the class and launches event loop.
4. Dev runs the implementation and connects to it using monitor UI to observe current state.

Python could be replaced with another language, just the state machine class and event sources need to be implemented in it.

## Where do events come from?

Simple event source can be a delay timer. Timer is started from python source code and later will produce an event that will be processed in event loop.
The correct state machine will get the event and event dispatcher will try to match event to transition trigger. If there's a match, then the corresponding transition is performed and transition action called.
Other event sources will be digital inputs on embedded computer. Such as InputHigh, InputLow.
