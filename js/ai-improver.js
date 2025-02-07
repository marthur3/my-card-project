document.addEventListener('DOMContentLoaded', () => {
    const improveButton = document.getElementById('improve-button');
    
    if (improveButton) {
        improveButton.addEventListener('click', handleImprovement);
    }
});

async function handleImprovement() {
    try {
        const textElement = document.querySelector('.card-text');
        if (!textElement) return;

        const currentText = textElement.textContent;
        
        // You would need to replace this with your actual AI service endpoint
        const response = await fetch('YOUR_AI_SERVICE_ENDPOINT', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: currentText })
        });

        const improvedText = await response.json();
        textElement.textContent = improvedText.result;
        
    } catch (error) {
        console.error('Error improving text:', error);
    }
}
