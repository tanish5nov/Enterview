/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from "react";
import { apiBaseUrl } from "./api.js";
import {
  clearAuthPayload,
  isAccessTokenExpired,
  loadAuthPayload,
  storeAuthPayload,
} from "./auth-storage.js";

const initialSignupForm = {
  name: "",
  email: "",
  password: "",
};

const initialLoginForm = {
  email: "",
  password: "",
};

function validateSignupForm(form) {
  const errors = {};

  if (form.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  if (!form.email.includes("@")) {
    errors.email = "Enter a valid email address.";
  }

  if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function validateLoginForm(form) {
  const errors = {};

  if (!form.email.includes("@")) {
    errors.email = "Enter a valid email address.";
  }

  if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

function getCurrentRoute() {
  return window.location.hash === "#/app" ? "app" : "access";
}

function navigateTo(routeName) {
  window.location.hash = routeName === "app" ? "/app" : "/access";
}

function formatUser(user) {
  return user ? `${user.name} (${user.email})` : "";
}

function AccessView({
  mode,
  setMode,
  signupForm,
  loginForm,
  signupErrors,
  loginErrors,
  submitError,
  successMessage,
  isSubmitting,
  onSignupFieldChange,
  onLoginFieldChange,
  onSignupSubmit,
  onLoginSubmit,
}) {
  return (
    <section style={cardStyle}>
      <p style={eyebrowStyle}>Candidate Access</p>
      <div style={tabRowStyle}>
        <button
          type="button"
          onClick={() => setMode("signup")}
          style={getTabStyle(mode === "signup")}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => setMode("login")}
          style={getTabStyle(mode === "login")}
        >
          Log in
        </button>
      </div>

      <h1 style={titleStyle}>
        {mode === "signup" ? "Create your account" : "Log in to continue"}
      </h1>
      <p style={bodyStyle}>
        {mode === "signup"
          ? "Create a candidate account first. Once created, you can log in from the same screen."
          : "Log in to reach the first protected client route. A fuller private app shell comes next."}
      </p>

      {mode === "signup" ? (
        <form onSubmit={onSignupSubmit} noValidate>
          <label htmlFor="signup-name" style={labelStyle}>
            Full name
          </label>
          <input
            id="signup-name"
            name="name"
            value={signupForm.name}
            onChange={(event) => onSignupFieldChange("name", event.target.value)}
            placeholder="Tanish Sharma"
            style={inputStyle}
          />
          {signupErrors.name ? <p style={errorStyle}>{signupErrors.name}</p> : null}

          <label htmlFor="signup-email" style={spacedLabelStyle}>
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            value={signupForm.email}
            onChange={(event) => onSignupFieldChange("email", event.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
          {signupErrors.email ? <p style={errorStyle}>{signupErrors.email}</p> : null}

          <label htmlFor="signup-password" style={spacedLabelStyle}>
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            value={signupForm.password}
            onChange={(event) => onSignupFieldChange("password", event.target.value)}
            placeholder="Minimum 8 characters"
            style={inputStyle}
          />
          {signupErrors.password ? <p style={errorStyle}>{signupErrors.password}</p> : null}

          {submitError ? <p style={{ ...errorStyle, marginTop: "16px" }}>{submitError}</p> : null}
          {successMessage ? (
            <p style={{ ...successStyle, marginTop: "16px" }}>{successMessage}</p>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>
      ) : (
        <form onSubmit={onLoginSubmit} noValidate>
          <label htmlFor="login-email" style={labelStyle}>
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            value={loginForm.email}
            onChange={(event) => onLoginFieldChange("email", event.target.value)}
            placeholder="you@example.com"
            style={inputStyle}
          />
          {loginErrors.email ? <p style={errorStyle}>{loginErrors.email}</p> : null}

          <label htmlFor="login-password" style={spacedLabelStyle}>
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            value={loginForm.password}
            onChange={(event) => onLoginFieldChange("password", event.target.value)}
            placeholder="Your password"
            style={inputStyle}
          />
          {loginErrors.password ? <p style={errorStyle}>{loginErrors.password}</p> : null}

          {submitError ? <p style={{ ...errorStyle, marginTop: "16px" }}>{submitError}</p> : null}
          {successMessage ? (
            <p style={{ ...successStyle, marginTop: "16px" }}>{successMessage}</p>
          ) : null}

          <button type="submit" disabled={isSubmitting} style={buttonStyle(isSubmitting)}>
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      )}
    </section>
  );
}

function AppShell({ authState, onLogout }) {
  return (
    <section style={shellStyle}>
      <header style={shellHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>AI SWE Mock Interviewer</p>
          <h1 style={{ ...titleStyle, margin: "0" }}>Candidate Workspace</h1>
        </div>
        <button type="button" onClick={onLogout} style={secondaryButtonStyle}>
          Log out
        </button>
      </header>

      <section style={heroPanelStyle}>
        <p style={infoLineStyle}>Signed in user</p>
        <p style={heroValueStyle}>{formatUser(authState?.user)}</p>
        <p style={bodyStyle}>
          This is the first authenticated shell. Interview setup, history, and the live
          session flow will be layered into this private area next.
        </p>
      </section>

      <div style={shellGridStyle}>
        <article style={infoBlockStyle}>
          <p style={infoLineStyle}>Route guard</p>
          <p style={infoValueStyle}>Private route is active at `#/app`.</p>
        </article>
        <article style={infoBlockStyle}>
          <p style={infoLineStyle}>Access token</p>
          <p style={infoValueStyle}>
            Auth state survives refresh while the stored token remains valid.
          </p>
        </article>
        <article style={infoBlockStyle}>
          <p style={infoLineStyle}>Next build step</p>
          <p style={infoValueStyle}>Interview session APIs and client flows.</p>
        </article>
      </div>
    </section>
  );
}

export function App() {
  const [route, setRoute] = useState(getCurrentRoute);
  const [mode, setMode] = useState("signup");
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [loginForm, setLoginForm] = useState(initialLoginForm);
  const [signupErrors, setSignupErrors] = useState({});
  const [loginErrors, setLoginErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authState, setAuthState] = useState(() => {
    const savedAuth = loadAuthPayload();

    if (!savedAuth?.accessToken || isAccessTokenExpired(savedAuth.accessToken)) {
      clearAuthPayload();
      return null;
    }

    return savedAuth;
  });

  const isAuthenticated = useMemo(() => {
    if (!authState?.accessToken) {
      return false;
    }

    return !isAccessTokenExpired(authState.accessToken);
  }, [authState]);

  useEffect(() => {
    function syncRoute() {
      setRoute(getCurrentRoute());
    }

    if (!window.location.hash) {
      navigateTo("access");
    }

    window.addEventListener("hashchange", syncRoute);

    return () => {
      window.removeEventListener("hashchange", syncRoute);
    };
  }, []);

  useEffect(() => {
    if (route === "app" && !isAuthenticated) {
      clearAuthPayload();
      navigateTo("access");
    }
  }, [isAuthenticated, route]);

  useEffect(() => {
    if (!authState?.accessToken) {
      return undefined;
    }

    const payload = JSON.parse(
      window.atob(authState.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    const remainingMs = payload.exp * 1000 - Date.now();

    if (remainingMs <= 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      clearAuthPayload();
      setAuthState(null);
      setMode("login");
      setSuccessMessage("");
      setSubmitError("Your session expired. Please log in again.");
      navigateTo("access");
    }, remainingMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [authState]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setSubmitError("");
    setSuccessMessage("");
  }

  function updateSignupField(fieldName, value) {
    setSignupForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setSignupErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "",
    }));
    setSubmitError("");
    setSuccessMessage("");
  }

  function updateLoginField(fieldName, value) {
    setLoginForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
    setLoginErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: "",
    }));
    setSubmitError("");
    setSuccessMessage("");
  }

  async function handleSignupSubmit(event) {
    event.preventDefault();
    const nextErrors = validateSignupForm(signupForm);

    if (Object.keys(nextErrors).length > 0) {
      setSignupErrors(nextErrors);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setSignupErrors({});
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || "Signup failed.");
        return;
      }

      setSuccessMessage(`Account created for ${result.user.email}`);
      setSignupForm(initialSignupForm);
      setMode("login");
      setLoginForm((currentForm) => ({
        ...currentForm,
        email: result.user.email,
      }));
    } catch {
      setSubmitError("Unable to reach the server. Check that the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLoginForm(loginForm);

    if (Object.keys(nextErrors).length > 0) {
      setLoginErrors(nextErrors);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setLoginErrors({});
    setSubmitError("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const result = await response.json();

      if (!response.ok) {
        setSubmitError(result.error || "Login failed.");
        return;
      }

      storeAuthPayload(result);
      setAuthState({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      setSuccessMessage("");
      setSubmitError("");
      setLoginForm(initialLoginForm);
      navigateTo("app");
    } catch {
      setSubmitError("Unable to reach the server. Check that the backend is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleLogout() {
    clearAuthPayload();
    setAuthState(null);
    setMode("login");
    setSuccessMessage("Logged out.");
    setSubmitError("");
    navigateTo("access");
  }

  return (
    <main style={pageStyle}>
      {route === "app" && isAuthenticated ? (
        <AppShell authState={authState} onLogout={handleLogout} />
      ) : (
        <AccessView
          mode={mode}
          setMode={switchMode}
          signupForm={signupForm}
          loginForm={loginForm}
          signupErrors={signupErrors}
          loginErrors={loginErrors}
          submitError={submitError}
          successMessage={successMessage}
          isSubmitting={isSubmitting}
          onSignupFieldChange={updateSignupField}
          onLoginFieldChange={updateLoginField}
          onSignupSubmit={handleSignupSubmit}
          onLoginSubmit={handleLoginSubmit}
        />
      )}
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  margin: 0,
  display: "grid",
  placeItems: "center",
  background: "#f4efe7",
  padding: "24px",
  fontFamily: "Georgia, serif",
};

const cardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "#fffdf9",
  border: "1px solid #ddd3c4",
  borderRadius: "16px",
  padding: "28px",
  boxShadow: "0 10px 30px rgba(60, 42, 24, 0.08)",
};

const shellStyle = {
  width: "100%",
  maxWidth: "960px",
  background: "#fffdf9",
  border: "1px solid #ddd3c4",
  borderRadius: "20px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(60, 42, 24, 0.08)",
};

const shellHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
};

const heroPanelStyle = {
  padding: "20px",
  borderRadius: "18px",
  background: "linear-gradient(135deg, #f7f1e8 0%, #eef6ef 100%)",
  border: "1px solid #e1d5c4",
  marginBottom: "18px",
};

const heroValueStyle = {
  margin: "0 0 10px",
  color: "#1f1a14",
  fontSize: "24px",
  lineHeight: 1.2,
};

const shellGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "14px",
};

const eyebrowStyle = {
  margin: "0 0 8px",
  color: "#7b6448",
  fontSize: "14px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

const tabRowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
  marginBottom: "20px",
};

function getTabStyle(isActive) {
  return {
    border: `1px solid ${isActive ? "#3d6a42" : "#cdbfae"}`,
    borderRadius: "12px",
    padding: "10px 12px",
    background: isActive ? "#eef6ef" : "#fff",
    color: isActive ? "#234a2b" : "#5f5345",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: 600,
  };
}

const titleStyle = {
  margin: "0 0 10px",
  color: "#1f1a14",
  fontSize: "32px",
  lineHeight: 1.1,
};

const bodyStyle = {
  margin: "0 0 24px",
  color: "#5f5345",
  lineHeight: 1.5,
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  color: "#31271d",
};

const spacedLabelStyle = {
  display: "block",
  margin: "16px 0 8px",
  color: "#31271d",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid #cdbfae",
  background: "#fff",
  color: "#1f1a14",
  fontSize: "15px",
};

function buttonStyle(isSubmitting) {
  return {
    marginTop: "20px",
    width: "100%",
    border: "none",
    borderRadius: "12px",
    padding: "14px 16px",
    background: isSubmitting ? "#a78f72" : "#3d6a42",
    color: "#fff",
    cursor: isSubmitting ? "wait" : "pointer",
    fontSize: "16px",
    fontWeight: 600,
  };
}

const secondaryButtonStyle = {
  border: "1px solid #cdbfae",
  borderRadius: "12px",
  padding: "12px 16px",
  background: "#fff",
  color: "#31271d",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: 600,
};

const errorStyle = {
  margin: "8px 0 0",
  color: "#a63b33",
  fontSize: "14px",
};

const successStyle = {
  margin: "8px 0 0",
  color: "#245c2c",
  fontSize: "14px",
};

const infoBlockStyle = {
  marginTop: "14px",
  padding: "14px",
  borderRadius: "12px",
  background: "#f7f1e8",
  border: "1px solid #e1d5c4",
};

const infoLineStyle = {
  margin: "0 0 6px",
  color: "#6c5a49",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const infoValueStyle = {
  margin: 0,
  color: "#1f1a14",
  fontSize: "15px",
};
