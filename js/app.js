/*global Vue, todoStorage */

(function (exports) {

	'use strict';

	exports.app = new Vue({
		el: '#pizzas',
		filters: {
			'truncate': function(txt, len) {
				var hasEllipses = txt.length > len;
				return txt.substring(0, len) + (hasEllipses ? '...' : '');
			}
		},
		data: {
			newPizza: { id: -1, name: '', description: '', toppings: []}, // Data for the new pizza form
			selectedPizza: { id: -1, name: '', description: '', toppings: []}, // Data for the selected pizza
			pizzas: [], // List of all pizzas
			toppings: [], // List of all toppings
			newTopping: {name:''}, // Form data for new topping
			apiUrl: 'https://pizzaserver.herokuapp.com',
			searchToppings: '',
			searchPizzas: '',
			pizzasByName: {},			
			pizzasById: {},
			addToppingSelected: -1,
			showInstructions: false,
			showPizzaSuccess: false,
			showToppingSuccess: false
		},

		// On application load, fetch the pizzas and toppings
		ready: function() {
			this.fetchPizzas();
			this.fetchToppings();
		},

		// Computed properties
		computed: {
			validName: function() {
				return this.newPizza.name.length >= 4 && this.newPizza.name.length <= 80;
			},
			validDescription: function() {
				return this.newPizza.description.length >= 4;
			},
			validPizza: function() {
				return this.validName && this.validDescription;
			},
			validTopping: function() {
				return this.newTopping.name.length >= 2;
			},
			uniqueName: function() {
				return typeof this.pizzasByName[this.newPizza.name] == 'undefined';
			},
			selectedPizzaTitle: function() {
				return '#' + this.selectedPizza.id + ' - ' + this.selectedPizza.name;
			}
		},
		
		// Application methods are registered here
		methods: {
			
			toggleInstructions: function() {
				this.showInstructions = !this.showInstructions;
			},
			
			// Fetches toppings list from the API
			fetchToppings: function() {
				
				this.$http.get(this.apiUrl + '/toppings').then(function(response) {
					this.$set('toppings', response.data);
				}).catch(this.handleError);
			},
			
			// Retrieve full list of pizzas from the API and create hashes on name and ID
			fetchPizzas: function() {
				
				this.$http.get(this.apiUrl + '/pizzas').then(function(response) {

					var pizza;
					
					for (var i = 0; i < response.data.length; i++) {
						pizza = response.data[i];
						if (pizza.name)
							this.pizzasByName[pizza.name] = pizza;
						this.pizzasById[pizza.id] = pizza;
					}
						
					this.$set('pizzas', response.data);
				}).catch(this.handleError);
			},
			
			// Add a new pizza using the API
			addPizza: function() {

				var doIt = confirm("Are you sure you want to add a new pizza? Currently there is no way to delete!");
				
				if (!doIt)
					return;
				
				var data = {pizza: {name: this.newPizza.name, description: this.newPizza.description}};
				
				this.searchPizzas = ''; // Clear the filter so the resulting pizza will be displayed
				
				this.newPizza = { name: '', description: ''}; // Reset the pizza form
				
				if (!doIt)
					return;
				
				this.$http.post(this.apiUrl + '/pizzas', data).then(function(response) {
					
					console.log(response);
					console.log(response.data);
					
					this.showPizzaSuccess = true;
					
					response.data.toppings = []; // Populate toppings
					
					this.selectedPizza = this.pizzasById[response.data.id] = response.data;

					console.log(this.selectedPizza);

					this.pizzas.push(response.data);
					
				}).catch(this.handleError);
			},
			
			// Add a new topping using the API
			addTopping: function() {
				
				var doIt = confirm("Are you sure you want to add a new topping? Currently there is no way to delete!");

				if (!doIt)
					return;
	
				this.addingNewTopping = false;
				this.searchToppingss = ''; // Clear the search

				var data = {topping: { name: this.newTopping.name }};
				
				this.newTopping = { name: '' }; // Reset form
								
				this.$http.post(this.apiUrl + '/toppings', data).then(function(response) {
						
					this.showToppingSuccess = true;
					this.toppings.push(response.data);
					
				}).catch(this.handleError);
			},
			
			// Add a new topping to an existing pizza using the API
			addToppingToPizza: function() {
				// We do need to update the selected pizza object with the new topping
				// We don't need to update the .pizzas array... no toppings there yet
				// We don't need to update pizzasById because that is only concerned with description/name
				
				var toppingToAdd = this.toppings[this.addToppingSelected];
				
				var doIt = confirm("Are you sure you want to add this topping? There's no going back!");
				
				if (!doIt)
					return;
					
				var data = {topping_id: toppingToAdd.id};
				
				this.$http.post(this.apiUrl + '/pizzas/' + this.selectedPizza.id + '/toppings', data).then(function(response) {
					
					this.selectedPizza.toppings.push(response.data);
					
				}).catch(this.handleError);
			},
			
			getPizzaToppings: function(pizza_id) {
				
				// Initialize selectedPizza object
				this.selectedPizza = { 
					id: pizza_id,
					name: this.pizzasById[pizza_id].name, 
					description: this.pizzasById[pizza_id].description,
					toppings: [] 
				};
				
				// Retrieve toppings from the API, add them to the selected pizza
				this.$http.get(this.apiUrl + '/pizzas/' + pizza_id + '/toppings').then(function(response) {
					
					this.$set('selectedPizza.toppings', response.data);

				}).catch(this.handleError);
			},
			
			// Generic handler for API failures
			handleError: function(error) {
				console.log(error);
				alert("Sorry, something went wrong.\nPlease contact support for assistance.\n" + error);
			}
		}
	});
})(window);