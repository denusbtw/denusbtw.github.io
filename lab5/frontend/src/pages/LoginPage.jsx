import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const token = await userCredential.user.getIdToken();
            localStorage.setItem("firebaseToken", token);
            navigate("/");
        } catch (err) {
            setError("❌ " + err.message);
        }
    };

    return (
        <main className="main-center">
            <div className="auth-form">
                <h2>Вхід</h2>
                <form onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="error">{error}</p>}
                    <button type="submit" disabled={!email || !password}>Увійти</button>
                    <p className="auth-switch">
                        Ще не маєш акаунта? <Link to="/register">Реєстрація</Link>
                    </p>
                </form>
            </div>
        </main>
    );
};

export default LoginPage;
