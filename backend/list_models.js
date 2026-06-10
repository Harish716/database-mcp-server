const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI('AIzaSyDGP3imxBV5p7yatPqOrtxN44bnQyk08CI');
    try {
        // Wait, @google/generative-ai doesn't have a direct list models function exposed easily in the v0.21 SDK without using the REST API.
        // I will just use fetch to hit the REST API directly.
    } catch(e) {}
}

async function fetchModels() {
    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyDGP3imxBV5p7yatPqOrtxN44bnQyk08CI');
    const data = await res.json();
    console.log(JSON.stringify(data.models.map(m => m.name), null, 2));
}

fetchModels();
