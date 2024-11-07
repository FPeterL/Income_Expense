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

    const connectDB = async () => {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(dbName);
    console.log('MongoDB kapcsolat létrejött');
};

// Bevétel hozzáadása
    const addIncome = async (title, amount) => {
    if (!db) {
        throw new Error('MongoDB kapcsolat nem inicializálva');
    }

    // Bevétel mező
    const newIncome = { title, income: amount, date: new Date() }; 
    await db.collection('income').insertOne(newIncome);
    console.log(`Bevétel hozzáadva: ${title}, összeg: ${amount}`);

    // Redis jövedelem frissítése
    try {
        await redisClient.incrby('income', amount); 
        console.log(`Jövedelem frissítve Redis-ben: ${amount}`);
    } catch (err) {
        console.error('Hiba a Redis jövedelem frissítésekor:', err);
    }
};

    // Kiadás hozzáadása
    const addExpense = async (title, amount) => {
    if (!db) {
        throw new Error('MongoDB kapcsolat nem inicializálva');
    }

    // Kiadás mező
    const newExpense = { title, expense: amount, date: new Date() }; a
    await db.collection('expense').insertOne(newExpense);
    console.log(`Kiadás hozzáadva: ${title}, összeg: ${amount}`);

    // Redis kiadás frissítése
    try {
        await redisClient.decrby('expense', amount); // Csökkentjük az összeget
        console.log(`Kiadás frissítve Redis-ben: -${amount}`);
    } catch (err) {
        console.error('Hiba a Redis kiadás frissítésekor:', err);
    }
};

    // Redis értékének lekérdezése
    const getIncome = async () => {
        return new Promise((resolve, reject) => {
            redisClient.get('income', (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply ? parseInt(reply) : 0); 
                }
            });
        });
    };

    const getExpense = async () => {
        return new Promise((resolve, reject) => {
            redisClient.get('expense', (err, reply) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(reply ? parseInt(reply) : 0); 
                }
            });
        });
    };

    const getTransactions = async (month = null, year = null) => {
        try {
            const query = {};

            if (month !== null && year !== null) {
                const startOfMonth = new Date(year, month, 1);
                const endOfMonth = new Date(year, month + 1, 0);
                startOfMonth.setHours(0, 0, 0, 0);
                endOfMonth.setHours(23, 59, 59, 999);

                query.date = { $gte: startOfMonth, $lte: endOfMonth };
            }

        // Javítás a gyűjteményneveknél
    const incomes = await db.collection('income').find(query).toArray();
    const expenses = await db.collection('expense').find(query).toArray();

    return { incomes, expenses };
    } catch (err) {
            console.error('Hiba a tranzakciók lekérésekor:', err);
    throw err;
    }
};

    // Kapcsolódás adatbázishoz és Redis klienshez
    const init = async () => {
        await connectDB();
        redisClient.on('error', (err) => console.error('Redis hiba:', err));
        console.log('Redis kapcsolat létrejött');
    };

init().catch(console.error);

// A modul exportálása
module.exports = { connectDB, addIncome, addExpense, getIncome, getExpense, getTransactions };
