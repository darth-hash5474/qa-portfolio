const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const MIN_PASSWORD_LENGTH = 8;

// The rules a new account has to meet, returning the message to show or null when it passes
function registrationProblem(username, password) {
    if (!USERNAME_PATTERN.test(username)) {
        return "Usernames are 3 to 64 letters, numbers, dots, dashes or underscores.";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Passwords need at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
}

// Wires up the login or register form, whichever this page has. The two differ only in the
// endpoint they post to and the extra checks made before sending.
function setUpForm(kind, endpoint, findProblem) {
    const form = document.getElementById(`${kind}-form`);
    if (!form) {
        return;
    }
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const submitButton = document.getElementById(kind);
    const error = document.getElementById(`${kind}-error`);

    function showError(message) {
        error.textContent = message;
        error.hidden = false;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        error.hidden = true;

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
            showError("Enter your username and password.");
            return;
        }
        const problem = findProblem(username, password);
        if (problem) {
            showError(problem);
            return;
        }

        submitButton.disabled = true;
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (response.ok) {
                const member = await response.json();
                document.getElementById("member-name").textContent = member.name;
                document.getElementById(`${kind}-page`).hidden = true;
                document.getElementById(`${kind}-success`).hidden = false;
            } else if (response.status === 401) {
                passwordInput.value = "";
                passwordInput.focus();
                showError("Incorrect username or password.");
            } else if (response.status === 409) {
                usernameInput.focus();
                showError("That username is already taken.");
            } else {
                showError("Something went wrong. Please try again.");
            }
        } catch {
            showError("Could not reach the server. Please try again.");
        } finally {
            submitButton.disabled = false;
        }
    });
}

setUpForm("login", "/api/login", () => null);
setUpForm("register", "/api/register", registrationProblem);
