async function check() {
    try {
        console.log('Checking Backend Root...');
        const root = await fetch('http://localhost:5000/');
        console.log('Root Status:', root.status);
        const rootText = await root.text();
        console.log('Root Body:', rootText);

        console.log('\nChecking School API...');
        // Corrected URL: /school-by-domain/:domain
        const school = await fetch('http://localhost:5000/api/public/school-by-domain/demo-school-945');
        console.log('School API Status:', school.status);
        if (school.ok) {
            const data = await school.json();
            console.log('School Name:', data.name);
        } else {
            console.log('School API Error:', await school.text());
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
check();
