const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'IT_Infra_ERP_API.postman_collection.json');
const data = fs.readFileSync(p, 'utf8');
const collection = JSON.parse(data);

const trackingItem = {
  name: "Tracking",
  item: [
    {
      name: "Get Live Tracking",
      request: {
        method: "GET",
        header: [
          { key: "Authorization", value: "Bearer {{token}}", type: "text" }
        ],
        url: {
          raw: "{{base_url}}/v1/tracking/live",
          host: ["{{base_url}}"],
          path: ["v1", "tracking", "live"]
        }
      },
      response: []
    }
  ]
};

// Check if Tracking already exists
const existing = collection.item.find(i => i.name === "Tracking");
if (!existing) {
  collection.item.push(trackingItem);
  fs.writeFileSync(p, JSON.stringify(collection, null, 2));
  console.log('Added Tracking to postman collection');
} else {
  console.log('Tracking already in collection');
}
