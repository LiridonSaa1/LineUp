const fs = require('fs');
const path = 'src/screens/ProfileScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// The main ScrollView starts with: <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80, paddingTop: 40 }}>
content = content.replace(
  '<ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80, paddingTop: 40 }}>',
  '<ScrollView className="flex-1" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets={false} bounces={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80, paddingTop: 40 }}>'
);

// Also add it to the other ScrollView if it exists
fs.writeFileSync(path, content);
console.log('Fixed ScrollView keyboard insets in ProfileScreen!');
