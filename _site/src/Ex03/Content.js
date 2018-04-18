import React from 'react';
import { T, always, prop, cond, isEmpty, map, o } from 'ramda';

const Loading = always("Loading...");
const Missing = always("No results.");

const Section = ({ items, children }) => <section>{map(children)(items)}</section>;

// Component -> Component
const Content = cond([
  [prop('loading'), Loading],
  [o(isEmpty, prop('items')), Missing],
  [T, Section],
]);

export { Content };
