const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
const helmet = require("helmet");
const compression = require("compression");
const fs = require("fs");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const app = express();

const Product = require("./models/product");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const isAuth = require("./middelware/is-Auth");
const cloudinary = require("./utils/cloudinaryConfig");
const authRoutes = require("./routes/auth");

app.use(cors());

app.use(compression());

const PORT = process.env.PORT || 5000;
const MONGO_URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@e-commerce.d3cd9.mongodb.net/shop?retryWrites=true&w=majority&appName=E-commerce`;

// app.use(multer({ storage: storage, fileFilter: fileFilter }).single("image"));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use("/admin", adminRoutes);
app.use(userRoutes);
app.use(authRoutes);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});

mongoose
  .connect(MONGO_URL)
  .then((result) => {
    app.listen(PORT);
  })
  .catch((err) => {
    console.log(err);
  });