const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = 'pat-na2-25f4fcba-7b60-4789-8e3a-d89932240349';

const HUBSPOT_BASE = "https://api.hubspot.com/crm/v3/objects/";


// TODO: ROUTE 1 - Create a new app.get route for the homepage to call your custom object data. Pass this data along to the front-end and create a new pug template in the views folder.

app.get("/", async (req, res) => {
  const endpoint = 'https://api.hubspot.com/crm/v3/objects/2-175832976';
  
  const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    'Content-Type': 'application/json'
  };

  const params = {
    properties: 'name,educational_attainment,current_job',
    limit: 100
  };

  try {
    const response = await axios.get(endpoint, { headers, params });

    // Access results[] array
    const results = response.data.results || [];
    console.log("Fetched applicants array:", JSON.stringify(results, null, 2));

    // Flatten each item for Pug
    const data = results.map(item => ({
      name: item.properties?.name || 'N/A',
      educational_attainment: item.properties?.educational_attainment || 'N/A',
      current_job: item.properties?.current_job || 'N/A'
    }));

    const columns = ['name', 'educational_attainment', 'current_job'];

    res.render('homepage', { data, columns });

  } catch (error) {
    console.error('Error fetching applicants:', error.response?.data || error.message);
    res.status(500).send('Error fetching applicants');
  }
});

// TODO: ROUTE 2 - Create a new app.get route for the form to create or update new custom object data. Send this data along in the next route.

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum"
  });
});

// TODO: ROUTE 3 - Create a new app.post route for the custom objects form to create or update your custom object data. Once executed, redirect the user to the homepage.


app.post("/submit-update", async (req, res) => {
  try {
    console.log("Form values:", req.body);

    // 1️⃣ Create the contact
    const contactResponse = await fetch(`${HUBSPOT_BASE}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
      },
      body: JSON.stringify({
        properties: {
          firstname: req.body.name,
        },
      }),
    });

    const contactData = await contactResponse.json();
    console.log("Contact response:", contactData);

    if (!contactResponse.ok) {
      throw new Error(`Contact creation failed: ${JSON.stringify(contactData)}`);
    }

    const contactId = contactData.id;

    // 2️⃣ Create custom objects and associate them
    for (const obj of CUSTOM_OBJECTS) {
      const value = req.body[obj.property];

      // Create the custom object
      const createObjRes = await fetch(`${HUBSPOT_BASE}/${obj.name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        },
        body: JSON.stringify({
          properties: {
            [obj.property]: value,
          },
        }),
      });

      const objectData = await createObjRes.json();
      console.log(`Created ${obj.name}:`, objectData);

      if (!createObjRes.ok) {
        console.error("Object creation failed:", objectData);
        continue;
      }

      const objectId = objectData.id;

      // 1. Fetch the association type ID 
      // This is often required for custom object associations
      const assocRes = await fetch(
        `https://api.hubapi.com/crm/v3/associations/${obj.name}/contacts/types`,
        {
          headers: {
            Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
            "Content-Type": "application/json",
          },
        }
      );

      const assocData = await assocRes.json();
      if (!assocRes.ok || !assocData.results?.length) {
        console.warn(`No association type found for ${obj.name}:`, JSON.stringify(assocData));
        continue;
      }

      // Use the ID property from the first result (default association type)
      const associationTypeId = assocData.results[0].id;
      console.log(`Association type ID for ${obj.name}:`, associationTypeId);

      // 2. Associate the object with the contact
      // The V3 URL structure requiring the association ID in the path for PUT
const assocUrl = `${HUBSPOT_BASE}/objects/${obj.name}/${objectId}/associations/contacts/${contactId}`;

      const assocPut = await fetch(assocUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
          "Content-Type": "application/json", // Reintroduce Content-Type since we have a body
        },
        // 2. 🎯 FIX: Pass the associationTypeId in the body
        body: JSON.stringify({
          associationTypeId: associationTypeId
        }),
      });

      if (!assocPut.ok) {
        // Log the status and body for precise debugging
        const text = await assocPut.text();
        console.error(`Association failed for ${obj.name} (Status ${assocPut.status}):`, text);
      } else {
        console.log(`Associated ${obj.name} with contact ${contactId}`);
      }
    }

    res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      message: "✅ Contact and custom objects successfully created and associated!",
    });
  } catch (error) {
    console.error("❌ Error creating contact or associating objects:", error);
    res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      message:
        "❌ Failed to create contact and associate custom objects. Check server console for details.",
    });
  }
});

/** 
* * This is sample code to give you a reference for how you should structure your calls. 

* * App.get sample
app.get('/contacts', async (req, res) => {
    const contacts = 'https://api.hubspot.com/crm/v3/objects/contacts';
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    }
    try {
        const resp = await axios.get(contacts, { headers });
        const data = resp.data.results;
        res.render('contacts', { title: 'Contacts | HubSpot APIs', data });      
    } catch (error) {
        console.error(error);
    }
});

* * App.post sample
app.post('/update', async (req, res) => {
    const update = {
        properties: {
            "favorite_book": req.body.newVal
        }
    }

    const email = req.query.email;
    const updateContact = `https://api.hubapi.com/crm/v3/objects/contacts/${email}?idProperty=email`;
    const headers = {
        Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
        'Content-Type': 'application/json'
    };

    try { 
        await axios.patch(updateContact, update, { headers } );
        res.redirect('back');
    } catch(err) {
        console.error(err);
    }

});
*/


// * Localhost
app.listen(3000, () => console.log('Listening on http://localhost:3000'));