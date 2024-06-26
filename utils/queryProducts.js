// queryProducts.js
const queryProducts = (products, query) => {
  let currentProducts = [...products];

  const categoryQuery = () => {
    if (query.category) {
      currentProducts = currentProducts.filter(c => c.category === query.category);
    }
    return api;
  };

  const ratingQuery = () => {
    if (query.rating) {
      currentProducts = currentProducts.filter(c =>
        parseInt(query.rating) <= c.rating && c.rating < parseInt(query.rating) + 1
      );
    }
    return api;
  };
  
  const searchQuery = () => {
    if (query.searchValue) {
      currentProducts = currentProducts.filter(p => p.name.toUpperCase().includes(query.searchValue.toUpperCase()));
    }
    return api;
  };

  const priceQuery = () => {
    if (query.lowPrice !== undefined && query.highPrice !== undefined) {
      currentProducts = currentProducts.filter(p => p.price >= query.lowPrice && p.price <= query.highPrice);
    }
    return api;
  };

  const sortByPrice = () => {
    if (query.selectedOption) {
      if (query.selectedOption === 'low-to-high') {
        currentProducts = currentProducts.sort((a, b) => a.price - b.price);
      } else {
        currentProducts = currentProducts.sort((a, b) => b.price - a.price);
      }
    }
    return api;
  };

  const skip = () => {
    const { pageNumber, perPage } = query;
    if (pageNumber && perPage) {
      const skipPage = (parseInt(pageNumber) - 1) * perPage;
      currentProducts = currentProducts.slice(skipPage);
    }
    return api;
  };

  const limit = () => {
    const { perPage } = query;
    if (perPage) {
      currentProducts = currentProducts.slice(0, perPage);
    }
    return api;
  };

  const getProducts = () => {
    return currentProducts;
  };

  const countProducts = () => {
    return currentProducts.length;
  };

  const api = {
    categoryQuery,
    searchQuery,
    ratingQuery,
    priceQuery,
    sortByPrice,
    skip,
    limit,
    getProducts,
    countProducts,
  };

  return api;
};

module.exports = queryProducts;
