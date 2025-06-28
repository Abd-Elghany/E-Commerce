document.addEventListener("DOMContentLoaded", () => {
    
    const usersList = document.getElementById("usersList");
    const adminError = document.getElementById("adminError");
  
    let users = JSON.parse(localStorage.getItem("users")) || [];
  
    // عرض كل المستخدمين
    function renderUsers() {
      usersList.innerHTML = "";
      users.forEach((user, index) => {
        const div = document.createElement("div");
        div.className = "card";
        div.innerHTML = `
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <button onclick="deleteUser(${index})" style="background-color:red; color:white; padding:5px 10px; border:none; border-radius:4px; cursor:pointer;">Delete</button>
        `;
        usersList.appendChild(div);
      });
    }
    
  
    renderUsers();
    window.deleteUser = function(index) {
      const confirmDelete = confirm("Are you sure you want to delete this user?");
      if (confirmDelete) {
        users.splice(index, 1);
        localStorage.setItem("users", JSON.stringify(users));
        renderUsers();
        populateUserSelect(); // عشان نحدث قائمة العملاء في dropdown
      }
    };
  
    // إضافة admin جديد
    const promoteForm = document.getElementById("promoteForm");
    const userSelect = document.getElementById("userSelect");

// عرض المستخدمين اللي دورهم "customer" في الـ select
function populateUserSelect() {
  userSelect.innerHTML = "";
  const customers = users.filter((user) => user.role === "customer");
  if (customers.length === 0) {
    userSelect.innerHTML = "<option disabled>No customers available</option>";
  } else {
    customers.forEach((user, index) => {
      const option = document.createElement("option");
      option.value = user.email;
      option.textContent = user.email;
      userSelect.appendChild(option);
    });
  }
}

populateUserSelect();

// ترقية مستخدم إلى Admin
promoteForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedEmail = userSelect.value;

  const userIndex = users.findIndex((u) => u.email === selectedEmail);
  if (userIndex !== -1) {
    users[userIndex].role = "admin";
    localStorage.setItem("users", JSON.stringify(users));
    renderUsers();
    populateUserSelect(); // عشان نحدث القائمة ونشيل المستخدم اللي ترقى
    adminError.textContent = "User promoted to Admin successfully!";
  } else {
    adminError.textContent = "User not found!";
  }
});
})
