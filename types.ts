// Fix: Import ComponentType from 'react' to resolve namespace error.
import type { ComponentType } from 'react';

export type Page = 'Home' | 'Schedule' | 'Team' | 'Tactics' | 'Login' | 'Admin Login' | 'Admin' | 'Logout' | 'My Profile';

export interface NavLink {
    name: Page;
    icon: ComponentType<{ className?: string }>;
}

export interface Player {
    id?: string;
    userId?: string; // Link to auth user
    name: string;
    position: 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Forward';
    number: number;
    imageUrl: string;
    joinDate: string; 
    phone?: string;
    address?: string;
    stats: {
        season: {
            appearances: number;
            goals: number;
            assists: number;
        };
        allTime: {
            appearances: number;
            goals: number;
            assists: number;
        };
    };
}

export interface Coach {
    id?: string;
    userId?: string; // Link to auth user
    name: string;
    role: string; // e.g., Head Coach, Assistant Coach
    imageUrl: string;
    joinDate: string; 
    bio?: string;
}

export interface Match {
    id?: string;
    opponent: string;
    date: any; // Accommodate Firebase Timestamp
    venue: 'Home' | 'Away';
    competition?: string;
    isPast: boolean;
    score?: {
        home: number;
        away: number;
    };
    goalScorers?: {
        playerId?: string; // For our players
        playerName?: string; // For opponent players
        minute?: number;
    }[];
}

export interface TrainingSession {
    id?: string;
    date: any; // Accommodate Firebase Timestamp
    focus: string;
    location: string;
}

export interface NewsArticle {
    id?: string;
    title: string;
    summary: string;
    date: any; // Accommodate Firebase Timestamp
    imageUrl: string;
}

export interface UserDocument {
    id: string;
    email: string;
    name?: string;
    isAdmin?: boolean;
    isPlayer?: boolean;
    isCoach?: boolean;
}

export interface Tactics {
    id?: string;
    matchId: string;
    formation: string;
    generalNotes: string;
    startingXI: { 
        playerId: string;
        position: { top: number; left: number }; // top and left as percentages (0-100)
    }[];
    substitutes: string[]; // Array of player IDs
}

export type AdminItem = Player | Coach | Match | NewsArticle | TrainingSession | UserDocument | Tactics;