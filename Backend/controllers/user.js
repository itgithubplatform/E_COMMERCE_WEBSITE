const User = require("../models/user");
const Order = require("../models/order");
const client = require("../utils/redis-Client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Product = require("../models/product");
const { default: mongoose } = require("mongoose");
const product = require("../models/product");
// const nodemailer = require("nodemailer");
// const sendgridTransport = require("nodemailer-sendgrid-transport");
const stripe = require("stripe")(process.env.StripeKey); // Make sure to replace with your actual Stripe secret key

// const transporter = nodemailer.createTransport(
//   sendgridTransport({
//     auth: {
//       api_key: process.env.SENDGRID_API_KEY,
//     },
//   })
// );

exports.postSignUp = (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  try {
    User.findOne({ email: email }).then((user) => {
      if (user) {
        return res.status(400).json({ error: "User already exists" });
      }

      bcrypt.hash(password, 12).then((hashedPassword) => {
        user = new User({
          name: name,
          email: email,
          password: hashedPassword,
          cart: { items: [] },
        });
        user.save().then((user) => {
          res.json({
            message: "user Created Successfully",
            data: user,
          });
        });
      });

      // return transporter.sendMail({
      //   to: email,
      //   from: "shubhammangal740@gmail.com",
      //   subject: "Welcome to our app!", // Subject line
      //   text: "Thank you for registering!", // Plain text body
      //   html: "<h1>Thank you for registering!</h1>", // HTML body
      // });
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Internal Server Error" });
  }
};

exports.Postlogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    User.findOne({ email: email }).then((user) => {
      if (!user) {
        res.status(401).json({ error: "User Does Not Exist" });
      }

      bcrypt.compare(password, user.password).then((isEqual) => {
        if (!isEqual) {
          res.status(401).json({ error: "Password Is Incorrect " });
        }
        const token = jwt.sign(
          {
            email: email,
            userId: user._id.toString(),
          },
          "mostSecretmostSecret",
          { expiresIn: "1h" }
        );

        res.json({
          message: "user Logged in successfully",
          token: token,
          userId: user._id.toString(),
        });
      });
    });
  } catch (err) {
    res.json({ error: "Login Failed " });
  }
};

exports.getFetchAllProdducts = async (req, res, next) => {
  try {
    const cacheValue = await client.get("allProducts");
    if (cacheValue) {
      return res.json(JSON.parse(cacheValue));
    }
    // client.get("allProducts").then((cacheValue) => {
    //   if (cacheValue) {
    //     return res.json(JSON.parse(cacheValue));
    //   }
    // });
    const products = await Product.find({});
    if (!products) {
      const error = new Error("does not have any product");
      error.statusCode = 404;
      throw error;
    }
    await client.set("allProducts", JSON.stringify(products));
    await client.expire("allproducts", 400);

    return res.json(prosucts);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getCategoryProduct = async (req, res, nect) => {
//   category = req.params.category;
//   try {
//     const cacheValue = await client.get(`${category}`);
//     if (cacheValue) {
//       return res.json(JSON.parse(cacheValue));
//     }
//     const products = await Product.find({ category: category });
//     if (!products) {
//       return res.status(404).json({ error: err.message });
//     }
//     await client.set(`${category}`, JSON.stringify(products));
//     await client.expire(`${category}`, 400);
//     return res.json({
//       message: "Category Products Fetched Successfully",
//       data: products,
//     });
//   } catch (err) {
//     if (!err.statusCode) {
//       err.statusCode = 500;
//     }
//     next(err);
//   }
// };

exports.PostSingleProduct = (req, res, next) => {
  const productId = req.body.productId;

  const id = new mongoose.Types.ObjectId(productId);
  try {
    Product.findById(id).then((product) => {
      if (!product) {
        const error = new Error("Product Not Found!");
        error.statusCode = 404;
        throw error;
      }
      res.json({
        message: "Single Product Fetched Successfuly",
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

exports.getNewCollection = async (req, res, next) => {
  let newCollection;
  try {
    const cacheValue = await client.get("newCollection");
    if (cacheValue) {
      return res.json(JSON.parse(cacheValue));
    }
    const product = await Product.find({});
    if (!product) {
      const error = new Error("Product Not Found!");
      error.statusCode = 404;
      throw error;
    }
    newCollection = product.slice(1).slice(-8);
    await client.set("newCollection", JSON.stringify(newCollection));
    await client.expire("newCollection", 400);
    return res.json(newCollection);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPopularSection = async (req, res, next) => {
  let popularInWomen;
  try {
    const cacheValue = await client.get("Popular");
    if (cacheValue) {
      return res.json(JSON.parse(cacheValue));
    }
    const product = await Product.find({ category: "women" });
    if (!product) {
      return res.status(404).json({ error: err.message });
    }
    popularInWomen = product.slice(0, 4);
    await client.set("Popular", JSON.stringify(popularInWomen));
    await client.expire("Popular", 400);
    return res.json(popularInWomen);
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.postCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("user not found!");
      error.statusCode = 404;
      throw error;
    }

    const itemIndex = user.cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex >= 0) {
      // Update quantity if item exists
      user.cart.items[itemIndex].quantity = quantity;
    } else {
      // Add new item to cart
      user.cart.items.push({ productId, quantity });
    }

    await user.save();
    res.json({ message: "Cart updated successfully", cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCartItems = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const user = await User.findById(userId).populate("cart.items.productId");
    if (!user) {
      const error = new Error("user not found!");
      error.statusCode = 404;
      throw error;
    }

    res.json({ cartItems: user.cart.items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCart = async (req, res) => {
  const { productId, quantity } = req.body;
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("user not found!");
      error.statusCode = 404;
      throw error;
    }

    const itemIndex = user.cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex >= 0) {
      if (quantity > 0) {
        user.cart.items[itemIndex].quantity = quantity;
      } else {
        user.cart.items.splice(itemIndex, 1);
      }
    } else {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    await user.save();
    res.json({ message: "Cart updated successfully", cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.DeleteCartItems = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.userId);
  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("user not found!");
      error.statusCode = 404;
      throw error;
    }

    user.cart.items = [];
    await user.save();

    res.json({ message: "Cart cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRelatedProduct = (req, res, next) => {
  try {
    Product.find({}).then((products) => {
      if (!products) {
        const error = new Error("does not have any product");
        error.statusCode = 404;
        throw error;
      }
      res.json({
        message: "All Products Fetch Successfully",
        data: products.slice(0, 4),
      });
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// exports.getCheckOut = (req, res, next) => {
//   const userId = new mongoose.Types.ObjectId("66e6f8e07d2785835d6f23c8");
//   let product;
//   let totalPrice;
//   User.findById(userId)
//     .then((user) => {
//       if (!user) {
//         const error = new Error("user not found!");
//         error.statusCode = 404;
//         throw error;
//       }
//       product = user.cart.items;
//       totalPrice = 0;
//       product.forEach((p) => {
//         Product.findById(p.productId).then((product) => {
//           if (!product) {
//             const error = new Error("does not have any product");
//             error.statusCode = 404;
//             throw error;
//           }
//           totalPrice += p.quantity * product.new_price;
//           return totalPrice;
//         });
//       });
//     })
//     .then((price) => {
//       console.log(price);
//     })
//     .catch((err) => {
//       res.status(500).json({ error: err.message });
//     });
// };

exports.getCheckout = (req, res, next) => {
  const protocol = req.body.protocol;
  const host = req.body.host;
  const userId = req.body.userId;
  try {
    User.findById(userId)
      .populate("cart.items.productId") // Populate cart with product data
      .then((user) => {
        const cartItems = user.cart.items;

        // Transform cart items into a format suitable for Stripe checkout
        const lineItems = cartItems.map((item) => ({
          price_data: {
            currency: "usd",
            product_data: {
              name: item.productId.name,
              description: item.productId.description,
            },
            unit_amount: Math.round(item.productId.new_price * 100), // Amount in cents
          },
          quantity: item.quantity,
        }));

        // Calculate the total price for the cart
        let totalPrice = 0;
        cartItems.forEach((item) => {
          totalPrice += item.quantity * item.productId.new_price;
        });

        // Create a Stripe checkout session
        return stripe.checkout.sessions
          .create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            success_url: `${protocol}//${host}/checkout/success`,
            cancel_url: `${protocol}//${host}/checkout/cancel`,
          })
          .then((session) => {
            // Send the response as JSON to the React frontend
            res.status(200).json({
              products: cartItems.map((item) => ({
                product: {
                  _id: item.productId._id,
                  name: item.productId.title,
                  image: item.productId.imageUrl,
                  new_price: item.productId.new_price,
                  date: item.productId.date,
                },
                quantity: item.quantity,
                totalItemPrice: item.quantity * item.productId.new_price,
              })),
              totalPrice: totalPrice,
              sessionId: session.id,
            });
          });
      });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCheckoutSuccess = (req, res, next) => {
  const cartItems = req.body.cartItems;
  const userId = req.body.userId;
  try {
    const productDetail = {
      items: cartItems.map((item) => ({
        productId: item.product._id, // Mapping _id to productId
        quantity: item.quantity, // Quantity
      })),
    };

    const totalPrice = cartItems.reduce(
      (acc, item) => acc + item.totalItemPrice,
      0
    );

    const newOrder = new Order({
      Date: new Date(),
      productDetail: productDetail,
      userId: userId,
      totalPrice: totalPrice,
    });

    newOrder.save().then((result) => {
      res.json({ message: "Order Saved Succefully" });
    });
    // User.findById(userId).then((user) => {
    //   return transporter.sendMail({
    //     to: user.email,
    //     from: "shubhammangal740@gmail.com",
    //     subject: "Order Confirmation", // Subject line
    //     text: "Thank you for Ordering", // Plain text body
    //     html: "<h1>We will try to send Your Order As Soon As Pssible</h1> </br> </hr> <P> keep Ordering 😊</p> ", // HTML body
    //   });
    // });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// exports.getCheckoutSuccess = (req, res, next) => {
//   const userId = "66e6f8e07d2785835d6f23c8";

//   User.findById(userId)
//     .populate("cart.items.productId")
//     .then((user) => {
//       const products = user.cart.items;

//       /// Map the products and quantities to store in the order
//       const orderItems = products.map((p) => {
//         return {
//           productId: p.productId._id.toString(), // Store the product ID
//           quantity: p.quantity, // Store the quantity
//         };
//       });

//       // Calculate the total price for the cart
//       let totalPrice = 0;
//       products.forEach((item) => {
//         totalPrice += item.quantity * item.productId.new_price;
//       });
//       // console.log(products);
//       const order = new Order({
//         Date: Date.now(),
//         productDetail: {
//           items: orderItems,
//         },
//         userId: "66e6f8e07d2785835d6f23c8",
//         totalPrice: totalPrice,
//       });
//       return order.save();
//     })
//     .then((order) => {
//       // res.redirect("http://localhost:5173/order");
//     })
//     .catch((err) => {
//       res.status(500).json({ error: err.message });
//     });
// };

exports.getOrder = (req, res, next) => {
  const userId = req.body.userId;

  try {
    // Fetch orders for a specific user
    Order.find({ userId: new mongoose.Types.ObjectId(userId) }).then(
      (orders) => {
        if (!orders.length) {
          return res.status(200).json([]); // No orders found for the user
        }

        // Extract unique product IDs from all orders
        const productIds = new Set();
        orders.forEach((order) => {
          order.productDetail.items.forEach((item) => {
            productIds.add(item.productId.toString()); // Store unique product IDs
          });
        });

        // Fetch product details using Promise.all, ensure ObjectId for productId
        return Promise.all(
          Array.from(productIds).map((productId) => {
            // Convert to ObjectId before querying
            return Product.findById(new mongoose.Types.ObjectId(productId));
          })
        ).then((products) => {
          // Create a map of product ID to product details
          const productMap = {};
          products.forEach((product) => {
            if (product) {
              productMap[product._id.toString()] = product;
            }
          });

          // Attach product details to each order
          const ordersWithProducts = orders.map((order) => {
            const itemsWithDetails = order.productDetail.items.map((item) => ({
              ...item.toObject(),
              product: productMap[item.productId.toString()] || null, // Avoid duplication
            }));
            return {
              ...order.toObject(),
              productDetail: {
                items: itemsWithDetails,
              },
            };
          });

          // Send the final response
          res.status(200).json(ordersWithProducts);
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};