const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'IT_Infra_ERP_API.postman_collection.json');
const data = fs.readFileSync(p, 'utf8');
const collection = JSON.parse(data);

const dashboardItem = {
  name: "Dashboard",
  item: [
    {
      name: "Get Summary",
      request: {
        method: "GET",
        header: [{ key: "Authorization", value: "Bearer {{token}}", type: "text" }],
        url: { raw: "{{base_url}}/v1/dashboard/summary", host: ["{{base_url}}"], path: ["v1", "dashboard", "summary"] }
      }
    },
    {
      name: "Get Charts",
      request: {
        method: "GET",
        header: [{ key: "Authorization", value: "Bearer {{token}}", type: "text" }],
        url: { raw: "{{base_url}}/v1/dashboard/charts", host: ["{{base_url}}"], path: ["v1", "dashboard", "charts"] }
      }
    }
  ]
};

const existingIdx = collection.item.findIndex(i => i.name === "Dashboard");
if (existingIdx === -1) {
  collection.item.push(dashboardItem);
  console.log('Added Dashboard to collection');
} else {
  // Update it
  collection.item[existingIdx] = dashboardItem;
  console.log('Updated Dashboard in collection');
}

fs.writeFileSync(p, JSON.stringify(collection, null, 2));
