const dbConnect = require("./db/dbConnect");
dbConnect();
const User = require("./db/userModel");
const express = require("express");
const cookieParser = require("cookie-parser");
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

app.use(cookieParser());
app.use((req, res, next) => {
  res.cookie("yourCookieName", "cookieValue", {
    maxAge: 86400000,
    secure: false,
    httpOnly: true,
  });
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
  // Check if the email already exists in the database
  User.findOne({ email: request.body.email })
    .then((existingUser) => {
      if (existingUser) {
        // Email already exists, return an error response
        return response.status(400).send({
          message: "Email already exists",
        });
      }

      // Email is unique, proceed with registration
      bcrypt
        .hash(request.body.password, 10)
        .then((hashedPassword) => {
          const user = new User({
            email: request.body.email,
            password: hashedPassword,
            tokens: [],
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

          user.save().then((result) => {
            // Set a cookie upon successful registration
            response.cookie("userToken", token, {
              maxAge: 86400000, // Cookie expiration time in milliseconds (24 hours)
              httpOnly: true, // Make the cookie accessible only via HTTP(S)
            });

            response.status(201).send({
              message: "User Created Successfully",
              result,
            });
          });
        })
        .catch((error) => {
          response.status(500).send({
            message: "Error creating user",
            error,
          });
        });
    })
    .catch((error) => {
      response.status(500).send({
        message: "Error checking email uniqueness",
        error,
      });
    });
});

app.post("/login", (request, response) => {
  // check if email exists
  User.findOne({ email: request.body.email }).then((user) => {
    if (!user) {
      // Email not found, return an error response
      return response.status(400).send({
        message: "Email not found",
      });
    }

    bcrypt
      .compare(request.body.password, user.password)
      .then((passwordCheck) => {
        if (!passwordCheck) {
          return response.status(400).send({
            message: "Passwords do not match",
          });
        }

        const currentToken = user.tokens.find((tokenInfo) => {
          const decodedToken = jwt.decode(tokenInfo.token, {
            complete: true,
          });
          return decodedToken.payload.exp > Date.now() / 1000;
        });

        if (currentToken) {
          const token = currentToken.token;
          response.cookie("authToken", token, {
            maxAge: 86400000, // 1 day in milliseconds
          });
          response.status(200).send({
            message: "Login Successful",
            email: user.email,
            token,
          });
          console.log("Existing token branch");
        } else {
          console.log("New token branch");
          const token = jwt.sign(
            {
              userId: user._id,
              userEmail: user.email,
            },
            "SECRET_KEY",
            { expiresIn: "24h" }
          );

          user.tokens.push({ token });
          user.save().then(() => {
            // Set the new token in the cookie
            console.log("Token saved and cookie set");
            response.cookie("authToken", token, {
              maxAge: 86400000, // 1 day in milliseconds
              httpOnly: true,
              secure: false, // Change to true for HTTPS
              domain: "localhost", // Set the domain to "localhost"
            });
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
        });
      });
  });
});

app.get("/free-endpoint", (request, response) => {
  response.json({ message: "You are free to access me anytime" });
});

module.exports = app;
