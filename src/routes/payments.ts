import express from "express";
import Stripe from "stripe";

const router = express.Router();

// ✅ Correct Stripe init (NO apiVersion)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * 🔥 CREATE PAYMENT INTENT
 */
router.post("/create-intent", async (req, res) => {
  try {
    // You can pass amount from frontend later
    const amount = 50000; // $500.00 (Stripe uses cents)

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",

      // Optional but useful
      metadata: {
        source: "storeinvites",
      },
    });

    return res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("❌ Stripe create-intent error:", err.message);

    return res.status(500).json({
      error: err.message || "Payment intent failed",
    });
  }
});

export default router;