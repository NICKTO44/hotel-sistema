import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Reservation, Settings, Room } from '../services/api';
import { format } from 'date-fns';

// Sanitiza formatos tipo MM/DD/YYYY → MM/dd/yyyy para compatibilidad con date-fns v3
const sanitizeDateFormat = (fmt: string): string => {
    return (fmt || 'dd/MM/yyyy')
        .replace(/DD/g, 'dd')   // días
        .replace(/YYYY/g, 'yyyy') // año 4 dígitos
        .replace(/YY/g, 'yy');   // año 2 dígitos
};

const safeFormat = (date: Date | string, fmt: string): string => {
    try {
        return format(new Date(date), sanitizeDateFormat(fmt));
    } catch {
        return format(new Date(date), 'dd/MM/yyyy');
    }
};

export const generateInvoicePDF = async (reservation: Reservation, settings: Settings) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const fmt = sanitizeDateFormat(settings.dateFormat);

    // --- Header Section ---
    if (settings.logoBase64) {
        try {
            doc.addImage(settings.logoBase64, 'PNG', 15, 15, 30, 30);
        } catch (e) {
            console.warn('Error loading logo', e);
        }
    }

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(settings.companyName || 'Hotel System', pageWidth - 15, 25, { align: 'right' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(settings.address || '', pageWidth - 15, 32, { align: 'right' });
    doc.text(`Tel: ${settings.phone || ''}`, pageWidth - 15, 37, { align: 'right' });
    doc.text(settings.email || '', pageWidth - 15, 42, { align: 'right' });
    doc.text(settings.website || '', pageWidth - 15, 47, { align: 'right' });

    // --- Invoice Details ---
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 55, pageWidth - 15, 55);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`INVOICE #${reservation.id.slice(0, 8).toUpperCase()}`, 15, 65);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${safeFormat(new Date(), fmt)}`, 15, 72);

    // Guest Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Bill To:', 15, 85);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(reservation.guestName, 15, 92);

    // Stay Details
    const rightColX = pageWidth / 2 + 20;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Stay Details:', rightColX, 85);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Check-in: ${safeFormat(reservation.checkInDate, fmt)}`, rightColX, 92);
    doc.text(`Check-out: ${safeFormat(reservation.checkOutDate, fmt)}`, rightColX, 97);
    doc.text(`Room: ${reservation.roomNumber}`, rightColX, 102);

    // --- Items Table ---
    const nights = Math.max(1, Math.ceil(
        (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    ));
    const pricePerNight = reservation.totalPrice / nights;

    autoTable(doc, {
        startY: 115,
        head: [['Description', 'Qty/Nights', 'Price', 'Total']],
        body: [
            [
                'Accommodation - Room ' + reservation.roomNumber,
                nights,
                `${settings.currencySymbol}${pricePerNight.toFixed(2)}`,
                `${settings.currencySymbol}${reservation.totalPrice.toFixed(2)}`
            ],
        ],
        theme: 'striped',
        headStyles: { fillColor: [66, 66, 66] },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 30, halign: 'right' },
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- Totals ---
    const subtotal = reservation.totalPrice;
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - 50, finalY, { align: 'right' });
    doc.text(`${settings.currencySymbol}${subtotal.toFixed(2)}`, pageWidth - 15, finalY, { align: 'right' });

    doc.text('Tax (18%):', pageWidth - 50, finalY + 7, { align: 'right' });
    doc.text(`${settings.currencySymbol}${tax.toFixed(2)}`, pageWidth - 15, finalY + 7, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', pageWidth - 50, finalY + 15, { align: 'right' });
    doc.text(`${settings.currencySymbol}${total.toFixed(2)}`, pageWidth - 15, finalY + 15, { align: 'right' });

    // --- Footer ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, finalY + 40, { align: 'center' });

    doc.save(`Invoice_${reservation.id.slice(0, 8)}.pdf`);
};

export const generateReservationReportPDF = (reservations: Reservation[], settings: Settings) => {
    const doc = new jsPDF();
    const fmt = sanitizeDateFormat(settings.dateFormat);

    doc.setFontSize(18);
    doc.text('Reservation Report', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${safeFormat(new Date(), fmt)}`, 14, 30);
    doc.text(`Total Reservations: ${reservations.length}`, 14, 36);

    const tableData = reservations.map(r => [
        r.roomNumber,
        r.guestName,
        safeFormat(r.checkInDate, fmt),
        safeFormat(r.checkOutDate, fmt),
        `${settings.currencySymbol}${r.totalPrice.toFixed(2)}`,
        getStatusText(r.status)
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Room', 'Guest', 'Check-In', 'Check-Out', 'Total', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
    });

    doc.save('Reservations_Report.pdf');
};

export const generateGuestListPDF = (guests: any[], settings: Settings) => {
    const doc = new jsPDF();
    const fmt = sanitizeDateFormat(settings.dateFormat);

    doc.setFontSize(18);
    doc.text('Guest List', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${safeFormat(new Date(), fmt)}`, 14, 30);
    doc.text(`Total Guests: ${guests.length}`, 14, 36);

    const tableData = guests.map(g => [
        g.firstName,
        g.lastName,
        g.email,
        g.phone,
        g.identificationNumber
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['First Name', 'Last Name', 'Email', 'Phone', 'ID Number']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
    });

    doc.save('Guests_Report.pdf');
};

export const generateRoomListPDF = (rooms: any[], settings: Settings) => {
    const doc = new jsPDF();
    const fmt = sanitizeDateFormat(settings.dateFormat);

    doc.setFontSize(18);
    doc.text('Room List', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${safeFormat(new Date(), fmt)}`, 14, 30);
    doc.text(`Total Rooms: ${rooms.length}`, 14, 36);

    const tableData = rooms.map(r => [
        r.number,
        r.roomTypeName || 'Standard',
        `${settings.currencySymbol}${r.pricePerNight}`,
        getRoomStatusText(r.status),
        r.floor.toString()
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Number', 'Type', 'Price', 'Status', 'Floor']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
    });

    doc.save('Rooms_Report.pdf');
};

export const generateRoomTypesPDF = (roomTypes: any[], settings: Settings) => {
    const doc = new jsPDF();
    const fmt = sanitizeDateFormat(settings.dateFormat);

    doc.setFontSize(18);
    doc.text('Room Types List', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${safeFormat(new Date(), fmt)}`, 14, 30);
    doc.text(`Total Types: ${roomTypes.length}`, 14, 36);

    const tableData = roomTypes.map(t => [
        t.name,
        t.description || '',
        `${settings.currencySymbol}${t.basePrice}`,
        t.capacity.toString()
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Name', 'Description', 'Base Price', 'Capacity']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
    });

    doc.save('Room_Types_Report.pdf');
};

export const generateHousekeepingReportPDF = (rooms: any[]) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Housekeeping Report', 14, 22);

    doc.setFontSize(10);
    doc.text(`Generated: ${safeFormat(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 30);

    const dirtyRooms = rooms.filter(r => r.status === 2 || r.status === 3 || r.status === 1);
    doc.text(`Total Tasks: ${dirtyRooms.length}`, 14, 36);

    const tableData = dirtyRooms.map((r: any) => [
        r.number,
        r.roomTypeName || 'Standard',
        getRoomStatusText(r.status),
        r.floor.toString(),
        '[   ] Cleaned  [   ] Inspected'
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Room', 'Type', 'Status', 'Floor', 'Checklist']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: { 4: { cellWidth: 80 } }
    });

    doc.save('Housekeeping_Report.pdf');
};

export const generateDailyReportPDF = (reservations: Reservation[], rooms: Room[], settings: Settings) => {
    const doc = new jsPDF();
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const fmt = sanitizeDateFormat(settings.dateFormat);

    doc.setFontSize(18);
    doc.text('Daily Hotel Report', 14, 22);

    doc.setFontSize(10);
    doc.text(`Date: ${safeFormat(today, fmt)}`, 14, 30);

    const arrivals = reservations.filter(r =>
        new Date(r.checkInDate).toISOString().startsWith(todayStr) && r.status === 1
    );
    const departures = reservations.filter(r =>
        new Date(r.checkOutDate).toISOString().startsWith(todayStr) && r.status === 2
    );
    const inHouse = reservations.filter(r => r.status === 2);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 1).length;
    const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : '0';

    doc.text(`Expected Arrivals: ${arrivals.length}`, 14, 40);
    doc.text(`Expected Departures: ${departures.length}`, 70, 40);
    doc.text(`In-House Guests: ${inHouse.length}`, 130, 40);
    doc.text(`Occupancy: ${occupancyRate}%`, 180, 40, { align: 'right' });

    doc.setFontSize(14);
    doc.text('Expected Arrivals', 14, 55);

    const arrivalsData = arrivals.map(r => [r.guestName, r.roomNumber, 'Pending']);
    autoTable(doc, {
        startY: 60,
        head: [['Guest', 'Room', 'Status']],
        body: arrivalsData.length ? arrivalsData : [['No arrivals today', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113] }
    });

    const depY = (doc as any).lastAutoTable.finalY + 15;
    doc.text('Expected Departures', 14, depY);

    const departuresData = departures.map(r => [r.guestName, r.roomNumber, 'Due Out']);
    autoTable(doc, {
        startY: depY + 5,
        head: [['Guest', 'Room', 'Status']],
        body: departuresData.length ? departuresData : [['No departures today', '-', '-']],
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60] }
    });

    doc.save(`Daily_Report_${todayStr}.pdf`);
};

const getStatusText = (status: number) => {
    const statuses = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled'];
    return statuses[status] || 'Unknown';
};

const getRoomStatusText = (status: number) => {
    const statuses = ['Available', 'Occupied', 'Cleaning', 'Maintenance'];
    return statuses[status] || 'Unknown';
};