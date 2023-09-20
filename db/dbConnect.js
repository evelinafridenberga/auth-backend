// external imports
const mongoose = require("mongoose");
const express = require("express");
const app = express();
require("dotenv").config();

async function dbConnect() {
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
    );
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    next();
  });
  mongoose
    .connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Successfully connected!");
    })
    .catch((error) => {
      console.log("Unable to connect");
      console.error(error);
    });
}

module.exports = dbConnect;
