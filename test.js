const JsonDB = require('./jsondb');

// Create database with 2 second save interval for testing
const db = new JsonDB('./test-data.json', { saveInterval: 2000 });

console.log('Testing JsonDB...\n');

// Test 1: Set values directly
console.log('Setting values...');
db.data.name = 'test';
db.data.count = 0;
db.data.items = ['a', 'b', 'c'];
console.log('Data:', db.data);

// Test 2: Get values directly
console.log('\nGetting values...');
console.log('name:', db.data.name);
console.log('count:', db.data.count);
console.log('items:', db.data.items);

// Test 3: Update values
console.log('\nUpdating count...');
db.data.count++;
console.log('New count:', db.data.count);

// Test 4: Check keys
console.log('\nKeys:', Object.keys(db.data));
console.log('Has "name":', 'name' in db.data);
console.log('Has "missing":', 'missing' in db.data);

// Test 5: Delete
console.log('\nDeleting items...');
delete db.data.items;
console.log('After delete:', db.data);

// Test 6: Wait for auto-save
console.log('\nWaiting 3 seconds for auto-save...');
setTimeout(() => {
  console.log('Auto-save should have happened');
  
  // Test 7: Modify more
  db.data.timestamp = new Date().toISOString();
  console.log('Added timestamp:', db.data.timestamp);
  
  console.log('\nFinal data:', db.data);
  console.log('\nExiting in 2 seconds (will trigger save on exit)...');
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}, 3000);
