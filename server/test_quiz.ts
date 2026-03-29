import { generateQuiz } from './src/agents/quizGenerator.js';

async function test() {
    try {
        const res = await generateQuiz({
            poiName: "Colosseo",
            poiDescription: "Anfiteatro romano",
            hiddenFact: "Sotto c'era un animato lago artificiale",
            shortStory: "Storia",
            category: "storia",
            count: 2,
            userInterests: ["storia"],
            mode: "visual"
        });
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error(err);
    }
}

test();
