require('dotenv').config();
const { processPrompt } = require('./ai-service');

(async () => {
    try {
        console.log("Sending prompt to AI...");
        const res = await processPrompt(1, "Display the employees");
        console.log("\n--- AI RESPONSE ---");
        console.log(res.answer);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
})();
