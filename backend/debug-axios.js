const axios = require('axios');
require('dotenv').config();

const appId = process.env.CASHFREE_APP_ID;
const secretKey = process.env.CASHFREE_SECRET_KEY;

console.log("Testing Credentials via Direct Axios Call");
console.log("AppID:", appId ? appId.substring(0, 5) + "..." : "Missing");
console.log("Secret:", secretKey ? secretKey.substring(0, 5) + "..." : "Missing");

const url = "https://sandbox.cashfree.com/pg/orders";
const headers = {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json"
};

const data = {
    order_amount: 1.00,
    order_currency: "INR",
    customer_details: {
        customer_id: "debug_axios_123",
        customer_phone: "9999999999",
        customer_name: "Debug User",
        customer_email: "debug@example.com"
    },
    order_meta: {
        return_url: "https://example.com"
    }
};

axios.post(url, data, { headers })
    .then(res => {
        console.log("Success! Order Created.");
        console.log("Order ID:", res.data.order_id);
    })
    .catch(err => {
        console.log("Failed.");
        if (err.response) {
            console.log("Status:", err.response.status);
            console.log("Data:", JSON.stringify(err.response.data, null, 2));
        } else {
            console.log("Error:", err.message);
        }
    });
