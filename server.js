const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();
const connectDB = require("./utils/db");

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
  path: '/socket.io',
  wssEngine: ['ws','wss'],
  transports: ['websocket', 'polling'],
  allowEI03: true,
});

const allowedOrigins = process.env.CORS_ORIGIN.split(',');

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());

const port = process.env.PORT || 4000;

let allCustomer = [];
let allSeller = [];
let admin = {};

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
  allCustomer = allCustomer.filter((customer) => customer.socketId !== socketId);
  allSeller = allSeller.filter((seller) => seller.socketId !== socketId);
  console.log("User removed:", { allCustomer, allSeller });
};

io.on("connection", (soc) => {
  console.log("A user connected", soc.id);

  soc.on("add_customer", (customerId, userInfo) => {
    addCustomer(customerId, soc.id, userInfo);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
  });

  soc.on("add_seller", (sellerId, userInfo) => {
    addSeller(sellerId, soc.id, userInfo);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
    console.log("Seller added:", allSeller);
  });

  soc.on("add_admin", (adminInfo) => {
    if (adminInfo) {
      delete adminInfo.email;
      delete adminInfo.password;
      admin = adminInfo;
      admin.socketId = soc.id;
      io.emit("activeSeller", allSeller);
      console.log("Admin added:", admin);
    }
  });

  soc.on("send_seller_message", (msg) => {
    const customer = findCustomer(msg.receiverId);
    if (customer !== undefined) {
      soc.to(customer.socketId).emit("seller_message", msg);
      console.log("Seller message sent:");
    } else {
      console.log("Customer not found");
    }
  });

  soc.on("send_customer_message", (msg) => {
    const seller = findSeller(msg.receiverId);
    if (seller !== undefined) {
      soc.to(seller.socketId).emit("customer_message", msg);
      console.log("Customer message sent:");
    } else {
      console.log("Seller not found");
    }
  });

  soc.on("send_message_admin_to_seller", (msg) => {
    const seller = findSeller(msg.receiverId);
    if (seller) {
      soc.to(seller.socketId).emit("received_admin_message", msg);
      console.log("Admin to seller message sent:", msg);
    }
  });

  soc.on("send_message_seller_to_admin", (msg) => {
    if (admin.socketId) {
      soc.to(admin.socketId).emit("received_seller_message", msg);
      console.log("Seller to admin message sent:", msg);
    }
  });

  soc.on("disconnect", () => {
    console.log("User disconnected", soc.id);
    remove(soc.id);
    io.emit("activeSeller", allSeller);
    io.emit("activeCustomer", allCustomer);
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to Hardik's Server");
});

// API Routes
app.use("/api", require("./routes/authRoutes"));
app.use("/api", require("./routes/dashboard/categoryRoutes"));
app.use("/api", require("./routes/dashboard/productRoutes"));
app.use("/api", require("./routes/dashboard/dashboardRoutes"));
app.use("/api", require("./routes/chat/chatRoutes"));
app.use("/api", require("./routes/dashboard/sellerRoutes"));
app.use("/api/home", require("./routes/home/homeRoutes"));
app.use("/api/home", require("./routes/home/cartRoutes"));
app.use("/api", require("./routes/order/orderRoutes"));
app.use("/api/customer", require("./routes/home/customerAuthRoutes"));
app.use("/api", require("./routes/payment/paymentRoutes"));
app.use("/api/search", require("./routes/search/searchRoutes"));

connectDB();

server.listen(port, () => console.log(`Server is running on Port ${port}`));
