import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { auth, db } from '../services/firebase';
import { useAuthContext } from '../hooks/useAuth';
import Card from '../components/Card';
import Modal from '../components/Modal';
import type { Player, Tactics, Match, Coach, TrainingSession } from '../types';
import { collection, query, where, getDocs, limit, orderBy, doc, deleteDoc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { AddIcon, GoalIcon, AssistIcon, UsersIcon, LogoutIcon, MailIcon, PhoneIcon, LocationIcon, CalendarIcon, TacticsIcon } from '../constants';


// --- PLAYER DASHBOARD --- //
const StatCard: React.FC<{ icon: React.ComponentType<{ className?: string }>; title: string; value: string | number; }> = ({ icon: Icon, title, value }) => (
    <div className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-xl shadow-md flex items-center">
        <div className="p-3 bg-primary/10 rounded-full mr-4">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const InfoRow: React.FC<{ icon: React.ComponentType<{ className?: string }>; label: string; value: string | undefined; }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-center text-sm">
        <Icon className="w-5 h-5 text-gray-400 mr-3" />
        <span className="font-semibold text-gray-600 dark:text-gray-400 mr-2">{label}:</span>
        <span className="text-gray-800 dark:text-gray-200">{value || 'Not Provided'}</span>
    </div>
);

const PlayerDashboard: React.FC<{ user: NonNullable<ReturnType<typeof useAuthContext>['user']>, playerData: Player }> = ({ user, playerData }) => {
    const imageUrl = playerData.imageUrl || `https://avatar.vercel.sh/${playerData.name}.svg?text=${playerData.name.charAt(0)}`;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="relative rounded-2xl shadow-lg overflow-hidden">
                <div className="h-40 bg-gradient-to-r from-primary to-accent p-6 flex justify-end">
                     <button
                        onClick={() => auth.signOut()}
                        className="p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
                        aria-label="Log Out"
                    >
                        <LogoutIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-20">
                        <div className="relative">
                            <img src={imageUrl} alt={playerData.name} className="w-32 h-32 rounded-full object-cover border-4 border-base-100 dark:border-dark-base-100 shadow-xl" />
                            <div className="absolute -bottom-1 -right-1 bg-secondary text-white font-bold text-3xl rounded-full w-14 h-14 flex items-center justify-center border-4 border-base-100 dark:border-dark-base-100">
                                {playerData.number}
                            </div>
                        </div>
                        <div className="sm:ml-6 mt-4 sm:mt-0 text-center sm:text-left">
                            <h2 className="text-4xl font-bold">{playerData.name}</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-400">{playerData.position}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="text-xl font-bold mb-4">Player Info</h3>
                    <div className="space-y-3">
                        <InfoRow icon={MailIcon} label="Email" value={user.email!} />
                        <InfoRow icon={PhoneIcon} label="Phone" value={playerData.phone} />
                        <InfoRow icon={LocationIcon} label="Address" value={playerData.address} />
                        <InfoRow icon={CalendarIcon} label="Joined" value={new Date(playerData.joinDate).toLocaleDateString()} />
                    </div>
                </Card>
                 <Card>
                    <h3 className="text-xl font-bold mb-4">All-Time Stats</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <StatCard icon={UsersIcon} title="Appearances" value={playerData.stats.allTime.appearances} />
                       <StatCard icon={GoalIcon} title="Goals" value={playerData.stats.allTime.goals} />
                       <StatCard icon={AssistIcon} title="Assists" value={playerData.stats.allTime.assists} />
                    </div>
                </Card>
            </div>
             <Card>
                <h3 className="text-xl font-bold mb-4">Current Season Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                   <StatCard icon={UsersIcon} title="Appearances" value={playerData.stats.season.appearances} />
                   <StatCard icon={GoalIcon} title="Goals" value={playerData.stats.season.goals} />
                   <StatCard icon={AssistIcon} title="Assists" value={playerData.stats.season.assists} />
                </div>
            </Card>
        </div>
    );
};


// --- COACH DASHBOARD --- //
const CoachStatCard: React.FC<{icon: React.ComponentType<{className?:string}>, title: string, value: string | number, color: string}> = ({icon: Icon, title, value, color}) => (
    <div className="bg-base-100 dark:bg-dark-base-100 p-5 rounded-xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className={`p-3 rounded-full ${color} mr-4`}>
            <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const EditIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const DeleteIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const DraggablePlayer: React.FC<{player: Player, onDragStart: (e: React.DragEvent, playerId: string) => void}> = ({ player, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, player.id!)}
        className="flex items-center p-2 bg-base-100 dark:bg-dark-base-100 rounded-md shadow-sm cursor-grab active:cursor-grabbing border dark:border-gray-700"
    >
        <div className="w-6 h-6 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{player.number}</div>
        <span className="font-semibold text-sm">{player.name}</span>
    </div>
);

const PitchPlayer: React.FC<{player: Player, position: { top: number, left: number }, onDragStart: (e: React.DragEvent, playerId: string) => void}> = ({ player, position, onDragStart }) => (
     <div
        draggable
        onDragStart={(e) => onDragStart(e, player.id!)}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group"
        style={{ top: `${position.top}%`, left: `${position.left}%` }}
    >
        <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
                {player.number}
            </div>
            <div className="absolute top-full mt-1 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                {player.name}
            </div>
        </div>
    </div>
);


const TacticsForm: React.FC<{ item: any, onSave: () => void, closeModal: () => void, players: Player[], matches: Match[] }> = ({ item, onSave, closeModal, players, matches }) => {
    const [formData, setFormData] = useState<any>({});
    const [substituteToAdd, setSubstituteToAdd] = useState('');
    const pitchRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        const tacticsDefaults = { matchId: '', formation: '4-4-2', generalNotes: '', startingXI: [], substitutes: [] };
        const initialData = { ...tacticsDefaults, ...(item || {}) };
        if (item && item.startingXI && item.startingXI.length > 0 && typeof item.startingXI[0] === 'string') {
            initialData.startingXI = item.startingXI.map((playerId: string, index: number) => ({
                playerId,
                position: { top: 50 + (index-5)*5, left: 50 }
            }));
        }
        setFormData(initialData);
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let dataToSave = { ...formData };
            if (item) {
                const docRef = doc(db, 'tactics', item.id);
                const { id, ...updateData } = dataToSave;
                await updateDoc(docRef, updateData);
            } else {
                const { id, ...addData } = dataToSave;
                await addDoc(collection(db, 'tactics'), addData);
            }
            onSave();
            closeModal();
        } catch (error) {
            console.error("Error saving tactics:", error);
            alert("Error saving tactics.");
        }
    };

    const handleDragStart = (e: React.DragEvent, playerId: string) => {
        e.dataTransfer.setData("playerId", playerId);
    };

    const handleDrop = (e: React.DragEvent, target: 'pitch' | 'available' | 'substitutes') => {
        e.preventDefault();
        const playerId = e.dataTransfer.getData("playerId");
        if (!playerId) return;

        setFormData((prev: Tactics) => {
            let newStartingXI = [...(prev.startingXI || [])];
            let newSubstitutes = [...(prev.substitutes || [])];

            newStartingXI = newStartingXI.filter(p => p.playerId !== playerId);
            newSubstitutes = newSubstitutes.filter(id => id !== playerId);

            if (target === 'pitch' && pitchRef.current) {
                const rect = pitchRef.current.getBoundingClientRect();
                const left = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                const top = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                newStartingXI.push({ playerId, position: { top, left } });
            } else if (target === 'substitutes') {
                newSubstitutes.push(playerId);
            }
            
            return { ...prev, startingXI: newStartingXI, substitutes: newSubstitutes };
        });
    };
    
    const handleAddSubstitute = () => {
        if (!substituteToAdd) return;
        setFormData((prev: any) => ({
            ...prev,
            substitutes: [...(prev.substitutes || []), substituteToAdd]
        }));
        setSubstituteToAdd('');
    };

    const handleRemoveSubstitute = (playerIdToRemove: string) => {
        setFormData((prev: any) => ({
            ...prev,
            substitutes: (prev.substitutes || []).filter((id: string) => id !== playerIdToRemove)
        }));
    };

    const commonClasses = "mt-1 block w-full rounded-md bg-base-200 dark:bg-dark-base-300 border-base-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50";
    
    const startingXI_ids = useMemo(() => (formData.startingXI || []).map((p: any) => p.playerId), [formData.startingXI]);
    const substitutes_ids = useMemo(() => formData.substitutes || [], [formData.substitutes]);
    
    const rosterPlayers = useMemo(() => players
        .filter(p => p.id && !startingXI_ids.includes(p.id) && !substitutes_ids.includes(p.id))
        .sort((a, b) => a.number - b.number), 
        [players, startingXI_ids, substitutes_ids]
    );
    
    const upcomingMatches = matches.filter(m => !m.isPast).sort((a,b) => a.date.toMillis() - b.date.toMillis());

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="text-sm font-medium">Match
                    <select name="matchId" value={formData['matchId'] || ''} onChange={handleChange} className={commonClasses} required>
                        <option value="">-- Select a Match --</option>
                        {upcomingMatches.map(m => (
                            <option key={m.id} value={m.id!}>vs {m.opponent} on {m.date.toDate().toLocaleDateString()}</option>
                        ))}
                    </select>
                </label>
                 <label className="text-sm font-medium">Formation (e.g., 4-4-2) <input name="formation" value={formData['formation'] || ''} onChange={handleChange} className={commonClasses} required /></label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                <div 
                    className="p-4 border-2 border-dashed border-gray-400 rounded-lg bg-base-200 dark:bg-dark-base-200 h-full max-h-[60vh] overflow-y-auto"
                    onDrop={(e) => handleDrop(e, 'available')} 
                    onDragOver={(e) => e.preventDefault()}
                >
                    <h3 className="font-bold text-lg text-center mb-2">Club Roster</h3>
                    <div className="space-y-2">
                        {rosterPlayers.length > 0 ? rosterPlayers.map(p => (
                            <DraggablePlayer key={p.id} player={p} onDragStart={handleDragStart} />
                        )) : <p className="text-center text-sm text-gray-500">All players assigned.</p>}
                    </div>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-2">Starting XI (Drag from Roster)</h3>
                        <div 
                            ref={pitchRef}
                            onDrop={(e) => handleDrop(e, 'pitch')}
                            onDragOver={(e) => e.preventDefault()}
                            className="relative w-full aspect-[2/3] bg-green-700/50 dark:bg-green-800/50 border-2 border-dashed border-gray-400 rounded-lg overflow-hidden"
                        >
                            {(formData.startingXI || []).map(({ playerId, position }: { playerId: string, position: any }) => {
                                const player = players.find(p => p.id === playerId);
                                if (!player) return null;
                                return <PitchPlayer key={playerId} player={player} position={position} onDragStart={handleDragStart} />
                            })}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Substitutes</h3>
                        <div 
                            onDrop={(e) => handleDrop(e, 'substitutes')} 
                            onDragOver={(e) => e.preventDefault()} 
                            className="p-4 border-2 border-dashed border-gray-400 rounded-lg bg-base-200 dark:bg-dark-base-200 min-h-[150px] space-y-2"
                        >
                            {substitutes_ids.map((id: string) => {
                                const player = players.find(p => p.id === id);
                                if (!player) return null;
                                return (
                                    <div key={id} draggable onDragStart={(e) => handleDragStart(e, player.id!)} className="flex items-center justify-between p-2 bg-base-100 dark:bg-dark-base-100 rounded-md shadow-sm cursor-grab active:cursor-grabbing border dark:border-gray-700">
                                        <div className="flex items-center">
                                            <div className="w-6 h-6 mr-2 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{player.number}</div>
                                            <span className="font-semibold text-sm">{player.name}</span>
                                        </div>
                                        <button type="button" onClick={() => handleRemoveSubstitute(player.id!)} className="p-1 text-red-500 hover:text-red-700" aria-label={`Remove ${player.name}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                            {substitutes_ids.length === 0 && <p className="text-center text-sm text-gray-500">Drag players here.</p>}
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <select value={substituteToAdd} onChange={(e) => setSubstituteToAdd(e.target.value)} className={`${commonClasses} flex-grow`}>
                                <option value="">-- Add a substitute --</option>
                                {rosterPlayers.map(p => (<option key={p.id} value={p.id!}>#{p.number} - {p.name}</option>))}
                            </select>
                            <button type="button" onClick={handleAddSubstitute} disabled={!substituteToAdd} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus disabled:opacity-50">Add</button>
                        </div>
                    </div>
                </div>
            </div>

             <label className="text-sm font-medium">General Notes <textarea name="generalNotes" value={formData['generalNotes'] || ''} onChange={handleChange} className={commonClasses} rows={3}></textarea></label>
            <button type="submit" className="w-full mt-6 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-focus">Save Tactics</button>
        </form>
    );
};

const CoachDashboard: React.FC<{ user: NonNullable<ReturnType<typeof useAuthContext>['user']> }> = ({ user }) => {
    const [tactics, setTactics] = useState<Tactics[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [training, setTraining] = useState<TrainingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<Tactics | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const tacticsQuery = query(collection(db, 'tactics'));
            const tacticsSnap = await getDocs(tacticsQuery);
            const tacticsData = tacticsSnap.docs.map(d => ({ id: d.id, ...(d.data() as Tactics) }));

            const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
            const matchesSnap = await getDocs(matchesQuery);
            const matchesData = matchesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Match) }));
            setMatches(matchesData);

             const trainingQuery = query(collection(db, 'training'), orderBy('date', 'asc'));
            const trainingSnap = await getDocs(trainingQuery);
            setTraining(trainingSnap.docs.map(d => ({ id: d.id, ...(d.data() as TrainingSession) })));
            
            // Enrich tactics data with match info
            const enrichedTactics = tacticsData.map(t => {
                const match = matchesData.find(m => m.id === t.matchId);
                return {
                    ...t,
                    matchInfo: match ? `vs ${match.opponent}` : 'Match not found',
                    matchDate: match ? match.date.toDate().toLocaleDateString() : 'N/A'
                };
            }).sort((a,b) => {
                 const matchA = matchesData.find(m => m.id === a.matchId);
                 const matchB = matchesData.find(m => m.id === b.matchId);
                 if (matchA && matchB) return matchB.date.toMillis() - matchA.date.toMillis();
                 return 0;
            });
            setTactics(enrichedTactics);

            const playersQuery = query(collection(db, 'players'), orderBy('number'));
            const playersSnap = await getDocs(playersQuery);
            setPlayers(playersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Player) })));

        } catch (error) {
            console.error("Error fetching coach data:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item: Tactics | null = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentItem(null);
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string | undefined) => {
        if (!id || !window.confirm('Are you sure you want to delete these tactics?')) return;
        try {
            await deleteDoc(doc(db, 'tactics', id));
            fetchData();
        } catch (error) {
            console.error("Error deleting tactics:", error);
            alert("Failed to delete tactics.");
        }
    };
    
    const nextMatch = useMemo(() => matches.filter(m => !m.isPast).sort((a,b) => a.date.toMillis() - b.date.toMillis())[0], [matches]);
    const nextTraining = useMemo(() => training.filter(t => t.date.toDate() > new Date())[0], [training]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                    <h1 className="text-3xl font-bold">Coach Dashboard</h1>
                    <p className="text-gray-600 dark:text-gray-400">Welcome, {user.displayName || user.email}</p>
                </div>
                 <button
                    onClick={() => auth.signOut()}
                    className="flex items-center gap-2 mt-2 sm:mt-0 py-2 px-4 bg-base-100 dark:bg-dark-base-100 rounded-lg shadow-sm hover:bg-base-200 dark:hover:bg-dark-base-200"
                >
                    <LogoutIcon className="w-5 h-5 text-accent"/>
                    <span>Log Out</span>
                </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CoachStatCard icon={CalendarIcon} title="Next Match" value={nextMatch ? `vs ${nextMatch.opponent}` : 'None'} color="bg-green-500" />
                <CoachStatCard icon={UsersIcon} title="Total Players" value={players.length} color="bg-blue-500" />
                <CoachStatCard icon={TacticsIcon} title="Next Training" value={nextTraining ? nextTraining.focus : 'None'} color="bg-purple-500" />
            </div>
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Tactics Management</h3>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary-focus">
                        <AddIcon className="w-5 h-5" />
                        New Tactics
                    </button>
                </div>
                {loading ? <p>Loading tactics...</p> : (
                    <div className="space-y-3">
                        {tactics.length > 0 ? tactics.map((t: any) => (
                             <div key={t.id} className="bg-base-200 dark:bg-dark-base-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <div className="flex-1">
                                    <p className="font-bold text-lg text-gray-800 dark:text-gray-100">{t.matchInfo}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                       <span>{t.matchDate}</span>
                                       <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                       <span>Formation: <strong>{t.formation}</strong></span>
                                    </div>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <button onClick={() => handleOpenModal(t)} className="p-2 rounded-md bg-base-100 dark:bg-dark-base-100 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"><EditIcon /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 rounded-md bg-base-100 dark:bg-dark-base-100 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><DeleteIcon /></button>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8">
                                <p className="text-gray-500">No tactics created yet.</p>
                                <button onClick={() => handleOpenModal()} className="mt-4 text-primary font-semibold">Create your first one</button>
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentItem ? 'Edit Tactics' : 'Add New Tactics'}>
                <TacticsForm item={currentItem} onSave={fetchData} closeModal={handleCloseModal} players={players} matches={matches} />
            </Modal>
        </div>
    );
};


const LoginPage: React.FC = () => {
    const { user, isCoach } = useAuthContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // New state for robust role verification
    const [resolvedRole, setResolvedRole] = useState<'player' | 'coach' | 'unknown' | null>(null);
    const [playerProfile, setPlayerProfile] = useState<Player | null>(null); // New state to hold player data
    const [roleLoading, setRoleLoading] = useState(true);
    const [roleError, setRoleError] = useState('');

    useEffect(() => {
        if (!user) {
            setRoleLoading(false);
            setResolvedRole(null);
            setPlayerProfile(null);
            return;
        }

        const resolveUserRole = async () => {
            setRoleLoading(true);
            setRoleError('');
            setPlayerProfile(null);

            // If auth context says they're a coach, we trust it.
            if (isCoach) {
                setResolvedRole('coach');
                setRoleLoading(false);
                return;
            }

            // Auth context says they are not a coach. Let's verify.
            try {
                // Check for a player profile first
                const playersRef = collection(db, 'players');
                const pQuery = query(playersRef, where('userId', '==', user.uid), limit(1));
                const pSnapshot = await getDocs(pQuery);

                if (!pSnapshot.empty) {
                    const playerDoc = pSnapshot.docs[0];
                    setPlayerProfile({ id: playerDoc.id, ...playerDoc.data() } as Player);
                    setResolvedRole('player');
                    setRoleLoading(false);
                    return;
                }

                // No player profile found. Check for a coach profile (handles misconfigured roles).
                const coachesRef = collection(db, 'coaches');
                const cQuery = query(coachesRef, where('userId', '==', user.uid), limit(1));
                const cSnapshot = await getDocs(cQuery);
                
                if (!cSnapshot.empty) {
                    console.warn(`User ${user.email} has isCoach=false in 'users' doc, but a linked coach profile was found. Auto-promoting to coach for this session.`);
                    setResolvedRole('coach');
                    setRoleLoading(false);
                    return;
                }

                // No player OR coach profile is linked to this user.
                setRoleError("Your login account is not linked to a player or coach profile. Please contact an administrator.");
                setResolvedRole('unknown');
                setRoleLoading(false);

            } catch (err) {
                console.error("Error resolving user role:", err);
                setRoleError("An error occurred while verifying your profile. Please try again later.");
                setResolvedRole('unknown');
                setRoleLoading(false);
            }
        };

        resolveUserRole();

    }, [user, isCoach]);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err: any) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                 setError('Invalid email or password. Please try again.');
            } else {
                 setError('An unexpected error occurred. Please try again later.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (user) {
        if (roleLoading) {
            return (
                <Card className="max-w-md mx-auto text-center p-8">
                    <div className="flex justify-center items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-semibold">Verifying your profile...</p>
                    </div>
                </Card>
            );
        }

        if (roleError) {
            return (
                <Card className="max-w-2xl mx-auto text-center p-8">
                    <h2 className="text-2xl font-bold mb-4 text-red-600">Profile Error</h2>
                    <p>{roleError}</p>
                    <button
                        onClick={() => auth.signOut()}
                        className="w-full md:w-auto mt-6 py-2 px-6 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors"
                    >
                        Log Out
                    </button>
                </Card>
            );
        }

        if (resolvedRole === 'coach') {
            return <CoachDashboard user={user} />;
        }
        
        if (resolvedRole === 'player' && playerProfile) {
            return <PlayerDashboard user={user} playerData={playerProfile} />;
        }

        return null; // Fallback, should be covered by error/loading states
    }

    return (
        <div className="flex items-center justify-center">
            <Card className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center mb-6">Player & Coach Login</h1>
                <form onSubmit={handleLogin}>
                    {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-4">{error}</p>}
                    <div className="mb-4">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-base-200 dark:bg-dark-base-200 border-base-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg bg-base-200 dark:bg-dark-base-200 border-base-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-focus focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Logging In...' : 'Log In'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default LoginPage;