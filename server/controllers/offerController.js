import { Offer } from "../models/Offer.js";
import { Product } from "../models/Product.js";
import { Notification } from "../models/Notification.js";
import { Transaction } from "../models/Transaction.js";

// @desc    Get offers for logged-in user (as buyer or seller)
// @route   GET /api/offers
export const getOffers = async (req, res, next) => {
  try {
    const { role } = req.query; // 'buyer' or 'seller' or all
    const query = {};

    if (role === "buyer") {
      query.buyer = req.user._id;
    } else if (role === "seller") {
      query.seller = req.user._id;
    } else {
      query.$or = [{ buyer: req.user._id }, { seller: req.user._id }];
    }

    const offers = await Offer.find(query)
      .populate("product", "title price primaryImage status seller")
      .populate("buyer", "name college profilePhoto")
      .populate("seller", "name college profilePhoto")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Make an offer on a product
// @route   POST /api/offers
export const createOffer = async (req, res, next) => {
  try {
    const { productId, amount, message } = req.body;

    if (!productId || !amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid offer amount." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Rule: Seller cannot offer on own product
    if (String(product.seller) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "You cannot make an offer on your own listing." });
    }

    // Rule: Sold products cannot receive offers
    if (product.status === "SOLD") {
      return res.status(400).json({ success: false, message: "This product has already been sold." });
    }

    // Check existing pending offer by this buyer
    const existingOffer = await Offer.findOne({
      product: product._id,
      buyer: req.user._id,
      status: { $in: ["Pending", "Countered"] }
    });

    let offer;
    if (existingOffer) {
      existingOffer.amount = Number(amount);
      existingOffer.status = "Pending";
      existingOffer.message = message || existingOffer.message;
      offer = await existingOffer.save();
    } else {
      offer = await Offer.create({
        product: product._id,
        buyer: req.user._id,
        seller: product.seller,
        amount: Number(amount),
        message: message || ""
      });
    }

    // Notify seller
    await Notification.create({
      recipient: product.seller,
      sender: req.user._id,
      type: "OFFER",
      title: "New Price Offer",
      message: `${req.user.name} offered ₹${amount} for "${product.title}"`,
      link: `/dashboard`
    });

    res.status(201).json({
      success: true,
      message: "Offer sent successfully to the seller!",
      offer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update offer status (Accept, Reject, Counter)
// @route   PATCH /api/offers/:id
export const updateOfferStatus = async (req, res, next) => {
  try {
    const { status, counterAmount } = req.body;
    const offer = await Offer.findById(req.params.id)
      .populate("product")
      .populate("buyer", "name")
      .populate("seller", "name");

    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found." });
    }

    const isSeller = String(offer.seller._id) === String(req.user._id);
    const isBuyer = String(offer.buyer._id) === String(req.user._id);

    if (!isSeller && !isBuyer && req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Unauthorized action." });
    }

    if (status === "Accepted") {
      offer.status = "Accepted";
      await offer.save();

      // Reserve product
      if (offer.product) {
        offer.product.status = "RESERVED";
        await offer.product.save();

        // Create transaction record
        await Transaction.create({
          product: offer.product._id,
          buyer: offer.buyer._id,
          seller: offer.seller._id,
          agreedPrice: offer.amount,
          exchangeLocation: offer.product.location || "Main Campus"
        });
      }

      await Notification.create({
        recipient: offer.buyer._id,
        sender: req.user._id,
        type: "OFFER_ACCEPTED",
        title: "Offer Accepted!",
        message: `Great news! ${offer.seller.name} accepted your offer of ₹${offer.amount} for "${offer.product?.title}".`,
        link: `/messages`
      });
    } else if (status === "Rejected") {
      offer.status = "Rejected";
      await offer.save();

      await Notification.create({
        recipient: isSeller ? offer.buyer._id : offer.seller._id,
        sender: req.user._id,
        type: "OFFER_REJECTED",
        title: "Offer Declined",
        message: `Offer of ₹${offer.amount} was declined.`,
        link: `/products/${offer.product?._id}`
      });
    } else if (status === "Countered") {
      if (!counterAmount || Number(counterAmount) <= 0) {
        return res.status(400).json({ success: false, message: "Please enter a valid counter amount." });
      }
      offer.status = "Countered";
      offer.counterAmount = Number(counterAmount);
      await offer.save();

      await Notification.create({
        recipient: offer.buyer._id,
        sender: req.user._id,
        type: "OFFER_COUNTERED",
        title: "Counter Offer Received",
        message: `${offer.seller.name} countered your offer with ₹${counterAmount} for "${offer.product?.title}".`,
        link: `/dashboard`
      });
    }

    res.json({
      success: true,
      message: `Offer updated to ${status}.`,
      offer
    });
  } catch (error) {
    next(error);
  }
};