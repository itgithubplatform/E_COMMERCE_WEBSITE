const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const userControllers = require("../controllers/user");
const isAuth = require("../middelware/is-Auth");

router.post("/signup", userControllers.postSignUp);

router.post("/login", userControllers.Postlogin);

router.post("/product", userControllers.PostSingleProduct);

router.get("/allproducts", userControllers.getFetchAllProdducts);

router.get("/newcollection", userControllers.getNewCollection);

router.get("/popular", userControllers.getPopularSection);

router.get("/cart", isAuth, userControllers.getCartItems);

router.post("/cart", isAuth, userControllers.postCart);

router.put("/cart", isAuth, userControllers.updateCart);

router.delete("/cart/clear", isAuth, userControllers.DeleteCartItems);

router.post("/related-product", userControllers.getRelatedProduct);

router.post("/checkout", isAuth, userControllers.getCheckout);

router.post("/order", isAuth, userControllers.getCheckoutSuccess);

router.get("/checkout/cancel", isAuth, userControllers.getCheckout);

router.post("/orders", userControllers.getOrder);

module.exports = router;