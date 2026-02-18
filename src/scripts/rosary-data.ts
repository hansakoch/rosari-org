// ============================================================
// rosary-data.ts — All prayers, mysteries, and structure data
// ============================================================

export type MysteryType = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';

export interface Prayer {
  title: string;
  text: string;
  words: string[];
}

export interface Mystery {
  name: string;
  meditation: string;
}

export interface MysterySet {
  name: string;
  type: MysteryType;
  color: { primary: string; secondary: string; bg: string; text: string };
  mysteries: Mystery[];
}

export interface RosaryStep {
  prayer: 'signOfCross' | 'apostlesCreed' | 'ourFather' | 'hailMary' | 'gloryBe' | 'fatimaPrayer' | 'hailHolyQueen' | 'closingPrayer' | 'goInPeace' | 'mysteryAnnounce';
  mysteryIndex?: number;
  hailMaryIndex?: number;
  decadeIndex?: number;
  label?: string;
  beadIndex?: number;
}

// ── Prayers ────────────────────────────────────────────────

export const PRAYERS: Record<string, Prayer> = {
  signOfCross: {
    title: 'Sign of the Cross',
    text: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
    words: ['In','the','name','of','the','Father,','and','of','the','Son,','and','of','the','Holy','Spirit.','Amen.'],
  },
  apostlesCreed: {
    title: "Apostles' Creed",
    text: "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, our Lord; Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into Hell; the third day He arose again from the dead; He ascended into Heaven, sitteth at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the Holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.",
    words: "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, our Lord; Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into Hell; the third day He arose again from the dead; He ascended into Heaven, sitteth at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the Holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.".split(' '),
  },
  ourFather: {
    title: 'Our Father',
    text: 'Our Father, Who art in Heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in Heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.',
    words: 'Our Father, Who art in Heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in Heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.'.split(' '),
  },
  hailMary: {
    title: 'Hail Mary',
    text: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.',
    words: 'Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.'.split(' '),
  },
  gloryBe: {
    title: 'Glory Be',
    text: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.',
    words: 'Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.'.split(' '),
  },
  fatimaPrayer: {
    title: 'Fatima Prayer',
    text: 'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those in most need of Thy mercy.',
    words: 'O my Jesus, forgive us our sins, save us from the fires of hell, lead all souls to Heaven, especially those in most need of Thy mercy.'.split(' '),
  },
  hailHolyQueen: {
    title: 'Hail Holy Queen',
    text: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope! To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious Advocate, thine eyes of mercy toward us; and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ.',
    words: 'Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope! To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious Advocate, thine eyes of mercy toward us; and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ.'.split(' '),
  },
  closingPrayer: {
    title: 'Closing Prayer',
    text: "O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal salvation; grant, we beseech Thee, that while meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise. Through the same Christ our Lord. Amen.",
    words: "O God, whose only begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal salvation; grant, we beseech Thee, that while meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise. Through the same Christ our Lord. Amen.".split(' '),
  },
  goInPeace: {
    title: '',
    text: 'Go in peace.',
    words: ['Go', 'in', 'peace.'],
  },
};

// ── Mysteries ──────────────────────────────────────────────

export const MYSTERY_SETS: Record<MysteryType, MysterySet> = {
  joyful: {
    name: 'The Joyful Mysteries',
    type: 'joyful',
    color: { primary: '#d4af37', secondary: '#fff8dc', bg: '#0a0800', text: '#f5d06e' },
    mysteries: [
      { name: 'The Annunciation', meditation: 'The Angel Gabriel announces to the Blessed Virgin Mary that she is chosen to be the Mother of God.' },
      { name: 'The Visitation', meditation: 'The Blessed Virgin Mary visits her cousin Saint Elizabeth, who is with child — Saint John the Baptist.' },
      { name: 'The Nativity', meditation: 'Jesus Christ, the Son of God, is born in a stable in Bethlehem, laid in a manger.' },
      { name: 'The Presentation', meditation: 'The Blessed Virgin Mary presents the infant Jesus in the Temple, offering two turtle doves.' },
      { name: 'The Finding in the Temple', meditation: 'After three days of searching, Mary and Joseph find the boy Jesus in the Temple, sitting among the teachers.' },
    ],
  },
  sorrowful: {
    name: 'The Sorrowful Mysteries',
    type: 'sorrowful',
    color: { primary: '#8b0000', secondary: '#cc2200', bg: '#080000', text: '#ff6666' },
    mysteries: [
      { name: 'The Agony in the Garden', meditation: 'Jesus prays in the Garden of Gethsemane, sweating blood in agony, asking that this cup pass from Him, yet submitting to the Father\'s will.' },
      { name: 'The Scourging at the Pillar', meditation: 'Jesus is bound to a pillar and scourged mercilessly by the Roman soldiers.' },
      { name: 'The Crowning with Thorns', meditation: 'The soldiers weave a crown of thorns and press it onto the sacred head of Jesus, mocking Him as King.' },
      { name: 'The Carrying of the Cross', meditation: 'Jesus carries His heavy Cross through the streets of Jerusalem to Calvary, falling three times along the way.' },
      { name: 'The Crucifixion', meditation: 'Jesus is nailed to the Cross and raised up between two thieves. He forgives His executioners and gives up His spirit.' },
    ],
  },
  glorious: {
    name: 'The Glorious Mysteries',
    type: 'glorious',
    color: { primary: '#1a237e', secondary: '#4fc3f7', bg: '#000508', text: '#90caf9' },
    mysteries: [
      { name: 'The Resurrection', meditation: 'Jesus Christ rises from the dead on the third day, glorious and victorious over sin and death.' },
      { name: 'The Ascension', meditation: 'Forty days after His Resurrection, Jesus ascends into Heaven in the presence of His disciples.' },
      { name: 'The Descent of the Holy Spirit', meditation: 'The Holy Spirit descends upon the Blessed Virgin Mary and the Apostles in the Upper Room at Pentecost.' },
      { name: 'The Assumption of Mary', meditation: 'At the end of her earthly life, the Blessed Virgin Mary is assumed body and soul into the glory of Heaven.' },
      { name: 'The Coronation of Mary', meditation: 'The Blessed Virgin Mary is crowned Queen of Heaven and Earth, of angels and of men.' },
    ],
  },
  luminous: {
    name: 'The Luminous Mysteries',
    type: 'luminous',
    color: { primary: '#7b1fa2', secondary: '#81c784', bg: '#040008', text: '#ce93d8' },
    mysteries: [
      { name: 'The Baptism of Jesus', meditation: 'Jesus is baptized in the Jordan River by John. The heavens open, the Spirit descends as a dove, and the Father\'s voice proclaims: "This is my beloved Son."' },
      { name: 'The Wedding at Cana', meditation: 'At the intercession of His Mother, Jesus performs His first public miracle, transforming water into wine.' },
      { name: 'The Proclamation of the Kingdom', meditation: 'Jesus proclaims the Kingdom of God, calls all to repentance, and forgives the sins of those who draw near to Him with faith.' },
      { name: 'The Transfiguration', meditation: 'Jesus is transfigured on Mount Tabor. His face shines like the sun and His garments become white as light.' },
      { name: 'The Institution of the Eucharist', meditation: 'At the Last Supper, Jesus takes bread and wine and gives us His Body and Blood — the source and summit of Christian life.' },
    ],
  },
};

// ── Weekday Mystery Calculator ─────────────────────────────

export function getMysteryForDate(date: Date = new Date()): MysteryType {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0 || day === 3) return 'glorious';   // Sun, Wed
  if (day === 1 || day === 6) return 'joyful';      // Mon, Sat
  if (day === 2 || day === 5) return 'sorrowful';   // Tue, Fri
  return 'luminous';                                 // Thu
}

// ── Rosary Sequence Builder ─────────────────────────────────
// Returns the full ordered sequence of steps for a complete rosary

export function buildRosarySequence(mysteryType: MysteryType): RosaryStep[] {
  const steps: RosaryStep[] = [];

  // Intro
  steps.push({ prayer: 'signOfCross', beadIndex: -1 });
  steps.push({ prayer: 'apostlesCreed', beadIndex: 0 });  // Crucifix bead

  // Tail beads
  steps.push({ prayer: 'ourFather', beadIndex: 1 });       // OF on tail
  steps.push({ prayer: 'hailMary', hailMaryIndex: 0, beadIndex: 2 });
  steps.push({ prayer: 'hailMary', hailMaryIndex: 1, beadIndex: 3 });
  steps.push({ prayer: 'hailMary', hailMaryIndex: 2, beadIndex: 4 });
  steps.push({ prayer: 'gloryBe', beadIndex: 5 });         // Connector/Glory Be

  // 5 Decades
  for (let d = 0; d < 5; d++) {
    steps.push({ prayer: 'mysteryAnnounce', decadeIndex: d, mysteryIndex: d });
    steps.push({ prayer: 'ourFather', decadeIndex: d, beadIndex: 6 + d * 11 });
    for (let h = 0; h < 10; h++) {
      steps.push({ prayer: 'hailMary', decadeIndex: d, hailMaryIndex: h, beadIndex: 7 + d * 11 + h });
    }
    steps.push({ prayer: 'gloryBe', decadeIndex: d, beadIndex: 6 + d * 11 + 10 });
    steps.push({ prayer: 'fatimaPrayer', decadeIndex: d, beadIndex: 6 + d * 11 + 10 });
  }

  // Closing
  steps.push({ prayer: 'hailHolyQueen', beadIndex: -1 });
  steps.push({ prayer: 'closingPrayer', beadIndex: -1 });
  steps.push({ prayer: 'signOfCross', beadIndex: -1 });
  steps.push({ prayer: 'goInPeace', beadIndex: -1 });

  return steps;
}

// ── Bead Layout Data ────────────────────────────────────────
// Returns SVG [x, y] positions for 61 rosary positions:
// 0=Crucifix, 1=OF-tail, 2-4=HM-tail, 5=connector, 6-60=loop (5 decades)

export function getBeadPositions(cx = 240, cy = 200, rx = 155, ry = 130): Array<{x: number; y: number; type: string; size: number}> {
  const positions: Array<{x: number; y: number; type: string; size: number}> = [];

  // Tail: crucifix + 5 beads below circle bottom
  const tailBottom = cy + ry;
  positions.push({ x: cx, y: tailBottom + 90, type: 'crucifix', size: 14 }); // 0 - crucifix
  positions.push({ x: cx, y: tailBottom + 62, type: 'of',       size: 11 }); // 1 - OF
  positions.push({ x: cx, y: tailBottom + 44, type: 'hm',       size: 9  }); // 2 - HM
  positions.push({ x: cx, y: tailBottom + 29, type: 'hm',       size: 9  }); // 3 - HM
  positions.push({ x: cx, y: tailBottom + 14, type: 'hm',       size: 9  }); // 4 - HM
  positions.push({ x: cx, y: tailBottom,       type: 'connector',size: 10 }); // 5 - connector

  // Loop: 55 beads around ellipse
  // Start at bottom (angle 90° = bottom) going counterclockwise
  // Bead at idx 0 in loop = just left of connector, going counterclockwise
  // We need: 5 OF beads + 50 HM beads, spread evenly
  // Pattern per decade: OF + 10*HM (11 beads), 5 decades = 55 beads
  // Total arc: 360° - small gap at bottom for tail connection
  // Gap = 10° at bottom, so beads fill 350°

  const GAP_DEG = 8; // degrees gap at bottom for connector
  const arcTotal = 360 - GAP_DEG;
  const totalLoopBeads = 55;
  const stepDeg = arcTotal / totalLoopBeads;
  const startDeg = 90 + GAP_DEG / 2; // start angle: just right of bottom

  // Decade pattern: bead 0 of each decade is OF, 1-10 are HM
  const decadeStarts = [0, 11, 22, 33, 44]; // indices of OF beads in loop

  for (let i = 0; i < totalLoopBeads; i++) {
    const angleDeg = startDeg + i * stepDeg;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = cx + rx * Math.cos(angleRad);
    const y = cy + ry * Math.sin(angleRad);
    const isOf = decadeStarts.includes(i);
    positions.push({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      type: isOf ? 'of' : 'hm',
      size: isOf ? 11 : 9,
    });
  }

  return positions;
}
