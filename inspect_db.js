const admin = require('firebase-admin');
const serviceAccount = require('./eywodate-c5659-firebase-adminsdk-o9xpc-5e8cecad7f.json');
const { getFirestore } = require('firebase-admin/firestore');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// Connect to 'staging' database as per server.js
const db = getFirestore(admin.app(), 'staging');

async function inspect() {
    console.log('--- Inspecting "eventGroups" collection in "staging" database ---');
    try {
        const snapshot = await db.collection('eventGroups').get();
        console.log(`Found ${snapshot.size} documents.`);

        if (snapshot.empty) {
            console.log('No matching documents.');
            return;
        }

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`\nDocument ID: ${doc.id}`);

            // Check specifically for location data used in script.js
            const loc = data.presentationLocation;
            if (loc && loc.geopoint) {
                console.log(`  - presentationLocation.geopoint: found (Lat: ${loc.geopoint._latitude}, Lng: ${loc.geopoint._longitude})`);
            } else {
                console.log('  - presentationLocation.geopoint: MISSING or INVALID');
                console.log('  - Raw presentationLocation:', JSON.stringify(loc, null, 2));
            }

            // Log other relevant fields to help identify the event
            console.log(`  - Title (de): ${data.presentationTitle?.de}`);
            console.log(`  - Organizer: ${data.eventOrganizer}`);
        });

    } catch (err) {
        console.error('Error getting documents', err);
    }
}

inspect();
