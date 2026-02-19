const axios = require('axios');

const url = 'http://localhost:5000/api/payment/create-order';

const data = {
    orderAmount: 1.00,
    customerId: "test_verification_123",
    customerPhone: "9999999999",
    customerName: "Verification User",
    customerEmail: "verify@example.com"
};

console.log("Verifying Backend Payment Endpoint...");

axios.post(url, data)
    .then(res => {
        console.log("Success! Backend Created Order.");
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    })
    .catch(err => {
        console.log("Failed. Writing error to verification-error.json");
        const fs = require('fs');
        let errorData = {};
        if (err.response) {
            errorData = {
                status: err.response.status,
                data: err.response.data
            };
        } else {
            errorData = { message: err.message };
        }
        fs.writeFileSync('verification-error.json', JSON.stringify(errorData, null, 2));
    });
