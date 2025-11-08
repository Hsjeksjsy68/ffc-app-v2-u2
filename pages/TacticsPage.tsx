import React, { useState, useEffect } from 'react';
import { firestore } from '../services/firebase';
import type { Match, Player, Tactics } from '../types';
import Card from '../components/Card';

// A modern, more detailed representation of a football pitch.
const Pitch: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const pitchStyle = {
        // Simulating mown grass stripes with a vertical gradient
        background: `repeating-linear-gradient(to bottom, #57944d, #57944d 10%, #5c9e52 10%, #5c9e52 20%)`
    };

    return (
        <div 
            className="relative w-full max-w-3xl mx-auto aspect-[2/3] shadow-lg rounded-lg overflow-hidden border-2 border-white/30"
            style={pitchStyle}
        >
            {/* All pitch markings are contained here */}
            <div className="absolute inset-0">
                {/* Outer Boundary Lines */}
                <div className="absolute inset-4 border-2 border-white/75"></div>

                {/* Center Line */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/75 -translate-y-1/2"></div>
                {/* Center Circle */}
                <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white/75 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                {/* Center Spot */}
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/75 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

                {/* --- Home Side (Top) --- */}
                {/* Penalty Area */}
                <div className="absolute top-4 left-1/2 w-[60%] h-[18%] border-x-2 border-b-2 border-white/75 -translate-x-1/2"></div>
                {/* 6-Yard Box */}
                <div className="absolute top-4 left-1/2 w-[30%] h-[7%] border-x-2 border-b-2 border-white/75 -translate-x-1/2"></div>
                {/* Penalty Spot */}
                <div className="absolute top-[13%] left-1/2 w-2 h-2 bg-white/75 rounded-full -translate-x-1/2"></div>
                {/* D-Arc */}
                <div className="absolute top-[18%] left-1/2 w-24 h-12 border-2 border-white/75 rounded-b-full -translate-x-1/2 border-t-0"></div>

                {/* --- Away Side (Bottom) --- */}
                {/* Penalty Area */}
                <div className="absolute bottom-4 left-1/2 w-[60%] h-[18%] border-x-2 border-t-2 border-white/75 -translate-x-1/2"></div>
                {/* 6-Yard Box */}
                <div className="absolute bottom-4 left-1/2 w-[30%] h-[7%] border-x-2 border-t-2 border-white/75 -translate-x-1/2"></div>
                {/* Penalty Spot */}
                <div className="absolute bottom-[13%] left-1/2 w-2 h-2 bg-white/75 rounded-full -translate-x-1/2"></div>
                {/* D-Arc */}
                <div className="absolute bottom-[18%] left-1/2 w-24 h-12 border-2 border-white/75 rounded-t-full -translate-x-1/2 border-b-0"></div>
            </div>
            {children}
        </div>
    );
};

// An enhanced player marker with better hover effects.
const PlayerMarker: React.FC<{ player: Player; position: { top: number; left: number; } }> = ({ player, position }) => (
    <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 group transition-all duration-300"
        style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
        <div className="relative flex flex-col items-center cursor-pointer">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
                {player.number}
            </div>
            <div className="absolute bottom-full mb-2 w-max px-3 py-1 bg-black/70 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm">
                {player.name}
            </div>
        </div>
    </div>
);

const TacticsBoard: React.FC<{ players: { player: Player; position: { top: number; left: number } }[] }> = ({ players }) => {
    return (
        <Pitch>
            {players.map(({ player, position }) => (
                <PlayerMarker key={player.id} player={player} position={position} />
            ))}
        </Pitch>
    );
};

const TacticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [nextMatch, setNextMatch] = useState<Match | null>(null);
    const [tactics, setTactics] = useState<Tactics | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Fetch all players
                const playersSnap = await firestore.collection('players').get();
                const allPlayers = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
                setPlayers(allPlayers);

                // 2. Fetch the next match
                const upcomingQuery = firestore.collection('matches')
                    .where('isPast', '==', false)
                    .orderBy('date', 'asc')
                    .limit(1);
                const matchSnap = await upcomingQuery.get();

                if (!matchSnap.empty) {
                    const matchData = { id: matchSnap.docs[0].id, ...matchSnap.docs[0].data() } as Match;
                    setNextMatch(matchData);

                    // 3. Fetch tactics for that match
                    const tacticsQuery = firestore.collection('tactics')
                        .where('matchId', '==', matchData.id)
                        .limit(1);
                    const tacticsSnap = await tacticsQuery.get();
                    if (!tacticsSnap.empty) {
                        setTactics({ id: tacticsSnap.docs[0].id, ...tacticsSnap.docs[0].data() } as Tactics);
                    } else {
                        setTactics(null);
                    }
                } else {
                    setNextMatch(null);
                    setTactics(null);
                }
            } catch (error) {
                console.error("Error fetching tactics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const getPlayerById = (id: string) => players.find(p => p.id === id);

    const startingXIWithPositions = tactics?.startingXI
        .map(p => {
            const player = getPlayerById(p.playerId);
            return player ? { player, position: p.position } : null;
        })
        .filter((p): p is { player: Player; position: { top: number; left: number } } => !!p);

    const startingXIPlayers = startingXIWithPositions?.map(p => p.player);
    const substitutes = tactics?.substitutes.map(getPlayerById).filter((p): p is Player => !!p);

    if (loading) {
        return (
             <div className="space-y-8 animate-pulse">
                <header className="text-center">
                    <div className="h-12 bg-gray-200 dark:bg-dark-base-300 rounded-md w-3/4 mx-auto mb-2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-dark-base-300 rounded-md w-1/2 mx-auto"></div>
                </header>
                <div className="bg-gray-200 dark:bg-dark-base-300 rounded-2xl w-full max-w-3xl mx-auto aspect-[2/3]"></div>
            </div>
        );
    }
    
    if (!nextMatch || !tactics) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Tactics Board</h1>
                <Card>
                    <p className="text-center text-lg py-8">No tactics have been set for the next match yet. Check back later!</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header className="text-center">
                 <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Matchday Tactics</h1>
                 <p className="text-lg text-gray-600 dark:text-gray-400">
                    vs {nextMatch.opponent} on {nextMatch.date.toDate().toLocaleDateString()}
                 </p>
            </header>

            <Card className="p-4 md:p-6 bg-base-200 dark:bg-dark-base-300">
                <h2 className="text-2xl font-bold mb-4 text-center">Formation: {tactics.formation}</h2>
                {startingXIWithPositions && <TacticsBoard players={startingXIWithPositions} />}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                     <h2 className="text-2xl font-bold mb-4">Starting XI</h2>
                     <ul className="space-y-3">
                         {startingXIPlayers?.sort((a,b) => a.number - b.number).map(p => (
                             <li key={p.id} className="flex items-center text-lg p-2 rounded-md hover:bg-base-200 dark:hover:bg-dark-base-200">
                                 <span className="font-bold text-primary w-10 text-center">{p.number}</span>
                                 <div className="flex-grow">
                                     <p className="font-semibold">{p.name}</p>
                                     <p className="text-sm text-gray-500">{p.position}</p>
                                 </div>
                             </li>
                         ))}
                     </ul>
                </Card>
                <Card>
                     <h2 className="text-2xl font-bold mb-4">Substitutes</h2>
                     <ul className="space-y-3">
                         {substitutes?.sort((a,b) => a.number - b.number).map(p => (
                             <li key={p.id} className="flex items-center text-lg p-2 rounded-md hover:bg-base-200 dark:hover:bg-dark-base-200">
                                  <span className="font-bold text-primary w-10 text-center">{p.number}</span>
                                 <p className="font-semibold">{p.name}</p>
                             </li>
                         ))}
                     </ul>
                </Card>
            </div>
            
            {tactics.generalNotes && (
                 <Card>
                    <h2 className="text-2xl font-bold mb-4">Tactical Notes</h2>
                    <p className="whitespace-pre-wrap text-base leading-relaxed">{tactics.generalNotes}</p>
                </Card>
            )}
        </div>
    );
};

export default TacticsPage;