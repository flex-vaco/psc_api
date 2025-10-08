const getStartEndDatesCurrentMonth = () => {
    const today = new Date();

    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const endDate = new Date(currentYear, currentMonth + 1, 0);

    // Format the start and end dates as strings (YYYY-MM-DD)
    const startDateString = currentYear + '-' + (currentMonth + 1).toString().padStart(2, '0') + '-01';
    const endDateString = currentYear + '-' + (currentMonth + 1).toString().padStart(2, '0') + '-' + endDate.getDate().toString().padStart(2, '0');

    return { monthStartDate: startDateString, monthEndDate: endDateString }
}

const getStartEndDatesCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
    const startDate = new Date(today.setDate(diff));
    const endDate = new Date(today.setDate(diff + 6));
    return { weekStartDate: startDate, weekEndDate: endDate }
}

const getAppConstants = () => {
    return { siteName: 'Vaco Flex Team', supportEmail: 'flex@vacobainary.in' }
}


require('dotenv').config();

const mysql = require('mysql2/promise');

async function getDatabaseSchema(databaseName) {
    
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: databaseName,
    });

    try {
        const [tables] = await connection.query(
            `SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'`,
            [databaseName]
        );

        const schema = {};
        for (const table of tables) {
            const tableName = table.table_name;
            const [columns] = await connection.execute(
                `SELECT column_name, data_type, character_maximum_length, is_nullable, column_key, extra 
                 FROM information_schema.columns 
                 WHERE table_schema = ? AND table_name = ?`,
                [databaseName, tableName]
            );
            schema[tableName] = columns;
        }
        return schema;
    } catch (error) {
        console.error('Error fetching database schema:', error);
        throw error;
    } finally {
        await connection.end();
    }
}

// Usage example
// (async () => {
//     try {
//         const databaseName = process.env.DB_NAME || 'flex_db';
//         const myDatabaseSchema = await getDatabaseSchema(databaseName);
//         const filePath = `${databaseName}_schema.json`;
//         const resultData = JSON.stringify(myDatabaseSchema, null, 2);
//         fs.writeFile(filePath, resultData, (err) => {
//         if (err) {
//             console.error('Error writing file:', err);
//             return;
//         }
//         console.log('Database schema saved to', filePath);
//     });
//     } catch (error) {
//         console.error('Failed to get database schema:', error);
//     }
// })();
 

module.exports={
    getStartEndDatesCurrentMonth,
    getStartEndDatesCurrentWeek,
    getAppConstants
}