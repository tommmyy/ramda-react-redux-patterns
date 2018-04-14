import { complement } from 'ramda';
import React, { Component } from 'react';
import { Content } from './Content';

class Ex02 extends Component {
	state = { content: null };

	componentDidMount() {
		setInterval(() => this.setState({ content: "Loaded content." }), 2000)
	}

	render() {
		const { content } = this.state;

		return <Content loading={complement(Boolean)(content)} content={content} />;
	}
}

export { Ex02 };
