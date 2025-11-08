import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import type { Match, Player, TrainingSession } from '../types';
import { firestore } from '../services/firebase';
import { GoalIcon, TrainingIcon } from '../constants';
// Fix: Removed modular imports for Firebase v9.
// import { collection, getDocs, orderBy, query } from 'firebase/firestore';

const MatchCard: React.FC<{ match: Match, players: Player[] }> = ({ match, players }) => {
    // New, enhanced design for upcoming matches
    if (!match.isPast) {
        const homeTeam = { name: "Flamehunter FC", logo: "https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" };
        const awayTeam = { name: match.opponent, logo: `https://avatar.vercel.sh/${match.opponent}.svg?text=${match.opponent.slice(0, 2).toUpperCase()}` };
        
        const displayTeams = match.venue === 'Home' ? [homeTeam, awayTeam] : [awayTeam, homeTeam];

        return (
            <Card className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-5">
                    {match.competition && (
                        <p className="text-center text-sm font-semibold text-primary mb-3">{match.competition}</p>
                    )}
                    <div className="flex justify-around items-center text-center">
                        {/* Team 1 */}
                        <div className="flex flex-col items-center w-1/3 min-w-0">
                            <img src={displayTeams[0].logo} alt={displayTeams[0].name} className="h-16 w-16 mb-2 object-contain" />
                            <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[0].name}</h3>
                        </div>

                        {/* VS Separator */}
                        <div className="text-2xl sm:text-4xl font-extrabold text-gray-400 dark:text-gray-500">VS</div>

                        {/* Team 2 */}
                        <div className="flex flex-col items-center w-1/3 min-w-0">
                             <img src={displayTeams[1].logo} alt={displayTeams[1].name} className="h-16 w-16 mb-2 object-contain bg-gray-200 dark:bg-dark-base-300 rounded-full" />
                            <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[1].name}</h3>
                        </div>
                    </div>
                </div>
                <div className="bg-base-200 dark:bg-dark-base-200 px-5 py-3 border-t dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {match.date.toDate().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {match.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} @ {match.venue}
                    </p>
                </div>
            </Card>
        );
    }
    
    // New "gorgeous" design for past matches
    const homeTeam = { name: "Flamehunter FC", logo: "https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" };
    const awayTeam = { name: match.opponent, logo: `https://avatar.vercel.sh/${match.opponent}.svg?text=${match.opponent.slice(0, 2).toUpperCase()}` };
    
    const displayTeams = match.venue === 'Home' ? [homeTeam, awayTeam] : [awayTeam, homeTeam];
    const displayScore = match.venue === 'Home' 
        ? { team1: match.score?.home, team2: match.score?.away } 
        : { team1: match.score?.away, team2: match.score?.home };

    const result = match.score!.home > match.score!.away ? 'Win' : match.score!.home < match.score!.away ? 'Loss' : 'Draw';
    const resultColorClasses = {
        Win: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        Loss: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
        Draw: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    };
    
    const opponentLogoClasses = "h-10 w-10 sm:h-16 sm:w-16 mb-2 object-contain bg-gray-200 dark:bg-dark-base-300 rounded-full";
    const ffcLogoClasses = "h-10 w-10 sm:h-16 sm:w-16 mb-2 object-contain";
    
    const sortByMinute = (a: { minute?: number }, b: { minute?: number }) => {
        if (a.minute === undefined && b.minute === undefined) return 0;
        if (a.minute === undefined) return 1;
        if (b.minute === undefined) return -1;
        return a.minute - b.minute;
    };

    const homeScorersList = (match.goalScorers || [])
        .filter(scorer => scorer.playerId) // Our players
        .sort(sortByMinute)
        .map(goal => {
            const player = players.find(p => p.id === goal.playerId);
            const scorerName = player ? player.name : 'Unknown';
            return `${scorerName}${goal.minute ? ` ${goal.minute}'` : ''}`;
        });

    const awayScorersList = (match.goalScorers || [])
        .filter(scorer => scorer.playerName) // Opponent players
        .sort(sortByMinute)
        .map(goal => {
            const scorerName = goal.playerName || 'Unknown';
            return `${scorerName}${goal.minute ? ` ${goal.minute}'` : ''}`;
        });

    const leftScorers = match.venue === 'Home' ? homeScorersList : awayScorersList;
    const rightScorers = match.venue === 'Home' ? awayScorersList : homeScorersList;

    return (
        <Card className="mb-4 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="p-5">
                 {match.competition && (
                    <p className="text-center text-sm font-semibold text-primary mb-3">{match.competition}</p>
                )}
                <div className="flex justify-between items-center text-center space-x-2 sm:space-x-4">
                    {/* Team 1 */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                        <img src={displayTeams[0].logo} alt={displayTeams[0].name} className={displayTeams[0].name === 'Flamehunter FC' ? ffcLogoClasses : opponentLogoClasses} />
                        <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[0].name}</h3>
                    </div>

                    {/* Score */}
                    <div className="text-center px-1 flex-shrink-0">
                         {match.score ? (
                            <>
                                <p className="text-2xl sm:text-4xl font-extrabold text-gray-800 dark:text-gray-100 whitespace-nowrap">{`${displayScore.team1} - ${displayScore.team2}`}</p>
                                <p className={`mt-2 px-3 py-1 text-xs sm:text-sm font-bold rounded-full inline-block ${resultColorClasses[result]}`}>
                                    {result}
                                </p>
                            </>
                         ) : <p className="text-lg font-semibold">Result TBD</p>}
                    </div>

                    {/* Team 2 */}
                    <div className="flex flex-col items-center flex-1 min-w-0">
                         <img src={displayTeams[1].logo} alt={displayTeams[1].name} className={displayTeams[1].name === 'Flamehunter FC' ? ffcLogoClasses : opponentLogoClasses} />
                        <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[1].name}</h3>
                    </div>
                </div>
                
                {(leftScorers.length > 0 || rightScorers.length > 0) && (
                    <div className="mt-4 pt-4 border-t border-base-300 dark:border-gray-700">
                        <div className="flex justify-between text-sm">
                            <div className="w-2/5 text-left space-y-1">
                                {leftScorers.map((scorer, index) => (
                                    <div key={`left-${index}`} className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                                        <GoalIcon className="w-4 h-4 text-gray-500" />
                                        <span>{scorer}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="w-2/5 text-right space-y-1">
                                {rightScorers.map((scorer, index) => (
                                    <div key={`right-${index}`} className="flex items-center justify-end gap-2 text-gray-800 dark:text-gray-200">
                                        <span>{scorer}</span>
                                        <GoalIcon className="w-4 h-4 text-gray-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-base-200 dark:bg-dark-base-200 px-5 py-2 border-t dark:border-gray-700 text-center">
                 <p className="text-xs text-gray-500 dark:text-gray-400">
                    {match.date.toDate().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} @ {match.venue}
                </p>
            </div>
        </Card>
    );
};


const TrainingCard: React.FC<{ session: TrainingSession }> = ({ session }) => {
    const sessionDate = session.date.toDate();
    return (
        <Card className="mb-4">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 p-4 rounded-full">
                    <TrainingIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-xl text-gray-800 dark:text-gray-100">{session.focus}</p>
                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <p>
                            <span className="font-semibold">Date:</span> {sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                        <p>
                            <span className="font-semibold">Time:</span> {sessionDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                         <p>
                            <span className="font-semibold">Location:</span> {session.location}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

type FilterOption = 'this-season' | 'last-season' | 'all-time';

const FilterButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
            isActive
                ? 'bg-primary text-white shadow-md'
                : 'bg-base-100 dark:bg-dark-base-100 hover:bg-base-200 dark:hover:bg-dark-base-200'
        }`}
    >
        {label}
    </button>
);

const getSeasonDateRanges = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    let thisSeasonStartYear, lastSeasonStartYear;

    // Season runs from July 1 to June 30
    if (currentMonth >= 6) { // July or later
        thisSeasonStartYear = currentYear;
        lastSeasonStartYear = currentYear - 1;
    } else { // Before July
        thisSeasonStartYear = currentYear - 1;
        lastSeasonStartYear = currentYear - 2;
    }

    const thisSeasonStartDate = new Date(thisSeasonStartYear, 6, 1); // July 1st
    const thisSeasonEndDate = new Date(thisSeasonStartYear + 1, 5, 30, 23, 59, 59); // June 30th

    const lastSeasonStartDate = new Date(lastSeasonStartYear, 6, 1);
    const lastSeasonEndDate = new Date(lastSeasonStartYear + 1, 5, 30, 23, 59, 59);

    return {
        thisSeason: { start: thisSeasonStartDate, end: thisSeasonEndDate },
        lastSeason: { start: lastSeasonStartDate, end: lastSeasonEndDate },
    };
};


const SchedulePage: React.FC = () => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterOption, setFilterOption] = useState<FilterOption>('this-season');

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            try {
                // Fix: Use namespaced collection() and chained query methods for Firebase v8.
                const matchesRef = firestore.collection('matches');
                const matchesQuery = matchesRef.orderBy('date', 'desc');
                const matchesSnap = await matchesQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                setMatches(matchesSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Match) })));

                const trainingRef = firestore.collection('training');
                const trainingQuery = trainingRef.orderBy('date', 'asc');
                const trainingSnap = await trainingQuery.get();
                // Fix: Cast doc.data() to the expected type to resolve spread operator error with strict typing.
                setTrainingSessions(trainingSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as TrainingSession) })));

                const playersSnap = await firestore.collection('players').get();
                setPlayers(playersSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Player) })));

            } catch (error) {
                console.error("Error fetching schedules:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedules();
    }, []);

    const upcomingMatches = matches.filter(m => !m.isPast).sort((a,b) => a.date.toMillis() - b.date.toMillis());
    
    const filteredPastMatches = useMemo(() => {
        let pastMatches = matches.filter(m => m.isPast);

        if (filterOption === 'this-season') {
            const { thisSeason } = getSeasonDateRanges();
            pastMatches = pastMatches.filter(match => {
                const matchDate = match.date.toDate();
                return matchDate >= thisSeason.start && matchDate <= thisSeason.end;
            });
        } else if (filterOption === 'last-season') {
            const { lastSeason } = getSeasonDateRanges();
            pastMatches = pastMatches.filter(match => {
                const matchDate = match.date.toDate();
                return matchDate >= lastSeason.start && matchDate <= lastSeason.end;
            });
        }
        
        // Sort past matches by date descending (latest first), as requested.
        return pastMatches.sort((a,b) => b.date.toMillis() - a.date.toMillis());
    }, [matches, filterOption]);

    if (loading) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Schedule & Results</h1>
                <p>Loading schedule...</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Schedule & Results</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Upcoming Matches</h2>
                    {upcomingMatches.length > 0 ? upcomingMatches.map(match => <MatchCard key={match.id} match={match} players={players} />) : <p>No upcoming matches.</p>}

                    <h2 className="text-2xl font-bold mt-8 mb-4">Training Sessions</h2>
                    {trainingSessions.length > 0 ? trainingSessions.map(session => <TrainingCard key={session.id} session={session} />) : <p>No training sessions scheduled.</p>}
                </div>
                <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h2 className="text-2xl font-bold">Past Results</h2>
                        <div className="flex-shrink-0 flex items-center gap-2">
                            <FilterButton label="This Season" isActive={filterOption === 'this-season'} onClick={() => setFilterOption('this-season')} />
                            <FilterButton label="Last Season" isActive={filterOption === 'last-season'} onClick={() => setFilterOption('last-season')} />
                            <FilterButton label="All Time" isActive={filterOption === 'all-time'} onClick={() => setFilterOption('all-time')} />
                        </div>
                    </div>
                    {filteredPastMatches.length > 0 ? filteredPastMatches.map(match => <MatchCard key={match.id} match={match} players={players} />) : <p>No past matches found for this period.</p>}
                </div>
            </div>
        </div>
    );
};

export default SchedulePage;