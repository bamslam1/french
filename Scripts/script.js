let seconds = 0;

let timerId = setInterval(() => {
  seconds++;
}, 1000);

const msg = document.querySelector(".phrase");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

let serverCalendar = null;
const SERVER_TIME_MAX_AGE_MS = 60 * 60 * 1000;
let serverAnchor = null;

function anchorIsFresh(a) {
  return (performance.now() - a.perfMs) < SERVER_TIME_MAX_AGE_MS;
}

function serverNowMs() {
  return serverAnchor.serverMs + (performance.now() - serverAnchor.perfMs);
}

function updateServerCalendar() {
  const d = new Date(serverNowMs());
  const p = n => String(n).padStart(2, '0');
  serverCalendar = [
    d.getUTCFullYear(),
    p(d.getUTCMonth() + 1),
    p(d.getUTCDate()),
    p(d.getUTCHours()),
    p(d.getUTCMinutes()),
    p(d.getUTCSeconds())
  ];
}

async function getServerTime() {
  if (serverAnchor && anchorIsFresh(serverAnchor)) {
    updateServerCalendar();
    return;
  }

  const l = document.getElementById('error')
  l.hidden = false;
  l.textContent = 'Loading...'
  try {
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/Whitehorse');

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();

    serverAnchor = {
      serverMs: Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds ?? 0),
      perfMs: performance.now()
    };
    updateServerCalendar();
  } catch (err) {
    serverCalendar = null;
    error("Unable to fetch date");
  }
  l.hidden = true;
}

function getServerClock() {
  if (!serverAnchor) return null;
  const d = new Date(serverNowMs());
  const h = d.getUTCHours(), m = d.getUTCMinutes(), sec = d.getUTCSeconds();
  return { total: (h * 3600) + (m * 60) + sec, h, m, s: sec };
}

let prevFrench = null;

let score = { wins: 0, losses: 0, hints: 0 };

let prevMode = null;

let customPhrases = load('customPhrases', []).map(p => ({
  french: p.french,
  answers: Array.isArray(p.answers) ? p.answers : [String(p.answers)],
  hint: p.hint || "Custom user phrase"
}));

const allPhrases = [
  { french: "Bonjour", answers: ["hello", "hi", "good morning", "good day"], hint: "Etymology relates to wishing a good day", definition: "https://google.com/search?q=what+does+Bonjour+mean+in+French" },
  { french: "Merci", answers: ["thank you", "thanks"], hint: "Derived from Latin for reward or grace", definition: "https://google.com/search?q=what+does+Merci+mean+in+French" },
  { french: "Au revoir", answers: ["goodbye", "bye"], hint: "Literally translates to until seeing again", definition: "https://google.com/search?q=what+does+Au+revoir+mean+in+French" },
  { french: "S\'il vous plaît", answers: ["please"], hint: "Literally means if it pleases you", definition: "https://google.com/search?q=what+does+S%27il+vous+pla%C3%AEt+mean+in+French" },
  { french: "Comment ça va?", answers: ["how are you?", "how are you"], hint: "Colloquial query involving how it goes", definition: "https://google.com/search?q=what+does+Comment+%C3%A7a+va%3F+mean+in+French" },
  { french: "Je ne comprends pas", answers: ["i don't understand", "i do not understand"], hint: "Cognate sharing roots with comprehend", definition: "https://google.com/search?q=what+does+Je+ne+comprends+pas+mean+in+French" },
  { french: "Je suis désolé", answers: ["i am sorry", "i'm sorry", "sorry"], hint: "Past participle meaning separated from comfort", definition: "https://google.com/search?q=what+does+Je+suis+d%C3%A9sol%C3%A9+mean+in+French" },
  { french: "Je t'aime", answers: ["i love you"], hint: "Direct object pronoun placement preceding the verb", definition: "https://google.com/search?q=what+does+Je+t%27aime+mean+in+French" },
  { french: "Excusez-moi", answers: ["excuse me"], hint: "Imperative plural or formal apology form", definition: "https://google.com/search?q=what+does+Excusez-moi+mean+in+French" },
  { french: "Je m'appelle Tom", answers: ["my name is tom"], hint: "Reflexive verb literally meaning I call myself", definition: "https://google.com/search?q=what+does+Je+m%27appelle+Tom+mean+in+French" },
  { french: "Salut", answers: ["hi", "hey", "hello"], hint: "Shared linguistic root with the Italian greeting saluto", definition: "https://google.com/search?q=what+does+Salut+mean+in+French" },
  { french: "Bonsoir", answers: ["good evening"], hint: "Compound word blending good and evening", definition: "https://google.com/search?q=what+does+Bonsoir+mean+in+French" },
  { french: "Bonne nuit", answers: ["good night"], hint: "Feminine adjective agreement with night", definition: "https://google.com/search?q=what+does+Bonne+nuit+mean+in+French" },
  { french: "Bonne journée", answers: ["have a good day", "have a nice day", "good day"], hint: "Implies duration across the daylight hours", definition: "https://google.com/search?q=what+does+Bonne+journ%C3%A9e+mean+in+French" },
  { french: "À bientôt", answers: ["see you soon"], hint: "Prepositional phrase using the adverb for shortly", definition: "https://google.com/search?q=what+does+%C3%80+bient%C3%B4t+mean+in+French" },
  { french: "À demain", answers: ["see you tomorrow"], hint: "References the calendar day following today", definition: "https://google.com/search?q=what+does+%C3%80+demain+mean+in+French" },
  { french: "Bienvenue", answers: ["welcome"], hint: "Compound of well and arrived", definition: "https://google.com/search?q=what+does+Bienvenue+mean+in+French" },
  { french: "De rien", answers: ["you're welcome", "you are welcome", "it's nothing", "it is nothing"], hint: "Literal response implying from nothing", definition: "https://google.com/search?q=what+does+De+rien+mean+in+French" },
  { french: "Merci beaucoup", answers: ["thank you very much", "thank you so much", "thanks a lot", "thanks so much"], hint: "Intensified using a word derived from high quantity", definition: "https://google.com/search?q=what+does+Merci+beaucoup+mean+in+French" },
  { french: "Oui", answers: ["yes"], hint: "Derived from Old Frankish affirmative particles", definition: "https://google.com/search?q=what+does+Oui+mean+in+French" },
  { french: "Non", answers: ["no"], hint: "Etymologically linked to Latin non", definition: "https://google.com/search?q=what+does+Non+mean+in+French" },
  { french: "Peut-être", answers: ["maybe", "perhaps"], hint: "Compound verb phrase meaning can be", definition: "https://google.com/search?q=what+does+Peut-%C3%AAtre+mean+in+French" },
  { french: "D'accord", answers: ["okay", "ok", "alright", "all right", "agreed"], hint: "Prepositional idiom meaning of accord", definition: "https://google.com/search?q=what+does+D%27accord+mean+in+French" },
  { french: "Pas de problème", answers: ["no problem", "no worries"], hint: "Uses the noun root derived from ancient Greek for trial or obstacle", definition: "https://google.com/search?q=what+does+Pas+de+probl%C3%A8me+mean+in+French" },
  { french: "Je ne sais pas", answers: ["i don't know", "i do not know"], hint: "Employs the first-person singular of savoir", definition: "https://google.com/search?q=what+does+Je+ne+sais+pas+mean+in+French" },
  { french: "Je comprends", answers: ["i understand"], hint: "Shares a Latin root meaning to seize or hold together", definition: "https://google.com/search?q=what+does+Je+comprends+mean+in+French" },
  { french: "Parlez-vous anglais?", answers: ["do you speak english?", "do you speak english"], hint: "Inversion structure with the -ez formal second-person marker", definition: "https://google.com/search?q=what+does+Parlez-vous+anglais%3F+mean+in+French" },
  { french: "Je ne parle pas français", answers: ["i don't speak french", "i do not speak french"], hint: "Encloses the conjugated verb with standard negative particles", definition: "https://google.com/search?q=what+does+Je+ne+parle+pas+fran%C3%A7ais+mean+in+French" },
  { french: "Où sont les toilettes?", answers: ["where are the toilets?", "where are the toilets", "where are the bathrooms?", "where are the bathrooms", "where is the bathroom?", "where is the bathroom"], hint: "Inverts plural subject and verb following an interrogative adverb", definition: "https://google.com/search?q=what+does+O%C3%B9+sont+les+toilettes%3F+mean+in+French" },
  { french: "Combien ça coûte?", answers: ["how much does it cost?", "how much does it cost", "how much is it?", "how much is it", "how much is that?", "how much is that"], hint: "Interrogative phrase built on the noun for quantity or price", definition: "https://google.com/search?q=what+does+Combien+%C3%A7a+co%C3%BBte%3F+mean+in+French" },
  { french: "Quelle heure est-il?", answers: ["what time is it?", "what time is it"], hint: "Feminine interrogative adjective matching the word for hour", definition: "https://google.com/search?q=what+does+Quelle+heure+est-il%3F+mean+in+French" },
  { french: "Comment tu t'appelles?", answers: ["what's your name?", "what's your name", "what is your name?", "what is your name"], hint: "Informal register using the second-person singular subject pronoun", definition: "https://google.com/search?q=what+does+Comment+tu+t%27appelles%3F+mean+in+French" },
  { french: "Enchanté", answers: ["nice to meet you", "pleased to meet you", "delighted"], hint: "Past participle literally implying placed under a spell or charmed", definition: "https://google.com/search?q=what+does+Enchant%C3%A9+mean+in+French" },
  { french: "Ça va bien", answers: ["i'm doing well", "i am doing well", "i'm fine", "i am fine", "i'm good", "i am good", "it's going well", "it is going well"], hint: "Uses the demonstrative pronoun subject", definition: "https://google.com/search?q=what+does+%C3%87a+va+bien+mean+in+French" },
  { french: "Et vous?", answers: ["and you?", "and you"], hint: "Conjunction paired with the polite subject pronoun", definition: "https://google.com/search?q=what+does+Et+vous%3F+mean+in+French" },
  { french: "Je voudrais un café", answers: ["i would like a coffee", "i'd like a coffee"], hint: "Conditional tense of vouloir expressing polite desire", definition: "https://google.com/search?q=what+does+Je+voudrais+un+caf%C3%A9+mean+in+French" },
  { french: "L'addition, s'il vous plaît", answers: ["the bill, please", "the bill please", "the check, please", "the check please"], hint: "Employs elision on the definite article preceding a mathematical noun root", definition: "https://google.com/search?q=what+does+L%27addition%2C+s%27il+vous+pla%C3%AEt+mean+in+French" },
  { french: "J'ai faim", answers: ["i'm hungry", "i am hungry"], hint: "Idiomatic construction using the verb to have paired with a noun", definition: "https://google.com/search?q=what+does+J%27ai+faim+mean+in+French" },
  { french: "J'ai soif", answers: ["i'm thirsty", "i am thirsty"], hint: "Idiom utilizing the direct object noun for dehydration", definition: "https://google.com/search?q=what+does+J%27ai+soif+mean+in+French" },
  { french: "Je suis fatigué", answers: ["i'm tired", "i am tired"], hint: "Uses the auxiliary verb être with an adjectival participle", definition: "https://google.com/search?q=what+does+Je+suis+fatigu%C3%A9+mean+in+French" },
  { french: "Je suis perdu", answers: ["i'm lost", "i am lost"], hint: "Masculine agreement of the participle meaning strayed", definition: "https://google.com/search?q=what+does+Je+suis+perdu+mean+in+French" },
  { french: "Aidez-moi", answers: ["help me", "help me!"], hint: "Imperative verb form suffixed with a tonic pronoun", definition: "https://google.com/search?q=what+does+Aidez-moi+mean+in+French" },
  { french: "Bon appétit", answers: ["enjoy your meal", "enjoy your food", "enjoy", "have a good meal"], hint: "Compound phrase referencing good appetite", definition: "https://google.com/search?q=what+does+Bon+app%C3%A9tit+mean+in+French" },
  { french: "Félicitations", answers: ["congratulations", "congrats"], hint: "Plural noun derived from Latin roots for happiness", definition: "https://google.com/search?q=what+does+F%C3%A9licitations+mean+in+French" },
  { french: "Bonne chance", answers: ["good luck"], hint: "Feminine noun linked to fate or probability", definition: "https://google.com/search?q=what+does+Bonne+chance+mean+in+French" },
  { french: "Joyeux anniversaire", answers: ["happy birthday"], hint: "Combines an adjective of joy with an annual milestone", definition: "https://google.com/search?q=what+does+Joyeux+anniversaire+mean+in+French" },
  { french: "Bonne année", answers: ["happy new year"], hint: "Refers to the Earth's complete orbital cycle", definition: "https://google.com/search?q=what+does+Bonne+ann%C3%A9e+mean+in+French" },
  { french: "Santé", answers: ["cheers", "to your health"], hint: "Noun sharing its etymology with sanitary", definition: "https://google.com/search?q=what+does+Sant%C3%A9+mean+in+French" },
  { french: "Pardon", answers: ["pardon", "sorry", "excuse me", "pardon me"], hint: "Interjection derived from ecclesiastical forgiveness", definition: "https://google.com/search?q=what+does+Pardon+mean+in+French" },
  { french: "Comment allez-vous?", answers: ["how are you?", "how are you", "how do you do?", "how do you do"], hint: "Formal inversion using the verb to go", definition: "https://google.com/search?q=what+does+Comment+allez-vous%3F+mean+in+French" },
  { french: "Je vais bien", answers: ["i'm well", "i am well", "i'm fine", "i am fine", "i'm good", "i am good", "i'm doing well", "i am doing well"], hint: "First-person present of aller combined with an adverb", definition: "https://google.com/search?q=what+does+Je+vais+bien+mean+in+French" },
  { french: "Très bien", answers: ["very good", "very well", "great"], hint: "Intensifying adverb preceding an adjective of quality", definition: "https://google.com/search?q=what+does+Tr%C3%A8s+bien+mean+in+French" },
  { french: "Pas mal", answers: ["not bad"], hint: "Litotes construction using negation and an adjective", definition: "https://google.com/search?q=what+does+Pas+mal+mean+in+French" },
  { french: "Comme ci, comme ça", answers: ["so-so", "so so", "so, so", "okay", "ok"], hint: "Reduplicative adverbial phrase utilizing demonstratives", definition: "https://google.com/search?q=what+does+Comme+ci%2C+comme+%C3%A7a+mean+in+French" },
  { french: "Quoi de neuf?", answers: ["what's new?", "what's new", "what is new?", "what is new", "what's up?", "what's up"], hint: "Idiomatic query using a partitive construction", definition: "https://google.com/search?q=what+does+Quoi+de+neuf%3F+mean+in+French" },
  { french: "Bien sûr", answers: ["of course", "sure", "certainly"], hint: "Literal meaning involves safety or certainty", definition: "https://google.com/search?q=what+does+Bien+s%C3%BBr+mean+in+French" },
  { french: "Exactement", answers: ["exactly"], hint: "Adverb formed from a Latin root meaning precise", definition: "https://google.com/search?q=what+does+Exactement+mean+in+French" },
  { french: "Pas du tout", answers: ["not at all"], hint: "Negative idiom referencing the whole or totality", definition: "https://google.com/search?q=what+does+Pas+du+tout+mean+in+French" },
  { french: "Tant pis", answers: ["too bad", "oh well", "never mind"], hint: "Idiomatic expression contrasting so much with worse", definition: "https://google.com/search?q=what+does+Tant+pis+mean+in+French" },
  { french: "C'est vrai", answers: ["it's true", "it is true", "that's true", "that is true", "that's right", "that is right"], hint: "Employs a contracted demonstrative subject with an adjective", definition: "https://google.com/search?q=what+does+C%27est+vrai+mean+in+French" },
  { french: "C'est faux", answers: ["it's false", "it is false", "that's false", "that is false", "that's wrong", "that is wrong"], hint: "Adjectival predicate denoting incorrectness", definition: "https://google.com/search?q=what+does+C%27est+faux+mean+in+French" },
  { french: "Je suis d'accord", answers: ["i agree", "i'm in agreement", "i am in agreement"], hint: "Uses a prepositional phrase denoting harmony", definition: "https://google.com/search?q=what+does+Je+suis+d%27accord+mean+in+French" },
  { french: "Je ne suis pas d'accord", answers: ["i disagree", "i don't agree", "i do not agree"], hint: "Inverted polarity of the agreement idiom", definition: "https://google.com/search?q=what+does+Je+ne+suis+pas+d%27accord+mean+in+French" },
  { french: "Je ne suis pas sûr", answers: ["i'm not sure", "i am not sure"], hint: "Adjectival expression indicating lack of certainty", definition: "https://google.com/search?q=what+does+Je+ne+suis+pas+s%C3%BBr+mean+in+French" },
  { french: "Je suis en retard", answers: ["i'm late", "i am late"], hint: "Prepositional phrase using the noun for delay", definition: "https://google.com/search?q=what+does+Je+suis+en+retard+mean+in+French" },
  { french: "Je suis content", answers: ["i'm happy", "i am happy", "i'm glad", "i am glad", "i'm pleased", "i am pleased"], hint: "Adjective denoting satisfaction or contentment", definition: "https://google.com/search?q=what+does+Je+suis+content+mean+in+French" },
  { french: "Je suis malade", answers: ["i'm sick", "i am sick", "i'm ill", "i am ill"], hint: "Adjective sharing roots with malaise", definition: "https://google.com/search?q=what+does+Je+suis+malade+mean+in+French" },
  { french: "J'ai besoin d'aide", answers: ["i need help"], hint: "Utilizes the idiomatic noun phrase for necessity", definition: "https://google.com/search?q=what+does+J%27ai+besoin+d%27aide+mean+in+French" },
  { french: "J'ai besoin d'un médecin", answers: ["i need a doctor"], hint: "References a medical practitioner via noun elision", definition: "https://google.com/search?q=what+does+J%27ai+besoin+d%27un+m%C3%A9decin+mean+in+French" },
  { french: "J'habite à Paris", answers: ["i live in paris"], hint: "Conjugated regular -er verb taking a locative preposition", definition: "https://google.com/search?q=what+does+J%27habite+%C3%A0+Paris+mean+in+French" },
  { french: "Où habitez-vous?", answers: ["where do you live?", "where do you live"], hint: "Formal second-person plural residence query", definition: "https://google.com/search?q=what+does+O%C3%B9+habitez-vous%3F+mean+in+French" },
  { french: "Quel âge as-tu?", answers: ["how old are you?", "how old are you"], hint: "Literal translation involves asking what age you have", definition: "https://google.com/search?q=what+does+Quel+%C3%A2ge+as-tu%3F+mean+in+French" },
  { french: "Qu'est-ce que c'est?", answers: ["what is this?", "what is this", "what is it?", "what is it", "what's this?", "what's this", "what is that?", "what is that", "what's that?", "what's that"], hint: "Complex interrogative cleft sentence structure", definition: "https://google.com/search?q=what+does+Qu%27est-ce+que+c%27est%3F+mean+in+French" },
  { french: "Pourquoi?", answers: ["why", "why?"], hint: "Interrogative adverb literally built from for and what", definition: "https://google.com/search?q=what+does+Pourquoi%3F+mean+in+French" },
  { french: "Quand?", answers: ["when", "when?"], hint: "Temporal interrogative adverb of Latin origin", definition: "https://google.com/search?q=what+does+Quand%3F+mean+in+French" },
  { french: "Où?", answers: ["where", "where?"], hint: "Locative adverb carrying an accent diacritic", definition: "https://google.com/search?q=what+does+O%C3%B9%3F+mean+in+French" },
  { french: "Qui?", answers: ["who", "who?"], hint: "Interrogative pronoun targeting animate subjects", definition: "https://google.com/search?q=what+does+Qui%3F+mean+in+French" },
  { french: "Répétez, s'il vous plaît", answers: ["please repeat", "please repeat that", "repeat, please", "repeat please", "repeat that, please", "repeat that please"], hint: "Imperative verb form paired with a polite clause", definition: "https://google.com/search?q=what+does+R%C3%A9p%C3%A9tez%2C+s%27il+vous+pla%C3%AEt+mean+in+French" },
  { french: "Parlez plus lentement, s'il vous plaît", answers: ["please speak more slowly", "speak more slowly, please", "speak more slowly please", "please speak slower", "speak slower, please", "speak slower please"], hint: "Comparative adverb construction modifying speed", definition: "https://google.com/search?q=what+does+Parlez+plus+lentement%2C+s%27il+vous+pla%C3%AEt+mean+in+French" },
  { french: "Je voudrais de l'eau", answers: ["i would like water", "i'd like water", "i would like some water", "i'd like some water"], hint: "Partitive article elision preceding a vowel", definition: "https://google.com/search?q=what+does+Je+voudrais+de+l%27eau+mean+in+French" },
  { french: "Une table pour deux", answers: ["a table for two"], hint: "Numerical quantifier designating party size", definition: "https://google.com/search?q=what+does+Une+table+pour+deux+mean+in+French" },
  { french: "C'est délicieux", answers: ["it's delicious", "it is delicious", "that's delicious", "that is delicious"], hint: "Gastronomic adjective cognate with English", definition: "https://google.com/search?q=what+does+C%27est+d%C3%A9licieux+mean+in+French" },
  { french: "C'est trop cher", answers: ["too expensive", "it is too expensive", "that's too expensive", "that is too expensive"], hint: "Adverb of excess modifying cost", definition: "https://google.com/search?q=what+does+C%27est+trop+cher+mean+in+French" },
  { french: "Je cherche la gare", answers: ["i'm looking for the train station", "i am looking for the train station", "i'm looking for the station", "i am looking for the station"], hint: "Verb of searching taking a direct object", definition: "https://google.com/search?q=what+does+Je+cherche+la+gare+mean+in+French" },
  { french: "Tournez à gauche", answers: ["turn left"], hint: "Directional instruction referencing the sinister side", definition: "https://google.com/search?q=what+does+Tournez+%C3%A0+gauche+mean+in+French" },
  { french: "Tournez à droite", answers: ["turn right"], hint: "Directional instruction referencing the dexter side", definition: "https://google.com/search?q=what+does+Tournez+%C3%A0+droite+mean+in+French" },
  { french: "Tout droit", answers: ["straight ahead", "straight on", "go straight", "straight"], hint: "Combines the quantifier for all with direct path", definition: "https://google.com/search?q=what+does+Tout+droit+mean+in+French" },
  { french: "C'est loin?", answers: ["is it far?", "is it far", "is that far?", "is that far"], hint: "Interrogative sentence querying spatial distance", definition: "https://google.com/search?q=what+does+C%27est+loin%3F+mean+in+French" },
  { french: "Il fait beau", answers: ["the weather is nice", "the weather is good", "it's nice out", "it is nice out", "it's nice weather", "it is nice weather"], hint: "Impersonal weather idiom using faire", definition: "https://google.com/search?q=what+does+Il+fait+beau+mean+in+French" },
  { french: "Il pleut", answers: ["it's raining", "it is raining"], hint: "Impersonal third-person singular precipitation verb", definition: "https://google.com/search?q=what+does+Il+pleut+mean+in+French" },
  { french: "Il fait froid", answers: ["it's cold", "it is cold"], hint: "Thermal meteorological idiom", definition: "https://google.com/search?q=what+does+Il+fait+froid+mean+in+French" },
  { french: "Il fait chaud", answers: ["it's hot", "it is hot", "it's warm", "it is warm"], hint: "Thermal idiom using the adjective for heat", definition: "https://google.com/search?q=what+does+Il+fait+chaud+mean+in+French" },
  { french: "Quel temps fait-il?", answers: ["what's the weather like?", "what's the weather like", "what is the weather like?", "what is the weather like", "how's the weather?", "how's the weather", "how is the weather?", "how is the weather"], hint: "Interrogative sentence targeting atmospheric conditions", definition: "https://google.com/search?q=what+does+Quel+temps+fait-il%3F+mean+in+French" },
  { french: "À tout à l'heure", answers: ["see you later", "see you in a bit", "see you shortly"], hint: "Idiomatic temporal farewell referencing the hour", definition: "https://google.com/search?q=what+does+%C3%80+tout+%C3%A0+l%27heure+mean+in+French" },
  { french: "À plus tard", answers: ["see you later", "until later"], hint: "Comparative adverb indicating future time", definition: "https://google.com/search?q=what+does+%C3%80+plus+tard+mean+in+French" },
  { french: "Bonne soirée", answers: ["have a good evening", "have a nice evening", "enjoy your evening"], hint: "Feminine noun marking the evening period", definition: "https://google.com/search?q=what+does+Bonne+soir%C3%A9e+mean+in+French" },
  { french: "Bon week-end", answers: ["have a good weekend", "have a nice weekend", "enjoy your weekend"], hint: "Anglicism adopted into standard French usage", definition: "https://google.com/search?q=what+does+Bon+week-end+mean+in+French" },
  { french: "Bon voyage", answers: ["have a good trip", "have a nice trip", "safe travels", "bon voyage"], hint: "Wishes a successful transit or journey", definition: "https://google.com/search?q=what+does+Bon+voyage+mean+in+French" },
  { french: "Je vous en prie", answers: ["you're welcome", "you are welcome", "go ahead", "after you"], hint: "Formal idiom containing a pronominal object particle", definition: "https://google.com/search?q=what+does+Je+vous+en+prie+mean+in+French" },
  { french: "Aujourd'hui", answers: ["today"], hint: "Compound word literally meaning on the day of today", definition: "https://google.com/search?q=what+does+Aujourd%27hui+mean+in+French" },
  { french: "Demain", answers: ["tomorrow"], hint: "Temporal adverb derived from Latin mane for morning", definition: "https://google.com/search?q=what+does+Demain+mean+in+French" },
  { french: "Hier", answers: ["yesterday"], hint: "Temporal adverb for the preceding day", definition: "https://google.com/search?q=what+does+Hier+mean+in+French" },
  { french: "Maintenant", answers: ["now"], hint: "Compound adverb indicating the present moment", definition: "https://google.com/search?q=what+does+Maintenant+mean+in+French" }
];

const easyPhrases = [
  { french: "Bonjour", answers: ["hello", "hi", "good morning", "good day"], hint: "Core daylight greeting", definition: "https://google.com/search?q=what+does+Bonjour+mean+in+French" },
  { french: "Salut", answers: ["hi", "hey", "hello"], hint: "Familiar greeting variant", definition: "https://google.com/search?q=what+does+Salut+mean+in+French" },
  { french: "Bonsoir", answers: ["good evening"], hint: "Evening time greeting", definition: "https://google.com/search?q=what+does+Bonsoir+mean+in+French" },
  { french: "Au revoir", answers: ["goodbye", "bye"], hint: "Standard parting phrase", definition: "https://google.com/search?q=what+does+Au+revoir+mean+in+French" },
  { french: "Merci", answers: ["thank you", "thanks"], hint: "Basic expression of thanks", definition: "https://google.com/search?q=what+does+Merci+mean+in+French" },
  { french: "S\'il vous plaît", answers: ["please"], hint: "Polite conditional formula", definition: "https://google.com/search?q=what+does+S%27il+vous+pla%C3%AEt+mean+in+French" },
  { french: "Oui", answers: ["yes"], hint: "Primary affirmative particle", definition: "https://google.com/search?q=what+does+Oui+mean+in+French" },
  { french: "Non", answers: ["no"], hint: "Primary negative particle", definition: "https://google.com/search?q=what+does+Non+mean+in+French" },
  { french: "Pardon", answers: ["sorry", "pardon", "excuse me"], hint: "Request for pardon", definition: "https://google.com/search?q=what+does+Pardon+mean+in+French" },
  { french: "Un", answers: ["one", "1"], hint: "Indefinite article and lowest cardinal", definition: "https://google.com/search?q=what+does+Un+mean+in+French" },
  { french: "Deux", answers: ["two", "2"], hint: "First even cardinal number", definition: "https://google.com/search?q=what+does+Deux+mean+in+French" },
  { french: "Trois", answers: ["three", "3"], hint: "Cardinal following two", definition: "https://google.com/search?q=what+does+Trois+mean+in+French" },
  { french: "Quatre", answers: ["four", "4"], hint: "Cardinal sharing roots with quad", definition: "https://google.com/search?q=what+does+Quatre+mean+in+French" },
  { french: "Cinq", answers: ["five", "5"], hint: "Cardinal equivalent to a hand's digits", definition: "https://google.com/search?q=what+does+Cinq+mean+in+French" },
  { french: "Six", answers: ["six", "6"], hint: "Cardinal ending with a silent x", definition: "https://google.com/search?q=what+does+Six+mean+in+French" },
  { french: "Sept", answers: ["seven", "7"], hint: "Cardinal with a silent p", definition: "https://google.com/search?q=what+does+Sept+mean+in+French" },
  { french: "Huit", answers: ["eight", "8"], hint: "Cardinal beginning with a silent h", definition: "https://google.com/search?q=what+does+Huit+mean+in+French" },
  { french: "Neuf", answers: ["nine", "9"], hint: "Cardinal homophonous with the word for new", definition: "https://google.com/search?q=what+does+Neuf+mean+in+French" },
  { french: "Dix", answers: ["ten", "10"], hint: "Cardinal ending with a silent x", definition: "https://google.com/search?q=what+does+Dix+mean+in+French" },
  { french: "Rouge", answers: ["red"], hint: "Primary chromatic color", definition: "https://google.com/search?q=what+does+Rouge+mean+in+French" },
  { french: "Bleu", answers: ["blue"], hint: "Chromatic color of the sky", definition: "https://google.com/search?q=what+does+Bleu+mean+in+French" },
  { french: "Vert", answers: ["green"], hint: "Chromatic color of foliage", definition: "https://google.com/search?q=what+does+Vert+mean+in+French" },
  { french: "Jaune", answers: ["yellow"], hint: "Chromatic color of lemons", definition: "https://google.com/search?q=what+does+Jaune+mean+in+French" },
  { french: "Noir", answers: ["black"], hint: "Achromatic color absorbing all light", definition: "https://google.com/search?q=what+does+Noir+mean+in+French" },
  { french: "Blanc", answers: ["white"], hint: "Achromatic color reflecting all light", definition: "https://google.com/search?q=what+does+Blanc+mean+in+French" },
  { french: "L'eau", answers: ["water", "the water"], hint: "Essential chemical compound H2O", definition: "https://google.com/search?q=what+does+L%27eau+mean+in+French" },
  { french: "Le pain", answers: ["bread", "the bread"], hint: "Staple baked carbohydrate", definition: "https://google.com/search?q=what+does+Le+pain+mean+in+French" },
  { french: "Le lait", answers: ["milk", "the milk"], hint: "Secretion from mammary glands", definition: "https://google.com/search?q=what+does+Le+lait+mean+in+French" },
  { french: "Le café", answers: ["coffee", "the coffee"], hint: "Brewed stimulant beverage", definition: "https://google.com/search?q=what+does+Le+caf%C3%A9+mean+in+French" },
  { french: "La pomme", answers: ["apple", "the apple", "an apple"], hint: "Pome fruit associated with gravity", definition: "https://google.com/search?q=what+does+La+pomme+mean+in+French" },
  { french: "Le chat", answers: ["cat", "the cat", "a cat"], hint: "Domesticated feline mammal", definition: "https://google.com/search?q=what+does+Le+chat+mean+in+French" },
  { french: "Le chien", answers: ["dog", "the dog", "a dog"], hint: "Domesticated canine mammal", definition: "https://google.com/search?q=what+does+Le+chien+mean+in+French" },
  { french: "La maison", answers: ["house", "the house", "a house", "home"], hint: "Residential dwelling structure", definition: "https://google.com/search?q=what+does+La+maison+mean+in+French" },
  { french: "L'école", answers: ["school", "the school"], hint: "Educational institution", definition: "https://google.com/search?q=what+does+L%27%C3%A9cole+mean+in+French" },
  { french: "Le livre", answers: ["book", "the book", "a book"], hint: "Bound pages of text", definition: "https://google.com/search?q=what+does+Le+livre+mean+in+French" },
  { french: "L'ami", answers: ["friend", "the friend", "a friend"], hint: "Platonic companion", definition: "https://google.com/search?q=what+does+L%27ami+mean+in+French" },
  { french: "La famille", answers: ["family", "the family"], hint: "Kinship group", definition: "https://google.com/search?q=what+does+La+famille+mean+in+French" }
];

const mediumPhrases = [
  { french: "Je suis étudiant", answers: ["i am a student", "i'm a student"], hint: "Occupational status of learning", definition: "https://google.com/search?q=what+does+Je+suis+%C3%A9tudiant+mean+in+French" },
  { french: "Je suis canadien", answers: ["i am canadian", "i'm canadian"], hint: "National identity associated with the maple leaf", definition: "https://google.com/search?q=what+does+Je+suis+canadien+mean+in+French" },
  { french: "Je viens du Canada", answers: ["i come from canada", "i am from canada", "i'm from canada"], hint: "Uses the verb venir indicating provenance", definition: "https://google.com/search?q=what+does+Je+viens+du+Canada+mean+in+French" },
  { french: "Je parle anglais", answers: ["i speak english"], hint: "Targeting a Germanic language of communication", definition: "https://google.com/search?q=what+does+Je+parle+anglais+mean+in+French" },
  { french: "J'habite ici", answers: ["i live here"], hint: "Combines residence verb with local adverb", definition: "https://google.com/search?q=what+does+J%27habite+ici+mean+in+French" },
  { french: "Je travaille ici", answers: ["i work here"], hint: "Labor action localized by adverb", definition: "https://google.com/search?q=what+does+Je+travaille+ici+mean+in+French" },
  { french: "Je suis en vacances", answers: ["i am on vacation", "i'm on vacation", "i am on holiday", "i'm on holiday"], hint: "Plural noun denoting leisure travel", definition: "https://google.com/search?q=what+does+Je+suis+en+vacances+mean+in+French" },
  { french: "J'aime le chocolat", answers: ["i like chocolate", "i love chocolate"], hint: "Culinary fondness for cacao derivatives", definition: "https://google.com/search?q=what+does+J%27aime+le+chocolat+mean+in+French" },
  { french: "J'aime lire", answers: ["i like to read", "i like reading", "i love to read", "i love reading"], hint: "Literary pastime infinitive", definition: "https://google.com/search?q=what+does+J%27aime+lire+mean+in+French" },
  { french: "Je veux manger", answers: ["i want to eat"], hint: "Modal desire paired with ingestion", definition: "https://google.com/search?q=what+does+Je+veux+manger+mean+in+French" },
  { french: "Je veux dormir", answers: ["i want to sleep"], hint: "Modal desire paired with rest", definition: "https://google.com/search?q=what+does+Je+veux+dormir+mean+in+French" },
  { french: "J'ai un chien", answers: ["i have a dog"], hint: "Possession structure involving a canine", definition: "https://google.com/search?q=what+does+J%27ai+un+chien+mean+in+French" },
  { french: "J'ai deux frères", answers: ["i have two brothers"], hint: "Male sibling quantifier structure", definition: "https://google.com/search?q=what+does+J%27ai+deux+fr%C3%A8res+mean+in+French" },
  { french: "J'ai mal à la tête", answers: ["i have a headache", "my head hurts", "my head aches"], hint: "Idiom expressing cephalic pain", definition: "https://google.com/search?q=what+does+J%27ai+mal+%C3%A0+la+t%C3%AAte+mean+in+French" },
  { french: "Elle est ma sœur", answers: ["she is my sister", "she's my sister"], hint: "Female sibling identification", definition: "https://google.com/search?q=what+does+Elle+est+ma+s%C5%93ur+mean+in+French" },
  { french: "Il est mon ami", answers: ["he is my friend", "he's my friend"], hint: "Male companion identification", definition: "https://google.com/search?q=what+does+Il+est+mon+ami+mean+in+French" },
  { french: "Nous sommes amis", answers: ["we are friends", "we're friends"], hint: "First-person plural associative state", definition: "https://google.com/search?q=what+does+Nous+sommes+amis+mean+in+French" },
  { french: "Ils sont contents", answers: ["they are happy", "they're happy", "they are glad", "they're glad"], hint: "Third-person plural emotional status", definition: "https://google.com/search?q=what+does+Ils+sont+contents+mean+in+French" },
  { french: "C'est ma maison", answers: ["it's my house", "it is my house", "this is my house", "that's my house", "that is my house"], hint: "Demonstrative ownership assertion", definition: "https://google.com/search?q=what+does+C%27est+ma+maison+mean+in+French" },
  { french: "Il est tard", answers: ["it's late", "it is late"], hint: "Temporal evaluation of the hour", definition: "https://google.com/search?q=what+does+Il+est+tard+mean+in+French" },
  { french: "Il est tôt", answers: ["it's early", "it is early"], hint: "Early temporal evaluation", definition: "https://google.com/search?q=what+does+Il+est+t%C3%B4t+mean+in+French" },
  { french: "Il y a un problème", answers: ["there is a problem", "there's a problem"], hint: "Existential locative phrase", definition: "https://google.com/search?q=what+does+Il+y+a+un+probl%C3%A8me+mean+in+French" },
  { french: "Qu'est-ce que tu fais?", answers: ["what are you doing?", "what are you doing"], hint: "Familiar interrogative action query", definition: "https://google.com/search?q=what+does+Qu%27est-ce+que+tu+fais%3F+mean+in+French" },
  { french: "Où est la gare?", answers: ["where is the train station?", "where is the train station", "where's the train station?", "where's the train station", "where is the station?", "where is the station", "where's the station?", "where's the station"], hint: "Locating the railway depot", definition: "https://google.com/search?q=what+does+O%C3%B9+est+la+gare%3F+mean+in+French" },
  { french: "Où est l'hôtel?", answers: ["where is the hotel?", "where is the hotel", "where's the hotel?", "where's the hotel"], hint: "Locating transient accommodation", definition: "https://google.com/search?q=what+does+O%C3%B9+est+l%27h%C3%B4tel%3F+mean+in+French" },
  { french: "Le train part à huit heures", answers: ["the train leaves at eight", "the train leaves at 8", "the train leaves at eight o'clock", "the train leaves at 8 o'clock", "the train departs at eight"], hint: "Scheduled locomotive departure", definition: "https://google.com/search?q=what+does+Le+train+part+%C3%A0+huit+heures+mean+in+French" },
  { french: "Lundi", answers: ["monday"], hint: "First weekday following Sunday", definition: "https://google.com/search?q=what+does+Lundi+mean+in+French" },
  { french: "Mardi", answers: ["tuesday"], hint: "Weekday named after Mars", definition: "https://google.com/search?q=what+does+Mardi+mean+in+French" },
  { french: "Mercredi", answers: ["wednesday"], hint: "Weekday named after Mercury", definition: "https://google.com/search?q=what+does+Mercredi+mean+in+French" },
  { french: "Jeudi", answers: ["thursday"], hint: "Weekday named after Jupiter", definition: "https://google.com/search?q=what+does+Jeudi+mean+in+French" },
  { french: "Vendredi", answers: ["friday"], hint: "Weekday named after Venus", definition: "https://google.com/search?q=what+does+Vendredi+mean+in+French" },
  { french: "Samedi", answers: ["saturday"], hint: "Weekend day derived from Sabbath", definition: "https://google.com/search?q=what+does+Samedi+mean+in+French" },
  { french: "Dimanche", answers: ["sunday"], hint: "Day of the Lord", definition: "https://google.com/search?q=what+does+Dimanche+mean+in+French" },
  { french: "Le petit déjeuner", answers: ["breakfast", "the breakfast"], hint: "Literal translation of little lunch", definition: "https://google.com/search?q=what+does+Le+petit+d%C3%A9jeuner+mean+in+French" },
  { french: "Le déjeuner", answers: ["lunch", "the lunch"], hint: "Midday meal designation", definition: "https://google.com/search?q=what+does+Le+d%C3%A9jeuner+mean+in+French" },
  { french: "Le dîner", answers: ["dinner", "the dinner", "supper"], hint: "Evening meal designation", definition: "https://google.com/search?q=what+does+Le+d%C3%AEner+mean+in+French" },
  { french: "Une bouteille d'eau", answers: ["a bottle of water", "bottle of water"], hint: "Cylindrical liquid vessel", definition: "https://google.com/search?q=what+does+Une+bouteille+d%27eau+mean+in+French" }
];

const hardPhrases = [
  { french: "Je n'en peux plus", answers: ["i can't take it anymore", "i cannot take it anymore", "i can't take any more", "i can't do this anymore"], hint: "Uses the partitive pronoun en with pouvoir", definition: "https://google.com/search?q=what+does+Je+n%27en+peux+plus+mean+in+French" },
  { french: "Il pleut des cordes", answers: ["it's raining cats and dogs", "it is raining cats and dogs", "it's pouring", "it is pouring"], hint: "Zoological and rope-based idiom equivalent", definition: "https://google.com/search?q=what+does+Il+pleut+des+cordes+mean+in+French" },
  { french: "Je n'ai rien à me mettre", answers: ["i have nothing to wear", "i've got nothing to wear", "i have nothing to put on"], hint: "Reflexive verb putting on clothing", definition: "https://google.com/search?q=what+does+Je+n%27ai+rien+%C3%A0+me+mettre+mean+in+French" },
  { french: "Ça ne me dit rien", answers: ["it doesn't ring a bell", "it does not ring a bell", "i don't feel like it", "it doesn't appeal to me"], hint: "Direct object idiom involving speech to me", definition: "https://google.com/search?q=what+does+%C3%87a+ne+me+dit+rien+mean+in+French" },
  { french: "Je me suis trompé de chemin", answers: ["i took the wrong road", "i took the wrong way", "i went the wrong way", "i got the wrong road"], hint: "Reflexive error verb with pathway noun", definition: "https://google.com/search?q=what+does+Je+me+suis+tromp%C3%A9+de+chemin+mean+in+French" },
  { french: "Il faut que je parte avant la fin", answers: ["i have to leave before the end", "i must leave before the end", "i need to leave before the end"], hint: "Subjunctive requirement triggered by falloir", definition: "https://google.com/search?q=what+does+Il+faut+que+je+parte+avant+la+fin+mean+in+French" },
  { french: "Je voudrais que tu viennes avec nous", answers: ["i would like you to come with us", "i'd like you to come with us", "i want you to come with us"], hint: "Subjunctive verb form of venir", definition: "https://google.com/search?q=what+does+Je+voudrais+que+tu+viennes+avec+nous+mean+in+French" },
  { french: "Quoi que tu fasses, je serai là", answers: ["whatever you do, i will be there", "whatever you do, i'll be there", "no matter what you do, i'll be there", "no matter what you do, i will be there"], hint: "Subjunctive concession clause", definition: "https://google.com/search?q=what+does+Quoi+que+tu+fasses%2C+je+serai+l%C3%A0+mean+in+French" },
  { french: "Si j'avais su, je ne serais pas venu", answers: ["if i had known, i would not have come", "if i had known, i wouldn't have come", "if i'd known, i wouldn't have come"], hint: "Past conditional counterfactual structure", definition: "https://google.com/search?q=what+does+Si+j%27avais+su%2C+je+ne+serais+pas+venu+mean+in+French" },
  { french: "Elle a fini par comprendre", answers: ["she ended up understanding", "she finally understood", "she eventually understood", "she ended up understanding it"], hint: "Idiomatic past action utilizing finir par", definition: "https://google.com/search?q=what+does+Elle+a+fini+par+comprendre+mean+in+French" },
  { french: "Je m'en fiche", answers: ["i don't care", "i do not care", "i couldn't care less", "i could not care less"], hint: "Colloquial reflexive dismissive verb", definition: "https://google.com/search?q=what+does+Je+m%27en+fiche+mean+in+French" },
  { french: "C'est à peine croyable", answers: ["it's hardly believable", "it is hardly believable", "it's barely believable", "it is barely believable", "it's hard to believe"], hint: "Adverbial modifier of scarcity with believable", definition: "https://google.com/search?q=what+does+C%27est+%C3%A0+peine+croyable+mean+in+French" },
  { french: "Je n'ai pas du tout envie d'y aller", answers: ["i don't feel like going there at all", "i do not feel like going at all", "i don't want to go at all", "i have no desire to go there at all"], hint: "Locative pronoun y combined with desire", definition: "https://google.com/search?q=what+does+Je+n%27ai+pas+du+tout+envie+d%27y+aller+mean+in+French" },
  { french: "Tu aurais dû me le dire", answers: ["you should have told me", "you should have told me that", "you ought to have told me"], hint: "Double object pronoun order preceding past infinitive", definition: "https://google.com/search?q=what+does+Tu+aurais+d%C3%BB+me+le+dire+mean+in+French" },
  { french: "Il a eu beau essayer, il n'a pas réussi", answers: ["no matter how hard he tried, he did not succeed", "no matter how hard he tried, he didn't succeed", "he tried in vain, he did not succeed", "despite his efforts, he didn't succeed"], hint: "Idiomatic use of avoir beau for futility", definition: "https://google.com/search?q=what+does+Il+a+eu+beau+essayer%2C+il+n%27a+pas+r%C3%A9ussi+mean+in+French" },
  { french: "Je ne sais pas de quoi tu parles", answers: ["i don't know what you're talking about", "i do not know what you are talking about", "i don't know what you are talking about"], hint: "Prepositional relative pronoun construction", definition: "https://google.com/search?q=what+does+Je+ne+sais+pas+de+quoi+tu+parles+mean+in+French" },
  { french: "Ils se sont rendu compte de leur erreur", answers: ["they realized their mistake", "they realised their mistake", "they realized their error", "they realised their error"], hint: "Reflexive causative realization idiom", definition: "https://google.com/search?q=what+does+Ils+se+sont+rendu+compte+de+leur+erreur+mean+in+French" },
  { french: "C'est le moins que je puisse faire", answers: ["it's the least i can do", "it is the least i can do", "that's the least i can do", "that is the least i can do"], hint: "Subjunctive modal verb usage following superlative", definition: "https://google.com/search?q=what+does+C%27est+le+moins+que+je+puisse+faire+mean+in+French" },
  { french: "On ne peut pas tout avoir", answers: ["you can't have everything", "you cannot have everything", "we can't have everything", "one can't have everything"], hint: "Indefinite pronoun subject on", definition: "https://google.com/search?q=what+does+On+ne+peut+pas+tout+avoir+mean+in+French" },
  { french: "Il vaut mieux tard que jamais", answers: ["better late than never", "it is better late than never", "it's better late than never"], hint: "Comparative proverb structure", definition: "https://google.com/search?q=what+does+Il+vaut+mieux+tard+que+jamais+mean+in+French" },
  { french: "Je suis à bout de forces", answers: ["i'm exhausted", "i am exhausted", "i have no strength left", "i'm out of strength", "i am out of strength"], hint: "Idiomatic limit expression using bout", definition: "https://google.com/search?q=what+does+Je+suis+%C3%A0+bout+de+forces+mean+in+French" },
  { french: "Elle fait comme si de rien n'était", answers: ["she acts as if nothing happened", "she's acting as if nothing happened", "she is acting as if nothing happened", "she acts like nothing happened", "she's acting like nothing happened"], hint: "Hypothetical comparison clause using imparfait", definition: "https://google.com/search?q=what+does+Elle+fait+comme+si+de+rien+n%27%C3%A9tait+mean+in+French" },
  { french: "J'ai failli rater mon train", answers: ["i almost missed my train", "i nearly missed my train", "i just about missed my train"], hint: "Auxiliary construction indicating narrow escape", definition: "https://google.com/search?q=what+does+J%27ai+failli+rater+mon+train+mean+in+French" },
  { french: "Je ne m'attendais pas à ça", answers: ["i wasn't expecting that", "i was not expecting that", "i didn't expect that", "i did not expect that", "i wasn't expecting this", "i was not expecting this"], hint: "Reflexive verb taking a prepositional object", definition: "https://google.com/search?q=what+does+Je+ne+m%27attendais+pas+%C3%A0+%C3%A7a+mean+in+French" },
  { french: "Peu importe ce qu'il dit", answers: ["it doesn't matter what he says", "it does not matter what he says", "no matter what he says", "whatever he says"], hint: "Inverted impersonal importance expression", definition: "https://google.com/search?q=what+does+Peu+importe+ce+qu%27il+dit+mean+in+French" },
  { french: "Il s'agit d'une question de temps", answers: ["it's a matter of time", "it is a matter of time", "it's about a question of time", "it is a question of time", "it's a question of time"], hint: "Pronominal impersonal verb s'agir de", definition: "https://google.com/search?q=what+does+Il+s%27agit+d%27une+question+de+temps+mean+in+French" },
  { french: "Je me suis levé du pied gauche", answers: ["i got up on the wrong side of the bed", "i woke up on the wrong side of the bed", "i got out of bed on the wrong side"], hint: "Bodily idiom referencing the left foot", definition: "https://google.com/search?q=what+does+Je+me+suis+lev%C3%A9+du+pied+gauche+mean+in+French" },
  { french: "Il ne manquait plus que ça", answers: ["that's all i needed", "that is all i needed", "that's all we needed", "that was all we needed", "that was all that was missing", "just what i needed"], hint: "Imperfect tense expression of final aggravation", definition: "https://google.com/search?q=what+does+Il+ne+manquait+plus+que+%C3%A7a+mean+in+French" },
  { french: "À quoi bon essayer", answers: ["what's the point of trying", "what is the point of trying", "what's the use of trying", "what is the use of trying", "why bother trying"], hint: "Interrogative phrase questioning purpose", definition: "https://google.com/search?q=what+does+%C3%80+quoi+bon+essayer+mean+in+French" },
  { french: "Je tiens à vous remercier", answers: ["i want to thank you", "i would like to thank you", "i'd like to thank you", "i really want to thank you"], hint: "Idiomatic verb tenir à commitment", definition: "https://google.com/search?q=what+does+Je+tiens+%C3%A0+vous+remercier+mean+in+French" },
  { french: "Il est de plus en plus difficile de trouver du travail", answers: ["it is more and more difficult to find work", "it's more and more difficult to find work", "it is getting harder and harder to find a job", "it's getting harder and harder to find work", "it's harder and harder to find a job"], hint: "Progressive comparative adverbial construction", definition: "https://google.com/search?q=what+does+Il+est+de+plus+en+plus+difficile+de+trouver+du+travail+mean+in+French" },
  { french: "Nous avons dû reporter la réunion", answers: ["we had to postpone the meeting", "we had to put off the meeting", "we had to reschedule the meeting"], hint: "Past necessity modal verb devoir", definition: "https://google.com/search?q=what+does+Nous+avons+d%C3%BB+reporter+la+r%C3%A9union+mean+in+French" },
  { french: "Faute de temps, je n'ai pas pu finir", answers: ["for lack of time, i couldn't finish", "for lack of time, i could not finish", "due to lack of time, i couldn't finish", "for lack of time i couldn't finish", "i couldn't finish for lack of time", "i couldn't finish due to a lack of time"], hint: "Prepositional fault phrase indicating deficiency", definition: "https://google.com/search?q=what+does+Faute+de+temps%2C+je+n%27ai+pas+pu+finir+mean+in+French" },
  { french: "Elle est loin d'être bête", answers: ["she's far from stupid", "she is far from stupid", "she's far from being stupid", "she is far from being stupid", "she is anything but stupid"], hint: "Spatial idiom indicating exact opposite", definition: "https://google.com/search?q=what+does+Elle+est+loin+d%27%C3%AAtre+b%C3%AAte+mean+in+French" },
  { french: "Tant pis pour lui", answers: ["too bad for him", "that's his loss", "that is his loss", "so much the worse for him", "tough luck for him"], hint: "Dismissive phrase mapping consequence to individual", definition: "https://google.com/search?q=what+does+Tant+pis+pour+lui+mean+in+French" },
  { french: "Il a tout fait pour que ça marche", answers: ["he did everything to make it work", "he did everything so that it would work", "he did everything he could to make it work", "he did all he could to make it work"], hint: "Purpose clause subjunctive construction", definition: "https://google.com/search?q=what+does+Il+a+tout+fait+pour+que+%C3%A7a+marche+mean+in+French" },
  { french: "Je n'arrive pas à me décider", answers: ["i can't make up my mind", "i cannot make up my mind", "i can't decide", "i cannot decide", "i'm unable to decide"], hint: "Idiomatic arrival verb indicating failure", definition: "https://google.com/search?q=what+does+Je+n%27arrive+pas+%C3%A0+me+d%C3%A9cider+mean+in+French" },
  { french: "Rien ne sert de courir, il faut partir à point", answers: ["slow and steady wins the race", "there's no use running, you have to leave on time", "there is no point in running, you have to leave in time", "it's no use running, you have to start on time"], hint: "Classic La Fontaine fable quote structure", definition: "https://google.com/search?q=what+does+Rien+ne+sert+de+courir%2C+il+faut+partir+%C3%A0+point+mean+in+French" },
  { french: "Ce n'est pas la peine d'insister", answers: ["there's no point in insisting", "there is no point in insisting", "it's not worth insisting", "it is not worth insisting", "there's no use insisting", "it's no use insisting"], hint: "Uses the noun peine for trouble", definition: "https://google.com/search?q=what+does+Ce+n%27est+pas+la+peine+d%27insister+mean+in+French" },
  { french: "Mieux vaut prévenir que guérir", answers: ["prevention is better than cure", "an ounce of prevention is worth a pound of cure", "it's better to prevent than to cure", "it is better to prevent than to cure", "better safe than sorry"], hint: "Comparative proverb contrasting caution and remedy", definition: "https://google.com/search?q=what+does+Mieux+vaut+pr%C3%A9venir+que+gu%C3%A9rir+mean+in+French" }
];

const seasonalPhrases = [
  { french: "Jour du Souvenir", answers: ["remembrance day", "day of remembrance"], hint: "Commonwealth martial commemoration date", definition: "https://google.com/search?q=what+does+Jour+du+Souvenir+mean+in+French" },
  { french: "N'oublions jamais", answers: ["lest we forget", "we will never forget", "never forget"], hint: "First-person plural negative imperative cohort", definition: "https://google.com/search?q=what+does+N%27oublions+jamais+mean+in+French" },
  { french: "Le coquelicot", answers: ["the poppy", "poppy"], hint: "Papaver rhoeas floral emblem", definition: "https://google.com/search?q=what+does+Le+coquelicot+mean+in+French" },
  { french: "En mémoire de nos héros", answers: ["in memory of our heroes", "to the memory of our heroes"], hint: "Prepositional dedication phrase", definition: "https://google.com/search?q=what+does+En+m%C3%A9moire+de+nos+h%C3%A9ros+mean+in+French" },
  { french: "Leur souvenir demeurera", answers: ["their memory shall endure", "their memory will live on"], hint: "Future tense intransitive verb of persistence", definition: "https://google.com/search?q=what+does+Leur+souvenir+demeurera+mean+in+French" },
  { french: "Paix aux combattants", answers: ["peace to the combatants", "peace to the soldiers"], hint: "Benefactive prepositional dedication", definition: "https://google.com/search?q=what+does+Paix+aux+combattants+mean+in+French" },
  { french: "Aux morts de la guerre", answers: ["to the war dead", "fallen soldiers"], hint: "Plural substantive noun referencing conflict casualties", definition: "https://google.com/search?q=what+does+Aux+morts+de+la+guerre+mean+in+French" },
  { french: "Le sacrifice suprême", answers: ["the ultimate sacrifice", "supreme sacrifice"], hint: "Post-positive adjectival superlative phrase", definition: "https://google.com/search?q=what+does+Le+sacrifice+supr%C3%AAme+mean+in+French" },
  { french: "Honneur aux courageux", answers: ["honour to the brave", "honor to the brave"], hint: "Substantive adjective representing brave class", definition: "https://google.com/search?q=what+does+Honneur+aux+courageux+mean+in+French" },
  { french: "Le soldat inconnu", answers: ["the unknown soldier", "unknown soldier"], hint: "Anonymous military internment subject", definition: "https://google.com/search?q=what+does+Le+soldat+inconnu+mean+in+French" },
  { french: "Le champ de bataille", answers: ["the battlefield", "battlefield"], hint: "Agricultural root word repurposed for combat", definition: "https://google.com/search?q=what+does+Le+champ+de+bataille+mean+in+French" },
  { french: "La tombe du soldat inconnu", answers: ["tomb of the unknown soldier"], hint: "Architectural sepulcher landmark", definition: "https://google.com/search?q=what+does+La+tombe+du+soldat+inconnu+mean+in+French" },
  { french: "Garder le souvenir", answers: ["keep the memory", "keep the memory alive"], hint: "Infinitive preservation idiom", definition: "https://google.com/search?q=what+does+Garder+le+souvenir+mean+in+French" },
  { french: "Le champ d'honneur", answers: ["field of honour", "field of honor"], hint: "Honorific geographic designation", definition: "https://google.com/search?q=what+does+Le+champ+d%27honneur+mean+in+French" },
  { french: "Service commémoratif", answers: ["memorial service"], hint: "Ritual gathering eliding article", definition: "https://google.com/search?q=what+does+Service+comm%C3%A9moratif+mean+in+French" },
  { french: "La minute de silence", answers: ["the minute of silence", "minute of silence"], hint: "Sixty-second temporal quiet duration", definition: "https://google.com/search?q=what+does+La+minute+de+silence+mean+in+French" },
  { french: "Guerres et conflits", answers: ["wars and conflicts"], hint: "Coordinated plural hostile nouns", definition: "https://google.com/search?q=what+does+Guerres+et+conflits+mean+in+French" },
  { french: "S'en souvenir", answers: ["to remember it", "remembering"], hint: "Pronominal verb retaining partitive en", definition: "https://google.com/search?q=what+does+S%27en+souvenir+mean+in+French" },
  { french: "La flamme éternelle", answers: ["the eternal flame", "eternal flame"], hint: "Perpetual combustion monument feature", definition: "https://google.com/search?q=what+does+La+flamme+%C3%A9ternelle+mean+in+French" },
  { french: "Une couronne de coquelicots", answers: ["a wreath of poppies", "poppy wreath"], hint: "Circular floral arrangement", definition: "https://google.com/search?q=what+does+Une+couronne+de+coquelicots+mean+in+French" },
  { french: "Les anciens combattants", answers: ["the veterans", "veterans"], hint: "Substantive plural adjective for aged fighters", definition: "https://google.com/search?q=what+does+Les+anciens+combattants+mean+in+French" },
  { french: "Au champ d'honneur", answers: ["on the field of honour", "on the field of honor"], hint: "Locative prepositional contraction au", definition: "https://google.com/search?q=what+does+Au+champ+d%27honneur+mean+in+French" },
  { french: "Le devoir de mémoire", answers: ["duty of remembrance"], hint: "Ethical obligation compound noun", definition: "https://google.com/search?q=what+does+Le+devoir+de+m%C3%A9moire+mean+in+French" },
  { french: "Le repos éternel", answers: ["eternal rest"], hint: "Euphemism for death post-position", definition: "https://google.com/search?q=what+does+Le+repos+%C3%A9ternel+mean+in+French" },
  { french: "Leur nom vit à jamais", answers: ["their name lives forever", "their name lives on"], hint: "Adverbial phrase meaning for all time", definition: "https://google.com/search?q=what+does+Leur+nom+vit+%C3%A0+jamais+mean+in+French" },
  { french: "Héros de guerre", answers: ["war heroes"], hint: "Compound title lacking article", definition: "https://google.com/search?q=what+does+H%C3%A9ros+de+guerre+mean+in+French" },
  { french: "Paix et liberté", answers: ["peace and freedom"], hint: "Asyndetic pairing of abstract nouns", definition: "https://google.com/search?q=what+does+Paix+et+libert%C3%A9+mean+in+French" },
  { french: "La liberté a un prix", answers: ["freedom has a price"], hint: "Possessive verb valuation assertion", definition: "https://google.com/search?q=what+does+La+libert%C3%A9+a+un+prix+mean+in+French" },
  { french: "Défense de la patrie", answers: ["defence of the homeland", "defense of the homeland"], hint: "Legal prohibition style noun phrase", definition: "https://google.com/search?q=what+does+D%C3%A9fense+de+la+patrie+mean+in+French" },
  { french: "Les forces armées", answers: ["the armed forces", "armed forces"], hint: "Feminine plural military branch noun", definition: "https://google.com/search?q=what+does+Les+forces+arm%C3%A9es+mean+in+French" },
  { french: "Le service militaire", answers: ["military service"], hint: "Conscripted institutional duty", definition: "https://google.com/search?q=what+does+Le+service+militaire+mean+in+French" },
  { french: "Mort pour la patrie", answers: ["died for the country", "died for one's country"], hint: "Past participle citation formula", definition: "https://google.com/search?q=what+does+Mort+pour+la+patrie+mean+in+French" },
  { french: "La bravoure au combat", answers: ["bravery in combat", "combat bravery"], hint: "Abstract noun of valor", definition: "https://google.com/search?q=what+does+La+bravoure+au+combat+mean+in+French" },
  { french: "Un acte de courage", answers: ["an act of courage"], hint: "Singular countable heroic event", definition: "https://google.com/search?q=what+does+Un+acte+de+courage+mean+in+French" },
  { french: "Le sacrifice de soi", answers: ["self-sacrifice"], hint: "Reflexive tonic pronoun suffix structure", definition: "https://google.com/search?q=what+does+Le+sacrifice+de+soi+mean+in+French" },
  { french: "La médaille du courage", answers: ["medal of bravery"], hint: "Phaleristic award noun", definition: "https://google.com/search?q=what+does+La+m%C3%A9daille+du+courage+mean+in+French" },
  { french: "Porter le coquelicot", answers: ["wearing the poppy", "to wear the poppy"], hint: "Remembrance Day tradition", definition: "https://google.com/search?q=what+does+Porter+le+coquelicot+mean+in+French" },
  { french: "Le monument aux morts", answers: ["the war memorial", "war memorial", "cenotaph"], hint: "Architectural public sculpture", definition: "https://google.com/search?q=what+does+Le+monument+aux+morts+mean+in+French" },
  { french: "La fin de la guerre", answers: ["the end of the war"], hint: "Termination point noun phrase", definition: "https://google.com/search?q=what+does+La+fin+de+la+guerre+mean+in+French" },
  { french: "L'armistice de 1918", answers: ["the 1918 armistice", "armistice of 1918"], hint: "Historical numerical year marker", definition: "https://google.com/search?q=what+does+L%27armistice+de+1918+mean+in+French" },
  { french: "Le onzième jour du onzième mois", answers: ["the eleventh day of the eleventh month"], hint: "Ordinal number repetitive sequence", definition: "https://google.com/search?q=what+does+Le+onzi%C3%A8me+jour+du+onzi%C3%A8me+mois+mean+in+French" },
  { french: "Onze heures du matin", answers: ["eleven in the morning", "eleven o'clock in the morning"], hint: "Exact diurnal hour reference", definition: "https://google.com/search?q=what+does+Onze+heures+du+matin+mean+in+French" },
  { french: "Les tombes militaires", answers: ["military graves", "war graves"], hint: "Plural sepulchral noun phrase", definition: "https://google.com/search?q=what+does+Les+tombes+militaires+mean+in+French" },
  { french: "Le cimetière militaire", answers: ["the military cemetery", "military cemetery"], hint: "Hallowed burial ground noun", definition: "https://google.com/search?q=what+does+Le+cimeti%C3%A8re+militaire+mean+in+French" },
  { french: "Garder la foi", answers: ["keep the faith"], hint: "Infinitive maintenance of belief", definition: "https://google.com/search?q=what+does+Garder+la+foi+mean+in+French" },
  { french: "La paix mondiale", answers: ["world peace"], hint: "Global adjectival modifier phrase", definition: "https://google.com/search?q=what+does+La+paix+mondiale+mean+in+French" },
  { french: "Plus jamais ça", answers: ["never again", "no more war"], hint: "Demonstrative adverbial negative cry", definition: "https://google.com/search?q=what+does+Plus+jamais+%C3%A7a+mean+in+French" },
  { french: "Se souvenir des sacrifices", answers: ["remembering the sacrifices", "remembering sacrifices"], hint: "Reflexive infinitive plural objects", definition: "https://google.com/search?q=what+does+Se+souvenir+des+sacrifices+mean+in+French" },
  { french: "La patrie reconnaissante", answers: ["the grateful homeland"], hint: "Feminine post-positive adjectival agreement", definition: "https://google.com/search?q=what+does+La+patrie+reconnaissante+mean+in+French" },
  { french: "Le courage face au danger", answers: ["courage in the face of danger"], hint: "Prepositional idiom of confrontation", definition: "https://google.com/search?q=what+does+Le+courage+face+au+danger+mean+in+French" },
  { french: "Les braves de la nation", answers: ["the nation's braves"], hint: "Genitive national attribution", definition: "https://google.com/search?q=what+does+Les+braves+de+la+nation+mean+in+French" },
  { french: "Le pavillon national", answers: ["the national flag"], hint: "Vexillological noun phrase", definition: "https://google.com/search?q=what+does+Le+pavillon+national+mean+in+French" },
  { french: "Mettre en berne le drapeau", answers: ["to lower the flag to half-mast", "half-mast flag"], hint: "Infinitive protocol verb phrase", definition: "https://google.com/search?q=what+does+Mettre+en+berne+le+drapeau+mean+in+French" },
  { french: "Un hommage solennel", answers: ["a solemn tribute"], hint: "Ceremonial expression of respect", definition: "https://google.com/search?q=what+does+Un+hommage+solennel+mean+in+French" },
  { french: "Rendre hommage", answers: ["to pay tribute", "pay homage", "pay tribute"], hint: "Collocative verb for honoring", definition: "https://google.com/search?q=what+does+Rendre+hommage+mean+in+French" },
  { french: "La douleur des familles", answers: ["the families' grief", "families' sorrow"], hint: "Plural genitive emotional noun", definition: "https://google.com/search?q=what+does+La+douleur+des+familles+mean+in+French" },
  { french: "La cicatrice de la guerre", answers: ["the scar of war"], hint: "Metaphorical somatic noun phrase", definition: "https://google.com/search?q=what+does+La+cicatrice+de+la+guerre+mean+in+French" },
  { french: "Bâtir la paix", answers: ["building peace"], hint: "Architectural metaphor infinitive", definition: "https://google.com/search?q=what+does+B%C3%A2tir+la+paix+mean+in+French" },
  { french: "La réconciliation", answers: ["reconciliation"], hint: "Societal healing noun", definition: "https://google.com/search?q=what+does+La+r%C3%A9conciliation+mean+in+French" },
  { french: "Fraternité entre les peuples", answers: ["brotherhood among peoples"], hint: "Revolutionary triad component eliding article", definition: "https://google.com/search?q=what+does+Fraternit%C3%A9+entre+les+peuples+mean+in+French" },
  { french: "La résilience", answers: ["resilience"], hint: "Psychological hardiness noun", definition: "https://google.com/search?q=what+does+La+r%C3%A9silience+mean+in+French" },
  { french: "Les épreuves de la guerre", answers: ["the hardships of war"], hint: "Trials and tribulations plural", definition: "https://google.com/search?q=what+does+Les+%C3%A9preuves+de+la+guerre+mean+in+French" },
  { french: "La dureté des combats", answers: ["the harshness of combat", "intensity of the fighting"], hint: "Noun of severity and rigor", definition: "https://google.com/search?q=what+does+La+duret%C3%A9+des+combats+mean+in+French" },
  { french: "Le front de l'ouest", answers: ["the western front"], hint: "Geographic military theater", definition: "https://google.com/search?q=what+does+Le+front+de+l%27ouest+mean+in+French" },
  { french: "Les tranchées", answers: ["the trenches", "trenches"], hint: "Geomorphic defensive earthworks", definition: "https://google.com/search?q=what+does+Les+tranch%C3%A9es+mean+in+French" },
  { french: "La boue des tranchées", answers: ["the mud of the trenches"], hint: "Saturated soil genitive phrase", definition: "https://google.com/search?q=what+does+La+boue+des+tranch%C3%A9es+mean+in+French" },
  { french: "Le gaz moutarde", answers: ["mustard gas"], hint: "Chemical vesicant weapon name", definition: "https://google.com/search?q=what+does+Le+gaz+moutarde+mean+in+French" },
  { french: "L'appel du devoir", answers: ["the call of duty"], hint: "Moral summons genitive construct", definition: "https://google.com/search?q=what+does+L%27appel+du+devoir+mean+in+French" },
  { french: "Partir au front", answers: ["going to the front", "leaving for the front"], hint: "Infinitive departure idiom", definition: "https://google.com/search?q=what+does+Partir+au+front+mean+in+French" },
  { french: "Dire adieu", answers: ["saying goodbye"], hint: "Ultimate linguistic parting formula", definition: "https://google.com/search?q=what+does+Dire+adieu+mean+in+French" },
  { french: "La lettre du front", answers: ["the letter from the front"], hint: "Epistolary wartime communication", definition: "https://google.com/search?q=what+does+La+lettre+du+front+mean+in+French" },
  { french: "Le retour des soldats", answers: ["the return of the soldiers"], hint: "Homecoming substantive noun", definition: "https://google.com/search?q=what+does+Le+retour+des+soldats+mean+in+French" },
  { french: "L'attente anxieuse", answers: ["anxious waiting"], hint: "Feminine adjectival noun pairing", definition: "https://google.com/search?q=what+does+L%27attente+anxieuse+mean+in+French" },
  { french: "Le deuil national", answers: ["national mourning"], hint: "State-level grief designation", definition: "https://google.com/search?q=what+does+Le+deuil+national+mean+in+French" },
  { french: "Inscrire dans l'histoire", answers: ["to write in history", "make history"], hint: "Archival engraving metaphor", definition: "https://google.com/search?q=what+does+Inscrire+dans+l%27histoire+mean+in+French" },
  { french: "L'histoire retiendra", answers: ["history will remember"], hint: "Future prophetic verb form", definition: "https://google.com/search?q=what+does+L%27histoire+retiendra+mean+in+French" },
  { french: "Le flambeau de la mémoire", answers: ["the torch of memory"], hint: "Olympic relay metaphor object", definition: "https://google.com/search?q=what+does+Le+flambeau+de+la+m%C3%A9moire+mean+in+French" },
  { french: "Transmettre le flambeau", answers: ["passing the torch"], hint: "Infinitive generational handoff", definition: "https://google.com/search?q=what+does+Transmettre+le+flambeau+mean+in+French" },
  { french: "Les jeunes générations", answers: ["the younger generations", "future generations"], hint: "Comparative plural age demographic", definition: "https://google.com/search?q=what+does+Les+jeunes+g%C3%A9n%C3%A9rations+mean+in+French" },
  { french: "Ne jamais faillir", answers: ["never fail", "never falter"], hint: "Negative adverbial infinitive stance", definition: "https://google.com/search?q=what+does+Ne+jamais+faillir+mean+in+French" },
  { french: "Debout pour la patrie", answers: ["standing for the homeland"], hint: "Postural adverbial stance phrase", definition: "https://google.com/search?q=what+does+Debout+pour+la+patrie+mean+in+French" },
  { french: "La force de l'esprit", answers: ["the strength of the spirit"], hint: "Mental power genitive noun", definition: "https://google.com/search?q=what+does+La+force+de+l%27esprit+mean+in+French" },
  { french: "Le cœur lourd", answers: ["heavy heart"], hint: "Somatic emotional burden phrase", definition: "https://google.com/search?q=what+does+Le+c%C5%93ur+lourd+mean+in+French" },
  { french: "Une larme versée", answers: ["a shed tear", "a tear shed"], hint: "Participial lacrimal noun phrase", definition: "https://google.com/search?q=what+does+Une+larme+vers%C3%A9e+mean+in+French" },
  { french: "Le silence respectueux", answers: ["respectful silence"], hint: "Reverent quietude description", definition: "https://google.com/search?q=what+does+Le+silence+respectueux+mean+in+French" },
  { french: "La dignité dans la mort", answers: ["dignity in death"], hint: "Prepositional terminal state phrase", definition: "https://google.com/search?q=what+does+La+dignit%C3%A9+dans+la+mort+mean+in+French" },
  { french: "La liberté retrouvée", answers: ["freedom regained", "recovered freedom"], hint: "Post-positive recovered status", definition: "https://google.com/search?q=what+does+La+libert%C3%A9+retrouv%C3%A9e+mean+in+French" },
  { french: "Retrouver la liberté", answers: ["to regain freedom"], hint: "Infinitive recovery action", definition: "https://google.com/search?q=what+does+Retrouver+la+libert%C3%A9+mean+in+French" },
  { french: "L'espoir d'un monde meilleur", answers: ["the hope for a better world"], hint: "Comparative utopian noun phrase", definition: "https://google.com/search?q=what+does+L%27espoir+d%27un+monde+meilleur+mean+in+French" },
  { french: "La fin des hostilités", answers: ["the end of hostilities"], hint: "Formal cessation noun phrase", definition: "https://google.com/search?q=what+does+La+fin+des+hostilit%C3%A9s+mean+in+French" },
  { french: "La signature de la paix", answers: ["the signing of the peace"], hint: "Diplomatic ratification act", definition: "https://google.com/search?q=what+does+La+signature+de+la+paix+mean+in+French" },
  { french: "Le traité de paix", answers: ["the peace treaty", "peace treaty"], hint: "Bilateral legal document", definition: "https://google.com/search?q=what+does+Le+trait%C3%A9+de+paix+mean+in+French" },
  { french: "La reconstruction", answers: ["rebuilding", "reconstruction"], hint: "Post-conflict restoration noun", definition: "https://google.com/search?q=what+does+La+reconstruction+mean+in+French" },
  { french: "Regarder vers l'avenir", answers: ["looking toward the future"], hint: "Directional directional infinitive gaze", definition: "https://google.com/search?q=what+does+Regarder+vers+l%27avenir+mean+in+French" },
  { french: "Honorer leur mémoire", answers: ["to honour their memory", "honor their memory"], hint: "Transitive verb of respect", definition: "https://google.com/search?q=what+does+Honorer+leur+m%C3%A9moire+mean+in+French" },
  { french: "Le devoir patriotique", answers: ["patriotic duty"], hint: "Civic obligation modifier", definition: "https://google.com/search?q=what+does+Le+devoir+patriotique+mean+in+French" },
  { french: "L'amour du pays", answers: ["love of the country", "patriotism"], hint: "Affective territorial noun phrase", definition: "https://google.com/search?q=what+does+L%27amour+du+pays+mean+in+French" },
  { french: "La nation unie", answers: ["the united nation", "united nation"], hint: "Feminine collective entity agreement", definition: "https://google.com/search?q=what+does+La+nation+unie+mean+in+French" },
  { french: "Vivre en paix", answers: ["living in peace", "to live in peace"], hint: "Infinitive peaceful state", definition: "https://google.com/search?q=what+does+Vivre+en+paix+mean+in+French" },
  { french: "Le souvenir éternel", answers: ["eternal remembrance", "eternal memory"], hint: "Ageless mental retention phrase", definition: "https://google.com/search?q=what+does+Le+souvenir+%C3%A9ternel+mean+in+French" }
];

const seasonal2Phrases = [
  { french: "Joyeuse Action de grâce", answers: ["happy thanksgiving"], hint: "Canadian-French phrasing of harvest holiday", definition: "https://google.com/search?q=what+does+Joyeuse+Action+de+gr%C3%A2ce+mean+in+French" },
  { french: "La dinde de Thanksgiving", answers: ["thanksgiving turkey", "the thanksgiving turkey"], hint: "Avian main course hybrid loanword", definition: "https://google.com/search?q=what+does+La+dinde+de+Thanksgiving+mean+in+French" },
  { french: "La tarte à la citrouille", answers: ["pumpkin pie", "the pumpkin pie"], hint: "Cucurbit pastry designation", definition: "https://google.com/search?q=what+does+La+tarte+%C3%A0+la+citrouille+mean+in+French" },
  { french: "Exprimons notre gratitude", answers: ["let us express our gratitude", "expressing our gratitude"], hint: "First-person plural imperative subjunctive root", definition: "https://google.com/search?q=what+does+Exprimons+notre+gratitude+mean+in+French" },
  { french: "Le dîner de famille", answers: ["family dinner", "the family dinner"], hint: "Kinship evening meal", definition: "https://google.com/search?q=what+does+Le+d%C3%AEner+de+famille+mean+in+French" },
  { french: "Rendons grâce", answers: ["let us give thanks", "give thanks"], hint: "Shortened liturgical imperative expression", definition: "https://google.com/search?q=what+does+Rendons+gr%C3%A2ce+mean+in+French" },
  { french: "La corne d'abondance", answers: ["the cornucopia", "cornucopia", "horn of plenty"], hint: "Zoological horn metaphor object", definition: "https://google.com/search?q=what+does+La+corne+d%27abondance+mean+in+French" },
  { french: "Le repas de fête", answers: ["the festive meal", "holiday feast", "feast"], hint: "Celebratory nourishment noun", definition: "https://google.com/search?q=what+does+Le+repas+de+f%C3%AAte+mean+in+French" },
  { french: "La farce de la dinde", answers: ["the turkey stuffing", "stuffing", "dressing"], hint: "Cavity-filling culinary mixture", definition: "https://google.com/search?q=what+does+La+farce+de+la+dinde+mean+in+French" },
  { french: "La sauce aux canneberges", answers: ["cranberry sauce", "the cranberry sauce"], hint: "Vaccinium macrocarpon fruit condiment", definition: "https://google.com/search?q=what+does+La+sauce+aux+canneberges+mean+in+French" },
  { french: "La purée de pommes de terre", answers: ["mashed potatoes", "the mashed potatoes"], hint: "Pounded root vegetable preparation", definition: "https://google.com/search?q=what+does+La+pur%C3%A9e+de+pommes+de+terre+mean+in+French" },
  { french: "La gravy", answers: ["the gravy", "gravy"], hint: "Anglicized culinary pan drippings", definition: "https://google.com/search?q=what+does+La+gravy+mean+in+French" },
  { french: "Les patates douces", answers: ["sweet potatoes", "yams"], hint: "Convolvulaceae family root tuber", definition: "https://google.com/search?q=what+does+Les+patates+douces+mean+in+French" },
  { french: "Le pain de maïs", answers: ["cornbread", "corNBRead"], hint: "Zeamays baked flour product", definition: "https://google.com/search?q=what+does+Le+pain+de+ma%C3%AFs+mean+in+French" },
  { french: "Les choux de Bruxelles", answers: ["brussels sprouts"], hint: "Gemmifera cultivar botanical noun", definition: "https://google.com/search?q=what+does+Les+choux+de+Bruxelles+mean+in+French" },
  { french: "La tarte aux pommes", answers: ["apple pie", "the apple pie"], hint: "Pome fruit pastry classic", definition: "https://google.com/search?q=what+does+La+tarte+aux+pommes+mean+in+French" },
  { french: "La tarte aux pacanes", answers: ["pecan pie", "the pecan pie"], hint: "Carya illinoinensis nut pastry", definition: "https://google.com/search?q=what+does+La+tarte+aux+pacanes+mean+in+French" },
  { french: "Le cidre de pomme", answers: ["apple cider", "the apple cider"], hint: "Fermented or fresh pome juice", definition: "https://google.com/search?q=what+does+Le+cidre+de+pomme+mean+in+French" },
  { french: "Le vin chaud", answers: ["mulled wine"], hint: "Thermal fermented grape beverage", definition: "https://google.com/search?q=what+does+Le+vin+chaud+mean+in+French" },
  { french: "L'automne", answers: ["autumn", "fall"], hint: "Equinoctial transition season", definition: "https://google.com/search?q=what+does+L%27automne+mean+in+French" },
  { french: "Les feuilles d'automne", answers: ["autumn leaves", "fall leaves"], hint: "Deciduous foliage shed elements", definition: "https://google.com/search?q=what+does+Les+feuilles+d%27automne+mean+in+French" },
  { french: "La récolte", answers: ["the harvest", "harvest"], hint: "Agrarian gathering action", definition: "https://google.com/search?q=what+does+La+r%C3%A9colte+mean+in+French" },
  { french: "Les fruits de la terre", answers: ["fruits of the earth", "earth's bounty"], hint: "Terrestrial agricultural yield", definition: "https://google.com/search?q=what+does+Les+fruits+de+la+terre+mean+in+French" },
  { french: "L'abondance", answers: ["abundance", "plenty"], hint: "Copiousness abstract noun", definition: "https://google.com/search?q=what+does+L%27abondance+mean+in+French" },
  { french: "Être reconnaissant", answers: ["to be grateful", "being thankful"], hint: "Infinitive state of appreciation", definition: "https://google.com/search?q=what+does+%C3%8Atre+reconnaissant+mean+in+French" },
  { french: "Un sentiment de gratitude", answers: ["a feeling of gratitude"], hint: "Affective psychological response noun", definition: "https://google.com/search?q=what+does+Un+sentiment+de+gratitude+mean+in+French" },
  { french: "Merci pour tout", answers: ["thanks for everything", "thank you for everything"], hint: "Universal gratitude quantifier", definition: "https://google.com/search?q=what+does+Merci+pour+tout+mean+in+French" },
  { french: "La bénédiction de la table", answers: ["blessing of the table", "table blessing", "saying grace"], hint: "Sacred dining consecration", definition: "https://google.com/search?q=what+does+La+b%C3%A9n%C3%A9diction+de+la+table+mean+in+French" },
  { french: "La prière de remerciement", answers: ["thanksgiving prayer", "prayer of thanksgiving"], hint: "Spoken devotional text", definition: "https://google.com/search?q=what+does+La+pri%C3%A8re+de+remerciement+mean+in+French" },
  { french: "Se réunir en famille", answers: ["gathering with family", "family gathering"], hint: "Reflexive assembly infinitive", definition: "https://google.com/search?q=what+does+Se+r%C3%A9unir+en+famille+mean+in+French" },
  { french: "Les proches", answers: ["loved ones", "family and friends"], hint: "Substantive adjective for intimates", definition: "https://google.com/search?q=what+does+Les+proches+mean+in+French" },
  { french: "Les traditions de famille", answers: ["family traditions"], hint: "Transmitted ancestral customs", definition: "https://google.com/search?q=what+does+Les+traditions+de+famille+mean+in+French" },
  { french: "La chaleur du foyer", answers: ["the warmth of the home", "home warmth"], hint: "Hearth thermal metaphor", definition: "https://google.com/search?q=what+does+La+chaleur+du+foyer+mean+in+French" },
  { french: "Partager un repas", answers: ["sharing a meal", "to share a meal"], hint: "Communal ingestion infinitive", definition: "https://google.com/search?q=what+does+Partager+un+repas+mean+in+French" },
  { french: "La table de fête", answers: ["the holiday table", "festive table"], hint: "Prepared dining setup", definition: "https://google.com/search?q=what+does+La+table+de+f%C3%AAte+mean+in+French" },
  { french: "La nappe blanche", answers: ["the white tablecloth", "tablecloth"], hint: "Textile table protection fabric", definition: "https://google.com/search?q=what+does+La+nappe+blanche+mean+in+French" },
  { french: "Les bougies allumées", answers: ["lit candles", "burning candles"], hint: "Wax illumination source", definition: "https://google.com/search?q=what+does+Les+bougies+allum%C3%A9es+mean+in+French" },
  { french: "La décoration automnale", answers: ["autumn decoration", "fall decor"], hint: "Seasonal aesthetic embellishment", definition: "https://google.com/search?q=what+does+La+d%C3%A9coration+automnale+mean+in+French" },
  { french: "Les citrouilles décoratives", answers: ["decorative pumpkins", "pumpkins"], hint: "Ornamental squash specimens", definition: "https://google.com/search?q=what+does+Les+citrouilles+d%C3%A9coratives+mean+in+French" },
  { french: "Le maïs soufflé", answers: ["popcorn"], hint: "Popped endosperm snack", definition: "https://google.com/search?q=what+does+Le+ma%C3%AFs+souffl%C3%A9+mean+in+French" },
  { french: "Les épis de maïs", answers: ["ears of corn", "corn on the cob"], hint: "Cereal inflorescence spike", definition: "https://google.com/search?q=what+does+Les+%C3%A9pis+de+ma%C3%AFs+mean+in+French" },
  { french: "La tourte à la citrouille", answers: ["pumpkin tart", "pumpkin pie"], hint: "Enclosed pastry variant", definition: "https://google.com/search?q=what+does+La+tourte+%C3%A0+la+citrouille+mean+in+French" },
  { french: "Les épices d'automne", answers: ["autumn spices", "fall spices", "pumpkin spice"], hint: "Aromatic flavoring compound mix", definition: "https://google.com/search?q=what+does+Les+%C3%A9pices+d%27automne+mean+in+French" },
  { french: "La cannelle", answers: ["cinnamon"], hint: "Cinnamomum bark powder", definition: "https://google.com/search?q=what+does+La+cannelle+mean+in+French" },
  { french: "La muscade", answers: ["nutmeg"], hint: "Myristica fragrans seed spice", definition: "https://google.com/search?q=what+does+La+muscade+mean+in+French" },
  { french: "Le clou de girofle", answers: ["clove", "cloves"], hint: "Aromatic flower bud spice", definition: "https://google.com/search?q=what+does+Le+clou+de+girofle+mean+in+French" },
  { french: "Le gingembre", answers: ["ginger"], hint: "Rhizome root spice", definition: "https://google.com/search?q=what+does+Le+gingembre+mean+in+French" },
  { french: "Le sucre brun", answers: ["brown sugar"], hint: "Sucrose with molasses content", definition: "https://google.com/search?q=what+does+Le+sucre+brun+mean+in+French" },
  { french: "Le beurre frais", answers: ["fresh butter"], hint: "Emulsified dairy fat solid", definition: "https://google.com/search?q=what+does+Le+beurre+frais+mean+in+French" },
  { french: "Le pain grillé", answers: ["toasted bread", "toast"], hint: "Radiant-heated bread slice", definition: "https://google.com/search?q=what+does+Le+pain+grill%C3%A9+mean+in+French" },
  { french: "La confiture de fruits", answers: ["fruit jam", "jam"], hint: "Pectin-preserved fruit spread", definition: "https://google.com/search?q=what+does+La+confiture+de+fruits+mean+in+French" },
  { french: "Le temps des récoltes", answers: ["harvest time"], hint: "Agrarian temporal window", definition: "https://google.com/search?q=what+does+Le+temps+des+r%C3%A9coltes+mean+in+French" },
  { french: "Le grenier bien rempli", answers: ["the well-stocked granary", "full barn"], hint: "Agricultural storage attic", definition: "https://google.com/search?q=what+does+Le+grenier+bien+rempli+mean+in+French" },
  { french: "La terre nourricière", answers: ["mother earth", "nourishing earth"], hint: "Personified productive soil", definition: "https://google.com/search?q=what+does+La+terre+nourrici%C3%A8re+mean+in+French" },
  { french: "Le travail des champs", answers: ["farm work", "field work"], hint: "Cultivation labor noun", definition: "https://google.com/search?q=what+does+Le+travail+des+champs+mean+in+French" },
  { french: "Le fermier", answers: ["the farmer", "farmer"], hint: "Agrarian land manager", definition: "https://google.com/search?q=what+does+Le+fermier+mean+in+French" },
  { french: "Le panier de fruits", answers: ["fruit basket"], hint: "Woven carrying receptacle", definition: "https://google.com/search?q=what+does+Le+panier+de+fruits+mean+in+French" },
  { french: "Les légumes racines", answers: ["root vegetables"], hint: "Geotropic underground crops", definition: "https://google.com/search?q=what+does+Les+l%C3%A9gumes+racines+mean+in+French" },
  { french: "Les carottes glacées", answers: ["glazed carrots"], hint: "Sugar-coated root vegetable", definition: "https://google.com/search?q=what+does+Les+carottes+glac%C3%A9es+mean+in+French" },
  { french: "Les haricots verts", answers: ["green beans"], hint: "Phaseolus vulgaris pods", definition: "https://google.com/search?q=what+does+Les+haricots+verts+mean+in+French" },
  { french: "La casserole de haricots verts", answers: ["green bean casserole"], hint: "Baked communal side dish", definition: "https://google.com/search?q=what+does+La+casserole+de+haricots+verts+mean+in+French" },
  { french: "La purée de patates douces", answers: ["mashed sweet potatoes", "sweet potato mash"], hint: "Whipped yam preparation", definition: "https://google.com/search?q=what+does+La+pur%C3%A9e+de+patates+douces+mean+in+French" },
  { french: "Les guimauves fondues", answers: ["melted marshmallows"], hint: "Liquefied confectionary sugar foam", definition: "https://google.com/search?q=what+does+Les+guimauves+fondues+mean+in+French" },
  { french: "Le rôti de bœuf", answers: ["roast beef"], hint: "Oven-cooked bovine meat", definition: "https://google.com/search?q=what+does+Le+r%C3%B4ti+de+b%C5%93uf+mean+in+French" },
  { french: "Le jambon glacé", answers: ["glazed ham"], hint: "Cured porcine thigh cut", definition: "https://google.com/search?q=what+does+Le+jambon+glac%C3%A9+mean+in+French" },
  { french: "Le chef cuisinier", answers: ["the chef", "head cook"], hint: "Culinary kitchen director", definition: "https://google.com/search?q=what+does+Le+chef+cuisinier+mean+in+French" },
  { french: "Préparer le festin", answers: ["preparing the feast", "to prepare the feast"], hint: "Infinitive kitchen organization", definition: "https://google.com/search?q=what+does+Pr%C3%A9parer+le+festin+mean+in+French" },
  { french: "L'odeur de la cuisine", answers: ["the smell of cooking", "cooking aroma"], hint: "Olfactory culinary footprint", definition: "https://google.com/search?q=what+does+L%27odeur+de+la+cuisine+mean+in+French" },
  { french: "Le four chaud", answers: ["the hot oven", "hot oven"], hint: "Thermal baking chamber", definition: "https://google.com/search?q=what+does+Le+four+chaud+mean+in+French" },
  { french: "Le tablier de cuisine", answers: ["kitchen apron", "apron"], hint: "Protective clothing garment", definition: "https://google.com/search?q=what+does+Le+tablier+de+cuisine+mean+in+French" },
  { french: "Le plat principal", answers: ["the main course", "main dish"], hint: "Central culinary dish", definition: "https://google.com/search?q=what+does+Le+plat+principal+mean+in+French" },
  { french: "Les hors-d'œuvre", answers: ["appetizers", "starters"], hint: "Literally outside the work", definition: "https://google.com/search?q=what+does+Les+hors-d%27%C5%93uvre+mean+in+French" },
  { french: "Le dessert gourmand", answers: ["the decadent dessert", "delicious dessert"], hint: "Indulgent final course", definition: "https://google.com/search?q=what+does+Le+dessert+gourmand+mean+in+French" },
  { french: "La crème fouettée", answers: ["whipped cream"], hint: "Aerated dairy emulsion", definition: "https://google.com/search?q=what+does+La+cr%C3%A8me+fouett%C3%A9e+mean+in+French" },
  { french: "La glace à la vanille", answers: ["vanilla ice cream"], hint: "Frozen orchid-flavored dairy", definition: "https://google.com/search?q=what+does+La+glace+%C3%A0+la+vanille+mean+in+French" },
  { french: "Le café chaud", answers: ["hot coffee"], hint: "Steaming caffeinated stimulant", definition: "https://google.com/search?q=what+does+Le+caf%C3%A9+chaud+mean+in+French" },
  { french: "Le thé fumant", answers: ["steaming tea"], hint: "Infused camellia sinensis leaf", definition: "https://google.com/search?q=what+does+Le+th%C3%A9+fumant+mean+in+French" },
  { french: "Digestif après le repas", answers: ["after-dinner drink", "digestif"], hint: "Postprandial alcoholic drink", definition: "https://google.com/search?q=what+does+Digestif+apr%C3%A8s+le+repas+mean+in+French" },
  { french: "Le temps de repos", answers: ["resting time", "food coma"], hint: "Post-eating recovery period", definition: "https://google.com/search?q=what+does+Le+temps+de+repos+mean+in+French" },
  { french: "La sieste de l'après-midi", answers: ["afternoon nap"], hint: "Meridional sleep interval", definition: "https://google.com/search?q=what+does+La+sieste+de+l%27apr%C3%A8s-midi+mean+in+French" },
  { french: "Le match de football", answers: ["the football game", "football match"], hint: "Gridiron or association sport", definition: "https://google.com/search?q=what+does+Le+match+de+football+mean+in+French" },
  { french: "Discuter autour de la table", answers: ["chatting around the table", "conversation at the table"], hint: "Circumferential dining dialogue", definition: "https://google.com/search?q=what+does+Discuter+autour+de+la+table+mean+in+French" },
  { french: "Les rires partagés", answers: ["shared laughter"], hint: "Collective vocal amusement", definition: "https://google.com/search?q=what+does+Les+rires+partag%C3%A9s+mean+in+French" },
  { french: "Le bonheur simple", answers: ["simple happiness", "simple joy"], hint: "Uncomplicated emotional state", definition: "https://google.com/search?q=what+does+Le+bonheur+simple+mean+in+French" },
  { french: "Compter ses bénédictions", answers: ["counting one's blessings", "count your blessings"], hint: "Infinitive enumeration exercise", definition: "https://google.com/search?q=what+does+Compter+ses+b%C3%A9n%C3%A9dictions+mean+in+French" },
  { french: "Un cœur reconnaissant", answers: ["a grateful heart"], hint: "Cardiological thankfulness metaphor", definition: "https://google.com/search?q=what+does+Un+c%C5%93ur+reconnaissant+mean+in+French" },
  { french: "La paix dans le foyer", answers: ["peace in the home"], hint: "Domestic tranquility state", definition: "https://google.com/search?q=what+does+La+paix+dans+le+foyer+mean+in+French" },
  { french: "L'harmonie familiale", answers: ["family harmony"], hint: "Kinship accord noun", definition: "https://google.com/search?q=what+does+L%27harmonie+familiale+mean+in+French" },
  { french: "Le pardon et l'amour", answers: ["forgiveness and love"], hint: "Absolution and affection pairing", definition: "https://google.com/search?q=what+does+Le+pardon+et+l%27amour+mean+in+French" },
  { french: "Se dire merci", answers: ["saying thank you to each other", "thanking each other"], hint: "Reciprocal gratitude expression", definition: "https://google.com/search?q=what+does+Se+dire+merci+mean+in+French" },
  { french: "La bouffée d'air frais", answers: ["breath of fresh air"], hint: "Inhalation of outdoor atmosphere", definition: "https://google.com/search?q=what+does+La+bouff%C3%A9e+d%27air+frais+mean+in+French" },
  { french: "La promenade digestive", answers: ["digestive walk", "after-dinner walk"], hint: "Postprandial pedestrian movement", definition: "https://google.com/search?q=what+does+La+promenade+digestive+mean+in+French" },
  { french: "Le ciel gris d'octobre", answers: ["october's gray sky", "gray october sky"], hint: "Tenth month meteorological cloud cover", definition: "https://google.com/search?q=what+does+Le+ciel+gris+d%27octobre+mean+in+French" },
  { french: "Les matins frais", answers: ["crisp mornings", "cool mornings"], hint: "Chilly dawn periods", definition: "https://google.com/search?q=what+does+Les+matins+frais+mean+in+French" },
  { french: "La bise d'automne", answers: ["the autumn breeze", "fall breeze"], hint: "Cold seasonal wind current", definition: "https://google.com/search?q=what+does+La+bise+d%27automne+mean+in+French" },
  { french: "Le solstice d'hiver approche", answers: ["winter solstice is approaching"], hint: "Astronomical turning point verb", definition: "https://google.com/search?q=what+does+Le+solstice+d%27hiver+approche+mean+in+French" },
  { french: "La fin de l'année", answers: ["the end of the year"], hint: "Calendar cycle conclusion", definition: "https://google.com/search?q=what+does+La+fin+de+l%27ann%C3%A9e+mean+in+French" },
  { french: "Se préparer pour l'hiver", answers: ["preparing for winter"], hint: "Reflexive cold-weather staging", definition: "https://google.com/search?q=what+does+Se+pr%C3%A9parer+pour+l%27hiver+mean+in+French" },
  { french: "Garder de bons souvenirs", answers: ["keeping good memories", "making good memories"], hint: "Mental retention preservation", definition: "https://google.com/search?q=what+does+Garder+de+bons+souvenirs+mean+in+French" },
  { french: "Vive l'Action de grâce", answers: ["long live thanksgiving", "hurrah for thanksgiving"], hint: "Exclamatory seasonal greeting", definition: "https://google.com/search?q=what+does+Vive+l%27Action+de+gr%C3%A2ce+mean+in+French" }
];

const seasonal3Phrases = [
  { french: "Le retour de Vice City", answers: ["vice city return", "welcome back to vice city"], hint: "Fictional Florida metropolis comeback", definition: "https://google.com/search?q=what+does+Le+retour+de+Vice+City+mean+in+French" },
  { french: "Jason et Lucia", answers: ["jason and lucia", "the main characters"], hint: "Dual protagonist pairing names", definition: "https://google.com/search?q=what+does+Jason+et+Lucia+mean+in+French" },
  { french: "L'etat de Leonida", answers: ["leonida", "state of leonida"], hint: "Parody state territory designation", definition: "https://google.com/search?q=what+does+L%27etat+de+Leonida+mean+in+French" },
  { french: "Le club de strip-tease de Vice City", answers: ["vice city strip club", "strip club"], hint: "Adult entertainment venue asset", definition: "https://google.com/search?q=what+does+Le+club+de+strip-tease+de+Vice+City+mean+in+French" },
  { french: "La parodie des Florida Keys", answers: ["the keys", "florida keys parody"], hint: "Archipelago satirical map region", definition: "https://google.com/search?q=what+does+La+parodie+des+Florida+Keys+mean+in+French" },
  { french: "Le flux en direct sur les reseaux sociaux", answers: ["live streaming", "social media live stream"], hint: "Virtual broadcast mechanics", definition: "https://google.com/search?q=what+does+Le+flux+en+direct+sur+les+reseaux+sociaux+mean+in+French" },
  { french: "Les rassemblements de la secte de la boue", answers: ["mud cult", "mud pluggers"], hint: "Swamp-dwelling fanatic assembly", definition: "https://google.com/search?q=what+does+Les+rassemblements+de+la+secte+de+la+boue+mean+in+French" },
  { french: "Un alligator dans un magasin d'alimentation", answers: ["alligator in store", "store gator"], hint: "Reptilian convenience store intruder", definition: "https://google.com/search?q=what+does+Un+alligator+dans+un+magasin+d%27alimentation+mean+in+French" },
  { french: "L'entrainement sur la plage de Vice City", answers: ["muscle beach", "vice city workout"], hint: "Coastal physical training zone", definition: "https://google.com/search?q=what+does+L%27entrainement+sur+la+plage+de+Vice+City+mean+in+French" },
  { french: "Le rassemblement de voitures", answers: ["street takeover", "car meet"], hint: "Unauthorized vehicular gathering", definition: "https://google.com/search?q=what+does+Le+rassemblement+de+voitures+mean+in+French" },
  { french: "La fuite apres un braquage de magasin", answers: ["convenience store robbery", "hold up"], hint: "Retail heist evasion phase", definition: "https://google.com/search?q=what+does+La+fuite+apres+un+braquage+de+magasin+mean+in+French" },
  { french: "Une course-poursuite policiere a haute vitesse", answers: ["police pursuit", "cop chase"], hint: "Law enforcement high-velocity pursuit", definition: "https://google.com/search?q=what+does+Une+course-poursuite+policiere+a+haute+vitesse+mean+in+French" },
  { french: "L'horizon de Vice City au cruscule", answers: ["vice city skyline", "sunset view"], hint: "Dusk architectural silhouette", definition: "https://google.com/search?q=what+does+L%27horizon+de+Vice+City+au+cruscule+mean+in+French" },
  { french: "Les lumieres au neon d'Ocean Drive", answers: ["ocean drive neon", "ocean drive"], hint: "Illuminated coastal strip road", definition: "https://google.com/search?q=what+does+Les+lumieres+au+neon+d%27Ocean+Drive+mean+in+French" },
  { french: "Le spectacle d'hydraulique pour lowrider", answers: ["lowrider hop", "hydraulics"], hint: "Modified suspension bounce display", definition: "https://google.com/search?q=what+does+Le+spectacle+d%27hydraulique+pour+lowrider+mean+in+French" },
  { french: "Le scandale du flic corrompu", answers: ["corrupt officer", "dirty cop"], hint: "Law enforcement bribery narrative", definition: "https://google.com/search?q=what+does+Le+scandale+du+flic+corrompu+mean+in+French" },
  { french: "La cachette de drogue du cartel", answers: ["drug stash", "cartel house"], hint: "Narcotics storage safehouse", definition: "https://google.com/search?q=what+does+La+cachette+de+drogue+du+cartel+mean+in+French" },
  { french: "L'operation d'infiltration secrete", answers: ["sting operation", "undercover cop"], hint: "Clandestine police entrapment setup", definition: "https://google.com/search?q=what+does+L%27operation+d%27infiltration+secrete+mean+in+French" },
  { french: "La video virale de farceur en streaming", answers: ["viral prank", "streamer prank"], hint: "Online content creator gag", definition: "https://google.com/search?q=what+does+La+video+virale+de+farceur+en+streaming+mean+in+French" },
  { french: "La fusillade a la station-service", answers: ["gas station fight", "fuel pump explosion"], hint: "Combustible fuel dispenser blast", definition: "https://google.com/search?q=what+does+La+fusillade+a+la+station-service+mean+in+French" },
  { french: "Le conteneur maritime du port de Vice City", answers: ["shipping containers", "port heist"], hint: "Intermodal freight logistics box", definition: "https://google.com/search?q=what+does+Le+conteneur+maritime+du+port+de+Vice+City+mean+in+French" },
  { french: "La fete sur un yacht prive", answers: ["yacht party", "boat celebration"], hint: "Watercraft luxury social gathering", definition: "https://google.com/search?q=what+does+La+fete+sur+un+yacht+prive+mean+in+French" },
  { french: "Le bateau a moteur dans le marais", answers: ["swamp boat chase", "airboat ride"], hint: "Wetland fan-powered watercraft", definition: "https://google.com/search?q=what+does+Le+bateau+a+moteur+dans+le+marais+mean+in+French" },
  { french: "L'equipe de cascadeurs urbains en moto cross", answers: ["bike life", "street stunt crew"], hint: "Off-road motorcycle trick squad", definition: "https://google.com/search?q=what+does+L%27equipe+de+cascadeurs+urbains+en+moto+cross+mean+in+French" },
  { french: "La promenade nocturne sur l'autoroute eclairee au neon", answers: ["night drive", "highway neon"], hint: "Darkness multi-lane illumination transit", definition: "https://google.com/search?q=what+does+La+promenade+nocturne+sur+l%27autoroute+eclairee+au+neon+mean+in+French" },
  { french: "Le bureau de cautionnement", answers: ["bail bonds", "bounty hunting"], hint: "Pre-trial release financial office", definition: "https://google.com/search?q=what+does+Le+bureau+de+cautionnement+mean+in+French" },
  { french: "La negotiation au preteur sur gages", answers: ["pawn shop", "sell stolen goods"], hint: "Collateral loan establishment", definition: "https://google.com/search?q=what+does+La+negotiation+au+preteur+sur+gages+mean+in+French" },
  { french: "L'atelier de peinture automobile personnalisee", answers: ["custom spray shop", "ls customs style"], hint: "Vehicular aesthetic modification garage", definition: "https://google.com/search?q=what+does+L%27atelier+de+peinture+automobile+personnalisee+mean+in+French" },
  { french: "L'atelier clandestin de voitures volees", answers: ["chop shop", "stripping cars"], hint: "Illegal vehicle dismantling facility", definition: "https://google.com/search?q=what+does+L%27atelier+clandestin+de+voitures+volees+mean+in+French" },
  { french: "La ligne de depart d'une course de rue de minuit", answers: ["street race", "drag race start"], hint: "Nocturnal asphalt racing grid", definition: "https://google.com/search?q=what+does+La+ligne+de+depart+d%27une+course+de+rue+de+minuit+mean+in+French" },
  { french: "L'helicoptere de la police de Vice City", answers: ["noose helicopter", "police chopper"], hint: "Law enforcement aerial rotorcraft", definition: "https://google.com/search?q=what+does+L%27helicoptere+de+la+police+de+Vice+City+mean+in+French" },
  { french: "L'assaut tactique de l'equipe SWAT", answers: ["swat raid", "tactical entry"], hint: "Specialized tactical unit breach", definition: "https://google.com/search?q=what+does+L%27assaut+tactique+de+l%27equipe+SWAT+mean+in+French" },
  { french: "La tentative d'evasion de prison", answers: ["prison break", "penitentiary escape"], hint: "Correctional facility breakout plot", definition: "https://google.com/search?q=what+does+La+tentative+d%27evasion+de+prison+mean+in+French" },
  { french: "Le tableau blanc de planification de braquage", answers: ["heist board", "planning the score"], hint: "Dry-erase tactical crime chart", definition: "https://google.com/search?q=what+does+Le+tableau+blanc+de+planification+de+braquage+mean+in+French" },
  { french: "Le percage de coffre-fort dans la planque", answers: ["crack the safe", "stealing cash"], hint: "High-security container breach", definition: "https://google.com/search?q=what+does+Le+percage+de+coffre-fort+dans+la+planque+mean+in+French" },
  { french: "Le marchand d'armes du marche noir", answers: ["gun runner", "illegal weapons"], hint: "Clandestine firearm vendor", definition: "https://google.com/search?q=what+does+Le+marchand+d%27armes+du+marche+noir+mean+in+French" },
  { french: "Le reseau de faux papiers d'identite", answers: ["fake id", "counterfeit operation"], hint: "Fraudulent credential ring", definition: "https://google.com/search?q=what+does+Le+reseau+de+faux+papiers+d%27identite+mean+in+French" },
  { french: "La presse a imprimer de la fausse monnaie", answers: ["money printer", "counterfeit cash"], hint: "Illicit currency manufacturing press", definition: "https://google.com/search?q=what+does+La+presse+a+imprimer+de+la+fausse+monnaie+mean+in+French" },
  { french: "L'intersection de la guerre des gangs", answers: ["turf war", "gang territory"], hint: "Territorial faction conflict node", definition: "https://google.com/search?q=what+does+L%27intersection+de+la+guerre+des+gangs+mean+in+French" },
  { french: "L'embuscade d'un cartel rival", answers: ["cartel ambush", "drive by attack"], hint: "Syndicate surprise assault", definition: "https://google.com/search?q=what+does+L%27embuscade+d%27un+cartel+rival+mean+in+French" },
  { french: "L'installation de la planque du piratage", answers: ["hacker den", "surveillance screens"], hint: "Digital intrusion monitoring base", definition: "https://google.com/search?q=what+does+L%27installation+de+la+planque+du+piratage+mean+in+French" },
  { french: "Le siege social d'une arnaque aux cryptomonnaies", answers: ["crypto scam", "rug pull operation"], hint: "Digital asset fraud headquarters", definition: "https://google.com/search?q=what+does+Le+siege+social+d%27une+arnaque+aux+cryptomonnaies+mean+in+French" },
  { french: "Le penthouse de luxe surplombant la plage", answers: ["luxury penthouse", "ocean view condo"], hint: "Top-floor coastal real estate", definition: "https://google.com/search?q=what+does+Le+penthouse+de+luxe+surplombant+la+plage+mean+in+French" },
  { french: "La planque dans un motel деlabre", answers: ["motel hideout", "cheap motel room"], hint: "Dilapidated temporary lodging shelter", definition: "https://google.com/search?q=what+does+La+planque+dans+un+motel+%D0%B4%D0%B5labre+mean+in+French" },
  { french: "L'evasion dans une voiture de patrouille volee", answers: ["stolen cop car", "undercover cruiser"], hint: "Commandeered law enforcement vehicle", definition: "https://google.com/search?q=what+does+L%27evasion+dans+une+voiture+de+patrouille+volee+mean+in+French" },
  { french: "Le braquage d'un poste de peage sur l'autoroute", answers: ["toll booth heist", "highway robbery"], hint: "Roadway fee station robbery", definition: "https://google.com/search?q=what+does+Le+braquage+d%27un+poste+de+peage+sur+l%27autoroute+mean+in+French" },
  { french: "La fusillade a l'interieur du mega centre commercial", answers: ["mall shootout", "shopping center chaos"], hint: "Multi-store retail gunfire exchange", definition: "https://google.com/search?q=what+does+La+fusillade+a+l%27interieur+du+mega+centre+commercial+mean+in+French" },
  { french: "Le point de vue du tireur d'elite sur le toit", answers: ["rooftop sniper", "overwatch position"], hint: "Elevated long-range vantage perch", definition: "https://google.com/search?q=what+does+Le+point+de+vue+du+tireur+d%27elite+sur+le+toit+mean+in+French" },
  { french: "La transaction de drogue qui tourne mal dans une allee", answers: ["bad drug deal", "alley ambush"], hint: "Compromised backstreet narcotics exchange", definition: "https://google.com/search?q=what+does+La+transaction+de+drogue+qui+tourne+mal+dans+une+allee+mean+in+French" },
  { french: "La course-poursuite en bateau rapide", answers: ["boat escape", "water pursuit"], hint: "High-speed aquatic vessel chase", definition: "https://google.com/search?q=what+does+La+course-poursuite+en+bateau+rapide+mean+in+French" },
  { french: "Le saut en parachute sur un camion en mouvement", answers: ["truck parachute", "air drop"], hint: "Aerial descent onto flatbed", definition: "https://google.com/search?q=what+does+Le+saut+en+parachute+sur+un+camion+en+mouvement+mean+in+French" },
  { french: "Le saut cascade par-dessus un viaduc d'autoroute", answers: ["stunt jump", "epic jump"], hint: "Elevated highway gap leap", definition: "https://google.com/search?q=what+does+Le+saut+cascade+par-dessus+un+viaduc+d%27autoroute+mean+in+French" },
  { french: "Le raid sur une partie de poker clandestine", answers: ["illegal poker game", "high stakes poker"], hint: "Unlicensed card game bust", definition: "https://google.com/search?q=what+does+Le+raid+sur+une+partie+de+poker+clandestine+mean+in+French" },
  { french: "La bagarre avec les bons du salon VIP", answers: ["club bouncer fight", "vip brawl"], hint: "Exclusive lounge security altercation", definition: "https://google.com/search?q=what+does+La+bagarre+avec+les+bons+du+salon+VIP+mean+in+French" },
  { french: "Le chaos d'une fete au bord de la piscine sur le toit", answers: ["pool party", "rooftop chaos"], hint: "Elevated water basin celebration", definition: "https://google.com/search?q=what+does+Le+chaos+d%27une+fete+au+bord+de+la+piscine+sur+le+toit+mean+in+French" },
  { french: "Le tag de graffiti d'un gang rival", answers: ["gang tag", "territory marking"], hint: "Spray-painted faction signature", definition: "https://google.com/search?q=what+does+Le+tag+de+graffiti+d%27un+gang+rival+mean+in+French" },
  { french: "Le detournement d'un semi-remorque vole", answers: ["semi truck hijack", "rig robbery"], hint: "Large commercial transport seizure", definition: "https://google.com/search?q=what+does+Le+detournement+d%27un+semi-remorque+vole+mean+in+French" },
  { french: "Le braquage d'un transport de fonds blind", answers: ["armored truck robbery", "securicor heist"], hint: "Security vehicle cash heist", definition: "https://google.com/search?q=what+does+Le+braquage+d%27un+transport+de+fonds+blind+mean+in+French" },
  { french: "L'intrusion sur la piste de l'aeroport international", answers: ["airport breach", "runway chase"], hint: "Aviation tarmac security breach", definition: "https://google.com/search?q=what+does+L%27intrusion+sur+la+piste+de+l%27aeroport+international+mean+in+French" },
  { french: "Le detournement d'un avion cargo en plein vol", answers: ["cargo plane heist", "mid air boarding"], hint: "In-flight freight aircraft takeover", definition: "https://google.com/search?q=what+does+Le+detournement+d%27un+avion+cargo+en+plein+vol+mean+in+French" },
  { french: "L'infiltration de la base militaire", answers: ["fort zancudo style base", "military break in"], hint: "Restricted defense installation breach", definition: "https://google.com/search?q=what+does+L%27infiltration+de+la+base+militaire+mean+in+French" },
  { french: "Le vol d'un helicoptere d'attaque", answers: ["military helicopter theft", "stealing a chopper"], hint: "Armed military rotorcraft theft", definition: "https://google.com/search?q=what+does+Le+vol+d%27un+helicoptere+d%27attaque+mean+in+French" },
  { french: "Le grabuge d'un char d'assaut sur Ocean Drive", answers: ["tank rampage", "military tank chaos"], hint: "Armored tracked vehicle destruction", definition: "https://google.com/search?q=what+does+Le+grabuge+d%27un+char+d%27assaut+sur+Ocean+Drive+mean+in+French" },
  { french: "La course de jet-ski a travers les Keys", answers: ["jet ski race", "watercraft sprint"], hint: "Archipelago personal watercraft dash", definition: "https://google.com/search?q=what+does+La+course+de+jet-ski+a+travers+les+Keys+mean+in+French" },
  { french: "La plongee sous-marine a la recherche de tresor englouti", answers: ["sunken treasure", "deep sea diving"], hint: "Submersible loot recovery dive", definition: "https://google.com/search?q=what+does+La+plongee+sous-marine+a+la+recherche+de+tresor+englouti+mean+in+French" },
  { french: "L'attaque de requin dans la baie", answers: ["shark attack", "ocean predator"], hint: "Marine cartilage fish assault", definition: "https://google.com/search?q=what+does+L%27attaque+de+requin+dans+la+baie+mean+in+French" },
  { french: "L'effraction dans une ferme d'alligators", answers: ["gator farm", "reptile enclosure"], hint: "Reptile breeding facility breach", definition: "https://google.com/search?q=what+does+L%27effraction+dans+une+ferme+d%27alligators+mean+in+French" },
  { french: "La course d'hydroglisseurs dans les marais", answers: ["swamp race", "airboat championship"], hint: "Wetland propeller boat sprint", definition: "https://google.com/search?q=what+does+La+course+d%27hydroglisseurs+dans+les+marais+mean+in+French" },
  { french: "Le braquage d'un restaurant de bord de route", answers: ["diner robbery", "classic hold up"], hint: "Highway eatery holdup", definition: "https://google.com/search?q=what+does+Le+braquage+d%27un+restaurant+de+bord+de+route+mean+in+French" },
  { french: "La riposte du caissier du magasin d'alimentation", answers: ["store clerk fights back", "counter robbery"], hint: "Employee armed retaliation", definition: "https://google.com/search?q=what+does+La+riposte+du+caissier+du+magasin+d%27alimentation+mean+in+French" },
  { french: "L'effraction dans la fourriere municipale", answers: ["impound lot heist", "stealing impounded cars"], hint: "Seized vehicle compound break-in", definition: "https://google.com/search?q=what+does+L%27effraction+dans+la+fourriere+municipale+mean+in+French" },
  { french: "L'evasion du broyeur a la decharge", answers: ["junkyard escape", "car crusher"], hint: "Scrap yard machinery evasion", definition: "https://google.com/search?q=what+does+L%27evasion+du+broyeur+a+la+decharge+mean+in+French" },
  { french: "Le sabotage provoquant une panne de courant a la centrale", answers: ["grid sabotage", "power blackout"], hint: "Electrical infrastructure blackout", definition: "https://google.com/search?q=what+does+Le+sabotage+provoquant+une+panne+de+courant+a+la+centrale+mean+in+French" },
  { french: "Le piratage pour interrompre la diffusion television", answers: ["broadcast hack", "tv signal takeover"], hint: "Television signal hijacking", definition: "https://google.com/search?q=what+does+Le+piratage+pour+interrompre+la+diffusion+television+mean+in+French" },
  { french: "Le piratage de surveillance sur une tour cellulaire", answers: ["wiretap", "cell tower hack"], hint: "Telecommunication mast intercept", definition: "https://google.com/search?q=what+does+Le+piratage+de+surveillance+sur+une+tour+cellulaire+mean+in+French" },
  { french: "Le raid sur la planque de protection des temoins", answers: ["witness protection", "safe house attack"], hint: "Federal informant shelter assault", definition: "https://google.com/search?q=what+does+Le+raid+sur+la+planque+de+protection+des+temoins+mean+in+French" },
  { french: "L'infiltration du tribunal federal", answers: ["courthouse break in", "legal archives heist"], hint: "Government judicial building breach", definition: "https://google.com/search?q=what+does+L%27infiltration+du+tribunal+federal+mean+in+French" },
  { french: "Le vol de la salle des scelles au poste de police", answers: ["evidence room heist", "stealing seized goods"], hint: "Police precinct property theft", definition: "https://google.com/search?q=what+does+Le+vol+de+la+salle+des+scelles+au+poste+de+police+mean+in+French" },
  { french: "L'effraction au siege de campagne du maire", answers: ["political scandal", "campaign office break in"], hint: "Mayoral election headquarters break-in", definition: "https://google.com/search?q=what+does+L%27effraction+au+siege+de+campagne+du+maire+mean+in+French" },
  { french: "Le bunker souterrain secret", answers: ["underground bunker", "secret facility"], hint: "Subterranean classified installation", definition: "https://google.com/search?q=what+does+Le+bunker+souterrain+secret+mean+in+French" },
  { french: "L'exploration d'un silo a missiles abandonne", answers: ["missile silo", "nuclear bunker"], hint: "Disused ballistic launch shaft", definition: "https://google.com/search?q=what+does+L%27exploration+d%27un+silo+a+missiles+abandonne+mean+in+French" },
  { french: "Le largage de contrebande dans les Everglades", answers: ["everglades drop", "swamp drop off"], hint: "Wetland illicit package air-drop", definition: "https://google.com/search?q=what+does+Le+largage+de+contrebande+dans+les+Everglades+mean+in+French" },
  { french: "La confrontation avec la police suite a un exces de vitesse", answers: ["traffic stop", "police warning"], hint: "Velocity infraction police pull-over", definition: "https://google.com/search?q=what+does+La+confrontation+avec+la+police+suite+a+un+exces+de+vitesse+mean+in+French" },
  { french: "Les consequences d'un accident en conduisant en etat d'ivresse", answers: ["dui crash", "car accident"], hint: "Intoxicated vehicular collision", definition: "https://google.com/search?q=what+does+Les+consequences+d%27un+accident+en+conduisant+en+etat+d%27ivresse+mean+in+French" },
  { french: "La transaction de drogue au coin de la rue", answers: ["corner dealing", "street corner drop"], hint: "Pavement narcotics trade", definition: "https://google.com/search?q=what+does+La+transaction+de+drogue+au+coin+de+la+rue+mean+in+French" },
  { french: "La voie d'evasion par le parkour sur les toits", answers: ["rooftop escape", "parkour chase"], hint: "Architectural vertical-traversal flight", definition: "https://google.com/search?q=what+does+La+voie+d%27evasion+par+le+parkour+sur+les+toits+mean+in+French" },
  { french: "La course-poursuite en bateau dans les canaux de style Venise", answers: ["canal boat chase", "waterway pursuit"], hint: "Waterway network vessel pursuit", definition: "https://google.com/search?q=what+does+La+course-poursuite+en+bateau+dans+les+canaux+de+style+Venise+mean+in+French" },
  { french: "Le grabuge en voiture de golf sur le terrain de luxe", answers: ["golf course chaos", "cart rampage"], hint: "Fairway electric vehicle rampage", definition: "https://google.com/search?q=what+does+Le+grabuge+en+voiture+de+golf+sur+le+terrain+de+luxe+mean+in+French" },
  { french: "L'effraction dans un club de campagne exclusif", answers: ["country club heist", "rich neighborhood break in"], hint: "Elite recreational estate burglary", definition: "https://google.com/search?q=what+does+L%27effraction+dans+un+club+de+campagne+exclusif+mean+in+French" },
  { french: "Le braquage de la piscine d'un manoir", answers: ["mansion robbery", "estate burglary"], hint: "Luxury backyard basin heist", definition: "https://google.com/search?q=what+does+Le+braquage+de+la+piscine+d%27un+manoir+mean+in+French" },
  { french: "L'assommoir du gardien de securite", answers: ["stealth takedown", "guard knockout"], hint: "Silent security sentinel neutralization", definition: "https://google.com/search?q=what+does+L%27assommoir+du+gardien+de+securite+mean+in+French" },
  { french: "Le contournement du systeme de securite laser", answers: ["laser grid", "security bypass"], hint: "Optic beam security evasion", definition: "https://google.com/search?q=what+does+Le+contournement+du+systeme+de+securite+laser+mean+in+French" },
  { french: "Le piratage du lecteur biometrique du coffre", answers: ["biometric scan", "vault unlock"], hint: "Biological security scanner defeat", definition: "https://google.com/search?q=what+does+Le+piratage+du+lecteur+biometrique+du+coffre+mean+in+French" },
  { french: "Le vol de piles de lingots d'or", answers: ["gold bar heist", "bullion robbery"], hint: "Precious metal reserve theft", definition: "https://google.com/search?q=what+does+Le+vol+de+piles+de+lingots+d%27or+mean+in+French" },
  { french: "Le braquage de la bourse aux diamants", answers: ["diamond heist", "gem robbery"], hint: "Gemstone trading floor robbery", definition: "https://google.com/search?q=what+does+Le+braquage+de+la+bourse+aux+diamants+mean+in+French" },
  { french: "Le cambriolage d'une vente aux encheres d'art contrefait", answers: ["art gallery heist", "painting theft"], hint: "Fine art auction burglary", definition: "https://google.com/search?q=what+does+Le+cambriolage+d%27une+vente+aux+encheres+d%27art+contrefait+mean+in+French" },
  { french: "La mission de recuperation d'artefacts au musee", answers: ["museum break in", "ancient artifact theft"], hint: "Historical exhibition recovery job", definition: "https://google.com/search?q=what+does+La+mission+de+recuperation+d%27artefacts+au+musee+mean+in+French" },
  { french: "La fusillade dans la salle VIP d'un casino souterrain", answers: ["casino shootout", "underground gambling hall"], hint: "Subterranean wagering room gunfight", definition: "https://google.com/search?q=what+does+La+fusillade+dans+la+salle+VIP+d%27un+casino+souterrain+mean+in+French" },
  { french: "Le trucage d'une machine a sous", answers: ["rigged slot machine", "casino hack"], hint: "Tampered gaming terminal odds", definition: "https://google.com/search?q=what+does+Le+trucage+d%27une+machine+a+sous+mean+in+French" },
  { french: "Le trucage de paris sur les courses de chevaux", answers: ["fixed race", "track betting scam"], hint: "Manipulated equine wagering outcome", definition: "https://google.com/search?q=what+does+Le+trucage+de+paris+sur+les+courses+de+chevaux+mean+in+French" },
  { french: "Le sabotage de la piste de courses de chiens", answers: ["dog track raid", "greyhound sabotage"], hint: "Canine racing track disruption", definition: "https://google.com/search?q=what+does+Le+sabotage+de+la+piste+de+courses+de+chiens+mean+in+French" },
  { french: "Le tonneau en avion de voltige au-dessus de la ville", answers: ["stunt plane", "aerial acrobatics"], hint: "Acrobatic aircraft roll maneuver", definition: "https://google.com/search?q=what+does+Le+tonneau+en+avion+de+voltige+au-dessus+de+la+ville+mean+in+French" },
  { french: "Le saut en chute libre au-dessus de la plage de Vice City", answers: ["sky dive", "beach jump"], hint: "Coastal atmospheric freefall drop", definition: "https://google.com/search?q=what+does+Le+saut+en+chute+libre+au-dessus+de+la+plage+de+Vice+City+mean+in+French" },
  { french: "Le vol en combinaison volant a travers les gratte-ciel", answers: ["wingsuit flight", "skyscraper glide"], hint: "High-rise textile gliding descent", definition: "https://google.com/search?q=what+does+Le+vol+en+combinaison+volant+a+travers+les+gratte-ciel+mean+in+French" },
  { french: "Le poste de tireur d'elite dans une montgolfiere", answers: ["hot air balloon", "aerial sniper"], hint: "Aerostatic balloon sniper perch", definition: "https://google.com/search?q=what+does+Le+poste+de+tireur+d%27elite+dans+une+montgolfiere+mean+in+French" },
  { french: "Le detournement de la banniere publicitaire du dirigeable", answers: ["blimp hijack", "airship takeover"], hint: "Advertising airship commandeer", definition: "https://google.com/search?q=what+does+Le+detournement+de+la+banniere+publicitaire+du+dirigeable+mean+in+French" },
  { french: "Le complot de deraillement d'un train de marchandises", answers: ["train derailment", "railroad heist"], hint: "Freight railway sabotage plot", definition: "https://google.com/search?q=what+does+Le+complot+de+deraillement+d%27un+train+de+marchandises+mean+in+French" },
  { french: "Le vol d'une locomotive de train de marchandises", answers: ["train hijacking", "locomotive theft"], hint: "Rail engine command theft", definition: "https://google.com/search?q=what+does+Le+vol+d%27une+locomotive+de+train+de+marchandises+mean+in+French" },
  { french: "L'accident de vehicule a un passage a niveau", answers: ["train crash", "vehicle stuck on tracks"], hint: "Railway grade crossing collision", definition: "https://google.com/search?q=what+does+L%27accident+de+vehicule+a+un+passage+a+niveau+mean+in+French" },
  { french: "Le saut par-dessus un pont-levis ouvert", answers: ["drawbridge jump", "bridge gap leap"], hint: "Bascule bridge structural jump", definition: "https://google.com/search?q=what+does+Le+saut+par-dessus+un+pont-levis+ouvert+mean+in+French" },
  { french: "La fusillade dans les embouteillages d'un tunnel routier", answers: ["tunnel shootout", "highway tunnel traffic"], hint: "Sub-surface vehicular congestion firefight", definition: "https://google.com/search?q=what+does+La+fusillade+dans+les+embouteillages+d%27un+tunnel+routier+mean+in+French" },
  { french: "La bagarre sur le quai d'une station de metro", answers: ["subway fight", "metro station brawl"], hint: "Rapid transit platform altercation", definition: "https://google.com/search?q=what+does+La+bagarre+sur+le+quai+d%27une+station+de+metro+mean+in+French" },
  { french: "L'echappatoire au cordons de police dans les tunnels du metro", answers: ["metro escape", "subway tunnel chase"], hint: "Subterranean rail network flight", definition: "https://google.com/search?q=what+does+L%27echappatoire+au+cordons+de+police+dans+les+tunnels+du+metro+mean+in+French" },
  { french: "Le braquage du pont passagers d'un navire de croisiere", answers: ["cruise ship robbery", "liner heist"], hint: "Passenger vessel command deck heist", definition: "https://google.com/search?q=what+does+Le+braquage+du+pont+passagers+d%27un+navire+de+croisiere+mean+in+French" },
  { french: "La prise de controle d'une barge casino flottante", answers: ["floating casino", "barge heist"], hint: "Pontoons-mounted gambling vessel takeover", definition: "https://google.com/search?q=what+does+La+prise+de+controle+d%27une+barge+casino+flottante+mean+in+French" },
  { french: "L'infiltration tactique d'une plateforme petroliere", answers: ["oil rig assault", "offshore platform raid"], hint: "Marine petroleum extraction raid", definition: "https://google.com/search?q=what+does+L%27infiltration+tactique+d%27une+plateforme+petroliere+mean+in+French" },
  { french: "La confrontation avec le gardien de phare", answers: ["lighthouse lookout", "coastal watchtower"], hint: "Beacon tower keeper standoff", definition: "https://google.com/search?q=what+does+La+confrontation+avec+le+gardien+de+phare+mean+in+French" },
  { french: "La perturbation d'une fete autour d'un feu de camp sur la plage", answers: ["beach party", "bonfire brawl"], hint: "Coastal fire gathering disruption", definition: "https://google.com/search?q=what+does+La+perturbation+d%27une+fete+autour+d%27un+feu+de+camp+sur+la+plage+mean+in+French" },
  { french: "Le chaos de la foule pendant le Spring Break", answers: ["spring break", "crowd riot"], hint: "Student vacation mass disorder", definition: "https://google.com/search?q=what+does+Le+chaos+de+la+foule+pendant+le+Spring+Break+mean+in+French" },
  { french: "La falsification de passes pour les coulisses d'un festival", answers: ["music festival", "backstage infiltration"], hint: "Concert credential forgery", definition: "https://google.com/search?q=what+does+La+falsification+de+passes+pour+les+coulisses+d%27un+festival+mean+in+French" },
  { french: "Le fracas du materiel dans la cabine du DJ", answers: ["dj booth fight", "concert chaos"], hint: "Disc jockey console destruction", definition: "https://google.com/search?q=what+does+Le+fracas+du+materiel+dans+la+cabine+du+DJ+mean+in+French" },
  { french: "Le reseau de revente de billets de concert VIP", answers: ["ticket scalping", "black market passes"], hint: "Premium concert pass black market", definition: "https://google.com/search?q=what+does+Le+reseau+de+revente+de+billets+de+concert+VIP+mean+in+French" },
  { french: "La course-poursuite des paparazzi derriere une celebritie", answers: ["paparazzi chase", "celebrity stalker"], hint: "Tabloid photographer vehicular pursuit", definition: "https://google.com/search?q=what+does+La+course-poursuite+des+paparazzi+derriere+une+celebritie+mean+in+French" },
  { french: "L'explosion ratee lors d'une cascade sur un plateau de cinema", answers: ["movie set chaos", "film studio explosion"], hint: "Cinematic pyrotechnic mishap", definition: "https://google.com/search?q=what+does+L%27explosion+ratee+lors+d%27une+cascade+sur+un+plateau+de+cinema+mean+in+French" },
  { french: "L'escalade du panneau de style Hollywood", answers: ["sign climb", "landmark scaling"], hint: "Cinematic hillside letter scaling", definition: "https://google.com/search?q=what+does+L%27escalade+du+panneau+de+style+Hollywood+mean+in+French" },
  { french: "Le cambriolage de l'astronome a l'observatoire", answers: ["observatory heist", "hilltop robbery"], hint: "Dome telescope facility burglary", definition: "https://google.com/search?q=what+does+Le+cambriolage+de+l%27astronome+a+l%27observatoire+mean+in+French" },
  { french: "La fusillade sur la passerelle d'entretien d'un parc eolien", answers: ["wind turbine fight", "wind farm catwalk"], hint: "Eolienne maintenance gantry gunfight", definition: "https://google.com/search?q=what+does+La+fusillade+sur+la+passerelle+d%27entretien+d%27un+parc+eolien+mean+in+French" },
  { french: "La course en quad sur le champ de panneaux solaires", answers: ["solar farm race", "atv desert dash"], hint: "Photovoltaic array all-terrain dash", definition: "https://google.com/search?q=what+does+La+course+en+quad+sur+le+champ+de+panneaux+solaires+mean+in+French" },
  { french: "Le piege pour auto-stoppeur sur l'autoroute du desert", answers: ["hitchhiker trap", "desert ambush"], hint: "Arid highway traveler snare", definition: "https://google.com/search?q=what+does+Le+piege+pour+auto-stoppeur+sur+l%27autoroute+du+desert+mean+in+French" },
  { french: "L'exploration d'une ville fantome abandonnee", answers: ["ghost town", "abandoned settlement"], hint: "Deserted historical settlement trek", definition: "https://google.com/search?q=what+does+L%27exploration+d%27une+ville+fantome+abandonnee+mean+in+French" },
  { french: "Le confinement militaire du site d'ecrasement d'une meteorite", answers: ["meteorite site", "alien conspiracy area"], hint: "Extraterrestrial debris military quarantine", definition: "https://google.com/search?q=what+does+Le+confinement+militaire+du+site+d%27ecrasement+d%27une+meteorite+mean+in+French" },
  { french: "Le rassemblement secret d'une secte d'ovnis", answers: ["ufo cult", "alien believers"], hint: "Unidentified flying object cult meet", definition: "https://google.com/search?q=what+does+Le+rassemblement+secret+d%27une+secte+d%27ovnis+mean+in+French" },
  { french: "L'interview dans la cave d'un theoricien du complot", answers: ["conspiracy theorist", "tinfoil hat interview"], hint: "Subterranean fringe theorist dialogue", definition: "https://google.com/search?q=what+does+L%27interview+dans+la+cave+d%27un+theoricien+du+complot+mean+in+French" },
  { french: "L'emission de radio de minuit avec un talk-show", answers: ["radio talk show", "midnight broadcast"], hint: "Nocturnal audio discussion program", definition: "https://google.com/search?q=what+does+L%27emission+de+radio+de+minuit+avec+un+talk-show+mean+in+French" },
  { french: "L'enregistrement de voix off pour une publicite satirique", answers: ["commercial parody", "satirical ad"], hint: "Mock advertisement vocal dub", definition: "https://google.com/search?q=what+does+L%27enregistrement+de+voix+off+pour+une+publicite+satirique+mean+in+French" },
  { french: "La dispute et la fusillade au drive-in d'un fast-food", answers: ["drive thru fight", "fast food rage"], hint: "Automotive-service window shootout", definition: "https://google.com/search?q=what+does+La+dispute+et+la+fusillade+au+drive-in+d%27un+fast-food+mean+in+French" },
  { french: "La confrontation pour rage au volant a coups de batte de base-ball", answers: ["road rage", "bat beatdown"], hint: "Traffic dispute club assault", definition: "https://google.com/search?q=what+does+La+confrontation+pour+rage+au+volant+a+coups+de+batte+de+base-ball+mean+in+French" },
  { french: "La bagarre suite a un accrochage dans un parking", answers: ["parking lot fight", "fender bender dispute"], hint: "Minor collision tarmac brawl", definition: "https://google.com/search?q=what+does+La+bagarre+suite+a+un+accrochage+dans+un+parking+mean+in+French" },
  { french: "Le vol d'une voiture par le service de voiturier", answers: ["valet heist", "stealing customer cars"], hint: "Parking attendant auto theft", definition: "https://google.com/search?q=what+does+Le+vol+d%27une+voiture+par+le+service+de+voiturier+mean+in+French" },
  { french: "Le piege des brosses automatiques dans une station de lavage", answers: ["car wash escape", "automatic wash ambush"], hint: "Rotary brush vehicular trap", definition: "https://google.com/search?q=what+does+Le+piege+des+brosses+automatiques+dans+une+station+de+lavage+mean+in+French" },
  { french: "L'effraction dans un box de stockage personnel", answers: ["storage unit heist", "lock cutter"], hint: "Self-storage facility padlock breach", definition: "https://google.com/search?q=what+does+L%27effraction+dans+un+box+de+stockage+personnel+mean+in+French" },
  { french: "L'escroquerie d'un homme politique corrompu", answers: ["politician blackmail", "extortion plot"], hint: "Elected official coercion scheme", definition: "https://google.com/search?q=what+does+L%27escroquerie+d%27un+homme+politique+corrompu+mean+in+French" },
  { french: "La reunion pour la remise de photos compromettantes", answers: ["blackmail meeting", "photo exchange"], hint: "Incriminating evidence handoff", definition: "https://google.com/search?q=what+does+La+reunion+pour+la+remise+de+photos+compromettantes+mean+in+French" },
  { french: "L'echange de la mallette pour la rancon", answers: ["ransom drop", "briefcase exchange"], hint: "Extortion currency case swap", definition: "https://google.com/search?q=what+does+L%27echange+de+la+mallette+pour+la+rancon+mean+in+French" },
  { french: "L'operation de sauvetage d'otages", answers: ["hostage rescue", "save the captive"], hint: "Captive extraction tactical op", definition: "https://google.com/search?q=what+does+L%27operation+de+sauvetage+d%27otages+mean+in+French" },
  { french: "La decoupe thermique du coffre de banque avec une lance", answers: ["thermal lance", "cutting vault door"], hint: "High-temperature steel vault torching", definition: "https://google.com/search?q=what+does+La+decoupe+thermique+du+coffre+de+banque+avec+une+lance+mean+in+French" },
  { french: "L'effraction d'une porte a l'explosif C4", answers: ["c4 charge", "explosive entry"], hint: "Plastic explosive breaching charge", definition: "https://google.com/search?q=what+does+L%27effraction+d%27une+porte+a+l%27explosif+C4+mean+in+French" },
  { french: "La progression tactique dans le couloir avec des grenades fumigenes", answers: ["smoke grenade", "tactical advance"], hint: "Visual-obscuring aerosol corridor push", definition: "https://google.com/search?q=what+does+La+progression+tactique+dans+le+couloir+avec+des+grenades+fumigenes+mean+in+French" },
  { french: "Le nettoyage d'une piece a l'aide d'une grenade etourdissante", answers: ["flashbang entry", "room clear"], hint: "Stun-device room clearance", definition: "https://google.com/search?q=what+does+Le+nettoyage+d%27une+piece+a+l%27aide+d%27une+grenade+etourdissante+mean+in+French" },
  { french: "Le tir de suppression avec un fusil de sniper", answers: ["suppressive fire", "sniper cover"], hint: "Long-range covering volume fire", definition: "https://google.com/search?q=what+does+Le+tir+de+suppression+avec+un+fusil+de+sniper+mean+in+French" },
  { french: "L'elimination au combat en frappant avec la crosse du pistolet", answers: ["pistol whip", "close quarters combat"], hint: "Firearm butt close-range strike", definition: "https://google.com/search?q=what+does+L%27elimination+au+combat+en+frappant+avec+la+crosse+du+pistolet+mean+in+French" },
  { french: "La roulade d'evitement derriere un abri", answers: ["combat roll", "dive for cover"], hint: "Evasive tactical ground spin", definition: "https://google.com/search?q=what+does+La+roulade+d%27evitement+derriere+un+abri+mean+in+French" },
  { french: "Le tir en aveugle autour d'un angle", answers: ["blind fire", "corner shooting"], hint: "Unscoped perimeter angle shooting", definition: "https://google.com/search?q=what+does+Le+tir+en+aveugle+autour+d%27un+angle+mean+in+French" },
  { french: "Le remplacement de la plaque de blindage en plein milieu d'un echange de tirs", answers: ["armor plating", "putting on vest"], hint: "In-combat ballistic vest swap", definition: "https://google.com/search?q=what+does+Le+remplacement+de+la+plaque+de+blindage+en+plein+milieu+d%27un+echange+de+tirs+mean+in+French" },
  { french: "La consommation d'en-cas pour recuperer de la sante sous les tirs", answers: ["eating snacks", "healing up"], hint: "Ballistic recovery snack ingestion", definition: "https://google.com/search?q=what+does+La+consommation+d%27en-cas+pour+recuperer+de+la+sante+sous+les+tirs+mean+in+French" },
  { french: "Le changement d'arme grace au menu circulaire d'inventaire", answers: ["weapon wheel", "switching guns"], hint: "Radial inventory firearm selection", definition: "https://google.com/search?q=what+does+Le+changement+d%27arme+grace+au+menu+circulaire+d%27inventaire+mean+in+French" },
  { french: "La defense en utilisant la portiere d'une voiture comme bouclier pare-balles", answers: ["car door cover", "vehicle shield"], hint: "Automotive steel ballistic shield", definition: "https://google.com/search?q=what+does+La+defense+en+utilisant+la+portiere+d%27une+voiture+comme+bouclier+pare-balles+mean+in+French" },
  { french: "La tactique consistant a tirer dans les pneus pour immobiliser un vehicule", answers: ["shooting tires", "disabled vehicle"], hint: "Rubber deflation stopping tactic", definition: "https://google.com/search?q=what+does+La+tactique+consistant+a+tirer+dans+les+pneus+pour+immobiliser+un+vehicule+mean+in+French" },
  { french: "L'arret d'un vehicule grace a un tir de sniper dans le bloc moteur", answers: ["engine block shot", "stopping the car"], hint: "Powertrain precision disabling shot", definition: "https://google.com/search?q=what+does+L%27arret+d%27un+vehicule+grace+a+un+tir+de+sniper+dans+le+bloc+moteur+mean+in+French" },
  { french: "La manoeuvre PIT comme technique de poursuite policiere", answers: ["pit maneuver", "ramming the suspect"], hint: "Precision immobilization technique spin", definition: "https://google.com/search?q=what+does+La+manoeuvre+PIT+comme+technique+de+poursuite+policiere+mean+in+French" },
  { french: "Le deploiement de bandes de clous sur la route", answers: ["spike strips", "tire deflation"], hint: "Roadway puncture barrier setup", definition: "https://google.com/search?q=what+does+Le+deploiement+de+bandes+de+clous+sur+la+route+mean+in+French" },
  { french: "Le passage en force a travers une barricade de barrage routier", answers: ["roadblock crash", "breaking through barricade"], hint: "Police blockade vehicular smash", definition: "https://google.com/search?q=what+does+Le+passage+en+force+a+travers+une+barricade+de+barrage+routier+mean+in+French" },
  { french: "L'evasion du projecteur d'un helicoptere", answers: ["avoiding searchlight", "hiding from chopper"], hint: "Rotary-wing beam evasion", definition: "https://google.com/search?q=what+does+L%27evasion+du+projecteur+d%27un+helicoptere+mean+in+French" },
  { french: "La diminution de l'indice de recherche lorsque les etoiles clignotent", answers: ["losing the cops", "wanted level cooling down"], hint: "Flashing hostility star decay", definition: "https://google.com/search?q=what+does+La+diminution+de+l%27indice+de+recherche+lorsque+les+etoiles+clignotent+mean+in+French" },
  { french: "La sequence d'ecran d'arrestation interceptee", answers: ["busted screen", "getting arrested"], hint: "Apprehension sequence interface", definition: "https://google.com/search?q=what+does+La+sequence+d%27ecran+d%27arrestation+interceptee+mean+in+French" },
  { french: "La facture d'hopital suite a une reaparition apres un echec", answers: ["wasted screen", "respawning at hospital"], hint: "Medical facility resurrection fee", definition: "https://google.com/search?q=what+does+La+facture+d%27hopital+suite+a+une+reaparition+apres+un+echec+mean+in+French" },
  { french: "Le changement de vetements dans la garde-robe de la planque", answers: ["changing clothes", "outfit selection"], hint: "Wardrobe apparel modification", definition: "https://google.com/search?q=what+does+Le+changement+de+vetements+dans+la+garde-robe+de+la+planque+mean+in+French" },
  { french: "La personnalisation de la coiffure au salon de coiffure", answers: ["haircut", "salon visit"], hint: "Cranial follicle styling visit", definition: "https://google.com/search?q=what+does+La+personnalisation+de+la+coiffure+au+salon+de+coiffure+mean+in+French" },
  { french: "La seance de tatouage au salon de tatouage", answers: ["tattoo shop", "getting inked"], hint: "Dermal pigment application session", definition: "https://google.com/search?q=what+does+La+seance+de+tatouage+au+salon+de+tatouage+mean+in+French" },
  { french: "L'achat d'en-cas dans une epicerie", answers: ["buying snacks", "store items"], hint: "Retail nourishment purchase", definition: "https://google.com/search?q=what+does+L%27achat+d%27en-cas+dans+une+epicerie+mean+in+French" },
  { french: "Le gain a un jeu a gratter de loterie", answers: ["scratch card", "lottery win"], hint: "Wager ticket latex removal prize", definition: "https://google.com/search?q=what+does+Le+gain+a+un+jeu+a+gratter+de+loterie+mean+in+French" },
  { french: "Le vol du pot de pourboire d'un artiste de rue", answers: ["stealing tip jar", "street musician robbery"], hint: "Busker gratuity container theft", definition: "https://google.com/search?q=what+does+Le+vol+du+pot+de+pourboire+d%27un+artiste+de+rue+mean+in+French" },
  { french: "Le piratage d'un distributeur automatique avec un pied-de-biche", answers: ["atm robbery", "crowbar atm smash"], hint: "Cash machine mechanical pry", definition: "https://google.com/search?q=what+does+Le+piratage+d%27un+distributeur+automatique+avec+un+pied-de-biche+mean+in+French" },
  { french: "Le crime consistant a arracher le telephone d'un pieton", answers: ["phone snatching", "stealing phone from pedestrian"], hint: "Pedestrian mobile device theft", definition: "https://google.com/search?q=what+does+Le+crime+consistant+a+arracher+le+telephone+d%27un+pieton+mean+in+French" },
  { french: "L'evasion en bicyclette volee", answers: ["bicycle theft", "pedal bike escape"], hint: "Man-powered two-wheeler flight", definition: "https://google.com/search?q=what+does+L%27evasion+en+bicyclette+volee+mean+in+French" },
  { french: "La figure acrobatique dans le demi-pipe d'un skatepark", answers: ["skate park", "halfpipe trick"], hint: "U-shaped ramp aerial trick", definition: "https://google.com/search?q=what+does+La+figure+acrobatique+dans+le+demi-pipe+d%27un+skatepark+mean+in+French" },
  { french: "Le saut de toit en BMX", answers: ["bmx drop", "roof gap jump"], hint: "Bicycle motocross architectural leap", definition: "https://google.com/search?q=what+does+Le+saut+de+toit+en+BMX+mean+in+French" },
  { french: "La course en patins a roulettes sur la promenade", answers: ["boardwalk skate", "roller skating race"], hint: "Coastal paved wheeled skating", definition: "https://google.com/search?q=what+does+La+course+en+patins+a+roulettes+sur+la+promenade+mean+in+French" },
  { french: "Le piege appate par la musique d'un camion de glaces", answers: ["ice cream truck trap", "luring victims"], hint: "Melodic frozen dairy trap", definition: "https://google.com/search?q=what+does+Le+piege+appate+par+la+musique+d%27un+camion+de+glaces+mean+in+French" },
  { french: "La bagarre pour le territoire entre camions-restaurants", answers: ["food truck fight", "culinary turf war"], hint: "Mobile catering territory brawl", definition: "https://google.com/search?q=what+does+La+bagarre+pour+le+territoire+entre+camions-restaurants+mean+in+French" },
  { french: "La destruction d'un chariot de vendeur de nourriture de rue", answers: ["destroying food cart", "vendor chaos"], hint: "Mobile street kiosk smashing", definition: "https://google.com/search?q=what+does+La+destruction+d%27un+chariot+de+vendeur+de+nourriture+de+rue+mean+in+French" },
  { french: "Le panorama de palmiers au coucher du soleil sur fond de neon", answers: ["sunset panorama", "neon palm trees"], hint: "Tropical silhouette twilight view", definition: "https://google.com/search?q=what+does+Le+panorama+de+palmiers+au+coucher+du+soleil+sur+fond+de+neon+mean+in+French" },
  { french: "L'inondation causee par une tempete tropicale ou un ouragan", answers: ["hurricane flood", "tropical storm weather"], hint: "Cyclonic storm surge deluge", definition: "https://google.com/search?q=what+does+L%27inondation+causee+par+une+tempete+tropicale+ou+un+ouragan+mean+in+French" },
  { french: "La tempete de plage frappe par un eclair", answers: ["lightning storm", "beach thunder"], hint: "Electrical storm coastal strike", definition: "https://google.com/search?q=what+does+La+tempete+de+plage+frappe+par+un+eclair+mean+in+French" },
  { french: "Un arc-en-ciel au-dessus de l'horizon de Vice City", answers: ["rainbow view", "post storm rainbow"], hint: "Optical dispersion urban arch", definition: "https://google.com/search?q=what+does+Un+arc-en-ciel+au-dessus+de+l%27horizon+de+Vice+City+mean+in+French" },
  { french: "La brume matinale sur le marais", answers: ["morning mist", "swamp fog"], hint: "Wetland early-hour vapor layer", definition: "https://google.com/search?q=what+does+La+brume+matinale+sur+le+marais+mean+in+French" },
  { french: "L'observation des etoiles depuis une crete du desert", answers: ["desert stargazing", "night sky view"], hint: "Arid ridge celestial observation", definition: "https://google.com/search?q=what+does+L%27observation+des+etoiles+depuis+une+crete+du+desert+mean+in+French" }
];

let blitzInterval = null;
let INITIAL_TIMER_SECONDS = 30;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function boost(audio, gain) {
  const source = audioCtx.createMediaElementSource(audio);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode).connect(audioCtx.destination);
  return gainNode
}

const soundWin = new Audio("Sounds/correct.mp3");
boost(soundWin, 2);
const soundWrong = new Audio("Sounds/wrong.mp3");
boost(soundWrong, 2);
const soundRoll = new Audio("Sounds/dice.mp3");
boost(soundRoll, 3);
const soundJeopardy = new Audio('Sounds/jeopardy.mp3');
const bgm = new Audio('Sounds/November/bgm.mp3');
bgm.loop = true;
bgm.volume = 0;
const bgm2 = new Audio('Sounds/November/bgm2.mp3');
bgm2.loop = true;
bgm2.volume = 0;
const bgm3 = new Audio('Sounds/November/bgm3.mp3');
bgm3.loop = true;
bgm3.volume = 0;

const BGM_VOLUME = 0.2;
const FADE_MS = 500;
const fadeTimers = new WeakMap();
const playbackRequested = new WeakMap();

function fadeTo(target, sound, onDone) {
  const existingTimer = fadeTimers.get(sound);
  if (existingTimer !== undefined) {
    clearInterval(existingTimer);
    fadeTimers.delete(sound);
  }

  const steps = 20;
  const stepMs = FADE_MS / steps;
  const delta = (target - sound.volume) / steps;
  let i = 0;
  if (sound.volume === target) {
    sound.volume = target;
    if (onDone) onDone();
    return
  }

  const fadeTimer = setInterval(() => {
    i++;
    sound.volume = Math.min(1, Math.max(0, sound.volume + delta));
    if (i >= steps) {
      clearInterval(fadeTimer);
      fadeTimers.delete(sound);
      sound.volume = target;
      if (onDone) onDone();
    }
  }, stepMs);
  fadeTimers.set(sound, fadeTimer);
}

let bgmRetryPending = false;

function retryBgmOnInteraction() {
  if (bgmRetryPending) return;
  bgmRetryPending = true;
  const events = ['click', 'keydown', 'touchend'];
  const retry = () => {
    events.forEach(e => window.removeEventListener(e, retry, true));
    bgmRetryPending = false;
    checkSeasonal();
  };
  events.forEach(e => window.addEventListener(e, retry, true));
}

function bgmPlayFailed(err) {
  if (err && err.name === 'NotAllowedError') retryBgmOnInteraction();
  else error('Unable to begin bgm playback');
}

function startBgm() {
  playbackRequested.set(bgm, true);
  bgm.play().then(() => {
    if (playbackRequested.get(bgm)) fadeTo(BGM_VOLUME, bgm);
  }).catch(bgmPlayFailed);
}

function stopBgm() {
  playbackRequested.set(bgm, false);
  fadeTo(0, bgm, () => {
    bgm.pause();
    bgm.currentTime = 0;
  });
}

function startBgm2() {
  playbackRequested.set(bgm2, true);
  bgm2.play().then(() => {
    if (playbackRequested.get(bgm2)) fadeTo(BGM_VOLUME, bgm2);
  }).catch(bgmPlayFailed);
}

function stopBgm2() {
  playbackRequested.set(bgm2, false);
  fadeTo(0, bgm2, () => {
    bgm2.pause();
    bgm2.currentTime = 0;
  });
}

function startBgm3() {
  playbackRequested.set(bgm3, true);
  bgm3.play().then(() => {
    if (playbackRequested.get(bgm3)) fadeTo(BGM_VOLUME, bgm3);
  }).catch(bgmPlayFailed);
}

function stopBgm3() {
  playbackRequested.set(bgm3, false);
  fadeTo(0, bgm3, () => {
    bgm3.pause();
    bgm3.currentTime = 0;
  });
}

const KEY = "customPhrases";

let backToScreen = 0;

const phrasesByMode = { all: allPhrases, easy: easyPhrases, medium: mediumPhrases, hard: hardPhrases, blitz: allPhrases, custom: customPhrases, seasonal: seasonalPhrases, seasonal2: seasonal2Phrases, seasonal3: seasonal3Phrases };

let currentMode = load('frenchGamemode', 'all');

let phrases = phrasesByMode[currentMode];

let savedPhrases = load('frenchSavedPhrases', {});
let current = savedPhrases[currentMode] ?? null;

if (savedPhrases.custom && !Array.isArray(savedPhrases.custom.answers)) delete savedPhrases.custom;

function storeSavedPhrases() {
  localStorage.setItem('frenchSavedPhrases', JSON.stringify(savedPhrases));
};

function addToCustom() {
  const french = document.getElementById('frenchCustom').value;
  const english = document.getElementById('englishCustom').value;
  if (french.trim() !== '' && english.trim() !== '') {addPhrase
    (french, english);
    custom();
  };
};

function addPhrase(french, english) {
  
  customPhrases.push({ french: french.trim(), answers: english.split('/').map(s => s.trim()).filter(Boolean) });
  localStorage.setItem(KEY, JSON.stringify(customPhrases));
};

function deletePhrase(i) {
  customPhrases.splice(i, 1);
  localStorage.setItem(KEY, JSON.stringify(customPhrases));
};

function focus() {
document.getElementById("userInput").focus();
};

const SCORE_MODES = ['all', 'easy', 'medium', 'hard', 'blitz', 'custom', 'seasonal', 'seasonal2', 'seasonal3'];
let modeScores = {};

(function loadScores() {
  const readJSON = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const num = v => Number(v) || 0;
  const fresh = src => ({ wins: num(src?.wins), losses: num(src?.losses), hints: num(src?.hints) });

  const saved = readJSON('frenchScores');
  const old = readJSON('frenchScore');

  for (const m of SCORE_MODES) modeScores[m] = fresh(saved?.[m]);
  if (saved && typeof saved === 'object') {
    for (const m of Object.keys(saved)) if (!modeScores[m]) modeScores[m] = fresh(saved[m]);
  }
  if (!saved && old) modeScores.all = fresh(old);
})();

function syncScore() {
  score = modeScores[currentMode] ??= { wins: 0, losses: 0, hints: 0 };
}

function showScore() {
  const labelOf = key => key.charAt(0).toUpperCase() + key.slice(1);
  const line = (key, s) => key === 'blitz'
    ? `${labelOf(key)}: Best Streak ${s.wins} | Streak ${s.losses}`
    : `${labelOf(key)}: Wins ${s.wins} | Losses ${s.losses} | Hints ${s.hints}`;

  const current = document.querySelector('.score');
  if (current) current.innerHTML = line(currentMode, score);

  const all = document.querySelector('.allScore');
  if (all) all.innerHTML = SCORE_MODES.filter(k => modeScores[k]).map(k => line(k, modeScores[k])).join('<br>');
}

function updateScore() {
  try { localStorage.setItem('frenchScores', JSON.stringify(modeScores)); } catch {}
  showScore();
}

function resetScore() {
  score.wins = 0;
  score.losses = 0;
  score.hints = 0;
  updateScore();
}

syncScore();
showScore();

function invalidErr(log) {
  document.querySelector('.submit').hidden = true;
  document.getElementById('userInput').blur();
  document.getElementById('userInput').value = log;
  setTimeout(() => {
    document.getElementById('userInput').value = '';
    focus();
    document.querySelector('.submit').hidden = false;
    }, 1000);
};

function speak(text = current.french) {
  if (!('speechSynthesis' in window))
  {
    error('TTS FAIL');
    return
  }
  speechSynthesis.cancel();
  if (document.getElementById('result').hidden) {
      utterance = new SpeechSynthesisUtterance(text);
    } else {
      utterance = new SpeechSynthesisUtterance(prevFrench);
    };
  utterance.lang = 'fr-FR';
  utterance.rate = speechRate;
  speechSynthesis.speak(utterance);
};

function showStartScreen() {
  document.getElementById('gamemode').hidden = true;
  document.getElementById('game').hidden = true;
  document.getElementById('result').hidden = true;
  document.getElementById('startScreen').hidden = false;
  document.getElementById('abtErrors').hidden = true;
  document.getElementById('bugs').hidden = true;

  showScoreBool(false);
  checkSeasonal();
}

function showScoreBool(bool) {
  if (bool) {
    document.querySelector('.score').hidden = true;
    document.querySelector('.reset-score').hidden = true;
    document.querySelector('.reset-score2').hidden = true;
    document.querySelector('.filler').hidden = true;
  } else {
    document.querySelector('.score').hidden = false;
    document.querySelector('.reset-score').hidden = false;
    document.querySelector('.reset-score2').hidden = false;
    document.querySelector('.filler').hidden = false;
  };
}

function resetAllScore() {
  Object.values(modeScores).forEach(s => {
    s.wins = 0;
    s.losses = 0;
    s.hints = 0;
  });
  updateScore();
}

function showGameComponents(mode) {
  document.querySelector('.score').hidden = false;
  document.querySelector('.reset-score').hidden = false;
  document.querySelector('.reset-score2').hidden = false;
  document.querySelector('.filler').hidden = false;
  if (!phrasesByMode[mode]) mode = 'all';
  document.getElementById("gamemode").hidden = true;
  document.getElementById("custom").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("game").hidden = false;
  document.getElementById('userInput').value = '';
  checkSeasonal(mode);
  focus();
}

function checkSeasonal(mode) {
  const activeMode = mode || currentMode;

  const isGameVisible = !document.getElementById("game").hidden;
  const isResultVisible = !document.getElementById("result").hidden;

  const shouldShowOverlay = activeMode === 'seasonal' && (isGameVisible || isResultVisible);
  const shouldShowOverlay2 = activeMode === 'seasonal2' && (isGameVisible || isResultVisible);
  const shouldShowOverlay3 = activeMode === 'seasonal3' && (isGameVisible || isResultVisible);

  document.querySelector('.seasonalOverlay').hidden  = !shouldShowOverlay;
  document.querySelector('.seasonal2Overlay').hidden = !shouldShowOverlay2;
  document.querySelector('.seasonal3Overlay').hidden = !shouldShowOverlay3;

  document.body.classList.remove('halloween');
  document.body.classList.remove('seasonal');
  document.body.classList.remove('seasonal2');
  document.body.classList.remove('seasonal3');
  if (shouldShowOverlay) {
    document.body.classList.add('seasonal');
    document.body.classList.remove('seasonal2');
    stopBgm2();
    document.getElementById('mute').hidden = false;

    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => {
      const isResetButton = b.classList.contains('reset-score-button') || b.closest('.reset-score') || b.closest('.reset-score2');
      const isGamemodeMenuButton = b.closest('#gamemode');
      const isBugReportButton = b.textContent.includes('Report a Bug');
      
      if (!isResetButton && !isGamemodeMenuButton && !isBugReportButton) {
        b.classList.add('seasonal');
      } else {
        b.classList.remove('seasonal');
      }
    });

    if (!muted && bgm.paused) {
      startBgm();
    }
    } else if (shouldShowOverlay2) {
    document.body.classList.add('seasonal2');
    stopBgm();
    document.getElementById('mute').hidden = false;

    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => {
      const isResetButton = b.classList.contains('reset-score-button') || b.closest('.reset-score') || b.closest('.reset-score2');
      const isGamemodeMenuButton = b.closest('#gamemode');
      const isBugReportButton = b.textContent.includes('Report a Bug');
      
      if (!isResetButton && !isGamemodeMenuButton && !isBugReportButton) {
        b.classList.add('seasonal');
      } else {
        b.classList.remove('seasonal');
      }
    });

    if (!muted && bgm2.paused) {
      startBgm2();
    }
  } else if (shouldShowOverlay3) {
    document.body.classList.add('seasonal3');
    document.getElementById('mute').hidden = false;

    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => {
      const isResetButton = b.classList.contains('reset-score-button') || b.closest('.reset-score') || b.closest('.reset-score2');
      const isGamemodeMenuButton = b.closest('#gamemode');
      const isBugReportButton = b.textContent.includes('Report a Bug');
      
      if (!isResetButton && !isGamemodeMenuButton && !isBugReportButton) {
        b.classList.add('seasonal');
      } else {
        b.classList.remove('seasonal');
      }
    });

    if (!muted && bgm3.paused) {
      startBgm3();
    }
  } else {
    document.getElementById('mute').hidden = true;
    stopBgm();
    stopBgm2();
    stopBgm3();
  }
}

let muted = false;

function toggleMute() {
  const baseMode = currentMode.replace("listen", "");
    if (!muted) {
      if (baseMode === 'seasonal') {
        stopBgm();
      } else if (baseMode === 'seasonal2') {
        stopBgm2();
      } else {
        stopBgm3();
      }
      document.getElementById('mute').textContent = '🔇';
      muted = true;
    } else {
      if (baseMode === 'seasonal') {
        startBgm();
      } else if (baseMode === 'seasonal2') {
        startBgm2();
      } else {
        startBgm3();
      }
      document.getElementById('mute').textContent = '🔊';
      muted = false;
    }
}

function error(mes) {
  document.getElementById('error').hidden = false;
  document.getElementById('error').textContent = mes;
  console.error(mes);
  setTimeout(() => {
    if (document.getElementById('error').textContent === mes) {
  document.getElementById('error').hidden = true;
    }
  }, 3000);
}

let internalHash = null;
function setHashQuietly(name) {
  if (location.hash === '#' + name) return;
  internalHash = name;
  location.hash = name;
}

async function startGame(mode = currentMode) {
  const LOADING_BTNS = '.btn, #gamemode button';
  const dimmed = [...document.querySelectorAll(LOADING_BTNS)].filter(el => el.classList.contains('btn-loaded'));
  const restoreButtons = () => dimmed.forEach(el => el.classList.add('btn-loaded'));
  dimmed.forEach(el => el.classList.remove('btn-loaded'));

  const backToGamemodes = text => {
    restoreButtons();
    error(text);
    gamemode();
  };
  const slider = document.getElementById('speechRate');

  slider.value = speechRate * 10;

  document.getElementById('displayRate').textContent = speechRate + 'x';

  slider.addEventListener('input', () => {
    speechRate = Number(slider.value) / 10;
    document.getElementById('displayRate').textContent = speechRate + 'x';
    localStorage.setItem('speechRate', JSON.stringify(speechRate));
  });

    let allowed = true;
  if (mode === 'seasonal' || mode === 'seasonal2' || mode === 'seasonal3') {
    await getServerTime();
    if (!serverCalendar) {
      restoreButtons();
      error('Unable to fetch date');
      gamemode();
      return
    }
    const year = Number(serverCalendar[0]);
    const month = Number(serverCalendar[1]);
    const clock = getServerClock();

    if (mode === 'seasonal' || mode === 'seasonal2' || mode === 'seasonal3') {
      allowed = (year < 2027 && month === 11);
    }/* else if (mode === 'seasonal2') {
      allowed = (year < 2027 && month === 11);
    } else if (mode === 'seasonal3') {
      allowed = (year < 2027 && (month === 11 || month === 10));
    }*/
  }
  
  if (!allowed) {
    restoreButtons();
    error('This mode is unavailable');
    gamemode();
    return
  }

  setHashQuietly('game');
  currentMode = mode;
  syncScore();
  if (mode === 'blitz') score.losses = 0;
  updateScore();
  document.querySelector('.seasonalOverlay').hidden = true;
  document.querySelector('.seasonal2Overlay').hidden = true;
  document.querySelector('.seasonal3Overlay').hidden = true;
  
  document.getElementById('timer-display').hidden = true;
  document.getElementById('hint').textContent = null;
  if (mode === 'seasonal') {
    document.querySelector('.seasonalOverlay').hidden = false;
  } else if (mode === 'seasonal2') {
    document.querySelector('.seasonal2Overlay').hidden = false;
  } else if (mode === 'seasonal3') {
    try { document.querySelector('.seasonal3Overlay').hidden = false; }
    catch {}
  } else if (mode === 'blitz') {
    document.getElementById('timer-display').textContent = 'Loading...';
    document.getElementById('timer-display').hidden = false;
    document.querySelector('.reroll').hidden = true;
    document.getElementById('hint-btn').hidden = true;
    blitzStartTime = performance.now();
    startBlitzCountdown();
    soundJeopardy.play();
  } else {
    document.getElementById('hint-btn').hidden = false;
    document.body.classList.remove('seasonal');
    document.querySelector('.reroll').hidden = false;
  }

  showGameComponents(mode);
  phrases = phrasesByMode[mode];
  localStorage.setItem('frenchGamemode', JSON.stringify(mode));

  const saved = savedPhrases[mode];
  if (saved) {
    current = saved;
    msg.textContent = current.french;
  } else {
    pickPhrase();
  }
  restoreButtons();
}

function removeFromList() {
  customPhrases.forEach(() => {
  try {document.querySelector('li').remove();}
  catch {return};
  });
  try {document.querySelector('li').remove();}
  catch {};
}

function custom() {
  document.getElementById("game").hidden = true;
  document.getElementById("gamemode").hidden = true;
  document.getElementById("result").hidden = true;
  document.getElementById("custom").hidden = false;
  const listContainer = document.getElementById('items');

  removeFromList();

  customPhrases.forEach((item, index) => {
    const listItem = document.createElement('li');
    listItem.style.display = 'flex';
    listItem.style.gap = '20px';
    listItem.style.marginBottom = '20px';

    const itemText = document.createElement('span');
    try {itemText.textContent = `${item.french} = ${item.answers}`;}
    catch {error('No Phrases');};

    const actionButton = document.createElement('button');
    actionButton.textContent = 'Remove';
    actionButton.classList.add('r-btn-loaded');
    actionButton.classList.add('reset-score-gamemode');
    actionButton.classList.add('r-btn');

    actionButton.addEventListener('click', () => {
      deletePhrase(index);
      custom();
      return
    });

    listItem.appendChild(itemText);
    listItem.appendChild(actionButton);
    listContainer.appendChild(listItem);
  });
};

function endGameBlitz(resultMsg) {
  if (blitzInterval) clearInterval(blitzInterval);
  const userInput = document.getElementById('userInput').value;
  document.getElementById("result").hidden = false;
  document.getElementById("goAgain").hidden = false;
  document.getElementById("game").hidden = true;

  prevFrench = current.french;
  
  const answerElement = document.querySelector(".correct-answer");
  answerElement.textContent = "PHRASE: " + current.french + "\n" +
  "YOUR ANSWER: " + userInput + "\n" +
  "ANSWER: " + current.answers.join(" / ");

  const finalStreak = score.losses;
  if (finalStreak > score.wins) score.wins = finalStreak;

  resultMsg.textContent = `Time's Up! Streak: ${finalStreak} | Best Streak: ${score.wins}`;

  score.losses = 0;
  updateScore();
}

function checkAnswer() {
  if (blitzInterval && currentMode !== 'blitz') clearInterval(blitzInterval);

  const userInput = document.getElementById("userInput").value;
  const isCorrect = current.answers.some(a => normalize(a) === normalize(userInput));
  const result = document.querySelector(".result-message");
  const baseMode = currentMode.replace("Listen", "");
  
  if (baseMode === 'blitz') {
    if (!userInput.trim()) {
      soundRoll.play();
      pickPhrase();
      document.getElementById('userInput').value = '';
      return
    } 
    if (isCorrect) {
      score.losses++;
      soundWin.play();
      document.getElementById('userInput').value = '';
      pickPhrase();
      updateScore();
    } else {
      endGameBlitz(result);
      try {soundJeopardy.pause(); soundJeopardy.currentTime = 0;} catch {error('Unable to stop sound')}
    }
  } else {
    if (!userInput.trim()) {
      invalidErr('INVALID ENTRY'); return
    }
    delete savedPhrases[currentMode];
    storeSavedPhrases();

    document.getElementById("result").hidden = false;
    try {document.getElementById('defineLink').href = current.definition;} catch {document.getElementById('defineBtn').classList.remove('btn-loaded'); error('Failed to set define button');}
    document.getElementById("goAgain").hidden = false;
    document.getElementById("game").hidden = true;

    checkSeasonal();

    let gif = (baseMode === 'seasonal') 
      ? document.querySelector(isCorrect ? ".sznRightGif" : ".sznWrongGif")
      : document.querySelector(isCorrect ? ".rightGif" : ".wrongGif");

    if (isCorrect) {
      soundWin.play();
      score.wins++;
      result.textContent = "Correct!";
      result.style.color = "limegreen";
    } else {
      soundWrong.play();
      score.losses++;
      result.textContent = "Incorrect.";
      result.style.color = "red";
    }
    
    if (gif) {
      gif.hidden = false;
      gif.classList.remove('hidden');
      setTimeout(() => {
        if (!currentMode.includes('seasonal')) gif.hidden = true; 
        else gif.classList.add('hidden');
        document.getElementById("goAgain").hidden = false;
      }, 1500);
    } else {
      document.getElementById("goAgain").hidden = false;
    }
    
    updateScore();
    showAnswers();
    prevFrench = current.french;
  }
}

function showAnswers() {
  const userInput = document.getElementById("userInput").value;
    document.querySelector(".correct-answer").textContent =
    `PHRASE: ${current.french}\nYOUR ANSWER: ${userInput}\nCORRECT ANSWERS: ${current.answers.join(" / ")}`;
  document.getElementById("userInput").value = '';
  document.getElementById('goAgain').focus();
}

function reroll() {
  soundRoll.play();
  if (currentMode !== 'blitz') {
    document.querySelector(".result-message").textContent = '';
    showAnswers();
    document.getElementById("game").hidden = true;
    document.getElementById("result").hidden = false;
    checkSeasonal();
    prevFrench = current.french;
    score.losses++;
  }
  updateScore();
  pickPhrase();
}

function pickPhrase() {
  let next;
  do {
    next = phrases[Math.floor(Math.random() * phrases.length)];
  } while (next.french === current?.french && phrases.length > 1);
  current = next;
  prevFrench = current.french;
  savedPhrases[currentMode] = current;
  storeSavedPhrases();
  msg.textContent = current.french;
}

function normalize(text) {
  return text.trim().toLowerCase().replace(/[’‘]/g, "'")
}

function gamemode() {
  window.location.hash = 'gamemode';
  try {stopBgm();}
  catch {
    try {stopBgm2();}
    catch {
      console.warn("Failed to stop BGM or BGM is inactive");
    }
  }
  soundJeopardy.pause()
  soundJeopardy.currentTime = 0;
  try {
    clearInterval(blitzInterval);
  } catch {};
  document.getElementById('startScreen').hidden = true;
  document.getElementById('result').hidden = true;
  document.getElementById('custom').hidden = true;
  document.getElementById('gamemode').hidden = false;
  document.getElementById('game').hidden = true;
  document.body.classList.remove('seasonal');
  showScoreBool(true);
  checkSeasonal();
}

function showAbtErrors() {
    document.getElementById('startScreen').hidden = true;
    document.getElementById('abtErrors').hidden = false;
}

function startFade(element, ms) {
  setTimeout(() => {
    if (mouseIn === true) {
    element.classList.add('hidden');
    };
  }, ms);
}

let speechRate = load('speechRate', 0.9);
let blitzStartTime = 0;

function startBlitzCountdown() {
  if (blitzInterval) clearInterval(blitzInterval);
  
  document.getElementById('hint-btn').hidden = true;
  const timerElement = document.getElementById("timer-display");
  if (!timerElement) return

  blitzInterval = setInterval(() => {
    if (currentMode === 'blitz') {
      const elapsedTime = (performance.now() - blitzStartTime) / 1000;
      const timeLeft = Math.max(0, Math.ceil(INITIAL_TIMER_SECONDS - elapsedTime));
      
      timerElement.innerHTML = `Time Left: <b>${timeLeft}s</b>`;
      
      if (timeLeft <= 0) {
        endGameBlitz(document.querySelector(".result-message"));
      }
    } else {
      clearInterval(blitzInterval);
      timerElement.textContent = '';
    }
  }, 200);
}

function showBugs() {
  document.getElementById('gamemode').hidden = true;
  document.getElementById('game').hidden = true;
  document.getElementById('result').hidden = true;
  document.getElementById('startScreen').hidden = true;
  document.getElementById('abtErrors').hidden = true;
  document.getElementById('bugs').hidden = false;
}

/*function tutorial() {
  let showAgain = load('tutorialBlitz', 'true');
  if ()
  document.getElementById('tutorial').hidden = false;
  document.getElementById('tutorial').hidden = false;
}*/

function hint() {
  if (currentMode === 'blitz') return
  
  const msg = document.getElementById('hint');
  msg.hidden = false;
  if (!current.hint && current && current.french) {
    const matchedPhrase = phrases.find(p => p.french === current.french);
    if (matchedPhrase && matchedPhrase.hint) {
        current.hint = matchedPhrase.hint;
        savedPhrases[currentMode] = current;
        storeSavedPhrases();
    }
  }
  msg.textContent = `💡 Hint: ${current.hint}`;
}

async function copyLink() {
  const btn = document.getElementById('urlCopy');
  const text = 'https://bamslam1.github.io/french';
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy URL', 1500);
  } catch (err) {
    console.error(err);
    error('Copy failed');
  }
}

const SCREENS = ['startScreen', 'gamemode', 'game', 'result', 'custom', 'abtErrors', 'bugs'];

const ROUTES = {
  bugs: showBugs,
  gamemode: gamemode,
  start: showStartScreen,
  errors: showAbtErrors,
  game: startGame
};

function routeFromHash() {
  const name = location.hash.slice(1);
  if (internalHash === name) { internalHash = null; return; }
  if (!ROUTES[name]) {document.getElementById('startScreen').hidden = false; setHashQuietly('start'); return}

  SCREENS.forEach(id => document.getElementById(id).hidden = true);
  ROUTES[name]();
  
}

routeFromHash();
window.addEventListener('hashchange', routeFromHash);

document.querySelectorAll('.btn, .theme-btn').forEach(element => {
  element.classList.add('btn-loaded');
});
document.querySelectorAll('.r-btn').forEach(element => {
  element.classList.add('r-btn-loaded');
});


document.addEventListener('click', function(e) {
  const unloadedBtn = e.target.closest('.btn:not(.btn-loaded)');
  
  if (unloadedBtn) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}, true);

document.getElementById('error').hidden = true;
