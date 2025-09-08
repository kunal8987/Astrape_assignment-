// This is a React SPA using Tailwind CSS with Signup/Login, Product Listing with filters, Cart with add/remove,
// and cart persistence after logout (using localStorage).
// To run:
// 5. Run `npm start`

import React, { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:5000/api";

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [userLoggedIn, setUserLoggedIn] = useState(!!token);

  // Pages: "auth", "listing", "cart"
  const [page, setPage] = useState(userLoggedIn ? "listing" : "auth");

  // Auth form state
  const [authMode, setAuthMode] = useState("login"); // or "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Products and filters
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    minPrice: "",
    maxPrice: "",
  });

  // Cart: array of { item, quantity }
  const [cart, setCart] = useState(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Notification message
  const [notification, setNotification] = useState(null);

  // Show notification helper
  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // Fetch products with filters
  const fetchProducts = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      if (filters.search) params.append("name", filters.search);

      const res = await fetch(`${API_BASE}/items?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      notify("Error loading products", "error");
    }
  }, [filters]);

  useEffect(() => {
    if (page === "listing") fetchProducts();
  }, [page, fetchProducts]);

  // Handle login/signup submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (authMode === "signup" && password !== confirmPassword) {
      notify("Passwords do not match", "error");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/auth/${authMode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify(data.message || "Auth failed", "error");
        return;
      }
      setToken(data.token);
      setUserLoggedIn(true);
      setPage("listing");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      notify("Logged in successfully");
      // Optionally sync cart with server here
    } catch {
      notify("Network error", "error");
    }
  };

  // Logout
  const logout = () => {
    setToken(null);
    setUserLoggedIn(false);
    setPage("auth");
    notify("Logged out");
  };

  // Add item to cart
  const addToCart = (item) => {
    setCart((c) => {
      const idx = c.findIndex((ci) => ci.item._id === item._id);
      if (idx >= 0) {
        const newCart = [...c];
        newCart[idx].quantity += 1;
        return newCart;
      }
      return [...c, { item, quantity: 1 }];
    });
    notify(`Added "${item.name}" to cart`);
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart((c) => c.filter((ci) => ci.item._id !== id));
  };

  // Update quantity in cart
  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCart((c) => {
      const newCart = [...c];
      const idx = newCart.findIndex((ci) => ci.item._id === id);
      if (idx >= 0) {
        newCart[idx].quantity = qty;
      }
      return newCart;
    });
  };

  // Calculate total price
  const totalPrice = cart.reduce(
    (sum, ci) => sum + ci.item.price * ci.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 to-purple-600 text-white p-5 shadow-lg flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <svg
            className="w-10 h-10 drop-shadow"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
            <circle cx="7" cy="21" r="1" />
            <circle cx="17" cy="21" r="1" />
          </svg>
          <h1 className="text-3xl font-extrabold tracking-tight drop-shadow">E-Shop</h1>
        </div>
        <nav className="space-x-4">
          {userLoggedIn ? (
            <>
              <button
                onClick={() => setPage("listing")}
                className={`hover:underline transition ${
                  page === "listing" ? "underline font-bold" : ""
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setPage("cart")}
                className={`relative hover:underline transition ${
                  page === "cart" ? "underline font-bold" : ""
                }`}
              >
                Cart
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-3 bg-pink-500 border-2 border-white rounded-full text-xs w-6 h-6 flex items-center justify-center font-bold shadow">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                onClick={logout}
                className="bg-red-600 px-4 py-1 rounded hover:bg-red-700 transition font-semibold shadow"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setPage("auth")}
              className={`hover:underline transition ${
                page === "auth" ? "underline font-bold" : ""
              }`}
            >
              Login / Register
            </button>
          )}
        </nav>
      </header>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl text-white text-lg font-semibold z-50 transition-all ${
            notification.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          {notification.msg}
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow container mx-auto p-6">
        {page === "auth" && (
          <div className="max-w-md mx-auto bg-white/90 p-8 rounded-2xl shadow-2xl border border-blue-100">
            <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-700">
              {authMode === "login" ? "Login" : "Register"}
            </h2>
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              <input
                type="text"
                placeholder="Username"
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full border-2 border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
              />
              {authMode === "register" && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full border-2 border-blue-200 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              )}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-500 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-600 font-bold text-lg shadow transition"
              >
                {authMode === "login" ? "Login" : "Register"}
              </button>
            </form>
            <p className="mt-6 text-center text-gray-600">
              {authMode === "login" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthMode("register")}
                    className="text-blue-600 underline font-semibold"
                  >
                    Signup
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="text-blue-600 underline font-semibold"
                  >
                    Login
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {page === "listing" && (
          <>
            <div className="mb-6 flex flex-wrap gap-3 items-center bg-white/80 p-4 rounded-xl shadow border border-blue-100">
              <input
                type="text"
                placeholder="Search products..."
                className="border-2 border-blue-200 p-2 rounded-lg flex-grow min-w-[150px] focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
              />
              <select
                className="border-2 border-blue-200 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="">All Categories</option>
                <option value="electronics">Electronics</option>
                <option value="clothing">Clothing</option>
                <option value="books">Books</option>
              </select>
              <input
                type="number"
                placeholder="Min Price"
                className="border-2 border-blue-200 p-2 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, minPrice: e.target.value }))
                }
                min="0"
              />
              <input
                type="number"
                placeholder="Max Price"
                className="border-2 border-blue-200 p-2 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, maxPrice: e.target.value }))
                }
                min="0"
              />
              <button
                onClick={fetchProducts}
                className="bg-gradient-to-r from-blue-600 to-purple-500 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-600 font-bold shadow transition"
              >
                Filter
              </button>
            </div>
            {products.length === 0 ? (
              <p className="text-center text-gray-500 text-lg mt-10">No products found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="bg-white/90 rounded-2xl shadow-xl p-5 flex flex-col border border-blue-100 hover:scale-105 hover:shadow-2xl transition"
                  >
                    <img
                      src={
                        p.imageUrl ||
                        `https://placehold.co/300x200?text=${encodeURIComponent(
                          p.name
                        )}`
                      }
                      alt={p.name}
                      className="h-40 object-cover rounded-xl mb-3 border border-blue-100"
                    />
                    <h3 className="font-bold text-lg text-blue-700">{p.name}</h3>
                    <p className="text-gray-600 flex-grow">{p.description}</p>
                    <p className="font-semibold text-purple-700 mt-2 text-lg">
                      ${p.price}
                    </p>
                    <p className="text-sm text-gray-500 mb-2">
                      Category: {p.category || "N/A"}
                    </p>
                    <button
                      onClick={() => addToCart(p)}
                      className="mt-3 bg-gradient-to-r from-blue-600 to-purple-500 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-600 font-bold shadow transition"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === "cart" && (
          <>
            <h2 className="text-3xl font-extrabold mb-6 text-blue-700">Your Cart</h2>
            {cart.length === 0 ? (
              <p className="text-center text-gray-500 text-lg mt-10">Your cart is empty.</p>
            ) : (
              <>
                <div className="space-y-5">
                  {cart.map(({ item, quantity }) => (
                    <div
                      key={item._id}
                      className="bg-white/90 rounded-xl shadow-lg p-5 flex items-center space-x-6 border border-blue-100"
                    >
                      <img
                        src={
                          item.imageUrl ||
                          `https://placehold.co/100x100?text=${encodeURIComponent(
                            item.name
                          )}`
                        }
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-xl border border-blue-100"
                      />
                      <div className="flex-grow">
                        <h3 className="font-bold text-blue-700">{item.name}</h3>
                        <p className="text-gray-600">{item.description}</p>
                        <p className="font-semibold text-purple-700">
                          Price: ${item.price}
                        </p>
                      </div>
                      <div className="flex flex-col items-center space-y-2">
                        <label className="font-semibold text-gray-700">
                          Qty:{" "}
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) =>
                              updateQuantity(item._id, parseInt(e.target.value))
                            }
                            className="w-16 border-2 border-blue-200 rounded-lg p-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                        </label>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="bg-red-600 text-white px-4 py-1 rounded-lg hover:bg-red-700 font-semibold shadow transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-right font-extrabold text-2xl text-blue-700">
                  Total: ${totalPrice.toFixed(2)}
                </div>
                <button
                  onClick={() => notify("Checkout not implemented", "error")}
                  className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-blue-600 font-bold shadow-lg transition"
                >
                  Checkout
                </button>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
