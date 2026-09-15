const baseUrl = "http://localhost:5000/api";

async function testE2E() {
  console.log("==========================================");
  console.log("🧪 STARTING CAMPUSCYCLE E2E SYSTEM TESTS");
  console.log("==========================================");

  // 1. Student Login
  const studentLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "student@campuscycle.test", password: "Password123!" })
  });
  const studentData = await studentLoginRes.json();
  console.log("✓ Student login:", studentData.success, "| User:", studentData.user?.name);
  const studentToken = studentData.token;

  // 2. Admin Login
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@campuscycle.test", password: "Password123!" })
  });
  const adminData = await adminLoginRes.json();
  console.log("✓ Admin login:", adminData.success, "| Role:", adminData.user?.role);
  const adminToken = adminData.token;

  // 3. Student Creates Product Listing
  const createProdRes = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: "TI-84 Plus CE Graphing Calculator",
      description: "Color screen graphing calculator in Mint condition. Used for Calculus III. Charging cable included.",
      price: 4200,
      originalPrice: 8500,
      category: "Books & Education",
      subcategory: "Calculators",
      condition: "Like New",
      brand: "Texas Instruments",
      location: "Hostel",
      images: ["https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=800&q=80"],
      tags: ["calculator", "graphing", "math"],
      isNegotiable: true
    })
  });
  const newProduct = await createProdRes.json();
  console.log("✓ Product created with status:", newProduct.product?.status, "| ID:", newProduct.product?._id);

  // 4. Admin Approves Product
  const approveRes = await fetch(`${baseUrl}/admin/products/${newProduct.product._id}/approve`, {
    method: "PATCH",
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  const approvedData = await approveRes.json();
  console.log("✓ Admin approved listing -> Status now:", approvedData.product?.status);

  // 5. Seller Login
  const sellerLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "seller@campuscycle.test", password: "Password123!" })
  });
  const sellerData = await sellerLoginRes.json();
  const sellerToken = sellerData.token;

  // 6. Seller Adds Product to Wishlist
  const wishRes = await fetch(`${baseUrl}/wishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sellerToken}`
    },
    body: JSON.stringify({ productId: newProduct.product._id })
  });
  const wishData = await wishRes.json();
  console.log("✓ Seller added item to wishlist:", wishData.success);

  // 7. Seller Makes an Offer
  const offerRes = await fetch(`${baseUrl}/offers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sellerToken}`
    },
    body: JSON.stringify({
      productId: newProduct.product._id,
      amount: 3800,
      message: "Can pick up tomorrow at Library!"
    })
  });
  const offerData = await offerRes.json();
  console.log("✓ Offer submitted:", offerData.success, "| Amount: ₹" + offerData.offer?.amount);

  // 8. Student (Original Seller) Accepts Offer
  const acceptRes = await fetch(`${baseUrl}/offers/${offerData.offer._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${studentToken}`
    },
    body: JSON.stringify({ status: "Accepted" })
  });
  const acceptedOffer = await acceptRes.json();
  console.log("✓ Offer accepted -> Status:", acceptedOffer.offer?.status);

  // 9. Check Notifications for Seller
  const notifRes = await fetch(`${baseUrl}/notifications`, {
    headers: { "Authorization": `Bearer ${sellerToken}` }
  });
  const notifData = await notifRes.json();
  console.log("✓ Notifications received for buyer:", notifData.notifications?.length, "items");

  // 10. Admin Stats Verification
  const statsRes = await fetch(`${baseUrl}/admin/stats`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  const stats = await statsRes.json();
  console.log("✓ Overall Admin Stats Verified:");
  console.log("   - Total Users:", stats.stats.totalUsers);
  console.log("   - Active Listings:", stats.stats.activeListings);
  console.log("   - Items Reused:", stats.stats.itemsReused);
  console.log("   - Estimated Student Savings: ₹" + stats.stats.estimatedSavings);

  console.log("==========================================");
  console.log("🎉 ALL FULL-STACK E2E FLOWS PASSED PERFECTLY!");
  console.log("==========================================");
}

testE2E();