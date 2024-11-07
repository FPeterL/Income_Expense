const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { connectDB, addIncome, addExpense, getIncome, getExpense, getTransactions } = require('./service');

async function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            enableRemoteModule: false, // Távolítsuk el a remote modult, hogy csak preload.js tudja kezelni
            preload: path.join(__dirname, 'preload.js') // Biztosítjuk, hogy a preload.js betöltődik
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(async () => {
    await connectDB(); // Csatlakozunk az adatbázishoz
    createWindow();
});

// IPC események kezelése
ipcMain.handle('add-income', async (event, title, amount) => {
    try {
        return await addIncome(title, amount); // A bevétel hozzáadása
    } catch (error) {
        console.error('Hiba a bevétel hozzáadásakor:', error);
        throw error; 
    }
});

ipcMain.handle('add-expense', async (event, title, amount) => {
    try {
        return await addExpense(title, amount); // A kiadás hozzáadása
    } catch (error) {
        console.error('Hiba a kiadás hozzáadásakor:', error);
        throw error; 
    }
});

ipcMain.handle('get-transactions', async (event, month, year) => {
    console.log(`Szűrés: Hónap: ${month}, Év: ${year}`);
    try {
        const transactions = await getTransactions(month, year); // Objektum nélkül adja át
        return transactions;
    } catch (error) {
        console.error('Hiba a tranzakciók lekérdezésekor:', error);
        throw error;
    }
});


// Takarítás, ha az ablak bezárul
app.on('window-all-closed', () => {
    app.quit();
});
