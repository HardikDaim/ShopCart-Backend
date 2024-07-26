const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const productModel = require("../../models/productModel");

// Configuration for Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true,
});

const get_product = async (req, res) => {
  const { productId } = req.params;
  try {
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (fetchError) {
    return res.status(500).json({ error: "Error fetching product" });
  }
};

const add_image = (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(500).json({ error: "Form data parsing error" });
    }

    const { productId } = fields;
    const newImages = files.newImage;

    try {
      let product = await productModel.findById(productId);

      if (!product) {
        console.error("Product not found");
        return res.status(404).json({ error: "Product not found" });
      }

      let { images } = product;

      if (newImages && Array.isArray(newImages)) {
        for (const file of newImages) {
          const result = await cloudinary.uploader.upload(file.filepath, {
            folder: "products",
          });

          if (!result || !result.secure_url) {
            console.error("Image upload failed");
            continue;
          }

          images.push(result.secure_url);
        }
      } else if (newImages) {
        // Handle a single file
        const result = await cloudinary.uploader.upload(newImages.filepath, {
          folder: "products",
        });

        if (!result || !result.secure_url) {
          console.error("Image upload failed");
          return res.status(500).json({ error: "Image upload failed" });
        }

        images.push(result.secure_url);
      }

      await productModel.findByIdAndUpdate(productId, { images });

      product = await productModel.findById(productId);

      res.status(200).json({
        message: "New Image Added Successfully",
        product,
      });
    } catch (error) {
      res.status(500).json({ error: "Error adding new product images" });
    }
  });
};

const update_product = async (req, res) => {
  let {
    name,
    discount,
    productId,
    description,
    stock,
    price,
    shopName,
    brand,
    category,
  } = req.body;

  name = name.trim();
  const slug = name.split(" ").join("-");
  try {
    await productModel.findByIdAndUpdate(productId, {
      name,
      discount,
      productId,
      description,
      stock,
      price,
      shopName,
      brand,
      slug,
      category,
    });
    const product = await productModel.findById(productId);
    return res
      .status(200)
      .json({ message: "Product Updated Successfully", product });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const product_image_update = async (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Error parsing form data:", err);
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const { oldImage, productId } = fields;
    const { newImage } = files;

    try {
      const result = await cloudinary.uploader.upload(newImage[0].filepath, {
        folder: "products",
      });

      if (!result || !result.secure_url) {
        console.error("Image upload failed");
        return res.status(500).json({ error: "Image Upload Failed" });
      }

      let product = await productModel.findById(productId);

      if (!product) {
        console.error("Product not found");
        return res.status(404).json({ error: "Product not found" });
      }

      let { images } = product;
      console.log("images:", images);
      console.log("Image to update:", oldImage);

      const trimmedOldImage = String(oldImage).trim();
      const index = images.findIndex(
        (img) => String(img).trim() === trimmedOldImage
      );

      if (index === -1) {
        console.error("Old image not found in product images");
        return res
          .status(404)
          .json({ error: "Old image not found in product images" });
      }

      images[index] = result.secure_url;
      await productModel.findByIdAndUpdate(productId, { images });

      product = await productModel.findById(productId);

      return res.status(200).json({
        message: "Product Image Updated Successfully",
        product,
      });
    } catch (error) {
      console.error("Error updating product image:", error);
      return res.status(500).json({ error: "Error updating product image" });
    }
  });
};

const getPublicIdFromUrl = (url) => {
  const prefixIndex = url.indexOf("products/");
  if (prefixIndex !== -1) {
    const publicIdWithPrefix = url.substring(prefixIndex + "products/".length);
    console.log(`products/${publicIdWithPrefix.split(".")[0]}`);
    return `products/${publicIdWithPrefix.split(".")[0]}`;
  } else {
    const parts = url.split("/");
    const filename = parts[parts.length - 1];
    console.log(`products/${filename.split(".")[0]}`);
    return `products/${filename.split(".")[0]}`;
  }
};

const delete_product_image = async (req, res) => {
  const { imageUrl, productId } = req.body;
  console.log("Deleting image with URL:", imageUrl);
  console.log("Product ID:", productId);

  const publicId = getPublicIdFromUrl(imageUrl);

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      console.error("Error deleting image from Cloudinary:", result);
      return res
        .status(500)
        .json({ error: "Error deleting image from Cloudinary" });
    }

    await productModel.findByIdAndUpdate(productId, {
      $pull: { images: imageUrl },
    });
    console.log("Product image deleted successfully");
    res.status(200).json({ message: "Product image deleted successfully" });
  } catch (error) {
    console.error("Error deleting product image:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const add_product = async (req, res) => {
  const { id } = req;
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    let {
      name,
      description,
      discount,
      price,
      brand,
      stock,
      shopName,
      category,
    } = fields;

    name = name[0];
    description = description[0];
    discount = discount[0];
    price = price[0];
    brand = brand[0];
    stock = stock[0];
    shopName = shopName[0];
    category = category[0];

    const { images } = files;

    name = name.trim();
    const slug = name.split(" ").join("-");

    try {
      let allImageUrl = [];
      if (Array.isArray(images)) {
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.uploader.upload(images[i].filepath, {
            folder: "products",
          });
          allImageUrl.push(result.secure_url);
        }
      } else {
        const result = await cloudinary.uploader.upload(images.filepath, {
          folder: "products",
        });
        allImageUrl.push(result.secure_url);
      }

      const product = await productModel.create({
        sellerId: id,
        name,
        category: category.trim(),
        shopName,
        slug,
        description: description.trim(),
        stock: parseInt(stock),
        price: parseInt(price),
        discount: parseInt(discount),
        images: allImageUrl,
        brand: brand.trim(),
      });
      return res
        .status(200)
        .json({ message: "Product Added Successfully", product });
    } catch (error) {
      return res.status(500).json({ error: "Failed to Add Product" });
    }
  });
};
const get_products = async (req, res) => {
  const { page, searchValue, perPage } = req.query;
  const { id } = req;

  const pageInt = parseInt(page);
  const perPageInt = parseInt(perPage);
  const skipPage = perPageInt * (pageInt - 1);

  try {
    // Build the query object
    let query = { sellerId: id };
    if (searchValue) {
      query.$or = [
        { name: { $regex: new RegExp(searchValue, "i") } },
        { category: { $regex: new RegExp(searchValue, "i") } },
        { brand: { $regex: new RegExp(searchValue, "i") } },
      ];
    }

    // Fetch products based on the query
    const products = await productModel
      .find(query)
      .skip(skipPage)
      .limit(perPageInt)
      .sort({ createdAt: -1 });

    // Count total number of products based on the query
    const totalProducts = await productModel.countDocuments(query);

    return res.status(200).json({ products, totalProducts });
  } catch (fetchError) {
    console.error("Error fetching products:", fetchError);
    return res.status(500).json({ error: "Error fetching products" });
  }
};

const delete_product = async (req, res) => {
  const { _id } = req.body;
  const productId = _id;
  try {
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    const deletedProduct = await productModel.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res
      .status(200)
      .json({ message: "Product deleted successfully", productId });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const get_discounted_products = async (req, res) => {
  const { page, searchValue, perPage } = req.query;
  const { id } = req;

  const pageInt = parseInt(page);
  const perPageInt = parseInt(perPage);
  const skipPage = perPageInt * (pageInt - 1);

  try {
    let query = { discount: { $gt: 0 } }; // Query for discounted products

    if (searchValue) {
      query.$or = [
        { name: { $regex: new RegExp(searchValue, "i") } },
        { category: { $regex: new RegExp(searchValue, "i") } },
        { brand: { $regex: new RegExp(searchValue, "i") } },
      ];
    }

    const products = await productModel
      .find(query)
      .skip(skipPage)
      .limit(perPageInt)
      .sort({ createdAt: -1 });

    const totalProducts = await productModel.countDocuments(query);

    res.status(200).json({ products, totalProducts });
  } catch (error) {
    console.error("Error fetching discounted products:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  add_product,
  get_products,
  get_product,
  update_product,
  product_image_update,
  delete_product_image,
  add_image,
  delete_product,
  get_discounted_products,
};
