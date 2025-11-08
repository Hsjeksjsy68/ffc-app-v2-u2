import React, { useState, useEffect, useMemo } from 'react';
import PlayerCard from '../components/PlayerCard';
import Modal from '../components/Modal';
import Card from '../components/Card';
import type { Player, Coach } from '../types';
import { firestore } from '../services/firebase';
// Fix: Removed modular imports for Firebase v9.
// import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const PlayerDetails: React.FC<{ player: Player }> = ({ player }) => (
    <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
            <img src={player.imageUrl || `https://avatar.vercel.sh/${player.name}.svg?text=${player.name.charAt(0)}`} alt={player.name} className="w-full h-auto rounded-lg object-cover" />
            <h2 className="text-3xl font-bold mt-4">{player.name}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">#{player.number} | {player.position}</p>
            <p className="mt-2">Joined: {new Date(player.joinDate).toLocaleDateString()}</p>
        </div>
        <div className="md:w-2/3">
            <h3 className="text-2xl font-bold mb-4">Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-base-200 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold text-lg">Current Season</h4>
                    <p>Appearances: {player.stats.season.appearances}</p>
                    <p>Goals: {player.stats.season.goals}</p>
                    <p>Assists: {player.stats.season.assists}</p>
                </div>
                <div className="bg-base-200 dark:bg-dark-base-200 p-4 rounded-lg">
                    <h4 className="font-bold text-lg">All Time</h4>
                    <p>Appearances: {player.stats.allTime.appearances}</p>
                    <p>Goals: {player.stats.allTime.goals}</p>
                    <p>Assists: {player.stats.allTime.assists}</p>
                </div>
            </div>
        </div>
    </div>
);

const CoachCard: React.FC<{ coach: Coach; onClick: () => void; }> = ({ coach, onClick }) => {
    const imageUrl = coach.imageUrl || `https://avatar.vercel.sh/${coach.name}.svg?text=${coach.name.slice(0, 2).toUpperCase()}`;
    return (
        <div 
            className="bg-base-100 dark:bg-dark-base-100 rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer text-center"
            onClick={onClick}
        >
            <img className="w-full h-56 object-cover" src={imageUrl} alt={coach.name} />
            <div className="p-4">
                <h3 className="text-xl font-bold">{coach.name}</h3>
                <p className="text-gray-600 dark:text-gray-400">{coach.role}</p>
            </div>
        </div>
    );
};

const CoachDetails: React.FC<{ coach: Coach }> = ({ coach }) => (
    <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
            <img src={coach.imageUrl || `https://avatar.vercel.sh/${coach.name}.svg?text=${coach.name.slice(0, 2).toUpperCase()}`} alt={coach.name} className="w-full h-auto rounded-lg object-cover" />
        </div>
        <div className="md:w-2/3">
            <h2 className="text-3xl font-bold">{coach.name}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">{coach.role}</p>
            <p className="mt-2">Joined: {new Date(coach.joinDate).toLocaleDateString()}</p>
            {coach.bio && <p className="mt-4 whitespace-pre-wrap">{coach.bio}</p>}
        </div>
    </div>
);

const FilterButton: React.FC<{ active: boolean, onClick: () => void, children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            active
                ? 'bg-primary text-white shadow'
                : 'bg-base-100 dark:bg-dark-base-100 hover:bg-base-200 dark:hover:bg-dark-base-200'
        }`}
    >
        {children}
    </button>
);


const TeamPage: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<'all' | 'players' | 'coaches'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch players
                const playersCollection = firestore.collection('players');
                const qPlayers = playersCollection.orderBy('number');
                const playerSnapshot = await qPlayers.get();
                const playerList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Player) }));
                setPlayers(playerList);

                // Fetch coaches
                const coachesCollection = firestore.collection('coaches');
                const qCoaches = coachesCollection.orderBy('name');
                const coachSnapshot = await qCoaches.get();
                const coachList = coachSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Coach) }));
                setCoaches(coachList);

            } catch (error) {
                console.error("Error fetching team data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredCoaches = useMemo(() => {
        if (activeFilter === 'players') return [];
        return coaches.filter(coach =>
            coach.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [coaches, activeFilter, searchTerm]);

    const filteredPlayers = useMemo(() => {
        if (activeFilter === 'coaches') return [];
        return players.filter(player =>
            player.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [players, activeFilter, searchTerm]);


    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold">The Team</h1>
                <div className="flex items-center gap-2 flex-wrap justify-center md:justify-end">
                    <input
                        type="search"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-4 py-2 rounded-full bg-base-100 dark:bg-dark-base-100 border border-base-300 dark:border-gray-600 focus:ring-primary focus:border-primary transition"
                    />
                    <div className="flex items-center gap-2 bg-base-100 dark:bg-dark-base-100 p-1 rounded-full">
                        <FilterButton active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>All</FilterButton>
                        <FilterButton active={activeFilter === 'players'} onClick={() => setActiveFilter('players')}>Players</FilterButton>
                        <FilterButton active={activeFilter === 'coaches'} onClick={() => setActiveFilter('coaches')}>Coaches</FilterButton>
                    </div>
                </div>
            </div>

            {loading ? (
                <p>Loading team...</p>
            ) : (
                <div className="space-y-12">
                    {filteredCoaches.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-4">Coaching Staff</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredCoaches.map(coach => (
                                    <CoachCard key={coach.id} coach={coach} onClick={() => setSelectedCoach(coach)} />
                                ))}
                            </div>
                        </section>
                    )}
                     {filteredPlayers.length > 0 && (
                        <section>
                         <h2 className="text-2xl font-bold mb-4">Players</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {filteredPlayers.map(player => (
                                <PlayerCard key={player.id} player={player} onClick={() => setSelectedPlayer(player)} />
                            ))}
                        </div>
                    </section>
                     )}
                </div>
            )}
            
            {!loading && filteredCoaches.length === 0 && filteredPlayers.length === 0 && (
                 <Card>
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold">No Results Found</h3>
                        <p className="text-gray-500 mt-2">
                            {searchTerm 
                                ? `Your search for "${searchTerm}" did not match any team members.`
                                : `There are no ${activeFilter} to display.`
                            }
                        </p>
                    </div>
                </Card>
            )}

            <Modal isOpen={!!selectedPlayer} onClose={() => setSelectedPlayer(null)} title="Player Profile">
                {selectedPlayer && <PlayerDetails player={selectedPlayer} />}
            </Modal>
            
            <Modal isOpen={!!selectedCoach} onClose={() => setSelectedCoach(null)} title="Coach Profile">
                {selectedCoach && <CoachDetails coach={selectedCoach} />}
            </Modal>
        </div>
    );
};

export default TeamPage;