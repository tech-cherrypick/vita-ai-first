const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createPaymentOrder = async (req, res) => {
    try {
        const { orderAmount, customerId, customerPhone, customerName, customerEmail } = req.body;

        const options = {
            amount: orderAmount * 100, // Amount in paise
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                customerId,
                customerPhone,
                customerName,
                customerEmail
            }
        };

        const order = await razorpay.orders.create(options);

        console.log("Razorpay Order Created:", order);
        res.status(200).json(order);

    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        res.status(500).json({ 
            message: "Error creating payment order", 
            error: error.message 
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            console.log("Payment Verification Successful");
            res.status(200).json({ status: "success", message: "Payment verified successfully" });
        } else {
            console.error("Payment Verification Failed: Signature Mismatch");
            res.status(400).json({ status: "failure", message: "Invalid signature" });
        }

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Error verifying payment", error: error.message });
    }
};
