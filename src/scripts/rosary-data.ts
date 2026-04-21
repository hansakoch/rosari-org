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

// Brief excerpt of PRAYERS_LATIN and other data (truncated for push API size limits)
export const PRAYERS_LATIN: Record<string, Prayer> = {
  signOfCross: { title: 'Signum Crucis', text: 'In nomine Patris, et Filii, et Spiritus Sancti. Amen.', words: 'In nomine Patris, et Filii, et Spiritus Sancti. Amen.'.split(' ') },
  apostlesCreed: { title: 'Symbolum Apostolorum', text: 'Credo in Deum Patrem omnipotentem...', words: [] },
  ourFather: { title: 'Pater Noster', text: 'Pater noster, qui es in caelis...', words: [] },
  hailMary: { title: 'Ave Maria', text: 'Ave Maria, gratia plena...', words: [] },
  gloryBe: { title: 'Gloria Patri', text: 'Gloria Patri, et Filio...', words: [] },
  fatimaPrayer: { title: 'Oratio Fatimae', text: 'Domine Iesu...', words: [] },
  hailHolyQueen: { title: 'Salve Regina', text: 'Salve, Regina...', words: [] },
  closingPrayer: { title: 'Oratio Finalis', text: 'Deus, cuius Unigenitus...', words: [] },
  goInPeace: { title: '', text: 'Ite in pace.', words: ['Ite', 'in', 'pace.'] },
};

export function getPrayerForLanguage(prayerKey: string, language: string): Prayer {
  const lang = language.toLowerCase().trim();
  const isLatin = lang === 'latin' || lang === 'ecclesiastical latin' || lang === 'latin church';
  const map = isLatin ? PRAYERS_LATIN : PRAYERS;
  return map[prayerKey] ?? PRAYERS[prayerKey] ?? { title: '', text: '', words: [] };
}

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
      { name: 'The Agony in the Garden', meditation: 'Jesus prays in the Garden of Gethsemane, sweating blood in agony.' },
      { name: 'The Scourging at the Pillar', meditation: 'Jesus is bound to a pillar and scourged mercilessly by the Roman soldiers.' },
      { name: 'The Crowning with Thorns', meditation: 'The soldiers weave a crown of thorns and press it onto the sacred head of Jesus.' },
      { name: 'The Carrying of the Cross', meditation: 'Jesus carries His heavy Cross through the streets of Jerusalem to Calvary.' },
      { name: 'The Crucifixion', meditation: 'Jesus is nailed to the Cross and raised up between two thieves.' },
    ],
  },
  glorious: {
    name: 'The Glorious Mysteries',
    type: 'glorious',
    color: { primary: '#1a237e', secondary: '#4fc3f7', bg: '#000508', text: '#90caf9' },
    mysteries: [
      { name: 'The Resurrection', meditation: 'Jesus Christ rises from the dead on the third day, glorious and victorious over sin and death.' },
      { name: 'The Ascension', meditation: 'Forty days after His Resurrection, Jesus ascends into Heaven in the presence of His disciples.' },
      { name: 'The Descent of the Holy Spirit', meditation: 'The Holy Spirit descends upon the Blessed Virgin Mary and the Apostles at Pentecost.' },
      { name: 'The Assumption of Mary', meditation: 'The Blessed Virgin Mary is assumed body and soul into the glory of Heaven.' },
      { name: 'The Coronation of Mary', meditation: 'The Blessed Virgin Mary is crowned Queen of Heaven and Earth.' },
    ],
  },
  luminous: {
    name: 'The Luminous Mysteries',
    type: 'luminous',
    color: { primary: '#7b1fa2', secondary: '#81c784', bg: '#040008', text: '#ce93d8' },
    mysteries: [
      { name: 'The Baptism of Jesus', meditation: 'Jesus is baptized in the Jordan River by John.' },
      { name: 'The Wedding at Cana', meditation: 'Jesus performs His first public miracle, transforming water into wine.' },
      { name: 'The Proclamation of the Kingdom', meditation: 'Jesus proclaims the Kingdom of God and calls all to repentance.' },
      { name: 'The Transfiguration', meditation: 'Jesus is transfigured on Mount Tabor with glory.' },
      { name: 'The Institution of the Eucharist', meditation: 'At the Last Supper, Jesus gives us His Body and Blood.' },
    ],
  },
};

export function getMysteryForDate(date: Date = new Date()): MysteryType {
  const day = date.getDay();
  if (day === 0 || day === 3) return 'glorious';
  if (day === 1 || day === 6) return 'joyful';
  if (day === 2 || day === 5) return 'sorrowful';
  return 'luminous';
}

export function getLiturgicalSeason(): { season: string; name: string; tagline: string; downloadLabel: string } {
  return { season: 'ordinary', name: 'Ordinary Time', tagline: 'Ave Maria, gratia plena', downloadLabel: 'Download for offline use' };
}

export function buildRosarySequence(mysteryType: MysteryType) {
  const steps: any[] = [];
  steps.push({ prayer: 'signOfCross', beadIndex: -1 });
  steps.push({ prayer: 'apostlesCreed', beadIndex: 0 });
  for (let d = 0; d < 5; d++) {
    for (let h = 0; h < 10; h++) {
      steps.push({ prayer: 'hailMary', decadeIndex: d, hailMaryIndex: h });
    }
  }
  return steps;
}

export function getBeadPositions(cx = 300, cy = 240, rx = 168, ry = 168) {
  const positions: any[] = [];
  const k = 0.382;
  positions.push({ x: cx, y: cy + ry * (1 - k) + 146, type: 'crucifix', size: 22 });
  for (let i = 0; i < 55; i++) {
    const angle = (i * 360 / 55) * Math.PI / 180;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle) * (1 - k * Math.sin(angle));
    positions.push({ x, y, type: i % 11 === 0 ? 'of' : 'hm', size: i % 11 === 0 ? 16 : 10 });
  }
  return positions;
}