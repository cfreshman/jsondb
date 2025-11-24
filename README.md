# auto-json-db

Simple in-memory JSON database with automatic periodic persistence to disk.

## Usage

```javascript
const JsonDB = require('auto-json-db');

const db = new JsonDB('./data.json');

// Use db.data like a regular JavaScript object
db.data.name = 'Alice';
db.data.count = 42;
db.data.items = ['a', 'b', 'c'];

// That's it! Data automatically saves every 5 seconds and on exit
```

Seriously, that's all you need. Just treat `db.data` like a normal object and it persists to disk automatically.

## Installation

```bash
npm install auto-json-db
```

## API

### `new JsonDB(filePath, options)`

Creates a new database instance.

**Parameters:**
- `filePath` (string): Path to JSON file
- `options` (object, optional):
  - `saveInterval` (number): Auto-save interval in milliseconds (default: 5000)

**Example:**
```javascript
const db = new JsonDB('./data.json', { saveInterval: 10000 });
```

### `db.data`

Direct access to the data object. Read and write freely:

```javascript
db.data.myKey = 'myValue';
console.log(db.data.myKey); // 'myValue'
delete db.data.myKey;
```

### `db.flush()`

Force an immediate save to disk:

```javascript
db.data.important = 'data';
db.flush(); // Save right now
```

### `db.close()`

Stop auto-save timer and save one final time:

```javascript
db.close();
```

## How it works

- Data is kept in memory for fast access
- Changes are automatically saved to disk every 5 seconds (configurable)
- Saves are atomic (write to temp file, then rename) to prevent corruption
- On process exit (SIGINT, SIGTERM, or normal exit), data is saved one final time

## License

MIT

