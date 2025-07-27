const fs = require('fs-extra');
const db = require('./db');

function exportToGEXF(outputPath = 'network.gexf') {
  const users = db.getAllUsers();
  const connections = db.getAllConnections();

  let gexf = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.3draft" version="1.3">
  <graph defaultedgetype="undirected" mode="static">
    <nodes>
`;

  for (const user of users) {
    gexf += `      <node id="${user.username}" label="${user.username}" />\n`;
  }

  gexf += `    </nodes>\n    <edges>\n`;

  let edgeId = 0;
  for (const conn of connections) {
    gexf += `      <edge id="${edgeId++}" source="${conn.source}" target="${conn.target}" />\n`;
  }  

  gexf += `    </edges>\n  </graph>\n</gexf>\n`;

  fs.writeFileSync(outputPath, gexf);
  console.log(`📤 Exported network to ${outputPath}`);
}

module.exports = { exportToGEXF };
