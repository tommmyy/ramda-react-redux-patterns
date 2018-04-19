# Redux patterns

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
// Before Ramda
const mapStateToProps = (state, ownProps) => ({
	items: getItems(state, ownProps),
	isLoading: isLoading(state, ownProps),
})
```

```js
// After Ramda
const mapStateToProps = R.applySpec({
	items: getItems,
	isLoading: isLoading,
})
```

### 4. Creating action creators

We want to use following action creators in our application:

```js
reset() // { type": "RESET" }
increment(1) // { payload: 1, type: "INCREMENT" }
fetchItems({ items: "some" })
// => { meta: { page: 0 }, payload: "some", type: "FETCH_ITEMS" }
```

* `reset` is simpliest action creator - it does not use any arguments
* `increment` takes one argument that represents `payload` of the action
* `fetchItems` is the most complex one:
  * computes `payload` from first argument and
  * adds `meta` attribute to the action

---

We can introduce factory functions (`createAction`, `createConstantAction`, `createSimpleAction`), that can encapsulates creation of action creators.

```js
// Before Ramda
const createAction = (type, getPayload, getMeta) =>
  (payload, meta) => ({
    type,
    payload: getPayload(payload),
    meta: getMeta(meta),
  });

const createConstantAction = (type) => createAction(
  type,
  x => undefined,
  () => undefined
);

const createSimpleAction = (type) => createAction(
  type,
  x => x,
  () => undefined
);

// ...

const reset = createConstantAction("RESET")
const increment = createSimpleAction("INCREMENT");
const fetchItems = createAction(
  "FETCH_ITEMS",
  (x) => x.items,
  () => ({ page: 0 })
)
```

*Note:* The above code is not quite ideal. Because call `reset()` gives you:
```js
{"meta": undefined, "payload": undefined, "type": "RESET"}
```

Ramda version bellow solves the problem by filtering out unspecified values.

```js
// After Ramda
const createAction = R.curry(
  (type, getPayload, getMeta) => R.compose(
    R.reject(R.isNil),
    R.applySpec({
      type: R.always(type),
      payload: getPayload,
      meta: getMeta,
    })
  )
);
const createSimpleAction = createAction(R.__, R.identity, R.always(null));
const createContantAction = createAction(R.__, R.always(null), R.always(null));

// ...

const reset = createContantAction("RESET")
const increment = createSimpleAction("INCREMENT");
const fetchItems = createAction("FETCH_ITEMS", R.prop("items"), R.always({ page: 0 }))
```

### 5. Replacing `switch` inside reducer

```js
// Before Ramda:
cosnt initialState = 0;
const counter = (state = initialState, action) =>
  switch (action.type) {
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

// Firstly we introduce `switchReducer` function

const isUndefined = R.o(R.equals("Undefined"), R.type);
const overHead = R.over(R.lensIndex(0));
const toActionTypeEquals = (type) => R.flip(R.whereEq({ type }));

const switchReducer = (rs, initialState) => R.compose(
  R.cond,
  R.prepend([isUndefined, R.always(initialState)]),
  R.append([R.T, R.identity]),
  R.map(overHead(toActionTypeEquals))
)(rs);

//...

// Than we can write every reducer with following convenient API:
const initialState = 1
const counter = switchReducer([
  ["INCREMENT", (state, action) => state + action.payload],
  ["RESET", R.always(initialState)],
], initialState);

// ...

counter(undefined, {}) // 1
counter(3, { type: "INCREMENT", payload: 2 }) // 5
counter(3, { type: "RESET" }) // 1
counter(3, { type: "LOAD_ITEMS" }) // 3
```

### 6. Local State with `filteredReducer`

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
