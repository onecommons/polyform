# Rebase

Rebase is a loosely-coupled framework for building nodejs webapps re-imagined for the modern world of containers, micro-services and hybrid apps. It is designed to make it easy to develop and deploy reusable, modular components while addressing the hard problems usually ignored by application frameworks, such as evolving live data and integration with production environments.

The key concept is the **component**. Components can span across multiple tiers of an application. An application in **Rebase** consists of a collection of `component` that are integrated together via configuration at build and deploy time and via publish and subscribe message passing at run-time.

For example, a component that contains http request routes should able to run both inside a nodejs application and also in the browser as a service worker.

## Architecture

Rebase's architecture consists of the following elements:

**HostEnvironments** represent enviroments that components either are executed in, such as a browser environment or a Node.js app, or are "installed" in, that is modified by the component -- such as a database environment where components can update its schema.

**Components** are similar to Node.js packages but they are instantiated by a `ComponentLoader` that knows how to adapt them to the application's `HostEnvironments`. Components can import interfaces and objects from the host environments as well as provide exports specialized for each environment.

**Adapters** implement interfaces and "install" a component's exports. A `HostEnvironment` is essentially a collection of adapters that the `ComponentLoader` instantiates. Example adapters would be an Express adapter that knows how to add a component's request handler as an Express route or a Webpack adapter that knows how to add a component to a webpack bundle.

## Components

The key features of components are:

* Components can import interfaces instead of specific modules. Compared to node.js packages this enables looser coupling between implementations but the use of interfaces enable stronger compatibility guarantees than just relying on semantic versioning strings as node.js packages do.

* Components have exports just like Javascript modules but they must be explicitly typed with an interface and the environment has to explicitly know how to handle ("install") every exported types. When a component is loaded each export is "installed" in the host environment.

* Like Javascript modules, components are loaded recursively and installed in the order loaded.

* Components can load regular Javascript modules and other components but regular modules can not load components.

* Components can import types and objects from the environment

* Components can import references to components across environments (e.g a reference to a browser-side component).

### Syntax

Any module with `//@component` at top will be treated as a component by the component loader.

Components interact with their environment through `import` statements that recognize the following conventions for module names:

* `!` Import from the current host environment
* `!env!` another host environment
* `!modulepath` treat the module as a component (in the current host environment).
* `!env!moduleapth` threat the module as a component in the specified host environment
* `modulepath` a regular Javascript module

Components use flow's `import type` syntax to import interfaces from the environment.

For exports, components use flow's type annotation to declare the interface the export implements. All exports need a type declaration and it is an error to use an interface name that has not imported from the environment.

Components are transpiled to a plain module using a Babel plugin. See `test/fixtures/transpiled.js` for documentation on the translation. Once transpiled the `ComponentLoader` runs each module in a separate vm context for each host environment.
