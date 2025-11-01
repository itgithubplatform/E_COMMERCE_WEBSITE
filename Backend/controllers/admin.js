const Product = require("../models/product");
const mongoose = require("mongoose");
const client = require("../utils/redis-Client");
const User = require("../models/user");
const Order = require("../models/order");

exports.PostAddProduct = (req, res, next) => {
  // console.log(req.body.image);
  // console.log(req.file);
  const name = req.body.name;
  const image = req.body.image;
  const category = req.body.category;
  const old_price = req.body.old_price;
  const new_price = req.body.new_price;
  try {
    const product = new Product({
      name: name,
      image: image,
      category: category,
      old_price: old_price,
      new_price: new_price,
    });
    product.save().then((result) => {
      res.json({
        message: "Product Save Successfully",
        data: result,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.PostUploadImage = (req, res, next) => {
  try {
    res.json({
      message: "File Uploaded",
      imageUrl: req.file.path,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    // const cacheValue = await client.get("Admin-AllProducts");
    // if (cacheValue) {
    //   return res.json(JSON.parse(cacheValue));
    // }

    const product = await Product.find({});
    if (!product) {
      return res.status(404).json({ error: err.message });
    }
    // await client.set("Admin-AllProducts", JSON.stringify(product));
    // await client.expire("Admin-AllProducts", 200);
    return res.json(product);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.PostDeleteProduct = (req, res, next) => {
  const productId = req.body.productId;
  try {
    Product.findByIdAndDelete({ _id: productId }).then((product) => {
      if (!product) {
        const error = new Error("Product Not Found!");
        error.statusCode = 404;
        throw error;
      }

      res.json({
        message: "Product Deleted",
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postUpdateProduct = (req, res, next) => {
  const id = req.params.productId;
  const updateName = req.body.name;
  const updateCategory = req.body.category;
  const update_old_price = req.body.old_price;
  const update_new_price = req.body.new_price;
  let updateImage;

  const productId = new mongoose.Types.ObjectId(id);
  try {
    if (req.body.image) {
      updateImage = req.body.image;
    }

    Product.findById({ _id: productId })
      .then((product) => {
        if (!product) {
          const error = new Error("Product Not Found!");
          error.statusCode = 404;
          throw error;
        }
        if (updateName) {
          product.name = updateName;
        }
        if (updateCategory) {
          product.category = updateCategory;
        }
        if (update_old_price) {
          product.old_price = update_old_price;
        }
        if (update_new_price) {
          product.new_price = update_new_price;
        }
        if (updateImage) {
          product.image = updateImage;
        }
        return product.save();
      })
      .then((updateProduct) => {
        res.json({
          message: "Product Updated Successfully",
          data: updateProduct,
        });
      });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postSingleProduct = (req, res, next) => {
  const id = req.body.productId;
  const productId = new mongoose.Types.ObjectId(id);
  try {
    Product.findById({ _id: productId }).then((product) => {
      if (!product) {
        const error = new Error("Product Not Found!");
        error.statusCode = 404;
        throw error;
      }
      res.json({
        message: "product Fetched successfully",
        data: product,
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getUserDetail = (req, res, next) => {
  try {
    User.find({}).then((user) => {
      if (!user) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(200).json(user);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.postDeleteUser = (req, res, next) => {
  const userId = req.body.userId;
  try {
    User.findByIdAndDelete({ _id: userId }).then((result) => {
      if (!result) {
        return res.status(404).json({ error: err.message });
      }
      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.getOrderDetail = (req, res, next) => {
  try {
    Order.find({}).then((order) => {
      if (!order) {
        return res.status(404).json({ error: err.message });
      }

      return res.status(200).json(order);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.postOrderDelete = (req, res, next) => {
  const orderId = req.body.orderId;

  try {
    Order.findByIdAndDelete({ _id: orderId }).then((result) => {
      if (!result) {
        return res.status(404).json({ error: err.message });
      }

      return res.status(200).json(result);
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};