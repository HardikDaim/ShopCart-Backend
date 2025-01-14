const queryProducts = (productsQuery, query) => {
  const { category, rating, searchValue, lowPrice, highPrice, selectedOption, pageNumber, perPage } = query;

  // Initialize MongoDB query object
  const dbQuery = {};

  // Apply category filter
  if (category) {
    dbQuery.category = category;
  }

  // Apply rating filter
  if (rating) {
    const minRating = parseInt(rating);
    dbQuery.rating = { $gte: minRating, $lt: minRating + 1 };
  }

  // Apply search filter
  if (searchValue) {
    dbQuery.name = { $regex: searchValue, $options: "i" };
  }

  // Apply price filter
  if (lowPrice !== undefined && highPrice !== undefined) {
    dbQuery.price = { $gte: lowPrice, $lte: highPrice };
  }

  // Sort products
  const sortQuery = {};
  if (selectedOption === "low-to-high") {
    sortQuery.price = 1;
  } else if (selectedOption === "high-to-low") {
    sortQuery.price = -1;
  } else {
    sortQuery.createdAt = -1; // Default sorting by newest
  }

  // Pagination
  const skip = perPage ? (parseInt(pageNumber || 1) - 1) * perPage : 0;
  const limit = parseInt(perPage) || 20;

  // Final query
  const queryObject = productsQuery
    .find(dbQuery)
    .sort(sortQuery)
    .skip(skip)
    .limit(limit);

  return queryObject;
};

module.exports = queryProducts;
