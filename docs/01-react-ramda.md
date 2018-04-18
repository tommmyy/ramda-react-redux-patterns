# React patterns

{% include toc.html %}

## Introduction

### React Components

We will speak about properties of React Component as `Props`. But in JS terms properties are just an plain object.

For more compact syntax instead of `React.Component`, `React.Element` we will write `Component`, `Element`.

In general, we will work with functional stateless components - pure functions that takes `Props` as an argument and returns JSX/`Element`:

```
React.Component :: Props -> Element
```


### High-order Component (HoC)

A Higher-order Component is a function that accepts a `Component` as an argument and returns another `Component`:

```
Component -> Component
```

**Example of identity HoC:**

```jsx
const identity = (NextComponent) => (props) => <NextComponent {...props} />

const MyContainer = () => "I am MyContainer";

const NewContainer = identity(MyContainer);
```

In example above `identity` HoC creates `NewContainer` which renders exactly the same output as the `MyContainer`.

**Note:** The term originates from [_high-order function_](https://en.wikipedia.org/wiki/Higher-order_function).

**Note:** Sometimes HoCs are called _component decorators_. [See what decorators really are](https://github.com/tc39/proposal-decorators) and why they are occasionally mismatched with term _high-order component_.

### Examples of HoCs

**Collections of HoCs**

* [acdlite/recompose](https://github.com/acdlite/recompose)
* [kriasoft/eact-decorators](https://github.com/kriasoft/react-decorators)
* [jaredpalmer/react-fns](https://github.com/jaredpalmer/react-fns)
* [klarna/higher-order-components](https://github.com/klarna/higher-order-components)

**Providing a context of libraries**

In many cases is HoC used for adding functionality to your component from certain library via React context API.

See:

* [reactjs/redux](https://github.com/reactjs/redux) - `connect`
* [yahoo/react-intl](https://github.com/yahoo/react-intl) - `injectIntl` HoC
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


### 2. Composition of High-order components

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

If you are composing from exactly two HoCs, you can use `R.o`.

It is highly recommended to use just one of `R.o`, `R.compose`, `R.pipe` in the scope of your Application for composing HoCs.

### 3. Branching with `R.ifElse`

Use `R.ifElse` for conditional render.

---

Lets define following components:

```jsx
const Loading = R.always("Loading...");
const Section = ({ content }) => <section>{content}</section>;
```

Than define HoC of conditional render:

```jsx
// Before Ramda:
const Content = (props) => props.loading ? <Loading /> : <Section {...props} />
```

```jsx
// After Ramda:
const withLoading = R.ifElse(R.prop('loading'), Loading)

const Content = withLoading(Section)
```

In this example `withLoading` HoC can be simply reused for all your components with `loading` property.

### 4. Branching with `R.cond`

Use `R.cond` for conditional render.

---

Lets define following components:

```jsx
const Loading = R.always("Loading...");
const Missing = R.always("No results.");
const Section = ({ content }) => <section>{content}</section>;
```

Than define HoC of conditional render:

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

### 5. Mapping properties

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
const Section = ({ heading, children }) => (
  <section>
    <h1>{heading}</h1>
    {children}
  </section>
);


const SectionWithUpperHeading = mapProps(
  (props) => ({ ...props, heading: R.toUpper(props.heading) })
)(Section)
```


## Appendix

### Refactor of pointfree `mapProps`

```js
const mapProps = R.curry((mapping, C) => (props) => <C {...mapping(props)} />);

// Replacing JSX
const mapProps = R.curry((mapping, C) => (props) => React.createElement(C, mapping(props)));

// Introducting curried version of React.createElement
const createElement = R.curryN(2, React.createElement);
const mapProps = R.curry((mapping, C) => (props) => renderComponent(C)(mapping(props)))

// unnest calling of function with R.o
const mapProps = R.curry((mapping, C) => R.o(renderComponent(C), mapping))

// final version pointfree version with R.flip
const mapProps = R.flip(R.useWith(R.o, [renderComponent, R.identity]));
```
