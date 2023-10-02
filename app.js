const dbConnect = require("./db/dbConnect");
dbConnect();
const User = require("./db/userModel");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const auth = require("./auth");
const cors = require("cors");

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.get("/", (request, response, next) => {
  response.json({ message: "Everything ok!" });
  next();
});

app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ message: "Authorized to access me" });
});

app.post("/register", (request, response) => {
  bcrypt
    .hash(request.body.password, 10)
    .then((hashedPassword) => {
      const user = new User({
        email: request.body.email,
        password: hashedPassword,
        tokens: [], // Initialize tokens array
      });

      // Generate and save the JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          userEmail: user.email,
        },
        "RANDOM-TOKEN",
        { expiresIn: "24h" }
      );

      user.tokens.push({ token });

      user.save();
    })
    .then((result) => {
      response.status(201).send({
        message: "User Created Successfully",
        result,
      });
    })
    .catch((error) => {
      response.status(500).send({
        message: "Error creating user",
        error,
      });
    });
});

app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email })

    .then((user) => {
      bcrypt
        .compare(request.body.password, user.password)

        .then((passwordCheck) => {
          if (!passwordCheck) {
            return response.status(400).send({
              message: "Passwords do not match",
              error,
            });
          }

          // Check if the user already has a token with a future expiration date
          const currentToken = user.tokens.find((tokenInfo) => {
            const decodedToken = jwt.decode(tokenInfo.token, {
              complete: true,
            });
            return decodedToken.payload.exp > Date.now() / 1000;
          });

          if (currentToken) {
            // If a valid token exists, use it
            const token = currentToken.token;
            response.status(200).send({
              message: "Login Successful",
              email: user.email,
              token,
            });
          } else {
            // If no valid token exists, generate a new one
            const token = jwt.sign(
              {
                userId: user._id,
                userEmail: user.email,
              },
              "RANDOM-TOKEN",
              { expiresIn: "24h" }
            );

            // Save the token to the user's document
            user.tokens.push({ token });
            user.save().then(() => {
              response.status(200).send({
                message: "Login Successful",
                email: user.email,
                token,
              });
            });
          }
        })

        .catch((error) => {
          response.status(400).send({
            message: "Passwords do not match",
            error,
          });
        });
    })

    .catch((e) => {
      response.status(404).send({
        message: "Email not found",
        e,
      });
    });
});

app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

module.exports = app;
