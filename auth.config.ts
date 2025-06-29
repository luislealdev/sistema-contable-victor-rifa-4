import NextAuth from "next-auth";
import { z } from "zod";
import bcryptjs from 'bcryptjs';
import Credentials from 'next-auth/providers/credentials';
import prisma from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: '/auth',
    },
    callbacks: {
        authorized({ }) {
            return true;
        },

        jwt({ token, user }) {
            if (user) {
                token.data = user;
            }

            return token;
        },

        session({ session, token }) {
            /* eslint-disable  @typescript-eslint/no-explicit-any */
            session.user = token.data as any;
            return session;
        },
    },
    providers: [
        Credentials({
            id: "credentials",
            name: "Credentials",
            credentials: {
                username: { label: "username", type: "username" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    if (!credentials?.username || !credentials?.password) {
                        console.error("Missing credentials");
                        return null;
                    }

                    const parsedCredentials = z
                        .object({
                            username: z.string().min(3).max(20),
                            password: z.string().min(6)
                        })
                        .safeParse(credentials);

                    if (!parsedCredentials.success) {
                        console.error("Invalid credentials format");
                        return null;
                    }

                    const { username, password } = parsedCredentials.data;

                    // Buscar el username
                    const user = await prisma.user.findUnique({
                        where: { username: username.toLowerCase() },
                    });

                    if (!user || !user.password) {
                        console.error("User not found");
                        return null;
                    }

                    // Comparar las contraseñas
                    const isValidPassword = bcryptjs.compareSync(password, user.password);
                    if (!isValidPassword) {
                        console.error("Invalid password");
                        return null;
                    }

                    // Regresar el usuario sin el password
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { password: _, ...rest } = user;

                    return {
                        ...rest,
                        id: String(user.id), // Ensure id is a string
                    }; // Asegurarse de que siempre haya un rol
                } catch (error) {
                    console.error("Error en authorize:", error);
                    return null;
                }
            },
        }),
    ],
});