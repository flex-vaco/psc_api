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

module.exports={
    getStartEndDatesCurrentMonth
}