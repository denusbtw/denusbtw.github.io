import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // хук для навігації

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("Вхід виконано!");
            navigate("/"); // редирект після входу
        } catch (error) {
            alert("Помилка входу: " + error.message);
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
                    <button type="submit">Увійти</button>
                </form>

                <p className="auth-switch">
                    Не маєте акаунта? <a href="/register">Зареєструватися</a>
                </p>
            </div>
        </main>
    );
};

export default LoginForm;
