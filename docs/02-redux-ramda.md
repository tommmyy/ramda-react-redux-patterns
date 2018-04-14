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

### 3. Replacing `switch` in reducer

Work in progress

---


### 4. Local State with `filteredReducer` #1

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

To reducer boilerplate we can introduce `filteredReducer` function (see ):

```js
// Before Ramda
const filteredReducer = (cond, reducer) =>
	(state, action) =>
		cond(action) ? reducer(state, action) : state;

const namespaceEquals = (ns) => (action) => action.meta && action.meta.namespace === ns

// ...

const root = combineReducers({
	widgetA: filteredReducer(namespaceEquals("@WIDGET-A"), add),
	widgetB: filteredReducer(namespaceEquals("@WIDGET-B"), add),
})
```
