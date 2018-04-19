# React patterns

## Introduction

### React Components

We will speak about properties of React Component as `Props`. But in JS terms properties are just an plain object.

For more compact syntax instead of `React.Component`, `React.Element` we will write `Component`, `Element`.

In general, we will work with functional stateless components - pure functions that takes `Props` as an argument and returns JSX/`Element`:

```
React.Component :: Props -> Element
```


### High-Order Component (HOC)

A Higher-Order Component is a function that accepts a `Component` as an argument and returns another `Component`:

```
Component -> Component
```

**Example of identity HOC:**

```jsx
const identity = (NextComponent) => (props) => <NextComponent {...props} />

const MyContainer = () => "I am MyContainer";

const NewContainer = identity(MyContainer);
```

In example above `identity` HOC creates `NewContainer` which renders exactly the same output as the `MyContainer`.

**Note:** The term originates from [_high-order function_](https://en.wikipedia.org/wiki/Higher-order_function).

**Note:** Sometimes HOCs are called _component decorators_. [See what decorators really are](https://github.com/tc39/proposal-decorators) and why they are occasionally mismatched with term _high-Order component_.

### Examples of HOCs

**Collections of HOCs**

* [acdlite/recompose](https://github.com/acdlite/recompose)
* [kriasoft/eact-decorators](https://github.com/kriasoft/react-decorators)
* [jaredpalmer/react-fns](https://github.com/jaredpalmer/react-fns)
* [klarna/higher-Order-components](https://github.com/klarna/higher-Order-components)

**Providing a context of libraries**

In many cases is HOC used for adding functionality to your component from certain library via React context API.

See:

* [reactjs/redux](https://github.com/reactjs/redux) - `connect`
* [yahoo/react-intl](https://github.com/yahoo/react-intl) - `injectIntl` HOC
* [erikras/redux-form](https://github.com/erikras/redux-form) - `reduxForm`

## Patterns

### 1. Static Component


```jsx
// Before Ramda:
const Loading = () => "Loading...";

ReactDOM.render(<Loading />, rootEl) // renders "Loading..."
```


```jsx
// After Ramda:
const Loading = R.always("Loading...");

ReactDOM.render(<Loading />, rootEl) // renders "Loading..."
```


### 2. Composition of High-Order components

Use function composition instead of nesting calls.

---

```js
// Before Ramda
connect()(
  reduxForm()(
    injectIntl(Container)
  )
)
```

```js
// After Ramda
R.compose(
  connect(),
  reduxForm(),
  injectIntl
)(Container)

// or

R.pipe(
  injectIntl,
  reduxForm(),
  connect()
)(Container)
```

If you are composing from exactly two HOCs, you can use `R.o`.

It is highly recommended to use just one of `R.o`, `R.compose`, `R.pipe` in the scope of your Application for composing HOCs.

### 3. Branching with `R.ifElse`

Use `R.ifElse` for conditional render.

---

Lets define following components:

```jsx
const Loading = R.always("Loading...");
const Section = ({ content }) => <section>{content}</section>;
```

Than define HOC of conditional render:

```jsx
// Before Ramda:
const Content = (props) => props.loading ?
  <Loading /> :
  <Section {...props} />;
```

```jsx
// After Ramda:
const withLoading = R.ifElse(R.prop('loading'), Loading)

const Content = withLoading(Section)
```

In this example `withLoading` HOC can be simply reused for all your components with `loading` property.

### 4. Branching with `R.cond`

Use `R.cond` for conditional render.

---

Lets define following components:

```jsx
const Loading = R.always("Loading...");
const Missing = R.always("No results.");
const Section = ({ content }) => <section>{content}</section>;
```

Than define HOC of conditional render:

```jsx
// Before Ramda:
const Content = (props) => {
  if (props.loading) {
    return <Loading />;
  }
  if (!props.items.length) {
    return <Missing />;
  }

  return <Section {...props} />
}
```

```jsx
// After Ramda:
const Content = R.cond([
  [R.prop('loading'), Loading],
  [R.isEmpty('items'), Missing],
  [R.T, Section],
]);
```

### 5. Mapping properties with `mapProps`

Lets define following functions:

```js
// Props -> Component -> Element
const createElement = R.curryN(2, React.createElement);

// mapProps :: (a -> a) -> Component -> Component
const mapProps = R.flip(R.useWith(R.o, [createElement, R.identity]));
```

See Appendix for process of refactor to pointfreee version of `mapProps`.

With `mapProps` you can transform properties of final component with your custom mapping functions:

```jsx
const Section = ({ heading, children, ...rest }) => (
  <section {...rest}>
    <h1>{heading}</h1>
    {children}
  </section>
);


const SectionWithUpperHeading = mapProps(
  (props) => ({ ...props, heading: R.toUpper(props.heading) })
)(Section)
```


Follows few examples with `mapProps`.

#### 5.1 Transforming properites with `R.evolve`

Assuming component `Section` from section 5:

```jsx
const EnhancedSection = mapProps(
  R.evolve({ heading: R.toUpper })
)(Section)

// ...

<EnhancedSection heading="Truth about Ramda">
  Ramda is awesome!
</EnhancedSection>

// renders to:
<section>
    <h1>TRUTH ABOUT RAMDA</h1>
    Ramda is awesome!
</section>
```

#### 5.2 Adding props with `computeProps`

Lets introduce function `computeProps` (see Appendix section):

```js
const computeProps = R.converge(R.merge, [R.nthArg(1), R.call]);
```

Assuming following contrieved component `SimpleSection`:

```jsx
const SimpleSection = ({
  heading,
  childrenLength,
  children,
  ...rest
}) => (
  <section {...rest}>
    <h1>{heading}</h1>
    <div>{children}</div>
    <div>{childrenLength}</div>
  </section>
);
```

```jsx
const EnhancedSection = mapProps(
  ({ children }) => ({ childrenLength: R.length(children) })
)(SimpleSection)

// ...

<EnhancedSection heading="Truth about Ramda">
  Ramda is awesome!
</EnhancedSection>

// renders to:
<section>
    <h1>Truth about Ramda</h1>
    <div>Ramda is awesome!</div>
    <div>17</div>
</section>
```

#### 5.3 Picking properties with `R.pick`

Assuming component `Section` from section 5:

```jsx
const EnhancedSection = mapProps(
  R.pick(["className", "children", "heading"])
)(Section)

// ...

<EnhancedSection
  className="EnhancedSection"
  heading="Truth about Ramda"
  invalidAttibute="invalid"
>
  Ramda is awesome!
</EnhancedSection>

// renders to:
<section class="EnhancedSection">
    <h1>Truth about Ramda</h1>
    Ramda is awesome!
</section>
```

### 6. Defining [`displayName`](https://reactjs.org/docs/react-component.html#displayname) with `setDisplayName`

Lets define following HOC `setDisplayName`:

```jsx
const setDisplayName = (displayName) => R.tap(
  (C) => C.displayName = displayName
);
```

## Appendix

### Pointfree `mapProps`

```js
const mapProps = R.curry(
  (mapping, C) => (props) => <C {...mapping(props)} />
);

// Replacing JSX
const mapProps = R.curry(
  (mapping, C) => (props) => React.createElement(C, mapping(props))
);

// Introducting curried version of React.createElement
const createElement = R.curryN(2, React.createElement);

const mapProps = R.curry(
  (mapping, C) => (props) => renderComponent(C)(mapping(props))
);

// R.o for functional composition
const mapProps = R.curry(
  (mapping, C) => (props) => R.o(renderComponent(C), mapping)(props)
);

// removing explicit argument `props`
const mapProps = R.curry(
  (mapping, C) => R.o(renderComponent(C), mapping)
);

// final pointfree version with R.flip
const mapProps = R.flip(R.useWith(R.o, [renderComponent, R.identity]));
```

### Pointfree `computeProps`

```js
const computeProps = R.curry(
  (props, mapping) => R.merge(props, mapping(props))
);

// Adding converge is pretty straigtforward
const computeProps = R.converge(R.merge, [R.nthArg(1), R.call]);
```

