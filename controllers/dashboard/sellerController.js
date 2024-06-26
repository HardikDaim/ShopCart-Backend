const sellerModel = require("../../models/sellerModel");

const get_seller_request = async (req, res) => {
  const { page, searchValue, perPage } = req.query;
  const skipPage = parseInt(perPage) * (parseInt(page) - 1);
  try {
    let query = { status: "pending" };

    if (searchValue) {
      // Add search condition to the query
      query = {
        ...query,
        $or: [
          { name: { $regex: searchValue, $options: "i" } }, // case-insensitive search
          { email: { $regex: searchValue, $options: "i" } },
        ],
      };
    }

    const sellers = await sellerModel
      .find(query)
      .skip(skipPage)
      .limit(parseInt(perPage))
      .sort({ createdAt: -1 });
    const totalSeller = await sellerModel.countDocuments(query);

    return res
      .status(200)
      .json({ message: "Seller Info Fetched", sellers, totalSeller });
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};

const get_seller = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const seller = await sellerModel.findById(sellerId);
    res.status(200).json({ message: "Seller Details Fetched", seller });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const seller_status_update = async (req, res) => {
  const { sellerId, status } = req.body;
  try {
    await sellerModel.findByIdAndUpdate(sellerId, { status });
    const seller = await sellerModel.findById(sellerId);
    res
      .status(200)
      .json({ message: "Seller Status Updated Successfully", seller });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

const get_active_sellers = async (req, res) => {
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel
        .find({
          $text: { $search: searchValue },
          status: "active",
        })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      const totalSeller = await sellerModel
        .find({ $text: { $search: searchValue }, status: "active" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    } else {
      const sellers = await sellerModel
        .find({ status: "active" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalSeller = await sellerModel
        .find({ status: "active" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};

const get_deactive_sellers = async (req, res) => {
  let { page, perPage, searchValue } = req.query;
  page = parseInt(page);
  perPage = parseInt(perPage);
  const skipPage = perPage * (page - 1);
  try {
    if (searchValue) {
      const sellers = await sellerModel
        .find({
          $text: { $search: searchValue },
          status: "deactive",
        })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });
      const totalSeller = await sellerModel
        .find({ $text: { $search: searchValue }, status: "deactive" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    } else {
      const sellers = await sellerModel
        .find({ status: "deactive" })
        .skip(skipPage)
        .limit(perPage)
        .sort({ createdAt: -1 });

      const totalSeller = await sellerModel
        .find({ status: "deactive" })
        .countDocuments();
      res.status(200).json({ sellers, totalSeller });
    }
  } catch (error) {
    console.log(error.message);
    return res.status(404).json({ error: error.message });
  }
};

module.exports = {
  get_seller_request,
  get_seller,
  seller_status_update,
  get_active_sellers,
  get_deactive_sellers,
};
