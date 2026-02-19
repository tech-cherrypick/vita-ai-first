const { Cashfree, CFEnvironment } = require('cashfree-pg');
require('dotenv').config();

// Static configuration removed - using instance-based config in methods

exports.createPaymentOrder = async (req, res) => {
    try {
        const { orderAmount, customerId, customerPhone, customerName, customerEmail } = req.body;

        const cashfree = new Cashfree();
        cashfree.XClientId = process.env.CASHFREE_APP_ID;
        cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
        
        // Map string from env to CFEnvironment enum
        if (process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION') {
            cashfree.XEnvironment = CFEnvironment.PRODUCTION;
        } else {
            cashfree.XEnvironment = CFEnvironment.SANDBOX;
        }
        
        console.log("Cashfree Configured:", { 
            id: cashfree.XClientId ? 'Set' : 'Missing', 
            env: cashfree.XEnvironment 
        });

        const request = {
            order_amount: orderAmount,
            order_currency: "INR",
            customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone,
                customer_name: customerName,
                customer_email: customerEmail
            },
            order_meta: {
                return_url: "https://your-app-url.com/payment/status?order_id={order_id}"
            }
        };

        // Set API Version
        cashfree.XApiVersion = "2023-08-01";

        console.log("Creating Order with Request:", JSON.stringify(request, null, 2));

        // Call PGCreateOrder with just the request object (signature is (request, id, idempotency, options))
        const response = await cashfree.PGCreateOrder(request);
        
        console.log("Order Created Successfully:", response.data);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error creating order:", error.message);
        if (error.response) {
            console.error("API Error Response:", JSON.stringify(error.response.data, null, 2));
            // Send the full error data from Cashfree
            return res.status(500).json({ 
                message: "Error creating payment order", 
                error: error.response.data 
            });
        }
        res.status(500).json({ 
            message: "Error creating payment order", 
            error: error.message 
        });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        res.status(200).json(response.data);
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Error verifying payment", error: error.message });
    }
};
