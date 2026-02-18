// ============================================================
// rosary-data.ts — All prayers, mysteries, structure, and locale data
// ============================================================

export type MysteryType = 'joyful' | 'sorrowful' | 'glorious' | 'luminous';
export type LiturgicalSeason = 'advent' | 'christmas' | 'lent' | 'easter' | 'ordinary';

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

// ── English Prayers ─────────────────────────────────────────

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

// ── Latin Prayers ───────────────────────────────────────────
// Traditional ecclesiastical Latin (Tridentine / Novus Ordo Latin)

export const PRAYERS_LATIN: Record<string, Prayer> = {
  signOfCross: {
    title: 'Signum Crucis',
    text: 'In nomine Patris, et Filii, et Spiritus Sancti. Amen.',
    words: 'In nomine Patris, et Filii, et Spiritus Sancti. Amen.'.split(' '),
  },
  apostlesCreed: {
    title: 'Symbolum Apostolorum',
    text: 'Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae, et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus, et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos; sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos. Credo in Spiritum Sanctum, sanctam Ecclesiam catholicam, Sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.',
    words: 'Credo in Deum Patrem omnipotentem, Creatorem caeli et terrae, et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus, et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos; sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos. Credo in Spiritum Sanctum, sanctam Ecclesiam catholicam, Sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.'.split(' '),
  },
  ourFather: {
    title: 'Pater Noster',
    text: 'Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo. Amen.',
    words: 'Pater noster, qui es in caelis, sanctificetur nomen tuum. Adveniat regnum tuum. Fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie, et dimitte nobis debita nostra sicut et nos dimittimus debitoribus nostris. Et ne nos inducas in tentationem, sed libera nos a malo. Amen.'.split(' '),
  },
  hailMary: {
    title: 'Ave Maria',
    text: 'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.',
    words: 'Ave Maria, gratia plena, Dominus tecum. Benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.'.split(' '),
  },
  gloryBe: {
    title: 'Gloria Patri',
    text: 'Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc et semper, et in saecula saeculorum. Amen.',
    words: 'Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc et semper, et in saecula saeculorum. Amen.'.split(' '),
  },
  fatimaPrayer: {
    title: 'Oratio Fatimae',
    text: 'Domine Iesu, dimitte nobis debita nostra, libera nos ab igne inferni, adduc in caelum omnes animas, praesertim illas quae maxime indigent misericordia tua.',
    words: 'Domine Iesu, dimitte nobis debita nostra, libera nos ab igne inferni, adduc in caelum omnes animas, praesertim illas quae maxime indigent misericordia tua.'.split(' '),
  },
  hailHolyQueen: {
    title: 'Salve Regina',
    text: 'Salve, Regina, Mater misericordiae, vita, dulcedo, et spes nostra, salve. Ad te clamamus exsules filii Hevae. Ad te suspiramus gementes et flentes in hac lacrimarum valle. Eia ergo, Advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria! Ora pro nobis, sancta Dei Genitrix, ut digni efficiamur promissionibus Christi.',
    words: 'Salve, Regina, Mater misericordiae, vita, dulcedo, et spes nostra, salve. Ad te clamamus exsules filii Hevae. Ad te suspiramus gementes et flentes in hac lacrimarum valle. Eia ergo, Advocata nostra, illos tuos misericordes oculos ad nos converte. Et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria! Ora pro nobis, sancta Dei Genitrix, ut digni efficiamur promissionibus Christi.'.split(' '),
  },
  closingPrayer: {
    title: 'Oratio Finalis',
    text: 'Deus, cuius Unigenitus per vitam, mortem et resurrectionem suam nobis salutis aeternae praemia comparavit: concede, quaesumus; ut haec mysteria sacratissimo beatae Mariae Virginis Rosario recolentes, et imitemur quod continent, et quod promittunt assequamur. Per Christum Dominum nostrum. Amen.',
    words: 'Deus, cuius Unigenitus per vitam, mortem et resurrectionem suam nobis salutis aeternae praemia comparavit: concede, quaesumus; ut haec mysteria sacratissimo beatae Mariae Virginis Rosario recolentes, et imitemur quod continent, et quod promittunt assequamur. Per Christum Dominum nostrum. Amen.'.split(' '),
  },
  goInPeace: {
    title: '',
    text: 'Ite in pace.',
    words: ['Ite', 'in', 'pace.'],
  },
};

// ── Language-aware prayer lookup ────────────────────────────

export function getPrayerForLanguage(prayerKey: string, language: string): Prayer {
  const lang = language.toLowerCase().trim();
  const isLatin = lang === 'latin' || lang === 'ecclesiastical latin' || lang === 'latin church';
  const map = isLatin ? PRAYERS_LATIN : PRAYERS;
  return map[prayerKey] ?? PRAYERS[prayerKey] ?? { title: '', text: '', words: [] };
}

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

// ── Liturgical Season Calculator ────────────────────────────
// Accurate for Western Roman Rite; never needs manual updating.

function computeEaster(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function computeAdventStart(year: number): Date {
  // 4th Sunday before Christmas (= 3 Sundays before nearest Sunday to Christmas)
  const xmasDay = new Date(Date.UTC(year, 11, 25)).getUTCDay();
  // Days back to reach the Sunday on or before Dec 25
  const toSunday = xmasDay === 0 ? 0 : xmasDay;
  // Advent = 3 weeks (21 days) before that Sunday
  return new Date(Date.UTC(year, 11, 25 - toSunday - 21));
}

function computeEpiphany(year: number): Date {
  // In most dioceses Epiphany is Jan 6; Season of Christmas ends with
  // Baptism of the Lord (Sunday after Epiphany, or Jan 13 at latest)
  const jan6Day = new Date(Date.UTC(year, 0, 6)).getUTCDay();
  const daysToNextSunday = jan6Day === 0 ? 7 : 7 - jan6Day;
  const epiphany = new Date(Date.UTC(year, 0, 6 + daysToNextSunday)); // Sunday after Jan 6
  const baptism = new Date(epiphany);
  baptism.setUTCDate(baptism.getUTCDate() + 7); // Baptism of Lord = Sunday after Epiphany
  return baptism;
}

export interface LiturgicalSeasonInfo {
  season: LiturgicalSeason;
  name: string;
  tagline: string;
  downloadLabel: string; // e.g. "Download for Lent"
}

export function getLiturgicalSeason(date: Date = new Date()): LiturgicalSeasonInfo {
  // Normalise to UTC date-only for comparison
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const year = d.getUTCFullYear();

  const easter      = computeEaster(year);
  const ashWed      = new Date(easter); ashWed.setUTCDate(easter.getUTCDate() - 46);
  const pentecost   = new Date(easter); pentecost.setUTCDate(easter.getUTCDate() + 49);
  const advent      = computeAdventStart(year);
  const prevAdvent  = computeAdventStart(year - 1);
  const baptismEnd  = computeEpiphany(year);        // end of Christmas (current Jan)
  const christmasStart = new Date(Date.UTC(year - 1, 11, 25)); // Dec 25 of prev year

  // Check each season in chronological order
  if (d >= advent) {
    return { season: 'advent', name: 'Advent', tagline: 'Maranatha — Come, Lord Jesus', downloadLabel: 'Download for Advent' };
  }
  // Christmas: Dec 25 → Baptism of the Lord (~Jan 12)
  if ((d >= new Date(Date.UTC(year, 11, 25))) || d <= baptismEnd) {
    return { season: 'christmas', name: 'Christmas', tagline: 'Gloria in Excelsis Deo', downloadLabel: 'Download for Christmas' };
  }
  // Lent: Ash Wednesday → Holy Saturday
  if (d >= ashWed && d < easter) {
    return { season: 'lent', name: 'Lent', tagline: 'Memento homo, quia pulvis es', downloadLabel: 'Download for Lent' };
  }
  // Easter: Easter Sunday → Pentecost
  if (d >= easter && d <= pentecost) {
    return { season: 'easter', name: 'Easter', tagline: 'Alleluia — Christ is risen', downloadLabel: 'Download for Easter' };
  }
  // Everything else: Ordinary Time
  return { season: 'ordinary', name: 'Ordinary Time', tagline: 'Ave Maria, gratia plena', downloadLabel: 'Download for offline use' };
}

// ── Rosary Sequence Builder ─────────────────────────────────

export function buildRosarySequence(mysteryType: MysteryType): RosaryStep[] {
  const steps: RosaryStep[] = [];

  steps.push({ prayer: 'signOfCross', beadIndex: -1 });
  steps.push({ prayer: 'apostlesCreed', beadIndex: 0 });
  steps.push({ prayer: 'ourFather', beadIndex: 1 });
  steps.push({ prayer: 'hailMary', hailMaryIndex: 0, beadIndex: 2 });
  steps.push({ prayer: 'hailMary', hailMaryIndex: 1, beadIndex: 3 });
  steps.push({ prayer: 'hailMary', hailMaryIndex: 2, beadIndex: 4 });
  steps.push({ prayer: 'gloryBe', beadIndex: 5 });

  for (let d = 0; d < 5; d++) {
    steps.push({ prayer: 'mysteryAnnounce', decadeIndex: d, mysteryIndex: d });
    steps.push({ prayer: 'ourFather', decadeIndex: d, beadIndex: 6 + d * 11 });
    for (let h = 0; h < 10; h++) {
      steps.push({ prayer: 'hailMary', decadeIndex: d, hailMaryIndex: h, beadIndex: 7 + d * 11 + h });
    }
    steps.push({ prayer: 'gloryBe', decadeIndex: d, beadIndex: 6 + d * 11 + 10 });
    steps.push({ prayer: 'fatimaPrayer', decadeIndex: d, beadIndex: 6 + d * 11 + 10 });
  }

  steps.push({ prayer: 'hailHolyQueen', beadIndex: -1 });
  steps.push({ prayer: 'closingPrayer', beadIndex: -1 });
  steps.push({ prayer: 'signOfCross', beadIndex: -1 });
  steps.push({ prayer: 'goInPeace', beadIndex: -1 });

  return steps;
}

// ── Bead Layout Data ────────────────────────────────────────

export function getBeadPositions(cx = 230, cy = 200, rx = 158, ry = 158): Array<{x: number; y: number; type: string; size: number}> {
  const positions: Array<{x: number; y: number; type: string; size: number}> = [];

  const tailBottom = cy + ry;
  positions.push({ x: cx, y: tailBottom + 108, type: 'crucifix',  size: 18 }); // 0
  positions.push({ x: cx, y: tailBottom + 76,  type: 'of',        size: 14 }); // 1
  positions.push({ x: cx, y: tailBottom + 53,  type: 'hm',        size: 11 }); // 2
  positions.push({ x: cx, y: tailBottom + 33,  type: 'hm',        size: 11 }); // 3
  positions.push({ x: cx, y: tailBottom + 14,  type: 'hm',        size: 11 }); // 4
  positions.push({ x: cx, y: tailBottom,        type: 'connector', size: 13 }); // 5

  const GAP_DEG = 8;
  const arcTotal = 360 - GAP_DEG;
  const totalLoopBeads = 55;
  const stepDeg = arcTotal / totalLoopBeads;
  const startDeg = 90 + GAP_DEG / 2;
  const decadeStarts = [0, 11, 22, 33, 44];

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
      size: isOf ? 14 : 11,
    });
  }

  return positions;
}
