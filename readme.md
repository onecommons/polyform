# Polyform

Start taming the complexity of large-scale web applications with this simple mechanism for creating highly adapable and reusable components.

`Polycubes` (cubes for short) are npm packages that can define both client and server-side logic. They export well-defined interfaces and configuration parameters designed to work seemly in a wide varienty different databases, middleware and front-end frameworks.

# Why Polyform?

Simple: Use it just like plain-old packages and modules, no boilerplate.

Reusable: Easy to mix and match database back-ends client-side templates, database

Reliable: Static and runtime type checking. Consistent unit tests across pcubes.

Production-ready: build and configuration designed for orchestration and micro-services.

## Architecture

Rebase's architecture consists of the following elements:

**HostEnvironments** represent enviroments that components either are executed in, such as a browser environment or a Node.js app, or are "installed" in, that is modified by the component -- such as a database environment where components can update its schema.

**Polycubes** are `npm` packages that knows how to adapt to the application's `HostEnvironments`. Polycubes can import interfaces and objects from the host environments as well as provide exports specialized for each environment.

**Adapters** implement interfaces and "install" a polycube's exports. A `HostEnvironment` is essentially a collection of adapters For example an Express adapter would know how to add a component's request handler as an Express route or a Webpack adapter that knows how to add a component to a webpack bundle.

## Polycubes

The key features of Polycubes are:

* With Polyform you can import interfaces instead of specific modules. Compared to node.js packages this enables looser coupling between implementations but the use of interfaces enable stronger compatibility guarantees than just relying on semantic versioning strings as node.js packages do.

* Cubes have exports just like Javascript modules but they must be explicitly typed with an interface and the environment has to explicitly know how to handle ("install") every exported types. When a cube is loaded each export is "installed" in the host environment.

* Cubes can import types and objects from the environment

### implementation

A cube packages are defined convention with thise modules:

* "index.js": stub used to load the implementation in some runtimes
* "interfaces": declares types and interfaces, may not available at runtime, generates "types"
* "default" (optional) Contains a default implementation for the interfaces

## Adapters and interfaces
* Polycubes expose load-time interfaces that other polycubes and application code can use.
* These interfaces wrap objects and register them with the adapters associated with the interface.
* At the end of load-time, adapters "install" the registered objects.

## Registration/Installation/Adaptation

* Polycubes and application code can register objects with the runtime
* Adapters and cubes export adapters in "interfaces"
* Optional static type-checking using "import type".
* Optional runtime type-checking; import adapters from "types" to avoid runtime type-checking; runtime type-checking only guaranteed to happen during build-time.

# Roadmap

* [X] Publish empty stub package to unblock development with Lerna etc.
* [ ] Dependency injection runtime
* [ ] Config infrastructure
* [ ] Build infrastructure
* [ ] Basic adapters
* [ ] Routing interface
