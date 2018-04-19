import React from 'react';
import PropTypes from 'prop-types';
import * as R from 'ramda';

const SimpleSection = ({ heading, childrenLength, children, ...rest }) => (
	<section {...rest}>
		<h1>{heading}</h1>
		<div>{children}</div>
		<div>{childrenLength}</div>
	</section>
);

SimpleSection.propTypes = {
	heading: PropTypes.string,
	children: PropTypes.string,
	childrenLength: PropTypes.number,
	className: PropTypes.string,
};

const pickByPropTypes = R.useWith(R.pick, [R.o(R.keys, R.prop('propTypes'))]);

//const withValidProps_ = (C) => (props) => <C {...pick(keys(C.propTypes))(props)} />

// Props -> Component -> Element
const renderComponent = R.curryN(2, React.createElement);

// const withValidProps = (C) => (ps) => renderComponent(C, pickByPropTypes(C)(ps))
// const withValidProps = (C) => (ps) => renderComponent(C, pickByPropTypes(C)(ps))
//const Section = withValidProps(SimpleSection);

// mapProps :: (a -> a) -> Component -> Component
// const mapProps = R.curry((mapping, C) => (props) => renderComponent(C)(mapping(props)))
// const mapProps = R.curry((mapping, C) => R.o(renderComponent(C), mapping))
const mapProps = R.flip(R.useWith(R.o, [renderComponent, R.identity]));

const addLength = ({ children }) => ({ childrenLengthgth: R.length(children) })

const computeProps = R.converge(R.merge, [R.nthArg(1), R.call]);

const setDisplayName = (displayName) => R.tap((C) => C.displayName = displayName)

const Section = R.compose(
	setDisplayName("Section"),
	mapProps(
		R.compose(
			R.evolve({ heading: R.toUpper }),
			computeProps(addLength),
			pickByPropTypes(SimpleSection)
		)
	)
)(SimpleSection);


export { Section };