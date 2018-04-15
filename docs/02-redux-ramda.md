# Redux patterns

{% include toc.html %}

## Patterns

### 1. Selectors

```js
const items = (state) => fromEntities.getItems(state.entities)
```

```js
const items = R.o(fromEntities.getItems, R.path(['entities']);

const isLoading = R.path(['ui', 'loading']);
```

### 2. Memoized Selectors

```js
const createSelector = (path) => R.memoizeWith(R.identity, R.path(path))

// ...

const isLoading = createSelector(['ui', 'loading'])
```

### 3. Mapping state

```js
const mapStateToProps = (state, ownProps) => ({
	items: getItems(state, ownProps),
	isLoading: isLoading(state, ownProps),
})
```

```js
const mapStateToProps = R.applySpec({
	items: getItems,
	isLoading: isLoading,
})
```

### 4. Replacing `switch` inside reducer

```js
// Before Ramda:
cosnt initialState = 0;
const counter = (state = initialState, action) => switch (action.type) {
	case "INCREMENT":
		return state + action.payload;
	case "RESET":
		return initialState;
	default:
		return state;
}
```

```js
// After Ramda

// Firstly we introduce `switchReducer` function:

const getActionType = compose(R.path(["type"]), R.nthArg(1))
const getPayload = R.path(["payload"])
const isUndefined = R.o(R.equals("Undefined"), R.type)

const switchReducer = (initialState, rs) => R.compose(
  R.cond,
  R.prepend([isUndefined, R.always(initialState)]),
  R.append([R.T, R.identity]),
  R.map(
    ([type, fn]) => [
      R.compose(R.equals(type), getActionType),
      (state, action) => fn(state, getPayload(action))
    ])
)(rs);

//...

// Than we can write every reducer with following convenient API:
const initialState = 1
const counter = switchReducer(initialState, [
	["INCREMENT", (state, payload) => state + payload],
	["RESET", R.always(initialState)],
]);

// ...

counter(undefined, {}) // 1
counter(3, { type: "INCREMENT", payload: 2 }) // 5
counter(3, { type: "RESET" }) // 1
counter(3, { type: "LOAD_ITEMS" }) // 3
```

### 5. Local State with `filteredReducer`

In examples we will use following reducer:

```js
const add = (state = 0, action) => action.type === "INCREMENT" ? state + 1 : state
```

Lets see following code as an introduction to the problem:

```js

const root = combineReducers({
  widgetA: add,
  widgetB: add
})

// { widgetA: 0, widgetB: 0 }

store.dispatch({ type: "INCREMENT" })
// { widgetA: 1, widgetB: 1 }

```

As we can see, after "INCREMENT" action, every slice of the state, that is managed by `add` reducer, will be incremented.
Following pattern solves the problem of how to target the specific slice of state.

Following most verbose solution uses `action.meta` to determine if the `add` reducer should be called:

```js
const root = combineReducers({
  widgetA: (state, action) =>
    action.meta && action.meta.namespace === "@WIDGET-A" ? add(state, action) : state,
  widgetB:(state, action) =>
    action.meta && action.meta.namespace === "@WIDGET-B" ? add(state, action) : state,
})

// { widgetA: 0, widgetB: 0 }

store.dispatch({ type: "INCREMENT", meta: { namespace: "@WIDGET-A" } })
// { widgetA: 1, widgetB: 0 }


store.dispatch({ type: "INCREMENT", meta: { namespace: "@WIDGET-B" } })
// { widgetA: 1, widgetB: 1 }
```

Next, we introduce `filteredReducer` function:

```js
// Before Ramda
const filteredReducer = (pred, reducer) =>
  (state, action) =>
    pred(action) ? reducer(state, action) : state;

const namespaceEquals = (ns) => (action) => action.meta && action.meta.namespace === ns

// ...

const root = combineReducers({
  widgetA: filteredReducer(namespaceEquals("@WIDGET-A"), add),
  widgetB: filteredReducer(namespaceEquals("@WIDGET-B"), add),
  global: add,
})
```

```js
// After Ramda
const filteredReducer = (pred, reducer) => R.cond([
  [R.flip(pred), reducer],
  [R.T, R.nthArg(0)]
])

const namespaceEquals = R.pathEq(["meta", "namespace"])

// ...

const root = combineReducers({
  widgetA: filteredReducer(namespaceEquals("@WIDGET-A"), add),
  widgetB: filteredReducer(namespaceEquals("@WIDGET-B"), add),
  global: add,
})
```
