const crypto = require("crypto");
const mongoose = require("mongoose");
const User = require("../models/user");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const bcrypt = require("bcryptjs");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

exports.postResetPassword = (req, res, next) => {
  const email = req.body.email;
  const protocol = req.body.protocol;
  const host = req.body.host;

  crypto.randomBytes(32, (err, Buffer) => {
    if (err) {
      res.status(500).json({ message: "Reset Password Failed" });
    }
    const token = Buffer.toString("hex");

    User.findOne({ email: email })
      .then((user) => {
        if (!user) {
          res.status(404).json({ message: "The user does not exist!" });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        transporter.sendMail({
          to: email,
          from: "shubhammangal740@gmail.com",
          subject: "Reset Password! ",
          html: `
            <p> You Requested a password reset  </p> </br>
            <p> Click this link to set a new password </p> </br>
            <a href = '${protocol}//${host}/reset/${token}'> Link </a>
          `,
        });
      })
      .catch((err) => {
        res.status(500).json({ error: err.message });
      });
  });
};

exports.postNewPassword = (req, res, next) => {
  const confirmPassword = req.body.confirmPassword;
  const newPassword = req.body.newPassword;
  const token = req.body.token;
  const userId = req.body.userId;
  let resetUser;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }
      resetUser = user;
      return bcrypt.hash(newPassword, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then((result) => {
      return res.status(200).json({ result: result });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
};