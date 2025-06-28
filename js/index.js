document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const logoutBtn = document.getElementById("logoutBtn");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const productsContainer = document.getElementById("productsContainer");
  const categoryFilter = document.getElementById("categoryFilter");

  // Check user authentication
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser || loggedInUser.role !== "customer") {
    window.location.href = "login.html";
    return;
  }

  // Load initial data
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const categories = [...new Set(products.map(p => p.category))]; // Get unique categories from products

  // Initialize UI
  document.getElementById('customer-view').style.display = 'block';
  populateCategoryFilter(categories);
  displayProducts(products);
  renderCart();
  loadWishlist();
  renderOrderHistory();

  // Event Listeners
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
  });

  placeOrderBtn.addEventListener("click", placeOrder);

  categoryFilter.addEventListener("change", function() {
    const selectedCategory = this.value;
    displayProducts(selectedCategory === "all" ? products : 
                   products.filter(p => p.category === selectedCategory));
  });

  // Event Delegation
  document.body.addEventListener('click', function(e) {
    // Wishlist
    if (e.target.classList.contains('addToWishlist')) {
      addToWishlist(e.target.dataset.id);
    }
    // Cart
    if (e.target.classList.contains('addToCart')) {
      const product = products.find(p => p.id.toString() === e.target.dataset.id);
      if (product) addToCart(product);
    }
    // Remove from cart
    if (e.target.classList.contains('remove-from-cart')) {
      removeFromCart(e.target.dataset.id);
    }
    // Update quantity
    if (e.target.classList.contains('update-quantity')) {
      updateQuantity(e.target.dataset.id, parseInt(e.target.value) || 1);
    }
    // Remove from wishlist
    if (e.target.classList.contains('remove-wishlist')) {
      removeFromWishlist(e.target.dataset.id);
    }
  });

  // Helper Functions
  function populateCategoryFilter(categories) {
    categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(category => {
      if (category) { // Only add if category exists
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
      }
    });
  }
});

// Product Display
function displayProducts(products) {
  const container = document.getElementById("productsContainer");
  container.innerHTML = products.length ? '' : '<p class="text-center">No products found</p>';
  
  products.forEach(product => {
    const avgRating = calculateAverageRating(product.ratings || []);
    const col = document.createElement("div");
    col.className = "col-md-4 mb-4";
    col.innerHTML = `
      <div class="card h-100">
        <img src="${product.image || 'https://via.placeholder.com/200'}" class="card-img-top" alt="${product.name}" style="height: 200px; object-fit: cover;">
        <div class="card-body">
          <h5 class="card-title">${product.name || 'Unnamed Product'}</h5>
          <p class="card-text">$${(product.price || 0).toFixed(2)}</p>
          <p class="card-text text-muted">${product.category || 'Uncategorized'}</p>
          
          <div class="rating-container mb-3" data-product-id="${product.id}">
            <div class="rating mb-1">
              ${renderStars(avgRating)}
              <small class="text-muted">(${product.ratings?.length || 0} reviews)</small>
            </div>
            <div class="rate-product">
              <small class="text-muted">Rate this product:</small>
              <div class="d-flex">
                ${[1, 2, 3, 4, 5].map(i => `
                  <i class="far fa-star rate-star" data-value="${i}" style="cursor: pointer;"></i>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="d-grid gap-2">
            <button class="btn btn-primary addToWishlist" data-id="${product.id}">Wishlist</button>
            <button class="btn btn-success addToCart" data-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
              ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}


// Wishlist Functions
function addToWishlist(productId) {
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const product = products.find(p => p.id.toString() === productId.toString());
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  
  if (product && !wishlist.some(item => item.id.toString() === productId.toString())) {
    wishlist.push(product);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    loadWishlist();
  }
}

function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  wishlist = wishlist.filter(item => item.id.toString() !== productId.toString());
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  loadWishlist();
}

function loadWishlist() {
  const container = document.getElementById("wishlistContainer");
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  
  container.innerHTML = wishlist.length ? wishlist.map(item => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div>
        <img src="${item.image || 'https://via.placeholder.com/50'}" width="50" height="50" class="me-3 rounded" style="object-fit: cover;">
        ${item.name || 'Unnamed Product'} - $${(item.price || 0).toFixed(2)}
      </div>
      <button class="btn btn-sm btn-danger remove-wishlist" data-id="${item.id}">Remove</button>
    </li>
  `).join('') : '<li class="list-group-item">Your wishlist is empty</li>';
}

// Cart Functions
function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function addToCart(product) {
  if (!product || typeof product !== 'object') return;
  
  // Ensure required fields exist
  const validProduct = {
    id: product.id || Date.now(),
    name: product.name || 'Unnamed Product',
    price: typeof product.price === 'number' ? product.price : 0,
    image: product.image || 'https://via.placeholder.com/60',
    quantity: 1 // Default quantity
  };

  const cart = getCart();
  const existingItem = cart.find(item => item.id.toString() === validProduct.id.toString());
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push(validProduct);
  }
  
  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id.toString() !== productId.toString());
  saveCart(cart);
  renderCart();
}

function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find(item => item.id.toString() === productId.toString());
  
  if (item) {
    item.quantity = quantity > 0 ? quantity : 1;
    saveCart(cart);
    renderCart();
  }
}

function renderCart() {
  const container = document.getElementById('cart-container');
  const cart = getCart();
  
  container.innerHTML = cart.length ? `
    <div class="list-group mb-3">
      ${cart.map(item => {
        const price = typeof item.price === 'number' ? item.price : 0;
        const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
        const total = price * quantity;
        
        return `
        <div class="list-group-item">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <img src="${item.image || 'https://via.placeholder.com/60'}" width="60" height="60" class="me-3 rounded" style="object-fit: cover;">
              <div>
                <h6 class="mb-0">${item.name || 'Unnamed Product'}</h6>
                <small>$${price.toFixed(2)} each</small>
              </div>
            </div>
            <div class="d-flex align-items-center">
              <input type="number" value="${quantity}" min="1" 
                     class="form-control update-quantity me-2" data-id="${item.id}" style="width: 70px;">
              <button class="btn btn-outline-danger remove-from-cart" data-id="${item.id}">
                Remove
              </button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Total: $${calculateTotal()}</h5>
      </div>
    </div>
  ` : '<div class="alert alert-info">Your cart is empty</div>';
}

function calculateTotal() {
  return getCart().reduce((total, item) => {
    const price = typeof item.price === 'number' ? item.price : 0;
    const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
    return total + (price * quantity);
  }, 0).toFixed(2);
}

// Order Functions
function placeOrder() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  const cart = getCart();
  
  if (!loggedInUser) {
    alert('Please login to place an order');
    return;
  }

  if (!cart.length) {
    alert('Your cart is empty!');
    return;
  }
  
  const order = {
    id: Date.now().toString(),
    customerId: loggedInUser.id,
    customerName: loggedInUser.name || 'Customer',
    items: [...cart],
    total: calculateTotal(),
    status: 'pending',
    date: new Date().toISOString()
  };
  
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
  
  // Clear cart
  saveCart([]);
  renderCart();
  renderOrderHistory();
  
  alert(`Order #${order.id} placed successfully!`);
}

function renderOrderHistory() {
  const container = document.getElementById('orders-container');
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!container || !loggedInUser) return;
  
  const orders = JSON.parse(localStorage.getItem('orders')) || [];
  const userOrders = orders.filter(order => order.customerId === loggedInUser.id);
  
  container.innerHTML = userOrders.length ? userOrders.map(order => `
    <div class="card mb-3">
      <div class="card-header d-flex justify-content-between">
        <span>Order #${order.id}</span>
        <span class="badge ${getStatusClass(order.status)}">${order.status}</span>
      </div>
      <div class="card-body">
        <p><strong>Date:</strong> ${new Date(order.date).toLocaleString()}</p>
        <p><strong>Total:</strong> $${order.total}</p>
        <h6>Items:</h6>
        <ul class="list-group">
          ${order.items.map(item => {
            const price = typeof item.price === 'number' ? item.price : 0;
            const quantity = typeof item.quantity === 'number' ? item.quantity : 1;
            return `
            <li class="list-group-item">
              <div class="d-flex justify-content-between">
                <div>
                  <img src="${item.image || 'https://via.placeholder.com/40'}" width="40" height="40" class="me-3 rounded" style="object-fit: cover;">
                  ${item.name || 'Unnamed Product'} (${quantity})
                </div>
                <span>$${(price * quantity).toFixed(2)}</span>
              </div>
            </li>`;
          }).join('')}
        </ul>
      </div>
    </div>
  `).join('') : '<div class="alert alert-info">You have no orders yet</div>';
  
  function getStatusClass(status) {
    return {
      'pending': 'bg-warning',
      'confirmed': 'bg-success',
      'rejected': 'bg-danger'
    }[status] || 'bg-secondary';
  }
}


// Add rating functionality:
function calculateAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((total, rating) => total + rating.value, 0);
  return sum / ratings.length;
}

function renderStars(averageRating) {
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  let stars = '';
  for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star text-warning"></i>';
  if (hasHalfStar) stars += '<i class="fas fa-star-half-alt text-warning"></i>';
  for (let i = 0; i < emptyStars; i++) stars += '<i class="far fa-star text-warning"></i>';
  
  return stars;
}

// Add to your existing event delegation:
document.body.addEventListener('click', function(e) {
  // ... existing event handlers ...
  
  // Rate product
  if (e.target.classList.contains('rate-star')) {
    const productId = e.target.closest('.rating-container').dataset.productId;
    const ratingValue = parseInt(e.target.dataset.value);
    rateProduct(productId, ratingValue);
  }
});

function rateProduct(productId, ratingValue) {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!loggedInUser) {
    alert('Please login to rate products');
    return;
  }
  
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const productIndex = products.findIndex(p => p.id.toString() === productId.toString());
  
  if (productIndex === -1) return;
  
  if (!products[productIndex].ratings) {
    products[productIndex].ratings = [];
  }
  
  // Check if user already rated this product
  const existingRatingIndex = products[productIndex].ratings.findIndex(
    r => r.userId === loggedInUser.id
  );
  
  if (existingRatingIndex !== -1) {
    // Update existing rating
    products[productIndex].ratings[existingRatingIndex].value = ratingValue;
  } else {
    // Add new rating
    products[productIndex].ratings.push({
      userId: loggedInUser.id,
      userName: loggedInUser.name,
      value: ratingValue,
      date: new Date().toISOString()
    });
  }
  
  localStorage.setItem("products", JSON.stringify(products));
  displayProducts(products); // Refresh the display
}