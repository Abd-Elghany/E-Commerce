// login form logic
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
  
    if (loginForm) {
      loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
  
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const errorMsg = document.getElementById("errorMsg");
  
        const users = JSON.parse(localStorage.getItem("users")) || [];
  
        const user = users.find((u) => u.email === email && u.password === password);
  
        if (user) {
          localStorage.setItem("loggedInUser", JSON.stringify(user));
          if (user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "index.html";
          }
        } else {
          errorMsg.textContent = "Invalid email or password.";
        }
      });
    }
  });
  

  // js/auth.js
  /// register 

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
  
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.getElementById("role").value;
        const errorMsg = document.getElementById("errorMsg");
  
        let users = JSON.parse(localStorage.getItem("users")) || [];
  
        const emailExists = users.some((u) => u.email === email);
        if (emailExists) {
          errorMsg.textContent = "Email already exists. Please login instead.";
          return;
        }
  
        const newUser = { email, password, role };
        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
  
        alert("Registration successful! You can now login.");
        window.location.href = "login.html";
      });
    }
  });
  
  