const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  Date: {
    type: Date,
    required: true,
  },
  productDetail: {
    items: [
      {
        productId: {
          type: String,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);