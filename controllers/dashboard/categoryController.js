const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;
const categoryModel = require("../../models/categoryModel");
const productModel = require("../../models/productModel");

const add_category = async (req, res) => {
  const form = new formidable.IncomingForm({
    multiples: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing Category Data" });
    }

    const name = fields.name[0];

    if (typeof name !== "string") {
      return res.status(400).json({ error: "Category name must be a string" });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return res.status(400).json({ error: "Category name cannot be empty" });
    }

    const slug = trimmedName.split(" ").join("-");

    // Configuration for Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
      secure: true,
    });

    // Upload an image
    try {
      const uploadResult = await cloudinary.uploader.upload(
        files.image[0].filepath,
        {
          folder: "categories",
        }
      );

      if (uploadResult) {
        const category = await categoryModel.create({
          name: trimmedName,
          slug,
          image: uploadResult.secure_url,
        });

        return res
          .status(200)
          .json({ message: "Category Added Successfully", category });
      } else {
        return res
          .status(500)
          .json({ error: "Error uploading image to Cloudinary" });
      }
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ error: "Error uploading image to Cloudinary" });
    }
  });
};

const get_category = async (req, res) => {
  const { page, searchValue, perPage } = req.query;
  try {
    let skipPage = 0;
    let query = {};

    // Set skipPage value if perPage and page are provided
    if (perPage && page) {
      skipPage = parseInt(perPage) * (parseInt(page) - 1);
    }

    // If searchValue is provided, construct a search query
    if (searchValue) {
      const searchQuery = new RegExp(searchValue, "i");
      query = { name: searchQuery };
    }

    // Fetch categories based on the constructed query
    const categories = await categoryModel
      .find(query)
      .skip(skipPage)
      .limit(parseInt(perPage))
      .sort({ createdAt: -1 });

    // Count total number of categories based on the constructed query
    const totalCategory = await categoryModel.countDocuments(query);

    return res.status(200).json({ categories, totalCategory });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const update_category = async (req, res) => {
  const form = new formidable.IncomingForm({
    multiples: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing Category Data" });
    }

    // Extract necessary fields from request
    const name = fields.name[0];
    const id = fields.id[0];

    try {
      // Validate ID
      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      // Find the category by ID
      let category = await categoryModel.findById(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      const oldCategoryName = category.name;
      
      // Update category name if provided
      if (name) {
        if (typeof name !== "string") {
          return res
            .status(400)
            .json({ error: "Category name must be a string" });
        }
        const trimmedName = name.trim();
        if (!trimmedName) {
          return res
            .status(400)
            .json({ error: "Category name cannot be empty" });
        }
        category.name = trimmedName;
        category.slug = trimmedName.split(" ").join("-");
      }

      // Update category image if provided
      if (files.image) {
        // Configuration for Cloudinary
        cloudinary.config({
          cloud_name: process.env.CLOUD_NAME,
          api_key: process.env.API_KEY,
          api_secret: process.env.API_SECRET,
          secure: true,
        });

        // Upload new image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(
          files.image[0].filepath,
          {
            folder: "categories",
          }
        );

        if (!uploadResult || !uploadResult.secure_url) {
          return res
            .status(500)
            .json({ error: "Error uploading image to Cloudinary" });
        }

        // Delete old image from Cloudinary if exists
        if (category.image && category.image !== uploadResult.secure_url) {
          const public_id = category.image
            .split("/")
            .slice(-1)[0]
            .split(".")[0];
          await cloudinary.uploader.destroy(public_id);
        }

        // Update category with new image URL
        category.image = uploadResult.secure_url;
      }

      // Save updated category
      const updatedCategory = await category.save();

      // Update products with the old category name to the new category name
  
      const newCategoryName = updatedCategory.name;

      await productModel.updateMany(
        { category: oldCategoryName },
        { $set: { category: newCategoryName } }
      );

      return res
        .status(200)
        .json({
          message: "Category Updated Successfully",
          category: updatedCategory,
        });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};



const delete_category = async (req, res) => {
  const form = new formidable.IncomingForm({
    multiples: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing Category Data" });
    }

    const id = fields.id[0];

    try {
      // Validate ID
      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      // Find the category by ID
      const category = await categoryModel.findById(id);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Delete category image from Cloudinary if exists
      if (category.image) {
        cloudinary.config({
          cloud_name: process.env.CLOUD_NAME,
          api_key: process.env.API_KEY,
          api_secret: process.env.API_SECRET,
          secure: true,
        });

        const public_id = category.image
          .split("/")
          .slice(-1)[0]
          .split(".")[0];
        await cloudinary.uploader.destroy(public_id);
      }
      
      await categoryModel.findByIdAndDelete(id);

      await productModel.deleteMany({ category: category.name });

      return res.status(200).json({ message: "Category and associated products deleted successfully" });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
};
  

module.exports = {
  add_category,
  get_category,
  update_category,
  delete_category
};
