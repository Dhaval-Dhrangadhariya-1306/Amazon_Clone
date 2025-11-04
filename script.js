/******************************************************************************
 * amazon-clone - script.js
 * Final working script: products, search, cart, wishlist, auth (LocalStorage)
 ******************************************************************************/

/* ----------------------- PRODUCT DATA ------------------------- */
const products = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 1999,
    img: "https://www.leafstudios.in/cdn/shop/files/1_a43c5e0b-3a47-497d-acec-b4764259b10e_1024x1024.png?v=1750486829",
    category: "electronics",
    rating: 4.5,
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 2999,
    img: "https://www.gonoise.com/cdn/shop/files/1_c95e5561-4f66-413d-b143-42d31821e554.webp?v=1721392308",
    category: "accessories",
    rating: 4.3,
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    price: 1499,
    img: "https://avstore.in/cdn/shop/files/1.AVStore-JBL-PartyBox-Encore-Essential-Portable-Bluetooth-Speaker-With-Light-Display-Front-Angled-View-Hero.jpg?v=1682414405",
    category: "electronics",
    rating: 4.2,
  },
  {
    id: 4,
    name: "Gaming Mouse",
    price: 999,
    img: "https://www.shutterstock.com/image-photo/blue-light-computer-gaming-mouse-260nw-723052858.jpg",
    category: "electronics",
    rating: 4.1,
  },
  {
    id: 5,
    name: "Backpack",
    price: 1299,
    img: "https://images.unsplash.com/photo-1509762774605-f07235a08f1f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YmFja3BhY2t8ZW58MHx8MHx8fDA%3D&fm=jpg&q=60&w=3000",
    category: "fashion",
    rating: 4.6,
  },
  {
    id: 6,
    name: "Sunglasses",
    price: 799,
    img: "https://img.freepik.com/free-psd/elegant-black-gold-sunglasses-stylish-accessory_191095-79382.jpg?semt=ais_hybrid&w=740&q=80",
    category: "fashion",
    rating: 4.0,
  },
];

/* ------------------- LOCALSTORAGE HELPERS ------------------- */
function getLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}
function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* --------------------------- STATE --------------------------- */
let cart = getLocal("cart", []);
let wishlist = getLocal("wishlist", []);
let users = getLocal("users", []);
let loggedUser = getLocal("loggedInUser", null);

/* ----------------------- DOM SHORTCUTS ----------------------- */
const productListEl = document.getElementById("product-list");
const wishlistContainerEl = document.getElementById("wishlist-container");
const cartContainerEl = document.getElementById("cart-container");
const checkoutItemsEl = document.getElementById("checkout-items");
const searchBoxEl = document.getElementById("search-box");
const globalCartCountEls = document.querySelectorAll("#cart-count");

/* ------------------- NAVBAR / USER UI ------------------- */
function updateUserInNav() {
  const elem = document.getElementById("user-link");
  if (!elem) return;
  if (loggedUser && loggedUser.name) {
    elem.textContent = `Logout (${loggedUser.name})`;
    elem.href = "#";
    elem.onclick = (e) => {
      e.preventDefault();
      logout();
    };
  } else {
    elem.textContent = "Login";
    elem.href = "login.html";
    elem.onclick = null;
  }
}
updateUserInNav();

/* ------------------- CART UTILITIES ------------------- */
function saveCart() {
  setLocal("cart", cart);
  updateCartCount();
}
function updateCartCount() {
  const count = cart.reduce((s, i) => s + (i.qty || 0), 0);
  document
    .querySelectorAll("#cart-count")
    .forEach((el) => (el.textContent = count));
}
function addToCartById(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const existing = cart.find((i) => i.id === id);
  if (existing) existing.qty += 1;
  else
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, img: p.img });
  saveCart();
  showToast(`${p.name} added to cart`);
  renderCartPage();
}
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCartPage();
}
function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCartPage();
}

/* ------------------- WISHLIST UTILITIES ------------------- */
function saveWishlist() {
  setLocal("wishlist", wishlist);
}
function toggleWishlistById(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  const exists = wishlist.find((i) => i.id === id);
  if (exists) {
    wishlist = wishlist.filter((i) => i.id !== id);
    saveWishlist();
    showToast(`${p.name} removed from wishlist`);
  } else {
    wishlist.push({ id: p.id, name: p.name, price: p.price, img: p.img });
    saveWishlist();
    showToast(`${p.name} added to wishlist`);
  }
  renderProductList(currentFilter, currentSearch);
  renderWishlistPage();
}
function moveWishlistToCart(id) {
  const w = wishlist.find((i) => i.id === id);
  if (!w) return;
  toggleWishlistById(id);
  addToCartById(id);
  renderWishlistPage();
}

/* ------------------- SEARCH & FILTER ------------------- */
let currentFilter = "all";
let currentSearch = "";
function displayProducts(items, containerId = "product-list") {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  items.forEach((p) => {
    const inWishlist = wishlist.some((w) => w.id === p.id);
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.img}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">₹${p.price}</p>
      <div class="actions">
        <button class="add-to-cart" data-id="${p.id}">Add to Cart</button>
        <button class="add-to-wishlist ${
          inWishlist ? "wish-active" : ""
        }" data-id="${p.id}">
          ${inWishlist ? "♥ Wishlisted" : "♡ Add to Wishlist"}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
  container
    .querySelectorAll(".add-to-cart")
    .forEach((btn) => (btn.onclick = () => addToCartById(+btn.dataset.id)));
  container
    .querySelectorAll(".add-to-wishlist")
    .forEach(
      (btn) => (btn.onclick = () => toggleWishlistById(+btn.dataset.id))
    );
}
function renderProductList(filter = "all", search = "") {
  currentFilter = filter;
  currentSearch = search?.toLowerCase?.() || "";
  let filtered = products.slice();
  if (filter !== "all")
    filtered = filtered.filter((p) => p.category === filter);
  if (currentSearch)
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(currentSearch)
    );
  displayProducts(filtered, "product-list");
}
if (searchBoxEl) {
  searchBoxEl.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    renderProductList(currentFilter, q);
  });
}

/* ------------------- PAGE RENDERERS ------------------- */
if (productListEl) renderProductList();
function renderWishlistPage() {
  const el = document.getElementById("wishlist-container");
  if (!el) return;
  el.innerHTML = wishlist.length ? "" : `<p>Your wishlist is empty.</p>`;
  wishlist.forEach((w) => {
    el.innerHTML += `
      <div class="wishlist-item">
        <img src="${w.img}" alt="${w.name}">
        <div class="item-info">
          <p>${w.name}</p>
          <p>₹${w.price}</p>
          <div>
            <button onclick="moveWishlistToCart(${w.id})">Move to Cart</button>
            <button onclick="toggleWishlistById(${w.id})">Remove</button>
          </div>
        </div>
      </div>
    `;
  });
}
if (wishlistContainerEl) renderWishlistPage();
function renderCartPage() {
  const el = document.getElementById("cart-container");
  if (!el) return;
  el.innerHTML = "";
  if (!cart.length) {
    el.innerHTML = `<p>Your cart is empty.</p>`;
    updateCartCount();
    return;
  }
  let total = 0;
  cart.forEach((item) => {
    total += item.price * item.qty;
    el.innerHTML += `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.name}">
        <div class="item-info">
          <p>${item.name}</p>
          <p>Price: ₹${item.price}</p>
          <p>Qty:
            <button onclick="changeQty(${item.id},-1)">-</button>
            <span>${item.qty}</span>
            <button onclick="changeQty(${item.id},1)">+</button>
          </p>
          <p>Subtotal: ₹${item.price * item.qty}</p>
          <button class="remove-btn" onclick="removeFromCart(${
            item.id
          })">Remove</button>
        </div>
      </div>
    `;
  });
  el.innerHTML += `<h3>Total: ₹${total}</h3><button class="checkout-btn" onclick="proceedToCheckout()">Proceed to Checkout</button>`;
  updateCartCount();
}
if (cartContainerEl) renderCartPage();

/* ------------------- AUTH & CHECKOUT ------------------- */
function registerUser(name, email, password) {
  const usersLocal = getLocal("users", []);
  if (usersLocal.find((u) => u.email === email)) {
    showToast("Email already registered. Please login.", true);
    return false;
  }
  usersLocal.push({ name, email, password });
  setLocal("users", usersLocal);
  showToast("Registration successful! Please login.");
  setTimeout(() => (window.location = "login.html"), 1200);
  return true;
}

function loginUser(email, password) {
  const usersLocal = getLocal("users", []);
  if (!usersLocal.length) {
    alert("No users found. Please create your account first.");
    return false;
  }
  const user = usersLocal.find((u) => u.email === email);
  if (!user) {
    alert("Account not found. Please create your account first.");
    return false;
  }
  if (user.password !== password) {
    showToast("Incorrect password", true);
    return false;
  }
  setLocal("loggedInUser", user);
  loggedUser = user;
  updateUserInNav();
  showToast(`Welcome back, ${user.name}!`);
  setTimeout(() => (window.location = "index.html"), 1000);
  return true;
}

function logout() {
  localStorage.removeItem("loggedInUser");
  loggedUser = null;
  updateUserInNav();
  showToast("Logged out");
  setTimeout(() => (window.location = "index.html"), 700);
}

function proceedToCheckout() {
  const logged = getLocal("loggedInUser", null);
  if (!logged) {
    showToast("Please login to continue", true);
    setTimeout(() => (window.location = "login.html"), 700);
    return;
  }
  window.location = "checkout.html";
}

/* ------------------- UTIL ------------------- */
function showToast(msg, error = false) {
  const toast = document.createElement("div");
  toast.textContent = msg;
  toast.style = `
    position: fixed; top:20px; right:20px;
    background:${error ? "#e74c3c" : "#2ecc71"};
    color:white; padding:10px 15px; border-radius:6px;
    z-index:9999; font-weight:600; box-shadow:0 2px 6px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 1500);
}

/* ------------------- INIT ------------------- */
updateCartCount();
if (wishlistContainerEl) renderWishlistPage();
if (cartContainerEl) renderCartPage();
if (checkoutItemsEl) renderCheckoutPage ? renderCheckoutPage() : null;

/* small helper used only in checkout case (renderCheckoutPage function) */
function renderCheckoutPage() {
  const el = document.getElementById("checkout-items");
  if (!el) return;
  const logged = getLocal("loggedInUser", null);
  if (!logged) {
    document.getElementById("checkout-msg").innerText =
      "Please login before checkout!";
    return;
  }
  const cartLocal = getLocal("cart", []);
  if (!cartLocal.length) {
    el.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }
  let total = 0;
  el.innerHTML = "";
  cartLocal.forEach((i) => {
    total += i.price * i.qty;
    el.innerHTML += `<p>${i.name} x ${i.qty} — ₹${i.price * i.qty}</p>`;
  });
  document.getElementById(
    "checkout-msg"
  ).innerHTML = `<strong>Total:</strong> ₹${total} <br><button class="checkout-btn" onclick="window.location='payment.html'">Proceed to Payment</button>`;
}
/******************************************************************************
 * Payment + Success Redirect (Safe Patch)
 ******************************************************************************/

function processPayment(event) {
  event.preventDefault();

  // Get selected payment method
  const selectedMethod = document.querySelector(
    'input[name="payment"]:checked'
  );
  if (!selectedMethod) {
    alert("Please select a payment method!");
    return;
  }

  // Optional: simulate processing delay
  showToast(`Processing ${selectedMethod.value} payment...`);
  setTimeout(() => {
    // Simulate payment success
    showToast("Payment successful!");
    localStorage.removeItem("cart"); // clear the cart
    window.location.href = "success.html"; // redirect to success page
  }, 1000);
}
