const express = require('express');
const axios = require('axios');
const app = express();

app.set('view engine', 'pug');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// * Please DO NOT INCLUDE the private app access token in your repo. Don't do this practicum in your normal account.
const PRIVATE_APP_ACCESS = '';

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
    const { name, educational_attainment, current_job } = req.body;

  const payload = {
    properties: {
      name,
      educational_attainment,
      current_job
    }
  };

  const endpoint = "https://api.hubspot.com/crm/v3/objects/2-175832976"; // your Applicants custom object
  const headers = {
    Authorization: `Bearer ${PRIVATE_APP_ACCESS}`,
    "Content-Type": "application/json"
  };

  try {
    const response = await axios.post(endpoint, payload, { headers });
    console.log("Applicant submitted:", response.data);

    // Render the form with a success message
    res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      message: "Applicant submitted successfully!",      
      redirect: true

    });

  } catch (error) {
    console.error("Error submitting applicant:", error.response?.data || error.message);

    // Render the form with an error message
    res.render("updates", {
      title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
      message: "Error submitting applicant. Please try again.",
      redirect: false 

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