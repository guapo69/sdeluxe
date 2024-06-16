const urlParams = new URLSearchParams(window.location.search);

const sales_token = urlParams.get('ts');

if (sales_token) {
	window.localStorage.setItem('kolsquare', JSON.stringify({ sales_token }));
}