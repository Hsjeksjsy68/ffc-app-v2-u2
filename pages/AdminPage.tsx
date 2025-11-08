import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { db } from '../services/firebase';
import { doc, deleteDoc, collection, addDoc, updateDoc, Timestamp, query, orderBy, getDocs } from 'firebase/firestore';
import type { Player, Match, NewsArticle, TrainingSession, UserDocument, AdminItem, Tactics, Coach } from '../types';
import { UsersIcon, CalendarIcon, NewsIcon, TrainingIcon, UsersAdminIcon, AddIcon, CoachIcon } from '../constants';


type AdminTab = 'players' | 'coaches' | 'matches' | 'news' | 'training' | 'users';

// --- Form Sub-Components & Helpers ---
const ImagePreview: React.FC<{ url: string }> = ({ url }) => {
    const [isValid, setIsValid] = useState(false);
    const placeholder = "https://via.placeholder.com/150/FAFAFA/374151?text=No+Image";

    useEffect(() => {
        if (!url || !url.startsWith('http')) {
            setIsValid(false);
            return;
        }
        const img = new Image();
        img.src = url;
        img.onload = () => setIsValid(true);
        img.onerror = () => setIsValid(false);
    }, [url]);

    return (
        <div className="mt-2">
            <img 
                src={isValid ? url : placeholder} 
                alt="Preview" 
                className="w-32 h-32 object-cover rounded-lg bg-base-200"
            />
        </div>
    );
};

interface AdminFormProps {
    activeTab: AdminTab;
    item: AdminItem | null;
    onSave: () => void;
    closeModal: () => void;
    users: UserDocument[];
    players: Player[];
    coaches: Coach[];
}

const AdminForm: React.FC<AdminFormProps> = ({ activeTab, item, onSave, closeModal, users, players }) => {
    const [formData, setFormData] = useState<any>({});
    const [datePart, setDatePart] = useState('');
    const [timePart, setTimePart] = useState('');

    // Goal scorers state for match form
    const [scorerType, setScorerType] = useState<'club' | 'opponent'>('club');
    const [scorerPlayerId, setScorerPlayerId] = useState('');
    const [opponentScorerName, setOpponentScorerName] = useState('');
    const [scorerMinute, setScorerMinute] = useState('');


    useEffect(() => {
        const defaults: { [key in AdminTab]: any } = {
            players: { name: '', position: 'Forward', number: 0, imageUrl: '', joinDate: new Date().toISOString().split('T')[0], stats: { season: { appearances: 0, goals: 0, assists: 0 }, allTime: { appearances: 0, goals: 0, assists: 0 } } },
            coaches: { name: '', role: 'Head Coach', imageUrl: '', joinDate: new Date().toISOString().split('T')[0], bio: '' },
            matches: { opponent: '', competition: 'League', venue: 'Home', isPast: false, score: { home: 0, away: 0 }, goalScorers: [] },
            news: { title: '', summary: '', imageUrl: '' },
            training: { focus: '', location: '' },
            users: { email: '', name: '', isAdmin: false, isPlayer: false, isCoach: false },
        };

        const initialData = item ? { ...item } : defaults[activeTab];
        setFormData(initialData);

        if (initialData.date && initialData.date.toDate) {
            const jsDate = initialData.date.toDate();
            setDatePart(jsDate.toISOString().split('T')[0]); // YYYY-MM-DD
            setTimePart(jsDate.toTimeString().split(' ')[0].substring(0, 5)); // HH:mm
        } else {
            const now = new Date();
            setDatePart(now.toISOString().split('T')[0]);
            setTimePart(now.toTimeString().split(' ')[0].substring(0, 5));
        }

    }, [item, activeTab]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData((prev: any) => ({ ...prev, [name]: checked }));
            return;
        }

        const finalValue = type === 'number' ? parseInt(value, 10) || 0 : value;

        if (name.includes('.')) {
            const parts = name.split('.');
            setFormData((prev: any) => {
                const newState = { ...prev };
                let temp = newState;
                for (let i = 0; i < parts.length - 1; i++) {
                    // Create a shallow copy of the nested object to avoid direct mutation
                    temp[parts[i]] = { ...(temp[parts[i]] || {}) };
                    temp = temp[parts[i]];
                }
                temp[parts[parts.length - 1]] = finalValue;
                return newState;
            });
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: finalValue }));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let dataToSave = { ...formData };
            if (['matches', 'news', 'training'].includes(activeTab)) {
                if (datePart && timePart) {
                    const combinedDate = new Date(`${datePart}T${timePart}`);
                    dataToSave.date = Timestamp.fromDate(combinedDate);
                }
            }

            if (item) { // Update existing
                const docRef = doc(db, activeTab, item.id!);
                const { id, ...updateData } = dataToSave;
                await updateDoc(docRef, updateData);
            } else { // Create new
                 await addDoc(collection(db, activeTab), dataToSave);
            }
            onSave();
            closeModal();
        } catch (error) {
            console.error("Error saving item:", error);
            alert("Error saving item.");
        }
    };

    const handleAddGoalScorer = () => {
        let newScorer: { playerId?: string; playerName?: string; minute?: number; };

        if (scorerType === 'club' && scorerPlayerId) {
            newScorer = {
                playerId: scorerPlayerId,
                minute: scorerMinute ? parseInt(scorerMinute, 10) : undefined,
            };
        } else if (scorerType === 'opponent' && opponentScorerName.trim()) {
            newScorer = {
                playerName: opponentScorerName.trim(),
                minute: scorerMinute ? parseInt(scorerMinute, 10) : undefined,
            };
        } else {
            return; // Do nothing if required fields are empty
        }

        setFormData((prev: any) => ({
            ...prev,
            goalScorers: [...(prev.goalScorers || []), newScorer]
        }));
        
        // Reset inputs
        setScorerPlayerId('');
        setOpponentScorerName('');
        setScorerMinute('');
    };

    const handleRemoveGoalScorer = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            goalScorers: prev.goalScorers.filter((_: any, i: number) => i !== index)
        }));
    };

    const commonClasses = "mt-1 block w-full rounded-md bg-base-200 dark:bg-dark-base-300 border-base-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50";

    const renderFormFields = () => {
        switch (activeTab) {
            case 'players':
                return (<div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <label className="text-sm font-medium">Name <input name="name" value={formData.name || ''} onChange={handleChange} className={commonClasses} required /></label>
                        <label className="text-sm font-medium">Number <input type="number" name="number" value={formData.number || 0} onChange={handleChange} className={commonClasses} required /></label>
                        <label className="text-sm font-medium">Position
                            <select name="position" value={formData.position || 'Forward'} onChange={handleChange} className={commonClasses}>
                                <option>Goalkeeper</option><option>Defender</option><option>Midfielder</option><option>Forward</option>
                            </select>
                        </label>
                    </div>
                    <label className="text-sm font-medium">Image URL <input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className={commonClasses} /></label>
                    {formData.imageUrl && <ImagePreview url={formData.imageUrl} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <label className="text-sm font-medium">Phone <input name="phone" value={formData.phone || ''} onChange={handleChange} className={commonClasses} /></label>
                       <label className="text-sm font-medium">Join Date <input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className={commonClasses} /></label>
                    </div>
                     <label className="text-sm font-medium">Address <input name="address" value={formData.address || ''} onChange={handleChange} className={commonClasses} /></label>
                     <label className="text-sm font-medium">Link to User Account (Optional)
                        <select name="userId" value={formData.userId || ''} onChange={handleChange} className={commonClasses}>
                            <option value="">-- None --</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                        </select>
                    </label>
                    <fieldset className="border p-4 rounded-md dark:border-gray-600"><legend className="font-semibold px-2">Season Stats</legend>
                        <div className="grid grid-cols-3 gap-4">
                        <label className="text-sm">Apps <input type="number" name="stats.season.appearances" value={formData.stats?.season?.appearances || 0} onChange={handleChange} className={commonClasses} /></label>
                        <label className="text-sm">Goals <input type="number" name="stats.season.goals" value={formData.stats?.season?.goals || 0} onChange={handleChange} className={commonClasses} /></label>
                        <label className="text-sm">Assists <input type="number" name="stats.season.assists" value={formData.stats?.season?.assists || 0} onChange={handleChange} className={commonClasses} /></label>
                        </div>
                    </fieldset>
                    <fieldset className="border p-4 rounded-md dark:border-gray-600"><legend className="font-semibold px-2">All-Time Stats</legend>
                        <div className="grid grid-cols-3 gap-4">
                        <label className="text-sm">Apps <input type="number" name="stats.allTime.appearances" value={formData.stats?.allTime?.appearances || 0} onChange={handleChange} className={commonClasses} /></label>
                        <label className="text-sm">Goals <input type="number" name="stats.allTime.goals" value={formData.stats?.allTime?.goals || 0} onChange={handleChange} className={commonClasses} /></label>
                        <label className="text-sm">Assists <input type="number" name="stats.allTime.assists" value={formData.stats?.allTime?.assists || 0} onChange={handleChange} className={commonClasses} /></label>
                        </div>
                    </fieldset>
                </div>);
             case 'coaches':
                return (<div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Name <input name="name" value={formData.name || ''} onChange={handleChange} className={commonClasses} required /></label>
                        <label className="text-sm font-medium">Role <input name="role" value={formData.role || ''} onChange={handleChange} className={commonClasses} required /></label>
                    </div>
                    <label className="text-sm font-medium">Image URL <input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className={commonClasses} /></label>
                    {formData.imageUrl && <ImagePreview url={formData.imageUrl} />}
                    <label className="text-sm font-medium">Join Date <input type="date" name="joinDate" value={formData.joinDate || ''} onChange={handleChange} className={commonClasses} /></label>
                    <label className="text-sm font-medium">Bio <textarea name="bio" value={formData.bio || ''} onChange={handleChange} className={commonClasses} rows={4}></textarea></label>
                     <label className="text-sm font-medium">Link to User Account (Optional)
                        <select name="userId" value={formData.userId || ''} onChange={handleChange} className={commonClasses}>
                            <option value="">-- None --</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.email}</option>)}
                        </select>
                    </label>
                </div>);
            case 'matches':
                return (<div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Opponent <input name="opponent" value={formData.opponent || ''} onChange={handleChange} className={commonClasses} required /></label>
                        <label className="text-sm font-medium">Competition <input name="competition" value={formData.competition || ''} onChange={handleChange} placeholder="e.g., League, Cup" className={commonClasses} /></label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Date <input type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} className={commonClasses} /></label>
                        <label className="text-sm font-medium">Time <input type="time" value={timePart} onChange={(e) => setTimePart(e.target.value)} className={commonClasses} /></label>
                    </div>
                    <label className="text-sm font-medium">Venue
                        <select name="venue" value={formData.venue || 'Home'} onChange={handleChange} className={commonClasses}>
                            <option>Home</option><option>Away</option>
                        </select>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" name="isPast" checked={formData.isPast || false} onChange={handleChange} className="rounded" /> Is this a past match?</label>
                    {formData.isPast && (<>
                        <fieldset className="border p-4 rounded-md dark:border-gray-600"><legend className="font-semibold px-2">Final Score</legend>
                            <div className="grid grid-cols-2 gap-4">
                            <label className="text-sm">Home <input type="number" name="score.home" value={formData.score?.home || 0} onChange={handleChange} className={commonClasses} /></label>
                            <label className="text-sm">Away <input type="number" name="score.away" value={formData.score?.away || 0} onChange={handleChange} className={commonClasses} /></label>
                            </div>
                        </fieldset>
                        <fieldset className="border p-4 rounded-md dark:border-gray-600"><legend className="font-semibold px-2">Goal Scorers</legend>
                            <div className="space-y-2 mb-4">
                                {(formData.goalScorers || []).map((scorer: any, index: number) => {
                                    const player = scorer.playerId ? players.find(p => p.id === scorer.playerId) : null;
                                    const scorerName = player ? player.name : (scorer.playerName || 'Unknown');
                                    const teamTag = player ? '(FFC)' : '(Opponent)';
                                    return (<div key={index} className="flex items-center justify-between text-sm bg-base-200 dark:bg-dark-base-300 p-2 rounded">
                                        <span>{scorerName} <span className="text-xs text-gray-500">{teamTag}</span> {scorer.minute ? `(${scorer.minute}')` : ''}</span>
                                        <button type="button" onClick={() => handleRemoveGoalScorer(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                    </div>);
                                })}
                                {(formData.goalScorers || []).length === 0 && <p className="text-xs text-center text-gray-500">No scorers added yet.</p>}
                            </div>
                            <div className="p-3 bg-base-200/50 dark:bg-dark-base-300/50 rounded-lg">
                                <div className="flex gap-4 mb-2">
                                    <label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" name="scorerType" value="club" checked={scorerType === 'club'} onChange={() => setScorerType('club')} /> Our Player</label>
                                    <label className="flex items-center gap-1 text-sm cursor-pointer"><input type="radio" name="scorerType" value="opponent" checked={scorerType === 'opponent'} onChange={() => setScorerType('opponent')} /> Opponent</label>
                                </div>
                                <div className="flex items-end gap-2">
                                    {scorerType === 'club' ? (
                                         <label className="flex-1 text-sm font-medium">Player
                                            <select value={scorerPlayerId} onChange={e => setScorerPlayerId(e.target.value)} className={commonClasses}>
                                                <option value="">-- Select --</option>
                                                {players.map(p => <option key={p.id} value={p.id!}>{p.name}</option>)}
                                            </select>
                                        </label>
                                    ) : (
                                        <label className="flex-1 text-sm font-medium">Player Name
                                            <input type="text" placeholder="Opponent scorer's name" value={opponentScorerName} onChange={e => setOpponentScorerName(e.target.value)} className={commonClasses} />
                                        </label>
                                    )}
                                   
                                    <label className="w-24 text-sm font-medium">Minute
                                        <input type="number" placeholder="e.g., 42" value={scorerMinute} onChange={e => setScorerMinute(e.target.value)} className={commonClasses} />
                                    </label>
                                    <button type="button" onClick={handleAddGoalScorer} className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus disabled:opacity-50" disabled={(scorerType === 'club' && !scorerPlayerId) || (scorerType === 'opponent' && !opponentScorerName.trim())}>Add</button>
                                </div>
                            </div>
                        </fieldset>
                    </>)}
                </div>);
             case 'news':
                return (<div className="space-y-4">
                    <label className="text-sm font-medium">Title <input name="title" value={formData.title || ''} onChange={handleChange} className={commonClasses} required /></label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Date <input type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} className={commonClasses} /></label>
                        <label className="text-sm font-medium">Time <input type="time" value={timePart} onChange={(e) => setTimePart(e.target.value)} className={commonClasses} /></label>
                    </div>
                    <label className="text-sm font-medium">Image URL <input name="imageUrl" value={formData.imageUrl || ''} onChange={handleChange} className={commonClasses} /></label>
                    {formData.imageUrl && <ImagePreview url={formData.imageUrl} />}
                    <label className="text-sm font-medium">Summary <textarea name="summary" value={formData.summary || ''} onChange={handleChange} className={commonClasses} rows={5} required></textarea></label>
                </div>);
             case 'training':
                 return (<div className="space-y-4">
                     <label className="text-sm font-medium">Focus <input name="focus" value={formData.focus || ''} onChange={handleChange} className={commonClasses} required /></label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm font-medium">Date <input type="date" value={datePart} onChange={(e) => setDatePart(e.target.value)} className={commonClasses} /></label>
                        <label className="text-sm font-medium">Time <input type="time" value={timePart} onChange={(e) => setTimePart(e.target.value)} className={commonClasses} /></label>
                    </div>
                     <label className="text-sm font-medium">Location <input name="location" value={formData.location || ''} onChange={handleChange} className={commonClasses} required /></label>
                 </div>);
            case 'users':
                return (<div className="space-y-4">
                    <label className="text-sm font-medium">Email <input type="email" name="email" value={formData.email || ''} onChange={handleChange} className={commonClasses} required /></label>
                    <label className="text-sm font-medium">Display Name <input name="name" value={formData.name || ''} onChange={handleChange} className={commonClasses} /></label>
                    <fieldset className="border p-4 rounded-md dark:border-gray-600"><legend className="font-semibold px-2">Roles</legend>
                        <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" name="isAdmin" checked={formData.isAdmin || false} onChange={handleChange} className="rounded" /> Is Admin?</label>
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" name="isPlayer" checked={formData.isPlayer || false} onChange={handleChange} className="rounded" /> Is Player?</label>
                        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="checkbox" name="isCoach" checked={formData.isCoach || false} onChange={handleChange} className="rounded" /> Is Coach?</label>
                        </div>
                    </fieldset>
                </div>);
            default: return <p>Select a category to manage.</p>
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto p-1 pr-2">
            {renderFormFields()}
            <button type="submit" className="w-full mt-6 px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary-focus">
                {item ? 'Save Changes' : 'Create Item'}
            </button>
        </form>
    );
};


const AdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('players');
    const [players, setPlayers] = useState<Player[]>([]);
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [users, setUsers] = useState<UserDocument[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<AdminItem | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const playersQuery = query(collection(db, 'players'), orderBy('number'));
            const playersSnap = await getDocs(playersQuery);
            setPlayers(playersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Player) })));

            const coachesQuery = query(collection(db, 'coaches'), orderBy('name'));
            const coachesSnap = await getDocs(coachesQuery);
            setCoaches(coachesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Coach) })));

            const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
            const matchesSnap = await getDocs(matchesQuery);
            setMatches(matchesSnap.docs.map(d => ({ id: d.id, ...(d.data() as Match) })));

            const newsQuery = query(collection(db, 'news'), orderBy('date', 'desc'));
            const newsSnap = await getDocs(newsQuery);
            setNews(newsSnap.docs.map(d => ({ id: d.id, ...(d.data() as NewsArticle) })));

            const trainingQuery = query(collection(db, 'training'), orderBy('date', 'desc'));
            const trainingSnap = await getDocs(trainingQuery);
            setTrainingSessions(trainingSnap.docs.map(d => ({ id: d.id, ...(d.data() as TrainingSession) })));

            const usersQuery = query(collection(db, 'users'));
            const usersSnap = await getDocs(usersQuery);
            setUsers(usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<UserDocument, 'id'>) })));

        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (item: any = null) => {
        setCurrentItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setCurrentItem(null);
        setIsModalOpen(false);
    };
    
    const handleDelete = async (collectionName: AdminTab, id: string | undefined) => {
        if (!id) {
            console.error("Delete failed: item ID is missing.");
            alert("An error occurred: item ID is missing.");
            return;
        }

        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            setDeletingId(id);
            try {
                await deleteDoc(doc(db, collectionName, id));
                // No need for success alert, UI refresh is enough feedback
                fetchData(); 
            } catch (error) {
                console.error("Error deleting document:", error);
                alert("Failed to delete the item. You may not have the required permissions. See console for details.");
            } finally {
                setDeletingId(null);
            }
        }
    };
    
    const upcomingMatchesCount = useMemo(() => matches.filter(m => !m.isPast).length, [matches]);

    const renderContent = () => {
        switch (activeTab) {
            case 'players':
                return <AdminTable loading={loading} data={players} columns={['number', 'name', 'position']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('players', item.id)} deletingId={deletingId} />;
            case 'coaches':
                return <AdminTable loading={loading} data={coaches} columns={['name', 'role', 'joinDate']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('coaches', item.id)} deletingId={deletingId} />;
            case 'matches':
                return <AdminTable loading={loading} data={matches} columns={['date', 'opponent', 'competition', 'venue', 'isPast']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('matches', item.id)} deletingId={deletingId} />;
            case 'news':
                 return <AdminTable loading={loading} data={news} columns={['date', 'title']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('news', item.id)} deletingId={deletingId} />;
            case 'training':
                 return <AdminTable loading={loading} data={trainingSessions} columns={['date', 'focus', 'location']} onEdit={handleOpenModal} onDelete={(item) => handleDelete('training', item.id)} deletingId={deletingId} />;
            case 'users': {
                const usersWithData = users.map(user => {
                    const linkedPlayer = players.find(p => p.userId === user.id);
                    return {
                        ...user,
                        name: user.name || (linkedPlayer ? linkedPlayer.name : 'Not Linked'),
                        isAdmin: user.isAdmin ? 'Yes' : 'No',
                        isPlayer: user.isPlayer ? 'Yes' : 'No',
                        isCoach: user.isCoach ? 'Yes' : 'No',
                    };
                });
                return (
                    <>
                        <div className="p-4 mb-4 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm">
                            <h4 className="font-bold">How User Management Works:</h4>
                            <p className="mt-1">
                                This list shows user profiles from the app's database which control roles (e.g., Admin, Player). For a user to appear here and log in successfully, they must have an account in <strong>Firebase Authentication</strong> AND a profile created here with the <strong>exact same email</strong>.
                            </p>
                        </div>
                        <AdminTable loading={loading} data={usersWithData} columns={['name', 'email', 'isAdmin', 'isPlayer', 'isCoach']} onEdit={handleOpenModal} onDelete={() => alert("For security, user deletion must be done from the Firebase Console.")} deletingId={deletingId} />
                    </>
                );
            }
            default: return null;
        }
    };
    
    const modalTitle = useMemo(() => {
        const action = currentItem ? 'Edit' : 'Add';
        const model = activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1);
        return `${action} ${model}`;
    }, [currentItem, activeTab]);

    const addNewButtonText = useMemo(() => `Add New ${activeTab.slice(0, -1)}`, [activeTab]);

    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={UsersIcon} title="Total Players" value={players.length} color="bg-blue-500" />
                <StatCard icon={CoachIcon} title="Coaching Staff" value={coaches.length} color="bg-purple-500" />
                <StatCard icon={CalendarIcon} title="Upcoming Matches" value={upcomingMatchesCount} color="bg-green-500" />
                <StatCard icon={NewsIcon} title="News Articles" value={news.length} color="bg-yellow-500" />
            </div>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 gap-4">
                    <nav className="flex flex-wrap" aria-label="Tabs">
                        <TabButton name="players" activeTab={activeTab} setActiveTab={setActiveTab} icon={UsersIcon}>Players</TabButton>
                        <TabButton name="coaches" activeTab={activeTab} setActiveTab={setActiveTab} icon={CoachIcon}>Coaches</TabButton>
                        <TabButton name="matches" activeTab={activeTab} setActiveTab={setActiveTab} icon={CalendarIcon}>Matches</TabButton>
                        <TabButton name="news" activeTab={activeTab} setActiveTab={setActiveTab} icon={NewsIcon}>News</TabButton>
                        <TabButton name="training" activeTab={activeTab} setActiveTab={setActiveTab} icon={TrainingIcon}>Training</TabButton>
                        <TabButton name="users" activeTab={activeTab} setActiveTab={setActiveTab} icon={UsersAdminIcon}>Users</TabButton>
                    </nav>
                    <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:bg-primary-focus transition-colors">
                        <AddIcon className="w-5 h-5" />
                        {addNewButtonText}
                    </button>
                </div>
                <div className="mt-2">
                    {renderContent()}
                </div>
            </Card>
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={modalTitle}>
                <AdminForm 
                    activeTab={activeTab} 
                    item={currentItem} 
                    onSave={fetchData} 
                    closeModal={handleCloseModal}
                    users={users}
                    players={players}
                    coaches={coaches}
                />
            </Modal>
        </div>
    );
};

// --- Local Sub Components ---
const SpinnerIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 text-gray-500 animate-spin' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
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

const SkeletonRow: React.FC<{ columns: number, isMobile: boolean }> = ({ columns, isMobile }) => {
    if (isMobile) {
        return (
            <div className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-lg shadow-md border dark:border-gray-700 animate-pulse space-y-3">
                {[...Array(columns)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-1">
                        <div className="h-4 bg-base-300 dark:bg-dark-base-300 rounded w-1/3"></div>
                        <div className="h-4 bg-base-300 dark:bg-dark-base-300 rounded w-1/2"></div>
                    </div>
                ))}
                <div className="flex justify-end gap-4 mt-2 pt-2">
                    <div className="h-8 bg-base-300 dark:bg-dark-base-300 rounded w-20"></div>
                    <div className="h-8 bg-base-300 dark:bg-dark-base-300 rounded w-20"></div>
                </div>
            </div>
        );
    }
    
    // Desktop skeleton
    return (
        <tr className="animate-pulse">
            {[...Array(columns)].map((_, i) => (
                <td key={i} className="p-4"><div className="h-4 bg-base-300 dark:bg-dark-base-300 rounded"></div></td>
            ))}
            <td className="p-4">
                <div className="flex justify-end gap-4">
                    <div className="h-5 w-5 bg-base-300 dark:bg-dark-base-300 rounded-full"></div>
                    <div className="h-5 w-5 bg-base-300 dark:bg-dark-base-300 rounded-full"></div>
                </div>
            </td>
        </tr>
    );
};


const StatCard: React.FC<{icon: React.ComponentType<{className?:string}>, title: string, value: string | number, color: string}> = ({icon: Icon, title, value, color}) => (
    <div className="bg-base-100 dark:bg-dark-base-100 p-6 rounded-2xl shadow-md flex items-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className={`p-4 rounded-full ${color} mr-4`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-md font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{name: AdminTab, activeTab: AdminTab, setActiveTab: (tab: AdminTab) => void, children: React.ReactNode, icon: React.ComponentType<{className?: string}>}> = ({name, activeTab, setActiveTab, children, icon: Icon}) => (
    <button onClick={() => setActiveTab(name)} className={`flex items-center gap-2 whitespace-nowrap py-3 px-5 font-semibold text-sm rounded-t-lg transition-colors focus:outline-none ${activeTab === name ? 'bg-primary/10 text-primary border-b-2 border-primary' : 'text-gray-500 hover:bg-base-200 dark:hover:bg-dark-base-200'}`}>
        <Icon className="w-5 h-5"/> {children}
    </button>
);

const AdminTable: React.FC<{data: any[], columns: string[], onEdit: (item: any) => void, onDelete: (item: any) => void, loading: boolean, deletingId: string | null}> = ({ data, columns, onEdit, onDelete, loading, deletingId }) => (
    <div>
        {/* Table for larger screens */}
        <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-left">
                <thead className="bg-base-200 dark:bg-dark-base-200 text-gray-700 dark:text-gray-400 uppercase text-xs">
                    <tr>
                        {columns.map(col => <th key={col} className="p-4 font-semibold">{col.replace(/([A-Z])/g, ' $1')}</th>)}
                        <th className="p-4 text-right font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        [...Array(5)].map((_, i) => <SkeletonRow key={i} columns={columns.length} isMobile={false} />)
                    ) : data.length > 0 ? (
                        data.map(item => (
                            <tr key={item.id} className="border-b dark:border-gray-700 hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors">
                                {columns.map(col => {
                                    const value = item[col];
                                    let displayValue;
                                    if (value?.toDate) { // Format Firestore Timestamps
                                        displayValue = value.toDate().toLocaleString();
                                    } else if (typeof value === 'boolean') { // Format booleans
                                        displayValue = value ? 'Yes' : 'No';
                                    } else {
                                        displayValue = value;
                                    }
                                    return <td key={`${item.id}-${col}`} className="p-4 align-middle text-sm text-gray-900 dark:text-gray-200">{String(displayValue ?? '')}</td>
                                })}
                                <td className="p-4 text-right align-middle">
                                    <div className="flex justify-end items-center gap-4">
                                        <button onClick={() => onEdit(item)} className="text-blue-500 hover:text-blue-700 transition-colors" aria-label={`Edit ${item.name || item.title || item.email}`}><EditIcon /></button>
                                        <button
                                            onClick={() => onDelete(item)}
                                            className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label={`Delete ${item.name || item.title || item.email}`}
                                            disabled={deletingId === item.id}
                                        >
                                            {deletingId === item.id ? <SpinnerIcon /> : <DeleteIcon />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : null }
                </tbody>
            </table>
        </div>
        
        {/* Cards for mobile screens */}
        <div className="md:hidden space-y-4">
            {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} columns={columns.length} isMobile={true} />)
            ) : data.length > 0 ? (
                data.map(item => (
                    <div key={item.id} className="bg-base-100 dark:bg-dark-base-100 p-4 rounded-lg shadow-md border dark:border-gray-700">
                        <div className="space-y-2">
                            {columns.map(col => {
                                const value = item[col];
                                let displayValue;
                                if (value?.toDate) {
                                    displayValue = value.toDate().toLocaleString();
                                } else if (typeof value === 'boolean') {
                                    displayValue = value ? 'Yes' : 'No';
                                } else {
                                    displayValue = value;
                                }
                                return (
                                    <div key={`${item.id}-${col}`} className="flex justify-between items-center text-sm">
                                        <span className="font-semibold text-gray-500 dark:text-gray-400 capitalize">{col.replace(/([A-Z])/g, ' $1')}</span>
                                        <span className="text-right text-gray-900 dark:text-gray-200">{String(displayValue ?? '')}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end gap-4 mt-4 pt-2 border-t dark:border-gray-600">
                             <button onClick={() => onEdit(item)} className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"><EditIcon className="w-4 h-4" /> Edit</button>
                             <button 
                                onClick={() => onDelete(item)} 
                                className="flex items-center gap-2 px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                                disabled={deletingId === item.id}
                            >
                                {deletingId === item.id ? <SpinnerIcon className="w-4 h-4" /> : <DeleteIcon className="w-4 h-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                 <div className="text-center py-8">
                    <p className="text-gray-500">No items found in this category.</p>
                </div>
            )}
        </div>
    </div>
);

export default AdminPage;