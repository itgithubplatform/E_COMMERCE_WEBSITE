const express = require("express");

const router = express.Router();

const adminControllers = require("../controllers/admin");
const upload = require("../utils/upload");

router.get("/allproducts", adminControllers.getAllProducts);

router.post(
  "/addproduct",
  upload.single("image"),
  adminControllers.PostAddProduct
);

router.post("/image", upload.single("image"), adminControllers.PostUploadImage);

router.post("/product", adminControllers.postSingleProduct);

router.post("/deleteproduct", adminControllers.PostDeleteProduct);

router.post(
  "/addproduct/:productId",
  upload.single("image"),
  adminControllers.postUpdateProduct
);

router.get("/user-detail", adminControllers.getUserDetail);

router.post("/user-delete", adminControllers.postDeleteUser);

router.get("/order-detail", adminControllers.getOrderDetail);

router.post("/order-delete", adminControllers.postOrderDelete);

module.exports = router;