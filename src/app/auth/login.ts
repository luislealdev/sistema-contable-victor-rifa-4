"use server";

import { signIn } from "../../../auth.config";


export async function login(username: string, password: string) {
    try {
        const result = await signIn('credentials', {
            username,
            password,
            redirect: false, // This is crucial to prevent the NEXT_REDIRECT error
        });

        if (result?.error) {
            return { ok: false, message: "Invalid credentials" };
        }

        return { ok: true };
    } catch (error) {
        console.error("Login error:", error);
        return { ok: false, message: "An unexpected error occurred" };
    }
}