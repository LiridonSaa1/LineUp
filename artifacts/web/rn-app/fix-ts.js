const fs = require('fs');

const path = 'src/screens/SearchScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `                if (onSearch && queryText) {
                  onSearch(queryText);
                }`;

const replacement = `                setSelectedTreatment(queryText);
                handleSearchTrigger(queryText);`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
console.log('Fixed TS Error!');
