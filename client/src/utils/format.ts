export const formatDateTime = (dateString: string | Date) => {
    if (!dateString) return '';
    
    // Since the backend already adds +6:30 and saves it as local time,
    // we simply display the components as they are.
    const date = new Date(dateString);
    
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');

    return `${d}/${m}/${y} ${h}:${min}`;
};

export const getMyanmarNow = () => {
    return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Yangon'
    }).format(new Date());
};

export const combineDateWithMyanmarTime = (dateOnly: string) => {
    if (!dateOnly) return new Intl.DateTimeFormat('en-CA', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Yangon'
    }).format(new Date());

    // Backend now handles attaching Myanmar time, so we just send the date part
    return dateOnly.split('T')[0];
};
