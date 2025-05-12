import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

const RegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
                <h2>Реєстрація</h2>
                <form onSubmit={handleRegister}>
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
                    <button type="submit" disabled={!email || !password}>Зареєструватися</button>
                    <p className="auth-switch">
                        <Link to="/login">Вже маєш акаунт?</Link>
                    </p>
                </form>
            </div>
        </main>
    );
};

export default RegisterPage;
