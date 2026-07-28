# Cochonnet

A solo, daily score-attack game based on pétanque: throw boules at a jack whose position is deterministic per day, and compare your score with others who played the same layout.

## Language

**Boule**:
A ball thrown by the player, aimed at landing as close as possible to the cochonnet. Each player throws 3 per end.

**Cochonnet**:
The small target ball (also called the "jack" in English pétanque) that boules are thrown toward. Its position each end starts from the Daily Seed, but a thrown boule can strike and displace it during play — scoring for the rest of the end is measured against wherever it comes to rest. Also the name of this game.
_Avoid_: Jack (use only when clarifying for an English-speaking audience unfamiliar with the term)

**End**:
One round of play: the cochonnet is placed, then the player throws boules at it until either all 3 have been thrown or the end is voided. A session consists of 3 ends.
_Avoid_: Mène, round

**Current Score**:
The running total for an End that hasn't finished yet: the sum of zone points for whichever boules have landed so far, using their present positions. Recalculates whenever a boule's or the cochonnet's position changes, since a collision can move a boule already thrown into a different Scoring Zone (or off the Terrain). Becomes the End's final score the moment the End completes.
_Avoid_: Provisional score, running score, live score

**Voided End**:
An end that terminates immediately, scoring zero, because a thrown boule knocked the cochonnet outside the Terrain's bounds. Any boules not yet thrown for that end are never thrown. Distinct from an end that simply scores zero because every boule missed.
_Avoid_: Dead end, nullified end

**Session**:
One full playthrough of the game: 3 ends (9 boule throws total), producing a single total score.
_Avoid_: Game, match

**Terrain**:
The bounded rectangular playing surface for an end. A boule that rolls past its edge is out of play and scores zero for that end.

**Scoring Zone**:
One of a set of concentric distance bands around the cochonnet, each worth a fixed number of points. A boule's score for an end is determined by which zone it lands in; all 3 boules per end contribute to that end's total.
_Avoid_: Ring, target zone

**Daily Seed**:
A deterministic value derived from the calendar date, used to generate the sequence of cochonnet positions for that day. Every player who plays on the same date faces the identical sequence, making their session totals directly comparable.
