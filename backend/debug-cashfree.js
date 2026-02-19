const { Cashfree } = require('cashfree-pg'); // Destructure Cashfree
const { CFEnvironment } = require('cashfree-pg'); // Destructure CFEnvironment
require('dotenv').config();

console.log("Testing Authentication");

try {
    const cashfree = new Cashfree();
    cashfree.XClientId = process.env.CASHFREE_APP_ID;
    cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
    
    // TEST 1: Use String "SANDBOX" (Current failing code)
    // cashfree.XEnvironment = "SANDBOX"; 

    // TEST 2: Use Enum (Proposed fix)
    cashfree.XEnvironment = CFEnvironment.SANDBOX;
    
    console.log("Environment set to:", cashfree.XEnvironment);

    const request = {
        order_amount: 1.00,
        order_currency: "INR",
        customer_details: {
            customer_id: "debug_123",
            customer_phone: "9999999999"
        },
        order_meta: {
            return_url: "https://example.com"
        }
    };

    console.log("Creating Order...");
    cashfree.PGCreateOrder("2023-08-01", request)
        .then(res => console.log("Success:", res.data))
        .catch(err => {
            console.log("Error:", err.message);
            if (err.response) console.log("Response:", err.response.data);
        });

} catch (e) {
    console.log("Setup failed:", e.message);
}
