import React from "react";
import ProductCard from "./ProductCard";
import { ProductGridSkeleton } from "./LoadingSkeleton";
import EmptyState from "./EmptyState";

export default function ProductGrid({
  products = [],
  loading = false,
  emptyTitle = "No items found",
  emptyMessage = "No items match your criteria."
}) {
  if (loading) {
    return <ProductGridSkeleton count={8} />;
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        message={emptyMessage}
        actionText="Explore Marketplace"
        actionLink="/products"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}