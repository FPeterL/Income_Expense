const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // Bevétel hozzáadása
    handleAddIncome: (title, amount) => ipcRenderer.invoke('add-income', title, amount),
    
    // Kiadás hozzáadása
    handleAddExpense: (title, amount) => ipcRenderer.invoke('add-expense', title, amount),
    
    // Tranzakciók lekérdezése, hónap és év szűrésével
    getTransactions: (filter) => ipcRenderer.invoke('get-transactions', filter.month, filter.year),
});
