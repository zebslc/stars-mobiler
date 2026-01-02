# The Guts of Mass Drivers

> Mineral packet damage potential, decay rate, speed, distance, and damage formulas.

## Related Sections

- [Planets](../04-gameplay/planets.md)
- [Transport](../04-gameplay/transport.md)

---

## DAMAGE POTENTIAL OF MINERAL PACKETS

### So you always wondered exactly what sort of damage a mineral packet was

capable of doing? Here’s the scoop on mass packets.

Mineral packets can be flung at speeds from Warp 5 to 3 Warp levels above
the driver’s rated speed. Exceeding the rated speed will form unstable packets
that will disintegrate and lose minerals as they travel. Thus, with a top of the
line Warp 13 mass accelerator, you can fling packets at speeds up to Warp
16. Why would you want to fling packets slower than the rated speed? Simple:
the planet you are sending packets to doesn’t have an driver capable of
catching the faster packets and you don’t want to kill off your own colonists.

### If you have the

PACKET DECAY RATE                                                                  Interstellar Traveler
trait, packets flung
Packets thrown over the rated speed of the mass driver decay as follows:           at or below the
driver’s rated speed
+1 Warp 10% / year (turn)                                                      decay at 10% per
+2 Warp 25% / year (turn)                                                      year. Overflung
packets decay as if
+3 Warp 50% / year (turn)
flung at one Warp
There is a minimum decay of 10kT of each mineral in the packet each year.          speed higher.

### Packets decay in both the year they are launched and the year they reach           If you have the

their destination by a prorated amount based on the distance they traveled         Packet Physics trait, that year. The decay rate is not of the original amount in the packet, but the     the decay rate is
half the state stated
current amount.
rate; as is the
minimum decay.

## SPEED AND DISTANCE

### Warp N means that something traveling at that speed will cover N x N light

years per year. Thus, a Warp 16 packet will travel 256 light years each turn!

25-2     TH E G UT S OF S TAR S !

## DAMAGE AND RECOVERY FORMULAS AND CALCULATION

When a packet hits a planet without a mass driver, or with a mass driver rated
beneath the speed of the incoming packet, damage will be done. Damage is
determined by the speed of the packet, not the rating of the driver sending the
packet. For example, if a Warp 5 driver flings a packet at Warp 8 to another
Warp 5 driver, damage will be done to the receiver.

### Speed

spdPacket = Packet Warp ^ 2
spdReceiver = Rcvr Accel ^ 2

### Percent Caught Safely

The percentage of the packet recovered intact.
%CaughtSafely = spdReceiver / spdPacket

### Minerals Recovered

The receiver recovers 1/3 of the portion not caught safely.
(packetkT x %CaughtSafely + packetkT x %remaining x 1/3)

### Raw Damage

dmgRaw = (spdPacket - spdReceiver) x wtPacket / 160

### Raw Damage modified by planetary defenses

dmgRaw2 = dmgRaw x (100% - pctDefCoverage)

### Colonists Killed

The number colonists killed is the larger (maximum) of the following:
dmgRaw2 x Population / 1000
dmgRaw2 x 100

### Planetary Defenses Destroyed
#destroyed = #defenses x dmgRaw2 / 1000
If #destroyed is less than dmgRaw2 / 20, then it is that number.

### Interstellar Traveller Trait Affects Catching Packets

Races with the Interstellar trait are only 1/2 as effective at catching packets. To
calculate the damage taken, divide speed_received by two.

T HE GU TSO F MASS D RI VER S      25-3

### Example

You fling a 1000kT packet at Warp 10 at a planet with a Warp 5 driver, a
population of 250,000 and 50 defenses preventing 60% of incoming damage.
spdPacket = 100
spdReceiver = 25
%CaughtSafely = 25%
minerals recovered = 1000kT x 25% + 1000kT x 75% x 1/3 = 250 + 250 = 500kT
dmgRaw = 75 x 1000 / 160 = 469
dmgRaw2 = 469 x 40% = 188
#colonists killed = Max. of ( 188 x 250,000 / 1000, 188 x 100)
= Max. of ( 47,000, 18800) = 47,000 colonists
#defenses destroyed = 50 * 188 / 1000 = 9 (rounded down)
If, however, the receiving planet had no mass driver or defenses, the damage
is far greater:
minerals recovered = 1000kT x 0% + 1000kT x 100% x 1/3 = only 333kT
dmgRaw = 100 x 1000 / 160 = 625
dmgRaw2 = 625 x 100% = 625
#colonists killed = Max. of (625 x 250,000 / 1000, 625 x 100)
= Max. of (156,250, 62500) = 156,250.
If the packet increased speed up to Warp 13, then:
dmgRaw2 = dmgRaw = 169 x 1000 / 160 = 1056
#colonists killed = Max. of (1056 x 250,000 / 1000, 1056 x 100)               Learn more about
= Max. of ( 264,000, 105600) destroying the colony                           Mass Drivers, p 6-11

25-4    THE GUT SOF S TAR S !

26                  THE GUTS OF MINEFIELDS

