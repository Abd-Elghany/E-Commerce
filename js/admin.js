// js/admin.js
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  if (!user || user.role !== "admin") {
      alert("Access denied. Admins only.");
      window.location.href = "login.html";
      return;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
  });

  // Initialize all data
  loadProducts();
  loadCategories();
  renderAdminOrders();

  // Add Product Form Submission
  const addProductForm = document.getElementById("addProductForm");
  if (addProductForm) {
      addProductForm.addEventListener("submit", function (e) {
          e.preventDefault();
          
          // Get form values
          const name = document.getElementById("productName").value.trim();
          const image = document.getElementById("productImage").value.trim();
          const category = document.getElementById("productCategory").value.trim();
          const price = parseFloat(document.getElementById("productPrice").value.trim());
          const description = document.getElementById("productDesc").value.trim();
          const stock = parseInt(document.getElementById("productStock").value.trim());

          // Validate inputs
          if (!name || !image || !category || isNaN(price) || isNaN(stock)) {
              alert("Please fill in all required fields with valid values");
              return;
          }

          // Create new product
          const newProduct = {
              id: Date.now(),
              name,
              image,
              category,
              price,
              description,
              stock,
              ratings: []
          };

          // Save to localStorage
          const products = JSON.parse(localStorage.getItem("products")) || [];
          products.push(newProduct);
          localStorage.setItem("products", JSON.stringify(products));

          // Reset form and reload products
          this.reset();
          loadProducts();
          
          // Hide modal
          const modal = bootstrap.Modal.getInstance(document.getElementById("addProductModal"));
          if (modal) modal.hide();
      });
  }

  // Add Category
  document.getElementById("addCategoryForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const categories = JSON.parse(localStorage.getItem("categories")) || [];

      const categoryName = document.getElementById("categoryName").value.trim();
      if (categories.includes(categoryName)) {
          alert("Category already exists!");
          return;
      }

      categories.push(categoryName);
      localStorage.setItem("categories", JSON.stringify(categories));
      this.reset();
      loadCategories();
      bootstrap.Modal.getInstance(document.getElementById("addCategoryModal")).hide();
  });

  // Event delegation for product actions
  document.getElementById("productsContainer").addEventListener("click", function(e) {
      if (e.target.classList.contains("btn-danger") && e.target.textContent === "Delete") {
          const id = parseInt(e.target.getAttribute("data-id"));
          deleteProduct(id);
      }
      
      if (e.target.classList.contains("edit-product")) {
          const id = parseInt(e.target.getAttribute("data-id"));
          editProduct(id);
      }
  });

  // Event delegation for category delete buttons
  document.getElementById("categoriesList").addEventListener("click", function(e) {
      if (e.target.classList.contains("btn-danger") && e.target.textContent === "Delete") {
          const index = parseInt(e.target.getAttribute("data-index"));
          deleteCategory(index);
      }
  });

  // Event delegation for order action buttons
  document.getElementById("admin-orders-container").addEventListener("click", function(e) {
      if (e.target.classList.contains("order-action-btn")) {
          const orderId = e.target.getAttribute("data-order-id");
          const action = e.target.getAttribute("data-action");
          updateOrderStatus(orderId, action);
      }
  });

  function loadProducts() {
    const container = document.getElementById("productsContainer");
    container.innerHTML = "";

    const products = JSON.parse(localStorage.getItem("products")) || [];
    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    if (products.length === 0) {
      container.innerHTML = '<div class="col-12"><p>No products found</p></div>';
      return;
    }

    products.forEach((product) => {
      const avgRating = calculateAverageRating(product.ratings || []);
      const card = document.createElement("div");
      card.className = "col-md-4 mb-3";
      card.innerHTML = `
        <div class="card h-100">
          <img src="${product.image}" class="card-img-top" height="200" style="object-fit:cover;">
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text">${product.description}</p>
            <p class="card-text">Category: ${product.category}</p>
            <p class="card-text">Price: $${product.price.toFixed(2)}</p>
            <p class="card-text">Stock: ${product.stock}</p>
            <div class="rating mb-2">
              ${renderStars(avgRating)}
              <small class="text-muted">(${product.ratings?.length || 0} reviews)</small>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-danger btn-sm" data-id="${product.id}">Delete</button>
              <button class="btn btn-warning btn-sm edit-product" data-id="${product.id}">Edit</button>
            </div>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function deleteProduct(id) {
      if (!confirm("Are you sure you want to delete this product?")) return;
      
      const products = JSON.parse(localStorage.getItem("products")) || [];
      const updatedProducts = products.filter((p) => p.id !== id);
      localStorage.setItem("products", JSON.stringify(updatedProducts));
      loadProducts();
  }

  function loadCategories() {
    const list = document.getElementById("categoriesList");
    const categorySelect = document.getElementById("productCategory");
    const editCategorySelect = document.getElementById("editProductCategory");
    list.innerHTML = "";
    categorySelect.innerHTML = "";
    editCategorySelect.innerHTML = "";

    const categories = JSON.parse(localStorage.getItem("categories")) || [];

    if (categories.length === 0) {
      list.innerHTML = '<li class="list-group-item">No categories found</li>';
      return;
    }

    categories.forEach((cat, index) => {
      const item = document.createElement("li");
      item.className = "list-group-item d-flex justify-content-between align-items-center";
      item.innerHTML = `
          ${cat}
          <button class="btn btn-sm btn-danger" data-index="${index}">Delete</button>
      `;
      list.appendChild(item);

      // Add to select dropdowns
      categorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
      editCategorySelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
  
  function deleteCategory(index) {
      if (!confirm("Are you sure you want to delete this category?")) return;
      
      const categories = JSON.parse(localStorage.getItem("categories")) || [];
      categories.splice(index, 1);
      localStorage.setItem("categories", JSON.stringify(categories));
      loadCategories();
  }
  
  function renderAdminOrders() {
      const adminOrdersContainer = document.getElementById('admin-orders-container');
      if (!adminOrdersContainer) return;
      
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      
      adminOrdersContainer.innerHTML = `
          <div class="table-responsive">
              ${orders.length === 0 ? 
                  '<div class="alert alert-info">No orders yet</div>' : 
                  `
                  <table class="table table-striped">
                      <thead>
                          <tr>
                              <th>Order #</th>
                              <th>Customer</th>
                              <th>Date</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Items</th>
                              <th>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${orders.map(order => `
                              <tr>
                                  <td>${order.id}</td>
                                  <td>${order.customerId}</td>
                                  <td>${new Date(order.date).toLocaleDateString()}</td>
                                  <td>$${order.total}</td>
                                  <td><span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span></td>
                                  <td>
                                      ${order.items.map(item => `
                                          <div class="d-flex align-items-center mb-2">
                                              <img src="${item.image}" alt="${item.name}" width="30" height="30" class="me-2">
                                              <span>${item.name} (${item.quantity})</span>
                                          </div>
                                      `).join('')}
                                  </td>
                                  <td>
                                      ${order.status === 'pending' ? `
                                          <div class="btn-group">
                                              <button class="btn btn-sm btn-success order-action-btn" data-order-id="${order.id}" data-action="confirmed">Confirm</button>
                                              <button class="btn btn-sm btn-danger order-action-btn" data-order-id="${order.id}" data-action="rejected">Reject</button>
                                          </div>
                                      ` : ''}
                                  </td>
                              </tr>
                          `).join('')}
                      </tbody>
                  </table>
                  `
              }
          </div>
      `;
  }

  function getStatusBadgeClass(status) {
      switch(status) {
          case 'confirmed': return 'bg-success';
          case 'rejected': return 'bg-danger';
          case 'pending': return 'bg-warning';
          default: return 'bg-secondary';
      }
  }

  function updateOrderStatus(orderId, newStatus) {
      const orders = JSON.parse(localStorage.getItem('orders')) || [];
      const orderIndex = orders.findIndex(order => order.id === orderId);
      
      if (orderIndex !== -1) {
          orders[orderIndex].status = newStatus;
          localStorage.setItem('orders', JSON.stringify(orders));
          renderAdminOrders();
      }
  }

  // Edit Product Functionality
  function editProduct(id) {
      const products = JSON.parse(localStorage.getItem("products")) || [];
      const product = products.find(p => p.id === id);
      
      if (!product) return;
    
      // Populate edit form
      document.getElementById("editProductId").value = product.id;
      document.getElementById("editProductName").value = product.name;
      document.getElementById("editProductImage").value = product.image;
      document.getElementById("editProductCategory").value = product.category;
      document.getElementById("editProductPrice").value = product.price;
      document.getElementById("editProductDesc").value = product.description;
      document.getElementById("editProductStock").value = product.stock;
    
      // Show modal
      const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
      editModal.show();
  }
  
  // Edit Product Form Submission
  document.getElementById("editProductForm").addEventListener("submit", function(e) {
      e.preventDefault();
      
      const id = parseInt(document.getElementById("editProductId").value);
      const name = document.getElementById("editProductName").value.trim();
      const image = document.getElementById("editProductImage").value.trim();
      const category = document.getElementById("editProductCategory").value.trim();
      const price = parseFloat(document.getElementById("editProductPrice").value);
      const description = document.getElementById("editProductDesc").value.trim();
      const stock = parseInt(document.getElementById("editProductStock").value);
    
      const products = JSON.parse(localStorage.getItem("products")) || [];
      const productIndex = products.findIndex(p => p.id === id);
      
      if (productIndex !== -1) {
          // Preserve existing ratings when editing
          const existingRatings = products[productIndex].ratings || [];
          
          products[productIndex] = {
              id,
              name,
              image,
              category,
              price,
              description,
              stock,
              ratings: existingRatings
          };
          
          localStorage.setItem("products", JSON.stringify(products));
          loadProducts();
          bootstrap.Modal.getInstance(document.getElementById("editProductModal")).hide();
      }
  });

  // Helper functions for ratings
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
});