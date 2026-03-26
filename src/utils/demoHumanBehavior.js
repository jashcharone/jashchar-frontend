/**
 * HUMAN BEHAVIOR SIMULATION
 * Adds realistic delays and interaction patterns to the automation.
 */

const MIN_THINKING_TIME = 800;
const MAX_THINKING_TIME = 2500;
const TYPING_SPEED_MS = 50; // ms per character

export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const simulateThinking = async (factor = 1.0) => {
    const delay = Math.floor((Math.random() * (MAX_THINKING_TIME - MIN_THINKING_TIME) + MIN_THINKING_TIME) * factor);
    return wait(delay);
};

export const simulateTyping = async (text) => {
    // Simulate the time it takes to type the text
    const delay = text.length * TYPING_SPEED_MS;
    await wait(delay);
    return text;
};

export const simulateClick = async () => {
    // Short pause before "clicking"
    await wait(300);
    return true;
};

export const simulatePageTransition = async (navigate, path) => {
    await simulateThinking(0.5); // Pause before moving
    if (navigate) {
        navigate(path);
    }
    await wait(1500); // Wait for "load"
};
