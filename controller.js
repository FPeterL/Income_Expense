const { MongoClient } = require('mongodb');
const redis = require('redis');
const { createClient } = redis;

// MongoDB beállítások
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'Cubix';
let db;

// Redis beállítások
const redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

// Kapcsolódás adatbázishoz és Redis klienshez
const init = async () => {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    console.log('MongoDB kapcsolat létrejött');

    redisClient.on('error', (err) => console.error('Redis hiba:', err));
    console.log('Redis kapcsolat létrejött');
};

// Bevétel hozzáadása
const addIncome = async (title, amount) => {
    if (!db) throw new Error('MongoDB kapcsolat nem inicializálva');

    const newIncome = { title, income: amount, date: new Date() };
    await db.collection('income').insertOne(newIncome);
    console.log(`Bevétel hozzáadva: ${title}, összeg: ${amount}`);

    try {
        await redisClient.incrby('income', amount);
        console.log(`Jövedelem frissítve Redis-ben: ${amount}`);
    } catch (err) {
        console.error('Hiba a Redis jövedelem frissítésekor:', err);
    }
};

// Kiadás hozzáadása
const addExpense = async (title, amount) => {
    if (!db) throw new Error('MongoDB kapcsolat nem inicializálva');

    const newExpense = { title, expense: amount, date: new Date() };
    await db.collection('expense').insertOne(newExpense);
    console.log(`Kiadás hozzáadva: ${title}, összeg: ${amount}`);

    try {
        await redisClient.incrby('expense', amount);
        console.log(`Kiadás frissítve Redis-ben: ${amount}`);
    } catch (err) {
        console.error('Hiba a Redis kiadás frissítésekor:', err);
    }
};

// Redis értékének lekérdezése
const getIncome = async () => {
    return new Promise((resolve, reject) => {
        redisClient.get('income', (err, reply) => {
            if (err) reject(err);
            else resolve(reply ? parseInt(reply) : 0);
        });
    });
};

const getExpense = async () => {
    return new Promise((resolve, reject) => {
        redisClient.get('expense', (err, reply) => {
            if (err) reject(err);
            else resolve(reply ? parseInt(reply) : 0);
        });
    });
};

// Tranzakciók lekérdezése és szűrése dátum alapján
const getTransactions = async (month = null, year = null) => {
    try {
        const query = {};
        
        if (month !== null && year !== null) {
            // Az év és hónap alapján szűrjünk
            const startOfMonth = new Date(year, month, 1); // Az adott hónap első napja
            const endOfMonth = new Date(year, month + 1, 0); // Az adott hónap utolsó napja

            // A `startOfMonth` és `endOfMonth` pontosítva lesz a kezdő és záró dátum
            startOfMonth.setHours(0, 0, 0, 0); // A hónap első napja 00:00:00
            endOfMonth.setHours(23, 59, 59, 999); // Az utolsó nap 23:59:59.999

            // Dátumok pontos szűrése
            query.date = { $gte: startOfMonth, $lte: endOfMonth };
        }

        const incomes = await db.collection('incomes').find(query).toArray();
        const expenses = await db.collection('expenses').find(query).toArray();
        
        return { incomes, expenses };
    } catch (err) {
        console.error('Hiba a tranzakciók lekérésekor:', err);
        throw err;
    }
};

// Inicializálás
init().catch(console.error);

module.exports = { addIncome, addExpense, getIncome, getExpense, getTransactions };
