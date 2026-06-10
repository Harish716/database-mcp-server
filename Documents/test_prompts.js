require('dotenv').config({ path: './backend/.env' });
const { processPrompt } = require('./backend/ai-service');

async function testPrompt(prompt) {
    console.log(`\n--- Testing: "${prompt}" ---`);
    try {
        const result = await processPrompt('test_session', prompt, 1);
        console.log(`Response:`, result.answer);
    } catch (e) {
        console.error(`Error:`, e.message);
    }
}

async function runTests() {
    await testPrompt("Show me all employees in the IT department.");
    await testPrompt("What is the average working hours of all employees?");
    await testPrompt("Add a new department called 'Quality Assurance'.");
    await testPrompt("Update the employment status of employee ID 1 to 'INACTIVE'.");
    await testPrompt("Delete the announcement with ID 1.");
    console.log("Done testing.");
    process.exit(0);
}

runTests();
