var react = require('react');
var dom = react.DOM;

var cols = [{
		name: 'Name',
		order: null,
		content: function(props) {
			return dom.a({ href: LCBOURL(props.name, props.id), target: "_blank" }, props.name);
		},
		class: 'text'
	}, {
		name: 'Price',
		order: 'price_in_cents',
		content: function(props) {
			return dom.span({
				className: props.has_limited_time_offer || props.has_clearance_sale ? 'sale' : '',
				title: 'Regular ' + formatPrice(props.regular_price_in_cents)
			}, formatPrice(props.price_in_cents));
		},
		class: 'numeric'
	}, {
		name: 'Package',
		order: 'total_package_volume_in_milliliters',
		content: function(props) {
			return props.package;
		},
		class: 'text'
	}, {
		name: 'Package unit',
		order: 'package_unit_volume_in_milliliters',
		content: function(props) {
			return props.package_unit_volume_in_milliliters;
		},
		class: 'numeric'
	}, {
		name: 'Origin',
		order: null,
		content: function(props) {
			return props.origin;
		},
		class: 'text'
	}, {
		name: 'Category',
		order: null,
		content: function(props) {
			return formatCategories(props.secondary_category, props.tertiary_category);
		},
		class: 'text'
	}, {
		name: 'Per Litre',
		order: 'price_per_liter_in_cents',
		content: function(props) {
			return dom.span({
				className: props.has_limited_time_offer || props.has_clearance_sale ? 'sale' : '',
				title: 'Regular ' + formatPrice(props.regular_price_in_cents / props.price_in_cents * props.price_per_liter_in_cents)
			}, formatPrice(props.price_per_liter_in_cents));
		},
		class: 'numeric'
	}, {
		name: 'ABV',
		order: 'alcohol_content',
		content: function(props) {
			return (props.alcohol_content / 100).toFixed(1) + '%';
		},
		class: 'numeric'
	}, {
		name: dom.span({
			title: 'Standard 17.2mL alcohol servings'
		}, 'Servings'),
		order: null,
		content: function(props) {
			return units(props.alcohol_content, props.volume_in_milliliters);
		},
		class: 'numeric'
	}, {
		name: dom.span({
			title: 'Per standard 17.2mL alcohol serving'
		}, 'Per Serving'),
		order: 'price_per_liter_of_alcohol_in_cents',
		content: function(props) {
			return dom.span({
				className: props.has_limited_time_offer || props.has_clearance_sale ? 'sale' : '',
				title: 'Regular ' + formatPrice(costPerServing(props.price_per_liter_of_alcohol_in_cents * props.regular_price_in_cents / props.price_in_cents))
			}, formatPrice(costPerServing(props.price_per_liter_of_alcohol_in_cents)));
		},
		class: 'numeric'
	}, {
		name: dom.span({
			title: 'For sale items, the price that the item is discounted by'
		}, 'Savings'),
		order: 'limited_time_offer_savings_in_cents',
		content: function(props) {
			return dom.span({
				className: props.has_limited_time_offer || props.has_clearance_sale ? 'sale' : ''
			}, props.limited_time_offer_savings_in_cents ?
				formatPrice(props.limited_time_offer_savings_in_cents) :
				'');
		},
		class: 'numeric',
		defaultDesc: true
	}];

function formatPrice(cents) {
	return '$' + (cents / 100).toFixed(2);
}

function formatCategories() {
	return Array.prototype.slice.call(arguments).filter(function(x) { return x; }).join(' - ');
}

function LCBOURL(name, id) {
	return 'http://www.lcbo.com/lcbo/product/' + name.replace(/\W+/g, '-').toLowerCase() + '/' + id;
}

function costPerServing(costPerL) {
	return costPerL * 0.172; // 17.2mL per standard drink, plus the service seems to multiply by 10
}

function units(alcoholContent, mL) {
	return (mL * (alcoholContent / 10000) / 17.2).toFixed(1);
}

var tableRow = react.createClass({
	render: function() {
		var tds = cols.map(function(col) {
			return dom.td({className: col.class}, col.content(this.props));
		}.bind(this));
		return dom.tr({}, tds);
	}
});

var pageSwitcher = react.createClass({
	render: function() {
		return dom.div({
				className: 'page-index'
			},
			dom.span({
				className: 'page-arrow',
				onClick: this.props.changePage.bind(null, -1)
			}, "◀"),
			dom.span({
				className: 'page-index-text'
			}, "Page " + this.props.page + "/" + this.props.maxPage),
			dom.span({
				className: 'page-arrow',
				onClick: this.props.changePage.bind(null, 1)
			}, "▶")
		);
	}
});

var colTitle = react.createClass({
	handleClick: function() {
		if (this.props.col.order)
			this.props.setOrder(
				this.props.order.indexOf(this.props.col.order) === -1 ?
					this.props.col.order + (this.props.col.defaultDesc ? '.desc' : '.asc') :
					this.props.col.order + (this.props.order.indexOf('.asc') === -1 ? '.asc' : '.desc'));
	},
	render: function() {
		return dom.th({
			className: 'col-title'
		}, dom.span({
				className: 'col-title-text' + (this.props.col.order ? ' orderable' : ''),
				onClick: this.handleClick
			}, this.props.col.name),
			this.props.col.order && this.props.order.indexOf(this.props.col.order) !== -1 &&
			dom.span({
				className: 'col-title-arrow' + (this.props.order.indexOf(this.props.col.order) === -1 ? ' selected' : ''),
				onClick: this.handleClick
			}, this.props.order.indexOf('.desc') !== -1 ? "▼" : "▲")
		);
	}
});

module.exports = react.createClass({
	render: function() {
		var ths = cols.map(function(col) {
			return colTitle({
				col: col,
				setOrder: this.props.setOrder,
				order: this.props.order
			});
		}.bind(this));
		var trs = this.props.rows.map(function(obj) {
			return tableRow(obj);
		});
		return dom.div({
				className: 'search-table'
			},
			dom.table({},
				dom.thead({}, ths),
				dom.tbody({}, trs)
			),
			pageSwitcher({
				page: this.props.page,
				changePage: this.props.changePage,
				maxPage: this.props.maxPage
			})
		);
	}
});
