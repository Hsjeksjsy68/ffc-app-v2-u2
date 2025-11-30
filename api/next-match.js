import { firestore } from "../../services/firebase";

export default async function handler(req, res) {
  try {
    const matchesRef = firestore.collection("matches");

    // SAME QUERY as HomePage.tsx
    const upcomingQuery = matchesRef
      .where("isPast", "==", false)
      .orderBy("date", "asc")
      .limit(1);

    const snap = await upcomingQuery.get();

    if (snap.empty) {
      return res.status(404).json({ error: "No upcoming matches" });
    }

    const doc = snap.docs[0];
    const data = doc.data();

    res.status(200).json({
      id: doc.id,
      opponent: data.opponent,
      venue: data.venue,
      isPast: data.isPast,
      date: data.date.toDate(),            // convert Firestore stamp
      score: data.score || null
    });

  } catch (err) {
    console.error("Next match API error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
