import React, { Component } from 'react';
import { Section } from './Section';

class Ex04 extends Component {
	render() {
		return (
			<Section className="root" heading="Truth about Ramda" invalidProperty invalidPropertyAgain={1}>
				Ramda rulez!
			</Section>
		);
	}
}

export { Ex04 };
