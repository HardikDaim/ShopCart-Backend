const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const connectDB = require("./utils/db");
require("dotenv").config();
const socketIo = require("socket.io");
const https = require("https");
const http = require("http");
const fs = require("fs");

// Enable CORS for specific origins
const corsOptions = {
  origin:
    process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:3001"]
      : [
          "https://shop-cart-dashboard.vercel.app",
          "https://shop-cart-ten-chi.vercel.app",
        ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// Initialize HTTPS or HTTP server based on environment
let server;
if (process.env.NODE_ENV === "production") {
  // Load SSL certificate and key for HTTPS
  const privateKey = process.env.PRIVATE_KEY;
  const certificate = process.env.CERTIFICATE;
  const ca = process.env.CA_BUNDLE;
  const credentials = { key: privateKey, cert: certificate, ca: ca };
  console.log(credentials);
  server = https.createServer(credentials, app);
} else {
  server = http.createServer(app);
}

// Initialize socket.io server
const io = socketIo(server, {
  cors: corsOptions,
});

// Your socket.io logic
let allCustomer = [];
let allSeller = [];
let admin = [];

const addCustomer = (customerId, socketId, userInfo) => {
  if (!allCustomer.some((customer) => customer.customerId === customerId)) {
    allCustomer.push({ customerId, socketId, userInfo });
  }
};

const addSeller = (sellerId, socketId, userInfo) => {
  if (!allSeller.some((seller) => seller.sellerId === sellerId)) {
    allSeller.push({ sellerId, socketId, userInfo });
  }
};

const findCustomer = (customerId) => {
  return allCustomer.find((c) => c.customerId === customerId);
};

const findSeller = (sellerId) => {
  return allSeller.find((c) => c.sellerId === sellerId);
};

const remove = (socketId) => {
  allCustomer = allCustomer.filter(
    (customer) => customer.socketId !== socketId
  );
  allSeller = allSeller.filter((seller) => seller.socketId !== socketId);
};

io.on("connection", (soc) => {
  console.log("Socket Server is running");

  soc.on("add_customer", (customerId, userInfo) => {
    addCustomer(customerId, soc.id, userInfo);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
  });

  soc.on("add_seller", (sellerId, userInfo) => {
    addSeller(sellerId, soc.id, userInfo);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
  });

  soc.on("add_admin", (adminInfo) => {
    if (adminInfo) {
      delete adminInfo.email;
      delete adminInfo.password;
      const admin = adminInfo;
      admin.socketId = soc.id;
      io.emit("activeSeller", allSeller);
    }
  });

  soc.on("send_seller_message", (msg) => {
    const customer = findCustomer(msg.receiverId);
    if (customer) {
      soc.to(customer.socketId).emit("seller_message", msg);
    }
  });

  soc.on("send_customer_message", (msg) => {
    const seller = findSeller(msg.receiverId);
    if (seller) {
      soc.to(seller.socketId).emit("customer_message", msg);
    }
  });

  soc.on("send_message_admin_to_seller", (msg) => {
    const seller = findSeller(msg.receiverId);
    if (seller) {
      soc.to(seller.socketId).emit("received_admin_message", msg);
    }
  });

  soc.on("send_message_seller_to_admin", (msg) => {
    if (admin.socketId) {
      soc.to(admin.socketId).emit("received_seller_message", msg);
    }
  });

  soc.on("disconnect", () => {
    remove(soc.id);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
  });
});

// Define your routes
app.get("/", (req, res) => {
  res.send("Welcome to the server");
});

// Define other routes as needed
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productRoutes"));
app.use("/api", require("./routes/chat/chatRoutes"));
app.use("/api", require("./routes/dashboard/sellerRoutes"));
app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api/home", require("./routes/home/cartRoutes"));
app.use("/api", require("./routes/order/orderRoutes"));
app.use("/api/customer", require("./routes/home/customerAuthRoutes"));
app.use("/api", require("./routes/payment/paymentRoutes"));

// Connect to database
connectDB();

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
