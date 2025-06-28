import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: number;
            name: string;
            username: string;
        } & DefaultSession['user'];
    }
}