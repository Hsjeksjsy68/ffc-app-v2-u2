import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import type { Match, NewsArticle } from '../types';
import { firestore } from '../services/firebase';
import Leaderboards from '../components/Leaderboards';

const HomePage: React.FC = () => {
    const [nextMatch, setNextMatch] = useState<Match | null>(null);
    const [latestNews, setLatestNews] = useState<NewsArticle | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch next upcoming match
                const matchesRef = firestore.collection('matches');
                const upcomingQuery = matchesRef
                    .where('isPast', '==', false)
                    .orderBy('date', 'asc')
                    .limit(1);

                const upcomingSnap = await upcomingQuery.get();
                if (!upcomingSnap.empty) {
                    setNextMatch({ id: upcomingSnap.docs[0].id, ...(upcomingSnap.docs[0].data() as Match) });
                }

                // Fetch latest news article
                const newsRef = firestore.collection('news');
                const newsQuery = newsRef.orderBy('date', 'desc').limit(1);
                const newsSnap = await newsQuery.get();
                if (!newsSnap.empty) {
                    setLatestNews({ id: newsSnap.docs[0].id, ...(newsSnap.docs[0].data() as NewsArticle) });
                }

            } catch (error) {
                console.error("Error fetching home page data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    useEffect(() => {
        if (!nextMatch) return;

        const calculateTimeLeft = () => {
            const difference = +nextMatch.date.toDate() - +new Date();
            let newTimeLeft = {};

            if (difference > 0) {
                newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return newTimeLeft;
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [nextMatch]);
    
    const CountdownUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
        <div className="flex flex-col items-center justify-center bg-base-200 dark:bg-dark-base-200 p-3 rounded-lg w-16 h-16 sm:w-20 sm:h-20 border border-base-300 dark:border-gray-700">
            <span className="text-2xl sm:text-3xl font-bold text-base-content dark:text-dark-base-content tracking-tighter">{String(value).padStart(2, '0')}</span>
            <span className="text-xs uppercase text-gray-500 dark:text-gray-400">{label}</span>
        </div>
    );

    const renderNextMatch = () => {
        if (!nextMatch) {
            return <Card><p className="text-center p-8">No upcoming matches scheduled.</p></Card>;
        }
        
        const homeTeam = { name: "Flamehunter FC", logo: "https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" };
        const awayTeam = { name: nextMatch.opponent, logo: `https://avatar.vercel.sh/${nextMatch.opponent}.svg?text=${nextMatch.opponent.slice(0, 2).toUpperCase()}` };
        
        const displayTeams = nextMatch.venue === 'Home' ? [homeTeam, awayTeam] : [awayTeam, homeTeam];

        return (
            <Card className="overflow-hidden shadow-xl p-0">
                <div className="p-5">
                    {nextMatch.competition && (
                        <p className="text-center text-sm font-semibold text-primary mb-3">{nextMatch.competition}</p>
                    )}
                    <div className="flex justify-around items-center text-center">
                        <div className="flex flex-col items-center w-1/3 min-w-0">
                            <img src={displayTeams[0].logo} alt={displayTeams[0].name} className="h-16 w-16 mb-2 object-contain" />
                            <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[0].name}</h3>
                        </div>

                        <div className="text-2xl sm:text-4xl font-extrabold text-gray-400 dark:text-gray-500">VS</div>

                        <div className="flex flex-col items-center w-1/3 min-w-0">
                            <img src={displayTeams[1].logo} alt={displayTeams[1].name} className="h-16 w-16 mb-2 object-contain bg-gray-200 dark:bg-dark-base-300 rounded-full" />
                            <h3 className="font-bold text-sm sm:text-lg truncate">{displayTeams[1].name}</h3>
                        </div>
                    </div>
                </div>

                {Object.keys(timeLeft).length > 0 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-4 my-4 px-4">
                        <CountdownUnit value={timeLeft.days || 0} label="Days" />
                        <CountdownUnit value={timeLeft.hours || 0} label="Hours" />
                        <CountdownUnit value={timeLeft.minutes || 0} label="Mins" />
                        <CountdownUnit value={timeLeft.seconds || 0} label="Secs" />
                    </div>
                )}
                
                <div className="bg-base-200 dark:bg-dark-base-200 px-5 py-3 border-t dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {nextMatch.date.toDate().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {nextMatch.date.toDate().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} @ {nextMatch.venue}
                    </p>
                </div>
            </Card>
        );
    };

    const renderLatestNews = () => {
        if (!latestNews) {
            return <Card><p className="p-6 text-center">No news available at the moment.</p></Card>;
        }
        return (
            <div className="relative h-full min-h-[450px] rounded-2xl overflow-hidden shadow-lg group cursor-pointer">
                <img src={latestNews.imageUrl} alt={latestNews.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white flex flex-col justify-end h-full">
                    <div>
                        <p className="text-sm opacity-80 mb-1">{latestNews.date.toDate().toLocaleDateString()}</p>
                        <h3 className="text-2xl font-bold leading-tight">{latestNews.title}</h3>
                        <p className="mt-2 text-sm opacity-90 hidden sm:block">{latestNews.summary}</p>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                 <div className="h-64 bg-gray-200 dark:bg-dark-base-300 rounded-3xl w-full mx-auto"></div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                     <div className="lg:col-span-3 h-96 bg-gray-200 dark:bg-dark-base-300 rounded-2xl"></div>
                     <div className="lg:col-span-2 h-96 bg-gray-200 dark:bg-dark-base-300 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up">
            <header className="relative text-white text-center py-20 px-6 rounded-3xl overflow-hidden bg-gray-800">
                <div 
                    className="absolute inset-0 bg-cover bg-center z-0" 
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1935&auto=format&fit=crop')" }}>
                </div>
                <div className="absolute inset-0 bg-black/60 z-10"></div>
                <div className="relative z-20">
                    <img src="https://flamehunter-fc.odoo.com/web/image/website/1/logo/Flamehunter%20FC?unique=2e18922" alt="Logo" className="h-24 mx-auto mb-4" />
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-2 tracking-tight">FLAMEHUNTER FC</h1>
                    <p className="text-lg md:text-xl text-gray-300">FORGED IN FIRE, BOUND BY VICTORY</p>
                </div>
            </header>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-8">
                <section className="lg:col-span-3">
                    <h2 className="text-3xl font-bold mb-4">Next Match</h2>
                    {renderNextMatch()}
                </section>
                <section className="lg:col-span-2">
                    <h2 className="text-3xl font-bold mb-4">Latest News</h2>
                     {renderLatestNews()}
                </section>
            </div>
            
            <div className="mt-16">
                <Leaderboards />
            </div>

        </div>
    );
};

export default HomePage;