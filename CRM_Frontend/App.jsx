import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// --- Mock Data ---

// Mock Users (Added Owner role)
const mockUsers = [
    { id: 'u0', name: 'Owner User', role: 'Owner'},
    { id: 'u1', name: 'Admin User', role: 'Admin' },
    { id: 'u2', name: 'Sales Rep A', role: 'Rep' },
    { id: 'u3', name: 'Sales Rep B', role: 'Rep' },
];

// Updated contacts with firstName/lastName and new fields
const initialContacts = [
  { id: 'c1', firstName: 'Alice', lastName: 'Wonderland', email: 'alice@example.com', phone: '123-456-7890', mobilePhone: '111-111-1111', officePhone: null, otherPhone: null, company: 'Wonderland Inc.', tags: ['Lead', 'High Priority'], lead_status: 'Contacted', ownerId: 'u2', contactType: 'Primary', businessAddress: '123 Rabbit Hole Ln', businessCity: 'Fantasy City', businessZip: '12345', notes: [ {id: 'n1', content: 'Initial contact made, interested in website redesign.', timestamp: '2025-04-20T10:30:00Z', author: 'You'}, {id: 'n2', content: 'Follow-up call scheduled for next week.', timestamp: '2025-04-21T11:00:00Z', author: 'You'} ]},
  { id: 'c2', firstName: 'Bob', lastName: 'The Builder', email: 'bob@example.com', phone: '987-654-3210', mobilePhone: null, officePhone: '987-654-3211', otherPhone: null, company: 'Construction Co.', tags: ['Customer', 'Construction'], lead_status: 'Qualified', ownerId: 'u2', contactType: 'Decision Maker', businessAddress: '456 Tool Ave', businessCity: 'Buildville', businessZip: '67890', notes: [ {id: 'n3', content: 'Met Bob at the trade show. Discussed new office build.', timestamp: '2025-04-15T14:00:00Z', author: 'You'} ]},
  { id: 'c3', firstName: 'Charlie', lastName: 'Chaplin', email: 'charlie@example.com', phone: '555-555-5555', mobilePhone: '555-123-4567', officePhone: null, otherPhone: null, company: 'Film Studios', tags: ['Prospect'], lead_status: 'New', ownerId: 'u3', contactType: 'Influencer', businessAddress: null, businessCity: null, businessZip: null, notes: [] },
  { id: 'c4', firstName: 'Diana', lastName: 'Prince', email: 'diana@example.com', phone: '111-222-3333', mobilePhone: null, officePhone: null, otherPhone: null, company: 'Themyscira Exports', tags: ['Lead'], lead_status: 'New', ownerId: null, contactType: 'Primary', businessAddress: '1 Paradise Island', businessCity: 'Themyscira', businessZip: 'N/A', notes: [] },
];

// Added decline_reason field to submissions
const initialDeals = {
  'Prospecting': [
    { id: 'd1', name: 'Website Redesign', contactIds: ['c1'], value: 5000, stage: 'Prospecting', ownerId: 'u2', expectedCloseDate: '2025-05-30', dealType: 'New Business', priority: 'High', nextStep: 'Send proposal by Friday', notes: [
        {id: 'dn1', content: 'Initial discovery call held.', timestamp: '2025-04-22T09:00:00Z', author: 'You'}
    ], submissions: [
        { id: 's1', lender_name: 'Lender A', submission_date: '2025-04-23', status: 'Submitted', approval_date: null, approval_amount: null, approval_term: null, approval_rate: null, stipulations: null, approval_link: null, decline_reason: null },
        { id: 's2', lender_name: 'Lender B', submission_date: '2025-04-24', status: 'Approved', approval_date: '2025-04-25', approval_amount: 4800, approval_term: '12 months', approval_rate: 5.5, stipulations: 'Subject to final review', approval_link: 'https://example.com/approval/123', decline_reason: null },
        { id: 's4', lender_name: 'Lender D', submission_date: '2025-04-26', status: 'Submitted', approval_date: null, approval_amount: null, approval_term: null, approval_rate: null, stipulations: null, approval_link: null, decline_reason: null },
    ]},
    { id: 'd4', name: 'Export Logistics', contactIds: ['c4'], value: 25000, stage: 'Prospecting', ownerId: 'u3', expectedCloseDate: '2025-06-15', dealType: 'New Business', priority: 'Medium', nextStep: 'Follow up call next week', notes: [], submissions: [] },
  ],
  'Qualification': [
    { id: 'd2', name: 'Marketing Campaign', contactIds: ['c3'], value: 12000, stage: 'Qualification', ownerId: 'u3', expectedCloseDate: '2025-05-20', dealType: 'Add-on', priority: 'Medium', nextStep: 'Qualify budget', notes: [], submissions: [
         { id: 's3', lender_name: 'Lender C', submission_date: '2025-04-20', status: 'Declined', approval_date: null, approval_amount: null, approval_term: null, approval_rate: null, stipulations: null, approval_link: null, decline_reason: 'Credit score too low.' },
    ]},
   ],
  'Proposal': [
     { id: 'd3', name: 'New Office Build', contactIds: ['c2', 'c1'], value: 150000, stage: 'Proposal', ownerId: 'u2', expectedCloseDate: '2025-07-01', dealType: 'New Business', priority: 'High', nextStep: 'Review proposal with client', notes: [
         {id: 'dn2', content: 'Proposal sent.', timestamp: '2025-04-19T16:30:00Z', author: 'You'}
     ], submissions: [] },
   ],
  'Negotiation': [], 'Closed Won': [], 'Closed Lost': [],
};

// Flatten initialDeals for easier searching/filtering by contactId
const allDealsFlat = Object.values(initialDeals).flat();

// const initialTasks = []; // Will be fetched from API

// --- Constants ---
const DEAL_STAGES = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Unqualified'];
const USER_ROLES = ['Owner', 'Admin', 'Rep'];
const DEAL_TYPES = ['New Business', 'Add-on', 'Renewal', 'Other'];
const DEAL_PRIORITIES = ['High', 'Medium', 'Low'];
const SUBMISSION_STATUSES = ['Submitted', 'Approved', 'Declined', 'Withdrawn'];
const CONTACT_TYPES = ['Primary', 'Secondary', 'Decision Maker', 'Influencer', 'Billing', 'Technical', 'Other'];

// --- SVG Icons ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const DollarSignIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
const CheckSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const UserCogIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>;
const XCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; // Decline Icon
const RotateCcwIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M3 13a9 9 0 1 0 3-7.7L3 8"/></svg>; // Withdraw Icon (using rotate for now)
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; // Dashboard Icon
const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; // Alert Icon
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>; // Trending Up Icon
const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>; // Upload Icon


// --- UI Components ---
const Button = ({ children, onClick, variant = 'default', size = 'default', className = '', ...props }) => { /* ... */ const baseStyle = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background"; const variants = { default: "bg-blue-600 text-white hover:bg-blue-700/90", destructive: "bg-red-600 text-white hover:bg-red-700/90", outline: "border border-input hover:bg-accent hover:text-accent-foreground", secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300/80", ghost: "hover:bg-accent hover:text-accent-foreground", link: "underline-offset-4 hover:underline text-primary", }; const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-md", icon: "h-10 w-10", }; return ( <button className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`} onClick={onClick} {...props}> {children} </button> ); };
const Input = ({ className = '', ...props }) => { /* ... */ return ( <input className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> ); };
const Textarea = ({ className = '', ...props }) => { /* ... */ return ( <textarea className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} /> ); };
const Select = ({ children, className = '', ...props }) => { /* ... */ return ( <select className={`flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}> {children} </select> ); };
const Label = ({ children, htmlFor, className = '', ...props }) => { /* ... */ return ( <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 mb-1 ${className}`} {...props}> {children} </label> ); };
const Card = ({ children, className = '', ...props }) => { /* Added ...props */ return ( <div className={`rounded-lg border bg-white text-gray-900 shadow-sm ${className}`} {...props}> {children} </div> ); }; // Pass props for onClick etc.
const CardHeader = ({ children, className = '' }) => <div className={`flex flex-col space-y-1.5 p-4 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }) => <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }) => <div className={`p-4 pt-0 ${className}`}>{children}</div>;
const CardFooter = ({ children, className = '' }) => <div className={`flex items-center p-4 pt-0 ${className}`}>{children}</div>;
const Table = ({ children, className = '' }) => <div className="w-full overflow-auto"><table className={`w-full caption-bottom text-sm ${className}`}>{children}</table></div>;
const TableHeader = ({ children, className = '' }) => <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>;
const TableBody = ({ children, className = '' }) => <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>;
const TableRow = ({ children, className = '' }) => { return <tr className={`border-b transition-colors data-[state=selected]:bg-gray-100 ${className}`}>{children}</tr>; };
const TableHead = ({ children, className = '' }) => <th className={`h-12 px-4 text-left align-middle font-medium text-gray-500 [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</th>;
const TableCell = ({ children, className = '' }) => <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>{children}</td>;
const Modal = ({ isOpen, onClose, title, children }) => { /* ... */ if (!isOpen) return null; return ( <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4"> <div className="relative w-full max-w-3xl rounded-lg bg-white p-6 shadow-xl my-8"> {/* Increased max-width */} <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pt-2 pb-2 z-10"> <h2 className="text-xl font-semibold">{title}</h2> <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl leading-none p-1">&times;</button> </div> <div className="max-h-[70vh] overflow-y-auto pr-2">{children}</div> </div> </div> ); };

// --- Helper Functions ---
const formatTimestamp = (isoString) => { if (!isoString) return ''; try { return new Date(isoString).toLocaleString(); } catch (e) { return 'Invalid Date'; } };
const getOwnerName = (ownerId, users) => { if (!ownerId) return <span className="text-gray-500 italic">Unassigned</span>; const owner = users.find(user => user.id === ownerId); return owner ? owner.name : <span className="text-red-500 italic">Unknown User</span>; };
const getContactNameDisplay = (contactIds, contacts) => {
    if (!contactIds || contactIds.length === 0) return <span className="text-gray-500 italic">N/A</span>;
    const firstContactId = contactIds[0];
    const contact = contacts.find(c => c.id === firstContactId);
    let displayName = contact ? `${contact.firstName} ${contact.lastName}` : <span className="text-red-500 italic">Unknown Contact</span>;
    if (contactIds.length > 1) {
        displayName = <>{displayName} (+{contactIds.length - 1})</>;
    }
    return displayName;
};
const getStatusBadgeColor = (status, type = 'lead') => { /* ... */ if (type === 'submission') { switch (status) { case 'Submitted': return 'bg-blue-100 text-blue-800'; case 'Approved': return 'bg-green-100 text-green-800'; case 'Declined': return 'bg-red-100 text-red-800'; case 'Withdrawn': return 'bg-yellow-100 text-yellow-800'; default: return 'bg-gray-100 text-gray-800'; } } else { switch (status) { case 'New': return 'bg-blue-100 text-blue-800'; case 'Contacted': return 'bg-yellow-100 text-yellow-800'; case 'Qualified': return 'bg-green-100 text-green-800'; case 'Unqualified': return 'bg-red-100 text-red-800'; default: return 'bg-gray-100 text-gray-800'; } } };
// Helper to check if a date string is in the past
const isDatePast = (dateString) => {
    if (!dateString) return false;
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set today to the beginning of the day
        const dueDate = new Date(dateString);
        // Handle potential timezone issues by parsing as UTC if no timezone specified
        if (dateString.indexOf('T') === -1) {
             dueDate.setUTCHours(0, 0, 0, 0);
        } else {
             dueDate.setHours(0, 0, 0, 0);
        }
        return dueDate < today;
    } catch (e) {
        console.error("Error parsing date:", dateString, e);
        return false; // Treat invalid dates as not past
    }
};


// --- API Helper Functions ---
const API_BASE_URL = '/api'; // Replace with your actual API base URL if different

// Generic fetch wrapper
async function fetchApi(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Only add Authorization header if it's not a login request and token exists
    if (url !== '/auth/login') {
        const token = localStorage.getItem('authToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401 && url !== '/auth/login') { // Unauthorized
        // Special handling for 401: clear token and redirect to login
        localStorage.removeItem('authToken');
        // This is tricky because fetchApi doesn't control App's state directly.
        // A more robust solution would involve a global event or context to trigger logout.
        // For now, we'll throw an error that the calling component might need to catch
        // and then trigger a navigation to login.
        // Or, the App component's check on load/navigation could handle it.
        console.error("Unauthorized request. Token might be invalid or expired.");
        // window.location.href = '/login'; // Force redirect, not ideal in React
        throw new Error('Unauthorized. Please login again.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network response was not ok and error response is not JSON' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // Handle cases where response might be empty (e.g., 204 No Content for DELETE)
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

// --- Page Components ---

// --- Dashboard Component ---
const DashboardPage = ({ contacts = [], deals = {}, tasks = [] }) => {

    // Calculate Summary Statistics
    const totalContacts = contacts.length;

    const { activeDealsCount, activeDealsValue } = useMemo(() => {
        let count = 0;
        let totalValue = 0;
        for (const stage in deals) {
            if (stage !== 'Closed Won' && stage !== 'Closed Lost') {
                const stageDeals = deals[stage] || [];
                count += stageDeals.length;
                totalValue += stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
            }
        }
        return { activeDealsCount: count, activeDealsValue: totalValue };
    }, [deals]);

    const overdueTasksCount = useMemo(() => {
        return tasks.filter(task =>
            task.status !== 'Completed' && isDatePast(task.dueDate)
        ).length;
    }, [tasks]);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"> {/* Updated grid columns */}
                {/* Total Contacts Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-500">
                            <span>Total Contacts</span>
                            <UsersIcon className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{totalContacts}</p>
                    </CardContent>
                </Card>

                {/* Active Deals Count Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-500">
                            <span>Active Deals</span>
                            <DollarSignIcon className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{activeDealsCount}</p>
                        <p className="text-xs text-gray-500"> (Excl. Closed)</p>
                    </CardContent>
                </Card>

                 {/* Active Deals Value Card */}
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-500">
                            <span>Active Deals Value</span>
                            <TrendingUpIcon className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">${activeDealsValue.toLocaleString()}</p>
                        <p className="text-xs text-gray-500"> (Excl. Closed)</p>
                    </CardContent>
                </Card>


                {/* Overdue Tasks Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-500">
                            <span>Overdue Tasks</span>
                            <AlertCircleIcon className="h-4 w-4 text-red-500" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${overdueTasksCount > 0 ? 'text-red-600' : ''}`}>{overdueTasksCount}</p>
                         <p className="text-xs text-gray-500"> (Pending/In Progress)</p>
                    </CardContent>
                </Card>

                 {/* Placeholder for Customization */}
                 <Card className="md:col-span-2 lg:col-span-4"> {/* Span full width */}
                    <CardHeader>
                        <CardTitle>Dashboard Customization</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-600">More dashboard widgets and customization options coming soon!</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


// Contacts Page Component (now receives props from App)
const ContactsPage = ({ userRole, contacts: initialContactsProp, setContacts: setAppContacts, allDealsFlat }) => { // Renamed props for clarity
    const [contacts, setContactsState] = useState(initialContactsProp); // Local state for contacts page
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false); // Renamed for clarity
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // State for import modal
    const [editingContact, setEditingContact] = useState(null);
    // Updated initial state to include new fields
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', mobilePhone: '', officePhone: '', otherPhone: '', company: '', tags: '', lead_status: 'New', ownerId: null, contactType: CONTACT_TYPES[0], businessAddress: '', businessCity: '', businessZip: '', notes: [] });
    const [newNote, setNewNote] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [associatedDeals, setAssociatedDeals] = useState([]);

    const canManage = userRole === 'Admin' || userRole === 'Owner';
    const availableOwners = useMemo(() => mockUsers.filter(u => u.role === 'Admin' || u.role === 'Rep' || u.role === 'Owner'), []);

    // --- API Calls ---
    const fetchContacts = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/contacts');
            setContactsState(data);
            setAppContacts(data); // Update app-level state as well
        } catch (err) {
            setError(err.message);
            console.error("Failed to fetch contacts:", err);
        } finally {
            setIsLoading(false);
        }
    }, [setAppContacts]);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    const addContact = useCallback(async (contactData) => {
        setIsLoading(true); // Can use a more specific loading state like isAdding
        setError(null);
        try {
            const newContact = await fetchApi('/contacts', {
                method: 'POST',
                body: JSON.stringify(contactData),
            });
            setContactsState(prev => [...prev, newContact]);
            setAppContacts(prev => [...prev, newContact]);
            return newContact;
        } catch (err) {
            setError(err.message);
            console.error("Failed to add contact:", err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [setAppContacts]);

    const updateContact = useCallback(async (contactId, contactData) => {
        setIsLoading(true); // Can use a more specific loading state like isUpdating
        setError(null);
        try {
            const updatedContact = await fetchApi(`/contacts/${contactId}`, {
                method: 'PUT',
                body: JSON.stringify(contactData),
            });
            setContactsState(prev => prev.map(c => c.id === contactId ? updatedContact : c));
            setAppContacts(prev => prev.map(c => c.id === contactId ? updatedContact : c));
            return updatedContact;
        } catch (err) {
            setError(err.message);
            console.error(`Failed to update contact ${contactId}:`, err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [setAppContacts]);

    const deleteContact = useCallback(async (contactId) => {
        setIsLoading(true); // Can use a more specific loading state like isDeleting
        setError(null);
        // Optimistic update (optional, remove if you prefer to wait for API)
        // const originalContacts = [...contacts];
        // setContactsState(prev => prev.filter(c => c.id !== contactId));
        // setAppContacts(prev => prev.filter(c => c.id !== contactId));
        try {
            await fetchApi(`/contacts/${contactId}`, { method: 'DELETE' });
            // Actual update after successful API call (if not doing optimistic update)
             setContactsState(prev => prev.filter(c => c.id !== contactId));
             setAppContacts(prev => prev.filter(c => c.id !== contactId));
            return true; // Indicate success
        } catch (err) {
            setError(err.message);
            console.error(`Failed to delete contact ${contactId}:`, err);
            // Revert optimistic update if it was done
            // setContactsState(originalContacts);
            // setAppContacts(originalContacts.map(c => c)); // Ensure new array for app state
            return false; // Indicate failure
        } finally {
            setIsLoading(false); // Reset specific loading state
        }
    }, [setAppContacts]); // Removed 'contacts' from deps if not using optimistic restore to originalContacts

    // --- Event Handlers ---
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleNoteChange = (e) => { setNewNote(e.target.value); };
    // Updated handleAddNote to use setContacts prop
    const handleAddNote = () => {
        if (!newNote.trim() || !editingContact) return;
        const noteToAdd = { id: `n${Date.now()}`, content: newNote, timestamp: new Date().toISOString(), author: 'You' }; // Simulating local add for now

        // Future: API call to add note to backend, then update local state with response
        const updatedContacts = contacts.map(contact =>
            contact.id === editingContact.id
                ? { ...contact, notes: [...(contact.notes || []), noteToAdd] }
                : contact
        );
        setContactsState(updatedContacts);
        setAppContacts(updatedContacts); // Also update app-level state

        setFormData(prev => ({ ...prev, notes: [...prev.notes, noteToAdd] })); // Update form data for modal
        console.log("Simulating Add Note:", noteToAdd, "to Contact ID:", editingContact.id);
        setNewNote('');
    };

    const openAddContactModal = (contact = null) => { // Renamed for clarity
        setNewNote('');
        if (contact) {
            setEditingContact(contact);
            setFormData({
                ...contact,
                firstName: contact.firstName || '', lastName: contact.lastName || '', tags: contact.tags.join(', '),
                lead_status: contact.lead_status || 'New', ownerId: contact.ownerId || null, notes: contact.notes || [],
                mobilePhone: contact.mobilePhone || '', officePhone: contact.officePhone || '', otherPhone: contact.otherPhone || '',
                contactType: contact.contactType || CONTACT_TYPES[0], businessAddress: contact.businessAddress || '',
                businessCity: contact.businessCity || '', businessZip: contact.businessZip || '',
            });
            const dealsForContact = allDealsFlat.filter(deal => deal.contactIds && deal.contactIds.includes(contact.id));
            setAssociatedDeals(dealsForContact);
        } else {
            setEditingContact(null);
            setFormData({ firstName: '', lastName: '', email: '', phone: '', mobilePhone: '', officePhone: '', otherPhone: '', company: '', tags: '', lead_status: 'New', ownerId: null, contactType: CONTACT_TYPES[0], businessAddress: '', businessCity: '', businessZip: '', notes: [] });
            setAssociatedDeals([]);
        }
        setIsAddContactModalOpen(true); // Use correct state setter
    };
    const closeAddContactModal = () => { setIsAddContactModalOpen(false); setEditingContact(null); setAssociatedDeals([]); }; // Renamed

    // Handlers for Import Modal
    const openImportModal = () => setIsImportModalOpen(true);
    const closeImportModal = () => setIsImportModalOpen(false);

    // Updated handleSubmit to use setContacts prop
    const handleSubmit = async (e) => {
        e.preventDefault();
        const contactPayload = {
            firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone,
            mobilePhone: formData.mobilePhone, officePhone: formData.officePhone, otherPhone: formData.otherPhone,
            company: formData.company, tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            lead_status: formData.lead_status, ownerId: formData.ownerId, contactType: formData.contactType,
            businessAddress: formData.businessAddress, businessCity: formData.businessCity, businessZip: formData.businessZip,
            // Notes might be handled differently, e.g. not sent on create, or only new notes sent
            // For now, let's assume notes are not sent during initial creation/update of contact entity itself
            // notes: formData.notes
        };

        if (editingContact) {
            // updateContact(editingContact.id, contactPayload); // Placeholder for API call
            console.log("Simulating Update Contact API call with:", contactPayload);
            // Optimistic update for now - will be replaced by actual API call logic
            const updatedContactData = { ...editingContact, ...contactPayload, notes: formData.notes }; // Keep existing notes from form
            const updatedContacts = contacts.map(c => c.id === editingContact.id ? updatedContactData : c);
            setContactsState(updatedContacts);
            setAppContacts(updatedContacts);
            closeAddContactModal();
        } else {
            const newContactFromApi = await addContact(contactPayload);
            if (newContactFromApi) {
                // If addContact handles state updates, no need to do it here
                // Otherwise, update state with the response (which includes the ID)
                // For now, addContact updates the state, so this is mainly for closing modal
                console.log("Successfully added contact:", newContactFromApi);
            } else {
                // Error is handled by addContact, but you could show a specific message here if needed
                console.log("Add contact failed, see console for error.");
                // Potentially do not close modal on failure, or show error in modal
                return; // Prevent closing modal if add failed
            }
        }
        closeAddContactModal();
    };

    const handleDelete = async (contactId) => {
        if (window.confirm("Are you sure you want to delete this contact?")) {
            const success = await deleteContact(contactId);
            if (success) {
                console.log("Successfully deleted contact:", contactId);
                // State is updated by deleteContact function
            } else {
                console.log("Delete contact failed, see console for error.");
                // Error is handled by deleteContact
            }
        }
    };

    // Filter contacts based on search term using local contacts state
    const filteredContacts = useMemo(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        if (!lowerCaseSearchTerm) {
            return contacts;
        }
        return contacts.filter(contact =>
            (contact.firstName.toLowerCase() + ' ' + contact.lastName.toLowerCase()).includes(lowerCaseSearchTerm) ||
            contact.email.toLowerCase().includes(lowerCaseSearchTerm) ||
            contact.company.toLowerCase().includes(lowerCaseSearchTerm)
        );
    }, [contacts, searchTerm]);

    // Function to handle clicking the name to edit
    const handleNameClick = (contact) => { if (canManage) { openAddContactModal(contact); } }; // Use correct opener

    // Placeholder function for clicking a deal name
    const handleDealClick = (dealId) => { console.log("Navigate to or open modal for Deal ID:", dealId); alert(`Simulating opening deal details for ID: ${dealId}\n(Actual navigation/modal opening requires more complex state management)`); };

    return (
        <div className="p-6">
             {/* Header: Title, Search, Add/Import Buttons */}
             <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold">Contacts</h1>
                {error && <div className="text-red-500 text-sm">Error: {error}</div>}
                 <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"> {/* Group buttons */}
                    <div className="relative w-full sm:w-64"> <Input type="text" placeholder="Search contacts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <SearchIcon className="text-gray-400" /> </div> </div>
                    {/* Import Button */}
                    <Button onClick={openImportModal} variant="outline" className="w-full sm:w-auto" disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}>
                        <UploadCloudIcon className="mr-2 h-4 w-4" /> Import Leads
                    </Button>
                    {/* Add Contact Button */}
                    <Button onClick={() => openAddContactModal()} className="w-full sm:w-auto" disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}>
                        <PlusIcon className="mr-2" /> Add Contact
                    </Button>
                </div>
             </div>

             {/* Contacts Table Card */}
             <Card>
                 <CardContent>
                     <Table>
                         <TableHeader>
                             <TableRow>
                                 <TableHead>First Name</TableHead>
                                 <TableHead>Last Name</TableHead>
                                 <TableHead>Status</TableHead>
                                 <TableHead>Email</TableHead>
                                 <TableHead>Company</TableHead>
                                 <TableHead>Owner</TableHead>
                                 <TableHead>Tags</TableHead>
                                 <TableHead>Actions</TableHead>
                             </TableRow>
                         </TableHeader>
                         <TableBody>
                            {isLoading && <TableRow><TableCell colSpan="8" className="text-center text-gray-500 py-4">Loading contacts...</TableCell></TableRow>}
                            {!isLoading && !error && filteredContacts.length > 0 ? (
                                 filteredContacts.map((contact) => (
                                     <TableRow key={contact.id}>
                                         <TableCell className="font-medium"> <button onClick={() => handleNameClick(contact)} className={`text-blue-600 hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed`} disabled={!canManage} title={canManage ? "Edit Contact" : "Admin or Owner role required"}> {contact.firstName} </button> </TableCell>
                                         <TableCell> <button onClick={() => handleNameClick(contact)} className={`text-blue-600 hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed`} disabled={!canManage} title={canManage ? "Edit Contact" : "Admin or Owner role required"}> {contact.lastName} </button> </TableCell>
                                         <TableCell> <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(contact.lead_status)}`}> {contact.lead_status || 'N/A'} </span> </TableCell>
                                         <TableCell>{contact.email}</TableCell>
                                         <TableCell>{contact.company}</TableCell>
                                         <TableCell>{getOwnerName(contact.ownerId, mockUsers)}</TableCell>
                                         <TableCell> {(contact.tags || []).map(tag => ( <span key={tag} className="mr-1 mb-1 inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium"> {tag} </span> ))} </TableCell>
                                         <TableCell> <Button variant="ghost" size="sm" className="mr-2" onClick={() => openAddContactModal(contact)} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <EditIcon /> </Button> <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(contact.id)} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <TrashIcon /> </Button> </TableCell>
                                     </TableRow>
                                 ))
                            ) : (
                                !isLoading && !error && <TableRow> <TableCell colSpan="8" className="text-center text-gray-500 py-4"> No contacts found{searchTerm ? ' matching your search' : ''}. </TableCell> </TableRow>
                            )}
                            {!isLoading && error && <TableRow><TableCell colSpan="8" className="text-center text-red-500 py-4">Failed to load contacts: {error}</TableCell></TableRow>}
                         </TableBody>
                     </Table>
                 </CardContent>
             </Card>

             {/* Add/Edit Contact Modal */}
             <Modal isOpen={isAddContactModalOpen} onClose={closeAddContactModal} title={editingContact ? "Edit Contact" : "Add New Contact"}>
                 <form onSubmit={handleSubmit}>
                     {/* Contact Fields - Updated grid layout */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Row 1 */}
                         <div> <Label htmlFor="firstName">First Name</Label> <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required /> </div>
                         <div> <Label htmlFor="lastName">Last Name</Label> <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required /> </div>
                         {/* Row 2 */}
                         <div> <Label htmlFor="email">Email</Label> <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required /> </div>
                         <div> <Label htmlFor="company">Company</Label> <Input id="company" name="company" value={formData.company} onChange={handleInputChange} /> </div>
                         {/* Row 3 */}
                         <div> <Label htmlFor="phone">Main Phone</Label> <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} /> </div>
                         <div> <Label htmlFor="mobilePhone">Mobile Phone</Label> <Input id="mobilePhone" name="mobilePhone" value={formData.mobilePhone} onChange={handleInputChange} /> </div>
                         {/* Row 4 */}
                          <div> <Label htmlFor="officePhone">Office Phone</Label> <Input id="officePhone" name="officePhone" value={formData.officePhone} onChange={handleInputChange} /> </div>
                          <div> <Label htmlFor="otherPhone">Other Phone</Label> <Input id="otherPhone" name="otherPhone" value={formData.otherPhone} onChange={handleInputChange} /> </div>
                         {/* Row 5 */}
                         <div> <Label htmlFor="lead_status">Lead Status</Label> <Select id="lead_status" name="lead_status" value={formData.lead_status} onChange={handleInputChange}> {LEAD_STATUSES.map(status => (<option key={status} value={status}>{status}</option>))} </Select> </div>
                         <div> <Label htmlFor="ownerId">Owner</Label> <Select id="ownerId" name="ownerId" value={formData.ownerId || ''} onChange={handleInputChange} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <option value="">Unassigned</option> {availableOwners.map(user => ( <option key={user.id} value={user.id}>{user.name} ({user.role})</option> ))} </Select> </div>
                         {/* Row 6 */}
                         <div> <Label htmlFor="contactType">Contact Type</Label> <Select id="contactType" name="contactType" value={formData.contactType} onChange={handleInputChange}> {CONTACT_TYPES.map(type => (<option key={type} value={type}>{type}</option>))} </Select> </div>
                          <div className="md:col-span-2"> <Label htmlFor="businessAddress">Business Address</Label> <Input id="businessAddress" name="businessAddress" value={formData.businessAddress} onChange={handleInputChange} /> </div>
                         {/* Row 7 */}
                         <div> <Label htmlFor="businessCity">Business City</Label> <Input id="businessCity" name="businessCity" value={formData.businessCity} onChange={handleInputChange} /> </div>
                         <div> <Label htmlFor="businessZip">Business Zip</Label> <Input id="businessZip" name="businessZip" value={formData.businessZip} onChange={handleInputChange} /> </div>
                         {/* Row 8 */}
                         <div className="md:col-span-2"> <Label htmlFor="tags">Tags (comma-separated)</Label> <Input id="tags" name="tags" value={formData.tags} onChange={handleInputChange} placeholder="e.g., Lead, High Priority" /> </div>
                     </div>

                     {/* Associated Deals Section */}
                     {editingContact && ( <div className="mt-6 pt-4 border-t"> <h3 className="text-lg font-medium mb-3">Associated Deals</h3> <div className="space-y-2 max-h-40 overflow-y-auto pr-1"> {associatedDeals.length === 0 ? ( <p className="text-sm text-gray-500">No associated deals.</p> ) : ( associatedDeals.map(deal => ( <div key={deal.id} className="text-sm p-2 border rounded-md bg-gray-50 flex justify-between items-center"> <button type="button" onClick={() => handleDealClick(deal.id)} className="text-blue-600 hover:underline focus:outline-none" title={`View details for deal: ${deal.name}`}> {deal.name} </button> <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(deal.stage, 'submission')}`}> {deal.stage} </span> </div> )) )} </div> </div> )}
                     {/* Notes Section */}
                     {editingContact && ( <div className="mt-6 pt-4 border-t"> <h3 className="text-lg font-medium mb-3">Notes</h3> <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1"> {(formData.notes || []).length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>} {(formData.notes || []).slice().reverse().map(note => ( <div key={note.id} className="text-sm p-2 border rounded-md bg-gray-50"> <p className="whitespace-pre-wrap">{note.content}</p> <p className="text-xs text-gray-500 mt-1"> {note.author} - {formatTimestamp(note.timestamp)} </p> </div> ))} </div> <div> <Label htmlFor="newNote">Add a Note</Label> <Textarea id="newNote" name="newNote" rows="3" value={newNote} onChange={handleNoteChange} placeholder="Type your note here..." /> <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={handleAddNote} disabled={!newNote.trim() || !canManage} title={!canManage ? "Admin or Owner role required" : ""}> Add Note </Button> </div> </div> )}
                     {/* Modal Footer */}
                     <div className="mt-6 flex justify-end space-x-3 border-t pt-4"> <Button type="button" variant="secondary" onClick={closeAddContactModal}>Cancel</Button> <Button type="submit" disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}>{editingContact ? "Update Contact" : "Add Contact"}</Button> </div>
                 </form>
             </Modal>

             {/* Import Leads Modal */}
             <ImportLeadsModal
                isOpen={isImportModalOpen}
                onClose={closeImportModal}
                userRole={userRole}
             />
        </div>
    );
};

// --- New Import Leads Modal Component ---
const ImportLeadsModal = ({ isOpen, onClose, userRole }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const canManage = userRole === 'Admin' || userRole === 'Owner';

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Basic validation (optional: check file type, size)
            if (file.type !== 'text/csv') {
                alert('Please select a CSV file.');
                return;
            }
            setSelectedFile(file);
            console.log("Selected file:", file.name);
        } else {
            setSelectedFile(null);
        }
    };

    const handleImport = () => {
        if (!selectedFile) {
            alert('Please select a file to import.');
            return;
        }
        // Placeholder for actual import logic
        console.log(`Simulating import of file: ${selectedFile.name}`);
        alert(`Import simulation started for ${selectedFile.name}. Check console for details. (Mapping & processing logic not implemented yet).`);
        // TODO: Add file reading, parsing, mapping, and state update logic here
        onClose(); // Close modal after starting simulation
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import Leads from CSV">
            <div className="space-y-4">
                <p className="text-sm text-gray-600">
                    Select a CSV file to import contacts. Ensure the file has columns like 'firstName', 'lastName', 'email', 'company', etc.
                </p>
                <div>
                    <Label htmlFor="csvFile">CSV File</Label>
                    <Input
                        id="csvFile"
                        name="csvFile"
                        type="file"
                        accept=".csv" // Accept only CSV files
                        onChange={handleFileChange}
                        className="pt-2" // Adjust padding for file input
                    />
                    {selectedFile && (
                        <p className="text-xs text-gray-500 mt-1">Selected: {selectedFile.name}</p>
                    )}
                </div>
                 {/* Placeholder for field mapping UI */}
                 <div className="pt-4 border-t">
                     <h4 className="text-sm font-medium mb-2 text-gray-700">Field Mapping (Coming Soon)</h4>
                     <p className="text-xs text-gray-500">Functionality to map CSV columns to CRM fields will be added here.</p>
                 </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                <Button
                    type="button"
                    onClick={handleImport}
                    disabled={!selectedFile || !canManage}
                    title={!canManage ? "Admin or Owner role required" : (!selectedFile ? "Please select a file" : "Import Leads")}
                >
                    Import Leads (Simulated)
                </Button>
            </div>
        </Modal>
    );
};


// Deals Page Component (now receives props from App)
const DealsPage = ({
    userRole,
    deals: initialDealsProp,
    setDeals: setAppDeals,
    availableContacts,
    // These app-level handlers are now shadowed by component-local API handlers,
    // handleSaveDealChanges: appSaveDealChanges, // This prop will be removed from DealsPage
    // handleAddDealSubmission: appAddDealSubmission, // To be replaced by addDealSubmissionApi
    // handleUpdateSubmissionStatus: appUpdateSubmissionStatus, // To be replaced by updateDealSubmissionApi
    // handleSaveApproval: appSaveApproval, // To be replaced by updateDealSubmissionApi via specific handler
    // handleAddDealNote: appAddDealNote // This was removed
}) => {
    const [dealsState, setDealsState] = useState(initialDealsProp);
    const [isLoading, setIsLoading] = useState(false); // General loading for the page
    const [error, setError] = useState(null);

    const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
    const [newDealData, setNewDealData] = useState({ name: '', value: '', stage: DEAL_STAGES[0], contactIds: availableContacts.length > 0 ? [availableContacts[0].id] : [] });
    const canManage = userRole === 'Admin' || userRole === 'Owner';

    const [selectedDeal, setSelectedDeal] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [submissionToApprove, setSubmissionToApprove] = useState(null);

    const [isDeclineReasonModalOpen, setIsDeclineReasonModalOpen] = useState(false);
    const [submissionToDecline, setSubmissionToDecline] = useState(null);

    const [dealSearchTerm, setDealSearchTerm] = useState('');

    // --- API Calls for Deals ---
    const fetchDeals = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/deals');
            setDealsState(data);
            setAppDeals(data);
        } catch (err) {
            setError(err.message);
            console.error("Failed to fetch deals:", err);
        } finally {
            setIsLoading(false);
        }
    }, [setAppDeals]);

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    const addDeal = useCallback(async (dealData) => {
        setIsLoading(true);
        setError(null);
        try {
            const newDealFromApi = await fetchApi('/deals', {
                method: 'POST',
                body: JSON.stringify(dealData),
            });

            const dealToAdd = {
                ...newDealFromApi,
                notes: newDealFromApi.notes || [],
                submissions: newDealFromApi.submissions || [],
                contactIds: newDealFromApi.contactIds || []
            };

            setDealsState(prevDeals => {
                const updatedStageDeals = [...(prevDeals[dealToAdd.stage] || []), dealToAdd];
                return { ...prevDeals, [dealToAdd.stage]: updatedStageDeals };
            });
            setAppDeals(prevDeals => {
                const updatedStageDeals = [...(prevDeals[dealToAdd.stage] || []), dealToAdd];
                return { ...prevDeals, [dealToAdd.stage]: updatedStageDeals };
            });
            return dealToAdd;
        } catch (err) {
            setError(err.message);
            console.error("Failed to add deal:", err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [setAppDeals]);

    const addDealNoteApi = useCallback(async (dealId, noteContent) => {
        // Consider a more specific loading state like setIsLoadingNote(true)
        setError(null);
        try {
            const newNote = await fetchApi(`/deals/${dealId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ content: noteContent, author: 'You' }), // Assuming author is 'You' for now
            });

            // The API should ideally return the updated deal or the note with its ID and timestamp
            // For now, let's assume newNote is the note object returned by the API.
            // We need to find the deal and add this note to it.

            let updatedDealLocally = null;

            setDealsState(prevDeals => {
                const newDealsState = JSON.parse(JSON.stringify(prevDeals));
                for (const stage in newDealsState) {
                    const dealIndex = newDealsState[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newDealsState[stage][dealIndex];
                        deal.notes = [...(deal.notes || []), newNote];
                        updatedDealLocally = deal;
                        break;
                    }
                }
                return newDealsState;
            });

            setAppDeals(prevAppDeals => {
                const newAppDeals = JSON.parse(JSON.stringify(prevAppDeals));
                 for (const stage in newAppDeals) {
                    const dealIndex = newAppDeals[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newAppDeals[stage][dealIndex];
                        deal.notes = [...(deal.notes || []), newNote];
                        break;
                    }
                }
                return newAppDeals;
            });

            return updatedDealLocally; // Return the locally updated deal or just the newNote
        } catch (err) {
            setError(`Failed to add note: ${err.message}`);
            console.error(`Failed to add note to deal ${dealId}:`, err);
            return null;
        } finally {
            // setIsLoadingNote(false);
        }
    }, [setAppDeals, dealsState]); // Added dealsState to find the deal

    const addDealSubmissionApi = useCallback(async (dealId, submissionData) => {
        // setError(null); // Consider specific loading/error for submissions
        try {
            const newSubmission = await fetchApi(`/deals/${dealId}/submissions`, {
                method: 'POST',
                body: JSON.stringify(submissionData),
            });

            // Assume newSubmission is the submission object returned by the API
            // Update local and app states
            let updatedDealLocally = null;
            setDealsState(prevDeals => {
                const newDealsState = JSON.parse(JSON.stringify(prevDeals));
                for (const stage in newDealsState) {
                    const dealIndex = newDealsState[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newDealsState[stage][dealIndex];
                        deal.submissions = [...(deal.submissions || []), newSubmission];
                        updatedDealLocally = deal;
                        break;
                    }
                }
                return newDealsState;
            });
            setAppDeals(prevAppDeals => {
                const newAppDeals = JSON.parse(JSON.stringify(prevAppDeals));
                for (const stage in newAppDeals) {
                    const dealIndex = newAppDeals[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newAppDeals[stage][dealIndex];
                        deal.submissions = [...(deal.submissions || []), newSubmission];
                        break;
                    }
                }
                return newAppDeals;
            });
            return updatedDealLocally; // Or newSubmission
        } catch (err) {
            setError(`Failed to add submission: ${err.message}`);
            console.error(`Failed to add submission to deal ${dealId}:`, err);
            return null;
        }
    }, [setAppDeals, dealsState]);

    const updateDealSubmissionApi = useCallback(async (dealId, submissionId, dataToUpdate) => {
        // setError(null); // Consider specific loading/error for submissions
        try {
            const updatedSubmission = await fetchApi(`/deals/${dealId}/submissions/${submissionId}`, {
                method: 'PUT',
                body: JSON.stringify(dataToUpdate),
            });

            // Assume updatedSubmission is the submission object returned by the API
            // Update local and app states
            let updatedDealLocally = null;
            setDealsState(prevDeals => {
                const newDealsState = JSON.parse(JSON.stringify(prevDeals));
                for (const stage in newDealsState) {
                    const dealIndex = newDealsState[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newDealsState[stage][dealIndex];
                        const subIndex = deal.submissions.findIndex(s => s.id === submissionId);
                        if (subIndex !== -1) {
                            deal.submissions[subIndex] = updatedSubmission;
                        } else { // If submission somehow not found, add it (though PUT implies existence)
                            deal.submissions = [...(deal.submissions || []), updatedSubmission];
                        }
                        updatedDealLocally = deal;
                        break;
                    }
                }
                return newDealsState;
            });
            setAppDeals(prevAppDeals => {
                const newAppDeals = JSON.parse(JSON.stringify(prevAppDeals));
                for (const stage in newAppDeals) {
                    const dealIndex = newAppDeals[stage].findIndex(d => d.id === dealId);
                    if (dealIndex !== -1) {
                        const deal = newAppDeals[stage][dealIndex];
                        const subIndex = deal.submissions.findIndex(s => s.id === submissionId);
                        if (subIndex !== -1) {
                            deal.submissions[subIndex] = updatedSubmission;
                        } else {
                             deal.submissions = [...(deal.submissions || []), updatedSubmission];
                        }
                        break;
                    }
                }
                return newAppDeals;
            });
            return updatedDealLocally; // Or updatedSubmission
        } catch (err) {
            setError(`Failed to update submission: ${err.message}`);
            console.error(`Failed to update submission ${submissionId} for deal ${dealId}:`, err);
            return null;
        }
    }, [setAppDeals, dealsState]);

    const updateDeal = useCallback(async (dealId, dataToUpdate) => {
        setIsLoading(true);
        setError(null);

        let originalDeal = null;
        let originalStage = null;

        const currentDealsCopy = JSON.parse(JSON.stringify(dealsState));
        for (const stage in currentDealsCopy) {
            const deal = currentDealsCopy[stage].find(d => d.id === dealId);
            if (deal) {
                originalDeal = deal;
                originalStage = stage;
                break;
            }
        }

        if (!originalDeal) {
            const message = `Cannot update deal: Deal with ID ${dealId} not found.`;
            console.error(message);
            setError(message);
            setIsLoading(false);
            return null;
        }

        try {
            const updatedDealFromApi = await fetchApi(`/deals/${dealId}`, {
                method: 'PUT',
                body: JSON.stringify(dataToUpdate),
            });

            const fullyUpdatedDeal = {
                 ...originalDeal,
                 ...updatedDealFromApi,
                 notes: updatedDealFromApi.notes || originalDeal.notes || [],
                 submissions: updatedDealFromApi.submissions || originalDeal.submissions || [],
                 contactIds: updatedDealFromApi.contactIds || originalDeal.contactIds || [],
            };

            const newStage = fullyUpdatedDeal.stage;

            setDealsState(prevDeals => {
                const newDealsState = JSON.parse(JSON.stringify(prevDeals));

                if (originalStage && originalStage !== newStage && newDealsState[originalStage]) {
                    newDealsState[originalStage] = newDealsState[originalStage].filter(d => d.id !== dealId);
                }

                if (!newDealsState[newStage]) {
                    newDealsState[newStage] = [];
                }
                const dealIndexInNewStage = newDealsState[newStage].findIndex(d => d.id === dealId);
                if (dealIndexInNewStage !== -1) {
                    newDealsState[newStage][dealIndexInNewStage] = fullyUpdatedDeal;
                } else {
                    if (originalStage !== newStage) {
                         newDealsState[newStage].push(fullyUpdatedDeal);
                    } else if (originalStage === newStage && !newDealsState[originalStage].find(d=>d.id === dealId)) {
                        newDealsState[originalStage].push(fullyUpdatedDeal);
                    }
                }
                return newDealsState;
            });

            setAppDeals(currentAppDeals => {
                const newAppDeals = JSON.parse(JSON.stringify(currentAppDeals));
                if (originalStage && originalStage !== newStage && newAppDeals[originalStage]) {
                    newAppDeals[originalStage] = newAppDeals[originalStage].filter(d => d.id !== dealId);
                }
                if (!newAppDeals[newStage]) {
                    newAppDeals[newStage] = [];
                }
                const dealIndexInNewStageApp = newAppDeals[newStage].findIndex(d => d.id === dealId);
                if (dealIndexInNewStageApp !== -1) {
                    newAppDeals[newStage][dealIndexInNewStageApp] = fullyUpdatedDeal;
                } else {
                     if (originalStage !== newStage) {
                        newAppDeals[newStage].push(fullyUpdatedDeal);
                    } else if (originalStage === newStage && !newAppDeals[originalStage].find(d=>d.id === dealId)) {
                        newAppDeals[originalStage].push(fullyUpdatedDeal);
                    }
                }
                return newAppDeals;
            });

            return fullyUpdatedDeal;
        } catch (err) {
            setError(err.message);
            console.error(`Failed to update deal ${dealId}:`, err);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [dealsState, setAppDeals]);

    const deleteDeal = useCallback(async (dealId, dealStage) => {
        setIsLoading(true);
        setError(null);
        try {
            await fetchApi(`/deals/${dealId}`, { method: 'DELETE' });

            setDealsState(prevDeals => {
                const newDeals = { ...prevDeals };
                if (newDeals[dealStage]) {
                    newDeals[dealStage] = newDeals[dealStage].filter(d => d.id !== dealId);
                }
                return newDeals;
            });
            setAppDeals(prevDeals => {
                const newDeals = { ...prevDeals };
                if (newDeals[dealStage]) {
                    newDeals[dealStage] = newDeals[dealStage].filter(d => d.id !== dealId);
                }
                return newDeals;
            });
            return true;
        } catch (err) {
            setError(err.message);
            console.error(`Failed to delete deal ${dealId}:`, err);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [setAppDeals]);


    // --- Add Deal Modal Functions ---
    const openAddDealModal = () => { setNewDealData({ name: '', value: '', stage: DEAL_STAGES[0], contactIds: availableContacts.length > 0 ? [availableContacts[0].id] : [], ownerId: null }); setIsAddDealModalOpen(true); };
    const closeAddDealModal = () => { setIsAddDealModalOpen(false); setError(null); };
    const handleDealInputChange = (e) => { const { name, value } = e.target; setNewDealData(prev => ({ ...prev, [name]: value })); };

    const handleDealSubmit = async (e) => {
        e.preventDefault();
        const dealPayload = {
            ...newDealData,
            value: parseFloat(newDealData.value) || 0,
            ownerId: newDealData.ownerId || null,
            contactIds: Array.isArray(newDealData.contactIds) ? newDealData.contactIds : (newDealData.contactIds ? [newDealData.contactIds] : [])
        };

        const newDealFromApi = await addDeal(dealPayload);

        if (newDealFromApi) {
            closeAddDealModal();
        }
    };

    // --- Delete Deal Function ---
    const handleDeleteDeal = async (dealId, stage) => {
        if (window.confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
            const originalDealsState = JSON.parse(JSON.stringify(dealsState));

            // Optimistic update
            setDealsState(prev => {
                const newState = {...prev};
                if (newState[stage]) {
                    newState[stage] = newState[stage].filter(d => d.id !== dealId);
                }
                return newState;
            });

            const success = await deleteDeal(dealId, stage);

            if (!success) {
                // Revert on failure
                setDealsState(originalDealsState);
                setAppDeals(originalDealsState); // Ensure app state is also reverted
                // Error state is set by deleteDeal
            } else {
                 // deleteDeal already updated appDeals on success
                 console.log(`Deal ${dealId} deleted successfully.`);
            }
        }
    };

    // --- Deal Detail Modal Functions ---
    const openDetailModal = (dealId) => {
        let foundDeal = null;
        for (const stage in dealsState) {
            const deal = dealsState[stage].find(d => d.id === dealId);
            if (deal) {
                foundDeal = deal;
                break;
            }
        }
        if (foundDeal) {
             setSelectedDeal({
                ...foundDeal,
                notes: foundDeal.notes || [],
                submissions: foundDeal.submissions || [],
                contactIds: foundDeal.contactIds || []
             });
             setIsDetailModalOpen(true);
        } else {
            console.error("Deal not found for ID:", dealId);
        }
    };
    const closeDetailModal = () => { setIsDetailModalOpen(false); setSelectedDeal(null); };

   const openApprovalModal = (submission) => { setSubmissionToApprove(submission); setIsApprovalModalOpen(true); };
   const closeApprovalModal = () => { setIsApprovalModalOpen(false); setSubmissionToApprove(null); };
   const openDeclineReasonModal = (submission) => { setSubmissionToDecline(submission); setIsDeclineReasonModalOpen(true); };
   const closeDeclineReasonModal = () => { setIsDeclineReasonModalOpen(false); setSubmissionToDecline(null); };

    const handleDrop = async (e, targetStage) => {
        e.preventDefault();
        const dealId = e.dataTransfer.getData("dealId");
        const sourceStage = e.dataTransfer.getData("sourceStage");
        e.currentTarget.classList.remove('bg-blue-50');

        if (dealId && sourceStage && sourceStage !== targetStage) {
            const originalDealsStateForRollback = JSON.parse(JSON.stringify(dealsState));

            let dealToMove = null;
            const sourceStageDeals = dealsState[sourceStage] || [];
            dealToMove = sourceStageDeals.find(d => d.id === dealId);

            if (!dealToMove) {
                console.error("Deal to move not found for D&D optimistic update.");
                setError("Error moving deal. Please try again.");
                return;
            }

            // Optimistic UI Update
            setDealsState(prevDeals => {
                const newOptimisticDeals = JSON.parse(JSON.stringify(prevDeals));
                newOptimisticDeals[sourceStage] = (newOptimisticDeals[sourceStage] || []).filter(d => d.id !== dealId);
                const movedDealOptimistic = { ...dealToMove, stage: targetStage };
                newOptimisticDeals[targetStage] = [...(newOptimisticDeals[targetStage] || []), movedDealOptimistic];
                return newOptimisticDeals;
            });

            const updatedDealFromApi = await updateDeal(dealId, { stage: targetStage });

            if (!updatedDealFromApi) {
                setError(`Failed to move deal to ${targetStage}. Reverting change.`);
                setDealsState(originalDealsStateForRollback);
                setAppDeals(originalDealsStateForRollback);
            } else {
                console.log(`Deal ${dealId} successfully moved to ${targetStage}.`);
                 // updateDeal already handles setAppDeals on success
            }
        }
    };
    const handleDragStart = (e, dealId, sourceStage) => { e.dataTransfer.setData("dealId", dealId); e.dataTransfer.setData("sourceStage", sourceStage); e.currentTarget.classList.add('opacity-50'); };
    const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); };
    const handleDragLeave = (e) => { e.currentTarget.classList.remove('bg-blue-50'); };
    const handleDragEnd = (e) => { e.currentTarget.classList.remove('opacity-50'); };

   const filteredDeals = useMemo(() => {
       const lowerCaseSearchTerm = dealSearchTerm.toLowerCase();
       if (!lowerCaseSearchTerm) { return dealsState; }
       const result = {};
       for (const stage of DEAL_STAGES) {
           const dealsInStage = (dealsState[stage] || []).filter(deal => deal.name.toLowerCase().includes(lowerCaseSearchTerm) );
           result[stage] = dealsInStage;
       }
       return result;
    }, [dealsState, dealSearchTerm]);


  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
           <h1 className="text-2xl font-semibold">Deals Pipeline</h1>
           {error && <div className="text-red-500 text-sm mb-2">Error: {error}</div>}
           <div className="relative w-full sm:w-64"> <Input type="text" placeholder="Search deals..." value={dealSearchTerm} onChange={(e) => setDealSearchTerm(e.target.value)} className="pl-10"/> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <SearchIcon className="text-gray-400" /> </div> </div>
           <Button onClick={openAddDealModal} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""} className="w-full sm:w-auto"> <PlusIcon className="mr-2" /> Add Deal </Button>
       </div>
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {isLoading && <div className="w-full text-center p-10 text-gray-500">Loading deals...</div>}
        {!isLoading && !error && DEAL_STAGES.map((stage) => (
          <div key={stage} className="bg-gray-100 rounded-lg p-3 w-72 flex-shrink-0 h-full min-h-[300px] transition-colors duration-150"
            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, stage)}>
            <h2 className="font-semibold mb-3 text-gray-700">{stage} ({(filteredDeals[stage] || []).length})</h2>
            <div className="space-y-3">
              {(filteredDeals[stage] || []).map((deal) => (
                <Card
                    key={deal.id}
                    className="bg-white cursor-pointer hover:shadow-md transition-shadow"
                    draggable={canManage}
                    onDragStart={(e) => canManage && handleDragStart(e, deal.id, stage)}
                    onDragEnd={handleDragEnd}
                    title={canManage ? "Click to view details, drag to move" : "Click to view details"}
                >
                  <CardContent className="p-3 relative"> {/* Added relative for positioning delete button */}
                    <div onClick={() => openDetailModal(deal.id)} className="cursor-pointer">
                        <p className="font-medium text-sm">{deal.name}</p>
                        <p className="text-xs text-gray-500">Value: ${deal.value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500"> Contact: {getContactNameDisplay(deal.contactIds, availableContacts)} </p>
                    </div>
                    {canManage && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-1 right-1 text-red-500 hover:text-red-700"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDeal(deal.id, stage);}}
                            title="Delete Deal"
                        >
                            <TrashIcon width="14" height="14" />
                        </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!isLoading && !error && (filteredDeals[stage] || []).length === 0) && ( <div className="text-center text-gray-400 text-sm pt-10"> {dealSearchTerm ? 'No matching deals' : 'Drop deals here'} </div> )}
            </div>
          </div>
        ))}
         {!isLoading && error && <div className="w-full text-center text-red-500 p-10">Failed to load deals: {error}</div>}
      </div>
      <Modal isOpen={isAddDealModalOpen} onClose={closeAddDealModal} title="Add New Deal">
          <form onSubmit={handleDealSubmit}>
              <div className="space-y-4"> <div> <Label htmlFor="dealName">Deal Name</Label> <Input id="dealName" name="name" value={newDealData.name} onChange={handleDealInputChange} required /> </div> <div> <Label htmlFor="dealValue">Value ($)</Label> <Input id="dealValue" name="value" type="number" step="0.01" value={newDealData.value} onChange={handleDealInputChange} placeholder="e.g., 5000" required /> </div> <div> <Label htmlFor="dealStage">Stage</Label> <Select id="dealStage" name="stage" value={newDealData.stage} onChange={handleDealInputChange}> {DEAL_STAGES.map(stage => ((stage !== 'Closed Won' && stage !== 'Closed Lost') && <option key={stage} value={stage}>{stage}</option>))} </Select> </div> <div> <Label htmlFor="contactId">Associated Contact (Select First)</Label> <Select id="contactId" name="contactIds" value={newDealData.contactIds[0] || ''} onChange={(e) => setNewDealData(prev => ({...prev, contactIds: [e.target.value]}))} required> {availableContacts.length === 0 && <option disabled>No contacts available</option>} {availableContacts.map(contact => (<option key={contact.id} value={contact.id}>{contact.firstName} {contact.lastName} ({contact.company || 'N/A'})</option>))} </Select> <p className="text-xs text-gray-500 mt-1">Note: Multi-contact selection UI to be added later.</p></div> </div>
              <div className="mt-6 flex justify-end space-x-3"> <Button type="button" variant="secondary" onClick={closeAddDealModal}>Cancel</Button> <Button type="submit" disabled={isLoading}>Add Deal</Button> </div>
          </form>
      </Modal>

       {selectedDeal && (
            <DealDetailModal
                isOpen={isDetailModalOpen}
                onClose={closeDetailModal}
                deal={selectedDeal}
                availableContacts={availableContacts}
                userRole={userRole}
                addDealNoteApi={addDealNoteApi}
                addDealSubmissionApi={addDealSubmissionApi} // NEW
                updateDealSubmissionApi={updateDealSubmissionApi} // NEW
                onOpenApprovalModal={openApprovalModal} // Keep, as it controls modal visibility in DealsPage
                onOpenDeclineReasonModal={openDeclineReasonModal} // Keep for same reason
                updateDeal={updateDeal}
                // onAddSubmission, onUpdateSubmissionStatus are effectively replaced by the new API functions
            />
        )}

        {submissionToApprove && selectedDeal && (
             <ApprovalEntryModal
                isOpen={isApprovalModalOpen}
                onClose={closeApprovalModal}
                submission={submissionToApprove}
                dealId={selectedDeal.id}
                onSaveApproval={appSaveApproval}
             />
        )}

         {submissionToDecline && selectedDeal && (
             <DeclineReasonModal
                isOpen={isDeclineReasonModalOpen}
                onClose={closeDeclineReasonModal}
                submission={submissionToDecline}
                dealId={selectedDeal.id}
                onSaveDeclineReason={(dealId, submissionId, reason) => appUpdateSubmissionStatus(dealId, submissionId, 'Declined', reason)}
             />
         )}
    </div>
  );
};

// --- Deal Detail Modal Component ---
const DealDetailModal = React.memo(({
    isOpen,
    onClose,
    deal,
    availableContacts,
    userRole,
    addDealNoteApi,
    addDealSubmissionApi, // NEW
    updateDealSubmissionApi, // NEW
    onOpenApprovalModal,
    // onUpdateSubmissionStatus, // REPLACED by updateDealSubmissionApi usage
    onOpenDeclineReasonModal,
    updateDeal
    // onAddSubmission PROP REMOVED
    // onAddNote PROP REMOVED
}) => {
    const [newNote, setNewNote] = useState('');
    const canManage = userRole === 'Admin' || userRole === 'Owner';
    const [newSubmissionData, setNewSubmissionData] = useState({ lender_name: '', submission_date: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});

    useEffect(() => {
        if (deal && isEditing) {
            setEditFormData({
                name: deal.name || '', value: deal.value || '', stage: deal.stage || DEAL_STAGES[0],
                ownerId: deal.ownerId || null, expectedCloseDate: deal.expectedCloseDate || '',
                dealType: deal.dealType || DEAL_TYPES[0], priority: deal.priority || DEAL_PRIORITIES[1], nextStep: deal.nextStep || '',
            });
        }
        if (!isOpen) {
            setIsEditing(false);
        }
    }, [deal?.id, isEditing, isOpen]);


    if (!isOpen || !deal) return null;

    const ownerName = getOwnerName(deal.ownerId, mockUsers);
    const handleContactClick = (contactId) => { console.log("Navigate to or open modal for contact ID:", contactId); alert(`Simulating opening contact details for ID: ${contactId}\n(Actual navigation/modal opening requires more complex state management)`); };
    const handleNoteChange = (e) => { setNewNote(e.target.value); };

    const handleAddNoteClick = async () => {
        if (!newNote.trim() || !addDealNoteApi) return;
        const updatedDeal = await addDealNoteApi(deal.id, newNote);
        if (updatedDeal) {
            // The parent (DealsPage) should update its state, which will flow down
            // and re-render this modal with the updated deal.
            // If selectedDeal state was used here, we'd update it.
            // For now, we rely on prop changes from parent.
            setNewNote('');
        } else {
            // Error handled in addDealNoteApi, but modal could show specific feedback
            console.error("Failed to add note from DealDetailModal");
        }
    };

    const handleSubmissionInputChange = (e) => { const { name, value } = e.target; setNewSubmissionData(prev => ({ ...prev, [name]: value })); };

    const handleAddSubmissionClick = async () => {
        if (!newSubmissionData.lender_name.trim() || !newSubmissionData.submission_date || !addDealSubmissionApi) return;
        const submissionPayload = { ...newSubmissionData, status: 'Submitted' }; // Ensure status is set
        const updatedDeal = await addDealSubmissionApi(deal.id, submissionPayload);
        if (updatedDeal) {
            // Parent (DealsPage) state update should re-render this modal with new submission
            setNewSubmissionData({ lender_name: '', submission_date: '' }); // Clear form
        } else {
            console.error("Failed to add submission from DealDetailModal");
        }
    };

    const approvedSubmissions = useMemo(() => (deal.submissions || []).filter(sub => sub.status === 'Approved'), [deal.submissions]);
    const handleEditInputChange = (e) => { const { name, value } = e.target; setEditFormData(prev => ({ ...prev, [name]: value })); };

    const handleSaveChanges = async () => {
        if (!updateDeal) {
            console.error("updateDeal function not provided to DealDetailModal");
            return;
        }
        const result = await updateDeal(deal.id, editFormData); // Use the new updateDeal prop
        if (result) {
            setIsEditing(false);
            // onClose(); // Consider if modal should close automatically
        } else {
            // Error is likely handled in updateDeal, but can add modal specific feedback
            console.error("Failed to update deal from DealDetailModal.");
        }
    };
    const handleCancelEdit = () => { setIsEditing(false); };

    const handleStatusUpdateClick = async (submissionId, newStatus, declineReason = null) => {
        const submission = (deal.submissions || []).find(sub => sub.id === submissionId);
        if (!submission || !updateDealSubmissionApi) return;

        if (newStatus === 'Declined') {
            onOpenDeclineReasonModal(submission); // This modal will handle the update via its own callback
            return;
        }

        if (newStatus === 'Withdrawn') {
            if (window.confirm("Are you sure you want to mark this submission as Withdrawn?")) {
                const updatedDeal = await updateDealSubmissionApi(deal.id, submissionId, { status: newStatus, decline_reason: null });
                if (!updatedDeal) {
                    console.error("Failed to withdraw submission from DealDetailModal");
                }
                // UI will update due to DealsPage state change
            }
        }
        // Other direct status changes could be handled here if necessary
    };

    // Handler for when ApprovalEntryModal saves data
    const handleSaveSubmissionApproval = async (submissionId, approvalData) => {
        if (!updateDealSubmissionApi) return;
        const payload = { ...approvalData, status: 'Approved', decline_reason: null };
        const updatedDeal = await updateDealSubmissionApi(deal.id, submissionId, payload);
        if (updatedDeal) {
            onOpenApprovalModal(null); // Close modal, assuming onOpenApprovalModal(null) closes it
        } else {
            console.error("Failed to save submission approval from DealDetailModal");
        }
    };

    // Handler for when DeclineReasonModal saves data
    const handleSaveSubmissionDecline = async (submissionId, reason) => {
        if (!updateDealSubmissionApi) return;
        const payload = { status: 'Declined', decline_reason: reason };
        const updatedDeal = await updateDealSubmissionApi(deal.id, submissionId, payload);
        if (updatedDeal) {
            onOpenDeclineReasonModal(null); // Close modal
        } else {
            console.error("Failed to save submission decline reason from DealDetailModal");
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? `Edit Deal: ${deal.name}` : `Deal: ${deal.name}`}>
            <div className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-3"> <h3 className="text-lg font-medium text-gray-800">Deal Details</h3> {!isEditing && canManage && ( <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}> <EditIcon className="mr-1 h-4 w-4" /> Edit </Button> )} </div>
                    {isEditing ? ( <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm p-4 border rounded-md bg-gray-50"> <div> <Label htmlFor="editDealName">Deal Name</Label> <Input id="editDealName" name="name" value={editFormData.name || ''} onChange={handleEditInputChange} required /> </div> <div> <Label htmlFor="editDealValue">Value ($)</Label> <Input id="editDealValue" name="value" type="number" step="0.01" value={editFormData.value || ''} onChange={handleEditInputChange} required /> </div> <div> <Label htmlFor="editDealStage">Stage</Label> <Select id="editDealStage" name="stage" value={editFormData.stage || ''} onChange={handleEditInputChange}> {DEAL_STAGES.map(stage => (<option key={stage} value={stage}>{stage}</option>))} </Select> </div> <div> <Label htmlFor="editDealOwner">Owner</Label> <Select id="editDealOwner" name="ownerId" value={editFormData.ownerId || ''} onChange={handleEditInputChange} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <option value="">Unassigned</option> {mockUsers.filter(u=>u.role !== 'Rep').map(user => ( <option key={user.id} value={user.id}>{user.name} ({user.role})</option> ))} </Select> </div> <div> <Label htmlFor="editCloseDate">Expected Close Date</Label> <Input id="editCloseDate" name="expectedCloseDate" type="date" value={editFormData.expectedCloseDate || ''} onChange={handleEditInputChange} /> </div> <div> <Label htmlFor="editDealType">Deal Type</Label> <Select id="editDealType" name="dealType" value={editFormData.dealType || ''} onChange={handleEditInputChange}> {DEAL_TYPES.map(type => (<option key={type} value={type}>{type}</option>))} </Select> </div> <div> <Label htmlFor="editPriority">Priority</Label> <Select id="editPriority" name="priority" value={editFormData.priority || ''} onChange={handleEditInputChange}> {DEAL_PRIORITIES.map(p => (<option key={p} value={p}>{p}</option>))} </Select> </div> <div className="sm:col-span-2"> <Label htmlFor="editNextStep">Next Step</Label> <Textarea id="editNextStep" name="nextStep" rows={2} value={editFormData.nextStep || ''} onChange={handleEditInputChange} /> </div> </div>
                    ) : ( <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm p-4 border rounded-md bg-gray-50"> <div> <Label className="text-gray-500 font-medium">Deal Name</Label> <p>{deal.name}</p> </div> <div> <Label className="text-gray-500 font-medium">Value</Label> <p>${deal.value.toLocaleString()}</p> </div> <div> <Label className="text-gray-500 font-medium">Stage</Label> <p>{deal.stage}</p> </div> <div> <Label className="text-gray-500 font-medium">Associated Contacts</Label> {(deal.contactIds || []).length > 0 ? ( <div className="flex flex-wrap gap-x-2"> {(deal.contactIds).map((contactId, index) => { const contact = availableContacts.find(c => c.id === contactId); return ( <button key={contactId} onClick={() => handleContactClick(contactId)} className="text-blue-600 hover:underline focus:outline-none" title={`View details for ${contact ? `${contact.firstName} ${contact.lastName}` : 'Unknown'}`}> {contact ? `${contact.firstName} ${contact.lastName}` : <span className="text-red-500 italic">Unknown</span>} {index < deal.contactIds.length - 1 ? ',' : ''} </button> ); })} </div> ) : ( <p className="italic text-gray-500">N/A</p> )} </div> <div> <Label className="text-gray-500 font-medium">Owner</Label> <p>{ownerName}</p> </div> <div> <Label className="text-gray-500 font-medium">Expected Close Date</Label> <p>{deal.expectedCloseDate || 'N/A'}</p> </div> <div> <Label className="text-gray-500 font-medium">Deal Type</Label> <p>{deal.dealType || 'N/A'}</p> </div> <div> <Label className="text-gray-500 font-medium">Priority</Label> <p>{deal.priority || 'N/A'}</p> </div> <div className="sm:col-span-2"> <Label className="text-gray-500 font-medium">Next Step</Label> <p>{deal.nextStep || 'N/A'}</p> </div> </div> )}
                </div>

                 {!isEditing && ( <div className="pt-4 border-t"> <h3 className="text-lg font-medium mb-3 text-gray-800">Submissions</h3> <div className="mb-4 p-3 border rounded-md bg-gray-50"> <h4 className="text-sm font-medium mb-2 text-gray-700">Add New Submission</h4> <div className="flex flex-col sm:flex-row gap-2 items-end"> <div className="flex-grow"> <Label htmlFor="lender_name" className="text-xs">Lender Name</Label> <Input id="lender_name" name="lender_name" value={newSubmissionData.lender_name} onChange={handleSubmissionInputChange} placeholder="Lender Name" /> </div> <div className="w-full sm:w-auto"> <Label htmlFor="submission_date" className="text-xs">Submission Date</Label> <Input id="submission_date" name="submission_date" type="date" value={newSubmissionData.submission_date} onChange={handleSubmissionInputChange} /> </div> <Button type="button" size="sm" onClick={handleAddSubmissionClick} disabled={!newSubmissionData.lender_name.trim() || !newSubmissionData.submission_date || !canManage} title={!canManage ? "Admin or Owner role required" : ""} className="w-full sm:w-auto"> Add </Button> </div> </div> <div className="max-h-48 overflow-y-auto pr-1 border rounded-md"> {(deal.submissions || []).length === 0 ? ( <p className="text-sm text-gray-500 p-3">No submissions yet.</p> ) : ( <Table className="text-xs"> <TableHeader> <TableRow> <TableHead>Lender</TableHead> <TableHead>Date</TableHead> <TableHead>Status</TableHead> <TableHead>Actions</TableHead> </TableRow> </TableHeader> <TableBody> {(deal.submissions || []).map(sub => ( <TableRow key={sub.id}> <TableCell>{sub.lender_name}</TableCell> <TableCell>{sub.submission_date}</TableCell> <TableCell> <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeColor(sub.status, 'submission')}`}> {sub.status} </span> </TableCell> <TableCell className="space-x-1"> {sub.status === 'Submitted' && ( <> <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50 px-1 py-0.5" onClick={() => { /* Now DealDetailModal opens ApprovalEntryModal, which will call back to handleSaveSubmissionApproval */ onOpenApprovalModal(sub); }} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : "Mark as Approved"}> Approve </Button> <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50 px-1 py-0.5" onClick={() => handleStatusUpdateClick(sub.id, 'Declined')} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : "Mark as Declined"}> Decline </Button> <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 px-1 py-0.5" onClick={() => handleStatusUpdateClick(sub.id, 'Withdrawn')} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : "Mark as Withdrawn"}> Withdraw </Button> </> )} {sub.status === 'Declined' && sub.decline_reason && ( <span className="text-gray-500 italic ml-2" title={sub.decline_reason}> (Reason logged)</span> )} </TableCell> </TableRow> ))} </TableBody> </Table> )} </div> </div> )}
                 {!isEditing && ( <div className="pt-4 border-t"> <h3 className="text-lg font-medium mb-3 text-gray-800">Approvals</h3> <div className="max-h-48 overflow-y-auto pr-1 border rounded-md"> {approvedSubmissions.length === 0 ? ( <p className="text-sm text-gray-500 p-3">No approvals yet.</p> ) : ( <Table className="text-xs"> <TableHeader> <TableRow> <TableHead>Lender</TableHead> <TableHead>Date</TableHead> <TableHead>Amount</TableHead> <TableHead>Term</TableHead> <TableHead>Rate (%)</TableHead> <TableHead>Stips</TableHead> <TableHead>Link</TableHead> </TableRow> </TableHeader> <TableBody> {approvedSubmissions.map(sub => ( <TableRow key={sub.id}> <TableCell>{sub.lender_name}</TableCell> <TableCell>{sub.approval_date || 'N/A'}</TableCell> <TableCell>${(sub.approval_amount || 0).toLocaleString()}</TableCell> <TableCell>{sub.approval_term || 'N/A'}</TableCell> <TableCell>{sub.approval_rate !== null ? sub.approval_rate : 'N/A'}</TableCell> <TableCell className="max-w-[150px] truncate" title={sub.stipulations || ''}>{sub.stipulations || 'N/A'}</TableCell> <TableCell> {sub.approval_link ? ( <a href={sub.approval_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={sub.approval_link}> <LinkIcon /> </a> ) : ( 'N/A' )} </TableCell> </TableRow> ))} </TableBody> </Table> )} </div> </div> )}
                 {!isEditing && ( <div className="pt-4 border-t"> <h3 className="text-lg font-medium mb-3 text-gray-800">Notes</h3> <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1"> {(deal.notes || []).length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>} {(deal.notes || []).slice().reverse().map(note => ( <div key={note.id} className="text-sm p-2 border rounded-md bg-gray-50"> <p className="whitespace-pre-wrap">{note.content}</p> <p className="text-xs text-gray-500 mt-1"> {note.author} - {formatTimestamp(note.timestamp)} </p> </div> ))} </div> <div> <Label htmlFor="newDealNote">Add a Note</Label> <Textarea id="newDealNote" name="newDealNote" rows="3" value={newNote} onChange={handleNoteChange} placeholder="Type your note here..." /> <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={handleAddNoteClick} disabled={!newNote.trim() || !canManage} title={!canManage ? "Admin or Owner role required" : ""}> Add Note </Button> </div> </div> )}

            </div>
            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                 {isEditing ? ( <> <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancel</Button> <Button type="button" onClick={handleSaveChanges}>Save Changes</Button> </> ) : ( <Button type="button" variant="secondary" onClick={onClose}>Close</Button> )}
            </div>
        </Modal>
    );
});

// --- Approval Entry Modal Component ---
// Now receives onSave (which will be handleSaveSubmissionApproval from DealDetailModal)
const ApprovalEntryModal = React.memo(({ isOpen, onClose, submission, dealId, onSave }) => {
    const [approvalData, setApprovalData] = useState({
        approval_date: '', approval_amount: '', approval_term: '', approval_rate: '', stipulations: '', approval_link: ''
    });

    React.useEffect(() => {
        if (isOpen) {
            setApprovalData({ approval_date: '', approval_amount: '', approval_term: '', approval_rate: '', stipulations: '', approval_link: '' });
        }
    }, [isOpen, submission]);


    if (!isOpen || !submission) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setApprovalData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = {
            approval_date: approvalData.approval_date,
            approval_amount: parseFloat(approvalData.approval_amount) || null,
            approval_term: approvalData.approval_term,
            approval_rate: parseFloat(approvalData.approval_rate) || null,
            stipulations: approvalData.stipulations,
            approval_link: approvalData.approval_link
        };
        // onSaveApproval(dealId, submission.id, dataToSave); // OLD
        onSave(submission.id, dataToSave); // NEW: Calls handleSaveSubmissionApproval
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Enter Approval for ${submission.lender_name}`}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 text-sm">
                     <div className="grid grid-cols-2 gap-4 mb-4">
                        <div><Label className="text-gray-500">Lender</Label><p>{submission.lender_name}</p></div>
                        <div><Label className="text-gray-500">Submission Date</Label><p>{submission.submission_date}</p></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div> <Label htmlFor="approval_date">Approval Date</Label> <Input id="approval_date" name="approval_date" type="date" value={approvalData.approval_date} onChange={handleInputChange} required /> </div>
                        <div> <Label htmlFor="approval_amount">Approval Amount ($)</Label> <Input id="approval_amount" name="approval_amount" type="number" step="0.01" placeholder="e.g., 5000" value={approvalData.approval_amount} onChange={handleInputChange} /> </div>
                        <div> <Label htmlFor="approval_term">Term (e.g., 12 months)</Label> <Input id="approval_term" name="approval_term" type="text" placeholder="e.g., 12 months" value={approvalData.approval_term} onChange={handleInputChange} /> </div>
                        <div> <Label htmlFor="approval_rate">Rate (%)</Label> <Input id="approval_rate" name="approval_rate" type="number" step="0.01" placeholder="e.g., 5.5" value={approvalData.approval_rate} onChange={handleInputChange} /> </div>
                        <div className="md:col-span-2"> <Label htmlFor="approval_link">Approval Link (URL)</Label> <Input id="approval_link" name="approval_link" type="url" placeholder="https://example.com/approval/doc" value={approvalData.approval_link} onChange={handleInputChange} /> </div>
                        <div className="md:col-span-2"> <Label htmlFor="stipulations">Stipulations</Label> <Textarea id="stipulations" name="stipulations" rows="3" value={approvalData.stipulations} onChange={handleInputChange} placeholder="Enter any stipulations..." /> </div>
                     </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Approval</Button>
                </div>
            </form>
        </Modal>
    );
});

// --- Decline Reason Modal Component ---
// Now receives onSave (which will be handleSaveSubmissionDecline from DealDetailModal)
const DeclineReasonModal = React.memo(({ isOpen, onClose, submission, dealId, onSave }) => {
    const [reason, setReason] = useState('');

    React.useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    if (!isOpen || !submission) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!reason.trim()) {
            alert("Please enter a decline reason.");
            return;
        }
        // onSaveDeclineReason(dealId, submission.id, reason); // OLD
        onSave(submission.id, reason); // NEW: Calls handleSaveSubmissionDecline
    };

    return (
         <Modal isOpen={isOpen} onClose={onClose} title={`Decline Reason for ${submission.lender_name}`}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 text-sm">
                     <div>
                        <Label htmlFor="decline_reason">Reason for Decline</Label>
                        <Textarea
                            id="decline_reason"
                            name="decline_reason"
                            rows="4"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Enter the reason provided by the lender..."
                            required
                        />
                     </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Decline Reason</Button>
                </div>
            </form>
        </Modal>
    );
});

// Tasks Page Component
const TasksPage = ({ userRole, setAppTasks /* tasks prop removed, setAppTasks added */ }) => {
    const [tasksState, setTasksState] = useState([]); // Local state for tasks
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [formData, setFormData] = useState({ title: '', dueDate: '', assignedTo: 'You', status: 'Pending', relatedTo: '', notes: [] });
    const [newTaskNote, setNewTaskNote] = useState('');
    const canManage = userRole === 'Admin' || userRole === 'Owner';
    const [taskSearchTerm, setTaskSearchTerm] = useState('');

    // --- API Call for Tasks ---
    const fetchTasksApi = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/tasks');
            setTasksState(data);
            if (setAppTasks) setAppTasks(data); // Update app-level tasks for Dashboard
        } catch (err) {
            setError(err.message);
            console.error("Failed to fetch tasks:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasksApi();
    }, [fetchTasksApi]);

    const addTaskApi = useCallback(async (taskData) => {
        setIsLoading(true); // Or a more specific loading state like isAddingTask
        setError(null);
        try {
            const newTask = await fetchApi('/tasks', {
                method: 'POST',
                body: JSON.stringify(taskData),
            });
            setTasksState(prevTasks => {
                const newTasks = [...prevTasks, newTask];
                if (setAppTasks) setAppTasks(newTasks);
                return newTasks;
            });
            return newTask;
        } catch (err) {
            setError(err.message);
            console.error("Failed to add task:", err);
            return null;
        } finally {
            setIsLoading(false); // Reset specific loading state
        }
    }, []); // Removed setTasksState from deps, as it's a local setter

    const updateTaskApi = useCallback(async (taskId, taskData) => {
        setIsLoading(true); // Or a more specific loading state
        setError(null);
        try {
            const updatedTask = await fetchApi(`/tasks/${taskId}`, {
                method: 'PUT',
                body: JSON.stringify(taskData),
            });
            setTasksState(prevTasks => {
                const newTasks = prevTasks.map(task => task.id === taskId ? updatedTask : task);
                if (setAppTasks) setAppTasks(newTasks);
                return newTasks;
            });
            return updatedTask;
        } catch (err) {
            setError(err.message);
            console.error(`Failed to update task ${taskId}:`, err);
            return null;
        } finally {
            setIsLoading(false); // Reset specific loading state
        }
    }, []); // Removed setTasksState from deps

    const deleteTaskApi = useCallback(async (taskId) => {
        setIsLoading(true); // Or a specific state
        setError(null);
        try {
            await fetchApi(`/tasks/${taskId}`, { method: 'DELETE' });
            setTasksState(prevTasks => {
                const newTasks = prevTasks.filter(task => task.id !== taskId);
                if (setAppTasks) setAppTasks(newTasks);
                return newTasks;
            });
            return true; // Indicate success
        } catch (err) {
            setError(err.message);
            console.error(`Failed to delete task ${taskId}:`, err);
            return false; // Indicate failure
        } finally {
            setIsLoading(false); // Reset specific state
        }
    }, []); // Removed setTasksState

    const addTaskNoteApi = useCallback(async (taskId, noteContent) => {
        // Consider specific loading/error state for notes
        setError(null);
        try {
            const newNote = await fetchApi(`/tasks/${taskId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ content: noteContent, author: 'You' }), // Assuming author for now
            });
            // Assuming the API returns the new note object.
            // The task in tasksState needs to be updated with this new note.
            setTasksState(prevTasks => {
                const newTasks = prevTasks.map(task => {
                    if (task.id === taskId) {
                        const updatedTaskWithNote = { ...task, notes: [...(task.notes || []), newNote] };
                        return updatedTaskWithNote;
                    }
                    return task;
                });
                if (setAppTasks) setAppTasks(newTasks);
                return newTasks;
            });
            return newNote; // Return the new note, or the updated task
        } catch (err) {
            setError(err.message); // Or a more specific note error
            console.error(`Failed to add note to task ${taskId}:`, err);
            return null;
        } finally {
            // Reset specific loading state if used
        }
    }, []); // Removed setTasksState

    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const handleTaskNoteChange = (e) => { setNewTaskNote(e.target.value); };

    const handleAddTaskNote = async () => {
        if (!newTaskNote.trim() || !editingTask || !addTaskNoteApi) return;

        const newNoteObject = await addTaskNoteApi(editingTask.id, newTaskNote);

        if (newNoteObject) {
            // tasksState is updated by addTaskNoteApi.
            // Also update formData if the modal is still open and showing notes from it.
            // This assumes newNoteObject is the note object itself.
            // If addTaskNoteApi returns the whole task, adjust accordingly.
            setFormData(prev => ({
                ...prev,
                notes: [...(prev.notes || []), newNoteObject]
            }));
            setNewTaskNote('');
            console.log("Successfully added note to task:", editingTask.id);
        } else {
            // Error is handled by addTaskNoteApi
            console.error("Failed to add note from handleAddTaskNote");
        }
    };


    const openModal = (task = null) => {
        setNewTaskNote('');
        if (task) {
            setEditingTask(task);
            setFormData({ ...task, notes: task.notes || [] });
        } else {
            setEditingTask(null);
            setFormData({ title: '', dueDate: '', assignedTo: 'You', status: 'Pending', relatedTo: '', notes: [] });
        }
        setIsModalOpen(true);
    };
    const closeModal = () => { setIsModalOpen(false); setEditingTask(null); };
    const handleSubmit = (e) => {
        e.preventDefault();
        const updatedTaskData = {
            id: editingTask ? editingTask.id : `t${Date.now()}`,
            title: formData.title, dueDate: formData.dueDate, assignedTo: formData.assignedTo, status: formData.status, relatedTo: formData.relatedTo, notes: formData.notes // formData.notes is temporary
        };
        // TODO: Replace with API calls for addTaskApi / updateTaskApi
        if (editingTask) {
            // Simulating update for now, will be replaced by:
            // const updatedTaskFromApi = await updateTaskApi(editingTask.id, taskPayload);
            // if (updatedTaskFromApi) setTasksState(prev => prev.map(t => t.id === editingTask.id ? updatedTaskFromApi : t));
            setTasksState(prev => prev.map(t => t.id === editingTask.id ? updatedTaskData : t)); // Mock
            console.log("Simulating Update Task:", updatedTaskData);
        } else {
            const newTaskFromApi = await addTaskApi(updatedTaskData);
            if (newTaskFromApi) {
                // tasksState is already updated by addTaskApi
                console.log("Successfully added task:", newTaskFromApi);
            } else {
                // Error is handled by addTaskApi, but could show modal error
                return; // Don't close modal if add failed
            }
        }
        closeModal();
    };
    const handleDelete = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            const success = await deleteTaskApi(taskId);
            if (success) {
                // tasksState is already updated by deleteTaskApi
                console.log("Successfully deleted task:", taskId);
            }
            // If not successful, error is handled by deleteTaskApi
        }
    };

    const handleTitleClick = (task) => {
        if (canManage) {
            openModal(task);
        }
    };

    const filteredTasks = useMemo(() => {
        const lowerCaseSearchTerm = taskSearchTerm.toLowerCase();
        if (!lowerCaseSearchTerm) { return tasksState; } // Use tasksState
        return tasksState.filter(task => task.title.toLowerCase().includes(lowerCaseSearchTerm) );
    }, [tasksState, taskSearchTerm]);

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold">Tasks</h1>
                {error && <div className="text-red-500 text-sm mb-2">Error: {error}</div>}
                 <div className="relative w-full sm:w-64"> <Input type="text" placeholder="Search tasks..." value={taskSearchTerm} onChange={(e) => setTaskSearchTerm(e.target.value)} className="pl-10"/> <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> <SearchIcon className="text-gray-400" /> </div> </div>
                <Button onClick={() => openModal()} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""} className="w-full sm:w-auto"> <PlusIcon className="mr-2" /> Add Task </Button>
            </div>
            <Card>
                <CardContent>
                    <Table>
                        <TableHeader> <TableRow> <TableHead>Title</TableHead> <TableHead>Due Date</TableHead> <TableHead>Assigned To</TableHead> <TableHead>Status</TableHead> <TableHead>Related To</TableHead> <TableHead>Actions</TableHead> </TableRow> </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan="6" className="text-center text-gray-500 py-4">Loading tasks...</TableCell></TableRow>}
                            {!isLoading && !error && filteredTasks.length > 0 ? (
                                filteredTasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell className="font-medium"> <button onClick={() => handleTitleClick(task)} className={`text-blue-600 hover:underline disabled:text-gray-500 disabled:no-underline disabled:cursor-not-allowed`} disabled={!canManage} title={canManage ? "Edit Task" : "Admin or Owner role required"}> {task.title} </button> </TableCell>
                                        <TableCell>{task.dueDate}</TableCell>
                                        <TableCell>{task.assignedTo}</TableCell>
                                        <TableCell> <span className={`px-2 py-0.5 rounded text-xs font-medium ${ task.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : task.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }`}> {task.status} </span> </TableCell>
                                        <TableCell>{task.relatedTo}</TableCell>
                                        <TableCell> <Button variant="ghost" size="sm" className="mr-2" onClick={() => openModal(task)} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <EditIcon /> </Button> <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(task.id)} disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}> <TrashIcon /> </Button> </TableCell>
                                    </TableRow>
                                ))
                             ) : (
                                !isLoading && !error && <TableRow> <TableCell colSpan="6" className="text-center text-gray-500 py-4"> No tasks found{taskSearchTerm ? ' matching your search' : ''}. </TableCell> </TableRow>
                             )}
                            {!isLoading && error && <TableRow><TableCell colSpan="6" className="text-center text-red-500 py-4">Failed to load tasks: {error}</TableCell></TableRow>}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTask ? "Edit Task" : "Add New Task"}>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4"> <div> <Label htmlFor="title">Title</Label> <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required /> </div> <div> <Label htmlFor="dueDate">Due Date</Label> <Input id="dueDate" name="dueDate" type="date" value={formData.dueDate} onChange={handleInputChange} /> </div> <div> <Label htmlFor="assignedTo">Assigned To</Label> <Input id="assignedTo" name="assignedTo" value={formData.assignedTo} onChange={handleInputChange} /> </div> <div> <Label htmlFor="status">Status</Label> <Select id="status" name="status" value={formData.status} onChange={handleInputChange}> <option>Pending</option> <option>In Progress</option> <option>Completed</option> </Select> </div> <div> <Label htmlFor="relatedTo">Related To (e.g., Deal ID, Contact ID)</Label> <Input id="relatedTo" name="relatedTo" value={formData.relatedTo} onChange={handleInputChange} /> </div> </div>
                     {editingTask && ( <div className="mt-6 pt-4 border-t"> <h3 className="text-lg font-medium mb-3">Notes</h3> <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1"> {(formData.notes || []).length === 0 && <p className="text-sm text-gray-500">No notes yet.</p>} {(formData.notes || []).slice().reverse().map(note => ( <div key={note.id} className="text-sm p-2 border rounded-md bg-gray-50"> <p className="whitespace-pre-wrap">{note.content}</p> <p className="text-xs text-gray-500 mt-1"> {note.author} - {formatTimestamp(note.timestamp)} </p> </div> ))} </div> <div> <Label htmlFor="newTaskNote">Add a Note</Label> <Textarea id="newTaskNote" name="newTaskNote" rows="3" value={newTaskNote} onChange={handleTaskNoteChange} placeholder="Type your note here..." /> <Button type="button" variant="secondary" size="sm" className="mt-2" onClick={handleAddTaskNote} disabled={!newTaskNote.trim() || !canManage} title={!canManage ? "Admin or Owner role required" : ""}> Add Note </Button> </div> </div> )}
                    <div className="mt-6 flex justify-end space-x-3 border-t pt-4"> <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button> <Button type="submit" disabled={!canManage} title={!canManage ? "Admin or Owner role required" : ""}>{editingTask ? "Update Task" : "Add Task"}</Button> </div>
                </form>
            </Modal>
        </div>
    );
};


// --- Main App Structure ---

// Sidebar Component
const Sidebar = ({ currentPage, navigate, currentUser, onRoleChange, onLogout }) => { // Added onLogout prop
    const navItems = [
        { name: 'Dashboard', icon: HomeIcon, page: 'dashboard' },
        { name: 'Contacts', icon: UsersIcon, page: 'contacts' },
        { name: 'Deals', icon: DollarSignIcon, page: 'deals' },
        { name: 'Tasks', icon: CheckSquareIcon, page: 'tasks' },
    ];
    return ( <div className="w-64 h-screen bg-gray-800 text-white flex flex-col fixed"> <div className="p-4 text-xl font-bold border-b border-gray-700">MVP CRM</div> <nav className="flex-1 p-4 space-y-2"> {navItems.map((item) => ( <button key={item.page} onClick={() => navigate(item.page)} className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium ${ currentPage === item.page ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white' }`}> <item.icon className="mr-3 h-5 w-5" /> {item.name} </button> ))} </nav> <div className="p-4 border-t border-gray-700 space-y-3"> <div className="text-sm text-gray-300 truncate" title={currentUser.name}> Logged in as: <span className="font-medium">{currentUser?.name || 'N/A'}</span> </div> <div className="flex items-center space-x-2"> <UserCogIcon className="h-5 w-5 text-gray-400 flex-shrink-0" /> <select value={currentUser?.role || ''} onChange={(e) => onRoleChange(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none text-ellipsis overflow-hidden whitespace-nowrap" title="Simulate User Role" disabled={!currentUser}> {USER_ROLES.map(role => ( <option key={role} value={role}>{role}</option> ))} </select> </div> <button onClick={onLogout} className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"> <LogOutIcon className="mr-3 h-5 w-5" /> Logout </button> </div> </div> );
};

// Main Layout Component
const DashboardLayout = ({ currentPage, navigate, currentUser, onRoleChange, onLogout, children }) => { // Added onLogout
    return ( <div className="flex"> <Sidebar currentPage={currentPage} navigate={navigate} currentUser={currentUser} onRoleChange={onRoleChange} onLogout={onLogout} /> <main className="flex-1 ml-64 bg-gray-50 min-h-screen"> {React.Children.map(children, child => { if (React.isValidElement(child)) { return React.cloneElement(child, { userRole: currentUser.role }); } return child; })} </main> </div> );
};

// Login Screen
const LoginScreen = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const data = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                // Assuming login response includes basic user info or a separate call to /users/me would be made
                onLoginSuccess(data.user || { name: email, role: 'Rep' }); // Pass user data to App
            } else {
                setError('Login failed: No token received.');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
            console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>CRM Login</CardTitle>
                    <CardDescription>Enter credentials to access the MVP.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLoginSubmit}>
                    <CardContent className="space-y-4">
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="user@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isLoading} />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

// App Component (Main Router)
function App() {
  const [currentPage, setCurrentPage] = useState('login'); // Default to login
  const [currentUser, setCurrentUser] = useState(null); // No user initially
  const [appLoading, setAppLoading] = useState(true); // For initial token check

  const [contacts, setContacts] = useState(initialContacts); // Keep for now, might be fetched per user
  const [deals, setDeals] = useState(initialDeals); // Keep for now
  const [tasks, setTasks] = useState([]); // For dashboard, might need to be fetched after login

  useEffect(() => {
    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                // Optional: Validate token by fetching user data
                // For now, assume token means logged in and set a mock user or decode token for basic info
                // const userData = await fetchApi('/users/me'); // Example
                // setCurrentUser(userData);
                // For this example, we'll just use a placeholder if token exists.
                // A real app would decode the token or fetch user details.
                setCurrentUser({ name: 'User (from token)', role: 'Rep' }); // Placeholder
                setCurrentPage('dashboard');
            } catch (error) {
                console.error("Token validation/user fetch failed", error);
                localStorage.removeItem('authToken'); // Clear invalid token
                setCurrentUser(null);
                setCurrentPage('login');
            }
        } else {
            setCurrentPage('login');
        }
        setAppLoading(false);
    };
    checkAuthStatus();
  }, []);


  const onLoginSuccess = useCallback((userData) => {
      setCurrentUser(userData);
      setCurrentPage('dashboard');
      // Potentially fetch initial data for dashboard here if needed (e.g. tasks for current user)
  }, []);

  const handleLogout = useCallback(() => {
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setCurrentPage('login');
      // Clear other app state if necessary (contacts, deals, tasks)
      setContacts(initialContacts); // Reset to initial or empty
      setDeals(initialDeals);
      setTasks([]);
      console.log("User logged out.");
  }, []);

  const navigate = useCallback((page) => {
      if (page === 'login' && currentUser) { // Prevent navigating to login if already logged in
          handleLogout(); // Or just ignore
          return;
      }
      setCurrentPage(page);
  }, [currentUser, handleLogout]);


  const handleRoleChange = useCallback((newRole) => {
      // This is now less relevant as role should come from backend/token
      // But can be kept for simulation if needed, or if admin can change roles
      if (currentUser) {
        setCurrentUser(prev => ({ ...prev, role: newRole }));
        console.log(`Simulating role change to: ${newRole}`);
      }
  }, [currentUser]);

  if (appLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading application...</p></div>;
  }

  if (!currentUser || currentPage === 'login') {
    return <LoginScreen onLoginSuccess={onLoginSuccess} />;
  }

  return (
    <DashboardLayout
        currentPage={currentPage}
        navigate={navigate}
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout} >
        {currentPage === 'dashboard' && <DashboardPage contacts={contacts} deals={deals} tasks={tasks} />}
        {currentPage === 'contacts' && <ContactsPage userRole={currentUser.role} contacts={contacts} setContacts={setAppContacts} allDealsFlat={allDealsFlat} />}
        {currentPage === 'deals' && (
            <DealsPage
                userRole={currentUser.role}
                deals={deals}
                setDeals={setAppDeals}
                availableContacts={contacts}
            />
        )}
        {currentPage === 'tasks' && <TasksPage userRole={currentUser.role} setAppTasks={setTasks} /* tasks prop removed */ />}
    </DashboardLayout>
  );
}

export default App;
