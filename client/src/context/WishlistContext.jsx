import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get("/wishlist");
      if (res.data.success) {
        setWishlist(res.data.wishlist || []);
      }
    } catch (err) {
      console.warn("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [isAuthenticated]);

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some((item) => {
      const pid = item.product?._id || item.product;
      return String(pid) === String(productId);
    });
  };

  const toggleWishlist = async (product) => {
    if (!isAuthenticated) {
      throw new Error("Please log in to save items to your wishlist.");
    }
    const productId = product._id || product;
    const isSaved = isInWishlist(productId);

    if (isSaved) {
      await api.delete(`/wishlist/${productId}`);
      setWishlist((prev) => prev.filter((item) => String(item.product?._id || item.product) !== String(productId)));
      return { action: "removed", message: "Removed from wishlist" };
    } else {
      const res = await api.post("/wishlist", { productId });
      await fetchWishlist();
      return { action: "added", message: "Saved to wishlist!" };
    }
  };

  const removeFromWishlist = async (productId) => {
    await api.delete(`/wishlist/${productId}`);
    setWishlist((prev) => prev.filter((item) => String(item.product?._id || item.product) !== String(productId)));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        refreshWishlist: fetchWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);