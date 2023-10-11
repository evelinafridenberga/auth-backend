const jwt = require("jsonwebtoken");

// module.exports = async (request, response, next) => {
//   try {
//     const token = request.cookies.authToken; // Extract token from cookie
//     const decodedToken = await jwt.verify(token, "RANDOM-TOKEN");
//     const user = await decodedToken;
//     request.user = user;
//     next();
//   } catch (error) {
//     response.status(401).json({
//       error: new Error("Invalid request!"),
//     });
//   }
// };

module.exports = (req, res, next) => {
  const token = req.cookies.authToken; // Extract token from the cookie

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, "SECRET_KEY", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Store user information in the request for further processing
    req.user = decoded;
    next();
  });
};
