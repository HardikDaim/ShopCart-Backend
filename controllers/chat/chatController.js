const sellerModel = require("../../models/sellerModel");
const customerModel = require("../../models/customerModel");
const sellerCustomerModel = require("../../models/chat/sellerCustomerModel");
const sellerCustomerMsgModel = require("../../models/chat/sellerCustomerMessage");
const AdminSellerMessage = require("../../models/chat/AdminSellerMessage");

const get_customers = async (req, res) => {
  const { sellerId } = req.params;
  try {
    const data = await sellerCustomerModel.findOne({ myId: sellerId });
    return res.status(200).json({ customers: data.myFriends });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_sellers = async (req, res) => {
  try {
    const sellers = await sellerModel.find({});
    return res.status(200).json({ sellers });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const seller_admin_message_insert = async (req, res) => {
  const { senderId, receiverId, message, senderName } = req.body;
  try {
    const messageData = await AdminSellerMessage.create({
      senderId,
      receiverId,
      message,
      senderName,
    });
    return res.status(201).json({ message: messageData });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_customer_seller_messages = async (req, res) => {
  const { customerId } = req.params;
  const { id } = req;
  try {
    const messages = await sellerCustomerMsgModel.find({
      $or: [
        {
          $and: [
            {
              receiverId: {
                $eq: customerId,
              },
            },
            {
              senderId: {
                $eq: id,
              },
            },
          ],
        },
        {
          $and: [
            {
              receiverId: {
                $eq: id,
              },
            },
            {
              senderId: {
                $eq: customerId,
              },
            },
          ],
        },
      ],
    });

    const currentCustomer = await customerModel.findById(customerId);
    return res.status(200).json({ currentCustomer, messages });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const seller_message_add = async (req, res) => {
  const { senderId, receiverId, text, name } = req.body;
  const { id } = req;
  try {
    const message = await sellerCustomerMsgModel.create({
      senderId: senderId,
      receiverId: receiverId,
      senderName: name,
      message: text,
    });
    const data = await sellerCustomerModel.findOne({ myId: senderId });
    let myFriends = data.myFriends;
    let index = myFriends.findIndex((f) => f.fdId === receiverId);
    while (index > 0) {
      let temp = myFriends[index];
      myFriends[index] = myFriends[index - 1];
      myFriends[index - 1] = temp;
      index--;
    }
    await sellerCustomerModel.updateOne(
      {
        myId: senderId,
      },
      { myFriends }
    );

    // for customer
    const data1 = await sellerCustomerModel.findOne({ myId: receiverId });
    let myFriends1 = data1.myFriends;
    let index1 = myFriends1.findIndex((f) => f.fdId === senderId);
    while (index1 > 0) {
      let temp1 = myFriends1[index1];
      myFriends1[index1] = myFriends[index1 - 1];
      myFriends1[index1 - 1] = temp1;
      index1--;
    }
    await sellerCustomerModel.updateOne(
      {
        myId: receiverId,
      },
      { myFriends: myFriends1 }
    );
    return res.json({ message });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const add_customer_friend = async (req, res) => {
  const { sellerId, customerId } = req.body;

  try {
    if (sellerId !== "") {
      const seller = await sellerModel.findById(sellerId);
      const customer = await customerModel.findById(customerId);

      // Check and add seller to customer's friends
      const customerDocument = await sellerCustomerModel.findOne({
        myId: customerId,
      });
      if (!customerDocument) {
        await sellerCustomerModel.create({
          myId: customerId,
          myFriends: [
            {
              fdId: sellerId,
              name: seller.shopInfo?.shopName || "Unknown Shop",
              image: seller.image || "",
            },
          ],
        });
      } else {
        const isSellerInFriends = customerDocument.myFriends.some(
          (friend) => friend.fdId === sellerId
        );
        if (!isSellerInFriends) {
          await sellerCustomerModel.updateOne(
            { myId: customerId },
            {
              $push: {
                myFriends: {
                  fdId: sellerId,
                  name: seller.shopInfo?.shopName || "Unknown Shop",
                  image: seller.image || "",
                },
              },
            }
          );
        }
      }

      // Check and add customer to seller's friends
      const sellerDocument = await sellerCustomerModel.findOne({
        myId: sellerId,
      });
      if (!sellerDocument) {
        await sellerCustomerModel.create({
          myId: sellerId,
          myFriends: [
            {
              fdId: customerId,
              name: customer.name || "Unknown Customer",
              image: customer.image || "",
            },
          ],
        });
      } else {
        const isCustomerInFriends = sellerDocument.myFriends.some(
          (friend) => friend.fdId === customerId
        );
        if (!isCustomerInFriends) {
          await sellerCustomerModel.updateOne(
            { myId: sellerId },
            {
              $push: {
                myFriends: {
                  fdId: customerId,
                  name: customer.name || "Unknown Customer",
                  image: customer.image || "",
                },
              },
            }
          );
        }
      }
      const messages = await sellerCustomerMsgModel.find({
        $or: [
          {
            $and: [
              {
                receiverId: {
                  $eq: sellerId,
                },
              },
              {
                senderId: {
                  $eq: customerId,
                },
              },
            ],
          },
          {
            $and: [
              {
                receiverId: {
                  $eq: customerId,
                },
              },
              {
                senderId: {
                  $eq: sellerId,
                },
              },
            ],
          },
        ],
      });
      const MyFriends = await sellerCustomerModel.findOne({ myId: customerId });
      const currentFd = MyFriends.myFriends.find((s) => s.fdId === sellerId);
      return res.status(200).json({
        message: "Friendship added successfully",
        MyFriends: MyFriends.myFriends,
        currentFd,
        messages,
      });
    } else {
      const MyFriends = await sellerCustomerModel.findOne({ myId: customerId });
      return res.status(200).json({
        MyFriends: MyFriends.myFriends,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const customer_message_add = async (req, res) => {
  const { sellerId, text, name, customerId } = req.body;
  try {
    const message = await sellerCustomerMsgModel.create({
      senderId: customerId,
      receiverId: sellerId,
      senderName: name,
      message: text,
    });
    const data = await sellerCustomerModel.findOne({ myId: customerId });
    let myFriends = data.myFriends;
    let index = myFriends.findIndex((f) => f.fdId === sellerId);
    while (index > 0) {
      let temp = myFriends[index];
      myFriends[index] = myFriends[index - 1];
      myFriends[index - 1] = temp;
      index--;
    }
    await sellerCustomerModel.updateOne(
      {
        myId: customerId,
      },
      { myFriends }
    );

    // for seller
    const data1 = await sellerCustomerModel.findOne({ myId: sellerId });
    let myFriends1 = data1.myFriends;
    let index1 = myFriends1.findIndex((f) => f.fdId === customerId);
    while (index1 > 0) {
      let temp1 = myFriends1[index1];
      myFriends1[index1] = myFriends[index1 - 1];
      myFriends1[index1 - 1] = temp1;
      index1--;
    }
    await sellerCustomerModel.updateOne(
      {
        myId: sellerId,
      },
      { myFriends: myFriends1 }
    );
    return res.json({ message });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_admin_messages = async (req, res) => {
  const { receiverId } = req.params;
  const id = "";
  try {
    const messages = await AdminSellerMessage.find({
      $or: [
        {
          $and: [
            {
              receiverId: {
                $eq: receiverId,
              },
            },
            {
              senderId: {
                $eq: id,
              },
            },
          ],
        },
        {
          $and: [
            {
              receiverId: {
                $eq: id,
              },
            },
            {
              senderId: {
                $eq: receiverId,
              },
            },
          ],
        },
      ],
    });
    let currentSeller = {};
    if (receiverId) {
      currentSeller = await sellerModel.findById(receiverId);
    }
    return res.status(200).json({ currentSeller, messages });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const get_seller_messages = async (req, res) => {
  const  receiverId  = "";
  const {id} = req;
  try {
    const messages = await AdminSellerMessage.find({
      $or: [
        {
          $and: [
            {
              receiverId: {
                $eq: receiverId,
              },
            },
            {
              senderId: {
                $eq: id,
              },
            },
          ],
        },
        {
          $and: [
            {
              receiverId: {
                $eq: id,
              },
            },
            {
              senderId: {
                $eq: receiverId,
              },
            },
          ],
        },
      ],
    });
 
    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  add_customer_friend,
  customer_message_add,
  get_customers,
  get_customer_seller_messages,
  seller_message_add,
  get_sellers,
  seller_admin_message_insert,
  get_admin_messages,
  get_seller_messages
};
