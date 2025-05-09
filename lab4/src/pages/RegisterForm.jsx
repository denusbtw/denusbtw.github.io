import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate(); // хук для редиректу

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert("Реєстрація успішна!");
            navigate("/"); // перекидаємо на головну
        } catch (error) {
            alert("Помилка: " + error.message);
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
                    <p className="auth-switch">
                        <a href="/login">Вже маєте акаунт?</a>
                    </p>
                    <button type="submit">Зареєструватися</button>
                </form>
            </div>
        </main>
    );
};

export default RegisterForm;
