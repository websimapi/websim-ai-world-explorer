export async function getAIData(prompt) {
    const generationPromise = websim.chat.completions.create({
        messages: [
            {
                role: "system",
                content: `You are a creative world-building assistant. Based on the user's prompt, generate a short, evocative title, a one-paragraph immersive description (no more than 3-4 sentences), and a detailed description of an ambient soundscape for that world. Respond ONLY with JSON in the format: {"title": "...", "description": "...", "sound": "..."}.`
            },
            {
                role: "user",
                content: prompt,
            }
        ],
        json: true
    });
    
    // Use a more descriptive prompt for the skybox image
    const imagePrompt = `360-degree equirectangular panorama, immersive view of ${prompt}. photorealistic, epic, detailed, cinematic lighting.`;

    const imagePromise = websim.imageGen({
        prompt: imagePrompt,
        aspect_ratio: "16:9" // Closest to a 2:1 ratio for panoramas
    });

    const [completion, imageResult] = await Promise.all([generationPromise, imagePromise]);

    const data = JSON.parse(completion.content);

    return {
        title: data.title,
        description: data.description,
        sound: data.sound,
        skyboxUrl: imageResult.url
    };
}

