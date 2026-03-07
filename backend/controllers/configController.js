exports.getConfig = (req, res) => {
    res.status(200).json({
        skipRazorpayVerification: process.env.SKIP_RAZORPAY_VERIFICATION === 'true'
    });
};

