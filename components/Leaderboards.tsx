import React, { useState, useEffect, useMemo } from 'react';
import { firestore } from '../services/firebase';
import type { Player } from '../types';
import Card from './Card';
import Modal from './Modal';
import { GoalIcon, AssistIcon, TrophyIcon } from '../constants';

interface LeaderboardPlayer extends Player {
    stat: number;
}

const LeaderboardPanel: React.FC<{ title: string; players: LeaderboardPlayer[]; icon: React.ComponentType<{ className?: string }>; }> = ({ title, players, icon: Icon }) => (
    <Card>
        <div className="flex items-center mb-4">
            <Icon className="w-6 h-6 mr-3 text-primary" />
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <ul className="space-y-3">
            {players.map((player, index) => (
                <li key={player.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                    <div className="flex items-center">
                        <span className={`font-bold w-8 text-center text-lg ${index < 3 ? 'text-primary' : 'text-gray-500'}`}>{index + 1}.</span>
                        <img src={player.imageUrl || `https://avatar.vercel.sh/${player.name}.svg?text=${player.name.charAt(0)}`} alt={player.name} className="w-10 h-10 rounded-full object-cover mr-3" />
                        <div>
                            <p className="font-semibold">{player.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">#{player.number}</p>
                        </div>
                    </div>
                    <span className="text-xl font-bold text-gray-800 dark:text-gray-200">{player.stat}</span>
                </li>
            ))}
            {players.length === 0 && <p className="text-center text-gray-500 py-4">No data available.</p>}
        </ul>
    </Card>
);

const FullStatsTable: React.FC<{ players: Player[] }> = ({ players }) => {
    type SortKey = 'name' | 'appearances' | 'goals' | 'assists' | 'ga';
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'ga', direction: 'descending' });

    const sortedPlayers = useMemo(() => {
        let sortablePlayers = players.map(p => ({
            ...p,
            ga: p.stats.season.goals + p.stats.season.assists,
        }));

        if (sortConfig !== null) {
            sortablePlayers.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;

                if (sortConfig.key === 'name') {
                    aValue = a.name;
                    bValue = b.name;
                } else if (sortConfig.key === 'ga') {
                    aValue = a.ga;
                    bValue = b.ga;
                } else {
                    aValue = a.stats.season[sortConfig.key as 'appearances' | 'goals' | 'assists'];
                    bValue = b.stats.season[sortConfig.key as 'appearances' | 'goals' | 'assists'];
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortablePlayers;
    }, [players, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        } else if (sortConfig.key !== key) {
             direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const getSortIndicator = (key: SortKey) => {
        if (sortConfig.key !== key) return ' ↕';
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };

    const columns: { key: SortKey, label: string }[] = [
        { key: 'name', label: 'Player' },
        { key: 'appearances', label: 'Apps' },
        { key: 'goals', label: 'Goals' },
        { key: 'assists', label: 'Assists' },
        { key: 'ga', label: 'G/A' },
    ];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-base-200 dark:bg-dark-base-200 text-gray-700 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        <th className="p-4 font-semibold">#</th>
                        {columns.map(({ key, label }) => (
                            <th key={key} className="p-4 font-semibold cursor-pointer hover:bg-base-300 dark:hover:bg-dark-base-300 transition-colors" onClick={() => requestSort(key)}>
                                {label}{getSortIndicator(key)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedPlayers.map((player, index) => (
                        <tr key={player.id} className="border-b dark:border-gray-700 hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                            <td className="p-4 text-sm font-semibold">{index + 1}</td>
                            <td className="p-4 text-sm font-semibold text-gray-900 dark:text-gray-200 flex items-center">
                                <img src={player.imageUrl || `https://avatar.vercel.sh/${player.name}.svg?text=${player.name.charAt(0)}`} alt={player.name} className="w-8 h-8 rounded-full object-cover mr-3" />
                                {player.name}
                            </td>
                            <td className="p-4 text-sm text-center text-gray-800 dark:text-gray-300">{player.stats.season.appearances}</td>
                            <td className="p-4 text-sm text-center text-gray-800 dark:text-gray-300">{player.stats.season.goals}</td>
                            <td className="p-4 text-sm text-center text-gray-800 dark:text-gray-300">{player.stats.season.assists}</td>
                            <td className="p-4 text-sm text-center font-bold text-gray-900 dark:text-gray-100">{player.ga}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};


const Leaderboards: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                const playersCollection = firestore.collection('players');
                const playerSnapshot = await playersCollection.get();
                const playerList = playerSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Player) }));
                setPlayers(playerList);
            } catch (error) {
                console.error("Error fetching players for leaderboards:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlayers();
    }, []);

    const topScorers = useMemo(() => {
        return [...players]
            .filter(p => p.stats.season.goals > 0)
            .sort((a, b) => b.stats.season.goals - a.stats.season.goals)
            .slice(0, 3)
            .map(p => ({ ...p, stat: p.stats.season.goals }));
    }, [players]);

    const topAssisters = useMemo(() => {
        return [...players]
             .filter(p => p.stats.season.assists > 0)
            .sort((a, b) => b.stats.season.assists - a.stats.season.assists)
            .slice(0, 3)
            .map(p => ({ ...p, stat: p.stats.season.assists }));
    }, [players]);

    const topGA = useMemo(() => {
        return [...players]
            .map(p => ({
                ...p,
                stat: p.stats.season.goals + p.stats.season.assists,
            }))
            .filter(p => p.stat > 0)
            .sort((a, b) => b.stat - a.stat)
            .slice(0, 3);
    }, [players]);

    if (loading) {
        return (
            <section>
                <div className="h-8 bg-gray-200 dark:bg-dark-base-300 rounded-md w-1/3 mb-4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                         <div key={i} className="bg-gray-200 dark:bg-dark-base-300 rounded-2xl h-80"></div>
                    ))}
                </div>
            </section>
        );
    }
    
    return (
        <>
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-bold">Season Leaders</h2>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                    >
                        Show More
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <LeaderboardPanel title="Top Goal Scorers" players={topScorers} icon={GoalIcon} />
                    <LeaderboardPanel title="Top Assisters" players={topAssisters} icon={AssistIcon} />
                    <LeaderboardPanel title="Top G/A" players={topGA} icon={TrophyIcon} />
                </div>
            </section>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Full Season Stats">
                <FullStatsTable players={players} />
            </Modal>
        </>
    );
};

export default Leaderboards;