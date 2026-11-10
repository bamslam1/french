const msg = document.querySelector(".phrase");

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

let serverCalendar = null;

async function getServerTime() {
  const l = document.getElementById('error')
  l.hidden = false;
  l.textContent = 'Loading...'
  try {
    const response = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=America/Whitehorse');
    
    if (!response.ok) throw new Error("API request failed");
    
    const data = await response.json();

    const year = data.year;
    const month = String(data.month).padStart(2, '0');
    const day = String(data.day).padStart(2, '0');
    
    const hours = String(data.hour).padStart(2, '0');
    const minutes = String(data.minute).padStart(2, '0');

    serverCalendar = [year, month, day, hours, minutes];
  } catch (err) {
    serverCalendar = null;
    error("Could not fetch remote server time.");
  }
  l.hidden = true;
}

let prevFrench = null;

let pressedStartCount = load('frenchStartPressed', 0);
let score = load('frenchScore', null) || {
  wins: 0,
  losses: 0,
  hints: 0
};

let prevMode = null;

let customPhrases = load('customPhrases', []).map(p => ({
  french: p.french,
  answers: Array.isArray(p.answers) ? p.answers : [String(p.answers)],
  hint: p.hint || "Custom user phrase"
}));

const allPhrases = [
  { french: "Bonjour", answers: ["hello", "hi", "good morning", "good day"], hint: "Etymology relates to wishing a good day" },
  { french: "Merci", answers: ["thank you", "thanks"], hint: "Derived from Latin for reward or grace" },
  { french: "Au revoir", answers: ["goodbye", "bye"], hint: "Literally translates to until seeing again" },
  { french: "S\'il vous plaît", answers: ["please"], hint: "Literally means if it pleases you" },
  { french: "Comment ça va?", answers: ["how are you?", "how are you"], hint: "Colloquial query involving how it goes" },
  { french: "Je ne comprends pas", answers: ["i don't understand", "i do not understand"], hint: "Cognate sharing roots with comprehend" },
  { french: "Je suis désolé", answers: ["i am sorry", "i'm sorry", "sorry"], hint: "Past participle meaning separated from comfort" },
  { french: "Je t'aime", answers: ["i love you"], hint: "Direct object pronoun placement preceding the verb" },
  { french: "Excusez-moi", answers: ["excuse me"], hint: "Imperative plural or formal apology form" },
  { french: "Je m'appelle Tom", answers: ["my name is tom"], hint: "Reflexive verb literally meaning I call myself" },
  { french: "Salut", answers: ["hi", "hey", "hello"], hint: "Shared linguistic root with the Italian greeting saluto" },
  { french: "Bonsoir", answers: ["good evening"], hint: "Compound word blending good and evening" },
  { french: "Bonne nuit", answers: ["good night"], hint: "Feminine adjective agreement with night" },
  { french: "Bonne journée", answers: ["have a good day", "have a nice day", "good day"], hint: "Implies duration across the daylight hours" },
  { french: "À bientôt", answers: ["see you soon"], hint: "Prepositional phrase using the adverb for shortly" },
  { french: "À demain", answers: ["see you tomorrow"], hint: "References the calendar day following today" },
  { french: "Bienvenue", answers: ["welcome"], hint: "Compound of well and arrived" },
  { french: "De rien", answers: ["you're welcome", "you are welcome", "it's nothing", "it is nothing"], hint: "Literal response implying from nothing" },
  { french: "Merci beaucoup", answers: ["thank you very much", "thank you so much", "thanks a lot", "thanks so much"], hint: "Intensified using a word derived from high quantity" },
  { french: "Oui", answers: ["yes"], hint: "Derived from Old Frankish affirmative particles" },
  { french: "Non", answers: ["no"], hint: "Etymologically linked to Latin non" },
  { french: "Peut-être", answers: ["maybe", "perhaps"], hint: "Compound verb phrase meaning can be" },
  { french: "D'accord", answers: ["okay", "ok", "alright", "all right", "agreed"], hint: "Prepositional idiom meaning of accord" },
  { french: "Pas de problème", answers: ["no problem", "no worries"], hint: "Uses the noun root derived from ancient Greek for trial or obstacle" },
  { french: "Je ne sais pas", answers: ["i don't know", "i do not know"], hint: "Employs the first-person singular of savoir" },
  { french: "Je comprends", answers: ["i understand"], hint: "Shares a Latin root meaning to seize or hold together" },
  { french: "Parlez-vous anglais?", answers: ["do you speak english?", "do you speak english"], hint: "Inversion structure with the -ez formal second-person marker" },
  { french: "Je ne parle pas français", answers: ["i don't speak french", "i do not speak french"], hint: "Encloses the conjugated verb with standard negative particles" },
  { french: "Où sont les toilettes?", answers: ["where are the toilets?", "where are the toilets", "where are the bathrooms?", "where are the bathrooms", "where is the bathroom?", "where is the bathroom"], hint: "Inverts plural subject and verb following an interrogative adverb" },
  { french: "Combien ça coûte?", answers: ["how much does it cost?", "how much does it cost", "how much is it?", "how much is it", "how much is that?", "how much is that"], hint: "Interrogative phrase built on the noun for quantity or price" },
  { french: "Quelle heure est-il?", answers: ["what time is it?", "what time is it"], hint: "Feminine interrogative adjective matching the word for hour" },
  { french: "Comment tu t'appelles?", answers: ["what's your name?", "what's your name", "what is your name?", "what is your name"], hint: "Informal register using the second-person singular subject pronoun" },
  { french: "Enchanté", answers: ["nice to meet you", "pleased to meet you", "delighted"], hint: "Past participle literally implying placed under a spell or charmed" },
  { french: "Ça va bien", answers: ["i'm doing well", "i am doing well", "i'm fine", "i am fine", "i'm good", "i am good", "it's going well", "it is going well"], hint: "Uses the demonstrative pronoun subject" },
  { french: "Et vous?", answers: ["and you?", "and you"], hint: "Conjunction paired with the polite subject pronoun" },
  { french: "Je voudrais un café", answers: ["i would like a coffee", "i'd like a coffee"], hint: "Conditional tense of vouloir expressing polite desire" },
  { french: "L'addition, s'il vous plaît", answers: ["the bill, please", "the bill please", "the check, please", "the check please"], hint: "Employs elision on the definite article preceding a mathematical noun root" },
  { french: "J'ai faim", answers: ["i'm hungry", "i am hungry"], hint: "Idiomatic construction using the verb to have paired with a noun" },
  { french: "J'ai soif", answers: ["i'm thirsty", "i am thirsty"], hint: "Idiom utilizing the direct object noun for dehydration" },
  { french: "Je suis fatigué", answers: ["i'm tired", "i am tired"], hint: "Uses the auxiliary verb être with an adjectival participle" },
  { french: "Je suis perdu", answers: ["i'm lost", "i am lost"], hint: "Masculine agreement of the participle meaning strayed" },
  { french: "Aidez-moi", answers: ["help me", "help me!"], hint: "Imperative verb form suffixed with a tonic pronoun" },
  { french: "Bon appétit", answers: ["enjoy your meal", "enjoy your food", "enjoy", "have a good meal"], hint: "Compound phrase referencing good appetite" },
  { french: "Félicitations", answers: ["congratulations", "congrats"], hint: "Plural noun derived from Latin roots for happiness" },
  { french: "Bonne chance", answers: ["good luck"], hint: "Feminine noun linked to fate or probability" },
  { french: "Joyeux anniversaire", answers: ["happy birthday"], hint: "Combines an adjective of joy with an annual milestone" },
  { french: "Bonne année", answers: ["happy new year"], hint: "Refers to the Earth's complete orbital cycle" },
  { french: "Santé", answers: ["cheers", "to your health"], hint: "Noun sharing its etymology with sanitary" },
  { french: "Pardon", answers: ["pardon", "sorry", "excuse me", "pardon me"], hint: "Interjection derived from ecclesiastical forgiveness" },
  { french: "Comment allez-vous?", answers: ["how are you?", "how are you", "how do you do?", "how do you do"], hint: "Formal inversion using the verb to go" },
  { french: "Je vais bien", answers: ["i'm well", "i am well", "i'm fine", "i am fine", "i'm good", "i am good", "i'm doing well", "i am doing well"], hint: "First-person present of aller combined with an adverb" },
  { french: "Très bien", answers: ["very good", "very well", "great"], hint: "Intensifying adverb preceding an adjective of quality" },
  { french: "Pas mal", answers: ["not bad"], hint: "Litotes construction using negation and an adjective" },
  { french: "Comme ci, comme ça", answers: ["so-so", "so so", "okay", "ok"], hint: "Reduplicative adverbial phrase utilizing demonstratives" },
  { french: "Quoi de neuf?", answers: ["what's new?", "what's new", "what is new?", "what is new", "what's up?", "what's up"], hint: "Idiomatic query using a partitive construction" },
  { french: "Bien sûr", answers: ["of course", "sure", "certainly"], hint: "Literal meaning involves safety or certainty" },
  { french: "Exactement", answers: ["exactly"], hint: "Adverb formed from a Latin root meaning precise" },
  { french: "Pas du tout", answers: ["not at all"], hint: "Negative idiom referencing the whole or totality" },
  { french: "Tant pis", answers: ["too bad", "oh well", "never mind"], hint: "Idiomatic expression contrasting so much with worse" },
  { french: "C'est vrai", answers: ["it's true", "it is true", "that's true", "that is true", "that's right", "that is right"], hint: "Employs a contracted demonstrative subject with an adjective" },
  { french: "C'est faux", answers: ["it's false", "it is false", "that's false", "that is false", "that's wrong", "that is wrong"], hint: "Adjectival predicate denoting incorrectness" },
  { french: "Je suis d'accord", answers: ["i agree", "i'm in agreement", "i am in agreement"], hint: "Uses a prepositional phrase denoting harmony" },
  { french: "Je ne suis pas d'accord", answers: ["i disagree", "i don't agree", "i do not agree"], hint: "Inverted polarity of the agreement idiom" },
  { french: "Je ne suis pas sûr", answers: ["i'm not sure", "i am not sure"], hint: "Adjectival expression indicating lack of certainty" },
  { french: "Je suis en retard", answers: ["i'm late", "i am late"], hint: "Prepositional phrase using the noun for delay" },
  { french: "Je suis content", answers: ["i'm happy", "i am happy", "i'm glad", "i am glad", "i'm pleased", "i am pleased"], hint: "Adjective denoting satisfaction or contentment" },
  { french: "Je suis malade", answers: ["i'm sick", "i am sick", "i'm ill", "i am ill"], hint: "Adjective sharing roots with malaise" },
  { french: "J'ai besoin d'aide", answers: ["i need help"], hint: "Utilizes the idiomatic noun phrase for necessity" },
  { french: "J'ai besoin d'un médecin", answers: ["i need a doctor"], hint: "References a medical practitioner via noun elision" },
  { french: "J'habite à Paris", answers: ["i live in paris"], hint: "Conjugated regular -er verb taking a locative preposition" },
  { french: "Où habitez-vous?", answers: ["where do you live?", "where do you live"], hint: "Formal second-person plural residence query" },
  { french: "Quel âge as-tu?", answers: ["how old are you?", "how old are you"], hint: "Literal translation involves asking what age you have" },
  { french: "Qu'est-ce que c'est?", answers: ["what is this?", "what is this", "what is it?", "what is it", "what's this?", "what's this", "what is that?", "what is that", "what's that?", "what's that"], hint: "Complex interrogative cleft sentence structure" },
  { french: "Pourquoi?", answers: ["why", "why?"], hint: "Interrogative adverb literally built from for and what" },
  { french: "Quand?", answers: ["when", "when?"], hint: "Temporal interrogative adverb of Latin origin" },
  { french: "Où?", answers: ["where", "where?"], hint: "Locative adverb carrying an accent diacritic" },
  { french: "Qui?", answers: ["who", "who?"], hint: "Interrogative pronoun targeting animate subjects" },
  { french: "Répétez, s'il vous plaît", answers: ["please repeat", "please repeat that", "repeat, please", "repeat please", "repeat that, please", "repeat that please"], hint: "Imperative verb form paired with a polite clause" },
  { french: "Parlez plus lentement, s'il vous plaît", answers: ["please speak more slowly", "speak more slowly, please", "speak more slowly please", "please speak slower", "speak slower, please", "speak slower please"], hint: "Comparative adverb construction modifying speed" },
  { french: "Je voudrais de l'eau", answers: ["i would like water", "i'd like water", "i would like some water", "i'd like some water"], hint: "Partitive article elision preceding a vowel" },
  { french: "Une table pour deux", answers: ["a table for two"], hint: "Numerical quantifier designating party size" },
  { french: "C'est délicieux", answers: ["it's delicious", "it is delicious", "that's delicious", "that is delicious"], hint: "Gastronomic adjective cognate with English" },
  { french: "C'est trop cher", answers: ["too expensive", "it is too expensive", "that's too expensive", "that is too expensive"], hint: "Adverb of excess modifying cost" },
  { french: "Je cherche la gare", answers: ["i'm looking for the train station", "i am looking for the train station", "i'm looking for the station", "i am looking for the station"], hint: "Verb of searching taking a direct object" },
  { french: "Tournez à gauche", answers: ["turn left"], hint: "Directional instruction referencing the sinister side" },
  { french: "Tournez à droite", answers: ["turn right"], hint: "Directional instruction referencing the dexter side" },
  { french: "Tout droit", answers: ["straight ahead", "straight on", "go straight", "straight"], hint: "Combines the quantifier for all with direct path" },
  { french: "C'est loin?", answers: ["is it far?", "is it far", "is that far?", "is that far"], hint: "Interrogative sentence querying spatial distance" },
  { french: "Il fait beau", answers: ["the weather is nice", "the weather is good", "it's nice out", "it is nice out", "it's nice weather", "it is nice weather"], hint: "Impersonal weather idiom using faire" },
  { french: "Il pleut", answers: ["it's raining", "it is raining"], hint: "Impersonal third-person singular precipitation verb" },
  { french: "Il fait froid", answers: ["it's cold", "it is cold"], hint: "Thermal meteorological idiom" },
  { french: "Il fait chaud", answers: ["it's hot", "it is hot", "it's warm", "it is warm"], hint: "Thermal idiom using the adjective for heat" },
  { french: "Quel temps fait-il?", answers: ["what's the weather like?", "what's the weather like", "what is the weather like?", "what is the weather like", "how's the weather?", "how's the weather", "how is the weather?", "how is the weather"], hint: "Interrogative sentence targeting atmospheric conditions" },
  { french: "À tout à l'heure", answers: ["see you later", "see you in a bit", "see you shortly"], hint: "Idiomatic temporal farewell referencing the hour" },
  { french: "À plus tard", answers: ["see you later", "until later"], hint: "Comparative adverb indicating future time" },
  { french: "Bonne soirée", answers: ["have a good evening", "have a nice evening", "enjoy your evening"], hint: "Feminine noun marking the evening period" },
  { french: "Bon week-end", answers: ["have a good weekend", "have a nice weekend", "enjoy your weekend"], hint: "Anglicism adopted into standard French usage" },
  { french: "Bon voyage", answers: ["have a good trip", "have a nice trip", "safe travels", "bon voyage"], hint: "Wishes a successful transit or journey" },
  { french: "Je vous en prie", answers: ["you're welcome", "you are welcome", "go ahead", "after you"], hint: "Formal idiom containing a pronominal object particle" },
  { french: "Aujourd'hui", answers: ["today"], hint: "Compound word literally meaning on the day of today" },
  { french: "Demain", answers: ["tomorrow"], hint: "Temporal adverb derived from Latin mane for morning" },
  { french: "Hier", answers: ["yesterday"], hint: "Temporal adverb for the preceding day" },
  { french: "Maintenant", answers: ["now"], hint: "Compound adverb indicating the present moment" }
];

const easyPhrases = [
  { french: "Bonjour", answers: ["hello", "hi", "good morning", "good day"], hint: "Core daylight greeting" },
  { french: "Salut", answers: ["hi", "hey", "hello"], hint: "Familiar greeting variant" },
  { french: "Bonsoir", answers: ["good evening"], hint: "Evening time greeting" },
  { french: "Au revoir", answers: ["goodbye", "bye"], hint: "Standard parting phrase" },
  { french: "Merci", answers: ["thank you", "thanks"], hint: "Basic expression of thanks" },
  { french: "S\'il vous plaît", answers: ["please"], hint: "Polite conditional formula" },
  { french: "Oui", answers: ["yes"], hint: "Primary affirmative particle" },
  { french: "Non", answers: ["no"], hint: "Primary negative particle" },
  { french: "Pardon", answers: ["sorry", "pardon", "excuse me"], hint: "Request for pardon" },
  { french: "Un", answers: ["one", "1"], hint: "Indefinite article and lowest cardinal" },
  { french: "Deux", answers: ["two", "2"], hint: "First even cardinal number" },
  { french: "Trois", answers: ["three", "3"], hint: "Cardinal following two" },
  { french: "Quatre", answers: ["four", "4"], hint: "Cardinal sharing roots with quad" },
  { french: "Cinq", answers: ["five", "5"], hint: "Cardinal equivalent to a hand's digits" },
  { french: "Six", answers: ["six", "6"], hint: "Cardinal ending with a silent x" },
  { french: "Sept", answers: ["seven", "7"], hint: "Cardinal with a silent p" },
  { french: "Huit", answers: ["eight", "8"], hint: "Cardinal beginning with a silent h" },
  { french: "Neuf", answers: ["nine", "9"], hint: "Cardinal homophonous with the word for new" },
  { french: "Dix", answers: ["ten", "10"], hint: "Cardinal ending with a silent x" },
  { french: "Rouge", answers: ["red"], hint: "Primary chromatic color" },
  { french: "Bleu", answers: ["blue"], hint: "Chromatic color of the sky" },
  { french: "Vert", answers: ["green"], hint: "Chromatic color of foliage" },
  { french: "Jaune", answers: ["yellow"], hint: "Chromatic color of lemons" },
  { french: "Noir", answers: ["black"], hint: "Achromatic color absorbing all light" },
  { french: "Blanc", answers: ["white"], hint: "Achromatic color reflecting all light" },
  { french: "L'eau", answers: ["water", "the water"], hint: "Essential chemical compound H2O" },
  { french: "Le pain", answers: ["bread", "the bread"], hint: "Staple baked carbohydrate" },
  { french: "Le lait", answers: ["milk", "the milk"], hint: "Secretion from mammary glands" },
  { french: "Le café", answers: ["coffee", "the coffee"], hint: "Brewed stimulant beverage" },
  { french: "La pomme", answers: ["apple", "the apple", "an apple"], hint: "Pome fruit associated with gravity" },
  { french: "Le chat", answers: ["cat", "the cat", "a cat"], hint: "Domesticated feline mammal" },
  { french: "Le chien", answers: ["dog", "the dog", "a dog"], hint: "Domesticated canine mammal" },
  { french: "La maison", answers: ["house", "the house", "a house", "home"], hint: "Residential dwelling structure" },
  { french: "L'école", answers: ["school", "the school"], hint: "Educational institution" },
  { french: "Le livre", answers: ["book", "the book", "a book"], hint: "Bound pages of text" },
  { french: "L'ami", answers: ["friend", "the friend", "a friend"], hint: "Platonic companion" },
  { french: "La famille", answers: ["family", "the family"], hint: "Kinship group" }
];

const mediumPhrases = [
  { french: "Je suis étudiant", answers: ["i am a student", "i'm a student"], hint: "Occupational status of learning" },
  { french: "Je suis canadien", answers: ["i am canadian", "i'm canadian"], hint: "National identity associated with the maple leaf" },
  { french: "Je viens du Canada", answers: ["i come from canada", "i am from canada", "i'm from canada"], hint: "Uses the verb venir indicating provenance" },
  { french: "Je parle anglais", answers: ["i speak english"], hint: "Targeting a Germanic language of communication" },
  { french: "J'habite ici", answers: ["i live here"], hint: "Combines residence verb with local adverb" },
  { french: "Je travaille ici", answers: ["i work here"], hint: "Labor action localized by adverb" },
  { french: "Je suis en vacances", answers: ["i am on vacation", "i'm on vacation", "i am on holiday", "i'm on holiday"], hint: "Plural noun denoting leisure travel" },
  { french: "J'aime le chocolat", answers: ["i like chocolate", "i love chocolate"], hint: "Culinary fondness for cacao derivatives" },
  { french: "J'aime lire", answers: ["i like to read", "i like reading", "i love to read", "i love reading"], hint: "Literary pastime infinitive" },
  { french: "Je veux manger", answers: ["i want to eat"], hint: "Modal desire paired with ingestion" },
  { french: "Je veux dormir", answers: ["i want to sleep"], hint: "Modal desire paired with rest" },
  { french: "J'ai un chien", answers: ["i have a dog"], hint: "Possession structure involving a canine" },
  { french: "J'ai deux frères", answers: ["i have two brothers"], hint: "Male sibling quantifier structure" },
  { french: "J'ai mal à la tête", answers: ["i have a headache", "my head hurts", "my head aches"], hint: "Idiom expressing cephalic pain" },
  { french: "Elle est ma sœur", answers: ["she is my sister", "she's my sister"], hint: "Female sibling identification" },
  { french: "Il est mon ami", answers: ["he is my friend", "he's my friend"], hint: "Male companion identification" },
  { french: "Nous sommes amis", answers: ["we are friends", "we're friends"], hint: "First-person plural associative state" },
  { french: "Ils sont contents", answers: ["they are happy", "they're happy", "they are glad", "they're glad"], hint: "Third-person plural emotional status" },
  { french: "C'est ma maison", answers: ["it's my house", "it is my house", "this is my house", "that's my house", "that is my house"], hint: "Demonstrative ownership assertion" },
  { french: "Il est tard", answers: ["it's late", "it is late"], hint: "Temporal evaluation of the hour" },
  { french: "Il est tôt", answers: ["it's early", "it is early"], hint: "Early temporal evaluation" },
  { french: "Il y a un problème", answers: ["there is a problem", "there's a problem"], hint: "Existential locative phrase" },
  { french: "Qu'est-ce que tu fais?", answers: ["what are you doing?", "what are you doing"], hint: "Familiar interrogative action query" },
  { french: "Où est la gare?", answers: ["where is the train station?", "where is the train station", "where's the train station?", "where's the train station", "where is the station?", "where is the station", "where's the station?", "where's the station"], hint: "Locating the railway depot" },
  { french: "Où est l'hôtel?", answers: ["where is the hotel?", "where is the hotel", "where's the hotel?", "where's the hotel"], hint: "Locating transient accommodation" },
  { french: "Le train part à huit heures", answers: ["the train leaves at eight", "the train leaves at 8", "the train leaves at eight o'clock", "the train leaves at 8 o'clock", "the train departs at eight"], hint: "Scheduled locomotive departure" },
  { french: "Lundi", answers: ["monday"], hint: "First weekday following Sunday" },
  { french: "Mardi", answers: ["tuesday"], hint: "Weekday named after Mars" },
  { french: "Mercredi", answers: ["wednesday"], hint: "Weekday named after Mercury" },
  { french: "Jeudi", answers: ["thursday"], hint: "Weekday named after Jupiter" },
  { french: "Vendredi", answers: ["friday"], hint: "Weekday named after Venus" },
  { french: "Samedi", answers: ["saturday"], hint: "Weekend day derived from Sabbath" },
  { french: "Dimanche", answers: ["sunday"], hint: "Day of the Lord" },
  { french: "Le petit déjeuner", answers: ["breakfast", "the breakfast"], hint: "Literal translation of little lunch" },
  { french: "Le déjeuner", answers: ["lunch", "the lunch"], hint: "Midday meal designation" },
  { french: "Le dîner", answers: ["dinner", "the dinner", "supper"], hint: "Evening meal designation" },
  { french: "Une bouteille d'eau", answers: ["a bottle of water", "bottle of water"], hint: "Cylindrical liquid vessel" }
];

const hardPhrases = [
  { french: "Je n'en peux plus", answers: ["i can't take it anymore", "i cannot take it anymore", "i can't take any more", "i can't do this anymore"], hint: "Uses the partitive pronoun en with pouvoir" },
  { french: "Il pleut des cordes", answers: ["it's raining cats and dogs", "it is raining cats and dogs", "it's pouring", "it is pouring"], hint: "Zoological and rope-based idiom equivalent" },
  { french: "Je n'ai rien à me mettre", answers: ["i have nothing to wear", "i've got nothing to wear", "i have nothing to put on"], hint: "Reflexive verb putting on clothing" },
  { french: "Ça ne me dit rien", answers: ["it doesn't ring a bell", "it does not ring a bell", "i don't feel like it", "it doesn't appeal to me"], hint: "Direct object idiom involving speech to me" },
  { french: "Je me suis trompé de chemin", answers: ["i took the wrong road", "i took the wrong way", "i went the wrong way", "i got the wrong road"], hint: "Reflexive error verb with pathway noun" },
  { french: "Il faut que je parte avant la fin", answers: ["i have to leave before the end", "i must leave before the end", "i need to leave before the end"], hint: "Subjunctive requirement triggered by falloir" },
  { french: "Je voudrais que tu viennes avec nous", answers: ["i would like you to come with us", "i'd like you to come with us", "i want you to come with us"], hint: "Subjunctive verb form of venir" },
  { french: "Quoi que tu fasses, je serai là", answers: ["whatever you do, i will be there", "whatever you do, i'll be there", "no matter what you do, i'll be there", "no matter what you do, i will be there"], hint: "Subjunctive concession clause" },
  { french: "Si j'avais su, je ne serais pas venu", answers: ["if i had known, i would not have come", "if i had known, i wouldn't have come", "if i'd known, i wouldn't have come"], hint: "Past conditional counterfactual structure" },
  { french: "Elle a fini par comprendre", answers: ["she ended up understanding", "she finally understood", "she eventually understood", "she ended up understanding it"], hint: "Idiomatic past action utilizing finir par" },
  { french: "Je m'en fiche", answers: ["i don't care", "i do not care", "i couldn't care less", "i could not care less"], hint: "Colloquial reflexive dismissive verb" },
  { french: "C'est à peine croyable", answers: ["it's hardly believable", "it is hardly believable", "it's barely believable", "it is barely believable", "it's hard to believe"], hint: "Adverbial modifier of scarcity with believable" },
  { french: "Je n'ai pas du tout envie d'y aller", answers: ["i don't feel like going there at all", "i do not feel like going at all", "i don't want to go at all", "i have no desire to go there at all"], hint: "Locative pronoun y combined with desire" },
  { french: "Tu aurais dû me le dire", answers: ["you should have told me", "you should have told me that", "you ought to have told me"], hint: "Double object pronoun order preceding past infinitive" },
  { french: "Il a eu beau essayer, il n'a pas réussi", answers: ["no matter how hard he tried, he did not succeed", "no matter how hard he tried, he didn't succeed", "he tried in vain, he did not succeed", "despite his efforts, he didn't succeed"], hint: "Idiomatic use of avoir beau for futility" },
  { french: "Je ne sais pas de quoi tu parles", answers: ["i don't know what you're talking about", "i do not know what you are talking about", "i don't know what you are talking about"], hint: "Prepositional relative pronoun construction" },
  { french: "Ils se sont rendu compte de leur erreur", answers: ["they realized their mistake", "they realised their mistake", "they realized their error", "they realised their error"], hint: "Reflexive causative realization idiom" },
  { french: "C'est le moins que je puisse faire", answers: ["it's the least i can do", "it is the least i can do", "that's the least i can do", "that is the least i can do"], hint: "Subjunctive modal verb usage following superlative" },
  { french: "On ne peut pas tout avoir", answers: ["you can't have everything", "you cannot have everything", "we can't have everything", "one can't have everything"], hint: "Indefinite pronoun subject on" },
  { french: "Il vaut mieux tard que jamais", answers: ["better late than never", "it is better late than never", "it's better late than never"], hint: "Comparative proverb structure" },
  { french: "Je suis à bout de forces", answers: ["i'm exhausted", "i am exhausted", "i have no strength left", "i'm out of strength", "i am out of strength"], hint: "Idiomatic limit expression using bout" },
  { french: "Elle fait comme si de rien n'était", answers: ["she acts as if nothing happened", "she's acting as if nothing happened", "she is acting as if nothing happened", "she acts like nothing happened", "she's acting like nothing happened"], hint: "Hypothetical comparison clause using imparfait" },
  { french: "J'ai failli rater mon train", answers: ["i almost missed my train", "i nearly missed my train", "i just about missed my train"], hint: "Auxiliary construction indicating narrow escape" },
  { french: "Je ne m'attendais pas à ça", answers: ["i wasn't expecting that", "i was not expecting that", "i didn't expect that", "i did not expect that", "i wasn't expecting this", "i was not expecting this"], hint: "Reflexive verb taking a prepositional object" },
  { french: "Peu importe ce qu'il dit", answers: ["it doesn't matter what he says", "it does not matter what he says", "no matter what he says", "whatever he says"], hint: "Inverted impersonal importance expression" },
  { french: "Il s'agit d'une question de temps", answers: ["it's a matter of time", "it is a matter of time", "it's about a question of time", "it is a question of time", "it's a question of time"], hint: "Pronominal impersonal verb s'agir de" },
  { french: "Je me suis levé du pied gauche", answers: ["i got up on the wrong side of the bed", "i woke up on the wrong side of the bed", "i got out of bed on the wrong side"], hint: "Bodily idiom referencing the left foot" },
  { french: "Il ne manquait plus que ça", answers: ["that's all i needed", "that is all i needed", "that's all we needed", "that was all we needed", "that was all that was missing", "just what i needed"], hint: "Imperfect tense expression of final aggravation" },
  { french: "À quoi bon essayer", answers: ["what's the point of trying", "what is the point of trying", "what's the use of trying", "what is the use of trying", "why bother trying"], hint: "Interrogative phrase questioning purpose" },
  { french: "Je tiens à vous remercier", answers: ["i want to thank you", "i would like to thank you", "i'd like to thank you", "i really want to thank you"], hint: "Idiomatic verb tenir à commitment" },
  { french: "Il est de plus en plus difficile de trouver du travail", answers: ["it is more and more difficult to find work", "it's more and more difficult to find work", "it is getting harder and harder to find a job", "it's getting harder and harder to find work", "it's harder and harder to find a job"], hint: "Progressive comparative adverbial construction" },
  { french: "Nous avons dû reporter la réunion", answers: ["we had to postpone the meeting", "we had to put off the meeting", "we had to reschedule the meeting"], hint: "Past necessity modal verb devoir" },
  { french: "Faute de temps, je n'ai pas pu finir", answers: ["for lack of time, i couldn't finish", "for lack of time, i could not finish", "due to lack of time, i couldn't finish", "for lack of time i couldn't finish", "i couldn't finish for lack of time", "i couldn't finish due to a lack of time"], hint: "Prepositional fault phrase indicating deficiency" },
  { french: "Elle est loin d'être bête", answers: ["she's far from stupid", "she is far from stupid", "she's far from being stupid", "she is far from being stupid", "she is anything but stupid"], hint: "Spatial idiom indicating exact opposite" },
  { french: "Tant pis pour lui", answers: ["too bad for him", "that's his loss", "that is his loss", "so much the worse for him", "tough luck for him"], hint: "Dismissive phrase mapping consequence to individual" },
  { french: "Il a tout fait pour que ça marche", answers: ["he did everything to make it work", "he did everything so that it would work", "he did everything he could to make it work", "he did all he could to make it work"], hint: "Purpose clause subjunctive construction" },
  { french: "Je n'arrive pas à me décider", answers: ["i can't make up my mind", "i cannot make up my mind", "i can't decide", "i cannot decide", "i'm unable to decide"], hint: "Idiomatic arrival verb indicating failure" },
  { french: "Rien ne sert de courir, il faut partir à point", answers: ["slow and steady wins the race", "there's no use running, you have to leave on time", "there is no point in running, you have to leave in time", "it's no use running, you have to start on time"], hint: "Classic La Fontaine fable quote structure" },
  { french: "Ce n'est pas la peine d'insister", answers: ["there's no point in insisting", "there is no point in insisting", "it's not worth insisting", "it is not worth insisting", "there's no use insisting", "it's no use insisting"], hint: "Uses the noun peine for trouble" },
  { french: "Mieux vaut prévenir que guérir", answers: ["prevention is better than cure", "an ounce of prevention is worth a pound of cure", "it's better to prevent than to cure", "it is better to prevent than to cure", "better safe than sorry"], hint: "Comparative proverb contrasting caution and remedy" }
];

const seasonalPhrases = [
  { french: "Jour du Souvenir", answers: ["remembrance day", "day of remembrance"], hint: "Commonwealth martial commemoration date" },
  { french: "N'oublions jamais", answers: ["lest we forget", "we will never forget", "never forget"], hint: "First-person plural negative imperative cohort" },
  { french: "Le coquelicot", answers: ["the poppy", "poppy"], hint: "Papaver rhoeas floral emblem" },
  { french: "En mémoire de nos héros", answers: ["in memory of our heroes", "to the memory of our heroes"], hint: "Prepositional dedication phrase" },
  { french: "Leur souvenir demeurera", answers: ["their memory shall endure", "their memory will live on"], hint: "Future tense intransitive verb of persistence" },
  { french: "Paix aux combattants", answers: ["peace to the combatants", "peace to the soldiers"], hint: "Benefactive prepositional dedication" },
  { french: "Aux morts de la guerre", answers: ["to the war dead", "fallen soldiers"], hint: "Plural substantive noun referencing conflict casualties" },
  { french: "Le sacrifice suprême", answers: ["the ultimate sacrifice", "supreme sacrifice"], hint: "Post-positive adjectival superlative phrase" },
  { french: "Honneur aux courageux", answers: ["honour to the brave", "honor to the brave"], hint: "Substantive adjective representing brave class" },
  { french: "Le soldat inconnu", answers: ["the unknown soldier", "unknown soldier"], hint: "Anonymous military internment subject" },
  { french: "Le champ de bataille", answers: ["the battlefield", "battlefield"], hint: "Agricultural root word repurposed for combat" },
  { french: "La tombe du soldat inconnu", answers: ["tomb of the unknown soldier"], hint: "Architectural sepulcher landmark" },
  { french: "Garder le souvenir", answers: ["keep the memory", "keep the memory alive"], hint: "Infinitive preservation idiom" },
  { french: "Le champ d'honneur", answers: ["field of honour", "field of honor"], hint: "Honorific geographic designation" },
  { french: "Service commémoratif", answers: ["memorial service"], hint: "Ritual gathering eliding article" },
  { french: "La minute de silence", answers: ["the minute of silence", "minute of silence"], hint: "Sixty-second temporal quiet duration" },
  { french: "Guerres et conflits", answers: ["wars and conflicts"], hint: "Coordinated plural hostile nouns" },
  { french: "S'en souvenir", answers: ["to remember it", "remembering"], hint: "Pronominal verb retaining partitive en" },
  { french: "La flamme éternelle", answers: ["the eternal flame", "eternal flame"], hint: "Perpetual combustion monument feature" },
  { french: "Une couronne de coquelicots", answers: ["a wreath of poppies", "poppy wreath"], hint: "Circular floral arrangement" },
  { french: "Les anciens combattants", answers: ["the veterans", "veterans"], hint: "Substantive plural adjective for aged fighters" },
  { french: "Au champ d'honneur", answers: ["on the field of honour", "on the field of honor"], hint: "Locative prepositional contraction au" },
  { french: "Le devoir de mémoire", answers: ["duty of remembrance"], hint: "Ethical obligation compound noun" },
  { french: "Le repos éternel", answers: ["eternal rest"], hint: "Euphemism for death post-position" },
  { french: "Leur nom vit à jamais", answers: ["their name lives forever", "their name lives on"], hint: "Adverbial phrase meaning for all time" },
  { french: "Héros de guerre", answers: ["war heroes"], hint: "Compound title lacking article" },
  { french: "Paix et liberté", answers: ["peace and freedom"], hint: "Asyndetic pairing of abstract nouns" },
  { french: "La liberté a un prix", answers: ["freedom has a price"], hint: "Possessive verb valuation assertion" },
  { french: "Défense de la patrie", answers: ["defence of the homeland", "defense of the homeland"], hint: "Legal prohibition style noun phrase" },
  { french: "Les forces armées", answers: ["the armed forces", "armed forces"], hint: "Feminine plural military branch noun" },
  { french: "Le service militaire", answers: ["military service"], hint: "Conscripted institutional duty" },
  { french: "Mort pour la patrie", answers: ["died for the country", "died for one's country"], hint: "Past participle citation formula" },
  { french: "La bravoure au combat", answers: ["bravery in combat", "combat bravery"], hint: "Abstract noun of valor" },
  { french: "Un acte de courage", answers: ["an act of courage"], hint: "Singular countable heroic event" },
  { french: "Le sacrifice de soi", answers: ["self-sacrifice"], hint: "Reflexive tonic pronoun suffix structure" },
  { french: "La médaille du courage", answers: ["medal of bravery"], hint: "Phaleristic award noun" },
  { french: "Porter le coquelicot", answers: ["wearing the poppy", "to wear the poppy"], hint: "Remembrance Day tradition" },
  { french: "Le monument aux morts", answers: ["the war memorial", "war memorial", "cenotaph"], hint: "Architectural public sculpture" },
  { french: "La fin de la guerre", answers: ["the end of the war"], hint: "Termination point noun phrase" },
  { french: "L'armistice de 1918", answers: ["the 1918 armistice", "armistice of 1918"], hint: "Historical numerical year marker" },
  { french: "Le onzième jour du onzième mois", answers: ["the eleventh day of the eleventh month"], hint: "Ordinal number repetitive sequence" },
  { french: "Onze heures du matin", answers: ["eleven in the morning", "eleven o'clock in the morning"], hint: "Exact diurnal hour reference" },
  { french: "Les tombes militaires", answers: ["military graves", "war graves"], hint: "Plural sepulchral noun phrase" },
  { french: "Le cimetière militaire", answers: ["the military cemetery", "military cemetery"], hint: "Hallowed burial ground noun" },
  { french: "Garder la foi", answers: ["keep the faith"], hint: "Infinitive maintenance of belief" },
  { french: "La paix mondiale", answers: ["world peace"], hint: "Global adjectival modifier phrase" },
  { french: "Plus jamais ça", answers: ["never again", "no more war"], hint: "Demonstrative adverbial negative cry" },
  { french: "Se souvenir des sacrifices", answers: ["remembering the sacrifices", "remembering sacrifices"], hint: "Reflexive infinitive plural objects" },
  { french: "La patrie reconnaissante", answers: ["the grateful homeland"], hint: "Feminine post-positive adjectival agreement" },
  { french: "Le courage face au danger", answers: ["courage in the face of danger"], hint: "Prepositional idiom of confrontation" },
  { french: "Les braves de la nation", answers: ["the nation's braves"], hint: "Genitive national attribution" },
  { french: "Le pavillon national", answers: ["the national flag"], hint: "Vexillological noun phrase" },
  { french: "Mettre en berne le drapeau", answers: ["to lower the flag to half-mast", "half-mast flag"], hint: "Infinitive protocol verb phrase" },
  { french: "Un hommage solennel", answers: ["a solemn tribute"], hint: "Ceremonial expression of respect" },
  { french: "Rendre hommage", answers: ["to pay tribute", "pay homage", "pay tribute"], hint: "Collocative verb for honoring" },
  { french: "La douleur des familles", answers: ["the families' grief", "families' sorrow"], hint: "Plural genitive emotional noun" },
  { french: "La cicatrice de la guerre", answers: ["the scar of war"], hint: "Metaphorical somatic noun phrase" },
  { french: "Bâtir la paix", answers: ["building peace"], hint: "Architectural metaphor infinitive" },
  { french: "La réconciliation", answers: ["reconciliation"], hint: "Societal healing noun" },
  { french: "Fraternité entre les peuples", answers: ["brotherhood among peoples"], hint: "Revolutionary triad component eliding article" },
  { french: "La résilience", answers: ["resilience"], hint: "Psychological hardiness noun" },
  { french: "Les épreuves de la guerre", answers: ["the hardships of war"], hint: "Trials and tribulations plural" },
  { french: "La dureté des combats", answers: ["the harshness of combat", "intensity of the fighting"], hint: "Noun of severity and rigor" },
  { french: "Le front de l'ouest", answers: ["the western front"], hint: "Geographic military theater" },
  { french: "Les tranchées", answers: ["the trenches", "trenches"], hint: "Geomorphic defensive earthworks" },
  { french: "La boue des tranchées", answers: ["the mud of the trenches"], hint: "Saturated soil genitive phrase" },
  { french: "Le gaz moutarde", answers: ["mustard gas"], hint: "Chemical vesicant weapon name" },
  { french: "L'appel du devoir", answers: ["the call of duty"], hint: "Moral summons genitive construct" },
  { french: "Partir au front", answers: ["going to the front", "leaving for the front"], hint: "Infinitive departure idiom" },
  { french: "Dire adieu", answers: ["saying goodbye"], hint: "Ultimate linguistic parting formula" },
  { french: "La lettre du front", answers: ["the letter from the front"], hint: "Epistolary wartime communication" },
  { french: "Le retour des soldats", answers: ["the return of the soldiers"], hint: "Homecoming substantive noun" },
  { french: "L'attente anxieuse", answers: ["anxious waiting"], hint: "Feminine adjectival noun pairing" },
  { french: "Le deuil national", answers: ["national mourning"], hint: "State-level grief designation" },
  { french: "Inscrire dans l'histoire", answers: ["to write in history", "make history"], hint: "Archival engraving metaphor" },
  { french: "L'histoire retiendra", answers: ["history will remember"], hint: "Future prophetic verb form" },
  { french: "Le flambeau de la mémoire", answers: ["the torch of memory"], hint: "Olympic relay metaphor object" },
  { french: "Transmettre le flambeau", answers: ["passing the torch"], hint: "Infinitive generational handoff" },
  { french: "Les jeunes générations", answers: ["the younger generations", "future generations"], hint: "Comparative plural age demographic" },
  { french: "Ne jamais faillir", answers: ["never fail", "never falter"], hint: "Negative adverbial infinitive stance" },
  { french: "Debout pour la patrie", answers: ["standing for the homeland"], hint: "Postural adverbial stance phrase" },
  { french: "La force de l'esprit", answers: ["the strength of the spirit"], hint: "Mental power genitive noun" },
  { french: "Le cœur lourd", answers: ["heavy heart"], hint: "Somatic emotional burden phrase" },
  { french: "Une larme versée", answers: ["a shed tear", "a tear shed"], hint: "Participial lacrimal noun phrase" },
  { french: "Le silence respectueux", answers: ["respectful silence"], hint: "Reverent quietude description" },
  { french: "La dignité dans la mort", answers: ["dignity in death"], hint: "Prepositional terminal state phrase" },
  { french: "La liberté retrouvée", answers: ["freedom regained", "recovered freedom"], hint: "Post-positive recovered status" },
  { french: "Retrouver la liberté", answers: ["to regain freedom"], hint: "Infinitive recovery action" },
  { french: "L'espoir d'un monde meilleur", answers: ["the hope for a better world"], hint: "Comparative utopian noun phrase" },
  { french: "La fin des hostilités", answers: ["the end of hostilities"], hint: "Formal cessation noun phrase" },
  { french: "La signature de la paix", answers: ["the signing of the peace"], hint: "Diplomatic ratification act" },
  { french: "Le traité de paix", answers: ["the peace treaty", "peace treaty"], hint: "Bilateral legal document" },
  { french: "La reconstruction", answers: ["rebuilding", "reconstruction"], hint: "Post-conflict restoration noun" },
  { french: "Regarder vers l'avenir", answers: ["looking toward the future"], hint: "Directional directional infinitive gaze" },
  { french: "Honorer leur mémoire", answers: ["to honour their memory", "honor their memory"], hint: "Transitive verb of respect" },
  { french: "Le devoir patriotique", answers: ["patriotic duty"], hint: "Civic obligation modifier" },
  { french: "L'amour du pays", answers: ["love of the country", "patriotism"], hint: "Affective territorial noun phrase" },
  { french: "La nation unie", answers: ["the united nation", "united nation"], hint: "Feminine collective entity agreement" },
  { french: "Vivre en paix", answers: ["living in peace", "to live in peace"], hint: "Infinitive peaceful state" },
  { french: "Le souvenir éternel", answers: ["eternal remembrance", "eternal memory"], hint: "Ageless mental retention phrase" }
];

const seasonal2Phrases = [
  { french: "Joyeuse Action de grâce", answers: ["happy thanksgiving"], hint: "Canadian-French phrasing of harvest holiday" },
  { french: "La dinde de Thanksgiving", answers: ["thanksgiving turkey", "the thanksgiving turkey"], hint: "Avian main course hybrid loanword" },
  { french: "La tarte à la citrouille", answers: ["pumpkin pie", "the pumpkin pie"], hint: "Cucurbit pastry designation" },
  { french: "Exprimons notre gratitude", answers: ["let us express our gratitude", "expressing our gratitude"], hint: "First-person plural imperative subjunctive root" },
  { french: "Le dîner de famille", answers: ["family dinner", "the family dinner"], hint: "Kinship evening meal" },
  { french: "Rendons grâce", answers: ["let us give thanks", "give thanks"], hint: "Shortened liturgical imperative expression" },
  { french: "La corne d'abondance", answers: ["the cornucopia", "cornucopia", "horn of plenty"], hint: "Zoological horn metaphor object" },
  { french: "Le repas de fête", answers: ["the festive meal", "holiday feast", "feast"], hint: "Celebratory nourishment noun" },
  { french: "La farce de la dinde", answers: ["the turkey stuffing", "stuffing", "dressing"], hint: "Cavity-filling culinary mixture" },
  { french: "La sauce aux canneberges", answers: ["cranberry sauce", "the cranberry sauce"], hint: "Vaccinium macrocarpon fruit condiment" },
  { french: "La purée de pommes de terre", answers: ["mashed potatoes", "the mashed potatoes"], hint: "Pounded root vegetable preparation" },
  { french: "La gravy", answers: ["the gravy", "gravy"], hint: "Anglicized culinary pan drippings" },
  { french: "Les patates douces", answers: ["sweet potatoes", "yams"], hint: "Convolvulaceae family root tuber" },
  { french: "Le pain de maïs", answers: ["cornbread", "corNBRead"], hint: "Zeamays baked flour product" },
  { french: "Les choux de Bruxelles", answers: ["brussels sprouts"], hint: "Gemmifera cultivar botanical noun" },
  { french: "La tarte aux pommes", answers: ["apple pie", "the apple pie"], hint: "Pome fruit pastry classic" },
  { french: "La tarte aux pacanes", answers: ["pecan pie", "the pecan pie"], hint: "Carya illinoinensis nut pastry" },
  { french: "Le cidre de pomme", answers: ["apple cider", "the apple cider"], hint: "Fermented or fresh pome juice" },
  { french: "Le vin chaud", answers: ["mulled wine"], hint: "Thermal fermented grape beverage" },
  { french: "L'automne", answers: ["autumn", "fall"], hint: "Equinoctial transition season" },
  { french: "Les feuilles d'automne", answers: ["autumn leaves", "fall leaves"], hint: "Deciduous foliage shed elements" },
  { french: "La récolte", answers: ["the harvest", "harvest"], hint: "Agrarian gathering action" },
  { french: "Les fruits de la terre", answers: ["fruits of the earth", "earth's bounty"], hint: "Terrestrial agricultural yield" },
  { french: "L'abondance", answers: ["abundance", "plenty"], hint: "Copiousness abstract noun" },
  { french: "Être reconnaissant", answers: ["to be grateful", "being thankful"], hint: "Infinitive state of appreciation" },
  { french: "Un sentiment de gratitude", answers: ["a feeling of gratitude"], hint: "Affective psychological response noun" },
  { french: "Merci pour tout", answers: ["thanks for everything", "thank you for everything"], hint: "Universal gratitude quantifier" },
  { french: "La bénédiction de la table", answers: ["blessing of the table", "table blessing", "saying grace"], hint: "Sacred dining consecration" },
  { french: "La prière de remerciement", answers: ["thanksgiving prayer", "prayer of thanksgiving"], hint: "Spoken devotional text" },
  { french: "Se réunir en famille", answers: ["gathering with family", "family gathering"], hint: "Reflexive assembly infinitive" },
  { french: "Les proches", answers: ["loved ones", "family and friends"], hint: "Substantive adjective for intimates" },
  { french: "Les traditions de famille", answers: ["family traditions"], hint: "Transmitted ancestral customs" },
  { french: "La chaleur du foyer", answers: ["the warmth of the home", "home warmth"], hint: "Hearth thermal metaphor" },
  { french: "Partager un repas", answers: ["sharing a meal", "to share a meal"], hint: "Communal ingestion infinitive" },
  { french: "La table de fête", answers: ["the holiday table", "festive table"], hint: "Prepared dining setup" },
  { french: "La nappe blanche", answers: ["the white tablecloth", "tablecloth"], hint: "Textile table protection fabric" },
  { french: "Les bougies allumées", answers: ["lit candles", "burning candles"], hint: "Wax illumination source" },
  { french: "La décoration automnale", answers: ["autumn decoration", "fall decor"], hint: "Seasonal aesthetic embellishment" },
  { french: "Les citrouilles décoratives", answers: ["decorative pumpkins", "pumpkins"], hint: "Ornamental squash specimens" },
  { french: "Le maïs soufflé", answers: ["popcorn"], hint: "Popped endosperm snack" },
  { french: "Les épis de maïs", answers: ["ears of corn", "corn on the cob"], hint: "Cereal inflorescence spike" },
  { french: "La tourte à la citrouille", answers: ["pumpkin tart", "pumpkin pie"], hint: "Enclosed pastry variant" },
  { french: "Les épices d'automne", answers: ["autumn spices", "fall spices", "pumpkin spice"], hint: "Aromatic flavoring compound mix" },
  { french: "La cannelle", answers: ["cinnamon"], hint: "Cinnamomum bark powder" },
  { french: "La muscade", answers: ["nutmeg"], hint: "Myristica fragrans seed spice" },
  { french: "Le clou de girofle", answers: ["clove", "cloves"], hint: "Aromatic flower bud spice" },
  { french: "Le gingembre", answers: ["ginger"], hint: "Rhizome root spice" },
  { french: "Le sucre brun", answers: ["brown sugar"], hint: "Sucrose with molasses content" },
  { french: "Le beurre frais", answers: ["fresh butter"], hint: "Emulsified dairy fat solid" },
  { french: "Le pain grillé", answers: ["toasted bread", "toast"], hint: "Radiant-heated bread slice" },
  { french: "La confiture de fruits", answers: ["fruit jam", "jam"], hint: "Pectin-preserved fruit spread" },
  { french: "Le temps des récoltes", answers: ["harvest time"], hint: "Agrarian temporal window" },
  { french: "Le grenier bien rempli", answers: ["the well-stocked granary", "full barn"], hint: "Agricultural storage attic" },
  { french: "La terre nourricière", answers: ["mother earth", "nourishing earth"], hint: "Personified productive soil" },
  { french: "Le travail des champs", answers: ["farm work", "field work"], hint: "Cultivation labor noun" },
  { french: "Le fermier", answers: ["the farmer", "farmer"], hint: "Agrarian land manager" },
  { french: "Le panier de fruits", answers: ["fruit basket"], hint: "Woven carrying receptacle" },
  { french: "Les légumes racines", answers: ["root vegetables"], hint: "Geotropic underground crops" },
  { french: "Les carottes glacées", answers: ["glazed carrots"], hint: "Sugar-coated root vegetable" },
  { french: "Les haricots verts", answers: ["green beans"], hint: "Phaseolus vulgaris pods" },
  { french: "La casserole de haricots verts", answers: ["green bean casserole"], hint: "Baked communal side dish" },
  { french: "La purée de patates douces", answers: ["mashed sweet potatoes", "sweet potato mash"], hint: "Whipped yam preparation" },
  { french: "Les guimauves fondues", answers: ["melted marshmallows"], hint: "Liquefied confectionary sugar foam" },
  { french: "Le rôti de bœuf", answers: ["roast beef"], hint: "Oven-cooked bovine meat" },
  { french: "Le jambon glacé", answers: ["glazed ham"], hint: "Cured porcine thigh cut" },
  { french: "Le chef cuisinier", answers: ["the chef", "head cook"], hint: "Culinary kitchen director" },
  { french: "Préparer le festin", answers: ["preparing the feast", "to prepare the feast"], hint: "Infinitive kitchen organization" },
  { french: "L'odeur de la cuisine", answers: ["the smell of cooking", "cooking aroma"], hint: "Olfactory culinary footprint" },
  { french: "Le four chaud", answers: ["the hot oven", "hot oven"], hint: "Thermal baking chamber" },
  { french: "Le tablier de cuisine", answers: ["kitchen apron", "apron"], hint: "Protective clothing garment" },
  { french: "Le plat principal", answers: ["the main course", "main dish"], hint: "Central culinary dish" },
  { french: "Les hors-d'œuvre", answers: ["appetizers", "starters"], hint: "Literally outside the work" },
  { french: "Le dessert gourmand", answers: ["the decadent dessert", "delicious dessert"], hint: "Indulgent final course" },
  { french: "La crème fouettée", answers: ["whipped cream"], hint: "Aerated dairy emulsion" },
  { french: "La glace à la vanille", answers: ["vanilla ice cream"], hint: "Frozen orchid-flavored dairy" },
  { french: "Le café chaud", answers: ["hot coffee"], hint: "Steaming caffeinated stimulant" },
  { french: "Le thé fumant", answers: ["steaming tea"], hint: "Infused camellia sinensis leaf" },
  { french: "Digestif après le repas", answers: ["after-dinner drink", "digestif"], hint: "Postprandial alcoholic drink" },
  { french: "Le temps de repos", answers: ["resting time", "food coma"], hint: "Post-eating recovery period" },
  { french: "La sieste de l'après-midi", answers: ["afternoon nap"], hint: "Meridional sleep interval" },
  { french: "Le match de football", answers: ["the football game", "football match"], hint: "Gridiron or association sport" },
  { french: "Discuter autour de la table", answers: ["chatting around the table", "conversation at the table"], hint: "Circumferential dining dialogue" },
  { french: "Les rires partagés", answers: ["shared laughter"], hint: "Collective vocal amusement" },
  { french: "Le bonheur simple", answers: ["simple happiness", "simple joy"], hint: "Uncomplicated emotional state" },
  { french: "Compter ses bénédictions", answers: ["counting one's blessings", "count your blessings"], hint: "Infinitive enumeration exercise" },
  { french: "Un cœur reconnaissant", answers: ["a grateful heart"], hint: "Cardiological thankfulness metaphor" },
  { french: "La paix dans le foyer", answers: ["peace in the home"], hint: "Domestic tranquility state" },
  { french: "L'harmonie familiale", answers: ["family harmony"], hint: "Kinship accord noun" },
  { french: "Le pardon et l'amour", answers: ["forgiveness and love"], hint: "Absolution and affection pairing" },
  { french: "Se dire merci", answers: ["saying thank you to each other", "thanking each other"], hint: "Reciprocal gratitude expression" },
  { french: "La bouffée d'air frais", answers: ["breath of fresh air"], hint: "Inhalation of outdoor atmosphere" },
  { french: "La promenade digestive", answers: ["digestive walk", "after-dinner walk"], hint: "Postprandial pedestrian movement" },
  { french: "Le ciel gris d'octobre", answers: ["october's gray sky", "gray october sky"], hint: "Tenth month meteorological cloud cover" },
  { french: "Les matins frais", answers: ["crisp mornings", "cool mornings"], hint: "Chilly dawn periods" },
  { french: "La bise d'automne", answers: ["the autumn breeze", "fall breeze"], hint: "Cold seasonal wind current" },
  { french: "Le solstice d'hiver approche", answers: ["winter solstice is approaching"], hint: "Astronomical turning point verb" },
  { french: "La fin de l'année", answers: ["the end of the year"], hint: "Calendar cycle conclusion" },
  { french: "Se préparer pour l'hiver", answers: ["preparing for winter"], hint: "Reflexive cold-weather staging" },
  { french: "Garder de bons souvenirs", answers: ["keeping good memories", "making good memories"], hint: "Mental retention preservation" },
  { french: "Vive l'Action de grâce", answers: ["long live thanksgiving", "hurrah for thanksgiving"], hint: "Exclamatory seasonal greeting" }
];

const seasonal3Phrases = [
  { french: "Le retour de Vice City", answers: ["vice city return", "welcome back to vice city"], hint: "Fictional Florida metropolis comeback" },
  { french: "Jason et Lucia", answers: ["jason and lucia", "the main characters"], hint: "Dual protagonist pairing names" },
  { french: "L'etat de Leonida", answers: ["leonida", "state of leonida"], hint: "Parody state territory designation" },
  { french: "Le club de strip-tease de Vice City", answers: ["vice city strip club", "strip club"], hint: "Adult entertainment venue asset" },
  { french: "La parodie des Florida Keys", answers: ["the keys", "florida keys parody"], hint: "Archipelago satirical map region" },
  { french: "Le flux en direct sur les reseaux sociaux", answers: ["live streaming", "social media live stream"], hint: "Virtual broadcast mechanics" },
  { french: "Les rassemblements de la secte de la boue", answers: ["mud cult", "mud pluggers"], hint: "Swamp-dwelling fanatic assembly" },
  { french: "Un alligator dans un magasin d'alimentation", answers: ["alligator in store", "store gator"], hint: "Reptilian convenience store intruder" },
  { french: "L'entrainement sur la plage de Vice City", answers: ["muscle beach", "vice city workout"], hint: "Coastal physical training zone" },
  { french: "Le rassemblement de voitures", answers: ["street takeover", "car meet"], hint: "Unauthorized vehicular gathering" },
  { french: "La fuite apres un braquage de magasin", answers: ["convenience store robbery", "hold up"], hint: "Retail heist evasion phase" },
  { french: "Une course-poursuite policiere a haute vitesse", answers: ["police pursuit", "cop chase"], hint: "Law enforcement high-velocity pursuit" },
  { french: "L'horizon de Vice City au cruscule", answers: ["vice city skyline", "sunset view"], hint: "Dusk architectural silhouette" },
  { french: "Les lumieres au neon d'Ocean Drive", answers: ["ocean drive neon", "ocean drive"], hint: "Illuminated coastal strip road" },
  { french: "Le spectacle d'hydraulique pour lowrider", answers: ["lowrider hop", "hydraulics"], hint: "Modified suspension bounce display" },
  { french: "Le scandale du flic corrompu", answers: ["corrupt officer", "dirty cop"], hint: "Law enforcement bribery narrative" },
  { french: "La cachette de drogue du cartel", answers: ["drug stash", "cartel house"], hint: "Narcotics storage safehouse" },
  { french: "L'operation d'infiltration secrete", answers: ["sting operation", "undercover cop"], hint: "Clandestine police entrapment setup" },
  { french: "La video virale de farceur en streaming", answers: ["viral prank", "streamer prank"], hint: "Online content creator gag" },
  { french: "La fusillade a la station-service", answers: ["gas station fight", "fuel pump explosion"], hint: "Combustible fuel dispenser blast" },
  { french: "Le conteneur maritime du port de Vice City", answers: ["shipping containers", "port heist"], hint: "Intermodal freight logistics box" },
  { french: "La fete sur un yacht prive", answers: ["yacht party", "boat celebration"], hint: "Watercraft luxury social gathering" },
  { french: "Le bateau a moteur dans le marais", answers: ["swamp boat chase", "airboat ride"], hint: "Wetland fan-powered watercraft" },
  { french: "L'equipe de cascadeurs urbains en moto cross", answers: ["bike life", "street stunt crew"], hint: "Off-road motorcycle trick squad" },
  { french: "La promenade nocturne sur l'autoroute eclairee au neon", answers: ["night drive", "highway neon"], hint: "Darkness multi-lane illumination transit" },
  { french: "Le bureau de cautionnement", answers: ["bail bonds", "bounty hunting"], hint: "Pre-trial release financial office" },
  { french: "La negotiation au preteur sur gages", answers: ["pawn shop", "sell stolen goods"], hint: "Collateral loan establishment" },
  { french: "L'atelier de peinture automobile personnalisee", answers: ["custom spray shop", "ls customs style"], hint: "Vehicular aesthetic modification garage" },
  { french: "L'atelier clandestin de voitures volees", answers: ["chop shop", "stripping cars"], hint: "Illegal vehicle dismantling facility" },
  { french: "La ligne de depart d'une course de rue de minuit", answers: ["street race", "drag race start"], hint: "Nocturnal asphalt racing grid" },
  { french: "L'helicoptere de la police de Vice City", answers: ["noose helicopter", "police chopper"], hint: "Law enforcement aerial rotorcraft" },
  { french: "L'assaut tactique de l'equipe SWAT", answers: ["swat raid", "tactical entry"], hint: "Specialized tactical unit breach" },
  { french: "La tentative d'evasion de prison", answers: ["prison break", "penitentiary escape"], hint: "Correctional facility breakout plot" },
  { french: "Le tableau blanc de planification de braquage", answers: ["heist board", "planning the score"], hint: "Dry-erase tactical crime chart" },
  { french: "Le percage de coffre-fort dans la planque", answers: ["crack the safe", "stealing cash"], hint: "High-security container breach" },
  { french: "Le marchand d'armes du marche noir", answers: ["gun runner", "illegal weapons"], hint: "Clandestine firearm vendor" },
  { french: "Le reseau de faux papiers d'identite", answers: ["fake id", "counterfeit operation"], hint: "Fraudulent credential ring" },
  { french: "La presse a imprimer de la fausse monnaie", answers: ["money printer", "counterfeit cash"], hint: "Illicit currency manufacturing press" },
  { french: "L'intersection de la guerre des gangs", answers: ["turf war", "gang territory"], hint: "Territorial faction conflict node" },
  { french: "L'embuscade d'un cartel rival", answers: ["cartel ambush", "drive by attack"], hint: "Syndicate surprise assault" },
  { french: "L'installation de la planque du piratage", answers: ["hacker den", "surveillance screens"], hint: "Digital intrusion monitoring base" },
  { french: "Le siege social d'une arnaque aux cryptomonnaies", answers: ["crypto scam", "rug pull operation"], hint: "Digital asset fraud headquarters" },
  { french: "Le penthouse de luxe surplombant la plage", answers: ["luxury penthouse", "ocean view condo"], hint: "Top-floor coastal real estate" },
  { french: "La planque dans un motel деlabre", answers: ["motel hideout", "cheap motel room"], hint: "Dilapidated temporary lodging shelter" },
  { french: "L'evasion dans une voiture de patrouille volee", answers: ["stolen cop car", "undercover cruiser"], hint: "Commandeered law enforcement vehicle" },
  { french: "Le braquage d'un poste de peage sur l'autoroute", answers: ["toll booth heist", "highway robbery"], hint: "Roadway fee station robbery" },
  { french: "La fusillade a l'interieur du mega centre commercial", answers: ["mall shootout", "shopping center chaos"], hint: "Multi-store retail gunfire exchange" },
  { french: "Le point de vue du tireur d'elite sur le toit", answers: ["rooftop sniper", "overwatch position"], hint: "Elevated long-range vantage perch" },
  { french: "La transaction de drogue qui tourne mal dans une allee", answers: ["bad drug deal", "alley ambush"], hint: "Compromised backstreet narcotics exchange" },
  { french: "La course-poursuite en bateau rapide", answers: ["boat escape", "water pursuit"], hint: "High-speed aquatic vessel chase" },
  { french: "Le saut en parachute sur un camion en mouvement", answers: ["truck parachute", "air drop"], hint: "Aerial descent onto flatbed" },
  { french: "Le saut cascade par-dessus un viaduc d'autoroute", answers: ["stunt jump", "epic jump"], hint: "Elevated highway gap leap" },
  { french: "Le raid sur une partie de poker clandestine", answers: ["illegal poker game", "high stakes poker"], hint: "Unlicensed card game bust" },
  { french: "La bagarre avec les bons du salon VIP", answers: ["club bouncer fight", "vip brawl"], hint: "Exclusive lounge security altercation" },
  { french: "Le chaos d'une fete au bord de la piscine sur le toit", answers: ["pool party", "rooftop chaos"], hint: "Elevated water basin celebration" },
  { french: "Le tag de graffiti d'un gang rival", answers: ["gang tag", "territory marking"], hint: "Spray-painted faction signature" },
  { french: "Le detournement d'un semi-remorque vole", answers: ["semi truck hijack", "rig robbery"], hint: "Large commercial transport seizure" },
  { french: "Le braquage d'un transport de fonds blind", answers: ["armored truck robbery", "securicor heist"], hint: "Security vehicle cash heist" },
  { french: "L'intrusion sur la piste de l'aeroport international", answers: ["airport breach", "runway chase"], hint: "Aviation tarmac security breach" },
  { french: "Le detournement d'un avion cargo en plein vol", answers: ["cargo plane heist", "mid air boarding"], hint: "In-flight freight aircraft takeover" },
  { french: "L'infiltration de la base militaire", answers: ["fort zancudo style base", "military break in"], hint: "Restricted defense installation breach" },
  { french: "Le vol d'un helicoptere d'attaque", answers: ["military helicopter theft", "stealing a chopper"], hint: "Armed military rotorcraft theft" },
  { french: "Le grabuge d'un char d'assaut sur Ocean Drive", answers: ["tank rampage", "military tank chaos"], hint: "Armored tracked vehicle destruction" },
  { french: "La course de jet-ski a travers les Keys", answers: ["jet ski race", "watercraft sprint"], hint: "Archipelago personal watercraft dash" },
  { french: "La plongee sous-marine a la recherche de tresor englouti", answers: ["sunken treasure", "deep sea diving"], hint: "Submersible loot recovery dive" },
  { french: "L'attaque de requin dans la baie", answers: ["shark attack", "ocean predator"], hint: "Marine cartilage fish assault" },
  { french: "L'effraction dans une ferme d'alligators", answers: ["gator farm", "reptile enclosure"], hint: "Reptile breeding facility breach" },
  { french: "La course d'hydroglisseurs dans les marais", answers: ["swamp race", "airboat championship"], hint: "Wetland propeller boat sprint" },
  { french: "Le braquage d'un restaurant de bord de route", answers: ["diner robbery", "classic hold up"], hint: "Highway eatery holdup" },
  { french: "La riposte du caissier du magasin d'alimentation", answers: ["store clerk fights back", "counter robbery"], hint: "Employee armed retaliation" },
  { french: "L'effraction dans la fourriere municipale", answers: ["impound lot heist", "stealing impounded cars"], hint: "Seized vehicle compound break-in" },
  { french: "L'evasion du broyeur a la decharge", answers: ["junkyard escape", "car crusher"], hint: "Scrap yard machinery evasion" },
  { french: "Le sabotage provoquant une panne de courant a la centrale", answers: ["grid sabotage", "power blackout"], hint: "Electrical infrastructure blackout" },
  { french: "Le piratage pour interrompre la diffusion television", answers: ["broadcast hack", "tv signal takeover"], hint: "Television signal hijacking" },
  { french: "Le piratage de surveillance sur une tour cellulaire", answers: ["wiretap", "cell tower hack"], hint: "Telecommunication mast intercept" },
  { french: "Le raid sur la planque de protection des temoins", answers: ["witness protection", "safe house attack"], hint: "Federal informant shelter assault" },
  { french: "L'infiltration du tribunal federal", answers: ["courthouse break in", "legal archives heist"], hint: "Government judicial building breach" },
  { french: "Le vol de la salle des scelles au poste de police", answers: ["evidence room heist", "stealing seized goods"], hint: "Police precinct property theft" },
  { french: "L'effraction au siege de campagne du maire", answers: ["political scandal", "campaign office break in"], hint: "Mayoral election headquarters break-in" },
  { french: "Le bunker souterrain secret", answers: ["underground bunker", "secret facility"], hint: "Subterranean classified installation" },
  { french: "L'exploration d'un silo a missiles abandonne", answers: ["missile silo", "nuclear bunker"], hint: "Disused ballistic launch shaft" },
  { french: "Le largage de contrebande dans les Everglades", answers: ["everglades drop", "swamp drop off"], hint: "Wetland illicit package air-drop" },
  { french: "La confrontation avec la police suite a un exces de vitesse", answers: ["traffic stop", "police warning"], hint: "Velocity infraction police pull-over" },
  { french: "Les consequences d'un accident en conduisant en etat d'ivresse", answers: ["dui crash", "car accident"], hint: "Intoxicated vehicular collision" },
  { french: "La transaction de drogue au coin de la rue", answers: ["corner dealing", "street corner drop"], hint: "Pavement narcotics trade" },
  { french: "La voie d'evasion par le parkour sur les toits", answers: ["rooftop escape", "parkour chase"], hint: "Architectural vertical-traversal flight" },
  { french: "La course-poursuite en bateau dans les canaux de style Venise", answers: ["canal boat chase", "waterway pursuit"], hint: "Waterway network vessel pursuit" },
  { french: "Le grabuge en voiture de golf sur le terrain de luxe", answers: ["golf course chaos", "cart rampage"], hint: "Fairway electric vehicle rampage" },
  { french: "L'effraction dans un club de campagne exclusif", answers: ["country club heist", "rich neighborhood break in"], hint: "Elite recreational estate burglary" },
  { french: "Le braquage de la piscine d'un manoir", answers: ["mansion robbery", "estate burglary"], hint: "Luxury backyard basin heist" },
  { french: "L'assommoir du gardien de securite", answers: ["stealth takedown", "guard knockout"], hint: "Silent security sentinel neutralization" },
  { french: "Le contournement du systeme de securite laser", answers: ["laser grid", "security bypass"], hint: "Optic beam security evasion" },
  { french: "Le piratage du lecteur biometrique du coffre", answers: ["biometric scan", "vault unlock"], hint: "Biological security scanner defeat" },
  { french: "Le vol de piles de lingots d'or", answers: ["gold bar heist", "bullion robbery"], hint: "Precious metal reserve theft" },
  { french: "Le braquage de la bourse aux diamants", answers: ["diamond heist", "gem robbery"], hint: "Gemstone trading floor robbery" },
  { french: "Le cambriolage d'une vente aux encheres d'art contrefait", answers: ["art gallery heist", "painting theft"], hint: "Fine art auction burglary" },
  { french: "La mission de recuperation d'artefacts au musee", answers: ["museum break in", "ancient artifact theft"], hint: "Historical exhibition recovery job" },
  { french: "La fusillade dans la salle VIP d'un casino souterrain", answers: ["casino shootout", "underground gambling hall"], hint: "Subterranean wagering room gunfight" },
  { french: "Le trucage d'une machine a sous", answers: ["rigged slot machine", "casino hack"], hint: "Tampered gaming terminal odds" },
  { french: "Le trucage de paris sur les courses de chevaux", answers: ["fixed race", "track betting scam"], hint: "Manipulated equine wagering outcome" },
  { french: "Le sabotage de la piste de courses de chiens", answers: ["dog track raid", "greyhound sabotage"], hint: "Canine racing track disruption" },
  { french: "Le tonneau en avion de voltige au-dessus de la ville", answers: ["stunt plane", "aerial acrobatics"], hint: "Acrobatic aircraft roll maneuver" },
  { french: "Le saut en chute libre au-dessus de la plage de Vice City", answers: ["sky dive", "beach jump"], hint: "Coastal atmospheric freefall drop" },
  { french: "Le vol en combinaison volant a travers les gratte-ciel", answers: ["wingsuit flight", "skyscraper glide"], hint: "High-rise textile gliding descent" },
  { french: "Le poste de tireur d'elite dans une montgolfiere", answers: ["hot air balloon", "aerial sniper"], hint: "Aerostatic balloon sniper perch" },
  { french: "Le detournement de la banniere publicitaire du dirigeable", answers: ["blimp hijack", "airship takeover"], hint: "Advertising airship commandeer" },
  { french: "Le complot de deraillement d'un train de marchandises", answers: ["train derailment", "railroad heist"], hint: "Freight railway sabotage plot" },
  { french: "Le vol d'une locomotive de train de marchandises", answers: ["train hijacking", "locomotive theft"], hint: "Rail engine command theft" },
  { french: "L'accident de vehicule a un passage a niveau", answers: ["train crash", "vehicle stuck on tracks"], hint: "Railway grade crossing collision" },
  { french: "Le saut par-dessus un pont-levis ouvert", answers: ["drawbridge jump", "bridge gap leap"], hint: "Bascule bridge structural jump" },
  { french: "La fusillade dans les embouteillages d'un tunnel routier", answers: ["tunnel shootout", "highway tunnel traffic"], hint: "Sub-surface vehicular congestion firefight" },
  { french: "La bagarre sur le quai d'une station de metro", answers: ["subway fight", "metro station brawl"], hint: "Rapid transit platform altercation" },
  { french: "L'echappatoire au cordons de police dans les tunnels du metro", answers: ["metro escape", "subway tunnel chase"], hint: "Subterranean rail network flight" },
  { french: "Le braquage du pont passagers d'un navire de croisiere", answers: ["cruise ship robbery", "liner heist"], hint: "Passenger vessel command deck heist" },
  { french: "La prise de controle d'une barge casino flottante", answers: ["floating casino", "barge heist"], hint: "Pontoons-mounted gambling vessel takeover" },
  { french: "L'infiltration tactique d'une plateforme petroliere", answers: ["oil rig assault", "offshore platform raid"], hint: "Marine petroleum extraction raid" },
  { french: "La confrontation avec le gardien de phare", answers: ["lighthouse lookout", "coastal watchtower"], hint: "Beacon tower keeper standoff" },
  { french: "La perturbation d'une fete autour d'un feu de camp sur la plage", answers: ["beach party", "bonfire brawl"], hint: "Coastal fire gathering disruption" },
  { french: "Le chaos de la foule pendant le Spring Break", answers: ["spring break", "crowd riot"], hint: "Student vacation mass disorder" },
  { french: "La falsification de passes pour les coulisses d'un festival", answers: ["music festival", "backstage infiltration"], hint: "Concert credential forgery" },
  { french: "Le fracas du materiel dans la cabine du DJ", answers: ["dj booth fight", "concert chaos"], hint: "Disc jockey console destruction" },
  { french: "Le reseau de revente de billets de concert VIP", answers: ["ticket scalping", "black market passes"], hint: "Premium concert pass black market" },
  { french: "La course-poursuite des paparazzi derriere une celebritie", answers: ["paparazzi chase", "celebrity stalker"], hint: "Tabloid photographer vehicular pursuit" },
  { french: "L'explosion ratee lors d'une cascade sur un plateau de cinema", answers: ["movie set chaos", "film studio explosion"], hint: "Cinematic pyrotechnic mishap" },
  { french: "L'escalade du panneau de style Hollywood", answers: ["sign climb", "landmark scaling"], hint: "Cinematic hillside letter scaling" },
  { french: "Le cambriolage de l'astronome a l'observatoire", answers: ["observatory heist", "hilltop robbery"], hint: "Dome telescope facility burglary" },
  { french: "La fusillade sur la passerelle d'entretien d'un parc eolien", answers: ["wind turbine fight", "wind farm catwalk"], hint: "Eolienne maintenance gantry gunfight" },
  { french: "La course en quad sur le champ de panneaux solaires", answers: ["solar farm race", "atv desert dash"], hint: "Photovoltaic array all-terrain dash" },
  { french: "Le piege pour auto-stoppeur sur l'autoroute du desert", answers: ["hitchhiker trap", "desert ambush"], hint: "Arid highway traveler snare" },
  { french: "L'exploration d'une ville fantome abandonnee", answers: ["ghost town", "abandoned settlement"], hint: "Deserted historical settlement trek" },
  { french: "Le confinement militaire du site d'ecrasement d'une meteorite", answers: ["meteorite site", "alien conspiracy area"], hint: "Extraterrestrial debris military quarantine" },
  { french: "Le rassemblement secret d'une secte d'ovnis", answers: ["ufo cult", "alien believers"], hint: "Unidentified flying object cult meet" },
  { french: "L'interview dans la cave d'un theoricien du complot", answers: ["conspiracy theorist", "tinfoil hat interview"], hint: "Subterranean fringe theorist dialogue" },
  { french: "L'emission de radio de minuit avec un talk-show", answers: ["radio talk show", "midnight broadcast"], hint: "Nocturnal audio discussion program" },
  { french: "L'enregistrement de voix off pour une publicite satirique", answers: ["commercial parody", "satirical ad"], hint: "Mock advertisement vocal dub" },
  { french: "La dispute et la fusillade au drive-in d'un fast-food", answers: ["drive thru fight", "fast food rage"], hint: "Automotive-service window shootout" },
  { french: "La confrontation pour rage au volant a coups de batte de base-ball", answers: ["road rage", "bat beatdown"], hint: "Traffic dispute club assault" },
  { french: "La bagarre suite a un accrochage dans un parking", answers: ["parking lot fight", "fender bender dispute"], hint: "Minor collision tarmac brawl" },
  { french: "Le vol d'une voiture par le service de voiturier", answers: ["valet heist", "stealing customer cars"], hint: "Parking attendant auto theft" },
  { french: "Le piege des brosses automatiques dans une station de lavage", answers: ["car wash escape", "automatic wash ambush"], hint: "Rotary brush vehicular trap" },
  { french: "L'effraction dans un box de stockage personnel", answers: ["storage unit heist", "lock cutter"], hint: "Self-storage facility padlock breach" },
  { french: "L'escroquerie d'un homme politique corrompu", answers: ["politician blackmail", "extortion plot"], hint: "Elected official coercion scheme" },
  { french: "La reunion pour la remise de photos compromettantes", answers: ["blackmail meeting", "photo exchange"], hint: "Incriminating evidence handoff" },
  { french: "L'echange de la mallette pour la rancon", answers: ["ransom drop", "briefcase exchange"], hint: "Extortion currency case swap" },
  { french: "L'operation de sauvetage d'otages", answers: ["hostage rescue", "save the captive"], hint: "Captive extraction tactical op" },
  { french: "La decoupe thermique du coffre de banque avec une lance", answers: ["thermal lance", "cutting vault door"], hint: "High-temperature steel vault torching" },
  { french: "L'effraction d'une porte a l'explosif C4", answers: ["c4 charge", "explosive entry"], hint: "Plastic explosive breaching charge" },
  { french: "La progression tactique dans le couloir avec des grenades fumigenes", answers: ["smoke grenade", "tactical advance"], hint: "Visual-obscuring aerosol corridor push" },
  { french: "Le nettoyage d'une piece a l'aide d'une grenade etourdissante", answers: ["flashbang entry", "room clear"], hint: "Stun-device room clearance" },
  { french: "Le tir de suppression avec un fusil de sniper", answers: ["suppressive fire", "sniper cover"], hint: "Long-range covering volume fire" },
  { french: "L'elimination au combat en frappant avec la crosse du pistolet", answers: ["pistol whip", "close quarters combat"], hint: "Firearm butt close-range strike" },
  { french: "La roulade d'evitement derriere un abri", answers: ["combat roll", "dive for cover"], hint: "Evasive tactical ground spin" },
  { french: "Le tir en aveugle autour d'un angle", answers: ["blind fire", "corner shooting"], hint: "Unscoped perimeter angle shooting" },
  { french: "Le remplacement de la plaque de blindage en plein milieu d'un echange de tirs", answers: ["armor plating", "putting on vest"], hint: "In-combat ballistic vest swap" },
  { french: "La consommation d'en-cas pour recuperer de la sante sous les tirs", answers: ["eating snacks", "healing up"], hint: "Ballistic recovery snack ingestion" },
  { french: "Le changement d'arme grace au menu circulaire d'inventaire", answers: ["weapon wheel", "switching guns"], hint: "Radial inventory firearm selection" },
  { french: "La defense en utilisant la portiere d'une voiture comme bouclier pare-balles", answers: ["car door cover", "vehicle shield"], hint: "Automotive steel ballistic shield" },
  { french: "La tactique consistant a tirer dans les pneus pour immobiliser un vehicule", answers: ["shooting tires", "disabled vehicle"], hint: "Rubber deflation stopping tactic" },
  { french: "L'arret d'un vehicule grace a un tir de sniper dans le bloc moteur", answers: ["engine block shot", "stopping the car"], hint: "Powertrain precision disabling shot" },
  { french: "La manoeuvre PIT comme technique de poursuite policiere", answers: ["pit maneuver", "ramming the suspect"], hint: "Precision immobilization technique spin" },
  { french: "Le deploiement de bandes de clous sur la route", answers: ["spike strips", "tire deflation"], hint: "Roadway puncture barrier setup" },
  { french: "Le passage en force a travers une barricade de barrage routier", answers: ["roadblock crash", "breaking through barricade"], hint: "Police blockade vehicular smash" },
  { french: "L'evasion du projecteur d'un helicoptere", answers: ["avoiding searchlight", "hiding from chopper"], hint: "Rotary-wing beam evasion" },
  { french: "La diminution de l'indice de recherche lorsque les etoiles clignotent", answers: ["losing the cops", "wanted level cooling down"], hint: "Flashing hostility star decay" },
  { french: "La sequence d'ecran d'arrestation interceptee", answers: ["busted screen", "getting arrested"], hint: "Apprehension sequence interface" },
  { french: "La facture d'hopital suite a une reaparition apres un echec", answers: ["wasted screen", "respawning at hospital"], hint: "Medical facility resurrection fee" },
  { french: "Le changement de vetements dans la garde-robe de la planque", answers: ["changing clothes", "outfit selection"], hint: "Wardrobe apparel modification" },
  { french: "La personnalisation de la coiffure au salon de coiffure", answers: ["haircut", "salon visit"], hint: "Cranial follicle styling visit" },
  { french: "La seance de tatouage au salon de tatouage", answers: ["tattoo shop", "getting inked"], hint: "Dermal pigment application session" },
  { french: "L'achat d'en-cas dans une epicerie", answers: ["buying snacks", "store items"], hint: "Retail nourishment purchase" },
  { french: "Le gain a un jeu a gratter de loterie", answers: ["scratch card", "lottery win"], hint: "Wager ticket latex removal prize" },
  { french: "Le vol du pot de pourboire d'un artiste de rue", answers: ["stealing tip jar", "street musician robbery"], hint: "Busker gratuity container theft" },
  { french: "Le piratage d'un distributeur automatique avec un pied-de-biche", answers: ["atm robbery", "crowbar atm smash"], hint: "Cash machine mechanical pry" },
  { french: "Le crime consistant a arracher le telephone d'un pieton", answers: ["phone snatching", "stealing phone from pedestrian"], hint: "Pedestrian mobile device theft" },
  { french: "L'evasion en bicyclette volee", answers: ["bicycle theft", "pedal bike escape"], hint: "Man-powered two-wheeler flight" },
  { french: "La figure acrobatique dans le demi-pipe d'un skatepark", answers: ["skate park", "halfpipe trick"], hint: "U-shaped ramp aerial trick" },
  { french: "Le saut de toit en BMX", answers: ["bmx drop", "roof gap jump"], hint: "Bicycle motocross architectural leap" },
  { french: "La course en patins a roulettes sur la promenade", answers: ["boardwalk skate", "roller skating race"], hint: "Coastal paved wheeled skating" },
  { french: "Le piege appate par la musique d'un camion de glaces", answers: ["ice cream truck trap", "luring victims"], hint: "Melodic frozen dairy trap" },
  { french: "La bagarre pour le territoire entre camions-restaurants", answers: ["food truck fight", "culinary turf war"], hint: "Mobile catering territory brawl" },
  { french: "La destruction d'un chariot de vendeur de nourriture de rue", answers: ["destroying food cart", "vendor chaos"], hint: "Mobile street kiosk smashing" },
  { french: "Le panorama de palmiers au coucher du soleil sur fond de neon", answers: ["sunset panorama", "neon palm trees"], hint: "Tropical silhouette twilight view" },
  { french: "L'inondation causee par une tempete tropicale ou un ouragan", answers: ["hurricane flood", "tropical storm weather"], hint: "Cyclonic storm surge deluge" },
  { french: "La tempete de plage frappe par un eclair", answers: ["lightning storm", "beach thunder"], hint: "Electrical storm coastal strike" },
  { french: "Un arc-en-ciel au-dessus de l'horizon de Vice City", answers: ["rainbow view", "post storm rainbow"], hint: "Optical dispersion urban arch" },
  { french: "La brume matinale sur le marais", answers: ["morning mist", "swamp fog"], hint: "Wetland early-hour vapor layer" },
  { french: "L'observation des etoiles depuis une crete du desert", answers: ["desert stargazing", "night sky view"], hint: "Arid ridge celestial observation" }
];

let blitzInterval = null;
let INITIAL_TIMER_SECONDS = 30;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function boost(audio, gain) {
  const source = audioCtx.createMediaElementSource(audio);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = gain;
  source.connect(gainNode).connect(audioCtx.destination);
  return gainNode;
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
    return;
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

function startBgm() {
  playbackRequested.set(bgm, true);
  bgm.play().then(() => {
    if (playbackRequested.get(bgm)) fadeTo(BGM_VOLUME, bgm);
  }).catch(() => {error('Unable to begin bgm playback')});
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
  }).catch(() => {error('Unable to begin bgm playback')});
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
  }).catch(() => {error('Unable to begin bgm playback')});
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
    return;
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
  const MODES = ['all', 'easy', 'medium', 'hard', 'custom', 'seasonal', 'seasonal2', 'seasonal3', 'blitz'];

  MODES.forEach(m => {
    if (modeScores[m]) {
      modeScores[m].wins = 0;
      modeScores[m].losses = 0;
      if (modeScores[m].hints !== undefined) modeScores[m].hints = 0;
    }
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
      const isBugReportButton = b.textContent.includes('Report A Bug');
      
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
      const isBugReportButton = b.textContent.includes('Report A Bug');
      
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
    //////////////////////////////////////////
    document.body.classList.add('seasonal3');
    document.getElementById('mute').hidden = false;

    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => {
      const isResetButton = b.classList.contains('reset-score-button') || b.closest('.reset-score') || b.closest('.reset-score2');
      const isGamemodeMenuButton = b.closest('#gamemode');
      const isBugReportButton = b.textContent.includes('Report A Bug');
      
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
  }
}

let muted = false;

function toggleMute() {
  const baseMode = currentMode.replace("listen", "");
    if (!muted) {
      if (baseMode === 'seasonal') {
        stopBgm();
      } else {
        stopBgm2();
      }
      document.getElementById('mute').textContent = '🔇';
      muted = true;
    } else {
      if (baseMode === 'seasonal') {
        startBgm();
      } else {
        startBgm2();
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
  document.getElementById('error').hidden = true;
  }, 3000);

}

async function startGame(mode = currentMode) {
  const slider = document.getElementById('speechRate');

  slider.value = speechRate * 10;

  document.getElementById('displayRate').textContent = speechRate + 'x';

  slider.addEventListener('input', () => {
    speechRate = Number(slider.value) / 10;
    document.getElementById('displayRate').textContent = speechRate + 'x';
    localStorage.setItem('speechRate', JSON.stringify(speechRate));
  });

  currentMode = mode;
  showScore();
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

  let allowed = true;
  if (mode === 'seasonal' || mode === 'seasonal2' || mode === 'seasonal3') {
    await getServerTime();
    if (!serverCalendar) {
      error('Unable to fetch date');
      return;
    }
    
    const year = Number(serverCalendar[0]);
    const month = Number(serverCalendar[1]);

    if (mode === 'seasonal' || mode === 'seasonal2' || mode === 'seasonal3') {
      allowed = (year < 2027 && month === 11);
    }/* else if (mode === 'seasonal2') {
      allowed = (year < 2027 && month === 11);
    } else if (mode === 'seasonal3') {
      allowed = (year < 2027 && (month === 11 || month === 10));
    }*/
  }

  if (!allowed) {
    error('This mode is unavailable');
    return;
  } else {
    currentMode = mode;
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
}

let modeScores = {};
try {
  const MODES = ['all', 'easy', 'medium', 'hard', 'custom', 'seasonal', 'seasonal2', 'seasonal3'];
  const readJSON = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const num = v => Number(v) || 0;

  const savedScores = readJSON('frenchScores');
  const oldScore = readJSON('frenchScore');
  for (const m of MODES) {
    modeScores[m] = { wins: num(savedScores?.[m]?.wins), losses: num(savedScores?.[m]?.losses) };
  }
  if (!savedScores && oldScore) {
    modeScores.all = { wins: num(oldScore.wins), losses: num(oldScore.losses), hints: 0 };
  }

  const scoreOfCurrentMode = () => (modeScores[currentMode] ??= { wins: 0, losses: 0, hints: 0 });

  updateScore = function () {
    localStorage.setItem('frenchScores', JSON.stringify(modeScores));
    showScore();
  };

function removeFromList() {
  customPhrases.forEach(() => {
  try {document.querySelector('li').remove();}
  catch {return;};
  });
  try {document.querySelector('li').remove();}
  catch {};
};

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
    actionButton.style.backgroundColor = 'red';

    actionButton.addEventListener('click', () => {
      deletePhrase(index);
      custom();
      return;
    });

    listItem.appendChild(itemText);
    listItem.appendChild(actionButton);
    listContainer.appendChild(listItem);
  });
};

showScore = function () {
    const targetParents = ['all', 'easy', 'medium', 'hard', 'custom', 'seasonal', 'seasonal2', 'seasonal3', 'blitz'];
    let scoreLines = [];

    targetParents.forEach(key => {
      const mode = modeScores[key];
      if (mode) {
        mode.hints ??= 0;
        const modeLabel = key.charAt(0).toUpperCase() + key.slice(1);
        
        if (key === 'blitz') {
          scoreLines.push(`${modeLabel}: Best Streak ${mode.wins} | Streak ${mode.losses}`);
        } else {
          scoreLines.push(`${modeLabel}: Wins ${mode.wins} | Losses ${mode.losses} | Hints ${mode.hints}`);
        }
      }
    });

    const label = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    
    if (currentMode === 'blitz') {
      document.querySelector('.score').innerHTML = `${label}: Best Streak ${score.wins} | Streak ${score.losses}`;
    } else {
      document.querySelector('.score').innerHTML = `${label}: Wins ${score.wins} | Losses ${score.losses} | Hints: ${score.hints}`;
    }

    document.querySelector('.allScore').innerHTML = scoreLines.join('<br>');
};

  score = scoreOfCurrentMode();
  showScore();
} catch (err) {
  console.error('Per-gamemode score setup failed:', err);
}

if (score.hints = null) {score.hints = 0;}

function showScore() {
    const label = currentMode ? (currentMode.charAt(0).toUpperCase() + currentMode.slice(1)) : 'All';
    document.querySelector('.score').innerHTML = `${label}: Best Streak ${score.wins} | Streak ${score.losses}`;
}

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

  if (score.losses > score.wins) {
    score.wins = score.losses;
  }
  
  resultMsg.textContent = `Time's Up! Streak: ${score.losses} | Best Streak: ${score.wins}`;

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
      if (score.losses > score.wins) score.wins = score.losses;
      score.losses = 0;
      updateScore();
      pickPhrase();
      document.getElementById('userInput').value = '';
      return;
    } 
    if (isCorrect) {
      score.losses++;
      soundWin.play();
      document.getElementById('userInput').value = '';
      pickPhrase();
      updateScore();
    } else {
      if (score.losses > score.wins) {
        score.wins = score.losses;
      }
      score.losses = 0;
      updateScore();
      endGameBlitz(result);
      try {soundJeopardy.pause(); soundJeopardy.currentTime = 0;} catch {error('Unable to stop sound')}
    }
  } else {
    if (!userInput.trim()) {
      invalidErr('INVALID ENTRY'); return;
    }
    delete savedPhrases[currentMode];
    storeSavedPhrases();

    document.getElementById("result").hidden = false;
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
  return text.trim().toLowerCase().replace(/[’‘]/g, "'");
}

function gamemode() {
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
  if (!timerElement) return;

  blitzInterval = setInterval(() => {
    if (currentMode === 'blitz') {
      const elapsedTime = (performance.now() - blitzStartTime) / 1000;
      const timeLeft = Math.max(0, Math.ceil(INITIAL_TIMER_SECONDS - elapsedTime));
      
      timerElement.innerHTML = `Time Left: <b>${timeLeft}s</b>`;
      
      if (timeLeft <= 0) {
        clearInterval(blitzInterval);
        
        const userInput = document.getElementById('userInput').value;
        document.getElementById("result").hidden = false;
        document.getElementById("goAgain").hidden = false;
        document.getElementById("game").hidden = true;

        prevFrench = current.french;
        
        const result = document.querySelector(".result-message");
        const answerElement = document.querySelector(".correct-answer");
        answerElement.textContent = "PHRASE: " + current.french + "\n" +
        "YOUR ANSWER: " + userInput + "\n" +
        "ANSWER: " + current.answers.join(" / ");
        
        if (score.losses < score.wins) {
          score.losses = score.wins;
        }

        result.textContent = "Time's Up!";
        
        score.wins = 0;
        updateScore();
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
  if (currentMode === 'blitz') return;
  
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

document.querySelectorAll('.btn, .theme-btn').forEach(element => {
  element.classList.add('btn-loaded');
});
document.querySelectorAll('.r-btn').forEach(element => {
  element.classList.add('r-btn-loaded');
});
document.getElementById('error').hidden = true;
