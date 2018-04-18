import React from 'react';
import { always, prop, ifElse  } from 'ramda';

const Loading = always("Loading...");
const Section = ({ content }) => <section>{content}</section>;

// Component -> Component
const withLoading = ifElse(prop('loading'), Loading)

// const Content = (props) => props.loading ? <Loading /> : <Section {...props} />
const Content = withLoading(Section)

export { Content };
