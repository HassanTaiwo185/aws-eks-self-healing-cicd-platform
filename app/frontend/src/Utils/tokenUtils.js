import api from "../api";
import { ACCESS_TOKEN,REFRESH_TOKEN } from "../constants";


export function isExpired(token) {
    if (!token) return true;
    
    // Decode the token payload
    const payload = token.split(".")[1];
    
    let decoded;
    try {
        // This works in a browser environment
        decoded = JSON.parse(atob(payload));
    } catch (e) {
        // This is a Node.js-compatible fallback
        decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    }

    const { exp } = decoded;
    return Date.now() >= exp * 1000;
}

export async function getValidAccessToken() {
    let token = localStorage.getItem(ACCESS_TOKEN) || sessionStorage.getItem(ACCESS_TOKEN);

    if (!token || isExpired(token)) {
        const refresh = localStorage.getItem(REFRESH_TOKEN) || sessionStorage.getItem(REFRESH_TOKEN);
        if (!refresh) return null;

        try {
            const res = await api.post("/token/refresh/", { refresh });
            token = res.data.access;

            if (localStorage.getItem(REFRESH_TOKEN)) {
                localStorage.setItem(ACCESS_TOKEN, token);
            } else {
                sessionStorage.setItem(ACCESS_TOKEN, token);
            }
        } catch {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
            return null;
        }
    }

    return token;
}