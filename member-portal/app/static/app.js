const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");
const loginError = document.getElementById("login-error");

function showError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginError.hidden = true;

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        showError("Enter your username and password.");
        return;
    }

    loginButton.disabled = true;
    try {
        const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        if (response.ok) {
            const member = await response.json();
            document.getElementById("member-name").textContent = member.name;
            document.getElementById("login-page").hidden = true;
            document.getElementById("login-success").hidden = false;
        } else if (response.status === 401) {
            passwordInput.value = "";
            passwordInput.focus();
            showError("Incorrect username or password.");
        } else {
            showError("Something went wrong. Please try again.");
        }
    } catch {
        showError("Could not reach the server. Please try again.");
    } finally {
        loginButton.disabled = false;
    }
});
