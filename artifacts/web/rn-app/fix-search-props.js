const fs = require('fs');
const path = 'src/screens/SearchScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add subIds to SearchScreenProps
content = content.replace(
  'time?: string;',
  'time?: string;\n    subIds?: string[];'
);

// Add subIds to handleSearchTrigger
content = content.replace(
  'time: selectedTime',
  'time: selectedTime,\n      subIds: selectedSubIds'
);

fs.writeFileSync(path, content);
console.log('Updated SearchScreen props and payload for subIds!');
