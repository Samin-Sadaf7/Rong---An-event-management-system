const events = require("../../models/eventModel");
const sellers = require("../../models/sellerModel");
const Order = require("../../models/Order");
const rongWallet = require("../../models/rongWallet");
const sellerWallet = require("../../models/sellerWallet");
const { Cursor } = require("mongoose");
const {uuid} = require("uuid");
require("dotenv").config();
const stripe = require("stripe")("sk_test_51OWhCHHyOH1NkwnJnqpUHUTeQ5dAptRdHOYOBNZa7SQgoPPJ8dYc6ODfAXKGe8FG4OWWG5zLkfgDm4UbRlream2d00serB8OL2");
const getEvents = async (req, res) => {
  try {
    const all_events = await events.find().sort({createdAt: -1});
    res.json(all_events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const searchEvents = async (req, res) => {
    const searchKey = req.params.key;
    if(searchKey){
      console.log(searchKey);
    }
    try {
      // Searching events based on various fields using regular expressions
      const searched_events = await events.find({
        $or: [
          { name: { $regex: searchKey, $options: 'i' } }, 
          { category: { $regex: searchKey, $options: 'i' } },
          { description: { $regex: searchKey, $options: 'i' } },
          { orgName: { $regex: searchKey, $options: 'i' } },
        ],
      });
      console.log(searched_events);
      res.json(searched_events);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  
const getEventbyID = async (req, res)=>{
  const eventId = req.params.id;

  try {
    const event = await events.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createOrder = async (req, res) =>{
  try {
    const { eventId, eventTitle, eventOrganizer, UserId, totalAmount, numberOfTickets, isPaid, sellerId} = req.body;
    const ticketId = generateRandomId(); // Function to generate a random ticket ID
    const eventDate = new Date().toISOString().split('T')[0]; // Get current date
    console.log(req.body);
    const event = await events.findById(eventId);
    if(!event){
      res.status(404).send({message: 'No such event exist'});
    }
    await events.updateOne(
      { _id: eventId }, 
      { $set: { stock: event.stock - numberOfTickets } } 
    );
    // Create the order in the database
    const newOrder = new Order({
      eventId,
      eventTitle,
      sellerId,
      eventOrganizer,
      ticketId,
      eventDate,
      UserId,
      isPaid,
      totalAmount,
      numberOfSeats:numberOfTickets,
    });

    await newOrder.save(); // Save the new order
    console.log(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
}

function generateRandomId() {
  return Math.random().toString(36).substr(2, 11); // Random alphanumeric ID
}
const getSellerbyEventId = async (req, res) => {
  const eventId = req.params.id;
  console.log("Event ID:", eventId); 

  try {
    const event = await events.findById(eventId);
    console.log("Event:", event); 

    if (!event) res.json({ message: 'No such event exists' });

    const sellerId = event.sellerId;
    console.log("Seller ID:", sellerId); 

    const seller = await sellers.findById(sellerId);
    console.log("Seller:", seller); 

    if (!seller) {
      res.status(404).json({ message: "Seller is not found" });
    }

    res.json(seller);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const deleteOrder = async (req, res) => {
  const orderId = req.params.id;
  console.log("From Order:", orderId);
  try {
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

const initiatePayment = async (req, res) => {

  try{
  const {eventTitle, unitPrice, orderId, platformCharge,numberOfTickets,totalAmount,eventId, sellerId, customerId, discount} = req.body;
  console.log(req.body);
  const discountAmount = Math.ceil(unitPrice*discount/100);
  const transactionId = generateRandomId();
  console.log(transactionId);
  const line_items = [
    {
      price_data: {
        currency: "BDT",
        product_data: {
          name: eventTitle,
        },
        unit_amount: (unitPrice-discountAmount)*100,
      },
      quantity: numberOfTickets,
    },
    {
      price_data: {
        currency: "BDT",
        product_data: {
          name: "Platform Charge",
        },
        unit_amount: platformCharge*100,
      },
      quantity: 1,
    },
  ];
  const session = await stripe.checkout.sessions.create({
    payment_method_types:["card"],
    line_items:line_items, 
    mode:"payment", 
    success_url:`http://localhost:5173/payment/success/${transactionId}`,
    cancel_url:"http://localhost:5173/payment/cancel",
  });
  const newRongWallet = new rongWallet({
    sellerId,
    customerId,
    transactionId,
    eventId, 
    totalAmount,
    platformCharge,
    numberOfTickets
  });
  await newRongWallet.save();
  await Order.updateOne(
    { _id: orderId }, 
    { $set: { isPaid: true } } 
  );
  const newWallet = new sellerWallet({
    sellerId,
    customerId,
    transactionId,
    eventId,
    amount: unitPrice*numberOfTickets,
    numberOfTickets
});
await newWallet.save();
  res.json({id:session.id, lineItems:line_items});
  }catch(error){
    res.status(500).json({error:error});
  }
  
}


module.exports = {getEvents, searchEvents, getEventbyID, createOrder , getSellerbyEventId,initiatePayment, deleteOrder};