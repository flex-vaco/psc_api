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

module.exports={
    getStartEndDatesCurrentMonth,
    getStartEndDatesCurrentWeek,
    getAppConstants
}