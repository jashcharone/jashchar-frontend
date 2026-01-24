const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Testing backend endpoint...');
        // Note: This endpoint likely requires authentication, so we expect a 401 or 403, 
        // but a connection refusal would mean the server is down or unreachable.
        const response = await axios.get('http://localhost:5000/api/dashboard/master-admin');
        console.log('Response status:', response.status);
    } catch (error) {
        if (error.response) {
            console.log('Server responded with status:', error.response.status);
        } else if (error.request) {
            console.log('No response received (Network Error):', error.message);
        } else {
            console.log('Error setting up request:', error.message);
        }
    }
}

testEndpoint();
