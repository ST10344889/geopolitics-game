async function checkWhoAmI() {
  try {
    const response = await fetch("/api/auth/whoami");
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not check login status.");
    }

    if (data.loggedIn) {
      document.getElementById("status").innerText = "Welcome, " + data.username + "!";
      document.getElementById("forms").style.display = "none";
      document.getElementById("logoutBtn").style.display = "inline-block";
    } else {
      document.getElementById("status").innerText = "Please sign up or log in to play.";
      document.getElementById("forms").style.display = "block";
      document.getElementById("logoutBtn").style.display = "none";
    }
  } catch (error) {
    document.getElementById("message").innerText = error.message;
  }
}

async function sendToServer(url) {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username, password: password })
    });
    const data = await response.json();

    if (!response.ok) {
      document.getElementById("message").innerText = data.message || "Could not sign in.";
      return;
    }

    window.location.href = "/index.html";
  } catch (error) {
    document.getElementById("message").innerText = "Could not reach the server. Please try again.";
  }
}

function signup() {
  sendToServer("/api/auth/signup");
}

function login() {
  sendToServer("/api/auth/login");
}

async function logout() {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Could not log out.");
    }

    document.getElementById("message").innerText = "";
    await checkWhoAmI();
  } catch (error) {
    document.getElementById("message").innerText = error.message;
  }
}

checkWhoAmI();
