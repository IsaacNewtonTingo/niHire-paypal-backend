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
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
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

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ready for message");
    console.log(success);
  }
});

app.post("/send-email", (req, res) => {
  // const {to,subject,text}=req.body;
  const mailData = {
    from: "info@ape30technologies.com", // sender address
    to: "info@ape30technologies.com, newtontingo@gmail.com, ape30technologies@gmail.com", // list of receivers
    subject: "Promotion payment request",
    text: "Respond quickly",
    html: "<b>Update users info please</b>",
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

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

app.post("/send-sms", (req, res) => {
  const { body } = req.body;
  client.messages
    .create({
      body: "User" + body + " has made a promotion payment request",
      from: "+15672299238",
      to: "+254724753175",
    })
    .then((message) => {
      res.status(200).send({ message: "SMS sent", message_id: message.sid });
    });
});
