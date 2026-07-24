const fs = require('fs');
const path = 'App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add state
if (!content.includes('setSearchSubIds')) {
  content = content.replace(
    'const [searchQuery, setSearchQuery] = React.useState("");',
    'const [searchQuery, setSearchQuery] = React.useState("");\n  const [searchSubIds, setSearchSubIds] = React.useState<string[]>([]);'
  );
}

// Update handleSearch
content = content.replace(
  'const handleSearch = (filters: { query: string; city: string; lat?: number; lng?: number }) => {',
  'const handleSearch = (filters: { query: string; city: string; lat?: number; lng?: number; subIds?: string[] }) => {\n    if (filters.subIds) setSearchSubIds(filters.subIds);'
);

// Update ExploreScreen props
content = content.replace(
  '<ExploreScreen',
  '<ExploreScreen\n                    initialSubIds={searchSubIds}'
);

fs.writeFileSync(path, content);
console.log('App.tsx updated for subIds!');
