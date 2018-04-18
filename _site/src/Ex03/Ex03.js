import React, { Component } from 'react';
import { Content } from './Content';

const renderItem = (x) => <div key={x}>{x}!</div>;

class Ex03 extends Component {
	state = { loading: true, items: null };

	componentDidMount() {
		setInterval(() => {
			// this.setState({ items: [], loading: false });
			this.setState({ items:["Pichu", "Pikachu", "Raichu"], loading: false })
		}, 2000);
	}

	render() {
		const { items, loading } = this.state;

		return <Content loading={loading} items={items}>{renderItem}</Content>;
	}
}

export { Ex03 };
