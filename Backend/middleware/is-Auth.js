const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Not Authenticated" });
  }

  const token = authHeader.split(" ")[1];

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, "mostSecretmostSecret");
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }

  if (!decodedToken) {
    return res.status(401).json({ message: "Not Authenticated" });
  } else {
    req.userId = decodedToken.userId;
  }
  next();
};