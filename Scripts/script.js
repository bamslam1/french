const msg = document.querySelector(".phrase");
let isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}

let serverTime = null;

async function getServerTime() {
  try {
    const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
    serverTime = new Date(res.headers.get('Date'));
  } catch {
    serverTime = null;
    error('Cannot fetch date');
  };
}

getServerTime();

let prevFrench = null;

let pressedStartCount = load('frenchStartPressed', 0);
let score = load('frenchScore', null) || {
  wins: 0,
  losses: 0
};

const allPhrases = [
  { french: "Bonjour",             answers: ["hello", "hi", "good morning"] },
  { french: "Merci",               answers: ["thank you", "thanks"] },
  { french: "Au revoir",           answers: ["goodbye", "bye"] },
  { french: "S'il vous plaît",     answers: ["please"] },
  { french: "Comment ça va?",      answers: ["how are you?", "how are you"] },
  { french: "Je ne comprends pas", answers: ["i don't understand", "i do not understand"] },
  { french: "Je suis désolé",      answers: ["i am sorry", "i'm sorry", "sorry"] },
  { french: "Je t'aime",           answers: ["i love you"] },
  { french: "Excusez-moi",         answers: ["excuse me"] },
  { french: "Je m'appelle Tom",    answers: ["my name is tom"] },
  { french: "Salut",                       answers: ["hi", "hey", "hello"] },
  { french: "Bonsoir",                     answers: ["good evening"] },
  { french: "Bonne nuit",                  answers: ["good night"] },
  { french: "Bonne journée",               answers: ["have a good day", "have a nice day", "good day"] },
  { french: "À bientôt",                   answers: ["see you soon"] },
  { french: "À demain",                    answers: ["see you tomorrow"] },
  { french: "Bienvenue",                   answers: ["welcome"] },
  { french: "De rien",                     answers: ["you're welcome", "you are welcome", "it's nothing", "it is nothing"] },
  { french: "Merci beaucoup",              answers: ["thank you very much", "thank you so much", "thanks a lot", "thanks so much"] },
  { french: "Oui",                         answers: ["yes"] },
  { french: "Non",                         answers: ["no"] },
  { french: "Peut-être",                   answers: ["maybe", "perhaps"] },
  { french: "D'accord",                    answers: ["okay", "ok", "alright", "all right", "agreed"] },
  { french: "Pas de problème",             answers: ["no problem", "no worries"] },
  { french: "Je ne sais pas",              answers: ["i don't know", "i do not know"] },
  { french: "Je comprends",                answers: ["i understand"] },
  { french: "Parlez-vous anglais?",        answers: ["do you speak english?", "do you speak english"] },
  { french: "Je ne parle pas français",    answers: ["i don't speak french", "i do not speak french"] },
  { french: "Où sont les toilettes?",      answers: ["where are the toilets?", "where are the toilets", "where are the bathrooms?", "where are the bathrooms", "where is the bathroom?", "where is the bathroom"] },
  { french: "Combien ça coûte?",           answers: ["how much does it cost?", "how much does it cost", "how much is it?", "how much is it", "how much is that?", "how much is that"] },
  { french: "Quelle heure est-il?",        answers: ["what time is it?", "what time is it"] },
  { french: "Comment tu t'appelles?",      answers: ["what's your name?", "what's your name", "what is your name?", "what is your name"] },
  { french: "Enchanté",                    answers: ["nice to meet you", "pleased to meet you", "delighted"] },
  { french: "Ça va bien",                  answers: ["i'm doing well", "i am doing well", "i'm fine", "i am fine", "i'm good", "i am good", "it's going well", "it is going well"] },
  { french: "Et vous?",                    answers: ["and you?", "and you"] },
  { french: "Je voudrais un café",         answers: ["i would like a coffee", "i'd like a coffee"] },
  { french: "L'addition, s'il vous plaît", answers: ["the bill, please", "the bill please", "the check, please", "the check please"] },
  { french: "J'ai faim",                   answers: ["i'm hungry", "i am hungry"] },
  { french: "J'ai soif",                   answers: ["i'm thirsty", "i am thirsty"] },
  { french: "Je suis fatigué",             answers: ["i'm tired", "i am tired"] },
  { french: "Je suis perdu",               answers: ["i'm lost", "i am lost"] },
  { french: "Aidez-moi",                   answers: ["help me", "help me!"] },
  { french: "Bon appétit",                 answers: ["enjoy your meal", "enjoy your food", "enjoy", "have a good meal"] },
  { french: "Félicitations",               answers: ["congratulations", "congrats"] },
  { french: "Bonne chance",                answers: ["good luck"] },
  { french: "Joyeux anniversaire",         answers: ["happy birthday"] },
  { french: "Bonne année",                 answers: ["happy new year"] },
  { french: "Santé",                       answers: ["cheers", "to your health"] },
  { french: "Pardon",                      answers: ["pardon", "sorry", "excuse me", "pardon me"] },
  { french: "Comment allez-vous?",                    answers: ["how are you?", "how are you", "how do you do?", "how do you do"] },
  { french: "Je vais bien",                           answers: ["i'm well", "i am well", "i'm fine", "i am fine", "i'm good", "i am good", "i'm doing well", "i am doing well"] },
  { french: "Très bien",                              answers: ["very good", "very well", "great"] },
  { french: "Pas mal",                                answers: ["not bad"] },
  { french: "Comme ci, comme ça",                     answers: ["so-so", "so so", "okay"] },
  { french: "Quoi de neuf?",                          answers: ["what's new?", "what's new", "what is new?", "what is new", "what's up?", "what's up"] },
  { french: "Bien sûr",                               answers: ["of course", "sure", "certainly"] },
  { french: "Exactement",                             answers: ["exactly"] },
  { french: "Pas du tout",                            answers: ["not at all"] },
  { french: "Tant pis",                               answers: ["too bad", "oh well", "never mind"] },
  { french: "C'est vrai",                             answers: ["it's true", "it is true", "that's true", "that is true", "that's right", "that is right"] },
  { french: "C'est faux",                             answers: ["it's false", "it is false", "that's false", "that is false", "that's wrong", "that is wrong"] },
  { french: "Je suis d'accord",                       answers: ["i agree", "i'm in agreement", "i am in agreement"] },
  { french: "Je ne suis pas d'accord",                answers: ["i disagree", "i don't agree", "i do not agree"] },
  { french: "Je ne suis pas sûr",                     answers: ["i'm not sure", "i am not sure"] },
  { french: "Je suis en retard",                      answers: ["i'm late", "i am late"] },
  { french: "Je suis content",                        answers: ["i'm happy", "i am happy", "i'm glad", "i am glad", "i'm pleased", "i am pleased"] },
  { french: "Je suis malade",                         answers: ["i'm sick", "i am sick", "i'm ill", "i am ill"] },
  { french: "J'ai besoin d'aide",                     answers: ["i need help"] },
  { french: "J'ai besoin d'un médecin",               answers: ["i need a doctor"] },
  { french: "J'habite à Paris",                       answers: ["i live in paris"] },
  { french: "Où habitez-vous?",                       answers: ["where do you live?", "where do you live"] },
  { french: "Quel âge as-tu?",                        answers: ["how old are you?", "how old are you"] },
  { french: "Qu'est-ce que c'est?",                   answers: ["what is this?", "what is this", "what is it?", "what is it", "what's this?", "what's this", "what is that?", "what is that", "what's that?", "what's that"] },
  { french: "Pourquoi?",                              answers: ["why", "why?"] },
  { french: "Quand?",                                 answers: ["when", "when?"] },
  { french: "Où?",                                    answers: ["where", "where?"] },
  { french: "Qui?",                                   answers: ["who", "who?"] },
  { french: "Répétez, s'il vous plaît",               answers: ["please repeat", "please repeat that", "repeat, please", "repeat please", "repeat that, please", "repeat that please"] },
  { french: "Parlez plus lentement, s'il vous plaît", answers: ["please speak more slowly", "speak more slowly, please", "speak more slowly please", "please speak slower", "speak slower, please", "speak slower please"] },
  { french: "Je voudrais de l'eau",                   answers: ["i would like water", "i'd like water", "i would like some water", "i'd like some water"] },
  { french: "Une table pour deux",                    answers: ["a table for two"] },
  { french: "C'est délicieux",                        answers: ["it's delicious", "it is delicious", "that's delicious", "that is delicious"] },
  { french: "C'est trop cher",                        answers: ["it's too expensive", "it is too expensive", "that's too expensive", "that is too expensive"] },
  { french: "Je cherche la gare",                     answers: ["i'm looking for the train station", "i am looking for the train station", "i'm looking for the station", "i am looking for the station"] },
  { french: "Tournez à gauche",                       answers: ["turn left"] },
  { french: "Tournez à droite",                       answers: ["turn right"] },
  { french: "Tout droit",                             answers: ["straight ahead", "straight on", "go straight", "straight"] },
  { french: "C'est loin?",                            answers: ["is it far?", "is it far", "is that far?", "is that far"] },
  { french: "Il fait beau",                           answers: ["the weather is nice", "the weather is good", "it's nice out", "it is nice out", "it's nice weather", "it is nice weather"] },
  { french: "Il pleut",                               answers: ["it's raining", "it is raining"] },
  { french: "Il fait froid",                          answers: ["it's cold", "it is cold"] },
  { french: "Il fait chaud",                          answers: ["it's hot", "it is hot", "it's warm", "it is warm"] },
  { french: "Quel temps fait-il?",                    answers: ["what's the weather like?", "what's the weather like", "what is the weather like?", "what is the weather like", "how's the weather?", "how's the weather", "how is the weather?", "how is the weather"] },
  { french: "À tout à l'heure",                       answers: ["see you later", "see you in a bit", "see you shortly"] },
  { french: "À plus tard",                            answers: ["see you later", "until later"] },
  { french: "Bonne soirée",                           answers: ["have a good evening", "have a nice evening", "enjoy your evening"] },
  { french: "Bon week-end",                           answers: ["have a good weekend", "have a nice weekend", "enjoy your weekend"] },
  { french: "Bon voyage",                             answers: ["have a good trip", "have a nice trip", "safe travels", "bon voyage"] },
  { french: "Je vous en prie",                        answers: ["you're welcome", "you are welcome", "go ahead", "after you"] },
  { french: "Aujourd'hui",                            answers: ["today"] },
  { french: "Demain",                                 answers: ["tomorrow"] },
  { french: "Hier",                                   answers: ["yesterday"] },
  { french: "Maintenant",                             answers: ["now"] },
];

let customPhrases = load('customPhrases', []).map(p => ({
  french: p.french,
  answers: Array.isArray(p.answers) ? p.answers : [String(p.answers)]
}));

const easyPhrases = [
  { french: "Bonjour",          answers: ["hello", "hi", "good morning"] },
  { french: "Salut",            answers: ["hi", "hey", "hello"] },
  { french: "Bonsoir",          answers: ["good evening"] },
  { french: "Au revoir",        answers: ["goodbye", "bye"] },
  { french: "Merci",            answers: ["thank you", "thanks"] },
  { french: "S'il vous plaît",  answers: ["please"] },
  { french: "Oui",              answers: ["yes"] },
  { french: "Non",              answers: ["no"] },
  { french: "Pardon",           answers: ["sorry", "pardon", "excuse me"] },

  { french: "Un",               answers: ["one", "1"] },
  { french: "Deux",             answers: ["two", "2"] },
  { french: "Trois",            answers: ["three", "3"] },
  { french: "Quatre",           answers: ["four", "4"] },
  { french: "Cinq",             answers: ["five", "5"] },
  { french: "Six",              answers: ["six", "6"] },
  { french: "Sept",             answers: ["seven", "7"] },
  { french: "Huit",             answers: ["eight", "8"] },
  { french: "Neuf",             answers: ["nine", "9"] },
  { french: "Dix",              answers: ["ten", "10"] },

  { french: "Rouge",            answers: ["red"] },
  { french: "Bleu",             answers: ["blue"] },
  { french: "Vert",             answers: ["green"] },
  { french: "Jaune",            answers: ["yellow"] },
  { french: "Noir",             answers: ["black"] },
  { french: "Blanc",            answers: ["white"] },

  { french: "L'eau",            answers: ["water", "the water"] },
  { french: "Le pain",          answers: ["bread", "the bread"] },
  { french: "Le lait",          answers: ["milk", "the milk"] },
  { french: "Le café",          answers: ["coffee", "the coffee"] },
  { french: "La pomme",         answers: ["apple", "the apple", "an apple"] },
  { french: "Le chat",          answers: ["cat", "the cat", "a cat"] },
  { french: "Le chien",         answers: ["dog", "the dog", "a dog"] },
  { french: "La maison",        answers: ["house", "the house", "a house", "home"] },
  { french: "L'école",          answers: ["school", "the school"] },
  { french: "Le livre",         answers: ["book", "the book", "a book"] },
  { french: "L'ami",            answers: ["friend", "the friend", "a friend"] },
  { french: "La famille",       answers: ["family", "the family"] },
];

const mediumPhrases = [
  { french: "Je suis étudiant",            answers: ["i am a student", "i'm a student"] },
  { french: "Je suis canadien",            answers: ["i am canadian", "i'm canadian"] },
  { french: "Je viens du Canada",          answers: ["i come from canada", "i am from canada", "i'm from canada"] },
  { french: "Je parle anglais",            answers: ["i speak english"] },
  { french: "J'habite ici",                answers: ["i live here"] },
  { french: "Je travaille ici",            answers: ["i work here"] },
  { french: "Je suis en vacances",         answers: ["i am on vacation", "i'm on vacation", "i am on holiday", "i'm on holiday"] },
  { french: "J'aime le chocolat",          answers: ["i like chocolate", "i love chocolate"] },
  { french: "J'aime lire",                 answers: ["i like to read", "i like reading", "i love to read", "i love reading"] },
  { french: "Je veux manger",              answers: ["i want to eat"] },
  { french: "Je veux dormir",              answers: ["i want to sleep"] },
  { french: "J'ai un chien",               answers: ["i have a dog"] },
  { french: "J'ai deux frères",            answers: ["i have two brothers"] },
  { french: "J'ai mal à la tête",          answers: ["i have a headache", "my head hurts", "my head aches"] },
  { french: "Elle est ma sœur",            answers: ["she is my sister", "she's my sister"] },
  { french: "Il est mon ami",              answers: ["he is my friend", "he's my friend"] },
  { french: "Nous sommes amis",            answers: ["we are friends", "we're friends"] },
  { french: "Ils sont contents",           answers: ["they are happy", "they're happy", "they are glad", "they're glad"] },
  { french: "C'est ma maison",             answers: ["it's my house", "it is my house", "this is my house", "that's my house", "that is my house"] },
  { french: "Il est tard",                 answers: ["it's late", "it is late"] },
  { french: "Il est tôt",                  answers: ["it's early", "it is early"] },
  { french: "Il y a un problème",          answers: ["there is a problem", "there's a problem"] },
  { french: "Qu'est-ce que tu fais?",      answers: ["what are you doing?", "what are you doing"] },
  { french: "Où est la gare?",             answers: ["where is the train station?", "where is the train station", "where's the train station?", "where's the train station", "where is the station?", "where is the station", "where's the station?", "where's the station"] },
  { french: "Où est l'hôtel?",             answers: ["where is the hotel?", "where is the hotel", "where's the hotel?", "where's the hotel"] },
  { french: "Le train part à huit heures", answers: ["the train leaves at eight", "the train leaves at 8", "the train leaves at eight o'clock", "the train leaves at 8 o'clock", "the train departs at eight"] },

  { french: "Lundi",                       answers: ["monday"] },
  { french: "Mardi",                       answers: ["tuesday"] },
  { french: "Mercredi",                    answers: ["wednesday"] },
  { french: "Jeudi",                       answers: ["thursday"] },
  { french: "Vendredi",                    answers: ["friday"] },
  { french: "Samedi",                      answers: ["saturday"] },
  { french: "Dimanche",                    answers: ["sunday"] },

  { french: "Le petit déjeuner",           answers: ["breakfast", "the breakfast"] },
  { french: "Le déjeuner",                 answers: ["lunch", "the lunch"] },
  { french: "Le dîner",                    answers: ["dinner", "the dinner", "supper"] },
  { french: "Une bouteille d'eau",         answers: ["a bottle of water", "bottle of water"] },
];

const hardPhrases = [
  { french: "Je n'en peux plus",                                  answers: ["i can't take it anymore", "i cannot take it anymore", "i can't take any more", "i can't do this anymore"] },
  { french: "Il pleut des cordes",                                answers: ["it's raining cats and dogs", "it is raining cats and dogs", "it's pouring", "it is pouring"] },
  { french: "Je n'ai rien à me mettre",                           answers: ["i have nothing to wear", "i've got nothing to wear", "i have nothing to put on"] },
  { french: "Ça ne me dit rien",                                  answers: ["it doesn't ring a bell", "it does not ring a bell", "i don't feel like it", "it doesn't appeal to me"] },
  { french: "Je me suis trompé de chemin",                        answers: ["i took the wrong road", "i took the wrong way", "i went the wrong way", "i got the wrong road"] },
  { french: "Il faut que je parte avant la fin",                  answers: ["i have to leave before the end", "i must leave before the end", "i need to leave before the end"] },
  { french: "Je voudrais que tu viennes avec nous",               answers: ["i would like you to come with us", "i'd like you to come with us", "i want you to come with us"] },
  { french: "Quoi que tu fasses, je serai là",                    answers: ["whatever you do, i will be there", "whatever you do, i'll be there", "no matter what you do, i'll be there", "no matter what you do, i will be there"] },
  { french: "Si j'avais su, je ne serais pas venu",               answers: ["if i had known, i would not have come", "if i had known, i wouldn't have come", "if i'd known, i wouldn't have come"] },
  { french: "Elle a fini par comprendre",                         answers: ["she ended up understanding", "she finally understood", "she eventually understood", "she ended up understanding it"] },
  { french: "Je m'en fiche",                                      answers: ["i don't care", "i do not care", "i couldn't care less", "i could not care less"] },
  { french: "C'est à peine croyable",                             answers: ["it's hardly believable", "it is hardly believable", "it's barely believable", "it is barely believable", "it's hard to believe"] },
  { french: "Je n'ai pas du tout envie d'y aller",                answers: ["i don't feel like going there at all", "i do not feel like going at all", "i don't want to go at all", "i have no desire to go there at all"] },
  { french: "Tu aurais dû me le dire",                            answers: ["you should have told me", "you should have told me that", "you ought to have told me"] },
  { french: "Il a eu beau essayer, il n'a pas réussi",            answers: ["no matter how hard he tried, he did not succeed", "no matter how hard he tried, he didn't succeed", "he tried in vain, he did not succeed", "despite his efforts, he didn't succeed"] },
  { french: "Je ne sais pas de quoi tu parles",                   answers: ["i don't know what you're talking about", "i do not know what you are talking about", "i don't know what you are talking about"] },
  { french: "Ils se sont rendu compte de leur erreur",            answers: ["they realized their mistake", "they realised their mistake", "they realized their error", "they realised their error"] },
  { french: "C'est le moins que je puisse faire",                 answers: ["it's the least i can do", "it is the least i can do", "that's the least i can do", "that is the least i can do"] },
  { french: "On ne peut pas tout avoir",                          answers: ["you can't have everything", "you cannot have everything", "we can't have everything", "one can't have everything"] },
  { french: "Il vaut mieux tard que jamais",                      answers: ["better late than never", "it is better late than never", "it's better late than never"] },
  { french: "Je suis à bout de forces",                           answers: ["i'm exhausted", "i am exhausted", "i have no strength left", "i'm out of strength", "i am out of strength"] },
  { french: "Elle fait comme si de rien n'était",                 answers: ["she acts as if nothing happened", "she's acting as if nothing happened", "she is acting as if nothing happened", "she acts like nothing happened", "she's acting like nothing happened"] },
  { french: "J'ai failli rater mon train",                        answers: ["i almost missed my train", "i nearly missed my train", "i just about missed my train"] },
  { french: "Je ne m'attendais pas à ça",                         answers: ["i wasn't expecting that", "i was not expecting that", "i didn't expect that", "i did not expect that", "i wasn't expecting this", "i was not expecting this"] },
  { french: "Peu importe ce qu'il dit",                           answers: ["it doesn't matter what he says", "it does not matter what he says", "no matter what he says", "whatever he says"] },
  { french: "Il s'agit d'une question de temps",                  answers: ["it's a matter of time", "it is a matter of time", "it's about a question of time", "it is a question of time", "it's a question of time"] },
  { french: "Je me suis levé du pied gauche",                     answers: ["i got up on the wrong side of the bed", "i woke up on the wrong side of the bed", "i got out of bed on the wrong side"] },
  { french: "Il ne manquait plus que ça",                         answers: ["that's all i needed", "that is all i needed", "that's all we needed", "that was all we needed", "that was all that was missing", "just what i needed"] },
  { french: "À quoi bon essayer",                                 answers: ["what's the point of trying", "what is the point of trying", "what's the use of trying", "what is the use of trying", "why bother trying"] },
  { french: "Je tiens à vous remercier",                          answers: ["i want to thank you", "i would like to thank you", "i'd like to thank you", "i really want to thank you"] },
  { french: "Il est de plus en plus difficile de trouver du travail", answers: ["it is more and more difficult to find work", "it's more and more difficult to find work", "it is getting harder and harder to find a job", "it's getting harder and harder to find work", "it's harder and harder to find a job"] },
  { french: "Nous avons dû reporter la réunion",                  answers: ["we had to postpone the meeting", "we had to put off the meeting", "we had to reschedule the meeting"] },
  { french: "Faute de temps, je n'ai pas pu finir",               answers: ["for lack of time, i couldn't finish", "for lack of time, i could not finish", "due to lack of time, i couldn't finish", "for lack of time i couldn't finish", "i couldn't finish for lack of time", "i couldn't finish due to a lack of time"] },
  { french: "Elle est loin d'être bête",                          answers: ["she's far from stupid", "she is far from stupid", "she's far from being stupid", "she is far from being stupid", "she is anything but stupid"] },
  { french: "Tant pis pour lui",                                  answers: ["too bad for him", "that's his loss", "that is his loss", "so much the worse for him", "tough luck for him"] },
  { french: "Il a tout fait pour que ça marche",                  answers: ["he did everything to make it work", "he did everything so that it would work", "he did everything he could to make it work", "he did all he could to make it work"] },
  { french: "Je n'arrive pas à me décider",                       answers: ["i can't make up my mind", "i cannot make up my mind", "i can't decide", "i cannot decide", "i'm unable to decide"] },
  { french: "Rien ne sert de courir, il faut partir à point",     answers: ["slow and steady wins the race", "there's no use running, you have to leave on time", "there is no point in running, you have to leave in time", "it's no use running, you have to start on time"] },
  { french: "Ce n'est pas la peine d'insister",                   answers: ["there's no point in insisting", "there is no point in insisting", "it's not worth insisting", "it is not worth insisting", "there's no use insisting", "it's no use insisting"] },
  { french: "Mieux vaut prévenir que guérir",                     answers: ["prevention is better than cure", "an ounce of prevention is worth a pound of cure", "it's better to prevent than to cure", "it is better to prevent than to cure", "better safe than sorry"] },
];

const seasonal2Phrases = [
{ french: "Joyeux Halloween",                                  answers: ["happy halloween"] },
{ french: "Des bonbons ou un sort",                           answers: ["trick or treat", "candy or a spell", "sweets or a spell"] },
{ french: "Le fantôme",                                       answers: ["ghost", "the ghost", "a ghost"] },
{ french: "La citrouille",                                    answers: ["pumpkin", "the pumpkin", "a pumpkin"] },
{ french: "La sorcière",                                      answers: ["witch", "the witch", "a witch"] },
{ french: "Le squelette",                                     answers: ["skeleton", "the skeleton", "a skeleton"] },
{ french: "La chauve-souris",                                 answers: ["bat", "the bat", "a bat"] },
{ french: "La maison hantée",                                 answers: ["haunted house", "the haunted house", "a haunted house"] },
{ french: "J'ai peur",                                        answers: ["i'm scared", "i am scared", "i'm afraid", "i am afraid"] },
{ french: "Ça fait peur",                                     answers: ["it's scary", "it is scary", "that's scary", "that is scary", "it's frightening", "it is frightening"] },
{ french: "Il y a des toiles d'araignée partout",             answers: ["there are spiderwebs everywhere", "there are spider webs everywhere", "there are cobwebs everywhere"] },
{ french: "Je me suis déguisé en vampire",                    answers: ["i dressed up as a vampire", "i dressed as a vampire", "i disguised myself as a vampire", "i wore a vampire costume"] },
{ french: "Elle porte un costume de sorcière",                answers: ["she's wearing a witch costume", "she is wearing a witch costume", "she's wearing a witch's costume", "she is wearing a witch's costume"] },
{ french: "Quel est ton déguisement?",                        answers: ["what is your costume?", "what's your costume?", "what is your costume", "what's your costume", "what are you dressed as?", "what are you dressed as"] },
{ french: "J'ai sculpté une citrouille",                      answers: ["i carved a pumpkin", "i have carved a pumpkin", "i sculpted a pumpkin"] },
{ french: "Raconte-moi une histoire qui fait peur",           answers: ["tell me a scary story", "tell me a story that is scary", "tell me a frightening story"] },
{ french: "Les portes grincent dans la nuit",                 answers: ["the doors creak in the night", "the doors are creaking in the night", "the doors squeak in the night"] },
{ french: "Ne sors pas seul la nuit d'Halloween",             answers: ["don't go out alone on halloween night", "do not go out alone on halloween night", "don't go out alone on halloween", "do not go out alone on halloween"] },
{ french: "Les enfants sonnent à toutes les portes",          answers: ["the children ring every doorbell", "the kids ring every doorbell", "the children ring at every door", "the kids ring at every door"] },
{ french: "Personne n'ose entrer dans la maison abandonnée",  answers: ["nobody dares to enter the abandoned house", "nobody dares enter the abandoned house", "no one dares to enter the abandoned house", "no one dares enter the abandoned house"] },
];

const seasonalPhrases = [
{ french: "Joyeux Halloween",                                  answers: ["happy halloween"] },
{ french: "Des bonbons ou un sort",                           answers: ["trick or treat", "candy or a spell", "sweets or a spell"] },
{ french: "Le fantôme",                                       answers: ["ghost", "the ghost", "a ghost"] },
{ french: "La citrouille",                                    answers: ["pumpkin", "the pumpkin", "a pumpkin"] },
{ french: "La sorcière",                                      answers: ["witch", "the witch", "a witch"] },
{ french: "Le squelette",                                     answers: ["skeleton", "the skeleton", "a skeleton"] },
{ french: "La chauve-souris",                                 answers: ["bat", "the bat", "a bat"] },
{ french: "La maison hantée",                                 answers: ["haunted house", "the haunted house", "a haunted house"] },
{ french: "J'ai peur",                                        answers: ["i'm scared", "i am scared", "i'm afraid", "i am afraid"] },
{ french: "Ça fait peur",                                     answers: ["it's scary", "it is scary", "that's scary", "that is scary", "it's frightening", "it is frightening"] },
{ french: "Il y a des toiles d'araignée partout",             answers: ["there are spiderwebs everywhere", "there are spider webs everywhere", "there are cobwebs everywhere"] },
{ french: "Je me suis déguisé en vampire",                    answers: ["i dressed up as a vampire", "i dressed as a vampire", "i disguised myself as a vampire", "i wore a vampire costume"] },
{ french: "Elle porte un costume de sorcière",                answers: ["she's wearing a witch costume", "she is wearing a witch costume", "she's wearing a witch's costume", "she is wearing a witch's costume"] },
{ french: "Quel est ton déguisement?",                        answers: ["what is your costume?", "what's your costume?", "what is your costume", "what's your costume", "what are you dressed as?", "what are you dressed as"] },
{ french: "J'ai sculpté une citrouille",                      answers: ["i carved a pumpkin", "i have carved a pumpkin", "i sculpted a pumpkin"] },
{ french: "Raconte-moi une histoire qui fait peur",           answers: ["tell me a scary story", "tell me a story that is scary", "tell me a frightening story"] },
{ french: "Les portes grincent dans la nuit",                 answers: ["the doors creak in the night", "the doors are creaking in the night", "the doors squeak in the night"] },
{ french: "Ne sors pas seul la nuit d'Halloween",             answers: ["don't go out alone on halloween night", "do not go out alone on halloween night", "don't go out alone on halloween", "do not go out alone on halloween"] },
{ french: "Les enfants sonnent à toutes les portes",          answers: ["the children ring every doorbell", "the kids ring every doorbell", "the children ring at every door", "the kids ring at every door"] },
{ french: "Personne n'ose entrer dans la maison abandonnée",  answers: ["nobody dares to enter the abandoned house", "nobody dares enter the abandoned house", "no one dares to enter the abandoned house", "no one dares enter the abandoned house"] },
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
const bgm = new Audio('Sounds/bgm.mp3');
bgm.loop = true;
bgm.volume = 0;
const bgm2 = new Audio('Sounds/bgm2.mp3');
bgm2.loop = true;
bgm2.volume = 0;

const BGM_VOLUME = 0.2;
const FADE_MS = 1500;
let fadeTimer = null;

function fadeTo(target, onDone) {
  clearInterval(fadeTimer);
  const steps = 30;
  const stepMs = FADE_MS / steps;
  const delta = (target - bgm.volume) / steps;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    bgm.volume = Math.min(1, Math.max(0, bgm.volume + delta));
    if (i >= steps) {
      clearInterval(fadeTimer);
      bgm.volume = target;
      if (onDone) onDone();
    }
  }, stepMs);
}

function startBgm() {
  bgm.play().then(() => fadeTo(BGM_VOLUME)).catch(() => {error('Unable to begin bgm playback')});
}

function stopBgm() {
  fadeTo(0, () => {
    bgm.pause();
    bgm.currentTime = 0;
  });
}

function startBgm2() {
  bgm2.play().then(() => fadeTo(BGM_VOLUME)).catch(() => {error('Unable to begin bgm playback')});
}

function stopBgm2() {
  fadeTo(0, () => {
    bgm2.pause();
    bgm2.currentTime = 0;
  });
}

const KEY = "customPhrases";

let backToScreen = 0;

const phrasesByMode = { all: allPhrases, easy: easyPhrases, medium: mediumPhrases, hard: hardPhrases, custom: customPhrases, seasonal: seasonalPhrases, seasonal2: seasonal2Phrases };

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
applyTheme();

function applyTheme() {
  document.body.style.backgroundColor = isDark ? 'rgb(25, 25, 25)' : 'rgb(244, 243, 242)';
  document.body.style.color = isDark ? 'white' : 'black';

  document.querySelectorAll('.move-button').forEach(button => {
    button.style.borderColor = isDark ? 'white' : 'black';
  });

  document.querySelectorAll('.reset-score-button').forEach(button => {
    button.style.backgroundColor = isDark ? 'white' : 'black';
    button.style.color = isDark ? 'black' : 'white';
  });
};

function invalidErr(log) {
  document.querySelector('.submit').hidden = true;
  document.getElementById('userInput').blur();
  setTimeout(() => {
    document.getElementById('userInput').value = '';
    focus();
    document.querySelector('.submit').hidden = false;
    }, 1000);
};

function speak(text = current.french) {
  if (!('speechSynthesis' in window))
  {
    document.getElementById('userInput').value = 'SPEACH UNSUPPORTED';
    invalidErr('SPEACH UNSUPPORTED');
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
  modeScores.easy.wins = 0; modeScores.easy.losses = 0; modeScores.medium.wins = 0; modeScores.medium.losses = 0; modeScores.hard.wins = 0; modeScores.hard.losses = 0; modeScores.all.losses = 0; modeScores.all.wins = 0; modeScores.custom.losses = 0; modeScores.custom.wins = 0; modeScores.seasonal.losses = 0; modeScores.seasonal.wins = 0; modeScores.seasonal2.losses = 0; modeScores.seasonal2.wins = 0; updateScore();
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

  // 1. Check which screens are visible
  const isGameVisible = !document.getElementById("game").hidden;
  const isResultVisible = !document.getElementById("result").hidden;

  // 2. Determine if overlay should be active (Seasonal Mode + Game OR Result screen)
  const shouldShowOverlay = activeMode === 'seasonal' && (isGameVisible || isResultVisible);

  if (shouldShowOverlay) {
    document.body.classList.add('seasonal');
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
    } else {
    document.body.classList.remove('halloween');
    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => b.classList.remove('seasonal'));
    
    document.getElementById('mute').hidden = true;
    stopBgm();
  }
  const shouldShowOverlay2 = activeMode === 'seasonal2' && (isGameVisible || isResultVisible);

  if (shouldShowOverlay2) {
    //////////////////////////// Changes body class
    document.body.classList.add('seasonal2');
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
    } else {
    document.body.classList.remove('seasonal2');
    document.querySelectorAll('.move-button, button, button[type="game"]').forEach(b => b.classList.remove('seasonal2'));
    
    document.getElementById('mute').hidden = true;
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

  document.querySelector('.seasonal2Overlay').hidden = true;
  document.querySelector('.seasonalOverlay').hidden = true;
  document.getElementById('timer-display').hidden = true;
  if (mode === 'seasonal') {
    await getServerTime();
    document.querySelector('.seasonalOverlay').hidden = false;
    document.querySelector('.fillerTop').hidden = false;
  } else if (mode === 'seasonal2') {
    await getServerTime();
    document.querySelector('.seasonal2Overlay').hidden = false;
    document.querySelector('.fillerTop').hidden = false;
  } else { 
    document.querySelector('.fillerTop').hidden = true;
    document.body.classList.remove('seasonal');
  }

  if (mode === 'blitz') {
    document.getElementById('timer-display').textContent = 'Loading...';
    document.getElementById('timer-display').hidden = false;
    blitzStartTime = performance.now();
    startBlitzCountdown();
    soundJeopardy.play();
  }

  let allowed = mode !== 'seasonal';
  if (mode === 'seasonal' && serverTime !== null || mode === 'seasonal2' && serverTime !== null) {
    allowed = serverTime.getFullYear() < 2027 && serverTime.getMonth() === 10;
  }

  if (!allowed) {
    error('This mode is unavailable');
    return;
  };
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
  const MODES = ['all', 'easy', 'medium', 'hard', 'custom', 'seasonal', 'seasonal2'];
  const readJSON = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const num = v => Number(v) || 0;

  const savedScores = readJSON('frenchScores');
  const oldScore = readJSON('frenchScore');
  for (const m of MODES) {
    modeScores[m] = { wins: num(savedScores?.[m]?.wins), losses: num(savedScores?.[m]?.losses) };
  }
  if (!savedScores && oldScore) {
    modeScores.all = { wins: num(oldScore.wins), losses: num(oldScore.losses) };
  }

  const scoreOfCurrentMode = () => (modeScores[currentMode] ??= { wins: 0, losses: 0 });

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
    const label = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    document.querySelector('.score').innerHTML = `${label}: Wins ${score.wins} | Losses ${score.losses}`;

    try {document.querySelector('.allScore').textContent = `Easy: Wins ${modeScores.easy.wins} | Losses ${modeScores.easy.losses}\nMedium: Wins ${modeScores.medium.wins} | Losses ${modeScores.medium.losses}\nHard: Wins ${modeScores.hard.wins} | Losses ${modeScores.hard.losses}\n Custom: Wins ${modeScores.custom.wins} | Losses ${modeScores.custom.losses}\nSeasonal: Wins ${modeScores.seasonal.wins} | Losses ${modeScores.seasonal.losses}\nSeasonal2: Wins ${modeScores.seasonal2.wins} | Losses ${modeScores.seasonal2.losses}`;}
    catch {document.querySelector('.allScore').textContent = `Easy: Wins ${modeScores.easy.wins} | Losses ${modeScores.easy.losses}\nMedium: Wins ${modeScores.medium.wins} | Losses ${modeScores.medium.losses}\nHard: Wins ${modeScores.hard.wins} | Losses ${modeScores.hard.losses}`;}
  };

const originalStartGame = startGame;
  startGame = function (...args) {
    const result = originalStartGame.apply(this, args);
    score = scoreOfCurrentMode();
    showScore();
    return result;
  };

  score = scoreOfCurrentMode();
  showScore();
} catch (err) {
  console.error('Per-gamemode score setup failed:', err);
}

function showScore() {
  document.querySelector('.score').innerHTML = `Wins: ${score.wins} | Losses: ${score.losses}`;
};

function checkAnswer() {
  if (blitzInterval) clearInterval(blitzInterval);

  const userInput = document.getElementById("userInput").value;
  const isCorrect = current.answers.some(a => normalize(a) === normalize(userInput));
  const result = document.querySelector(".result-message");
  const baseMode = currentMode.replace("Listen", "");
  
  if (baseMode === 'blitz') {
    if (!userInput.trim()) {
      pickPhrase(); return;
    } 
    if (isCorrect) {
      score.wins++; pickPhrase(); updateScore();
    } else {
      endGameBlitz(result);
    }
  } else {
    if (!userInput.trim()) {
      invalidErr(); return;
    }
    delete savedPhrases[currentMode];
    storeSavedPhrases();

    document.getElementById("result").hidden = false;
    document.getElementById("goAgain").hidden = true;
    document.getElementById("game").hidden = true;

    checkSeasonal();

    let gif = (baseMode === 'seasonal') 
      ? document.querySelector(isCorrect ? ".sznRightGif" : ".sznWrongGif")
      : document.querySelector(isCorrect ? ".rightGif" : ".wrongGif");

    if (isCorrect) {
      soundWin.play();
      result.textContent = "Correct!";
      result.style.color = "limegreen";
      score.wins++;
    } else {
      soundWrong.play();
      result.textContent = "Incorrect.";
      result.style.color = "red";
      score.losses++;
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
  if (current.answers.length < 2) {
    document.querySelector(".correct-answer").textContent =
    `PHRASE: ${current.french}\nYOUR ANSWER: ${userInput}\nCORRECT ANSWERS: ${current.answers.join(" / ")}`;} else {
      document.querySelector(".correct-answer").textContent =
    `PHRASE: ${current.french}\nYOUR ANSWER: ${userInput}\nCORRECT ANSWER: ${current.answers}`;
    };
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
  }
  score.losses++;
  updateScore();
  pickPhrase();
};

function pickPhrase() {
  let next;
  do {
    next = phrases[Math.floor(Math.random() * phrases.length)];
  } while (next.french === current?.french && phrases.length > 1);
  current = next;
  savedPhrases[currentMode] = current;
  storeSavedPhrases();
  msg.textContent = current.french;
};

function normalize(text) {
  return text.trim().toLowerCase().replace(/[’‘]/g, "'");
};

function gamemode() {
  try {stopBgm();}
  catch {
    try {stopBgm2();}
    catch {
      console.warn("Failed to stop BGM or BGM is inactive");
    }
  }
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

function checkHidden(srpt) {
  console.log(document.querySelector('scoreGroup transitionOut').classList);
  /*if (document.querySelector('scoreGroup transitionOut').classList === 'scoreGroup transitionOut') {
    if (srpt === 'resetAllScore') {
      console.log('if');
      //resetAllScore();
    } else {
      console.log('else');
      //score.wins = 0; score.losses = 0; updateScore();
    }
  }*/
}

let speechRate = load('speechRate', 0.9);
let blitzStartTime = 0;

function startBlitzCountdown() {
  if (blitzInterval) clearInterval(blitzInterval);
  
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
        document.getElementById("goAgain").hidden = true;
        document.getElementById("game").hidden = true;
        
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
