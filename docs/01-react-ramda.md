# React patterns

## Introduction

### Recap of React in types

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

#### Collections of HoCs

* [acdlite/recompose](https://github.com/acdlite/recompose)
* [kriasoft/eact-decorators](https://github.com/kriasoft/react-decorators)
* [jaredpalmer/react-fns](https://github.com/jaredpalmer/react-fns)
* [klarna/higher-order-components](https://github.com/klarna/higher-order-components)

#### Providing a context of libraries

In many cases is HoC used for adding functionality to your component from certain library via React context API.

See:

* [reactjs/redux](https://github.com/reactjs/redux) - `connect`
* [yahoo/react-intl](https://github.com/yahoo/react-intl) - `injectIntl` HoC
* [erikras/redux-form](https://github.com/erikras/redux-form) - `reduxForm`

## Patterns

### 1. Static Component

```jsx
const Loading = R.always("Loading...");

ReactDOM.render(<Loading />, rootEl) // renders "Loading..."
```


### 2. Composition of High-order components

Instead of nesting calls of HoCs:

```js
connect()(
	reduxForm()(
		injectIntl(Container)
	)
)
```

use composition of functions:

```js
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

### 3. Branching

Lets define following components:

```jsx
const Loading = R.always("Loading...");
const Section = ({ content }) => <section>{content}</section>;
```


```jsx
// Before Ramda:

const Content = (props) => props.loading ? <Loading /> : <Section {...props} />
```

```jsx
// After Ramda:
const withLoading = ifElse(prop('loading'), Loading)

const Content = withLoading(Section)
```

