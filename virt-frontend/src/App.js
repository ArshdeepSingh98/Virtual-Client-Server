import React, {Component} from 'react';
import styled from 'styled-components';

const Styles = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100vw;
	
	.items {
		width: 80vw;
		height: 250px;
		overflow: scroll;
		display: flex;
		flex-direction: column;
		color: gray;
		margin: 35px 0;
	}
	
	.row {
		width: 100%;
		display: flex;
		justify-content: center;
		margin: 10px 0;
	}
`;

const Product = styled.div`
	display: flex;
	border-bottom: 1px solid #ccc;
`;

class App extends Component{
		
	state = {
  		products: [],
  		product: {name: null,price: null},
  		count: 1
 	}
 	
 	renderProduct = ({id, name}) => <Product key={id}>{id}&nbsp;{name}</Product> 
 	
	componentDidMount() {
		this.interval = setInterval(() => this.getProducts(), 2000);
	}
	
	componentWillUnmount() {
		clearInterval(this.interval);
	}

	getProducts = _=> {
		fetch('http://localhost:4000/products')
			.then(response => response.json())
			.then(response => this.setState({ products: response.data }))
			.catch(err => console.error(err)) 
	}
 
	addProduct = _=> {
		let {product, count} = this.state;
		while(count) {
			fetch(`http://localhost:4000/products/add?name=${product.name}&price=${product.price}`)
				.catch(err => console.error(err))
			count--;
		}
	}

	render() {
		const {products, product, count} = this.state;
		return (
			<Styles>
				<div className='items'>{products.map(this.renderProduct)}</div>
				<div className='row'>
					<input
						type='text'
						placeholder='name'
						value={product.name}
						onChange={e => this.setState({product: { ...product, name: e.target.value}})} />
					<input
						type='number'
						placeholder='price'
						value={product.price}
						onChange={e => this.setState({product: { ...product, price: e.target.value}})} />
				</div>
				<div className='row'>
					<p>Count of entries:&nbsp;</p>
					<input
						type='number'
						placeholder='count'
						value={count}
						onChange={e => this.setState({count: e.target.value})} />
				</div>
				<button onClick={this.addProduct}>Add products</button>
			</Styles>
		);
	}
}

export default App;
