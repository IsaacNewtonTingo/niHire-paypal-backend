const express = require("express");
const bodyParser = require("body-parser");
const engines = require("consolidate");
const paypal = require("paypal-rest-sdk");
const app = express();
require("dotenv").config();
var nodemailer = require("nodemailer");

app.engine("ejs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let port = process.env.PORT;
let host = process.env.HOST;

app.listen(port, () => {
  console.log(`Server is listening on ${host}:${port}`);
});

paypal.configure({
  mode: "live", //sandbox or live
  client_id:
    "ASjTTYidPyx_Gpq1iTMNCRmqDN2m8INfEt5NA-hNFE4qI6kM-na1TxHIJYcNEQXa0-p-PLnhNDcFuRR5",
  client_secret:
    "EH5gO2714EJf_oiTmeHbpsEcttawQscu-kBi5XzHPFFFXrQBhu50iLKWQMagWXBL7-mpX-sKJ3q-j_DX",
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/paypal", (req, res) => {
  var create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://ni-hire-paypal-backed.herokuapp.com/success",
      cancel_url: "http://ni-hire-paypal-backed.herokuapp.com/cancel",
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "item",
              sku: "item",
              price: "2.00",
              currency: "USD",
              quantity: 1,
            },
          ],
        },
        amount: {
          currency: "USD",
          total: "2.00",
        },
        description: "This is the payment description.",
      },
    ],
  };

  paypal.payment.create(create_payment_json, function (error, payment) {
    if (error) {
      res.redirect("error");
    } else {
      console.log("Create Payment Response");
      console.log(payment);
      res.redirect(payment.links[1].href);
    }
  });
});

app.get("/success", (req, res) => {
  // res.send("Success");
  var PayerID = req.query.PayerID;
  var paymentId = req.query.paymentId;
  var execute_payment_json = {
    payer_id: PayerID,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: "2.00",
        },
      },
    ],
  };

  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.log(error.response);
        res.render("error");
      } else {
        console.log("Get Payment Response");
        console.log(JSON.stringify(payment));
        res.render("success");
      }
    }
  );
});

app.get("/cancel", (req, res) => {
  res.render("cancel");
});

const transporter = nodemailer.createTransport({
  port: 465, // true for 465, false for other ports
  host: "mail.privateemail.com",
  auth: {
    user: "info@pywv.org",
    pass: "@GrOVwyp@Ofni2220",
  },
  secure: true,
});

app.post("/send-email", (req, res) => {
  // const {to,subject,text}=req.body;
  const mailData = {
    from: "info@pywv.org", // sender address
    to: "ape30technologies@gmail.com", // list of receivers
    subject: "Testing nodemailer email sender",
    text: "Ola",
    html: "<b>Hey there! </b>",
  };

  transporter.sendMail(mailData, (err, info) => {
    if (err) console.log(err);
    else {
      res
        .status(200)
        .send({ message: "Email sent", message_id: info.messageId });
    }
  });
});
